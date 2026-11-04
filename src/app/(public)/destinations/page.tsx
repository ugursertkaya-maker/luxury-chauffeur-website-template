import Link from 'next/link'
import type { Metadata } from 'next'
import { getSupabaseAdmin } from '@/lib/supabase'
import JsonLd from '@/components/seo/JsonLd'
import BreadcrumbNav from '@/components/seo/BreadcrumbNav'
import { breadcrumbSchema } from '@/lib/seo/jsonld'
import { brand } from '@/config/brand'

export const revalidate = 3600

export const metadata: Metadata = {
  title: `${brand.service.areaServed} Destinations Car Service | ${brand.company.displayName}`,
  description: `Luxury car service to ${brand.service.areaServed}'s top destinations — beaches, theme parks, nature reserves, cultural districts. Private transfers from ${brand.address.locality}.`,
  alternates: { canonical: `${brand.site.url}/destinations` },
}

const crumbs = [{ name: 'Home', url: '/' }, { name: 'Destinations', url: '/destinations' }]

export default async function DestinationsIndexPage() {
  const db = getSupabaseAdmin()
  const { data: destinations } = await db
    .from('seo_destinations')
    .select('slug, name, region')
    .eq('is_published', true)
    .order('name')

  const byRegion: Record<string, typeof destinations> = {}
  for (const d of destinations ?? []) {
    const key = d.region ?? `${brand.service.areaServed}`
    if (!byRegion[key]) byRegion[key] = []
    byRegion[key]!.push(d)
  }

  return (
    <>
      <JsonLd data={breadcrumbSchema(crumbs)} />

      <div className="min-h-screen bg-[#0e0e0e]">
        <div className="bg-gradient-to-b from-[#0a0a0a] via-[#0e0e0e] to-[#080808] px-6 py-20 text-center">
          <div className="max-w-3xl mx-auto">
            <p className="text-[#8fa4b4] text-xs font-bold tracking-widest uppercase mb-4">{brand.service.areaServed} Destinations</p>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">{brand.service.areaServed} Destinations Car Service</h1>
            <p className="text-white text-lg">Private transfers to {destinations?.length ?? 20}+ premier {brand.service.areaServed} destinations. Beaches, parks, attractions, and more.</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-10">
          <BreadcrumbNav crumbs={crumbs} />

          {Object.entries(byRegion).sort(([a], [b]) => a.localeCompare(b)).map(([region, list]) => (
            <div key={region} className="mb-10">
              <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-4 pb-2 border-b border-[#D4A017]/15">{region}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {list?.map(d => (
                  <Link key={d.slug} href={`/destinations/${d.slug}`}
                    className="bg-[#0e0e0e] border border-[#D4A017]/15 rounded-xl px-4 py-3 text-sm font-medium text-white hover:bg-white/10 hover:text-white hover:border-[#D4A017]/30 transition-all text-center">
                    {d.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}

          <div className="text-center mt-8 py-10 border-t border-[#D4A017]/15">
            <Link href="/book" className="bg-[#141414] text-white font-bold px-8 py-4 rounded-xl hover:bg-[#1e262d] transition-colors">
              Book Your Transfer →
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
