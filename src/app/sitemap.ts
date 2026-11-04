export const revalidate = 3600

import type { MetadataRoute } from 'next'
import { BASE_URL } from '@/lib/seo/canonical'
import {
  getAllLocationSlugs, getAllAirportSlugs, getAllRouteSlugs,
  getAllAttractionSlugs, getAllHotelSlugs, getAllCruisePortSlugs,
  getAllServiceSlugs, getAllDestinationSlugs, getAllBlogSlugs,
} from '@/lib/seo/queries'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [locations, airports, routes, attractions, hotels, cruisePorts, services, destinations, blogs] = await Promise.all([
    getAllLocationSlugs(),
    getAllAirportSlugs(),
    getAllRouteSlugs(),
    getAllAttractionSlugs(),
    getAllHotelSlugs(),
    getAllCruisePortSlugs(),
    getAllServiceSlugs(),
    getAllDestinationSlugs(),
    getAllBlogSlugs(),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/book`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/locations`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/airports`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/routes`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
    { url: `${BASE_URL}/services`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
    { url: `${BASE_URL}/destinations`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/attractions`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/hotels`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.75 },
    { url: `${BASE_URL}/cruise-ports`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.75 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/cancellation-policy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ]

  const toEntries = (slugs: { slug: string; updated_at?: string }[], prefix: string, priority = 0.8): MetadataRoute.Sitemap =>
    slugs.map(r => ({
      url: `${BASE_URL}/${prefix}/${r.slug}`,
      lastModified: r.updated_at ? new Date(r.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority,
    }))

  return [
    ...staticPages,
    ...toEntries(airports, 'airports', 0.9),
    ...toEntries(routes, 'routes', 0.9),
    ...toEntries(locations, 'locations', 0.8),
    ...toEntries(services, 'services', 0.8),
    ...toEntries(destinations, 'destinations', 0.8),
    ...toEntries(attractions, 'attractions', 0.7),
    ...toEntries(hotels, 'hotels', 0.7),
    ...toEntries(cruisePorts, 'cruise-ports', 0.7),
    ...toEntries(blogs, 'blog', 0.6),
  ]
}
