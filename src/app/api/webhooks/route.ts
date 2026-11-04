import { stripe } from '@/lib/stripe'
import { getSupabaseAdmin } from '@/lib/supabase'
import { sendBookingConfirmation } from '@/lib/email'
import { logAction } from '@/lib/audit'
import Stripe from 'stripe'

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return Response.json({ error: 'Webhook signature invalid' }, { status: 400 })
  }

  const db = getSupabaseAdmin()

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent
    const pmId = typeof pi.payment_method === 'string' ? pi.payment_method : pi.payment_method?.id
    const { data: booking } = await db.from('bookings').update({
      payment_status: 'paid',
      status: 'confirmed',
      ...(pmId ? { stripe_payment_method_id: pmId } : {}),
    }).eq('stripe_payment_intent_id', pi.id).select().single()

    if (booking) {
      logAction('payment_received', booking.name ?? 'customer', booking.booking_number, { amount: booking.total_price })
      sendBookingConfirmation(booking).catch(console.error)
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const pi = event.data.object as Stripe.PaymentIntent
    await db.from('bookings').update({ payment_status: 'failed' }).eq('stripe_payment_intent_id', pi.id)
  }

  return Response.json({ received: true })
}
