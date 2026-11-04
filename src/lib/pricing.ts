import { ServiceType, PriceCalculation } from '@/types'
import { getSupabaseAdmin } from '@/lib/supabase'

type Rates = { base: number; perMile?: number; perHour?: number }

const VEHICLE_RATES: Record<string, Record<ServiceType, Rates>> = {
  suv: {
    airport:   { base: 98, perMile: 3.56 },
    corporate: { base: 98, perMile: 3.56 },
    wedding:   { base: 150, perMile: 4.20 },
    hourly:    { base: 0, perHour: 105 },
    cruise:    { base: 98, perMile: 3.56 },
    event:     { base: 0, perHour: 115 },
  },
  sedan: {
    airport:   { base: 85, perMile: 2.56 },
    corporate: { base: 85, perMile: 2.56 },
    wedding:   { base: 120, perMile: 3.20 },
    hourly:    { base: 0, perHour: 90 },
    cruise:    { base: 85, perMile: 2.56 },
    event:     { base: 0, perHour: 100 },
  },
}

const SERVICE_MULTIPLIERS: Partial<Record<ServiceType, { baseMulti: number; mileMulti: number }>> = {
  wedding: { baseMulti: 1.55, mileMulti: 1.35 },
}

const DEFAULT_SURCHARGES = {
  night_fee:        { label: 'Night / Early Morning Fee (10pm–6am)', amount: 25 },
  weekend_fee:      { label: 'Weekend Surcharge', amount: 15 },
  airport_meetgreet:{ label: 'Airport Meet & Greet', amount: 20 },
  airport_pickup:   { label: 'Airport Pickup Fee', amount: 0 },
  airport_dropoff:  { label: 'Airport Drop-off Fee', amount: 0 },
}

type SurchargeMap = Record<string, { label: string; amount: number }>

export type CountyRates = {
  sedan_base: number
  sedan_per_mile: number
  suv_base: number
  suv_per_mile: number
  min_fare: number
  sedan_hourly?: number | null
  suv_hourly?: number | null
  sedan_event?: number | null
  suv_event?: number | null
}

let surchargeCache: { data: SurchargeMap; at: number } | null = null

export async function getSurcharges(): Promise<SurchargeMap> {
  if (surchargeCache && Date.now() - surchargeCache.at < 5 * 60 * 1000) return surchargeCache.data
  try {
    const db = getSupabaseAdmin()
    const { data } = await db.from('pricing_surcharges').select('key, label, amount')
    if (data && data.length > 0) {
      const map: SurchargeMap = {}
      for (const row of data) map[row.key] = { label: row.label, amount: Number(row.amount) }
      surchargeCache = { data: map, at: Date.now() }
      return map
    }
  } catch {}
  return DEFAULT_SURCHARGES
}

export async function calculatePriceAsync(params: {
  serviceType: ServiceType
  distanceMiles: number
  hours?: number
  pickupDateTime: Date
  meetAndGreet?: boolean
  vehicleId?: string
  countyRates?: CountyRates | null
}): Promise<PriceCalculation> {
  const surcharges = await getSurcharges()
  return calculatePrice({ ...params, surchargeOverrides: surcharges })
}

export function calculatePrice(params: {
  serviceType: ServiceType
  distanceMiles: number
  hours?: number
  pickupDateTime: Date
  meetAndGreet?: boolean
  vehicleId?: string
  surchargeOverrides?: SurchargeMap
  countyRates?: CountyRates | null
}): PriceCalculation {
  const {
    serviceType, distanceMiles, hours = 1, pickupDateTime,
    meetAndGreet, vehicleId = 'suv',
    surchargeOverrides, countyRates,
  } = params

  const S = surchargeOverrides ?? DEFAULT_SURCHARGES
  const isHourly = serviceType === 'hourly' || serviceType === 'event'
  const isEvent = serviceType === 'event'
  const isSuv = vehicleId !== 'sedan'

  // Resolve rates
  let base = 0
  let perMile: number | undefined
  let perHour: number | undefined

  if (isHourly) {
    // County-specific hourly rate, fallback to hardcoded
    if (countyRates) {
      perHour = isSuv
        ? (isEvent ? (countyRates.suv_event   ?? VEHICLE_RATES.suv.event.perHour)   : (countyRates.suv_hourly   ?? VEHICLE_RATES.suv.hourly.perHour))
        : (isEvent ? (countyRates.sedan_event ?? VEHICLE_RATES.sedan.event.perHour) : (countyRates.sedan_hourly ?? VEHICLE_RATES.sedan.hourly.perHour))
    } else {
      perHour = (VEHICLE_RATES[vehicleId] ?? VEHICLE_RATES.suv)[serviceType].perHour
    }
  } else if (countyRates) {
    const rawBase = isSuv ? countyRates.suv_base : countyRates.sedan_base
    const rawPerMile = isSuv ? countyRates.suv_per_mile : countyRates.sedan_per_mile
    const multi = SERVICE_MULTIPLIERS[serviceType]
    base = multi ? Math.round(rawBase * multi.baseMulti * 100) / 100 : rawBase
    perMile = multi ? Math.round(rawPerMile * multi.mileMulti * 100) / 100 : rawPerMile
  } else {
    const rates = (VEHICLE_RATES[vehicleId] ?? VEHICLE_RATES.suv)[serviceType]
    base = rates.base
    perMile = rates.perMile
  }

  const breakdown: string[] = []
  let distance_charge = 0
  let time_charge = 0

  if (isHourly) {
    time_charge = (perHour ?? 0) * hours
    breakdown.push(`${hours}h × $${perHour}/hr = $${time_charge}`)
  } else {
    distance_charge = distanceMiles * (perMile ?? 0)
    breakdown.push(`Base: $${base}`)
    breakdown.push(`${distanceMiles.toFixed(1)} mi × $${perMile}/mi = $${distance_charge.toFixed(2)}`)
  }

  const surcharges: { label: string; amount: number }[] = []
  const hour = pickupDateTime.getHours()
  if (hour >= 22 || hour < 6) surcharges.push(S.night_fee)

  const day = pickupDateTime.getDay()
  if ((day === 0 || day === 6) && serviceType !== 'wedding') surcharges.push(S.weekend_fee)

  if (serviceType === 'airport') {
    if (meetAndGreet) surcharges.push(S.airport_meetgreet)
    if (S.airport_pickup?.amount > 0) surcharges.push(S.airport_pickup)
  }

  const surchargeTotal = surcharges.reduce((sum, s) => sum + s.amount, 0)
  const rawTotal = base + distance_charge + time_charge + surchargeTotal
  const minFare = countyRates?.min_fare ?? 0
  const total = Math.round(Math.max(rawTotal, minFare) * 100) / 100

  return {
    base,
    per_mile: perMile ?? null,
    per_hour: perHour ?? null,
    distance_charge,
    time_charge,
    surcharges,
    total,
    breakdown,
  }
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}
