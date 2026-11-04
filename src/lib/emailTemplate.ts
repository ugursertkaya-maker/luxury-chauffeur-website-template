import { brand, cityState } from '@/config/brand'

export function emailTemplate({
  subject,
  greeting,
  body,
  fromAddress,
}: {
  subject: string
  greeting: string
  body: string
  fromAddress: string
}) {
  const isReservations = fromAddress.includes('reservations')
  const label = isReservations ? 'RESERVATIONS' : 'GENERAL INQUIRIES'

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">

  <tr><td style="background:#0f1922;padding:28px 36px;border-radius:12px 12px 0 0">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td><div style="color:#fff;font-size:17px;font-weight:900;letter-spacing:2px">${brand.company.displayName.toUpperCase()}</div><div style="color:#c9a96e;font-size:8px;letter-spacing:4px;margin-top:3px">PREMIUM TRANSPORTATION</div></td>
      <td align="right"><div style="color:#c9a96e;font-size:8px;letter-spacing:3px">${label}</div></td>
    </tr></table>
  </td></tr>
  <tr><td style="background:#c9a96e;height:3px"></td></tr>

  <tr><td style="background:#fff;padding:30px 36px">
    <p style="color:#0f1922;font-size:15px;font-weight:700;margin:0 0 20px">${greeting}</p>
    <div style="color:#334155;font-size:13px;line-height:1.8;margin:0 0 24px">${body.replace(/\n/g, '<br/>')}</div>
    <p style="color:#64748b;font-size:12px;line-height:1.7;margin:0">
      Questions? <a href="mailto:${fromAddress}" style="color:#0f1922;font-weight:700">${fromAddress}</a> · ${brand.contact.phone}
    </p>
  </td></tr>

  <tr><td style="background:#0f1922;padding:16px 36px;border-radius:0 0 12px 12px;text-align:center">
    <div style="color:#94a3b8;font-size:11px">${brand.company.displayName} · ${cityState} · ${brand.site.domain}</div>
  </td></tr>

</table></td></tr></table></body></html>`
}
