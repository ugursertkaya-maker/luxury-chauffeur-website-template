import Link from 'next/link'
import type { Metadata } from 'next'
import { getSupabaseAdmin } from '@/lib/supabase'
import JsonLd from '@/components/seo/JsonLd'
import BreadcrumbNav from '@/components/seo/BreadcrumbNav'
import { breadcrumbSchema } from '@/lib/seo/jsonld'
import { brand } from '@/config/brand'

export const revalidate = 3600

export const metadata: Metadata = {
  title: `${brand.service.areaServed} Attractions Transportation | ${brand.company.displayName}`,
  description: `Private car service to ${brand.service.areaServed}'s top attractions — Martha's Vineyard, Freedom Trail, Fenway Park, ${brand.service.areaServed} Aquarium, Museum of Fine Arts, and more.`,
  alternates: { canonical: `${brand.site.url}/attractions` },
}

const crumbs = [{ name: 'Home', url: '/' }, { name: 'Attractions', url: '/attractions' }]

export default async function AttractionsIndexPage() {
  const db = getSupabaseAdmin()
  const { data: attractions } = await db
    .from('seo_attractions')
    .select('slug, name, city, state, category')
    .eq('is_published', true)
    .order('name')

  const byCategory: Record<string, typeof attractions> = {}
  for (const a of attractions ?? []) {
    const key = a.category ?? 'Attractions'
    if (!byCategory[key]) byCategory[key] = []
    byCategory[key]!.push(a)
  }

  return (
    <>
      <JsonLd data={breadcrumbSchema(crumbs)} />

      <div className="min-h-screen bg-[#0e0e0e]">
        <div className="bg-gradient-to-b from-[#0a0a0a] via-[#0e0e0e] to-[#080808] px-6 py-20 text-center">
          <div className="max-w-3xl mx-auto">
            <p className="text-[#8fa4b4] text-xs font-bold tracking-widest uppercase mb-4">Attractions</p>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">{brand.service.areaServed} Attractions Car Service</h1>
            <p className="text-white text-lg">Private transfers to {attractions?.length ?? 15}+ top {brand.service.areaServed} attractions. Arrive in style.</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-10">
          <BreadcrumbNav crumbs={crumbs} />

          {Object.entries(byCategory).sort(([a], [b]) => a.localeCompare(b)).map(([cat, list]) => (
            <div key={cat} className="mb-10">
              <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-4 pb-2 border-b border-[#D4A017]/15">{cat}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {list?.map(a => (
                  <Link key={a.slug} href={`/attractions/${a.slug}`}
                    className="bg-[#0e0e0e] border border-[#D4A017]/10 rounded-2xl p-5 hover:border-[#D4A017]/30 hover:-translate-y-0.5 transition-all group">
                    <h3 className="font-bold text-white text-sm leading-snug group-hover:text-white">{a.name}</h3>
                    <p className="text-xs text-white mt-1">{a.city}, {a.state}</p>
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
