import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import SeoPageTemplate from '@/components/seo/SeoPageTemplate'
import { getAttractionBySlug, getAllAttractionSlugs, resolveRelatedLinks } from '@/lib/seo/queries'
import { buildAttractionMetadata } from '@/lib/seo/metadata'
import { localBusinessSchema, faqSchema, breadcrumbSchema } from '@/lib/seo/jsonld'

export const revalidate = 3600
export const dynamicParams = true

export async function generateStaticParams() {
  const slugs = await getAllAttractionSlugs()
  return slugs.map(r => ({ slug: r.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const row = await getAttractionBySlug(slug)
  if (!row) return {}
  return buildAttractionMetadata(row)
}

export default async function AttractionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const row = await getAttractionBySlug(slug)
  if (!row) notFound()

  const related = await resolveRelatedLinks({
    locations: row.related_locations,
    routes: row.related_routes,
    services: row.related_services,
  })

  const crumbs = [
    { name: 'Home', url: '/' },
    { name: 'Attractions', url: '/attractions' },
    { name: row.name, url: `/attractions/${slug}` },
  ]

  return (
    <>
      <JsonLd data={localBusinessSchema()} />
      <JsonLd data={faqSchema(row.faq_items)} />
      <JsonLd data={breadcrumbSchema(crumbs)} />
      <SeoPageTemplate
        crumbs={crumbs}
        h1={row.h1}
        badge={row.category ?? 'Attraction'}
        intro_html={row.intro_html}
        body_html={row.body_html}
        faq_items={row.faq_items}
        related={related}
        meta={{ city: row.city }}
      />
    </>
  )
}
