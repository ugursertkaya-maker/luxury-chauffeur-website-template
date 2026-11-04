import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import SeoPageTemplate from '@/components/seo/SeoPageTemplate'
import { getHotelBySlug, getAllHotelSlugs, resolveRelatedLinks } from '@/lib/seo/queries'
import { buildHotelMetadata } from '@/lib/seo/metadata'
import { localBusinessSchema, faqSchema, breadcrumbSchema } from '@/lib/seo/jsonld'

export const revalidate = 3600
export const dynamicParams = true

export async function generateStaticParams() {
  const slugs = await getAllHotelSlugs()
  return slugs.map(r => ({ slug: r.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const row = await getHotelBySlug(slug)
  if (!row) return {}
  return buildHotelMetadata(row)
}

export default async function HotelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const row = await getHotelBySlug(slug)
  if (!row) notFound()

  const related = await resolveRelatedLinks({
    airports: row.related_airports,
    locations: row.related_locations,
    services: row.related_services,
  })

  const crumbs = [
    { name: 'Home', url: '/' },
    { name: 'Hotels', url: '/hotels' },
    { name: row.name, url: `/hotels/${slug}` },
  ]

  return (
    <>
      <JsonLd data={localBusinessSchema()} />
      <JsonLd data={faqSchema(row.faq_items)} />
      <JsonLd data={breadcrumbSchema(crumbs)} />
      <SeoPageTemplate
        crumbs={crumbs}
        h1={row.h1}
        badge={`${row.city} Hotel Transfer`}
        intro_html={row.intro_html}
        body_html={row.body_html}
        faq_items={row.faq_items}
        related={related}
        meta={{ city: row.city, stars: row.star_rating ?? undefined }}
        cta={{ label: 'Book Hotel Transfer →', href: '/book?service=point_to_point' }}
      />
    </>
  )
}
