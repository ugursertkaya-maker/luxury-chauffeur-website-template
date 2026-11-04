import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const pi = searchParams.get('pi')
  if (!pi) return Response.json({ error: 'Missing payment intent' }, { status: 400 })

  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('bookings')
    .select('booking_number, service_type')
    .eq('stripe_payment_intent_id', pi)
    .single()

  if (error || !data) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(data)
}
