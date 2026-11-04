/**
 * ============================================================================
 *  SAMPLE SEED DATA — REPLACE EVERYTHING IN THIS FILE
 * ============================================================================
 *
 *  Run with:  npx tsx scripts/seed-example.ts
 *  (requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local)
 *
 *  Every row below is OBVIOUSLY FAKE sample content. It exists to:
 *    1. show the exact shape each table expects, and
 *    2. let you see the site render end-to-end before you write real content.
 *
 *  All sample rows are marked `is_published: false` so they never reach your
 *  sitemap or appear to search engines. Flip to `true` only after you have
 *  replaced the content with real, accurate copy about your own business.
 *
 *  ⚠ Do not publish this sample content. It names places that do not exist,
 *    and the prices are arbitrary placeholders, not quotes.
 *
 *  Content types seeded here (one hub + detail page each):
 *    locations · airports · routes · hotels · cruise_ports
 *    attractions · destinations · services · blog
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) dotenv.config({ path: envPath })
else dotenv.config()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('✖ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
  console.error('  Copy .env.example to .env.local and fill them in first.')
  process.exit(1)
}

const supabase = createClient(url, key)

/** Mark every seeded SEO row as a draft so sample copy can never go live. */
const DRAFT = { is_published: false }

async function upsert(table: string, rows: object[], onConflict = 'slug') {
  const { error } = await supabase.from(table).upsert(rows, { onConflict })
  if (error) {
    console.error(`✖ ${table}: ${error.message}`)
    return false
  }
  console.log(`✓ ${table}: ${rows.length} row(s)`)
  return true
}

const FAQ = [
  { question: 'How far in advance should I book?', answer: 'Sample answer — replace with your own booking policy.' },
  { question: 'Is gratuity included?', answer: 'Sample answer — replace with your own gratuity policy.' },
]

// ---------------------------------------------------------------------------
// PRICING — arbitrary placeholder rates. Set your real rates in /admin/pricing.
// ---------------------------------------------------------------------------
async function seedPricing() {
  // The pricing lookup resolves this single default row. See
  // src/app/api/pricing/lookup/route.ts for how to switch to per-region rates.
  await upsert('county_pricing', [{
    county: '__default__',
    sedan_base: 75, sedan_per_mile: 2.50,
    suv_base: 95, suv_per_mile: 3.50,
    min_fare: 65,
    sedan_hourly: 85, suv_hourly: 105,
    sedan_event: 95, suv_event: 115,
  }], 'county')

  await upsert('pricing_surcharges', [
    { key: 'night_fee', label: 'Night / Early Morning Fee (10pm–6am)', amount: 25 },
    { key: 'weekend_fee', label: 'Weekend Surcharge', amount: 15 },
    { key: 'airport_meetgreet', label: 'Airport Meet & Greet', amount: 20 },
    { key: 'airport_pickup', label: 'Airport Pickup Fee', amount: 0 },
    { key: 'airport_dropoff', label: 'Airport Drop-off Fee', amount: 0 },
  ], 'key')
}

// ---------------------------------------------------------------------------
// FLEET — replace with your actual vehicles and your own photographs.
// ---------------------------------------------------------------------------
async function seedVehicles() {
  await upsert('vehicles', [
    {
      id: 'sedan',
      name: 'Executive Sedan',
      slug: 'executive-sedan',
      category: 'sedan',
      capacity_passengers: 3,
      capacity_bags: 3,
      base_price: 75,
      description: 'Sample vehicle description — replace with details of your own sedan.',
      features: ['Leather seating', 'Climate control', 'Bottled water', 'Phone charger'],
      image_url: '/vehicles/placeholder-sedan.svg',
      is_active: true,
      sort_order: 1,
    },
    {
      id: 'suv',
      name: 'Premium SUV',
      slug: 'premium-suv',
      category: 'suv',
      capacity_passengers: 6,
      capacity_bags: 6,
      base_price: 95,
      description: 'Sample vehicle description — replace with details of your own SUV.',
      features: ['Seats up to 6', 'Extra luggage space', 'Climate control', 'Phone charger'],
      image_url: '/vehicles/placeholder-suv.svg',
      is_active: true,
      sort_order: 2,
    },
  ], 'id')
}

