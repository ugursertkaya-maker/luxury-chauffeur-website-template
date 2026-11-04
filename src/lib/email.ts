import { Resend } from 'resend'
import { brand, emailFrom, cityState } from '@/config/brand'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = emailFrom
const SITE = brand.site.url

function base(title: string, content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#eef0f2;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#eef0f2;padding:40px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

      <!-- HEADER -->
      <tr>
        <td style="background:linear-gradient(160deg,#0f1922 0%,#2b353d 100%);border-radius:12px 12px 0 0;padding:36px 40px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <p style="margin:0 0 3px;font-size:10px;letter-spacing:4px;color:#8fa4b4;text-transform:uppercase;font-weight:600;">${brand.company.displayName}</p>
                <p style="margin:0;font-size:22px;font-weight:300;color:#ffffff;letter-spacing:0.5px;">${title}</p>
              </td>
              <td align="right" style="vertical-align:middle;">
                <table cellpadding="0" cellspacing="0"><tr>
                  <td style="width:42px;height:42px;background:#ffffff;border-radius:8px;text-align:center;vertical-align:middle;">
                    <span style="color:#2b353d;font-weight:900;font-size:17px;line-height:42px;display:block;">${brand.company.shortName.charAt(0)}</span>
                  </td>
                </tr></table>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- BODY -->
      <tr>
        <td style="background:#ffffff;padding:36px 40px;">
          ${content}
        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td style="background:#2b353d;border-radius:0 0 12px 12px;padding:22px 40px;">
          <p style="margin:0 0 3px;font-size:10px;letter-spacing:3px;color:#8fa4b4;text-transform:uppercase;">${brand.company.displayName}</p>
          <p style="margin:0;font-size:12px;color:#c0cdd6;">${cityState} &nbsp;·&nbsp; <a href="${SITE}" style="color:#c0cdd6;text-decoration:none;">${SITE.replace('https://', '')}</a></p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
}

function detailRow(label: string, value: string) {
  return `<tr>
    <td style="padding:11px 0;border-bottom:1px solid #eef0f2;font-size:13px;color:#8fa4b4;width:42%;vertical-align:top;">${label}</td>
    <td style="padding:11px 0;border-bottom:1px solid #eef0f2;font-size:13px;color:#2b353d;font-weight:500;text-align:right;">${value}</td>
  </tr>`
}

function badge(text: string, color: 'green' | 'amber' | 'red' | 'blue') {
  const styles = {
    green: 'background:#e8f5e9;color:#2e7d32;',
    amber: 'background:#fff8e1;color:#f57f17;',
    red:   'background:#fce4e4;color:#c62828;',
    blue:  'background:#e3f0fb;color:#1565c0;',
  }
  return `<span style="display:inline-block;padding:4px 14px;border-radius:99px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;${styles[color]}">${text}</span>`
}

function ctaButton(text: string, href: string) {
  return `<table cellpadding="0" cellspacing="0" style="margin-top:28px;">
    <tr>
      <td style="background:#2b353d;border-radius:6px;">
        <a href="${href}" style="display:inline-block;padding:13px 32px;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#ffffff;text-decoration:none;">${text}</a>
      </td>
    </tr>
  </table>`
}

function formatDate(date: string) {
  try {
    return new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  } catch { return date }
}

function formatServiceType(s: string) {
  const map: Record<string, string> = {
    airport_transfer: 'Airport Transfer',
    hourly_charter: 'Hourly Charter',
    point_to_point: 'Point to Point',
    event_transfer: 'Event Transfer',
    wedding: 'Wedding',
    corporate: 'Corporate',
  }
  return map[s] ?? s
}

