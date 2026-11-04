import { getSupabaseAdmin } from '@/lib/supabase'
import { getAdminSession } from '@/lib/auth'
import { Resend } from 'resend'
import { generateInvoicePDF, calcInvoiceTotals } from '@/lib/invoice-pdf'
import { hashCorporatePassword } from '@/lib/corporate-auth'
import { randomBytes } from 'crypto'
import { brand, cityState, emailFrom } from '@/config/brand'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET() {
  const session = await getAdminSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseAdmin()
  const { data: accounts } = await db
    .from('corporate_accounts')
    .select('*')
    .order('company_name')

  // Get outstanding balance per account
  const { data: bookings } = await db
    .from('bookings')
    .select('corporate_account_id, total_price, invoice_status')
    .not('corporate_account_id', 'is', null)
    .in('status', ['confirmed', 'completed'])
    .eq('invoice_status', 'none')

  const balances: Record<string, number> = {}
  for (const b of bookings ?? []) {
    if (!b.corporate_account_id) continue
    balances[b.corporate_account_id] = (balances[b.corporate_account_id] ?? 0) + Number(b.total_price)
  }

  return Response.json({
    accounts: (accounts ?? []).map(a => ({ ...a, outstanding: balances[a.id] ?? 0 }))
  })
}

export async function POST(req: Request) {
  const session = await getAdminSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { action } = body
  const db = getSupabaseAdmin()

  if (action === 'create') {
    const { company_name, contact_name, contact_email, billing_email, phone, address, payment_terms, credit_limit, notes } = body
    const { data, error } = await db.from('corporate_accounts').insert({
      company_name, contact_name, contact_email,
      billing_email: billing_email || contact_email,
      phone, address, payment_terms: payment_terms ?? 30,
      credit_limit, notes,
    }).select().single()
    if (error) return Response.json({ error: error.message }, { status: 400 })
    return Response.json({ account: data })
  }

  if (action === 'update') {
    const { id, ...fields } = body
    delete fields.action
    const { data, error } = await db.from('corporate_accounts').update(fields).eq('id', id).select().single()
    if (error) return Response.json({ error: error.message }, { status: 400 })
    return Response.json({ account: data })
  }

  if (action === 'generate_invoice') {
    const { account_id, period_start, period_end } = body

    const { data: account } = await db.from('corporate_accounts').select('*').eq('id', account_id).single()
    if (!account) return Response.json({ error: 'Account not found' }, { status: 404 })

    let query = db
      .from('bookings')
      .select('id, booking_number, pickup_date, pickup_time, pickup_location, dropoff_location, total_price, gratuity_amount, name')
      .eq('corporate_account_id', account_id)
      .in('status', ['confirmed', 'completed'])
      .eq('invoice_status', 'none')

    if (period_start) query = query.gte('pickup_date', period_start)
    if (period_end) query = query.lte('pickup_date', period_end)

    const { data: bookings } = await query

    if (!bookings?.length) return Response.json({ error: 'No billable trips found for this account' }, { status: 400 })

    const discount_rate = account.discount_rate ?? 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBookings = (bookings as any[]).map(b => ({ ...b, vehicle_name: null }))
    const totals = calcInvoiceTotals(pdfBookings, discount_rate)

    const invNum = `INV-${Date.now().toString().slice(-8)}`
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + (account.payment_terms ?? 30))

    const dates = bookings.map(b => b.pickup_date).filter(Boolean).sort()
    const effectivePeriodStart = period_start || dates[0] || new Date().toISOString().slice(0, 10)
    const effectivePeriodEnd = period_end || dates[dates.length - 1] || new Date().toISOString().slice(0, 10)

    const { data: invoice, error: invoiceError } = await db.from('invoices').insert({
      invoice_number: invNum,
      corporate_account_id: account_id,
      period_start: effectivePeriodStart,
      period_end: effectivePeriodEnd,
      total_amount: totals.total,
      status: 'sent',
      sent_at: new Date().toISOString(),
    }).select().single()

    if (invoiceError) console.error('Invoice insert error:', invoiceError)

    // Mark bookings as invoiced
    await db.from('bookings')
      .update({ invoice_status: 'invoiced' })
      .in('id', bookings.map(b => b.id))

    // Generate PDF
    const billingEmail = account.billing_email || account.contact_email
    const invoiceDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    const dueDateStr = dueDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    const periodText = `${effectivePeriodStart} – ${effectivePeriodEnd}`

    const pdfBuffer = await generateInvoicePDF({
      invoice_number: invNum,
      period_start: effectivePeriodStart,
      period_end: effectivePeriodEnd,
      due_date: dueDateStr,
      invoice_date: invoiceDate,
      bookings: pdfBookings,
      discount_rate,
      ...totals,
      account,
    })

    // Build trip rows for email
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tripRows = pdfBookings.map((b: any, i: number) => {
      const timeStr = b.pickup_time ? b.pickup_time.slice(0, 5) : ''
      return `
      <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f8fafc'}">
        <td style="padding:10px 14px;font-family:monospace;font-size:11px;font-weight:700;color:#1a2530;border-bottom:1px solid #f1f5f9;white-space:nowrap">${b.booking_number}</td>
        <td style="padding:10px 14px;font-size:11px;color:#64748b;border-bottom:1px solid #f1f5f9;white-space:nowrap">${b.pickup_date}${timeStr ? `<br/><span style="color:#94a3b8">${timeStr}</span>` : ''}</td>
        <td style="padding:10px 14px;font-size:11px;color:#334155;border-bottom:1px solid #f1f5f9">${b.name}</td>
        <td style="padding:10px 14px;font-size:11px;color:#64748b;border-bottom:1px solid #f1f5f9">
          <span style="color:#334155">${b.pickup_location}</span>
          ${b.dropoff_location ? `<br/><span style="color:#94a3b8;font-size:10px">→ ${b.dropoff_location}</span>` : ''}
          ${b.vehicle_name ? `<br/><span style="color:#c9a96e;font-size:10px">${b.vehicle_name}</span>` : ''}
        </td>
        <td style="padding:10px 14px;font-size:12px;font-weight:700;color:#0f1922;text-align:right;border-bottom:1px solid #f1f5f9;white-space:nowrap">
          $${Number(b.total_price).toFixed(2)}
          ${b.gratuity_amount && Number(b.gratuity_amount) > 0 ? `<br/><span style="color:#059669;font-size:10px;font-weight:400">+$${Number(b.gratuity_amount).toFixed(2)} tip</span>` : ''}
        </td>
      </tr>`}).join('')

    const emailHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

  <!-- Header -->
  <tr><td style="background:#0f1922;padding:32px 40px;border-radius:12px 12px 0 0">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td>
          <div style="color:#ffffff;font-size:20px;font-weight:900;letter-spacing:2px">${brand.company.displayName.toUpperCase()}</div>
          <div style="color:#c9a96e;font-size:9px;letter-spacing:4px;margin-top:4px">PREMIUM TRANSPORTATION</div>
        </td>
        <td align="right">
          <div style="color:#c9a96e;font-size:9px;letter-spacing:4px;margin-bottom:6px">INVOICE</div>
          <div style="color:#ffffff;font-size:22px;font-weight:900">${invNum}</div>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- Meta bar -->
  <tr><td style="background:#1a2530;padding:14px 40px">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="color:#94a3b8;font-size:11px">Date: <span style="color:#e2e8f0;font-weight:700">${invoiceDate}</span></td>
        <td align="center" style="color:#94a3b8;font-size:11px">Period: <span style="color:#e2e8f0;font-weight:700">${periodText}</span></td>
        <td align="center" style="color:#94a3b8;font-size:11px">Due: <span style="color:#f59e0b;font-weight:700">${dueDateStr}</span></td>
        <td align="right" style="color:#94a3b8;font-size:11px">Net <span style="color:#e2e8f0;font-weight:700">${account.payment_terms ?? 30}</span></td>
      </tr>
    </table>
  </td></tr>

  <!-- Body -->
  <tr><td style="background:#ffffff;padding:32px 40px">

    <!-- Bill To -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
      <tr>
        <td style="vertical-align:top">
          <div style="color:#c9a96e;font-size:9px;font-weight:700;letter-spacing:3px;margin-bottom:8px">BILL TO</div>
          <div style="color:#0f1922;font-size:15px;font-weight:800">${account.company_name}</div>
          <div style="color:#334155;font-size:13px;margin-top:2px">${account.contact_name}</div>
          <div style="color:#64748b;font-size:12px;margin-top:2px">${billingEmail}</div>
          ${account.address ? `<div style="color:#94a3b8;font-size:12px;margin-top:2px">${account.address}</div>` : ''}
        </td>
        <td align="right" style="vertical-align:top">
          <div style="color:#c9a96e;font-size:9px;font-weight:700;letter-spacing:3px;margin-bottom:8px">SUMMARY</div>
          <div style="color:#64748b;font-size:12px;line-height:2">${bookings.length} trip${bookings.length !== 1 ? 's' : ''}</div>
          <div style="color:#0f1922;font-size:26px;font-weight:900;margin-top:4px">$${totals.total.toFixed(2)}</div>
          <div style="color:#64748b;font-size:11px">Total Due</div>
        </td>
      </tr>
    </table>

    <div style="height:1px;background:#e2e8f0;margin-bottom:24px"></div>

    <!-- Trips table -->
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0">
      <thead>
        <tr style="background:#0f1922">
          <th style="padding:10px 14px;text-align:left;color:#ffffff;font-size:10px;letter-spacing:1px;font-weight:700">BOOKING</th>
          <th style="padding:10px 14px;text-align:left;color:#ffffff;font-size:10px;letter-spacing:1px;font-weight:700">DATE / TIME</th>
          <th style="padding:10px 14px;text-align:left;color:#ffffff;font-size:10px;letter-spacing:1px;font-weight:700">PASSENGER</th>
          <th style="padding:10px 14px;text-align:left;color:#ffffff;font-size:10px;letter-spacing:1px;font-weight:700">ROUTE & VEHICLE</th>
          <th style="padding:10px 14px;text-align:right;color:#ffffff;font-size:10px;letter-spacing:1px;font-weight:700">AMOUNT</th>
        </tr>
      </thead>
      <tbody>${tripRows}</tbody>
    </table>

    <!-- Totals breakdown -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px">
      <tr>
        <td></td>
        <td width="260" style="border-top:2px solid #0f1922;padding-top:14px">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="color:#64748b;font-size:12px;padding-bottom:5px">Original Subtotal (${pdfBookings.length} trips)</td>
              <td align="right" style="color:#334155;font-size:12px;padding-bottom:5px">$${totals.subtotal_original.toFixed(2)}</td>
            </tr>
            ${discount_rate > 0 ? `<tr>
              <td style="color:#059669;font-size:12px;padding-bottom:5px">Corporate Discount (${discount_rate}%)</td>
              <td align="right" style="color:#059669;font-size:12px;font-weight:700;padding-bottom:5px">–$${totals.discount_amount.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="color:#334155;font-size:12px;font-weight:700;padding-bottom:8px;border-top:1px solid #e2e8f0;padding-top:6px">Discounted Subtotal</td>
              <td align="right" style="color:#334155;font-size:12px;font-weight:700;padding-bottom:8px;border-top:1px solid #e2e8f0;padding-top:6px">$${totals.subtotal_discounted.toFixed(2)}</td>
            </tr>` : ''}
            <tr>
              <td style="color:#64748b;font-size:12px;padding-bottom:5px">Sales Tax</td>
              <td align="right" style="color:#334155;font-size:12px;padding-bottom:5px">$${totals.ma_sales_tax.toFixed(2)}</td>
            </tr>
            ${totals.gratuity_total > 0 ? `<tr>
              <td style="color:#64748b;font-size:12px;padding-bottom:8px">Driver Gratuity (tax-exempt)</td>
              <td align="right" style="color:#059669;font-size:12px;padding-bottom:8px">$${totals.gratuity_total.toFixed(2)}</td>
            </tr>` : ''}
            <tr>
              <td colspan="2" style="padding:0"><div style="height:2px;background:#0f1922;margin-bottom:10px"></div></td>
            </tr>
            <tr>
              <td style="color:#0f1922;font-size:16px;font-weight:900">TOTAL DUE</td>
              <td align="right" style="color:#0f1922;font-size:16px;font-weight:900">$${totals.total.toFixed(2)}</td>
            </tr>
          </table>
          <p style="color:#94a3b8;font-size:10px;margin:8px 0 0;line-height:1.5">MA DOR · State 6.25% applied to discounted fare.<br/>Gratuity passed 100% to driver (tax-exempt).</p>
        </td>
      </tr>
    </table>

  </td></tr>

  <!-- Payment instructions -->
  <tr><td style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="vertical-align:top;padding-right:20px">
        <div style="color:#c9a96e;font-size:9px;font-weight:700;letter-spacing:3px;margin-bottom:8px">PAYMENT INSTRUCTIONS</div>
        <div style="color:#64748b;font-size:12px;line-height:1.8">
          Remit within <strong style="color:#334155">${account.payment_terms ?? 30} days</strong>. Reference <strong style="color:#334155">${invNum}</strong>.<br>
          <a href="mailto:${brand.contact.emailReservations}" style="color:#0f1922;font-weight:700">${brand.contact.emailReservations}</a> · ${brand.contact.phone}
        </div>
      </td>
      <td style="vertical-align:top;background:#fff7ed;border-radius:8px;padding:14px;border-left:3px solid #f59e0b">
        <div style="color:#d97706;font-size:9px;font-weight:700;letter-spacing:3px;margin-bottom:6px">DISPUTE POLICY</div>
        <div style="color:#92400e;font-size:11px;line-height:1.7">
          All billing disputes must be submitted <strong>in writing via email</strong> to
          <a href="mailto:${brand.contact.emailReservations}" style="color:#92400e;font-weight:700">${brand.contact.emailReservations}</a>
          within <strong>30 days</strong> of this invoice, quoting <strong>${invNum}</strong>
          and the affected booking number(s).
        </div>
      </td>
    </tr></table>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#0f1922;padding:18px 40px;border-radius:0 0 12px 12px;text-align:center">
    <div style="color:#94a3b8;font-size:11px">${brand.company.displayName} · ${cityState} · ${brand.site.domain}</div>
    <div style="color:#475569;font-size:10px;margin-top:4px">Invoice PDF attached · All disputes via email only</div>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`

    const { error: emailError } = await resend.emails.send({
      from: brand.contact.emailReservations,
      to: billingEmail,
      subject: `Invoice ${invNum} — ${brand.company.displayName}`,
      html: emailHtml,
      attachments: [{
        filename: `${invNum}.pdf`,
        content: pdfBuffer,
      }],
    })

    if (emailError) {
      console.error('Invoice email error:', emailError)
      return Response.json({ invoice, trip_count: bookings.length, total: totals.total, email_error: emailError.message })
    }

    return Response.json({ invoice, trip_count: bookings.length, total: totals.total })
  }

  if (action === 'mark_paid') {
    const { invoice_id } = body
    const { data } = await db.from('invoices')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', invoice_id).select().single()
    await db.from('bookings').update({ invoice_status: 'paid' })
      .eq('invoice_status', 'invoiced')
    return Response.json({ invoice: data })
  }

  if (action === 'get_bookings') {
    const { account_id } = body
    const { data } = await db.from('bookings')
      .select('id, booking_number, pickup_date, pickup_time, pickup_location, dropoff_location, name, total_price, status, invoice_status')
      .eq('corporate_account_id', account_id)
      .order('pickup_date', { ascending: false })
      .limit(50)
    return Response.json({ bookings: data ?? [] })
  }

  if (action === 'get_invoices') {
    const { account_id } = body
    const { data } = await db.from('invoices')
      .select('*')
      .eq('corporate_account_id', account_id)
      .order('created_at', { ascending: false })
    return Response.json({ invoices: data ?? [] })
  }

  if (action === 'send_portal_credentials') {
    const { account_id } = body
    const { data: account } = await db.from('corporate_accounts').select('*').eq('id', account_id).single()
    if (!account) return Response.json({ error: 'Account not found' }, { status: 404 })

    const password = randomBytes(5).toString('hex') // 10-char hex password
    const hashed = hashCorporatePassword(password)

    await db.from('corporate_accounts').update({ portal_password: hashed }).eq('id', account_id)

    const loginUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? brand.site.url}/corporate/login`
    const emailTo = account.contact_email

    try {
      await resend.emails.send({
        from: emailFrom,
        to: emailTo,
        subject: 'Your Corporate Portal Access — ${brand.company.displayName}',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#ffffff">
            <div style="background:#0a1017;padding:32px 40px;text-align:center">
              <h2 style="color:#ffffff;margin:0;font-size:20px;font-weight:700;letter-spacing:1px">${brand.company.displayName.toUpperCase()}</h2>
              <p style="color:#94a3b8;margin:6px 0 0;font-size:13px">Corporate Portal</p>
            </div>
            <div style="padding:32px 40px">
              <p style="color:#334155;font-size:15px;margin:0 0 8px">Dear ${account.contact_name},</p>
              <p style="color:#334155;font-size:14px;line-height:1.6;margin:0 0 24px">
                Your corporate portal account for <strong>${account.company_name}</strong> is ready.
                Use the credentials below to access your booking history and invoices.
              </p>
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px 24px;margin-bottom:24px">
                <p style="margin:0 0 12px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600">Login Credentials</p>
                <p style="margin:0 0 6px;font-size:14px;color:#1e293b"><strong>Email:</strong> ${emailTo}</p>
                <p style="margin:0 0 6px;font-size:14px;color:#1e293b"><strong>Password:</strong> <span style="font-family:monospace;background:#e2e8f0;padding:2px 8px;border-radius:4px">${password}</span></p>
                <p style="margin:12px 0 0;font-size:12px;color:#94a3b8">Please change your password after first login.</p>
              </div>
              <div style="text-align:center;margin-bottom:24px">
                <a href="${loginUrl}" style="display:inline-block;background:#0a1017;color:#ffffff;padding:12px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px">
                  Access Corporate Portal →
                </a>
              </div>
              <p style="color:#94a3b8;font-size:12px;line-height:1.6;margin:0">
                Questions? Contact us at <a href="mailto:${brand.contact.emailInfo}" style="color:#0a1017">${brand.contact.emailInfo}</a>
              </p>
            </div>
          </div>
        `,
      })
    } catch (e: unknown) {
      return Response.json({ ok: true, email_error: (e as Error).message, password })
    }

    return Response.json({ ok: true })
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 })
}
