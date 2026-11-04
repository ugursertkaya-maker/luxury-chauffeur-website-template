import { NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const flight = req.nextUrl.searchParams.get('flight')
  if (!flight) return Response.json({ error: 'Missing flight' }, { status: 400 })

  // Normalize: remove spaces, uppercase
  const ident = flight.replace(/\s+/g, '').toUpperCase()

  // AviationStack (free tier) — fallback to FlightAware AeroAPI if key exists
  const aviationKey = process.env.AVIATIONSTACK_API_KEY
  const aeroKey = process.env.FLIGHTAWARE_API_KEY

  if (aeroKey) {
    try {
      const res = await fetch(
        `https://aeroapi.flightaware.com/aeroapi/flights/${ident}`,
        { headers: { 'x-apikey': aeroKey } }
      )
      if (res.ok) {
        const data = await res.json()
        const flight = data.flights?.[0]
        if (flight) {
          const delay = flight.departure_delay ? Math.round(flight.departure_delay / 60) : null
          return Response.json({
            ident: flight.ident,
            status: flight.status,
            origin: flight.origin?.code_iata,
            destination: flight.destination?.code_iata,
            scheduled_out: flight.scheduled_out,
            actual_out: flight.actual_out,
            estimated_in: flight.estimated_in,
            actual_in: flight.actual_in,
            delay_minutes: delay,
          })
        }
      }
    } catch { /* fall through */ }
  }

  if (aviationKey) {
    try {
      const res = await fetch(
        `http://api.aviationstack.com/v1/flights?access_key=${aviationKey}&flight_iata=${ident}&limit=1`
      )
      if (res.ok) {
        const data = await res.json()
        const f = data.data?.[0]
        if (f) {
          const depDelay = f.departure?.delay
          const statusMap: Record<string, string> = {
            scheduled: 'Scheduled',
            active: 'In Air',
            landed: 'Landed',
            cancelled: 'Cancelled',
            incident: 'Incident',
            diverted: 'Diverted',
          }
          return Response.json({
            ident: f.flight?.iata,
            status: statusMap[f.flight_status] ?? f.flight_status,
            origin: f.departure?.iata,
            destination: f.arrival?.iata,
            scheduled_out: f.departure?.scheduled,
            actual_out: f.departure?.actual,
            scheduled_in: f.arrival?.scheduled,
            estimated_in: f.arrival?.estimated ?? f.arrival?.scheduled,
            actual_in: f.arrival?.actual,
            delay_minutes: depDelay ?? null,
          })
        }
      }
    } catch { /* fall through */ }
  }

  // No API key configured — return link only
  return Response.json({ error: 'no_api_key', flight_number: ident }, { status: 200 })
}
