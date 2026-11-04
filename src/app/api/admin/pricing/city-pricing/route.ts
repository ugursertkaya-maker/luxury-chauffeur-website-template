import { getAdminSession } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const session = await getAdminSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getSupabaseAdmin()
  const { data, error } = await db.from('city_pricing').select('*').order('county').order('city')
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function POST(request: Request) {
  const session = await getAdminSession()
  if (!session || session.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const db = getSupabaseAdmin()

  // Bulk upsert: body can be array or single object
  const rows = Array.isArray(body) ? body : [body]
  const inserts = rows.map(r => ({
    county: r.county, city: r.city,
    sedan_base: r.sedan_base, sedan_per_mile: r.sedan_per_mile,
    suv_base: r.suv_base, suv_per_mile: r.suv_per_mile,
    min_fare: r.min_fare, updated_at: new Date().toISOString(),
  }))

  const { data, error } = await db
    .from('city_pricing')
    .upsert(inserts, { onConflict: 'county,city' })
    .select()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}
