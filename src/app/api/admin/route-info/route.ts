import { NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const origin = req.nextUrl.searchParams.get('origin')
  const destination = req.nextUrl.searchParams.get('destination')
  if (!origin || !destination) return Response.json({ error: 'Missing params' }, { status: 400 })

  const key = process.env.GOOGLE_MAPS_SERVER_KEY
  if (!key) return Response.json({ error: 'No API key' }, { status: 500 })

  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=driving&key=${key}`
  const res = await fetch(url)
  const data = await res.json()

  if (data.status !== 'OK') return Response.json({ error: data.status }, { status: 400 })

  const leg = data.routes[0]?.legs[0]
  return Response.json({
    distance: leg?.distance?.text,
    distance_miles: Math.round((leg?.distance?.value ?? 0) / 1609.34 * 10) / 10,
    duration: leg?.duration?.text,
    duration_minutes: Math.round((leg?.duration?.value ?? 0) / 60),
  })
}
