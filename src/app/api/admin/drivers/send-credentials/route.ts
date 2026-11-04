import { getAdminSession } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'
import { brand, emailFrom } from '@/config/brand'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  const session = await getAdminSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { driverId } = await request.json()
  if (!driverId) return Response.json({ error: 'Missing driverId' }, { status: 400 })

  const db = getSupabaseAdmin()
  const { data: driver } = await db
    .from('drivers')
    .select('id, name, email, password')
    .eq('id', driverId)
    .single()

  if (!driver?.email) return Response.json({ error: 'Driver has no email' }, { status: 400 })
  if (!driver.password) return Response.json({ error: 'Driver has no password set' }, { status: 400 })

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? brand.site.url

  await resend.emails.send({
    from: emailFrom,
    to: driver.email,
    subject: 'Your Driver Panel Access — ${brand.company.displayName}',
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
  <tr><td style="background:#1a2530;padding:32px 40px">
    <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700">${brand.company.displayName}</p>
    <p style="margin:4px 0 0;color:rgba(255,255,255,.5);font-size:13px">Driver Panel Access</p>
  </td></tr>
  <tr><td style="padding:36px 40px">
    <p style="margin:0 0 8px;font-size:16px;color:#1a2530;font-weight:600">Hello, ${driver.name}</p>
    <p style="margin:0 0 28px;font-size:14px;color:#64748b;line-height:1.6">Your driver panel access credentials are ready. Use the information below to sign in.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;padding:20px 24px;margin-bottom:28px">
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #e2e8f0">
          <p style="margin:0;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;font-weight:600">Email</p>
          <p style="margin:4px 0 0;font-size:15px;color:#1e293b;font-weight:500">${driver.email}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0 0">
          <p style="margin:0;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;font-weight:600">Password</p>
          <p style="margin:4px 0 0;font-size:22px;color:#1a2530;font-weight:700;font-family:monospace;letter-spacing:.1em">${driver.password}</p>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="${siteUrl}/driver" style="display:inline-block;background:#1a2530;color:#ffffff;font-size:14px;font-weight:700;padding:14px 36px;border-radius:10px;text-decoration:none">
        Open Driver Panel →
      </a>
    </td></tr></table>

    <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;text-align:center">Keep this email safe. Contact your admin if you need to reset your password.</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`,
  })

  return Response.json({ success: true })
}
