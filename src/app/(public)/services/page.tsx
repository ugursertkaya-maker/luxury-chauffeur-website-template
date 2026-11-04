import Link from 'next/link'
import type { Metadata } from 'next'
import { getSupabaseAdmin } from '@/lib/supabase'
import JsonLd from '@/components/seo/JsonLd'
import BreadcrumbNav from '@/components/seo/BreadcrumbNav'
import { localBusinessSchema, breadcrumbSchema } from '@/lib/seo/jsonld'
import { Plane, Briefcase, Heart, Clock, Users, Ship, CalendarDays, Star } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { brand } from '@/config/brand'

export const revalidate = 3600

export const metadata: Metadata = {
  title: `Luxury Transportation Services ${brand.service.areaServed} | ${brand.company.displayName}`,
  description: `Full range of luxury car services in ${brand.service.areaServed} — airport transfers, corporate travel, weddings, hourly charter, group transport, cruise port transfers.`,
  alternates: { canonical: `${brand.site.url}/services` },
}

const crumbs = [{ name: 'Home', url: '/' }, { name: 'Services', url: '/services' }]

const SERVICE_ICONS: Record<string, LucideIcon> = {
  airport: Plane, corporate: Briefcase, wedding: Heart, hourly: Clock,
  group: Users, cruise: Ship, event: CalendarDays, vip: Star,
}

export default async function ServicesIndexPage() {
  const db = getSupabaseAdmin()
  const { data: services } = await db
    .from('seo_services')
    .select('slug, name, service_type, price_from')
    .eq('is_published', true)
    .order('name')

  return (
    <>
      <JsonLd data={localBusinessSchema()} />
      <JsonLd data={breadcrumbSchema(crumbs)} />

      <div className="min-h-screen bg-[#0e0e0e]">
        <div className="bg-gradient-to-b from-[#0a0a0a] via-[#0e0e0e] to-[#080808] px-6 py-20 text-center">
          <div className="max-w-3xl mx-auto">
            <p className="text-[#8fa4b4] text-xs font-bold tracking-widest uppercase mb-4">Premium Services</p>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">Luxury Transportation Services</h1>
            <p className="text-white text-lg">Every occasion, every destination — professional chauffeured service across {brand.service.areaServed}.</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-10">
          <BreadcrumbNav crumbs={crumbs} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">
            {services?.map(s => {
              const iconKey = Object.keys(SERVICE_ICONS).find(k => s.service_type?.includes(k) || s.slug.includes(k)) ?? 'vip'
              const Icon = SERVICE_ICONS[iconKey]
              return (
                <Link key={s.slug} href={`/services/${s.slug}`}
                  className="bg-[#0e0e0e] border border-[#D4A017]/10 rounded-2xl p-6 hover:border-[#D4A017]/30 hover:-translate-y-0.5 transition-all group">
                  <div className="flex items-center gap-3 mb-3">
                    <Icon className="w-5 h-5 text-white flex-shrink-0" strokeWidth={1.5} />
                    <h2 className="font-bold text-white group-hover:text-white">{s.name}</h2>
                  </div>
                </Link>
              )
            })}
          </div>

          <div className="text-center mt-12 py-10 border-t border-[#D4A017]/15">
            <Link href="/book" className="bg-[#141414] text-white font-bold px-8 py-4 rounded-xl hover:bg-[#1e262d] transition-colors">
              Book Now →
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
