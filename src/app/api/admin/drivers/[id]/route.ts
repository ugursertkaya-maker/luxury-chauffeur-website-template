import { getSupabaseAdmin } from '@/lib/supabase'
import { getAdminSession } from '@/lib/auth'

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!await getAdminSession()) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await context.params
  const body = await request.json()
  const db = getSupabaseAdmin()
  const { data, error } = await db.from('drivers').update(body).eq('id', id).select('*, vehicles(name, type)').single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  if (!await getAdminSession()) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await context.params
  const db = getSupabaseAdmin()
  const { error } = await db.from('drivers').delete().eq('id', id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