export async function sendBookingConfirmation(booking: {
  email: string; name: string; booking_number: string; service_type: string
  pickup_date: string; pickup_time: string; pickup_location: string
  dropoff_location?: string; passengers: number; total_price: number
  flight_number?: string; notes?: string
}) {
  const first = booking.name.split(' ')[0]

  const rows = [
    detailRow('Service', formatServiceType(booking.service_type)),
    detailRow('Date', formatDate(booking.pickup_date)),
    detailRow('Time', booking.pickup_time),
    detailRow('Pickup', booking.pickup_location),
    booking.dropoff_location ? detailRow('Drop-off', booking.dropoff_location) : '',
    detailRow('Passengers', String(booking.passengers)),
    booking.flight_number ? detailRow('Flight', booking.flight_number) : '',
    booking.notes ? detailRow('Special Request', booking.notes) : '',
  ].filter(Boolean).join('')

  const html = base('Booking Confirmed', `
    <p style="margin:0 0 6px;font-size:16px;color:#2b353d;font-weight:600;">Hi ${first},</p>
    <p style="margin:0 0 24px;font-size:14px;color:#475665;line-height:1.7;">Your reservation is confirmed and your payment has been received. We look forward to serving you.</p>

    ${badge('Confirmed &amp; Paid', 'green')}

    <div style="margin:24px 0 4px;padding:20px 24px;background:#f8f9fa;border-radius:8px;border-left:3px solid #2b353d;">
      <p style="margin:0 0 2px;font-size:10px;letter-spacing:3px;color:#8fa4b4;text-transform:uppercase;font-weight:600;">Booking Reference</p>
      <p style="margin:0;font-size:26px;font-weight:800;color:#2b353d;letter-spacing:3px;">${booking.booking_number}</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border-top:1px solid #eef0f2;">
      ${rows}
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#2b353d;border-radius:8px;">
      <tr>
        <td style="padding:16px 20px;font-size:13px;color:#c0cdd6;">Total Charged</td>
        <td style="padding:16px 20px;text-align:right;font-size:20px;font-weight:800;color:#ffffff;">$${Number(booking.total_price).toFixed(2)}</td>
      </tr>
    </table>

    <hr style="border:none;border-top:1px solid #eef0f2;margin:24px 0;">
    <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.7;">
      <strong style="color:#475665;">Cancellation Policy:</strong> Full refund if cancelled 24+ hours before pickup · 50% refund 2–24 hours before · No refund within 2 hours.
      <a href="${SITE}/cancellation-policy" style="color:#475665;">View full policy</a>
    </p>

    ${ctaButton('Manage Booking', `${SITE}/manage`)}
  `)

  await resend.emails.send({ from: FROM, to: booking.email, subject: `Booking Confirmed — ${booking.booking_number}`, html })
}

export async function sendModificationReceived(booking: {
  email: string; name: string; booking_number: string
}) {
  const first = booking.name.split(' ')[0]

  const html = base('Change Request Received', `
    <p style="margin:0 0 6px;font-size:16px;color:#2b353d;font-weight:600;">Hi ${first},</p>
    <p style="margin:0 0 24px;font-size:14px;color:#475665;line-height:1.7;">We have received your modification request for booking <strong style="color:#2b353d;">${booking.booking_number}</strong>.</p>

    ${badge('Under Review', 'amber')}

    <p style="margin:24px 0 0;font-size:14px;color:#475665;line-height:1.7;">Our team will review your request and apply the changes shortly. You will receive a confirmation email once everything is finalized.</p>

    ${ctaButton('View Booking', `${SITE}/manage`)}
  `)

  await resend.emails.send({ from: FROM, to: booking.email, subject: `Change Request Received — ${booking.booking_number}`, html })
}

export async function sendModificationApproved(booking: {
  email: string; name: string; booking_number: string
  pickup_date: string; pickup_time: string; pickup_location: string
  dropoff_location?: string; total_price: number
}) {
  const first = booking.name.split(' ')[0]

  const rows = [
    detailRow('Date', formatDate(booking.pickup_date)),
    detailRow('Time', booking.pickup_time),
    detailRow('Pickup', booking.pickup_location),
    booking.dropoff_location ? detailRow('Drop-off', booking.dropoff_location) : '',
  ].filter(Boolean).join('')

  const html = base('Booking Updated', `
    <p style="margin:0 0 6px;font-size:16px;color:#2b353d;font-weight:600;">Hi ${first},</p>
    <p style="margin:0 0 24px;font-size:14px;color:#475665;line-height:1.7;">Your reservation has been updated. Here are the confirmed details.</p>

    ${badge('Changes Approved', 'green')}

    <div style="margin:24px 0 4px;padding:16px 20px;background:#f8f9fa;border-radius:8px;border-left:3px solid #2b353d;">
      <p style="margin:0 0 2px;font-size:10px;letter-spacing:3px;color:#8fa4b4;text-transform:uppercase;font-weight:600;">Booking Reference</p>
      <p style="margin:0;font-size:20px;font-weight:800;color:#2b353d;letter-spacing:2px;">${booking.booking_number}</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border-top:1px solid #eef0f2;">
      ${rows}
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#2b353d;border-radius:8px;">
      <tr>
        <td style="padding:16px 20px;font-size:13px;color:#c0cdd6;">Updated Total</td>
        <td style="padding:16px 20px;text-align:right;font-size:20px;font-weight:800;color:#ffffff;">$${Number(booking.total_price).toFixed(2)}</td>
      </tr>
    </table>

    ${ctaButton('View Booking', `${SITE}/manage`)}
  `)

  await resend.emails.send({ from: FROM, to: booking.email, subject: `Booking Updated — ${booking.booking_number}`, html })
}

