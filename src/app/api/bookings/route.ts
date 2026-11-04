import { getSupabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'
import { brand, cityState } from '@/config/brand'

const resend = new Resend(process.env.RESEND_API_KEY)

function generateBookingNumber(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = 'MAX-'
  for (let i = 0; i < 6; i++) result += chars[Math.floor(Math.random() * chars.length)]
  return result
}

export async function POST(request: Request) {
  const body = await request.json()
  const db = getSupabaseAdmin()

  const { data, error } = await db
    .from('bookings')
    .insert({
      booking_number: generateBookingNumber(),
      service_type: body.service_type,
      pickup_location: body.pickup_location,
      dropoff_location: body.dropoff_location || null,
      pickup_date: body.pickup_date,
      pickup_time: body.pickup_time,
      hours: body.hours || null,
      passengers: body.passengers,
      flight_number: body.flight_number || null,
      meet_greet: body.meet_greet || false,
      name: body.name,
      email: body.email,
      phone: body.phone,
      notes: body.notes || null,
      estimated_miles: body.estimated_miles || null,
      vehicle_id: body.vehicle_id || null,
      total_price: body.total_price,
      price_base: body.price_base || null,
      price_per_mile: body.price_per_mile || null,
      price_distance_charge: body.price_distance_charge || null,
      price_time_charge: body.price_time_charge || null,
      price_surcharges: body.price_surcharges || null,
      discount_code: body.discount_code || null,
      discount_amount: body.discount_amount || 0,
      corporate_account_id: body.corporate_account_id || null,
      invoice_status: body.corporate_account_id ? 'none' : null,
      status: body.corporate_account_id ? 'confirmed' : 'pending',
      payment_status: body.corporate_account_id ? 'corporate' : 'pending',
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  const isCorporate = !!body.corporate_account_id

  const email = (body.email as string).toLowerCase()

  // Corporate booking emails
  if (isCorporate && data) {
    void sendCorporateBookingEmails(db, data, body)
  }

  // Auto-subscribe to email list
  void db.from('email_subscribers').upsert(
    { email, name: body.name, source: 'booking' },
    { onConflict: 'email', ignoreDuplicates: true }
  )

  // Record discount code usage
  if (body.discount_code && body.discount_amount > 0) {
    db.from('discount_codes')
      .select('id')
      .eq('code', (body.discount_code as string).toUpperCase())
      .single()
      .then(({ data: dc }) => {
        if (!dc) return
        Promise.all([
          db.from('discount_code_uses').insert({
            code_id: dc.id,
            code: body.discount_code.toUpperCase(),
            email,
            booking_id: data?.id,
            discount_amount: body.discount_amount,
          }),
          db.rpc('increment_discount_uses', { code_id: dc.id }),
        ]).catch(() => {})
      })
  }

  return Response.json({ ...data, is_corporate: isCorporate })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendCorporateBookingEmails(db: any, booking: any, body: any) {
  // Fetch corporate account for billing email
  const { data: account } = await db
    .from('corporate_accounts')
    .select('company_name, contact_name, billing_email, contact_email')
    .eq('id', body.corporate_account_id)
    .single()

  if (!account) return

  const billingEmail = account.billing_email || account.contact_email
  const bn = booking.booking_number
  const pickup = booking.pickup_date
  const pickupTime = booking.pickup_time?.slice(0, 5) ?? ''
  const from = booking.pickup_location
  const to = booking.dropoff_location ?? '—'
  const passenger = booking.name
  const price = `$${Number(booking.total_price).toFixed(2)}`

  // 1. Passenger confirmation (no corporate note)
  await resend.emails.send({
    from: brand.contact.emailReservations,
    to: booking.email,
    subject: `Booking Confirmed — ${bn} · ${brand.company.displayName}`,
    html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">
  <tr><td style="background:#0f1922;padding:28px 36px;border-radius:12px 12px 0 0">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td><div style="color:#fff;font-size:17px;font-weight:900;letter-spacing:2px">${brand.company.displayName.toUpperCase()}</div><div style="color:#c9a96e;font-size:8px;letter-spacing:4px;margin-top:3px">PREMIUM TRANSPORTATION</div></td>
      <td align="right"><div style="color:#c9a96e;font-size:8px;letter-spacing:3px">CONFIRMED</div><div style="color:#fff;font-size:13px;font-weight:900;margin-top:3px">${bn}</div></td>
    </tr></table>
  </td></tr>
  <tr><td style="background:#c9a96e;height:3px"></td></tr>
  <tr><td style="background:#fff;padding:30px 36px">
    <p style="color:#0f1922;font-size:15px;font-weight:700;margin:0 0 4px">Dear ${passenger},</p>
    <p style="color:#64748b;font-size:13px;line-height:1.7;margin:0 0 24px">Your reservation has been confirmed. Please review the details below.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:10px;padding:20px;border:1px solid #e2e8f0">
      <tr><td style="padding:6px 0;color:#94a3b8;font-size:12px;width:130px">Booking #</td><td style="padding:6px 0;color:#0f1922;font-size:12px;font-weight:700;font-family:monospace">${bn}</td></tr>
      <tr><td style="padding:6px 0;color:#94a3b8;font-size:12px">Date</td><td style="padding:6px 0;color:#334155;font-size:12px">${pickup} ${pickupTime}</td></tr>
      <tr><td style="padding:6px 0;color:#94a3b8;font-size:12px">Pickup</td><td style="padding:6px 0;color:#334155;font-size:12px">${from}</td></tr>
      <tr><td style="padding:6px 0;color:#94a3b8;font-size:12px">Dropoff</td><td style="padding:6px 0;color:#334155;font-size:12px">${to}</td></tr>
      <tr><td style="padding:6px 0;color:#94a3b8;font-size:12px">Passenger</td><td style="padding:6px 0;color:#334155;font-size:12px">${passenger}</td></tr>
      <tr><td style="padding:6px 0;color:#94a3b8;font-size:12px">Total</td><td style="padding:6px 0;color:#0f1922;font-size:13px;font-weight:900">${price}</td></tr>
    </table>

    <p style="color:#64748b;font-size:12px;line-height:1.7;margin:20px 0 0">
      Your chauffeur will contact you 24 hours before pickup.<br/>
      Questions? <a href="mailto:${brand.contact.emailReservations}" style="color:#0f1922;font-weight:700">${brand.contact.emailReservations}</a> · ${brand.contact.phone}
    </p>
  </td></tr>
  <tr><td style="background:#0f1922;padding:16px 36px;border-radius:0 0 12px 12px;text-align:center">
    <div style="color:#94a3b8;font-size:11px">${brand.company.displayName} · ${cityState} · ${brand.site.domain}</div>
  </td></tr>
</table></td></tr></table></body></html>`,
  }).catch(() => {})

  // 2. Corporate account notification (with corporate responsibility note)
  await resend.emails.send({
    from: brand.contact.emailReservations,
    to: billingEmail,
    replyTo: brand.contact.emailReservations,
    subject: `New Reservation — ${bn} · ${account.company_name}`,
    html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">

  <tr><td style="background:#0f1922;padding:28px 36px;border-radius:12px 12px 0 0">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td><div style="color:#fff;font-size:17px;font-weight:900;letter-spacing:2px">${brand.company.displayName.toUpperCase()}</div><div style="color:#c9a96e;font-size:8px;letter-spacing:4px;margin-top:3px">CORPORATE BOOKING NOTICE</div></td>
      <td align="right"><div style="color:#c9a96e;font-size:8px;letter-spacing:3px">BOOKING #</div><div style="color:#fff;font-size:13px;font-weight:900;margin-top:3px">${bn}</div></td>
    </tr></table>
  </td></tr>
  <tr><td style="background:#c9a96e;height:3px"></td></tr>

  <tr><td style="background:#fff;padding:30px 36px">
    <p style="color:#0f1922;font-size:15px;font-weight:700;margin:0 0 4px">Dear ${account.contact_name},</p>
    <p style="color:#64748b;font-size:13px;line-height:1.7;margin:0 0 22px">
      A new reservation has been placed under <strong style="color:#334155">${account.company_name}</strong>'s corporate account
      and will be added to your next invoice.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:10px;padding:20px;border:1px solid #e2e8f0;margin-bottom:22px">
      <tr><td style="padding:6px 0;color:#94a3b8;font-size:12px;width:130px">Booking #</td><td style="padding:6px 0;color:#0f1922;font-size:12px;font-weight:700;font-family:monospace">${bn}</td></tr>
      <tr><td style="padding:6px 0;color:#94a3b8;font-size:12px">Date & Time</td><td style="padding:6px 0;color:#334155;font-size:12px;font-weight:700">${pickup} at ${pickupTime}</td></tr>
      <tr><td style="padding:6px 0;color:#94a3b8;font-size:12px">Pickup</td><td style="padding:6px 0;color:#334155;font-size:12px">${from}</td></tr>
      <tr><td style="padding:6px 0;color:#94a3b8;font-size:12px">Dropoff</td><td style="padding:6px 0;color:#334155;font-size:12px">${to}</td></tr>
      <tr><td style="padding:6px 0;color:#94a3b8;font-size:12px">Passenger</td><td style="padding:6px 0;color:#334155;font-size:12px">${passenger}</td></tr>
      <tr><td style="padding:6px 0;color:#94a3b8;font-size:12px">Fare</td><td style="padding:6px 0;color:#0f1922;font-size:13px;font-weight:900">${price}</td></tr>
    </table>

    <div style="background:#fff7ed;border-left:4px solid #f59e0b;border-radius:6px;padding:16px 18px">
      <div style="color:#d97706;font-size:9px;font-weight:700;letter-spacing:3px;margin-bottom:8px">IMPORTANT — PLEASE READ</div>
      <div style="color:#92400e;font-size:12px;line-height:1.8">
        If this reservation was <strong>not authorized or planned by your company</strong>, you must notify us
        <strong>at least 6 hours before the scheduled pickup time</strong> to request cancellation.<br/><br/>
        To dispute or cancel an unrecognized ride, reply to this email or contact us at
        <a href="mailto:${brand.contact.emailReservations}" style="color:#92400e;font-weight:700">${brand.contact.emailReservations}</a>
        quoting booking number <strong>${bn}</strong>.<br/><br/>
        <strong>Failure to cancel an unauthorized booking before the 6-hour cutoff remains the responsibility
        of ${account.company_name}.</strong> The charge will appear on your next invoice regardless.
      </div>
    </div>
  </td></tr>

  <tr><td style="background:#f8fafc;padding:18px 36px;border-top:1px solid #e2e8f0">
    <div style="color:#64748b;font-size:12px;line-height:1.8">
      Questions: <a href="mailto:${brand.contact.emailReservations}" style="color:#0f1922;font-weight:700">${brand.contact.emailReservations}</a> · ${brand.contact.phone}<br/>
      All disputes must be submitted in writing via email.
    </div>
  </td></tr>

  <tr><td style="background:#0f1922;padding:16px 36px;border-radius:0 0 12px 12px;text-align:center">
    <div style="color:#94a3b8;font-size:11px">${brand.company.displayName} · ${cityState} · ${brand.site.domain}</div>
  </td></tr>

</table></td></tr></table></body></html>`,
  }).catch(() => {})
}

export async function GET() {
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}
