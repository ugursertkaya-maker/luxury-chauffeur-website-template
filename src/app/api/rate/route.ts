import { getSupabaseAdmin } from '@/lib/supabase'
import { brand } from '@/config/brand'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  if (!token) return Response.json({ error: 'Missing token' }, { status: 400 })

  const db = getSupabaseAdmin()
  const { data: booking } = await db
    .from('bookings')
    .select('id, booking_number, name, pickup_date, service_type, status, driver_id, drivers(name, vehicles(make, model))')
    .eq('id', token)
    .eq('status', 'completed')
    .single()

  if (!booking) return Response.json({ error: 'Not found' }, { status: 404 })

  const { data: existing } = await db.from('driver_ratings').select('id').eq('booking_id', token).single()
  if (existing) return Response.json({ error: 'Already rated' }, { status: 409 })

  return Response.json(booking)
}

export async function POST(request: Request) {
  const { token, rating, comment } = await request.json()
  if (!token || !rating) return Response.json({ error: 'Missing fields' }, { status: 400 })

  const db = getSupabaseAdmin()
  const { data: booking } = await db
    .from('bookings')
    .select('id, driver_id, name, booking_number')
    .eq('id', token)
    .eq('status', 'completed')
    .single()

  if (!booking || !booking.driver_id) return Response.json({ error: 'Not found' }, { status: 404 })

  const { error } = await db.from('driver_ratings').insert({
    booking_id: token,
    driver_id: booking.driver_id,
    rating,
    comment: comment || null,
  })

  if (error?.code === '23505') return Response.json({ error: 'Already rated' }, { status: 409 })
  if (error) return Response.json({ error: error.message }, { status: 500 })

  const sid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_PHONE_NUMBER
  const adminPhone = process.env.ADMIN_PHONE

  if (sid && authToken && from && adminPhone) {
    const msg = `${brand.company.displayName} — New Rating\nBooking: ${booking.booking_number}\nCustomer: ${booking.name}\nRating: ${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}\n${comment ? `Comment: ${comment}` : ''}`
    await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${sid}:${authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: adminPhone, From: from, Body: msg }).toString(),
    })
  }

  return Response.json({ success: true })
}
