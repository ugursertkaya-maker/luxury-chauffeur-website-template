import Link from 'next/link'
import type { Metadata } from 'next'
import { getSupabaseAdmin } from '@/lib/supabase'
import JsonLd from '@/components/seo/JsonLd'
import BreadcrumbNav from '@/components/seo/BreadcrumbNav'
import { breadcrumbSchema } from '@/lib/seo/jsonld'
import { brand } from '@/config/brand'

export const revalidate = 3600

export const metadata: Metadata = {
  title: `${brand.service.areaServed} Airport Transfers | ${brand.company.displayName}`,
  description: `Luxury airport transfers at all major ${brand.service.areaServed} airports — BOS, MHT, PVD, BED, ORH. Flight tracking, meet & greet, flat-rate pricing.`,
  alternates: { canonical: `${brand.site.url}/airports` },
}

const crumbs = [{ name: 'Home', url: '/' }, { name: 'Airports', url: '/airports' }]

export default async function AirportsIndexPage() {
  const db = getSupabaseAdmin()
  const { data: raw } = await db
    .from('seo_airports')
    .select('slug, name, iata_code, city, state')
    .eq('is_published', true)

  const PRIORITY = ['BOS', 'PVD', 'MHT', 'BED', 'ORH', 'PWM', 'ACK', 'MVY']
  const airports = (raw ?? []).sort((a, b) => {
    const ai = PRIORITY.indexOf((a.iata_code ?? '').toUpperCase())
    const bi = PRIORITY.indexOf((b.iata_code ?? '').toUpperCase())
    if (ai === -1 && bi === -1) return a.name.localeCompare(b.name)
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })

  return (
    <>
      <JsonLd data={breadcrumbSchema(crumbs)} />

      <div className="min-h-screen bg-[#0e0e0e]">
        <div className="bg-gradient-to-b from-[#0a0a0a] via-[#0e0e0e] to-[#080808] px-6 py-20 text-center">
          <div className="max-w-3xl mx-auto">
            <p className="text-[#8fa4b4] text-xs font-bold tracking-widest uppercase mb-4">Airport Transfers</p>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">{brand.service.areaServed} Airport Car Service</h1>
            <p className="text-white text-lg">Flight tracking included. Flat-rate pricing. Meet & greet available at all terminals.</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-10">
          <BreadcrumbNav crumbs={crumbs} />

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mt-4">
            {airports?.map(a => (
              <Link key={a.slug} href={`/airports/${a.slug}`}
                className="bg-[#0e0e0e] border border-[#D4A017]/10 rounded-2xl p-6 hover:border-[#D4A017]/30 hover:-translate-y-0.5 transition-all group">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl font-black text-white tracking-wider">{a.iata_code}</span>
                  <span className="text-xs bg-[#141414] text-white px-2 py-0.5 rounded-full font-medium">Airport</span>
                </div>
                <p className="font-semibold text-white text-sm leading-snug group-hover:text-white">{a.name}</p>
                <p className="text-xs text-white mt-1">{a.city}, {a.state}</p>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12 py-10 border-t border-[#D4A017]/15">
            <Link href="/book" className="bg-[#141414] text-white font-bold px-8 py-4 rounded-xl hover:bg-[#1e262d] transition-colors">
              Book Airport Transfer →
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
