import { Document, Page, Text, View, StyleSheet, Image, pdf } from '@react-pdf/renderer'
import path from 'path'
import fs from 'fs'
import { brand } from '@/config/brand'

const LOGO_PATH = path.join(process.cwd(), 'public', path.basename(brand.assets.logoPdf))
const LOGO_BASE64 = (() => {
  try { return `data:image/png;base64,${fs.readFileSync(LOGO_PATH).toString('base64')}` }
  catch { return null }
})()

const COMPANY = {
  name: brand.company.legalName,
  address: brand.address.street,
  city: `${brand.address.locality}, ${brand.address.region} ${brand.address.postalCode}`,
  phone: brand.contact.phone,
  email: brand.contact.emailReservations,
  website: brand.site.domain,
  ma_sales_tax_rate: brand.service.salesTaxRate,
  county_surtax_rate: brand.service.surtaxRate,
}

const C = {
  navy: '#0f1922', navyMid: '#1a2530',
  gold: '#c9a96e', goldLight: '#e8d5b0',
  white: '#ffffff', offWhite: '#f8f9fb',
  slate: '#64748b', slateLight: '#94a3b8',
  border: '#e2e8f0', rowAlt: '#f8fafc',
  amber: '#d97706', green: '#059669', red: '#dc2626',
}

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', backgroundColor: C.white, paddingBottom: 56 },
  header: { backgroundColor: C.navy, paddingHorizontal: 40, paddingVertical: 26, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logo: { width: 130, height: 53 },
  logoText: { color: C.white, fontSize: 18, fontFamily: 'Helvetica-Bold', letterSpacing: 2 },
  logoSub: { color: C.gold, fontSize: 8, letterSpacing: 3, marginTop: 3 },
  headerRight: { alignItems: 'flex-end' },
  invoiceLabel: { color: C.gold, fontSize: 8, letterSpacing: 4, fontFamily: 'Helvetica-Bold', marginBottom: 5 },
  invoiceNum: { color: C.white, fontSize: 19, fontFamily: 'Helvetica-Bold' },
  stripe: { backgroundColor: C.gold, height: 3 },
  subHeader: { backgroundColor: C.navyMid, paddingHorizontal: 40, paddingVertical: 11, flexDirection: 'row', justifyContent: 'space-between' },
  subLabel: { color: C.slateLight, fontSize: 9 },
  subVal: { color: C.white, fontSize: 9, fontFamily: 'Helvetica-Bold' },
  subValAmber: { color: C.amber, fontSize: 9, fontFamily: 'Helvetica-Bold' },
  body: { paddingHorizontal: 40 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, marginBottom: 20, gap: 16 },
  metaBox: { flex: 1 },
  sectionLabel: { color: C.gold, fontSize: 7, letterSpacing: 3, fontFamily: 'Helvetica-Bold', marginBottom: 7, borderBottomWidth: 1, borderBottomColor: C.gold, paddingBottom: 3 },
  metaBold: { color: C.navy, fontSize: 10, fontFamily: 'Helvetica-Bold', lineHeight: 1.5 },
  metaLine: { color: C.navyMid, fontSize: 9, lineHeight: 1.6 },
  metaSlate: { color: C.slate, fontSize: 8.5, lineHeight: 1.6 },
  divider: { height: 1, backgroundColor: C.border, marginBottom: 16 },
  tableHeader: { flexDirection: 'row', backgroundColor: C.navy, paddingVertical: 8, borderRadius: 4, marginBottom: 1 },
  th: { color: C.white, fontSize: 7, fontFamily: 'Helvetica-Bold', letterSpacing: 0.8, paddingHorizontal: 9 },
  row: { flexDirection: 'row', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  rowAlt: { backgroundColor: C.rowAlt },
  td: { color: C.navyMid, fontSize: 8, paddingHorizontal: 9 },
  tdMono: { color: C.navyMid, fontSize: 7.5, fontFamily: 'Helvetica-Bold', paddingHorizontal: 9 },
  tdSlate: { color: C.slate, fontSize: 7.5, paddingHorizontal: 9 },
  tdRight: { color: C.navy, fontSize: 8.5, fontFamily: 'Helvetica-Bold', paddingHorizontal: 9, textAlign: 'right' },
  tdDiscount: { color: C.green, fontSize: 7.5, paddingHorizontal: 9, textAlign: 'right' },
  cNum: { width: '13%' }, cDate: { width: '11%' }, cTime: { width: '9%' },
  cPass: { width: '14%' }, cRoute: { flex: 1 }, cFare: { width: '12%' },

  // Totals block
  totalWrap: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14 },
  totalBox: { width: 230 },
  tRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, paddingHorizontal: 4 },
  tLabel: { color: C.slate, fontSize: 9 },
  tVal: { color: C.navyMid, fontSize: 9 },
  tLabelBold: { color: C.navy, fontSize: 9, fontFamily: 'Helvetica-Bold' },
  tValBold: { color: C.navy, fontSize: 9, fontFamily: 'Helvetica-Bold' },
  tDiscount: { color: C.green, fontSize: 9, fontFamily: 'Helvetica-Bold' },
  tGrand: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, paddingVertical: 8, backgroundColor: C.navy, borderRadius: 4, marginTop: 4 },
  tGrandLabel: { color: C.white, fontSize: 11, fontFamily: 'Helvetica-Bold' },
  tGrandVal: { color: C.gold, fontSize: 11, fontFamily: 'Helvetica-Bold' },
  dividerThin: { height: 1, backgroundColor: C.border, marginVertical: 3 },
  taxNote: { color: C.slateLight, fontSize: 7, paddingHorizontal: 4, marginTop: 4, lineHeight: 1.5 },

  paymentRow: { flexDirection: 'row', gap: 14, marginTop: 22 },
  payBox: { flex: 1, backgroundColor: C.offWhite, borderRadius: 5, padding: 12, borderLeftWidth: 3, borderLeftColor: C.gold },
  payLabel: { color: C.gold, fontSize: 7, letterSpacing: 2.5, fontFamily: 'Helvetica-Bold', marginBottom: 6 },
  payText: { color: C.slate, fontSize: 8, lineHeight: 1.7 },
  payBold: { color: C.navyMid, fontFamily: 'Helvetica-Bold' },
  disputeBox: { backgroundColor: '#fff7ed', borderRadius: 5, padding: 12, borderLeftWidth: 3, borderLeftColor: C.amber, marginTop: 14 },
  disputeLabel: { color: C.amber, fontSize: 7, letterSpacing: 2.5, fontFamily: 'Helvetica-Bold', marginBottom: 5 },
  disputeText: { color: '#92400e', fontSize: 8, lineHeight: 1.7 },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  footerStripe: { height: 3, backgroundColor: C.gold },
  footerBar: { backgroundColor: C.navy, paddingHorizontal: 40, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerText: { color: C.slateLight, fontSize: 7.5 },
  footerBold: { color: C.goldLight, fontSize: 7.5, fontFamily: 'Helvetica-Bold' },
})

