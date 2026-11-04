import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getAdminSession } from '@/lib/auth'

export async function GET() {
  if (!await getAdminSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getSupabaseAdmin()
  const { data } = await db
    .from('bookings')
    .select('id, booking_number, pickup_date, pickup_time, service_type, pickup_location, dropoff_location, passengers, status, driver_id, drivers(name)')
    .not('status', 'in', '("cancelled")')
    .order('pickup_date', { ascending: true })
  return NextResponse.json(data ?? [])
}
