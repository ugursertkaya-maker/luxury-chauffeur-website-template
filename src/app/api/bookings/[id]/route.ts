import { getSupabaseAdmin } from '@/lib/supabase'
import { stripe } from '@/lib/stripe'
import { sendDriverAssignedEmail, sendModificationApproved, sendCustomEmail } from '@/lib/email'
import { logAction } from '@/lib/audit'
import { getAdminSession } from '@/lib/auth'
import { brand } from '@/config/brand'

async function sendSms(to: string, message: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_PHONE_NUMBER
  if (!sid || !token || !from) return
  await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: to, From: from, Body: message }).toString(),
  })
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const body = await request.json()
  const db = getSupabaseAdmin()
  const session = await getAdminSession()
  const actor = session?.username ?? 'system'

  if (body.action === 'approve_modification') {
    const { data: booking } = await db
      .from('bookings')
      .select('pending_changes, stripe_payment_intent_id, total_price')
      .eq('id', id)
      .single()

    if (!booking?.pending_changes) return Response.json({ error: 'No pending changes' }, { status: 400 })

    const pending = booking.pending_changes as Record<string, unknown>
    const newPrice = pending.new_price as number | undefined
    const priceDiff = pending.price_diff as number | undefined
    const extraPiId = pending.extra_payment_intent_id as string | undefined

    const updateFields: Record<string, unknown> = { status: 'confirmed', pending_changes: null }
    const allowedFields = ['pickup_date', 'pickup_time', 'pickup_location', 'dropoff_location', 'flight_number', 'notes', 'passengers']
    for (const key of allowedFields) {
      if (pending[key] !== undefined) updateFields[key] = pending[key]
    }
    if (newPrice !== undefined) updateFields.total_price = newPrice

    if (priceDiff !== undefined && priceDiff < 0 && booking.stripe_payment_intent_id) {
      try {
        await stripe.refunds.create({
          payment_intent: booking.stripe_payment_intent_id,
          amount: Math.round(Math.abs(priceDiff) * 100),
        })
      } catch (e) { console.error('Refund failed:', e) }
    }

    if (extraPiId) {
      try { await stripe.paymentIntents.capture(extraPiId) }
      catch (e) { console.error('Capture failed:', e) }
    }

    const { data, error } = await db.from('bookings').update(updateFields).eq('id', id).select().single()
    if (error) return Response.json({ error: error.message }, { status: 500 })

    if (data) {
      logAction('modification_approved', actor, data.booking_number, { new_price: data.total_price })
      sendModificationApproved({
        email: data.email, name: data.name, booking_number: data.booking_number,
        pickup_date: data.pickup_date, pickup_time: data.pickup_time,
        pickup_location: data.pickup_location, dropoff_location: data.dropoff_location,
        total_price: data.total_price,
      }).catch(console.error)
    }

    return Response.json(data)
  }

  if (body.action === 'reject_modification') {
    const { data: booking } = await db.from('bookings').select('pending_changes').eq('id', id).single()
    const pending = booking?.pending_changes as Record<string, unknown> | null
    if (pending?.extra_payment_intent_id) {
      try { await stripe.paymentIntents.cancel(pending.extra_payment_intent_id as string) }
      catch (e) { console.error('Cancel PI failed:', e) }
    }
    const { data, error } = await db.from('bookings').update({ status: 'confirmed', pending_changes: null }).eq('id', id).select().single()
    if (error) return Response.json({ error: error.message }, { status: 500 })
    if (data) logAction('modification_rejected', actor, data.booking_number)
    return Response.json(data)
  }

  if (body.action === 'driver_response') {
    const { response } = body
    const { data: booking } = await db.from('bookings').select('driver_id').eq('id', id).single()
    if (!booking?.driver_id) return Response.json({ error: 'No driver assigned' }, { status: 400 })

    await db.from('bookings').update({ driver_accepted: response }).eq('id', id)

    const { data: d } = await db.from('drivers').select('accepted_count, rejected_count').eq('id', booking.driver_id).single()
    if (d) {
      const update = response === 'accepted'
        ? { accepted_count: (d.accepted_count ?? 0) + 1 }
        : { rejected_count: (d.rejected_count ?? 0) + 1 }
      await db.from('drivers').update(update).eq('id', booking.driver_id)
    }

    return Response.json({ success: true })
  }

  if (body.action === 'assign_driver') {
    const { driver_id } = body

    const [{ data: booking }, { data: driver }] = await Promise.all([
      db.from('bookings').select('*').eq('id', id).single(),
      db.from('drivers').select('*, vehicles(name, make, model, plate)').eq('id', driver_id).single(),
    ])

    if (!booking || !driver) return Response.json({ error: 'Not found' }, { status: 404 })

    const { data, error } = await db
      .from('bookings')
      .update({ driver_id, driver_status: 'assigned' })
      .eq('id', id)
      .select()
      .single()
    if (error) return Response.json({ error: error.message }, { status: 500 })

    const total = Number(booking.total_price)
    const commission = Math.round(total * (Number(driver.commission_rate) / 100) * 100) / 100
    const vehicle = driver.vehicles as { name?: string; make?: string; model?: string; plate?: string } | null

    const lines = [
      `${brand.company.displayName} — New Assignment`,
      `Booking: ${booking.booking_number}`,
      `Date: ${booking.pickup_date} at ${booking.pickup_time}`,
      `Pickup: ${booking.pickup_location}`,
      booking.dropoff_location ? `Dropoff: ${booking.dropoff_location}` : null,
      booking.flight_number ? `Flight: ${booking.flight_number}` : null,
      `Passengers: ${booking.passengers}`,
      booking.notes ? `Special Request: ${booking.notes}` : null,
      ``,
      `Customer: ${booking.name}`,
      `Phone: ${booking.phone}`,
      ``,
      `Your Earnings: $${commission.toFixed(2)}`,
      vehicle?.plate ? `Your Vehicle: ${vehicle.make ?? ''} ${vehicle.model ?? ''} · ${vehicle.plate}` : null,
    ].filter(Boolean).join('\n')

    logAction('driver_assigned', actor, booking.booking_number, { driver_name: driver.name, driver_id })
    await sendSms(driver.phone, lines)

    sendDriverAssignedEmail({
      email: booking.email,
      name: booking.name,
      booking_number: booking.booking_number,
      pickup_date: booking.pickup_date,
      pickup_time: booking.pickup_time,
      driver_name: driver.name,
      driver_phone: driver.phone,
      vehicle_make: vehicle?.make,
      vehicle_model: vehicle?.model,
      vehicle_plate: vehicle?.plate,
    }).catch(console.error)

    return Response.json(data)
  }

  if (body.action === 'driver_status') {
    const { status } = body

    const { data: booking } = await db
      .from('bookings')
      .select('*, drivers(name, phone, commission_rate, vehicles(name, make, model, plate))')
      .eq('id', id)
      .single()

    if (!booking) return Response.json({ error: 'Not found' }, { status: 404 })

    await db.from('bookings').update({ driver_status: status }).eq('id', id)

    const first = booking.name?.split(' ')[0] ?? 'there'
    const driver = booking.drivers as { name: string; phone: string; vehicles?: { name?: string; make?: string; model?: string; plate?: string } | null } | null
    const vehicle = driver?.vehicles

    let customerMsg = ''
    if (status === 'on_the_way') {
      customerMsg = [
        `Hi ${first}, your ${brand.company.displayName} chauffeur is on the way!`,
        driver ? `Driver: ${driver.name} · ${driver.phone}` : null,
        vehicle?.plate ? `Vehicle: ${vehicle.make ?? ''} ${vehicle.model ?? ''} · Plate: ${vehicle.plate}` : null,
        `Please be ready at your pickup location.`,
      ].filter(Boolean).join('\n')
    } else if (status === 'arrived') {
      customerMsg = [
        `Hi ${first}, your ${brand.company.displayName} driver has arrived at your pickup location.`,
        driver ? `Driver: ${driver.name} · ${driver.phone}` : null,
      ].filter(Boolean).join('\n')
    } else if (status === 'completed') {
      await db.from('bookings').update({ status: 'completed' }).eq('id', id)
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? brand.site.url
      customerMsg = `Hi ${first}, thank you for choosing ${brand.company.displayName}! We hope you had a wonderful ride.\n\nPlease rate your experience: ${siteUrl}/rate/${id}`
    }

    if (customerMsg && booking.phone) await sendSms(booking.phone, customerMsg)

    return Response.json({ success: true })
  }

  if (body.action === 'save_note') {
    const { data, error } = await db.from('bookings').update({ admin_notes: body.note }).eq('id', id).select().single()
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json(data)
  }

  if (body.action === 'override_price') {
    const { data: booking } = await db.from('bookings').select('booking_number').eq('id', id).single()
    const { data, error } = await db.from('bookings').update({ total_price: body.price }).eq('id', id).select().single()
    if (error) return Response.json({ error: error.message }, { status: 500 })
    logAction('price_override', actor, booking?.booking_number, { new_price: body.price })
    return Response.json(data)
  }

  if (body.action === 'send_sms') {
    const { data: booking } = await db
      .from('bookings')
      .select('*, drivers(phone)')
      .eq('id', id)
      .single()
    if (!booking) return Response.json({ error: 'Not found' }, { status: 404 })
    const driverPhone = (booking.drivers as { phone?: string } | null)?.phone
    const to = body.to === 'driver' ? driverPhone : booking.phone
    if (!to) return Response.json({ error: 'No phone number' }, { status: 400 })
    await sendSms(to, body.message)
    logAction('sms_sent', actor, booking.booking_number, { to: body.to, preview: body.message.slice(0, 40) })
    return Response.json({ success: true })
  }

  if (body.action === 'send_customer_email') {
    const { data: booking } = await db.from('bookings').select('email, name, booking_number').eq('id', id).single()
    if (!booking) return Response.json({ error: 'Not found' }, { status: 404 })
    await sendCustomEmail({ email: booking.email, name: booking.name, subject: body.subject, message: body.message })
    logAction('email_sent', actor, booking.booking_number, { subject: body.subject })
    return Response.json({ success: true })
  }

  const { data, error } = await db.from('bookings').update(body).eq('id', id).select().single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await context.params
  const db = getSupabaseAdmin()

  // Only allow deleting incomplete (unpaid) bookings
  const { data: booking } = await db.from('bookings').select('payment_status').eq('id', id).single()
  if (!booking) return Response.json({ error: 'Not found' }, { status: 404 })
  if (booking.payment_status === 'paid') return Response.json({ error: 'Cannot delete paid booking' }, { status: 400 })

  await db.from('bookings').delete().eq('id', id)
  return Response.json({ success: true })
}
