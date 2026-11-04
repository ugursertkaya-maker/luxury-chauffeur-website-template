import { getAdminSession } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const session = await getAdminSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getSupabaseAdmin()
  const { data, error } = await db.from('pricing_surcharges').select('*').order('key')
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function POST(request: Request) {
  const session = await getAdminSession()
  if (!session || session.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json() as { key: string; amount: number; label?: string; description?: string }[]
  const db = getSupabaseAdmin()
  const updates = body.map(s => ({
    key: s.key, label: s.label, description: s.description,
    amount: s.amount, updated_at: new Date().toISOString(),
  }))
  const { data, error } = await db
    .from('pricing_surcharges')
    .upsert(updates, { onConflict: 'key' })
    .select()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}
