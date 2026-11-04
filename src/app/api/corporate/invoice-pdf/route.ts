import { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getCorporateSession } from '@/lib/corporate-auth'
import { generateInvoicePDF, calcInvoiceTotals } from '@/lib/invoice-pdf'

export async function GET(req: NextRequest) {
  const session = await getCorporateSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const invoice_id = req.nextUrl.searchParams.get('invoice_id')
  if (!invoice_id) return Response.json({ error: 'Missing invoice_id' }, { status: 400 })

  const db = getSupabaseAdmin()

  const { data: invoice } = await db
    .from('invoices')
    .select('*')
    .eq('id', invoice_id)
    .eq('corporate_account_id', session.id)
    .single()

  if (!invoice) return Response.json({ error: 'Invoice not found' }, { status: 404 })

  const { data: account } = await db
    .from('corporate_accounts')
    .select('*')
    .eq('id', session.id)
    .single()

  if (!account) return Response.json({ error: 'Account not found' }, { status: 404 })

  const { data: bookings } = await db
    .from('bookings')
    .select('id, booking_number, pickup_date, pickup_time, pickup_location, dropoff_location, total_price, gratuity_amount, name')
    .eq('corporate_account_id', session.id)
    .in('invoice_status', ['invoiced', 'paid'])
    .gte('pickup_date', invoice.period_start)
    .lte('pickup_date', invoice.period_end)
    .order('pickup_date')

  const pdfBookings = (bookings ?? []).map(b => ({ ...b, vehicle_name: null }))
  const discount_rate = account.discount_rate ?? 0
  const totals = calcInvoiceTotals(pdfBookings, discount_rate)

  const dueDate = invoice.sent_at
    ? new Date(new Date(invoice.sent_at).getTime() + (account.payment_terms ?? 30) * 86400000)
    : new Date()

  const pdfBuffer = await generateInvoicePDF({
    invoice_number: invoice.invoice_number,
    period_start: invoice.period_start,
    period_end: invoice.period_end,
    due_date: dueDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    invoice_date: new Date(invoice.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    bookings: pdfBookings,
    discount_rate,
    ...totals,
    account,
  })

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invoice.invoice_number}.pdf"`,
    },
  })
}
