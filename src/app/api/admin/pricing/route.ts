import { getAdminSession } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const session = await getAdminSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getSupabaseAdmin()
  const { data, error } = await db.from('county_pricing').select('*').order('county')
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function POST(request: Request) {
  const session = await getAdminSession()
  if (!session || session.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const { county, sedan_base, sedan_per_mile, suv_base, suv_per_mile, min_fare,
          sedan_hourly, suv_hourly, sedan_event, suv_event, county_cities } = body
  if (!county) return Response.json({ error: 'county required' }, { status: 400 })
  const db = getSupabaseAdmin()
  const payload: Record<string, unknown> = {
    county, sedan_base, sedan_per_mile, suv_base, suv_per_mile, min_fare,
    updated_at: new Date().toISOString(),
  }
  if (sedan_hourly !== undefined) payload.sedan_hourly = sedan_hourly
  if (suv_hourly   !== undefined) payload.suv_hourly   = suv_hourly
  if (sedan_event  !== undefined) payload.sedan_event  = sedan_event
  if (suv_event    !== undefined) payload.suv_event    = suv_event
  if (county_cities !== undefined) payload.county_cities = county_cities
  const { data, error } = await db
    .from('county_pricing')
    .upsert(payload, { onConflict: 'county' })
    .select().single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function DELETE(request: Request) {
  const session = await getAdminSession()
  if (!session || session.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { county } = await request.json()
  if (!county || county.startsWith('__')) return Response.json({ error: 'Cannot delete default rows' }, { status: 400 })
  const db = getSupabaseAdmin()
  const { error } = await db.from('county_pricing').delete().eq('county', county)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  // Also delete city pricing for this county
  await db.from('city_pricing').delete().eq('county', county)
  return Response.json({ success: true })
}
