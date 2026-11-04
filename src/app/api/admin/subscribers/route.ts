import { getSupabaseAdmin } from '@/lib/supabase'
import { getAdminSession } from '@/lib/auth'

export async function GET() {
  const session = await getAdminSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getSupabaseAdmin()

  const [{ data: subs }, { data: bookings }] = await Promise.all([
    db.from('email_subscribers').select('*').is('unsubscribed_at', null).order('subscribed_at', { ascending: false }),
    db.from('bookings').select('email, total_price, created_at, status').order('created_at', { ascending: false }),
  ])

  // Build booking stats per email
  const stats: Record<string, { count: number; total_spent: number; last_booking: string; statuses: string[] }> = {}
  for (const b of (bookings ?? [])) {
    const e = (b.email as string).toLowerCase()
    if (!stats[e]) stats[e] = { count: 0, total_spent: 0, last_booking: b.created_at, statuses: [] }
    stats[e].count++
    if (b.status === 'completed' || b.status === 'confirmed') stats[e].total_spent += Number(b.total_price)
    if (!stats[e].statuses.includes(b.status)) stats[e].statuses.push(b.status)
  }

  // Also find booking emails not in subscribers list (booked but never subscribed separately)
  const subscribedEmails = new Set((subs ?? []).map(s => (s.email as string).toLowerCase()))
  const bookingOnlyEmails = new Set<string>()
  for (const b of (bookings ?? [])) {
    const e = (b.email as string).toLowerCase()
    if (!subscribedEmails.has(e)) bookingOnlyEmails.add(e)
  }

  // Enrich subscribers with booking stats
  const enriched = (subs ?? []).map(s => ({
    ...s,
    booking_count: stats[s.email.toLowerCase()]?.count ?? 0,
    total_spent: stats[s.email.toLowerCase()]?.total_spent ?? 0,
    last_booking: stats[s.email.toLowerCase()]?.last_booking ?? null,
    is_customer: (stats[s.email.toLowerCase()]?.count ?? 0) > 0,
  }))

  // Build booking-only customer records (not in subscribers table)
  const customerOnly = [...bookingOnlyEmails].map(email => {
    const s = stats[email]
    // Find name from bookings
    const booking = (bookings ?? []).find(b => b.email.toLowerCase() === email)
    return {
      id: `customer_${email}`,
      email,
      name: (booking as { name?: string })?.name ?? null,
      source: 'booking_only',
      subscribed_at: s.last_booking,
      booking_count: s.count,
      total_spent: s.total_spent,
      last_booking: s.last_booking,
      is_customer: true,
      subscriber_only: false,
    }
  })

  return Response.json({ subscribers: enriched, customers: customerOnly })
}

export async function POST(req: Request) {
  const session = await getAdminSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const db = getSupabaseAdmin()
  const { data, error } = await db.from('email_subscribers').upsert(
    { email: body.email.toLowerCase(), name: body.name || null, source: 'manual' },
    { onConflict: 'email', ignoreDuplicates: false }
  ).select().single()
  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json(data)
}

export async function DELETE(req: Request) {
  const session = await getAdminSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  const db = getSupabaseAdmin()
  await db.from('email_subscribers').update({ unsubscribed_at: new Date().toISOString() }).eq('id', id)
  return Response.json({ success: true })
}
