import type { Metadata } from 'next'
import { canonical } from './canonical'
import type { SeoLocation, SeoAirport, SeoRoute, SeoAttraction, SeoHotel, SeoCruisePort, SeoService, SeoDestination, SeoBlog } from './types'

import { brand } from '@/config/brand'

const SITE_NAME = brand.site.name
const OG_IMAGE = brand.site.ogImage

function base(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: canonical(path) },
    openGraph: { title, description, url: canonical(path), siteName: SITE_NAME, images: [{ url: OG_IMAGE }], type: 'website' },
    twitter: { card: 'summary_large_image', title, description, images: [OG_IMAGE] },
  }
}

export function buildLocationMetadata(row: SeoLocation): Metadata {
  return base(row.meta_title, row.meta_description, `/locations/${row.slug}`)
}
export function buildAirportMetadata(row: SeoAirport): Metadata {
  return base(row.meta_title, row.meta_description, `/airports/${row.slug}`)
}
export function buildRouteMetadata(row: SeoRoute): Metadata {
  return base(row.meta_title, row.meta_description, `/routes/${row.slug}`)
}
export function buildAttractionMetadata(row: SeoAttraction): Metadata {
  return base(row.meta_title, row.meta_description, `/attractions/${row.slug}`)
}
export function buildHotelMetadata(row: SeoHotel): Metadata {
  return base(row.meta_title, row.meta_description, `/hotels/${row.slug}`)
}
export function buildCruisePortMetadata(row: SeoCruisePort): Metadata {
  return base(row.meta_title, row.meta_description, `/cruise-ports/${row.slug}`)
}
export function buildServiceMetadata(row: SeoService): Metadata {
  return base(row.meta_title, row.meta_description, `/services/${row.slug}`)
}
export function buildDestinationMetadata(row: SeoDestination): Metadata {
  return base(row.meta_title, row.meta_description, `/destinations/${row.slug}`)
}
export function buildBlogMetadata(row: SeoBlog): Metadata {
  return {
    ...base(row.meta_title, row.meta_description, `/blog/${row.slug}`),
    openGraph: {
      title: row.meta_title, description: row.meta_description,
      url: canonical(`/blog/${row.slug}`), siteName: SITE_NAME,
      images: [{ url: OG_IMAGE }], type: 'article',
      publishedTime: row.published_at,
      authors: [row.author],
    },
  }
}
