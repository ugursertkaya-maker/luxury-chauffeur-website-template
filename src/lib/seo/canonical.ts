import { brand } from '@/config/brand'

export const BASE_URL = brand.site.url

export const canonical = (path: string) => `${BASE_URL}${path}`

export const urls = {
  location:   (slug: string) => `/locations/${slug}`,
  airport:    (slug: string) => `/airports/${slug}`,
  route:      (slug: string) => `/routes/${slug}`,
  attraction: (slug: string) => `/attractions/${slug}`,
  destination:(slug: string) => `/destinations/${slug}`,
  hotel:      (slug: string) => `/hotels/${slug}`,
  cruisePort: (slug: string) => `/cruise-ports/${slug}`,
  service:    (slug: string) => `/services/${slug}`,
  blog:       (slug: string) => `/blog/${slug}`,
}
