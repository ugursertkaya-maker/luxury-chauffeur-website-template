export type FaqItem = { question: string; answer: string }

export type SeoLocation = {
  id: string; slug: string; name: string; state: string; county?: string
  lat?: number; lng?: number
  meta_title: string; meta_description: string; h1: string
  intro_html?: string; body_html?: string
  faq_items: FaqItem[]
  related_airports: string[]; related_routes: string[]; related_services: string[]
  is_published: boolean; updated_at: string
}

export type SeoAirport = {
  id: string; slug: string; name: string; iata_code?: string; city: string; state: string
  lat?: number; lng?: number
  meta_title: string; meta_description: string; h1: string
  intro_html?: string; body_html?: string; terminal_info?: string
  faq_items: FaqItem[]
  related_locations: string[]; related_routes: string[]
  is_published: boolean; updated_at: string
}

export type SeoRoute = {
  id: string; slug: string; origin_name: string; destination_name: string
  origin_location_slug?: string; destination_location_slug?: string
  distance_miles?: number; duration_minutes?: number
  meta_title: string; meta_description: string; h1: string
  intro_html?: string; body_html?: string
  faq_items: FaqItem[]
  related_airports: string[]; related_services: string[]
  is_published: boolean; updated_at: string
}

export type SeoAttraction = {
  id: string; slug: string; name: string; city: string; state: string; category?: string
  lat?: number; lng?: number
  meta_title: string; meta_description: string; h1: string
  intro_html?: string; body_html?: string
  faq_items: FaqItem[]
  related_locations: string[]; related_routes: string[]; related_services: string[]
  is_published: boolean; updated_at: string
}

export type SeoHotel = {
  id: string; slug: string; name: string; city: string; state: string
  address?: string; lat?: number; lng?: number; star_rating?: number
  meta_title: string; meta_description: string; h1: string
  intro_html?: string; body_html?: string
  faq_items: FaqItem[]
  related_airports: string[]; related_locations: string[]; related_services: string[]
  is_published: boolean; updated_at: string
}

export type SeoCruisePort = {
  id: string; slug: string; name: string; city: string; state: string
  lat?: number; lng?: number
  meta_title: string; meta_description: string; h1: string
  intro_html?: string; body_html?: string
  faq_items: FaqItem[]
  related_airports: string[]; related_locations: string[]; related_routes: string[]
  is_published: boolean; updated_at: string
}

export type SeoService = {
  id: string; slug: string; name: string; service_type: string
  meta_title: string; meta_description: string; h1: string
  intro_html?: string; body_html?: string
  faq_items: FaqItem[]
  price_from?: number; schema_service_type?: string
  related_locations: string[]; related_routes: string[]
  is_published: boolean; updated_at: string
}

export type SeoDestination = {
  id: string; slug: string; name: string; region?: string
  meta_title: string; meta_description: string; h1: string
  intro_html?: string; body_html?: string
  faq_items: FaqItem[]
  related_locations: string[]; related_airports: string[]; related_attractions: string[]
  is_published: boolean; updated_at: string
}

export type SeoBlog = {
  id: string; slug: string; title: string; author: string; published_at?: string
  meta_title: string; meta_description: string; h1: string
  excerpt?: string; body_html: string
  faq_items: FaqItem[]; tags: string[]
  primary_tag?: string; reading_time_minutes?: number
  related_routes: string[]; related_services: string[]
  schema_article_type: string
  is_published: boolean; updated_at: string; created_at: string
}
