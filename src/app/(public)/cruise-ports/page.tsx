import Link from 'next/link'
import type { Metadata } from 'next'
import { getSupabaseAdmin } from '@/lib/supabase'
import JsonLd from '@/components/seo/JsonLd'
import BreadcrumbNav from '@/components/seo/BreadcrumbNav'
import { Ship } from 'lucide-react'
import { breadcrumbSchema } from '@/lib/seo/jsonld'
import { brand } from '@/config/brand'

export const revalidate = 3600

export const metadata: Metadata = {
  title: `Cruise Port Transfers ${brand.service.areaServed} | ${brand.company.displayName}`,
  description: `Luxury car service to ${brand.service.areaServed} cruise ports — Port of Example City, Portland, ME Cruise Terminal. Professional chauffeurs, flat-rate pricing, flight tracking.`,
  alternates: { canonical: `${brand.site.url}/cruise-ports` },
}

const crumbs = [{ name: 'Home', url: '/' }, { name: 'Cruise Ports', url: '/cruise-ports' }]

export default async function CruisePortsIndexPage() {
  const db = getSupabaseAdmin()
  const { data: ports } = await db
    .from('seo_cruise_ports')
    .select('slug, name, city, state')
    .eq('is_published', true)
    .order('name')

  return (
    <>
      <JsonLd data={breadcrumbSchema(crumbs)} />

      <div className="min-h-screen bg-[#0e0e0e]">
        <div className="bg-gradient-to-b from-[#0a0a0a] via-[#0e0e0e] to-[#080808] px-6 py-20 text-center">
          <div className="max-w-3xl mx-auto">
            <p className="text-[#8fa4b4] text-xs font-bold tracking-widest uppercase mb-4">Cruise Port Transfers</p>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">{brand.service.areaServed} Cruise Port Car Service</h1>
            <p className="text-white text-lg">Never miss your departure. Professional transfers to all {brand.service.areaServed} cruise terminals.</p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 py-10">
          <BreadcrumbNav crumbs={crumbs} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">
            {ports?.map(p => (
              <Link key={p.slug} href={`/cruise-ports/${p.slug}`}
                className="bg-[#0e0e0e] border border-[#D4A017]/10 rounded-2xl p-6 hover:border-[#D4A017]/30 hover:-translate-y-0.5 transition-all group">
                <Ship className="w-6 h-6 text-white mb-3" strokeWidth={1.5} />
                <h2 className="font-bold text-white group-hover:text-white">{p.name}</h2>
                <p className="text-xs text-white mt-1">{p.city}, {p.state}</p>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12 py-10 border-t border-[#D4A017]/15">
            <Link href="/book" className="bg-[#141414] text-white font-bold px-8 py-4 rounded-xl hover:bg-[#1e262d] transition-colors">
              Book Cruise Transfer →
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
