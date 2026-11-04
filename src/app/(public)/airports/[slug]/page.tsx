import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import SeoPageTemplate from '@/components/seo/SeoPageTemplate'
import { getAirportBySlug, getAllAirportSlugs, resolveRelatedLinks } from '@/lib/seo/queries'
import { buildAirportMetadata } from '@/lib/seo/metadata'
import { localBusinessSchema, faqSchema, breadcrumbSchema } from '@/lib/seo/jsonld'

export const revalidate = 3600
export const dynamicParams = true

export async function generateStaticParams() {
  const slugs = await getAllAirportSlugs()
  return slugs.map(r => ({ slug: r.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const row = await getAirportBySlug(slug)
  if (!row) return {}
  return buildAirportMetadata(row)
}

export default async function AirportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const row = await getAirportBySlug(slug)
  if (!row) notFound()

  const related = await resolveRelatedLinks({
    locations: row.related_locations,
    routes: row.related_routes,
  })

  const crumbs = [
    { name: 'Home', url: '/' },
    { name: 'Airports', url: '/airports' },
    { name: row.name, url: `/airports/${slug}` },
  ]

  return (
    <>
      <JsonLd data={localBusinessSchema()} />
      <JsonLd data={faqSchema(row.faq_items)} />
      <JsonLd data={breadcrumbSchema(crumbs)} />
      <SeoPageTemplate
        crumbs={crumbs}
        h1={row.h1}
        badge="Airport Transfer"
        intro_html={row.intro_html}
        body_html={row.body_html}
        faq_items={row.faq_items}
        related={related}
        meta={{ iata: row.iata_code ?? undefined, city: row.city }}
        cta={{ label: 'Book Airport Transfer →', href: '/book?service=airport_transfer' }}
      />
    </>
  )
}