export async function sendCancellationEmail(booking: {
  email: string; name: string; booking_number: string
  pickup_date: string; pickup_time: string; total_price: number
  refunded?: boolean; refund_amount?: number
}) {
  const first = booking.name.split(' ')[0]

  const html = base('Booking Cancelled', `
    <p style="margin:0 0 6px;font-size:16px;color:#2b353d;font-weight:600;">Hi ${first},</p>
    <p style="margin:0 0 24px;font-size:14px;color:#475665;line-height:1.7;">Your reservation <strong style="color:#2b353d;">${booking.booking_number}</strong> has been cancelled.</p>

    ${badge('Cancelled', 'red')}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;border-top:1px solid #eef0f2;">
      ${detailRow('Date', formatDate(booking.pickup_date))}
      ${detailRow('Time', booking.pickup_time)}
      ${booking.refunded ? detailRow('Refund', `<span style="color:#2e7d32;font-weight:600;">$${Number(booking.refund_amount ?? booking.total_price).toFixed(2)} to your card on file</span>`) : ''}
    </table>

    ${booking.refunded ? `<p style="margin:0 0 20px;font-size:13px;color:#8fa4b4;line-height:1.7;">Refunds typically appear within 5–10 business days depending on your bank.</p>` : ''}

    <p style="margin:0;font-size:13px;color:#8fa4b4;">Questions? <a href="mailto:${brand.contact.emailInfo}" style="color:#2b353d;font-weight:600;text-decoration:none;">${brand.contact.emailInfo}</a></p>
  `)

  await resend.emails.send({ from: FROM, to: booking.email, subject: `Booking Cancelled — ${booking.booking_number}`, html })
}

export async function sendDriverAssignedEmail(booking: {
  email: string; name: string; booking_number: string
  pickup_date: string; pickup_time: string
  driver_name: string; driver_phone: string
  vehicle_make?: string; vehicle_model?: string; vehicle_plate?: string
}) {
  const first = booking.name.split(' ')[0]

  const html = base('Your Chauffeur Is Ready', `
    <p style="margin:0 0 6px;font-size:16px;color:#2b353d;font-weight:600;">Hi ${first},</p>
    <p style="margin:0 0 24px;font-size:14px;color:#475665;line-height:1.7;">Your dedicated chauffeur has been assigned for booking <strong style="color:#2b353d;">${booking.booking_number}</strong>.</p>

    ${badge('Chauffeur Assigned', 'blue')}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;border-top:1px solid #eef0f2;">
      ${detailRow('Date', formatDate(booking.pickup_date))}
      ${detailRow('Time', booking.pickup_time)}
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;border-radius:8px;border:1px solid #eef0f2;border-left:3px solid #2b353d;">
      <tr><td style="padding:16px 20px 8px;" colspan="2">
        <p style="margin:0;font-size:10px;letter-spacing:3px;color:#8fa4b4;text-transform:uppercase;font-weight:600;">Your Chauffeur</p>
      </td></tr>
      <tr><td style="padding:0 20px 16px;" colspan="2">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${detailRow('Name', booking.driver_name)}
          ${detailRow('Phone', booking.driver_phone)}
          ${booking.vehicle_make ? detailRow('Vehicle', `${booking.vehicle_make} ${booking.vehicle_model ?? ''}`) : ''}
          ${booking.vehicle_plate ? detailRow('Plate', booking.vehicle_plate) : ''}
        </table>
      </td></tr>
    </table>

    <p style="margin:20px 0 0;font-size:13px;color:#8fa4b4;line-height:1.7;">You will receive further updates as your pickup time approaches. Feel free to contact your chauffeur directly using the details above.</p>

    ${ctaButton('View Booking', `${SITE}/manage`)}
  `)

  await resend.emails.send({ from: FROM, to: booking.email, subject: `Your Chauffeur Is Ready — ${booking.booking_number}`, html })
}

export async function sendCustomEmail(p: { email: string; name: string; subject: string; message: string }) {
  const html = base(p.subject, `
    <p style="margin:0 0 16px;font-size:15px;color:#2b353d;font-weight:600;">Hi ${p.name},</p>
    <div style="font-size:14px;color:#475665;line-height:1.8;white-space:pre-wrap;">${p.message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    <p style="margin:24px 0 0;font-size:13px;color:#8fa4b4;">${brand.company.displayName} — ${cityState}</p>
  `)
  await resend.emails.send({ from: FROM, to: p.email, subject: p.subject, html })
}
