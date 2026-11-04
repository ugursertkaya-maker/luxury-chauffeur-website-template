import Link from 'next/link'
import type { Metadata } from 'next'
import { getSupabaseAdmin } from '@/lib/supabase'
import JsonLd from '@/components/seo/JsonLd'
import BreadcrumbNav from '@/components/seo/BreadcrumbNav'
import { breadcrumbSchema } from '@/lib/seo/jsonld'
import { brand } from '@/config/brand'

export const revalidate = 3600

export const metadata: Metadata = {
  title: `${brand.service.areaServed} Transportation Routes & Flat Rates | ${brand.company.displayName}`,
  description: `Flat-rate car service on 50+ ${brand.service.areaServed} routes — airport to city, city to theme park, inter-city transfers. View pricing and book online.`,
  alternates: { canonical: `${brand.site.url}/routes` },
}

const crumbs = [{ name: 'Home', url: '/' }, { name: 'Routes', url: '/routes' }]

export default async function RoutesIndexPage() {
  const db = getSupabaseAdmin()
  const { data: routes } = await db
    .from('seo_routes')
    .select('slug, origin_name, destination_name, distance_miles, duration_minutes')
    .eq('is_published', true)
    .order('origin_name')

  const byOrigin: Record<string, typeof routes> = {}
  for (const r of routes ?? []) {
    const key = r.origin_name
    if (!byOrigin[key]) byOrigin[key] = []
    byOrigin[key]!.push(r)
  }

  return (
    <>
      <JsonLd data={breadcrumbSchema(crumbs)} />

      <div className="min-h-screen bg-[#0e0e0e]">
        <div className="bg-gradient-to-b from-[#0a0a0a] via-[#0e0e0e] to-[#080808] px-6 py-20 text-center">
          <div className="max-w-3xl mx-auto">
            <p className="text-[#8fa4b4] text-xs font-bold tracking-widest uppercase mb-4">Flat-Rate Routes</p>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">{brand.service.areaServed} Transportation Routes</h1>
            <p className="text-white text-lg">Transparent flat-rate pricing on {routes?.length ?? 50}+ popular {brand.service.areaServed} routes.</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-10">
          <BreadcrumbNav crumbs={crumbs} />

          {Object.entries(byOrigin).sort(([a], [b]) => a.localeCompare(b)).map(([origin, list]) => (
            <div key={origin} className="mb-10">
              <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-4 pb-2 border-b border-[#D4A017]/15">From {origin}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {list?.map(r => (
                  <Link key={r.slug} href={`/routes/${r.slug}`}
                    className="bg-[#0e0e0e] border border-[#D4A017]/10 rounded-xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all group flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white group-hover:text-white">
                        {r.origin_name} → {r.destination_name}
                      </p>
                      {r.distance_miles && (
                        <p className="text-xs text-white mt-0.5">{r.distance_miles} mi · ~{Math.round((r.duration_minutes ?? 0) / 60 * 10) / 10} hr</p>
                      )}
                    </div>
                    <span className="text-white text-xs font-bold">View →</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}

          <div className="text-center mt-8 py-10 border-t border-[#D4A017]/15">
            <Link href="/book" className="bg-[#141414] text-white font-bold px-8 py-4 rounded-xl hover:bg-[#1e262d] transition-colors">
              Book Your Route →
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
