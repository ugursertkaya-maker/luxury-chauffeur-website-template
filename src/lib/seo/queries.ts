import { getSupabaseAdmin } from '@/lib/supabase'
import type { SeoLocation, SeoAirport, SeoRoute, SeoAttraction, SeoHotel, SeoCruisePort, SeoService, SeoDestination, SeoBlog } from './types'

const db = () => getSupabaseAdmin()

// Locations
export async function getLocationBySlug(slug: string): Promise<SeoLocation | null> {
  const { data } = await db().from('seo_locations').select('*').eq('slug', slug).eq('is_published', true).single()
  return data
}
export async function getAllLocationSlugs() {
  const { data } = await db().from('seo_locations').select('slug, updated_at').eq('is_published', true)
  return data ?? []
}

// Airports
export async function getAirportBySlug(slug: string): Promise<SeoAirport | null> {
  const { data } = await db().from('seo_airports').select('*').eq('slug', slug).eq('is_published', true).single()
  return data
}
export async function getAllAirportSlugs() {
  const { data } = await db().from('seo_airports').select('slug, updated_at').eq('is_published', true)
  return data ?? []
}

// Routes
export async function getRouteBySlug(slug: string): Promise<SeoRoute | null> {
  const { data } = await db().from('seo_routes').select('*').eq('slug', slug).eq('is_published', true).single()
  return data
}
export async function getAllRouteSlugs() {
  const { data } = await db().from('seo_routes').select('slug, updated_at').eq('is_published', true)
  return data ?? []
}

// Attractions
export async function getAttractionBySlug(slug: string): Promise<SeoAttraction | null> {
  const { data } = await db().from('seo_attractions').select('*').eq('slug', slug).eq('is_published', true).single()
  return data
}
export async function getAllAttractionSlugs() {
  const { data } = await db().from('seo_attractions').select('slug, updated_at').eq('is_published', true)
  return data ?? []
}

// Hotels
export async function getHotelBySlug(slug: string): Promise<SeoHotel | null> {
  const { data } = await db().from('seo_hotels').select('*').eq('slug', slug).eq('is_published', true).single()
  return data
}
export async function getAllHotelSlugs() {
  const { data } = await db().from('seo_hotels').select('slug, updated_at').eq('is_published', true)
  return data ?? []
}

// Cruise Ports
export async function getCruisePortBySlug(slug: string): Promise<SeoCruisePort | null> {
  const { data } = await db().from('seo_cruise_ports').select('*').eq('slug', slug).eq('is_published', true).single()
  return data
}
export async function getAllCruisePortSlugs() {
  const { data } = await db().from('seo_cruise_ports').select('slug, updated_at').eq('is_published', true)
  return data ?? []
}

// Services
export async function getServiceBySlug(slug: string): Promise<SeoService | null> {
  const { data } = await db().from('seo_services').select('*').eq('slug', slug).eq('is_published', true).single()
  return data
}
export async function getAllServiceSlugs() {
  const { data } = await db().from('seo_services').select('slug, updated_at').eq('is_published', true)
  return data ?? []
}

// Destinations
export async function getDestinationBySlug(slug: string): Promise<SeoDestination | null> {
  const { data } = await db().from('seo_destinations').select('*').eq('slug', slug).eq('is_published', true).single()
  return data
}
export async function getAllDestinationSlugs() {
  const { data } = await db().from('seo_destinations').select('slug, updated_at').eq('is_published', true)
  return data ?? []
}

// Blog
export async function getBlogBySlug(slug: string): Promise<SeoBlog | null> {
  const { data } = await db().from('seo_blog').select('*').eq('slug', slug).eq('is_published', true).single()
  return data
}
export async function getAllBlogSlugs() {
  const { data } = await db().from('seo_blog').select('slug, updated_at').eq('is_published', true)
  return data ?? []
}

// Related blog posts by tag overlap
type RelatedPost = Pick<SeoBlog, 'slug' | 'title' | 'meta_description' | 'primary_tag' | 'reading_time_minutes'>
export async function getRelatedBlogPosts(currentSlug: string, tags: string[], limit = 3): Promise<RelatedPost[]> {
  const sel = 'slug, title, meta_description, primary_tag, reading_time_minutes'
  if (!tags?.length) {
    const { data } = await db().from('seo_blog').select(sel).eq('is_published', true).neq('slug', currentSlug).limit(limit)
    return (data ?? []) as RelatedPost[]
  }
  const { data } = await db().from('seo_blog').select(sel).eq('is_published', true).neq('slug', currentSlug).contains('tags', tags).limit(limit)
  if (!data || data.length < limit) {
    const { data: fallback } = await db().from('seo_blog').select(sel).eq('is_published', true).neq('slug', currentSlug).limit(limit)
    return (fallback ?? []) as RelatedPost[]
  }
  return data as RelatedPost[]
}

// Related links resolver — resolves slug arrays to { slug, name, url } objects
type LinkRef = { slug: string; name: string; url: string }

export async function resolveRelatedLinks(config: {
  airports?: string[]
  locations?: string[]
  routes?: string[]
  services?: string[]
  attractions?: string[]
  destinations?: string[]
  hotels?: string[]
  cruisePorts?: string[]
}) {
  const results: { airports: LinkRef[]; locations: LinkRef[]; routes: LinkRef[]; services: LinkRef[]; attractions: LinkRef[]; destinations: LinkRef[]; hotels: LinkRef[]; cruisePorts: LinkRef[] } = {
    airports: [], locations: [], routes: [], services: [], attractions: [], destinations: [], hotels: [], cruisePorts: []
  }

  const fetch = async (table: string, slugs: string[], urlFn: (s: string) => string, nameField = 'name') => {
    if (!slugs?.length) return []
    const { data } = await db().from(table).select(`slug, ${nameField}`).in('slug', slugs).eq('is_published', true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((r: any) => ({ slug: r.slug as string, name: r[nameField] as string, url: urlFn(r.slug as string) }))
  }

  const [airports, locations, routes, services, attractions, destinations, hotels, cruisePorts] = await Promise.all([
    fetch('seo_airports', config.airports ?? [], s => `/airports/${s}`),
    fetch('seo_locations', config.locations ?? [], s => `/locations/${s}`),
    fetch('seo_routes', config.routes ?? [], s => `/routes/${s}`, 'origin_name'),
    fetch('seo_services', config.services ?? [], s => `/services/${s}`),
    fetch('seo_attractions', config.attractions ?? [], s => `/attractions/${s}`),
    fetch('seo_destinations', config.destinations ?? [], s => `/destinations/${s}`),
    fetch('seo_hotels', config.hotels ?? [], s => `/hotels/${s}`),
    fetch('seo_cruise_ports', config.cruisePorts ?? [], s => `/cruise-ports/${s}`),
  ])

  results.airports = airports
  results.locations = locations
  results.routes = routes
  results.services = services
  results.attractions = attractions
  results.destinations = destinations
  results.hotels = hotels
  results.cruisePorts = cruisePorts

  return results
}
