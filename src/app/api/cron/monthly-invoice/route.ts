// Runs on the 4th of every month — generates invoices with discount + MA tax breakdown.
import { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'
import { generateInvoicePDF, calcInvoiceTotals } from '@/lib/invoice-pdf'
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
    .select('*')
    .eq('is_active', true)

  const results: { account: string; invoice?: string; trips?: number; total?: number; error?: string }[] = []

  for (const account of accounts ?? []) {
    const { data: bookings } = await db
      .from('bookings')
      .select('id, booking_number, pickup_date, pickup_time, pickup_location, dropoff_location, name, total_price, gratuity_amount')
      .eq('corporate_account_id', account.id)
      .in('status', ['confirmed', 'completed'])
      .eq('invoice_status', 'none')
      .order('pickup_date')

    if (!bookings?.length) continue

    const discount_rate = account.discount_rate ?? 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBookings = (bookings as any[]).map(b => ({ ...b, vehicle_name: null }))
    const totals = calcInvoiceTotals(pdfBookings, discount_rate)

    const now = new Date()
    const dueDate = new Date(now)
    dueDate.setDate(dueDate.getDate() + (account.payment_terms ?? 30))

    const dates = bookings.map(b => b.pickup_date).filter(Boolean).sort()
    const periodStart = dates[0] ?? now.toISOString().slice(0, 10)
    const periodEnd = dates[dates.length - 1] ?? now.toISOString().slice(0, 10)
    const invoiceDate = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    const dueDateStr = dueDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    const billingEmail = account.billing_email || account.contact_email
    const invNum = `INV-${Date.now().toString().slice(-8)}-${account.id.slice(0, 4).toUpperCase()}`

    // Insert invoice
    const { data: invoice, error: invErr } = await db.from('invoices').insert({
      invoice_number: invNum,
      corporate_account_id: account.id,
      period_start: periodStart,
      period_end: periodEnd,
      total_amount: totals.total,
      status: 'sent',
      sent_at: now.toISOString(),
    }).select().single()

    if (invErr) {
      results.push({ account: account.company_name, error: `DB: ${invErr.message}` })
      continue
    }

    // Mark bookings as invoiced
    await db.from('bookings')
      .update({ invoice_status: 'invoiced' })
      .in('id', bookings.map(b => b.id))

    // Generate PDF
    let pdfBuffer: Buffer | null = null
    try {
      pdfBuffer = await generateInvoicePDF({
        invoice_number: invNum,
        period_start: periodStart,
        period_end: periodEnd,
        due_date: dueDateStr,
        invoice_date: invoiceDate,
        bookings: pdfBookings,
        discount_rate,
        ...totals,
        account,
      })
    } catch (e) { console.error('PDF error:', e) }

    // Build email trip rows
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tripRows = pdfBookings.map((b: any, i: number) => {
      const timeStr = b.pickup_time ? b.pickup_time.slice(0, 5) : ''
      const disc = Number(b.total_price) * (discount_rate / 100)
      const net = Number(b.total_price) - disc
      return `
      <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f8fafc'}">
        <td style="padding:10px 14px;font-family:monospace;font-size:11px;font-weight:700;color:#1a2530;border-bottom:1px solid #f1f5f9">${b.booking_number}</td>
        <td style="padding:10px 14px;font-size:11px;color:#64748b;border-bottom:1px solid #f1f5f9">${b.pickup_date}${timeStr ? `<br/>${timeStr}` : ''}</td>
        <td style="padding:10px 14px;font-size:11px;color:#334155;border-bottom:1px solid #f1f5f9">${b.name}</td>
        <td style="padding:10px 14px;font-size:11px;color:#64748b;border-bottom:1px solid #f1f5f9">
          ${b.pickup_location}${b.dropoff_location ? `<br/><span style="color:#94a3b8">→ ${b.dropoff_location}</span>` : ''}
        </td>
        <td style="padding:10px 14px;font-size:11px;color:#94a3b8;text-align:right;border-bottom:1px solid #f1f5f9;text-decoration:line-through">$${Number(b.total_price).toFixed(2)}</td>
        <td style="padding:10px 14px;font-size:12px;font-weight:700;color:#0f1922;text-align:right;border-bottom:1px solid #f1f5f9">$${net.toFixed(2)}</td>
      </tr>`
    }).join('')

    const emailHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px">
<tr><td align="center">
<table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%">

  <tr><td style="background:#0f1922;padding:26px 40px;border-radius:12px 12px 0 0">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td>
        <div style="color:#fff;font-size:18px;font-weight:900;letter-spacing:2px">${brand.company.displayName.toUpperCase()}</div>
        <div style="color:#c9a96e;font-size:8px;letter-spacing:4px;margin-top:3px">PREMIUM TRANSPORTATION</div>
      </td>
      <td align="right">
        <div style="color:#c9a96e;font-size:8px;letter-spacing:3px;margin-bottom:4px">INVOICE</div>
        <div style="color:#fff;font-size:18px;font-weight:900">${invNum}</div>
      </td>
    </tr></table>
  </td></tr>
  <tr><td style="background:#c9a96e;height:3px"></td></tr>

  <tr><td style="background:#1a2530;padding:11px 40px">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="color:#94a3b8;font-size:11px">Date: <strong style="color:#e2e8f0">${invoiceDate}</strong></td>
      <td align="center" style="color:#94a3b8;font-size:11px">Period: <strong style="color:#e2e8f0">${periodStart} – ${periodEnd}</strong></td>
      <td align="center" style="color:#94a3b8;font-size:11px">Corp. Discount: <strong style="color:#c9a96e">${discount_rate}%</strong></td>
      <td align="right" style="color:#94a3b8;font-size:11px">Due: <strong style="color:#f59e0b">${dueDateStr}</strong></td>
    </tr></table>
  </td></tr>

  <tr><td style="background:#fff;padding:30px 40px">
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:22px"><tr>
      <td style="vertical-align:top">
        <div style="color:#c9a96e;font-size:9px;font-weight:700;letter-spacing:3px;margin-bottom:7px">BILL TO</div>
        <div style="color:#0f1922;font-size:15px;font-weight:800">${account.company_name}</div>
        <div style="color:#334155;font-size:13px;margin-top:2px">${account.contact_name}</div>
        <div style="color:#64748b;font-size:12px;margin-top:2px">${billingEmail}</div>
      </td>
      <td align="right" style="vertical-align:top">
        <div style="color:#c9a96e;font-size:9px;font-weight:700;letter-spacing:3px;margin-bottom:7px">TOTAL DUE</div>
        <div style="color:#0f1922;font-size:28px;font-weight:900">$${totals.total.toFixed(2)}</div>
        <div style="color:#64748b;font-size:11px">${bookings.length} trip${bookings.length !== 1 ? 's' : ''} · incl. 6.25% MA tax</div>
      </td>
    </tr></table>

    <div style="height:1px;background:#e2e8f0;margin-bottom:18px"></div>

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

    <!-- Full breakdown -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px">
      <tr><td></td><td width="280" style="border-top:2px solid #0f1922;padding-top:12px">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="color:#64748b;font-size:12px;padding-bottom:5px">Original Subtotal</td><td align="right" style="color:#334155;font-size:12px;padding-bottom:5px">$${totals.subtotal_original.toFixed(2)}</td></tr>
          ${discount_rate > 0 ? `<tr><td style="color:#059669;font-size:12px;padding-bottom:5px">Corporate Discount (${discount_rate}%)</td><td align="right" style="color:#059669;font-size:12px;font-weight:700;padding-bottom:5px">–$${totals.discount_amount.toFixed(2)}</td></tr>
          <tr><td style="color:#334155;font-size:12px;font-weight:700;border-top:1px solid #e2e8f0;padding:6px 0 6px">Discounted Subtotal</td><td align="right" style="color:#334155;font-size:12px;font-weight:700;border-top:1px solid #e2e8f0;padding:6px 0 6px">$${totals.subtotal_discounted.toFixed(2)}</td></tr>` : ''}
          <tr><td style="color:#64748b;font-size:12px;padding-bottom:5px">Sales Tax</td><td align="right" style="color:#334155;font-size:12px;padding-bottom:5px">$${totals.ma_sales_tax.toFixed(2)}</td></tr>
          ${totals.gratuity_total > 0 ? `<tr><td style="color:#059669;font-size:12px;padding-bottom:8px">Driver Gratuity (tax-exempt)</td><td align="right" style="color:#059669;font-size:12px;padding-bottom:8px">$${totals.gratuity_total.toFixed(2)}</td></tr>` : ''}
          <tr>
            <td colspan="2"><div style="height:2px;background:#0f1922;margin:4px 0 10px"></div></td>
          </tr>
          <tr>
            <td style="color:#0f1922;font-size:16px;font-weight:900">TOTAL DUE</td>
            <td align="right" style="color:#0f1922;font-size:16px;font-weight:900">$${totals.total.toFixed(2)}</td>
          </tr>
        </table>
        <p style="color:#94a3b8;font-size:10px;margin:8px 0 0;line-height:1.5">MA DOR · State 6.25% on discounted fare.<br/>Gratuity passed 100% to driver (tax-exempt).</p>
      </td></tr>
    </table>
  </td></tr>

  <!-- Payment + Dispute -->
  <tr><td style="background:#f8fafc;padding:22px 40px;border-top:1px solid #e2e8f0">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="vertical-align:top;padding-right:20px">
        <div style="color:#c9a96e;font-size:9px;font-weight:700;letter-spacing:3px;margin-bottom:7px">PAYMENT INSTRUCTIONS</div>
        <div style="color:#64748b;font-size:12px;line-height:1.8">
          Remit within <strong style="color:#334155">${account.payment_terms ?? 30} days</strong>.
          Ref: <strong style="color:#334155">${invNum}</strong><br>
          <a href="mailto:${brand.contact.emailReservations}" style="color:#0f1922;font-weight:700">${brand.contact.emailReservations}</a> · ${brand.contact.phone}
        </div>
      </td>
      <td style="vertical-align:top;background:#fff7ed;border-radius:8px;padding:14px 16px;border-left:3px solid #f59e0b">
        <div style="color:#d97706;font-size:9px;font-weight:700;letter-spacing:3px;margin-bottom:6px">DISPUTE POLICY</div>
        <div style="color:#92400e;font-size:11px;line-height:1.7">
          All billing disputes must be submitted <strong>in writing via email</strong> to
          <a href="mailto:${brand.contact.emailReservations}" style="color:#92400e;font-weight:700">${brand.contact.emailReservations}</a>
          within <strong>30 days</strong>, quoting <strong>${invNum}</strong>
          and the booking number(s). Phone calls do not constitute a formal dispute.
        </div>
      </td>
    </tr></table>
  </td></tr>

  <tr><td style="background:#0f1922;padding:16px 40px;border-radius:0 0 12px 12px;text-align:center">
    <div style="color:#94a3b8;font-size:11px">${brand.company.displayName} · ${cityState} · ${brand.site.domain}</div>
    <div style="color:#475569;font-size:10px;margin-top:3px">Invoice PDF attached · All disputes via email only</div>
  </td></tr>

</table></td></tr>
</table>
</body></html>`

    const emailPayload: Parameters<typeof resend.emails.send>[0] = {
      from: brand.contact.emailReservations,
      to: billingEmail,
      replyTo: brand.contact.emailReservations,
      subject: `Invoice ${invNum} — ${brand.company.displayName}`,
      html: emailHtml,
    }
    if (pdfBuffer) emailPayload.attachments = [{ filename: `${invNum}.pdf`, content: pdfBuffer }]

    const { error: emailErr } = await resend.emails.send(emailPayload)
    results.push({ account: account.company_name, invoice: invoice?.invoice_number, trips: bookings.length, total: totals.total, error: emailErr?.message })
  }

  return Response.json({ processed: results.length, results })
}
