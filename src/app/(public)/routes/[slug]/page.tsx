import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import SeoPageTemplate from '@/components/seo/SeoPageTemplate'
import { getRouteBySlug, getAllRouteSlugs, resolveRelatedLinks } from '@/lib/seo/queries'
import { buildRouteMetadata } from '@/lib/seo/metadata'
import { localBusinessSchema, faqSchema, breadcrumbSchema } from '@/lib/seo/jsonld'

export const revalidate = 3600
export const dynamicParams = true

export async function generateStaticParams() {
  const slugs = await getAllRouteSlugs()
  return slugs.map(r => ({ slug: r.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const row = await getRouteBySlug(slug)
  if (!row) return {}
  return buildRouteMetadata(row)
}

export default async function RoutePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const row = await getRouteBySlug(slug)
  if (!row) notFound()

  const related = await resolveRelatedLinks({
    airports: row.related_airports,
    services: row.related_services,
  })

  const crumbs = [
    { name: 'Home', url: '/' },
    { name: 'Routes', url: '/routes' },
    { name: `${row.origin_name} → ${row.destination_name}`, url: `/routes/${slug}` },
  ]

  return (
    <>
      <JsonLd data={localBusinessSchema()} />
      <JsonLd data={faqSchema(row.faq_items)} />
      <JsonLd data={breadcrumbSchema(crumbs)} />
      <SeoPageTemplate
        crumbs={crumbs}
        h1={row.h1}
        badge={`${row.origin_name} to ${row.destination_name}`}
        intro_html={row.intro_html}
        body_html={row.body_html}
        faq_items={row.faq_items}
        related={related}
        meta={{
          distance: row.distance_miles ? `${row.distance_miles} mi` : undefined,
          duration: row.duration_minutes ? `~${Math.round(row.duration_minutes / 60)}h ${row.duration_minutes % 60}m` : undefined,
        }}
      />
    </>
  )
}
