import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import SeoPageTemplate from '@/components/seo/SeoPageTemplate'
import { getServiceBySlug, getAllServiceSlugs, resolveRelatedLinks } from '@/lib/seo/queries'
import { buildServiceMetadata } from '@/lib/seo/metadata'
import { localBusinessSchema, serviceSchema, faqSchema, breadcrumbSchema } from '@/lib/seo/jsonld'

export const revalidate = 3600
export const dynamicParams = true

export async function generateStaticParams() {
  const slugs = await getAllServiceSlugs()
  return slugs.map(r => ({ slug: r.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const row = await getServiceBySlug(slug)
  if (!row) return {}
  return buildServiceMetadata(row)
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const row = await getServiceBySlug(slug)
  if (!row) notFound()

  const related = await resolveRelatedLinks({
    locations: row.related_locations,
    routes: row.related_routes,
  })

  const crumbs = [
    { name: 'Home', url: '/' },
    { name: 'Services', url: '/services' },
    { name: row.name, url: `/services/${slug}` },
  ]

  return (
    <>
      <JsonLd data={localBusinessSchema()} />
      <JsonLd data={serviceSchema(row.name, row.meta_description, `/services/${slug}`, row.price_from ?? undefined)} />
      <JsonLd data={faqSchema(row.faq_items)} />
      <JsonLd data={breadcrumbSchema(crumbs)} />
      <SeoPageTemplate
        crumbs={crumbs}
        h1={row.h1}
        badge="Premium Service"
        intro_html={row.intro_html}
        body_html={row.body_html}
        faq_items={row.faq_items}
        related={related}
        meta={{ price_from: row.price_from ?? undefined }}
      />
    </>
  )
}
