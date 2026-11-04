import { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getCorporateSession } from '@/lib/corporate-auth'

export async function POST(req: NextRequest) {
  const session = await getCorporateSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { action, booking_id, changes } = body
  const db = getSupabaseAdmin()

  // Verify booking belongs to this corporate account
  const { data: booking } = await db
    .from('bookings')
    .select('id, booking_number, status, corporate_account_id')
    .eq('id', booking_id)
    .eq('corporate_account_id', session.id)
    .single()

  if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 })

  if (action === 'modify') {
    if (['cancelled', 'completed'].includes(booking.status)) {
      return Response.json({ error: 'Cannot modify this booking' }, { status: 400 })
    }
    await db.from('bookings')
      .update({ status: 'modification_requested', pending_changes: changes })
      .eq('id', booking_id)
    return Response.json({ ok: true, message: 'Change request submitted' })
  }

  if (action === 'cancel') {
    if (['cancelled', 'completed'].includes(booking.status)) {
      return Response.json({ error: 'Cannot cancel this booking' }, { status: 400 })
    }
    await db.from('bookings')
      .update({ status: 'cancelled', payment_status: 'corporate_cancelled' })
      .eq('id', booking_id)

    await db.from('audit_logs').insert({
      action: 'booking_cancelled',
      actor: `corporate:${session.company}`,
      booking_number: booking.booking_number,
      details: { source: 'corporate_portal' },
    })

    return Response.json({ ok: true })
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 })
}
