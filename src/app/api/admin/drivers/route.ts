import { getSupabaseAdmin } from '@/lib/supabase'
import { getAdminSession } from '@/lib/auth'

export async function GET() {
  if (!await getAdminSession()) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('drivers')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return Response.json({ error: error.message }, { status: 500 })

  const { data: ratings } = await db
    .from('driver_ratings')
    .select('driver_id, rating')

  const ratingMap: Record<string, { total: number; count: number }> = {}
  for (const r of ratings ?? []) {
    if (!ratingMap[r.driver_id]) ratingMap[r.driver_id] = { total: 0, count: 0 }
    ratingMap[r.driver_id].total += r.rating
    ratingMap[r.driver_id].count++
  }

  const enriched = (data ?? []).map(d => {
    const r = ratingMap[d.id]
    const avgRating = r ? Math.round((r.total / r.count) * 10) / 10 : null
    const score = (avgRating ?? 3) * 20
    return { ...d, avgRating, ratingCount: r?.count ?? 0, acceptRate: null, score }
  }).sort((a, b) => b.score - a.score)

  return Response.json(enriched)
}

export async function POST(request: Request) {
  if (!await getAdminSession()) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const db = getSupabaseAdmin()
  const { data, error } = await db.from('drivers').insert(body).select('*, vehicles(name, type)').single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}
