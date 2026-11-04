import { getSupabaseAdmin } from '@/lib/supabase'
import { stripe } from '@/lib/stripe'
import { sendCancellationEmail, sendModificationReceived } from '@/lib/email'
import { logAction } from '@/lib/audit'
import { getCancellationRefund } from '@/lib/cancellation'

const attempts = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = attempts.get(ip)
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (entry.count >= 10) return false
  entry.count++
  return true
}

function getIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
}

export async function GET(request: Request) {
  if (!checkRateLimit(getIp(request))) {
    return Response.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 })
  }

  const { searchParams } = new URL(request.url)
  const booking_number = searchParams.get('booking')
  const email = searchParams.get('email')

  if (!booking_number || !email) return Response.json({ error: 'Missing fields' }, { status: 400 })

  const db = getSupabaseAdmin()
  const { data: verify } = await db
    .from('bookings')
    .select('email, status')
    .eq('booking_number', booking_number.toUpperCase())
    .eq('email', email.toLowerCase())
    .single()

  if (!verify) return Response.json({ error: 'Booking not found' }, { status: 404 })
  if (!['pending', 'confirmed', 'modification_requested'].includes(verify.status)) {
    return Response.json({ error: 'No active booking found with this number.' }, { status: 404 })
  }

  const { data, error } = await db
    .from('bookings')
    .select('id, booking_number, name, email, service_type, pickup_location, dropoff_location, pickup_date, pickup_time, hours, passengers, total_price, status, payment_status, created_at, flight_number, notes, pending_changes, driver_status, drivers(name, phone, vehicles(make, model, plate))')
    .eq('email', email.toLowerCase())
    .order('created_at', { ascending: false })

  if (error || !data) return Response.json({ error: 'Booking not found' }, { status: 404 })
  return Response.json(data)
}

export async function POST(request: Request) {
  if (!checkRateLimit(getIp(request))) {
    return Response.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 })
  }
  const body = await request.json()
  const { booking_number, email, action, changes } = body

  if (!booking_number || !email || !action) return Response.json({ error: 'Missing fields' }, { status: 400 })

  const db = getSupabaseAdmin()
  const { data: booking } = await db
    .from('bookings')
    .select('id, status, name, email, booking_number, pickup_date, pickup_time, total_price, stripe_payment_intent_id, stripe_payment_method_id, stripe_customer_id')
    .eq('booking_number', booking_number.toUpperCase())
    .eq('email', email.toLowerCase())
    .single()

  if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 })
  if (booking.status === 'cancelled') return Response.json({ error: 'Booking is already cancelled' }, { status: 400 })

  if (action === 'cancel') {
    const refund = getCancellationRefund(booking.pickup_date, booking.pickup_time, Number(booking.total_price))

    await db.from('bookings').update({ status: 'cancelled' }).eq('id', booking.id)

    if (refund.refundAmount > 0 && booking.stripe_payment_intent_id) {
      try {
        await stripe.refunds.create({
          payment_intent: booking.stripe_payment_intent_id,
          amount: Math.round(refund.refundAmount * 100),
        })
      } catch (e) { console.error('Refund failed:', e) }
    }

    logAction('booking_cancelled', booking.name ?? 'customer', booking.booking_number, {
      by: 'customer', refund_percent: refund.refundPercent, refund_amount: refund.refundAmount,
    })

    sendCancellationEmail({
      email: booking.email, name: booking.name, booking_number: booking.booking_number,
      pickup_date: booking.pickup_date, pickup_time: booking.pickup_time,
      total_price: booking.total_price,
      refunded: refund.refundAmount > 0,
      refund_amount: refund.refundAmount,
    }).catch(console.error)

    return Response.json({
      success: true,
      message: refund.refundAmount > 0
        ? `Booking cancelled. $${refund.refundAmount.toFixed(2)} will be refunded to your card (5–10 business days).`
        : 'Booking cancelled. No refund applies based on our cancellation policy.',
    })
  }

  if (action === 'modify') {
    const allowed = ['pickup_date', 'pickup_time', 'pickup_location', 'dropoff_location', 'flight_number', 'notes', 'passengers']
    const pending: Record<string, unknown> = {}
    for (const key of allowed) {
      if (changes[key] !== undefined && changes[key] !== '') pending[key] = changes[key]
    }
    if (Object.keys(pending).length === 0) return Response.json({ error: 'No changes to submit' }, { status: 400 })

    const newPrice: number | undefined = changes.new_price
    const oldPrice: number = booking.total_price
    const priceDiff = newPrice !== undefined ? Math.round((newPrice - oldPrice) * 100) / 100 : 0

    if (newPrice !== undefined && priceDiff > 0) {
      const hasSavedCard = !!(booking.stripe_customer_id && booking.stripe_payment_method_id)

      if (hasSavedCard) {
        const pi = await stripe.paymentIntents.create({
          amount: Math.round(priceDiff * 100),
          currency: 'usd',
          capture_method: 'manual',
          customer: booking.stripe_customer_id,
          payment_method: booking.stripe_payment_method_id,
          confirm: true,
          off_session: true,
          receipt_email: booking.email,
          metadata: { booking_id: booking.id, booking_number: booking_number, type: 'modification_charge' },
        })
        pending.new_price = newPrice
        pending.price_diff = priceDiff
        pending.extra_payment_intent_id = pi.id
        await db.from('bookings').update({ status: 'modification_requested', pending_changes: pending }).eq('id', booking.id)
        sendModificationReceived({ email: booking.email, name: booking.name, booking_number: booking.booking_number }).catch(console.error)
        return Response.json({ success: true, savedCard: true, amount: priceDiff, message: `Change request sent. $${priceDiff.toFixed(2)} will be charged from your card on file upon approval.` })
      }

      const pi = await stripe.paymentIntents.create({
        amount: Math.round(priceDiff * 100),
        currency: 'usd',
        capture_method: 'manual',
        receipt_email: booking.email,
        metadata: { booking_id: booking.id, booking_number: booking_number, type: 'modification_charge' },
      })
      pending.new_price = newPrice
      pending.price_diff = priceDiff
      pending.extra_payment_intent_id = pi.id
      await db.from('bookings').update({ status: 'modification_requested', pending_changes: pending }).eq('id', booking.id)
      sendModificationReceived({ email: booking.email, name: booking.name, booking_number: booking.booking_number }).catch(console.error)
      return Response.json({ success: true, requiresPayment: true, clientSecret: pi.client_secret, amount: priceDiff })
    }

    if (newPrice !== undefined) {
      pending.new_price = newPrice
      pending.price_diff = priceDiff
    }

    await db.from('bookings').update({ status: 'modification_requested', pending_changes: pending }).eq('id', booking.id)
    sendModificationReceived({ email: booking.email, name: booking.name, booking_number: booking.booking_number }).catch(console.error)
    return Response.json({ success: true, message: priceDiff < 0 ? `Change request sent. You will receive a $${Math.abs(priceDiff).toFixed(2)} refund after approval.` : 'Change request sent. You will be notified once reviewed.' })
  }

  return Response.json({ error: 'Invalid action' }, { status: 400 })
}
