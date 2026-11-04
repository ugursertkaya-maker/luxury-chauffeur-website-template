import { getSupabaseAdmin } from '@/lib/supabase'
import { getCustomerSession } from '@/lib/customer-auth'

export async function GET() {
  const session = await getCustomerSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseAdmin()
  const { data: customer } = await db.from('customers')
    .select('id, email, name, phone, referral_code, referral_credit, created_at')
    .eq('id', session.id)
    .single()

  if (!customer) return Response.json({ error: 'Not found' }, { status: 404 })

  const { data: bookings } = await db.from('bookings')
    .select('id, booking_number, service_type, pickup_date, pickup_time, pickup_location, dropoff_location, total_price, status, payment_status, vehicle_id')
    .eq('customer_id', session.id)
    .order('pickup_date', { ascending: false })

  return Response.json({ customer, bookings: bookings ?? [] })
}
