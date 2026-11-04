import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import SeoPageTemplate from '@/components/seo/SeoPageTemplate'
import { getCruisePortBySlug, getAllCruisePortSlugs, resolveRelatedLinks } from '@/lib/seo/queries'
import { buildCruisePortMetadata } from '@/lib/seo/metadata'
import { localBusinessSchema, faqSchema, breadcrumbSchema } from '@/lib/seo/jsonld'

export const revalidate = 3600
export const dynamicParams = true

export async function generateStaticParams() {
  const slugs = await getAllCruisePortSlugs()
  return slugs.map(r => ({ slug: r.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const row = await getCruisePortBySlug(slug)
  if (!row) return {}
  return buildCruisePortMetadata(row)
}

export default async function CruisePortPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const row = await getCruisePortBySlug(slug)
  if (!row) notFound()

  const related = await resolveRelatedLinks({
    airports: row.related_airports,
    locations: row.related_locations,
    routes: row.related_routes,
  })

  const crumbs = [
    { name: 'Home', url: '/' },
    { name: 'Cruise Ports', url: '/cruise-ports' },
    { name: row.name, url: `/cruise-ports/${slug}` },
  ]

  return (
    <>
      <JsonLd data={localBusinessSchema()} />
      <JsonLd data={faqSchema(row.faq_items)} />
      <JsonLd data={breadcrumbSchema(crumbs)} />
      <SeoPageTemplate
        crumbs={crumbs}
        h1={row.h1}
        badge="Cruise Port Transfer"
        intro_html={row.intro_html}
        body_html={row.body_html}
        faq_items={row.faq_items}
        related={related}
        meta={{ city: row.city }}
        cta={{ label: 'Book Cruise Transfer →', href: '/book?service=airport_transfer' }}
      />
    </>
  )
}
