import { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getCorporateSession } from '@/lib/corporate-auth'

export async function GET(req: NextRequest) {
  const session = await getCorporateSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseAdmin()
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') ?? 'bookings'

  if (type === 'account') {
    const { data } = await db
      .from('corporate_accounts')
      .select('id, company_name, contact_name, contact_email, phone, address, payment_terms, discount_rate, corporate_code')
      .eq('id', session.id)
      .single()
    return Response.json({ account: data })
  }

  if (type === 'invoices') {
    const { data } = await db
      .from('invoices')
      .select('*')
      .eq('corporate_account_id', session.id)
      .order('created_at', { ascending: false })
    return Response.json({ invoices: data ?? [] })
  }

  // bookings (default)
  const { data } = await db
    .from('bookings')
    .select('id, booking_number, pickup_date, pickup_time, pickup_location, dropoff_location, name, email, passengers, service_type, vehicle_id, total_price, gratuity_amount, status, payment_status, invoice_status, flight_number, notes, created_at')
    .eq('corporate_account_id', session.id)
    .order('pickup_date', { ascending: false })
  return Response.json({ bookings: data ?? [] })
}
