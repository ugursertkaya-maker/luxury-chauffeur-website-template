import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getAdminSession } from '@/lib/auth'

export async function GET(request: Request) {
  if (!await getAdminSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const booking = searchParams.get('booking')
  const db = getSupabaseAdmin()
  let query = db.from('audit_logs').select('*').order('created_at', { ascending: false })
  if (booking) query = query.eq('booking_number', booking)
  else query = query.limit(200)
  const { data } = await query
  return NextResponse.json(data ?? [])
}
