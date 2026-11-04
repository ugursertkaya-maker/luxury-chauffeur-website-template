import Link from 'next/link'
import type { Metadata } from 'next'
import { getSupabaseAdmin } from '@/lib/supabase'
import JsonLd from '@/components/seo/JsonLd'
import BreadcrumbNav from '@/components/seo/BreadcrumbNav'
import { breadcrumbSchema } from '@/lib/seo/jsonld'
import { brand } from '@/config/brand'

export const revalidate = 3600

export const metadata: Metadata = {
  title: `Hotel Car Service ${brand.service.areaServed} | ${brand.company.displayName}`,
  description: `Luxury car service to and from top ${brand.service.areaServed} hotels. Flat-rate hotel transfers with professional chauffeurs.`,
  alternates: { canonical: `${brand.site.url}/hotels` },
}

const crumbs = [{ name: 'Home', url: '/' }, { name: 'Hotels', url: '/hotels' }]

const STARS: Record<number, string> = { 5: '★★★★★', 4: '★★★★', 3: '★★★' }

export default async function HotelsIndexPage() {
  const db = getSupabaseAdmin()
  const { data: hotels } = await db
    .from('seo_hotels')
    .select('slug, name, city, state, star_rating')
    .eq('is_published', true)
    .order('star_rating', { ascending: false })

  const byCity: Record<string, typeof hotels> = {}
  for (const h of hotels ?? []) {
    const key = h.city
    if (!byCity[key]) byCity[key] = []
    byCity[key]!.push(h)
  }

  return (
    <>
      <JsonLd data={breadcrumbSchema(crumbs)} />

      <div className="min-h-screen bg-[#0e0e0e]">
        <div className="bg-gradient-to-b from-[#0a0a0a] via-[#0e0e0e] to-[#080808] px-6 py-20 text-center">
          <div className="max-w-3xl mx-auto">
            <p className="text-[#8fa4b4] text-xs font-bold tracking-widest uppercase mb-4">Hotel Transfers</p>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">Luxury Hotel Car Service in {brand.service.areaServed}</h1>
            <p className="text-white text-lg">Direct transfers to {hotels?.length ?? 20}+ premier {brand.service.areaServed} hotels. Flat-rate pricing, professional chauffeurs.</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-10">
          <BreadcrumbNav crumbs={crumbs} />

          {Object.entries(byCity).sort(([a], [b]) => a.localeCompare(b)).map(([city, list]) => (
            <div key={city} className="mb-10">
              <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-4 pb-2 border-b border-[#D4A017]/15">{city}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {list?.map(h => (
                  <Link key={h.slug} href={`/hotels/${h.slug}`}
                    className="bg-[#0e0e0e] border border-[#D4A017]/10 rounded-2xl p-5 hover:border-[#D4A017]/30 hover:-translate-y-0.5 transition-all group">
                    <div className="flex items-start justify-between">
                      <h3 className="font-bold text-white text-sm leading-snug group-hover:text-white">{h.name}</h3>
                      {h.star_rating && (
                        <span className="text-white text-xs ml-2 flex-shrink-0">{STARS[h.star_rating] ?? '★★★'}</span>
                      )}
                    </div>
                    <p className="text-xs text-white mt-1">{h.city}, {h.state}</p>
                  </Link>
                ))}
              </div>
            </div>
          ))}

          <div className="text-center mt-8 py-10 border-t border-[#D4A017]/15">
            <Link href="/book" className="bg-[#141414] text-white font-bold px-8 py-4 rounded-xl hover:bg-[#1e262d] transition-colors">
              Book Hotel Transfer →
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
