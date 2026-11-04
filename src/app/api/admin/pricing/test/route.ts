import { calculatePriceAsync, CountyRates } from '@/lib/pricing'
import { getSupabaseAdmin } from '@/lib/supabase'
import { ServiceType } from '@/types'

async function lookupCountyRates(_location: string): Promise<CountyRates | null> {
  const db = getSupabaseAdmin()
  const { data } = await db.from('county_pricing').select('*').eq('county', '__default__').single()
  if (!data) return null
  return {
    sedan_base: Number(data.sedan_base), sedan_per_mile: Number(data.sedan_per_mile),
    suv_base: Number(data.suv_base), suv_per_mile: Number(data.suv_per_mile),
    min_fare: Number(data.min_fare),
    sedan_hourly: data.sedan_hourly ? Number(data.sedan_hourly) : null,
    suv_hourly:   data.suv_hourly   ? Number(data.suv_hourly)   : null,
    sedan_event:  data.sedan_event  ? Number(data.sedan_event)  : null,
    suv_event:    data.suv_event    ? Number(data.suv_event)    : null,
  }
}

export async function POST(request: Request) {
  const body = await request.json() as {
    pickup: string
    dropoff: string
    date: string
    time: string
    vehicle: string
    service_type: ServiceType
    meet_greet?: boolean
    hours?: number
  }

  const { pickup, dropoff, date, time, vehicle, service_type, meet_greet, hours } = body
  if (!pickup || !dropoff || !date || !time) {
    return Response.json({ error: 'Missing fields' }, { status: 400 })
  }

  const key = process.env.GOOGLE_MAPS_SERVER_KEY
  const distUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(pickup)}&destinations=${encodeURIComponent(dropoff)}&units=imperial&key=${key}`
  const distRes = await fetch(distUrl)
  const distData = await distRes.json() as { rows: { elements: { status: string; distance: { value: number; text: string }; duration: { text: string } }[] }[] }
  const element = distData.rows?.[0]?.elements?.[0]
  if (!element || element.status !== 'OK') {
    return Response.json({ error: 'Addresses could not be found. Please check them and try again.' }, { status: 400 })
  }

  const distanceMiles = element.distance.value / 1609.34
  const pickupDateTime = new Date(`${date}T${time}`)
  const countyRates = await lookupCountyRates(pickup)

  const calc = await calculatePriceAsync({
    serviceType: service_type,
    distanceMiles,
    hours: hours ?? 2,
    pickupDateTime,
    meetAndGreet: meet_greet,
    vehicleId: vehicle,
    countyRates,
  })

  return Response.json({
    total: calc.total,
    base: calc.base,
    distance_charge: calc.distance_charge,
    time_charge: calc.time_charge,
    surcharges: calc.surcharges,
    breakdown: calc.breakdown,
    distance_text: element.distance.text,
    duration_text: element.duration.text,
    distance_miles: Math.round(distanceMiles * 10) / 10,
    county_rates: countyRates,
    per_mile: calc.per_mile,
    per_hour: calc.per_hour,
  })
}
