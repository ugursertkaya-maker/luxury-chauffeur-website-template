import { getSupabaseAdmin } from '@/lib/supabase'
import { getAdminSession } from '@/lib/auth'

export async function GET() {
  if (!await getAdminSession()) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getSupabaseAdmin()
  const { data, error } = await db.from('vehicles').select('*').order('created_at', { ascending: false })
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function POST(request: Request) {
  if (!await getAdminSession()) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const db = getSupabaseAdmin()
  const { data, error } = await db.from('vehicles').insert(body).select().single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}
