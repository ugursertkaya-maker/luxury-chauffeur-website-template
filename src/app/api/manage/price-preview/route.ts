import { getSupabaseAdmin } from '@/lib/supabase'
import { calculatePrice, CountyRates } from '@/lib/pricing'
import { ServiceType } from '@/types'

type GeoComponent = { long_name: string; types: string[] }

async function lookupCountyRates(location: string): Promise<CountyRates | null> {
  const key = process.env.GOOGLE_MAPS_SERVER_KEY
  if (!key || !location) return null

  const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${key}`
  const geoRes = await fetch(geoUrl)
  const geoData = await geoRes.json() as { results: { address_components: GeoComponent[] }[] }
  const components = geoData.results?.[0]?.address_components ?? []
  const get = (type: string) => components.find(c => c.types.includes(type))?.long_name ?? ''
  const city = get('locality') || get('sublocality')
  const county = get('administrative_area_level_2')
  const state = get('administrative_area_level_1')

  const db = getSupabaseAdmin()

  if (city && county) {
    const { data: cityRate } = await db.from('city_pricing').select('*').eq('county', county).ilike('city', city).single()
    if (cityRate) return { sedan_base: Number(cityRate.sedan_base), sedan_per_mile: Number(cityRate.sedan_per_mile), suv_base: Number(cityRate.suv_base), suv_per_mile: Number(cityRate.suv_per_mile), min_fare: Number(cityRate.min_fare) }
  }

  if (county) {
    const { data: countyRate } = await db.from('county_pricing').select('*').eq('county', county).single()
    if (countyRate) return { sedan_base: Number(countyRate.sedan_base), sedan_per_mile: Number(countyRate.sedan_per_mile), suv_base: Number(countyRate.suv_base), suv_per_mile: Number(countyRate.suv_per_mile), min_fare: Number(countyRate.min_fare) }
  }

  // Falls back to the single '__default__' county_pricing row seeded by
  // scripts/seed-example.ts. Add region-specific rows and branch on `state`
  // here if you want different fallbacks per state.
  void state
  const { data: fallback } = await db.from('county_pricing').select('*').eq('county', '__default__').single()
  if (fallback) return { sedan_base: Number(fallback.sedan_base), sedan_per_mile: Number(fallback.sedan_per_mile), suv_base: Number(fallback.suv_base), suv_per_mile: Number(fallback.suv_per_mile), min_fare: Number(fallback.min_fare) }

  return null
}

export async function POST(request: Request) {
  const body = await request.json()
  const { booking_number, email, new_pickup, new_dropoff } = body

  if (!booking_number || !email || !new_pickup || !new_dropoff) {
    return Response.json({ error: 'Missing fields' }, { status: 400 })
  }

  const db = getSupabaseAdmin()
  const { data: booking } = await db
    .from('bookings')
    .select('service_type, pickup_date, pickup_time, hours, total_price, meet_greet, vehicle_id')
    .eq('booking_number', booking_number.toUpperCase())
    .eq('email', email.toLowerCase())
    .single()

  if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 })

  const key = process.env.GOOGLE_MAPS_SERVER_KEY
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(new_pickup)}&destinations=${encodeURIComponent(new_dropoff)}&units=imperial&key=${key}`
  const res = await fetch(url)
  const data = await res.json()
  const element = data.rows?.[0]?.elements?.[0]
  if (!element || element.status !== 'OK') {
    return Response.json({ error: 'Route not found. Please check the addresses.' }, { status: 400 })
  }

  const distanceMiles = element.distance.value / 1609.34
  const pickupDateTime = new Date(`${booking.pickup_date}T${booking.pickup_time}`)
  const countyRates = await lookupCountyRates(new_pickup)

  const calc = calculatePrice({
    serviceType: booking.service_type as ServiceType,
    distanceMiles,
    hours: booking.hours,
    pickupDateTime,
    meetAndGreet: booking.meet_greet,
    vehicleId: booking.vehicle_id ?? 'suv',
    countyRates,
  })

  const oldPrice = booking.total_price
  const newPrice = calc.total
  const diff = Math.round((newPrice - oldPrice) * 100) / 100

  return Response.json({
    old_price: oldPrice,
    new_price: newPrice,
    diff,
    action: diff > 0 ? 'charge' : diff < 0 ? 'refund' : 'same',
    distance: element.distance.text,
  })
}
