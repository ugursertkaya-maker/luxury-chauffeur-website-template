import { getSupabaseAdmin } from '@/lib/supabase'
import { getAdminSession } from '@/lib/auth'

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const body = await req.json()
  const db = getSupabaseAdmin()
  const { data, error } = await db.from('discount_codes').update(body).eq('id', id).select().single()
  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json(data)
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const db = getSupabaseAdmin()
  await db.from('discount_codes').delete().eq('id', id)
  return Response.json({ success: true })
}
