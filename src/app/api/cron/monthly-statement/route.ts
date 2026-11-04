// Runs on the 1st of every month — sends draft statement with tax preview.
// Recipients review by the 3rd; invoices go out on the 4th.
// All disputes must be submitted in writing via email.
import { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'
import { calcInvoiceTotals } from '@/lib/invoice-pdf'
import { brand, cityState } from '@/config/brand'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getSupabaseAdmin()
  const { data: accounts } = await db
    .from('corporate_accounts')
    .select('id, company_name, contact_name, billing_email, contact_email, payment_terms, discount_rate')
    .eq('is_active', true)

  const now = new Date()
  const reviewDeadline = new Date(now.getFullYear(), now.getMonth(), 3)
    .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const invoiceOn = new Date(now.getFullYear(), now.getMonth(), 4)
    .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const monthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const results: { account: string; trips: number; total: number; error?: string }[] = []

  for (const account of accounts ?? []) {
    const { data: bookings } = await db
      .from('bookings')
      .select('booking_number, pickup_date, pickup_time, pickup_location, dropoff_location, name, total_price, gratuity_amount')
      .eq('corporate_account_id', account.id)
      .in('status', ['confirmed', 'completed'])
      .eq('invoice_status', 'none')
      .order('pickup_date')

    if (!bookings?.length) continue

    const discount_rate = account.discount_rate ?? 0
    const totals = calcInvoiceTotals(bookings, discount_rate)
    const billingEmail = account.billing_email || account.contact_email

    const tripRows = bookings.map((b, i) => {
      const timeStr = b.pickup_time ? b.pickup_time.slice(0, 5) : ''
      const discount_per_trip = Number(b.total_price) * (discount_rate / 100)
      const net_per_trip = Number(b.total_price) - discount_per_trip
      return `
      <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f8fafc'}">
        <td style="padding:10px 14px;font-family:monospace;font-size:11px;font-weight:700;color:#1a2530;border-bottom:1px solid #f1f5f9">${b.booking_number}</td>
        <td style="padding:10px 14px;font-size:11px;color:#64748b;border-bottom:1px solid #f1f5f9">${b.pickup_date}${timeStr ? ` ${timeStr}` : ''}</td>
        <td style="padding:10px 14px;font-size:11px;color:#334155;border-bottom:1px solid #f1f5f9">${b.name}</td>
        <td style="padding:10px 14px;font-size:11px;color:#64748b;border-bottom:1px solid #f1f5f9">
          ${b.pickup_location}${b.dropoff_location ? `<br/><span style="color:#94a3b8">→ ${b.dropoff_location}</span>` : ''}
        </td>
        <td style="padding:10px 14px;font-size:11px;color:#334155;text-align:right;border-bottom:1px solid #f1f5f9;text-decoration:line-through;color:#94a3b8">$${Number(b.total_price).toFixed(2)}</td>
        <td style="padding:10px 14px;font-size:12px;font-weight:700;color:#0f1922;text-align:right;border-bottom:1px solid #f1f5f9">$${net_per_trip.toFixed(2)}</td>
      </tr>`
    }).join('')

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px">
<tr><td align="center">
<table width="620" cellpadding="0" cellspacing="0" style="max-width:620px;width:100%">

  <tr><td style="background:#0f1922;padding:26px 40px;border-radius:12px 12px 0 0">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td>
        <div style="color:#fff;font-size:18px;font-weight:900;letter-spacing:2px">${brand.company.displayName.toUpperCase()}</div>
        <div style="color:#c9a96e;font-size:8px;letter-spacing:4px;margin-top:3px">PREMIUM TRANSPORTATION</div>
      </td>
      <td align="right">
        <div style="color:#c9a96e;font-size:8px;letter-spacing:3px">DRAFT STATEMENT</div>
        <div style="color:#fff;font-size:14px;font-weight:700;margin-top:3px">${monthLabel}</div>
      </td>
    </tr></table>
  </td></tr>
  <tr><td style="background:#c9a96e;height:3px"></td></tr>

  <tr><td style="background:#fff;padding:30px 40px">
    <p style="color:#0f1922;font-size:15px;font-weight:700;margin:0 0 4px">Dear ${account.contact_name},</p>
    <p style="color:#64748b;font-size:13px;line-height:1.7;margin:0 0 20px">
      Below is a summary of transportation services provided to
      <strong style="color:#334155">${account.company_name}</strong> this period.
      Please review carefully — if everything looks correct, no action is needed.
      A formal invoice will be issued on <strong style="color:#0f1922">${invoiceOn}</strong>.
    </p>

    <div style="background:#fef3c7;border:1px solid #fde68a;border-left:4px solid #f59e0b;border-radius:6px;padding:14px 18px;margin-bottom:22px">
      <strong style="color:#92400e;font-size:12px">⚠ Review deadline: ${reviewDeadline}</strong><br/>
      <span style="color:#92400e;font-size:12px">
        Any discrepancies must be reported <strong>in writing via email</strong> to
        <a href="mailto:${brand.contact.emailReservations}" style="color:#92400e">${brand.contact.emailReservations}</a>
        before this date. Please include your company name and the affected booking number(s).
        Phone calls cannot be used as the basis for billing disputes.
      </span>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
      <thead>
        <tr style="background:#0f1922">
          <th style="padding:10px 14px;text-align:left;color:#fff;font-size:10px;letter-spacing:1px">BOOKING</th>
          <th style="padding:10px 14px;text-align:left;color:#fff;font-size:10px;letter-spacing:1px">DATE / TIME</th>
          <th style="padding:10px 14px;text-align:left;color:#fff;font-size:10px;letter-spacing:1px">PASSENGER</th>
          <th style="padding:10px 14px;text-align:left;color:#fff;font-size:10px;letter-spacing:1px">ROUTE</th>
          <th style="padding:10px 14px;text-align:right;color:#fff;font-size:10px;letter-spacing:1px">ORIG.</th>
          <th style="padding:10px 14px;text-align:right;color:#fff;font-size:10px;letter-spacing:1px">NET${discount_rate > 0 ? ` (−${discount_rate}%)` : ''}</th>
        </tr>
      </thead>
      <tbody>${tripRows}</tbody>
    </table>

    <!-- Estimated totals -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px">
      <tr><td></td><td width="270" style="border-top:2px solid #0f1922;padding-top:12px">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="color:#64748b;font-size:12px;padding-bottom:4px">Original Subtotal</td><td align="right" style="color:#64748b;font-size:12px;padding-bottom:4px">$${totals.subtotal_original.toFixed(2)}</td></tr>
          ${discount_rate > 0 ? `<tr><td style="color:#059669;font-size:12px;padding-bottom:4px">Corporate Discount (${discount_rate}%)</td><td align="right" style="color:#059669;font-size:12px;font-weight:700;padding-bottom:4px">–$${totals.discount_amount.toFixed(2)}</td></tr>
          <tr><td style="color:#334155;font-size:12px;font-weight:700;padding-bottom:6px;border-top:1px solid #e2e8f0;padding-top:5px">Discounted Subtotal</td><td align="right" style="color:#334155;font-size:12px;font-weight:700;padding-bottom:6px;border-top:1px solid #e2e8f0;padding-top:5px">$${totals.subtotal_discounted.toFixed(2)}</td></tr>` : ''}
          <tr><td style="color:#64748b;font-size:12px;padding-bottom:8px">MA Sales Tax (6.25%)</td><td align="right" style="color:#64748b;font-size:12px;padding-bottom:8px">$${totals.ma_sales_tax.toFixed(2)}</td></tr>
          ${totals.gratuity_total > 0 ? `<tr><td style="color:#059669;font-size:12px;padding-bottom:8px">Driver Gratuity (tax-exempt)</td><td align="right" style="color:#059669;font-size:12px;padding-bottom:8px">$${totals.gratuity_total.toFixed(2)}</td></tr>` : ''}
          <tr>
            <td style="color:#0f1922;font-size:15px;font-weight:900;padding-top:6px;border-top:2px solid #0f1922">EST. TOTAL</td>
            <td align="right" style="color:#0f1922;font-size:15px;font-weight:900;padding-top:6px;border-top:2px solid #0f1922">$${totals.total.toFixed(2)}</td>
          </tr>
        </table>
        <p style="color:#94a3b8;font-size:10px;margin:6px 0 0;line-height:1.5">MA DOR · State 6.25%<br/>Gratuity passed 100% to driver (tax-exempt).</p>
      </td></tr>
    </table>
  </td></tr>

  <!-- Dispute policy -->
  <tr><td style="background:#fff7ed;padding:20px 40px;border-top:1px solid #fde68a">
    <div style="color:#d97706;font-size:9px;font-weight:700;letter-spacing:3px;margin-bottom:8px">DISPUTE & CONTACT POLICY</div>
    <div style="color:#92400e;font-size:12px;line-height:1.8">
      All billing inquiries and disputes must be submitted <strong>in writing via email only</strong> to
      <a href="mailto:${brand.contact.emailReservations}" style="color:#92400e;font-weight:700">${brand.contact.emailReservations}</a>
      by <strong>${reviewDeadline}</strong>. Please include your company name and the affected booking number(s).
      Disputes submitted after the deadline or not in writing cannot be honored.
      Phone calls do not constitute a formal dispute.
    </div>
  </td></tr>

  <tr><td style="background:#0f1922;padding:16px 40px;border-radius:0 0 12px 12px;text-align:center">
    <div style="color:#94a3b8;font-size:11px">${brand.company.displayName} · ${cityState} · ${brand.site.domain}</div>
    <div style="color:#475569;font-size:10px;margin-top:3px">This is a draft statement, not a final invoice · All disputes via email only</div>
  </td></tr>

</table></td></tr>
</table>
</body></html>`

    const { error } = await resend.emails.send({
      from: brand.contact.emailReservations,
      to: billingEmail,
      replyTo: brand.contact.emailReservations,
      subject: `${monthLabel} Statement — Review by ${reviewDeadline} · ${brand.company.displayName}`,
      html,
    })

    results.push({ account: account.company_name, trips: bookings.length, total: totals.total, error: error?.message })
  }

  return Response.json({ sent: results.length, results })
}
