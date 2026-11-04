import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import SeoPageTemplate from '@/components/seo/SeoPageTemplate'
import { getLocationBySlug, getAllLocationSlugs, resolveRelatedLinks } from '@/lib/seo/queries'
import { buildLocationMetadata } from '@/lib/seo/metadata'
import { localBusinessSchema, faqSchema, breadcrumbSchema } from '@/lib/seo/jsonld'
import { canonical } from '@/lib/seo/canonical'

export const revalidate = 3600
export const dynamicParams = true

export async function generateStaticParams() {
  const slugs = await getAllLocationSlugs()
  return slugs.map(r => ({ slug: r.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const row = await getLocationBySlug(slug)
  if (!row) return {}
  return buildLocationMetadata(row)
}

export default async function LocationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const row = await getLocationBySlug(slug)
  if (!row) notFound()

  const related = await resolveRelatedLinks({
    airports: row.related_airports,
    routes: row.related_routes,
    services: row.related_services,
  })

  const crumbs = [
    { name: 'Home', url: '/' },
    { name: 'Service Areas', url: '/locations' },
    { name: row.name, url: `/locations/${slug}` },
  ]

  return (
    <>
      <JsonLd data={localBusinessSchema()} />
      <JsonLd data={faqSchema(row.faq_items)} />
      <JsonLd data={breadcrumbSchema(crumbs)} />
      <SeoPageTemplate
        crumbs={crumbs}
        h1={row.h1}
        badge={`${row.name}, ${row.state}`}
        intro_html={row.intro_html}
        body_html={row.body_html}
        faq_items={row.faq_items}
        related={related}
        meta={{ city: row.name }}
      />
    </>
  )
}
