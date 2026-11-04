export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const origin = searchParams.get('origin')
  const destination = searchParams.get('destination')

  if (!origin || !destination) {
    return Response.json({ error: 'Missing parameters' }, { status: 400 })
  }

  const key = process.env.GOOGLE_MAPS_SERVER_KEY
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&units=imperial&key=${key}`

  const res = await fetch(url)
  const data = await res.json()

  const element = data.rows?.[0]?.elements?.[0]
  if (!element || element.status !== 'OK') {
    return Response.json({ error: 'Route not found' }, { status: 404 })
  }

  const distanceMiles = element.distance.value / 1609.34

  return Response.json({
    distance: element.distance.text,
    duration: element.duration.text,
    distanceMiles,
  })
}
