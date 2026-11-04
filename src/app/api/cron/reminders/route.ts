import { getSupabaseAdmin } from '@/lib/supabase'
import { brand } from '@/config/brand'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('secret') !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getSupabaseAdmin()
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const date = tomorrow.toISOString().split('T')[0]

  const { data: bookings } = await db
    .from('bookings')
    .select('*, drivers(name, phone, vehicles(make, model, plate))')
    .eq('pickup_date', date)
    .eq('status', 'confirmed')
    .not('driver_id', 'is', null)

  if (!bookings?.length) return Response.json({ sent: 0 })

  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_PHONE_NUMBER

  let sent = 0
  for (const b of bookings) {
    if (!b.phone) continue
    const driver = b.drivers as { name: string; phone: string; vehicles?: { make?: string; model?: string; plate?: string } | null } | null
    const vehicle = driver?.vehicles
    const first = b.name?.split(' ')[0] ?? 'there'

    const msg = [
      `Hi ${first}, reminder: your ${brand.company.displayName} ride is tomorrow at ${b.pickup_time}.`,
      `Pickup: ${b.pickup_location}`,
      driver ? `Driver: ${driver.name} · ${driver.phone}` : null,
      vehicle?.plate ? `Vehicle: ${vehicle.make ?? ''} ${vehicle.model ?? ''} · Plate: ${vehicle.plate}` : null,
      `Booking: ${b.booking_number}`,
      `Questions? Reply to this message.`,
    ].filter(Boolean).join('\n')

    await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: b.phone, From: from!, Body: msg }).toString(),
    })
    sent++
  }

  return Response.json({ sent })
}