// ---------------------------------------------------------------------------
// SEO CONTENT — all drafts. Replace names, copy and coordinates.
// ---------------------------------------------------------------------------
async function seedLocations() {
  await upsert('seo_locations', [
    {
      ...DRAFT,
      slug: 'example-city',
      name: 'Example City',
      state: 'ST',
      county: 'Example County',
      lat: 0, lng: 0,
      meta_title: 'SAMPLE — Car Service in Example City',
      meta_description: 'Sample meta description. Replace with a real 150–160 character summary of your service in this city.',
      h1: 'SAMPLE — Chauffeured Car Service in Example City',
      intro_html: '<p>Sample intro paragraph. Describe your service in this city in two or three sentences.</p>',
      body_html: '<h2>Sample section heading</h2><p>Sample body copy. This is where the substantive, genuinely useful page content goes.</p>',
      faq_items: FAQ,
      related_airports: ['example-international-airport'],
      related_routes: ['example-city-to-example-international-airport'],
      related_services: ['airport-transfers'],
    },
    {
      ...DRAFT,
      slug: 'riverside',
      name: 'Riverside',
      state: 'ST',
      county: 'Example County',
      lat: 0, lng: 0,
      meta_title: 'SAMPLE — Car Service in Riverside',
      meta_description: 'Sample meta description for a second service-area page.',
      h1: 'SAMPLE — Chauffeured Car Service in Riverside',
      intro_html: '<p>Sample intro paragraph for a second location page.</p>',
      body_html: '<h2>Sample section heading</h2><p>Sample body copy.</p>',
      faq_items: FAQ,
      related_services: ['airport-transfers'],
    },
  ])
}

async function seedAirports() {
  await upsert('seo_airports', [{
    ...DRAFT,
    slug: 'example-international-airport',
    name: 'Example International Airport',
    iata_code: 'EXA',
    city: 'Example City',
    state: 'ST',
    lat: 0, lng: 0,
    meta_title: 'SAMPLE — EXA Airport Car Service',
    meta_description: 'Sample meta description for an airport transfer page.',
    h1: 'SAMPLE — Example International Airport (EXA) Car Service',
    intro_html: '<p>Sample intro paragraph describing your airport transfer service.</p>',
    body_html: '<h2>Sample section heading</h2><p>Sample body copy about terminals, meet-and-greet and flight tracking.</p>',
    terminal_info: 'Sample terminal pickup instructions — replace with the real procedure for this airport.',
    faq_items: FAQ,
    related_locations: ['example-city'],
    related_routes: ['example-city-to-example-international-airport'],
  }])
}

async function seedRoutes() {
  await upsert('seo_routes', [{
    ...DRAFT,
    slug: 'example-city-to-example-international-airport',
    origin_name: 'Example City',
    destination_name: 'Example International Airport',
    origin_location_slug: 'example-city',
    destination_location_slug: null,
    distance_miles: 18.5,
    duration_minutes: 30,
    meta_title: 'SAMPLE — Example City to EXA Airport Transfer',
    meta_description: 'Sample meta description for a point-to-point route page.',
    h1: 'SAMPLE — Example City to Example International Airport',
    intro_html: '<p>Sample intro paragraph for this route.</p>',
    body_html: '<h2>Sample section heading</h2><p>Sample body copy about timing, traffic and pricing for this route.</p>',
    faq_items: FAQ,
    related_airports: ['example-international-airport'],
    related_services: ['airport-transfers'],
  }])
}

async function seedHotels() {
  await upsert('seo_hotels', [{
    ...DRAFT,
    slug: 'example-grand-hotel',
    name: 'Example Grand Hotel',
    city: 'Example City',
    state: 'ST',
    address: '123 Example Street, Example City, ST 00000',
    lat: 0, lng: 0,
    star_rating: 4,
    meta_title: 'SAMPLE — Example Grand Hotel Car Service',
    meta_description: 'Sample meta description for a hotel transfer page.',
    h1: 'SAMPLE — Car Service to Example Grand Hotel',
    intro_html: '<p>Sample intro paragraph for a hotel page.</p>',
    body_html: '<h2>Sample section heading</h2><p>Sample body copy.</p>',
    faq_items: FAQ,
    related_airports: ['example-international-airport'],
    related_locations: ['example-city'],
    related_services: ['airport-transfers'],
  }])
}

async function seedCruisePorts() {
  await upsert('seo_cruise_ports', [{
    ...DRAFT,
    slug: 'port-of-example-city',
    name: 'Port of Example City',
    city: 'Example City',
    state: 'ST',
    lat: 0, lng: 0,
    meta_title: 'SAMPLE — Port of Example City Cruise Transfers',
    meta_description: 'Sample meta description for a cruise port transfer page.',
    h1: 'SAMPLE — Cruise Transfers to the Port of Example City',
    intro_html: '<p>Sample intro paragraph for a cruise port page.</p>',
    body_html: '<h2>Sample section heading</h2><p>Sample body copy.</p>',
    faq_items: FAQ,
    related_airports: ['example-international-airport'],
    related_locations: ['example-city'],
  }])
}

