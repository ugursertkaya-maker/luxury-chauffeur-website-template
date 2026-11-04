'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CorporateSidebar from '@/components/CorporateSidebar'

interface Booking {
  id: string; booking_number: string; pickup_date: string; pickup_time: string
  pickup_location: string; dropoff_location: string; name: string
  email: string; passengers: number; service_type: string; vehicle_id: string; total_price: number
  gratuity_amount: number | null; status: string; payment_status: string
  invoice_status: string; flight_number: string | null; notes: string | null; created_at: string
}
interface Invoice {
  id: string; invoice_number: string; period_start: string; period_end: string
  total_amount: number; status: string; sent_at: string | null; paid_at: string | null; created_at: string
}
interface Account {
  company_name: string; contact_name: string; contact_email: string
  phone: string; payment_terms: number; discount_rate: number; corporate_code: string
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending', confirmed: 'Confirmed', modification_requested: 'Change Requested',
  cancelled: 'Cancelled', completed: 'Completed',
}
const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmed: 'bg-green-50 text-green-700 border-green-200',
  modification_requested: 'bg-blue-50 text-blue-700 border-blue-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  completed: 'bg-slate-100 text-white border-slate-200',
}

function fmt(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function fmtPrice(n: number) { return '$' + Number(n).toFixed(2) }

export default function CorporateDashboard() {
  const router = useRouter()
  const [tab, setTab] = useState<'bookings' | 'invoices'>('bookings')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [account, setAccount] = useState<Account | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const [ab, ai, aa] = await Promise.all([
        fetch('/api/corporate/dashboard?type=bookings'),
        fetch('/api/corporate/dashboard?type=invoices'),
        fetch('/api/corporate/dashboard?type=account'),
      ])
      if (ab.status === 401) { router.replace('/corporate/login'); return }
      const [db, di, da] = await Promise.all([ab.json(), ai.json(), aa.json()])
      setBookings(db.bookings ?? [])
      setInvoices(di.invoices ?? [])
      setAccount(da.account ?? null)
      setLoading(false)
    }
    load()
  }, [router])

  async function logout() {
    await fetch('/api/corporate/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'logout' }) })
    window.location.href = '/corporate/login'
  }

  const activeBookings = bookings.filter(b => ['pending', 'confirmed', 'modification_requested'].includes(b.status))
  const unpaidInvoices = invoices.filter(i => i.status === 'sent')
  const uninvoicedTotal = bookings
    .filter(b => b.invoice_status === 'none' && ['confirmed', 'completed'].includes(b.status))
    .reduce((s, b) => s + Number(b.total_price), 0)
  const totalOutstanding = unpaidInvoices.reduce((s, i) => s + Number(i.total_amount), 0) + uninvoicedTotal

  if (loading) return (
    <div className="min-h-screen bg-[#0a1017] flex items-center justify-center">
      <div className="text-white text-sm">Loading…</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <CorporateSidebar company={account?.company_name} onLogout={logout} />

      {/* Main content — offset by sidebar width on desktop */}
      <div className="flex-1 lg:ml-56">
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

          {/* Page title */}
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
            {account?.discount_rate ? (
              <span className="inline-block mt-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2.5 py-0.5 font-medium">
                {account.discount_rate}% corporate discount
              </span>
            ) : null}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-100">
              <p className="text-xs text-white uppercase tracking-wide font-medium mb-1">Total Trips</p>
              <p className="text-3xl font-bold text-slate-800">{bookings.length}</p>
              <p className="text-sm text-white mt-0.5">{activeBookings.length} active</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100">
              <p className="text-xs text-white uppercase tracking-wide font-medium mb-1">Outstanding</p>
              <p className="text-3xl font-bold text-slate-800">{fmtPrice(totalOutstanding)}</p>
              <p className="text-sm text-white mt-0.5">
                {unpaidInvoices.length} unpaid{uninvoicedTotal > 0 ? ` · ${bookings.filter(b => b.invoice_status === 'none' && ['confirmed', 'completed'].includes(b.status)).length} pending` : ''}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100">
              <p className="text-xs text-white uppercase tracking-wide font-medium mb-1">Invoices</p>
              <p className="text-3xl font-bold text-slate-800">{invoices.length}</p>
              <p className="text-sm text-white mt-0.5">{unpaidInvoices.length} unpaid · Net {account?.payment_terms ?? 30} days</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-white rounded-2xl p-1 border border-slate-100 w-fit">
            {(['bookings', 'invoices'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-5 py-2 rounded-xl text-sm font-medium transition-colors capitalize ${tab === t ? 'bg-[#0a1017] text-white' : 'text-white hover:text-slate-800'}`}>
                {t} {t === 'bookings' ? `(${bookings.length})` : `(${invoices.length})`}
              </button>
            ))}
          </div>

          {/* Bookings */}
          {tab === 'bookings' && (
            <div className="space-y-3">
              {bookings.length === 0 && (
                <div className="bg-white rounded-2xl p-8 border border-slate-100 text-center text-white text-sm">
                  No bookings yet.{' '}
                  <a href="/corporate/book" className="text-[#2b353d] font-medium hover:underline">Book your first ride →</a>
                </div>
              )}
              {bookings.map(b => (
                <div key={b.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                  <button onClick={() => setExpanded(expanded === b.id ? null : b.id)}
                    className="w-full text-left px-5 py-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-800 text-sm">#{b.booking_number}</span>
                        <span className={`text-xs border rounded-full px-2.5 py-0.5 font-medium ${STATUS_COLOR[b.status] ?? 'bg-slate-100 text-white'}`}>
                          {STATUS_LABEL[b.status] ?? b.status}
                        </span>
                        {b.invoice_status === 'invoiced' && (
                          <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 rounded-full px-2.5 py-0.5">Invoiced</span>
                        )}
                      </div>
                      <p className="text-sm text-white mt-0.5 truncate">{b.pickup_location} → {b.dropoff_location}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-slate-800 text-sm">{fmtPrice(b.total_price)}</p>
                      <p className="text-xs text-white">{fmt(b.pickup_date)}</p>
                    </div>
                    <svg className={`w-4 h-4 text-white transition-transform shrink-0 ${expanded === b.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {expanded === b.id && (
                    <div className="border-t border-slate-100 px-5 py-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                      <div><p className="text-xs text-white mb-0.5">Passenger</p><p className="font-medium text-slate-800">{b.name}</p></div>
                      <div><p className="text-xs text-white mb-0.5">Date & Time</p><p className="font-medium text-slate-800">{fmt(b.pickup_date)} {b.pickup_time}</p></div>
                      <div><p className="text-xs text-white mb-0.5">Vehicle</p><p className="font-medium text-slate-800 capitalize">{b.vehicle_id}</p></div>
                      <div><p className="text-xs text-white mb-0.5">Passengers</p><p className="font-medium text-slate-800">{b.passengers}</p></div>
                      {b.flight_number && <div><p className="text-xs text-white mb-0.5">Flight</p><p className="font-medium text-slate-800">{b.flight_number}</p></div>}
                      {b.gratuity_amount ? <div><p className="text-xs text-white mb-0.5">Gratuity</p><p className="font-medium text-green-700">{fmtPrice(b.gratuity_amount)}</p></div> : null}
                      {b.notes && <div className="col-span-2 sm:col-span-3"><p className="text-xs text-white mb-0.5">Notes</p><p className="text-slate-700">{b.notes}</p></div>}
                      <div className="col-span-2 sm:col-span-3 pt-2 border-t border-slate-100">
                        <a href={`/manage?booking=${b.booking_number}&email=${encodeURIComponent(b.email ?? '')}`} className="text-sm text-[#2b353d] font-medium hover:underline">
                          Manage this booking →
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Invoices */}
          {tab === 'invoices' && (
            <div className="space-y-3">
              {invoices.length === 0 && (
                <div className="bg-white rounded-2xl p-8 border border-slate-100 text-center text-white text-sm">No invoices yet.</div>
              )}
              {invoices.map(inv => (
                <div key={inv.id} className="bg-white rounded-2xl border border-slate-100 px-5 py-4 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 text-sm">#{inv.invoice_number}</span>
                      <span className={`text-xs border rounded-full px-2.5 py-0.5 font-medium ${
                        inv.status === 'paid' ? 'bg-green-50 text-green-700 border-green-200' :
                        inv.status === 'sent' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                        'bg-slate-100 text-white border-slate-200'
                      }`}>{inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}</span>
                    </div>
                    <p className="text-xs text-white mt-0.5">
                      {fmt(inv.period_start)} – {fmt(inv.period_end)}
                      {inv.paid_at ? ` · Paid ${fmt(inv.paid_at.split('T')[0])}` : ''}
                    </p>
                  </div>
                  <p className="font-semibold text-slate-800">{fmtPrice(inv.total_amount)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
