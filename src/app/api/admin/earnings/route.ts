import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getAdminSession } from '@/lib/auth'
import { logAction } from '@/lib/audit'

export async function GET() {
  const db = getSupabaseAdmin()
  const { data } = await db
    .from('bookings')
    .select('id, booking_number, pickup_date, pickup_time, total_price, earning_paid, earning_paid_at, earning_paid_by, driver_id, drivers(id, name, commission_rate)')
    .eq('status', 'completed')
    .not('driver_id', 'is', null)
    .order('pickup_date', { ascending: false })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const { booking_ids, paid } = await req.json()
  if (!booking_ids?.length) return NextResponse.json({ error: 'No bookings' }, { status: 400 })

  const session = await getAdminSession()
  const actor = session?.username ?? 'admin'

  const db = getSupabaseAdmin()
  const { error } = await db
    .from('bookings')
    .update({
      earning_paid: paid,
      earning_paid_at: paid ? new Date().toISOString() : null,
      earning_paid_by: paid ? actor : null,
    })
    .in('id', booking_ids)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  logAction(paid ? 'earnings_paid' : 'earnings_unpaid', actor, undefined, { booking_count: booking_ids.length })
  return NextResponse.json({ ok: true })
}