// NOTE: the original site shipped /attractions and /destinations hub pages with
// no seed data at all, so both rendered empty. These two functions fix that.
async function seedAttractions() {
  await upsert('seo_attractions', [{
    ...DRAFT,
    slug: 'example-concert-hall',
    name: 'Example Concert Hall',
    city: 'Example City',
    state: 'ST',
    category: 'Entertainment',
    lat: 0, lng: 0,
    meta_title: 'SAMPLE — Example Concert Hall Car Service',
    meta_description: 'Sample meta description for an attraction/venue page.',
    h1: 'SAMPLE — Car Service to Example Concert Hall',
    intro_html: '<p>Sample intro paragraph for a venue page.</p>',
    body_html: '<h2>Sample section heading</h2><p>Sample body copy.</p>',
    faq_items: FAQ,
    related_locations: ['example-city'],
    related_services: ['event-transfers'],
  }])
}

async function seedDestinations() {
  await upsert('seo_destinations', [{
    ...DRAFT,
    slug: 'example-region',
    name: 'Example Region',
    region: 'Example Region',
    meta_title: 'SAMPLE — Example Region Car Service',
    meta_description: 'Sample meta description for a wider destination/region page.',
    h1: 'SAMPLE — Chauffeured Travel Across Example Region',
    intro_html: '<p>Sample intro paragraph for a regional destination page.</p>',
    body_html: '<h2>Sample section heading</h2><p>Sample body copy.</p>',
    faq_items: FAQ,
    related_locations: ['example-city', 'riverside'],
    related_airports: ['example-international-airport'],
    related_attractions: ['example-concert-hall'],
  }])
}

async function seedServices() {
  await upsert('seo_services', [
    {
      ...DRAFT,
      slug: 'airport-transfers',
      name: 'Airport Transfers',
      service_type: 'airport',
      price_from: 75,
      schema_service_type: 'Airport Transfer',
      meta_title: 'SAMPLE — Airport Transfer Service',
      meta_description: 'Sample meta description for the airport transfer service page.',
      h1: 'SAMPLE — Airport Transfers',
      intro_html: '<p>Sample intro paragraph describing airport transfers.</p>',
      body_html: '<h2>Sample section heading</h2><p>Sample body copy.</p>',
      faq_items: FAQ,
      related_locations: ['example-city'],
      related_routes: ['example-city-to-example-international-airport'],
    },
    {
      ...DRAFT,
      slug: 'corporate-travel',
      name: 'Corporate Travel',
      service_type: 'corporate',
      price_from: 75,
      schema_service_type: 'Corporate Transportation',
      meta_title: 'SAMPLE — Corporate Car Service',
      meta_description: 'Sample meta description for the corporate travel service page.',
      h1: 'SAMPLE — Corporate Travel',
      intro_html: '<p>Sample intro paragraph describing corporate travel.</p>',
      body_html: '<h2>Sample section heading</h2><p>Sample body copy.</p>',
      faq_items: FAQ,
      related_locations: ['example-city'],
    },
    {
      ...DRAFT,
      slug: 'event-transfers',
      name: 'Event Transfers',
      service_type: 'event',
      price_from: 95,
      schema_service_type: 'Event Transportation',
      meta_title: 'SAMPLE — Event Car Service',
      meta_description: 'Sample meta description for the event transfer service page.',
      h1: 'SAMPLE — Event Transfers',
      intro_html: '<p>Sample intro paragraph describing event transfers.</p>',
      body_html: '<h2>Sample section heading</h2><p>Sample body copy.</p>',
      faq_items: FAQ,
      related_locations: ['example-city'],
    },
  ])
}

async function seedBlog() {
  await upsert('seo_blog', [{
    ...DRAFT,
    slug: 'sample-blog-post',
    title: 'SAMPLE — How to Choose a Chauffeur Service',
    author: 'Your Chauffeur Company',
    published_at: new Date().toISOString(),
    meta_title: 'SAMPLE — How to Choose a Chauffeur Service',
    meta_description: 'Sample meta description for a blog post.',
    h1: 'SAMPLE — How to Choose a Chauffeur Service',
    excerpt: 'Sample excerpt. Replace with a one-sentence summary of the post.',
    body_html: '<p>Sample blog body. Replace with your own article.</p><h2>Sample heading</h2><p>Sample paragraph.</p>',
    faq_items: FAQ,
    tags: ['sample'],
    primary_tag: 'sample',
    reading_time_minutes: 3,
    related_services: ['airport-transfers'],
    schema_article_type: 'BlogPosting',
  }])
}

async function main() {
  console.log('Seeding SAMPLE data (all SEO rows created as unpublished drafts)…\n')
  await seedPricing()
  await seedVehicles()
  await seedLocations()
  await seedAirports()
  await seedRoutes()
  await seedHotels()
  await seedCruisePorts()
  await seedAttractions()
  await seedDestinations()
  await seedServices()
  await seedBlog()
  console.log('\nDone. Next steps:')
  console.log('  1. Create your admin user — see docs/CLIENT_SETUP_CHECKLIST.md')
  console.log('  2. Replace this sample content with your own')
  console.log('  3. Set is_published = true only on rows you have rewritten')
}

main().catch(err => { console.error(err); process.exit(1) })
