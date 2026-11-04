import { getSupabaseAdmin } from '@/lib/supabase'
import { createHash } from 'crypto'
import { passwordSalt } from '@/lib/env'

function hashDriverPassword(p: string) {
  return createHash('sha256').update(p + passwordSalt('driver')).digest('hex')
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const email = body?.email
  const password = body?.password
  if (!email || !password) return Response.json({ error: 'Email and password required' }, { status: 400 })

  const db = getSupabaseAdmin()
  const { data: driver } = await db
    .from('drivers')
    .select('id, name, phone, email, commission_rate, accepted_count, rejected_count, password, vehicles(name, make, model, plate)')
    .eq('email', email)
    .eq('active', true)
    .single()

  if (!driver) return Response.json({ error: 'Driver not found' }, { status: 404 })
  if (!driver.password) return Response.json({ error: 'No password set. Contact your admin.' }, { status: 403 })

  const isHashed = driver.password.length === 64
  const valid = isHashed
    ? driver.password === hashDriverPassword(password)
    : driver.password === password
  if (!valid) return Response.json({ error: 'Incorrect password' }, { status: 401 })

  if (!isHashed) {
    await db.from('drivers').update({ password: hashDriverPassword(password) }).eq('id', driver.id)
  }

  const today = new Date().toISOString().split('T')[0]

  const [{ data: bookings }, { data: allBookings }, { data: earnings }, { data: ratings }] = await Promise.all([
    db.from('bookings')
      .select('id, booking_number, name, phone, email, service_type, pickup_location, dropoff_location, pickup_date, pickup_time, passengers, flight_number, notes, total_price, status, driver_status, driver_accepted')
      .eq('driver_id', driver.id)
      .gte('pickup_date', today)
      .in('status', ['confirmed', 'completed'])
      .order('pickup_date', { ascending: true }),

    db.from('bookings')
      .select('id, booking_number, pickup_date, pickup_time, service_type, pickup_location, dropoff_location, status, driver_status')
      .eq('driver_id', driver.id)
      .in('status', ['confirmed', 'completed', 'cancelled'])
      .order('pickup_date', { ascending: true }),

    db.from('bookings')
      .select('id, booking_number, pickup_date, total_price, gratuity_amount, earning_paid, earning_paid_at')
      .eq('driver_id', driver.id)
      .eq('status', 'completed')
      .order('pickup_date', { ascending: false }),

    db.from('driver_ratings')
      .select('rating')
      .eq('driver_id', driver.id),
  ])

  const avgRating = ratings?.length
    ? Math.round((ratings.reduce((s, r) => s + r.rating, 0) / ratings.length) * 10) / 10
    : null

  const { password: _pw, ...driverSafe } = driver

  return Response.json({
    driver: driverSafe,
    bookings: bookings ?? [],
    allBookings: allBookings ?? [],
    earnings: earnings ?? [],
    avgRating,
    ratingCount: ratings?.length ?? 0,
  })
}
