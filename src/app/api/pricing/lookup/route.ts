import { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { CountyRates } from '@/lib/pricing'

type GeoComponent = { long_name: string; types: string[] }

async function geocodeLocation(location: string): Promise<{ city: string; county: string; state: string } | null> {
  const key = process.env.GOOGLE_MAPS_SERVER_KEY
  if (!key) return null
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${key}`
  const res = await fetch(url)
  const data = await res.json() as { results: { address_components: GeoComponent[] }[] }
  const components = data.results?.[0]?.address_components ?? []
  const get = (type: string) => components.find(c => c.types.includes(type))?.long_name ?? ''
  return {
    city: get('locality') || get('sublocality') || get('neighborhood') || get('postal_town'),
    county: get('administrative_area_level_2'),
    state: get('administrative_area_level_1'),
  }
}

function toRates(r: Record<string, unknown>): CountyRates {
  return {
    sedan_base:      Number(r.sedan_base),
    sedan_per_mile:  Number(r.sedan_per_mile),
    suv_base:        Number(r.suv_base),
    suv_per_mile:    Number(r.suv_per_mile),
    min_fare:        Number(r.min_fare),
    sedan_hourly:    r.sedan_hourly != null ? Number(r.sedan_hourly) : null,
    suv_hourly:      r.suv_hourly   != null ? Number(r.suv_hourly)   : null,
    sedan_event:     r.sedan_event  != null ? Number(r.sedan_event)  : null,
    suv_event:       r.suv_event    != null ? Number(r.suv_event)    : null,
  }
}

export async function GET(req: NextRequest) {
  const location = req.nextUrl.searchParams.get('location') ?? ''
  if (!location) return Response.json({ error: 'location required' }, { status: 400 })

  const db = getSupabaseAdmin()

  // Single flat-rate policy: always resolve the __default__ pricing row.
  // To price per region instead, geocode the location (see geocodeLocation above)
  // and look up county_pricing by the resulting county.
  const { data: fallback } = await db.from('county_pricing').select('*').eq('county', '__default__').single()
  if (fallback) {
    return Response.json({
      source: 'default',
      location: { city: '', county: '', state: '' },
      rates: toRates(fallback as Record<string, unknown>),
    })
  }

  return Response.json({ source: 'default', location: null, rates: null })
}
