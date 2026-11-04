import { stripe } from '@/lib/stripe'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  const { bookingId, amount, gratuity = 0 } = await request.json()
  const db = getSupabaseAdmin()

  const { data: booking } = await db
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single()

  if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 })

  let customerId = booking.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: booking.email,
      name: booking.name,
      metadata: { booking_id: bookingId },
    })
    customerId = customer.id
    await db.from('bookings').update({ stripe_customer_id: customerId }).eq('id', bookingId)
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: 'usd',
    customer: customerId,
    setup_future_usage: 'off_session',
    metadata: {
      booking_id: bookingId,
      customer_name: booking.name,
      customer_email: booking.email,
      service_type: booking.service_type,
      pickup_date: booking.pickup_date,
    },
    receipt_email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(booking.email) ? booking.email : undefined,
  })

  await db
    .from('bookings')
    .update({ stripe_payment_intent_id: paymentIntent.id, gratuity_amount: gratuity })
    .eq('id', bookingId)

  return Response.json({ clientSecret: paymentIntent.client_secret })
}
