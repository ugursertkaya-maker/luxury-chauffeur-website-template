import Link from 'next/link'
import type { Metadata } from 'next'
import { getSupabaseAdmin } from '@/lib/supabase'
import JsonLd from '@/components/seo/JsonLd'
import BreadcrumbNav from '@/components/seo/BreadcrumbNav'
import { localBusinessSchema, breadcrumbSchema } from '@/lib/seo/jsonld'
import { brand } from '@/config/brand'

export const revalidate = 3600

export const metadata: Metadata = {
  title: `Service Areas — ${brand.service.areaServed} | ${brand.company.displayName}`,
  description: `${brand.company.displayName} serves 50+ cities across ${brand.service.areaServed}. Find luxury car service in your city — airport transfers, corporate, weddings.`,
  alternates: { canonical: `${brand.site.url}/locations` },
}

const crumbs = [{ name: 'Home', url: '/' }, { name: 'Service Areas', url: '/locations' }]

// Geographic centre of your service area — used only to order the city list.
// TODO: set these to your own coordinates.
const CENTER_LAT = 42.3601
const CENTER_LNG = -71.0589

function distToCenter(lat?: number | null, lng?: number | null) {
  if (!lat || !lng) return 9999
  const dlat = lat - CENTER_LAT
  const dlng = lng - CENTER_LNG
  return Math.sqrt(dlat * dlat + dlng * dlng)
}

export default async function LocationsIndexPage() {
  const db = getSupabaseAdmin()
  const { data: locations } = await db
    .from('seo_locations')
    .select('slug, name, state, county, lat, lng')
    .eq('is_published', true)
    .order('name')

  const byCounty: Record<string, typeof locations> = {}
  for (const loc of locations ?? []) {
    const key = loc.county ?? 'Other'
    if (!byCounty[key]) byCounty[key] = []
    byCounty[key]!.push(loc)
  }

  // Sort cities within each county by distance to the service-area centre
  for (const key of Object.keys(byCounty)) {
    byCounty[key]!.sort((a, b) => distToCenter(a.lat, a.lng) - distToCenter(b.lat, b.lng))
  }

  // County priority: user-specified first 5, then rest by average distance to centre
  const FIXED = ['Suffolk County', 'Middlesex County', 'Norfolk County', 'Essex County', 'Plymouth County']
  const rest = Object.keys(byCounty)
    .filter(k => !FIXED.includes(k))
    .sort((a, b) => {
      const avgDist = (county: string) => {
        const locs = byCounty[county] ?? []
        const withCoords = locs.filter(l => l.lat && l.lng)
        if (!withCoords.length) return 9999
        return withCoords.reduce((s, l) => s + distToCenter(l.lat, l.lng), 0) / withCoords.length
      }
      return avgDist(a) - avgDist(b)
    })
  const sorted = [...FIXED.filter(k => byCounty[k]), ...rest]

  return (
    <>
      <JsonLd data={localBusinessSchema()} />
      <JsonLd data={breadcrumbSchema(crumbs)} />

      <div className="min-h-screen bg-[#0e0e0e]">
        <div className="bg-gradient-to-b from-[#0a0a0a] via-[#0e0e0e] to-[#080808] px-6 py-20 text-center">
          <div className="max-w-3xl mx-auto">
            <p className="text-[#8fa4b4] text-xs font-bold tracking-widest uppercase mb-4">Service Areas</p>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">{brand.service.areaServed} Service Areas</h1>
            <p className="text-white text-lg">Luxury car service across {locations?.length ?? 0} cities throughout {brand.service.areaServed}.</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-10">
          <BreadcrumbNav crumbs={crumbs} />

          {sorted.map(county => (
            <div key={county} className="mb-10">
              <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-4 pb-2 border-b border-[#D4A017]/15">{county}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {byCounty[county]?.map(loc => (
                  <Link key={loc.slug} href={`/locations/${loc.slug}`}
                    className="bg-[#0e0e0e] border border-[#D4A017]/15 rounded-xl px-4 py-3 text-sm font-medium text-white hover:bg-white/10 hover:text-white hover:border-[#D4A017]/30 transition-all text-center">
                    {loc.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}

          <div className="text-center mt-8 py-10 border-t border-[#D4A017]/15">
            <Link href="/book" className="bg-[#141414] text-white font-bold px-8 py-4 rounded-xl hover:bg-[#1e262d] transition-colors">
              Book Your Ride →
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
