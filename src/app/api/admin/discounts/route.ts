import { getSupabaseAdmin } from '@/lib/supabase'
import { getAdminSession } from '@/lib/auth'

export async function GET() {
  const session = await getAdminSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getSupabaseAdmin()
  const { data } = await db.from('discount_codes').select('*').order('created_at', { ascending: false })
  return Response.json(data ?? [])
}

export async function POST(req: Request) {
  const session = await getAdminSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const db = getSupabaseAdmin()

  const code = (body.code as string).toUpperCase().trim().replace(/\s+/g, '')
  if (!code || !body.type || !body.value) return Response.json({ error: 'Missing fields' }, { status: 400 })
  if (body.type === 'percentage' && (body.value <= 0 || body.value > 100)) return Response.json({ error: 'Percentage must be 1–100' }, { status: 400 })

  const { data, error } = await db.from('discount_codes').insert({
    code,
    description: body.description || null,
    type: body.type,
    value: body.value,
    min_order_amount: body.min_order_amount || 0,
    max_uses: body.max_uses || null,
    max_uses_per_email: body.max_uses_per_email ?? 1,
    expires_at: body.expires_at || null,
    active: true,
    created_by: session.username,
  }).select().single()

  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json(data)
}
