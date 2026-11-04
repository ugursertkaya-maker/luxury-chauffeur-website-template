import { NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { brand } from '@/config/brand'

/**
 * Optional static county → cities map, used to populate the city picker in
 * /admin/pricing without spending a Google Places call.
 *
 * Left intentionally EMPTY. Either:
 *   a) fill it in with the counties/regions you actually serve, or
 *   b) leave it empty and rely on the Google Places fallback below
 *      (requires GOOGLE_MAPS_SERVER_KEY).
 *
 * Example:
 *   'Example County': ['Example City', 'Riverside', 'Lakeside'],
 */
const STATIC_CITIES: Record<string, string[]> = {}

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const county = req.nextUrl.searchParams.get('county') ?? ''
  const state = req.nextUrl.searchParams.get('state') ?? brand.address.region

  const key = Object.keys(STATIC_CITIES).find(k => k.toLowerCase() === county.toLowerCase())
  if (key) return Response.json({ cities: STATIC_CITIES[key], source: 'static' })

  const partial = Object.keys(STATIC_CITIES).find(k =>
    k.toLowerCase().includes(county.toLowerCase().replace(' county', ''))
  )
  if (partial) return Response.json({ cities: STATIC_CITIES[partial], source: 'static' })

  const apiKey = process.env.GOOGLE_MAPS_SERVER_KEY
  if (!apiKey) return Response.json({ cities: [], source: 'none', error: 'no_api_key' })

  try {
    const q = encodeURIComponent(`cities in ${county}, ${state}`)
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${q}&type=locality&key=${apiKey}`
    const res = await fetch(url)
    const json = await res.json() as { results: { name: string }[] }
    const cities = (json.results ?? []).map((r) => r.name).slice(0, 20)
    return Response.json({ cities, source: 'google' })
  } catch {
    return Response.json({ cities: [], source: 'error' })
  }
}
