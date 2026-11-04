import { getSupabaseAdmin } from '@/lib/supabase'
import { getAdminSession } from '@/lib/auth'
import { Resend } from 'resend'
import { brand, cityState } from '@/config/brand'

const resend = new Resend(process.env.RESEND_API_KEY)
const MARKETING_FROM = `${brand.company.displayName} <${brand.contact.emailInfo}>`
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? brand.site.url

function buildHtml(subject: string, message: string, recipientName: string | null, unsubToken: string) {
  const greeting = recipientName ? `Hi ${recipientName.split(' ')[0]},` : 'Hello,'
  const escaped = message.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')
  const unsubUrl = `${SITE}/unsubscribe?token=${unsubToken}`
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#eef0f2;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#eef0f2;padding:40px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
      <tr>
        <td style="background:linear-gradient(160deg,#0f1922 0%,#2b353d 100%);border-radius:12px 12px 0 0;padding:36px 40px;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td>
              <p style="margin:0 0 3px;font-size:10px;letter-spacing:4px;color:#8fa4b4;text-transform:uppercase;font-weight:600;">${brand.company.displayName}</p>
              <p style="margin:0;font-size:22px;font-weight:300;color:#ffffff;">${subject}</p>
            </td>
            <td align="right" style="vertical-align:middle;">
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="width:42px;height:42px;background:#ffffff;border-radius:8px;text-align:center;vertical-align:middle;">
                  <span style="color:#2b353d;font-weight:900;font-size:17px;line-height:42px;display:block;">M</span>
                </td>
              </tr></table>
            </td>
          </tr></table>
        </td>
      </tr>
      <tr>
        <td style="background:#ffffff;padding:36px 40px;">
          <p style="margin:0 0 16px;font-size:15px;color:#2b353d;font-weight:600;">${greeting}</p>
          <div style="font-size:14px;color:#475665;line-height:1.8;">${escaped}</div>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0 0;">
            <tr><td align="center">
              <a href="${SITE}/book" style="display:inline-block;background:#2b353d;color:#ffffff;font-weight:700;font-size:14px;padding:14px 32px;border-radius:10px;text-decoration:none;">Book a Ride →</a>
            </td></tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="background:#2b353d;border-radius:0 0 12px 12px;padding:22px 40px;">
          <p style="margin:0 0 3px;font-size:10px;letter-spacing:3px;color:#8fa4b4;text-transform:uppercase;">${brand.company.displayName}</p>
          <p style="margin:0;font-size:12px;color:#c0cdd6;">${cityState} &nbsp;·&nbsp;
            <a href="${SITE}" style="color:#c0cdd6;text-decoration:none;">${SITE.replace('https://', '')}</a>
          </p>
          <p style="margin:10px 0 0;font-size:11px;color:#8fa4b4;">
            You received this because you booked or subscribed with ${brand.company.displayName}.
            &nbsp;<a href="${unsubUrl}" style="color:#8fa4b4;text-decoration:underline;">Unsubscribe</a>
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`
}

// Simple token: base64(email):timestamp — no DB needed for basic unsubscribe
function makeUnsubToken(email: string) {
  return Buffer.from(email).toString('base64url')
}

export async function POST(req: Request) {
  const session = await getAdminSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { segment, subject, message } = await req.json()
  if (!subject?.trim() || !message?.trim()) return Response.json({ error: 'Subject and message required' }, { status: 400 })

  const db = getSupabaseAdmin()
  let emails: { email: string; name: string | null }[] = []

  if (segment === 'subscribers' || segment === 'all') {
    const { data } = await db.from('email_subscribers').select('email, name').is('unsubscribed_at', null)
    emails = [...emails, ...(data ?? [])]
  }

  if (segment === 'customers' || segment === 'all') {
    const { data } = await db.from('bookings').select('email, name').order('created_at', { ascending: false })
    const existing = new Set(emails.map(e => e.email.toLowerCase()))
    for (const b of (data ?? [])) {
      const e = (b.email as string).toLowerCase()
      if (!existing.has(e)) {
        emails.push({ email: e, name: (b as { name?: string }).name ?? null })
        existing.add(e)
      }
    }
  }

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
  emails = emails.filter(e => EMAIL_RE.test(e.email))

  if (emails.length === 0) return Response.json({ error: 'No recipients' }, { status: 400 })

  let sent = 0; let failed = 0
  const errors: string[] = []

  for (const recipient of emails) {
    const unsubToken = makeUnsubToken(recipient.email)
    const unsubUrl = `${SITE}/unsubscribe?token=${unsubToken}`
    try {
      const { data, error } = await resend.emails.send({
        from: MARKETING_FROM,
        to: recipient.email,
        replyTo: brand.contact.emailInfo,
        subject,
        html: buildHtml(subject, message, recipient.name, unsubToken),
        headers: {
          'List-Unsubscribe': `<${unsubUrl}>, <mailto:${brand.contact.emailInfo}?subject=Unsubscribe>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          'Precedence': 'bulk',
          'X-Mailer': brand.company.displayName,
        },
      })
      if (error || !data) {
        failed++
        errors.push(`${recipient.email}: ${error?.message ?? 'unknown'}`)
      } else {
        sent++
      }
    } catch (e) {
      failed++
      errors.push(`${recipient.email}: ${String(e)}`)
    }
    await new Promise(r => setTimeout(r, 50))
  }

  return Response.json({ sent, failed, total: emails.length, errors: errors.slice(0, 5) })
}
