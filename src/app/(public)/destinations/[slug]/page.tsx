import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import SeoPageTemplate from '@/components/seo/SeoPageTemplate'
import { getDestinationBySlug, getAllDestinationSlugs, resolveRelatedLinks } from '@/lib/seo/queries'
import { buildDestinationMetadata } from '@/lib/seo/metadata'
import { localBusinessSchema, faqSchema, breadcrumbSchema } from '@/lib/seo/jsonld'
import { brand } from '@/config/brand'

export const revalidate = 3600
export const dynamicParams = true

export async function generateStaticParams() {
  const slugs = await getAllDestinationSlugs()
  return slugs.map(r => ({ slug: r.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const row = await getDestinationBySlug(slug)
  if (!row) return {}
  return buildDestinationMetadata(row)
}

export default async function DestinationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const row = await getDestinationBySlug(slug)
  if (!row) notFound()

  const related = await resolveRelatedLinks({
    locations: row.related_locations,
    airports: row.related_airports,
    attractions: row.related_attractions,
  })

  const crumbs = [
    { name: 'Home', url: '/' },
    { name: 'Destinations', url: '/destinations' },
    { name: row.name, url: `/destinations/${slug}` },
  ]

  return (
    <>
      <JsonLd data={localBusinessSchema()} />
      <JsonLd data={faqSchema(row.faq_items)} />
      <JsonLd data={breadcrumbSchema(crumbs)} />
      <SeoPageTemplate
        crumbs={crumbs}
        h1={row.h1}
        badge={row.region ?? `${brand.service.areaServed}`}
        intro_html={row.intro_html}
        body_html={row.body_html}
        faq_items={row.faq_items}
        related={related}
      />
    </>
  )
}