function fmt(n: number) { return `$${Number(n).toFixed(2)}` }
function trunc(s: string | null | undefined, n: number) {
  if (!s) return ''
  return s.length > n ? s.slice(0, n) + '…' : s
}
function pct(n: number) { return `${n}%` }

export interface InvoiceBooking {
  booking_number: string
  pickup_date: string
  pickup_time?: string | null
  name: string
  pickup_location: string
  dropoff_location?: string | null
  vehicle_name?: string | null
  total_price: number
  gratuity_amount?: number | null
}

export interface InvoiceAccount {
  company_name: string
  contact_name: string
  billing_email: string
  contact_email: string
  address?: string | null
  payment_terms?: number
}

export interface InvoiceData {
  invoice_number: string
  period_start: string
  period_end: string
  due_date: string
  invoice_date: string
  bookings: InvoiceBooking[]
  discount_rate: number
  subtotal_original: number
  discount_amount: number
  subtotal_discounted: number
  fl_sales_tax: number
  county_surtax: number
  gratuity_total: number
  total: number
  account: InvoiceAccount
}

function InvoiceDoc({ data }: { data: InvoiceData }) {
  const {
    invoice_number, period_start, period_end, due_date, invoice_date,
    bookings, discount_rate, subtotal_original, discount_amount,
    subtotal_discounted, fl_sales_tax, county_surtax, gratuity_total, total, account,
  } = data
  const billingEmail = account.billing_email || account.contact_email

  return (
    <Document title={`Invoice ${invoice_number} — ${COMPANY.name}`} author={COMPANY.name} subject="Corporate Invoice">
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.header}>
          <View>
            {LOGO_BASE64
              ? <Image src={LOGO_BASE64} style={s.logo} />
              : <View><Text style={s.logoText}>{COMPANY.name.toUpperCase()}</Text><Text style={s.logoSub}>PREMIUM TRANSPORTATION</Text></View>}
          </View>
          <View style={s.headerRight}>
            <Text style={s.invoiceLabel}>INVOICE</Text>
            <Text style={s.invoiceNum}>{invoice_number}</Text>
          </View>
        </View>
        <View style={s.stripe} />

        {/* Sub-header */}
        <View style={s.subHeader}>
          <View><Text style={s.subLabel}>Date: <Text style={s.subVal}>{invoice_date}</Text></Text></View>
          <View><Text style={s.subLabel}>Period: <Text style={s.subVal}>{period_start} – {period_end}</Text></Text></View>
          <View><Text style={s.subLabel}>Due: <Text style={s.subValAmber}>{due_date}</Text></Text></View>
          <View><Text style={s.subLabel}>Terms: <Text style={s.subVal}>Net {account.payment_terms ?? 30}</Text></Text></View>
          {discount_rate > 0 && <View><Text style={s.subLabel}>Corp. Discount: <Text style={{ color: C.gold, fontSize: 9, fontFamily: 'Helvetica-Bold' }}>{pct(discount_rate)}</Text></Text></View>}
        </View>

        <View style={s.body}>
          {/* Meta */}
          <View style={s.metaRow}>
            <View style={s.metaBox}>
              <Text style={s.sectionLabel}>BILL TO</Text>
              <Text style={s.metaBold}>{account.company_name}</Text>
              <Text style={s.metaLine}>{account.contact_name}</Text>
              <Text style={s.metaSlate}>{billingEmail}</Text>
              {account.address ? <Text style={s.metaSlate}>{account.address}</Text> : null}
            </View>
            <View style={s.metaBox}>
              <Text style={s.sectionLabel}>FROM</Text>
              <Text style={s.metaBold}>{COMPANY.name}</Text>
              <Text style={s.metaLine}>{COMPANY.address}</Text>
              <Text style={s.metaSlate}>{COMPANY.city}</Text>
              <Text style={s.metaSlate}>{COMPANY.phone}</Text>
              <Text style={s.metaSlate}>{COMPANY.email}</Text>
            </View>
            <View style={[s.metaBox, { alignItems: 'flex-end' }]}>
              <Text style={s.sectionLabel}>TOTAL DUE</Text>
              <Text style={{ color: C.navy, fontSize: 26, fontFamily: 'Helvetica-Bold' }}>{fmt(total)}</Text>
              <Text style={s.metaSlate}>{bookings.length} trip{bookings.length !== 1 ? 's' : ''} · incl. 6.25% MA tax</Text>
              <View style={{ backgroundColor: C.amber, borderRadius: 3, paddingHorizontal: 8, paddingVertical: 3, marginTop: 5 }}>
                <Text style={{ color: C.white, fontSize: 7.5, fontFamily: 'Helvetica-Bold' }}>DUE {due_date.toUpperCase()}</Text>
              </View>
            </View>
          </View>

          <View style={s.divider} />

          {/* Table */}
          <View style={s.tableHeader}>
            <Text style={[s.th, s.cNum]}>BOOKING #</Text>
            <Text style={[s.th, s.cDate]}>DATE</Text>
            <Text style={[s.th, s.cTime]}>TIME</Text>
            <Text style={[s.th, s.cPass]}>PASSENGER</Text>
            <Text style={[s.th, s.cRoute]}>ROUTE</Text>
            <Text style={[s.th, s.cFare, { textAlign: 'right' }]}>ORIG. FARE</Text>
          </View>

          {bookings.map((b, i) => {
            const timeStr = b.pickup_time ? b.pickup_time.slice(0, 5) : '—'
            return (
              <View key={b.booking_number} style={[s.row, i % 2 === 1 ? s.rowAlt : {}]}>
                <View style={s.cNum}><Text style={s.tdMono}>{b.booking_number}</Text></View>
                <View style={s.cDate}><Text style={s.tdSlate}>{b.pickup_date}</Text></View>
                <View style={s.cTime}><Text style={s.tdSlate}>{timeStr}</Text></View>
                <View style={s.cPass}><Text style={s.td}>{trunc(b.name, 14)}</Text></View>
                <View style={s.cRoute}>
                  <Text style={s.td}>{trunc(b.pickup_location, 42)}</Text>
                  {b.dropoff_location
                    ? <Text style={[s.tdSlate, { marginTop: 2 }]}>→ {trunc(b.dropoff_location, 42)}</Text>
                    : null}
                </View>
                <View style={s.cFare}>
                  <Text style={s.tdRight}>{fmt(Number(b.total_price))}</Text>
                  {b.gratuity_amount && Number(b.gratuity_amount) > 0
                    ? <Text style={[s.tdSlate, { textAlign: 'right', marginTop: 2, color: '#059669', fontSize: 7 }]}>+{fmt(Number(b.gratuity_amount))} tip</Text>
                    : null}
                </View>
              </View>
            )
          })}

          {/* Totals */}
          <View style={s.totalWrap} wrap={false}>
            <View style={s.totalBox}>
              <View style={s.tRow}>
                <Text style={s.tLabel}>Original Subtotal ({bookings.length} trips)</Text>
                <Text style={s.tVal}>{fmt(subtotal_original)}</Text>
              </View>
              {discount_rate > 0 && (
                <View style={s.tRow}>
                  <Text style={s.tLabel}>Corporate Discount ({pct(discount_rate)})</Text>
                  <Text style={s.tDiscount}>–{fmt(discount_amount)}</Text>
                </View>
              )}
              <View style={[s.tRow, { borderTopWidth: 1, borderTopColor: C.border, marginTop: 2, paddingTop: 6 }]}>
                <Text style={s.tLabelBold}>Discounted Subtotal</Text>
                <Text style={s.tValBold}>{fmt(subtotal_discounted)}</Text>
              </View>
              <View style={s.tRow}>
                <Text style={s.tLabel}>Sales Tax ({(COMPANY.ma_sales_tax_rate * 100).toFixed(2)}%)</Text>
                <Text style={s.tVal}>{fmt(fl_sales_tax)}</Text>
              </View>
              {gratuity_total > 0 && (
                <View style={s.tRow}>
                  <Text style={s.tLabel}>Driver Gratuity (tax-exempt)</Text>
                  <Text style={[s.tVal, { color: C.green }]}>{fmt(gratuity_total)}</Text>
                </View>
              )}
              <View style={s.tGrand}>
                <Text style={s.tGrandLabel}>TOTAL DUE</Text>
                <Text style={s.tGrandVal}>{fmt(total)}</Text>
              </View>
              <Text style={s.taxNote}>
                MA Dept. of Revenue · State 6.25%{'\n'}
                Applied to discounted fare. Gratuity passed 100% to driver (tax-exempt).
              </Text>
            </View>
          </View>

          {/* Payment + Dispute — wrap={false} keeps entire block on one page */}
          <View wrap={false}>
          <View style={s.paymentRow}>
            <View style={s.payBox}>
              <Text style={s.payLabel}>BANK TRANSFER (ACH / WIRE)</Text>
              <Text style={s.payText}>
                <Text style={s.payBold}>Bank:</Text> {'Chase Bank\n'}
                <Text style={s.payBold}>Account Name:</Text> {`${COMPANY.name}\n`}
                <Text style={s.payBold}>Account #:</Text> {'2916501108\n'}
                <Text style={s.payBold}>Routing #:</Text> {'267084131\n'}
                <Text style={s.payBold}>Ref:</Text> {invoice_number}
              </Text>
            </View>
            <View style={s.payBox}>
              <Text style={s.payLabel}>CONTACT US</Text>
              <Text style={s.payText}>
                <Text style={s.payBold}>Email: </Text>{COMPANY.email}{'\n'}
                <Text style={s.payBold}>Phone: </Text>{COMPANY.phone}{'\n'}
                <Text style={s.payBold}>Web: </Text>{COMPANY.website}{'\n'}
                {'\n'}
                Due within <Text style={s.payBold}>{account.payment_terms ?? 30} days</Text>.{'\n'}
                Ref: <Text style={s.payBold}>{invoice_number}</Text>
              </Text>
            </View>
          </View>

          <View style={s.disputeBox}>
            <Text style={s.disputeLabel}>DISPUTE POLICY</Text>
            <Text style={s.disputeText}>
              All billing inquiries and disputes must be submitted <Text style={{ fontFamily: 'Helvetica-Bold' }}>in writing via email</Text> to{' '}
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>{COMPANY.email}</Text> within{' '}
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>30 days</Text> of this invoice date. Please include your invoice number{' '}
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>{invoice_number}</Text> and the affected booking number(s).
              Disputes submitted after this period may not be honored.
            </Text>
          </View>
          </View>{/* end wrap={false} */}
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <View style={s.footerStripe} />
          <View style={s.footerBar}>
            <Text style={s.footerText}>{COMPANY.name} · {COMPANY.city} · {COMPANY.website}</Text>
            <Text style={s.footerBold}>{invoice_number}</Text>
            <Text style={s.footerText}>Page <Text render={({ pageNumber, totalPages }) => `${pageNumber} of ${totalPages}`} /></Text>
          </View>
        </View>

      </Page>
    </Document>
  )
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  const instance = pdf(<InvoiceDoc data={data} />)
  const blob = await instance.toBlob()
  const arrayBuffer = await blob.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

export const MA_SALES_TAX = COMPANY.ma_sales_tax_rate
export const COUNTY_SURTAX = COMPANY.county_surtax_rate

export function calcInvoiceTotals(bookings: InvoiceBooking[], discount_rate: number) {
  const subtotal_original = bookings.reduce((s, b) => s + Number(b.total_price), 0)
  const discount_amount = subtotal_original * (discount_rate / 100)
  const subtotal_discounted = subtotal_original - discount_amount
  const ma_sales_tax = subtotal_discounted * COMPANY.ma_sales_tax_rate
  const county_surtax = 0
  const gratuity_total = bookings.reduce((s, b) => s + Number(b.gratuity_amount ?? 0), 0)
  const total = subtotal_discounted + ma_sales_tax + gratuity_total
  return { subtotal_original, discount_amount, subtotal_discounted, fl_sales_tax: ma_sales_tax, ma_sales_tax, county_surtax, gratuity_total, total }
}
