'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CorporateSidebar from '@/components/CorporateSidebar'

interface Booking {
  id: string; booking_number: string; pickup_date: string; pickup_time: string
  pickup_location: string; dropoff_location: string; name: string; email: string
  passengers: number; vehicle_id: string; total_price: number; gratuity_amount: number | null
  status: string; invoice_status: string; flight_number: string | null; notes: string | null
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

export default function CorporateBookingsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [account, setAccount] = useState<{ company_name: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [modifying, setModifying] = useState<string | null>(null)
  const [modifyForm, setModifyForm] = useState({ pickup_date: '', pickup_time: '', pickup_location: '', dropoff_location: '', flight_number: '', notes: '' })
  const [actionLoading, setActionLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'active' | 'past'>('all')

  useEffect(() => {
    async function load() {
      const [ab, aa] = await Promise.all([
        fetch('/api/corporate/dashboard?type=bookings'),
        fetch('/api/corporate/dashboard?type=account'),
      ])
      if (ab.status === 401) { router.replace('/corporate/login'); return }
      const [db, da] = await Promise.all([ab.json(), aa.json()])
      setBookings(db.bookings ?? [])
      setAccount(da.account ?? null)
      setLoading(false)
    }
    load()
  }, [router])

  async function logout() {
    await fetch('/api/corporate/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'logout' }) })
    window.location.href = '/corporate/login'
  }

  function startModify(b: Booking) {
    setModifying(b.id)
    setModifyForm({
      pickup_date: b.pickup_date,
      pickup_time: b.pickup_time,
      pickup_location: b.pickup_location,
      dropoff_location: b.dropoff_location,
      flight_number: b.flight_number ?? '',
      notes: b.notes ?? '',
    })
  }

  async function submitModify(bookingId: string) {
    setActionLoading(true)
    const b = bookings.find(x => x.id === bookingId)!
    const changes: Record<string, string> = {}
    if (modifyForm.pickup_date !== b.pickup_date) changes.pickup_date = modifyForm.pickup_date
    if (modifyForm.pickup_time !== b.pickup_time) changes.pickup_time = modifyForm.pickup_time
    if (modifyForm.pickup_location !== b.pickup_location) changes.pickup_location = modifyForm.pickup_location
    if (modifyForm.dropoff_location !== b.dropoff_location) changes.dropoff_location = modifyForm.dropoff_location
    if (modifyForm.flight_number !== (b.flight_number ?? '')) changes.flight_number = modifyForm.flight_number
    if (modifyForm.notes !== (b.notes ?? '')) changes.notes = modifyForm.notes

    if (Object.keys(changes).length === 0) { setModifying(null); setActionLoading(false); return }

    const r = await fetch('/api/corporate/manage', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'modify', booking_id: bookingId, changes }),
    })
    const d = await r.json()
    setActionLoading(false)
    if (d.ok) {
      setBookings(prev => prev.map(x => x.id === bookingId ? { ...x, status: 'modification_requested' } : x))
      setModifying(null)
    }
  }

  async function cancelBooking(bookingId: string, bookingNumber: string) {
    if (!confirm(`Cancel booking ${bookingNumber}?`)) return
    setActionLoading(true)
    const r = await fetch('/api/corporate/manage', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel', booking_id: bookingId }),
    })
    const d = await r.json()
    setActionLoading(false)
    if (d.ok) setBookings(prev => prev.map(x => x.id === bookingId ? { ...x, status: 'cancelled' } : x))
  }

  const filtered = bookings.filter(b => {
    if (filter === 'active') return ['pending', 'confirmed', 'modification_requested'].includes(b.status)
    if (filter === 'past') return ['completed', 'cancelled'].includes(b.status)
    return true
  })

  const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a1017]'

  if (loading) return (
    <div className="min-h-screen bg-[#0a1017] flex items-center justify-center">
      <div className="text-white text-sm">Loading…</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <CorporateSidebar company={account?.company_name} onLogout={logout} />
      <div className="flex-1 lg:ml-56">
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-800">Bookings</h1>
            <a href="/corporate/book" className="bg-[#0a1017] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#1a2530] transition-colors">
              + New Booking
            </a>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 bg-white rounded-2xl p-1 border border-slate-100 w-fit">
            {(['all', 'active', 'past'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize ${filter === f ? 'bg-[#0a1017] text-white' : 'text-white hover:text-slate-800'}`}>
                {f} {f === 'all' ? `(${bookings.length})` : f === 'active' ? `(${bookings.filter(b => ['pending','confirmed','modification_requested'].includes(b.status)).length})` : `(${bookings.filter(b => ['completed','cancelled'].includes(b.status)).length})`}
              </button>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="bg-white rounded-2xl p-10 border border-slate-100 text-center text-white text-sm">
              No bookings.{' '}<a href="/corporate/book" className="text-[#2b353d] font-medium hover:underline">Book your first ride →</a>
            </div>
          )}

          <div className="space-y-3">
            {filtered.map(b => {
              const canManage = ['pending', 'confirmed'].includes(b.status)
              const isExpanded = expanded === b.id
              const isModifying = modifying === b.id
              return (
                <div key={b.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                  {/* Summary row */}
                  <button onClick={() => { setExpanded(isExpanded ? null : b.id); setModifying(null) }}
                    className="w-full text-left px-5 py-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-800 text-sm">#{b.booking_number}</span>
                        <span className={`text-xs border rounded-full px-2.5 py-0.5 font-medium ${STATUS_COLOR[b.status] ?? 'bg-slate-100 text-white'}`}>
                          {STATUS_LABEL[b.status] ?? b.status}
                        </span>
                        {b.invoice_status === 'invoiced' && <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 rounded-full px-2.5 py-0.5">Invoiced</span>}
                        {b.invoice_status === 'paid' && <span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2.5 py-0.5">Paid</span>}
                      </div>
                      <p className="text-sm text-white mt-0.5 truncate">{b.pickup_location} → {b.dropoff_location}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-slate-800 text-sm">${Number(b.total_price).toFixed(2)}</p>
                      <p className="text-xs text-white">{fmt(b.pickup_date)} · {b.pickup_time?.slice(0,5)}</p>
                    </div>
                    <svg className={`w-4 h-4 text-white shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>

                  {/* Detail panel */}
                  {isExpanded && !isModifying && (
                    <div className="border-t border-slate-100 px-5 py-4 space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                        <div><p className="text-xs text-white mb-0.5">Passenger</p><p className="font-medium text-slate-800">{b.name}</p></div>
                        <div><p className="text-xs text-white mb-0.5">Email</p><p className="font-medium text-slate-800 truncate">{b.email}</p></div>
                        <div><p className="text-xs text-white mb-0.5">Vehicle</p><p className="font-medium text-slate-800 capitalize">{b.vehicle_id}</p></div>
                        <div><p className="text-xs text-white mb-0.5">Passengers</p><p className="font-medium text-slate-800">{b.passengers}</p></div>
                        {b.flight_number && <div><p className="text-xs text-white mb-0.5">Flight</p><p className="font-medium text-slate-800">{b.flight_number}</p></div>}
                        {b.gratuity_amount ? <div><p className="text-xs text-white mb-0.5">Gratuity</p><p className="font-medium text-green-700">${Number(b.gratuity_amount).toFixed(2)}</p></div> : null}
                        {b.notes && <div className="col-span-2 sm:col-span-3"><p className="text-xs text-white mb-0.5">Notes</p><p className="text-slate-700">{b.notes}</p></div>}
                      </div>
                      {canManage && (
                        <div className="flex gap-2 pt-2 border-t border-slate-100">
                          <button onClick={() => startModify(b)}
                            className="flex-1 border border-slate-200 text-slate-700 text-sm font-semibold py-2 rounded-xl hover:bg-slate-50 transition-colors">
                            Request Change
                          </button>
                          <button onClick={() => cancelBooking(b.id, b.booking_number)} disabled={actionLoading}
                            className="flex-1 border border-red-200 text-red-600 text-sm font-semibold py-2 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50">
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Modify form */}
                  {isModifying && (
                    <div className="border-t border-slate-100 px-5 py-4 space-y-4">
                      <p className="text-sm font-semibold text-slate-700">Request Change — #{b.booking_number}</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-white mb-1">Date</label>
                          <input type="date" className={inputCls} value={modifyForm.pickup_date}
                            onChange={e => setModifyForm(f => ({ ...f, pickup_date: e.target.value }))} />
                        </div>
                        <div>
                          <label className="block text-xs text-white mb-1">Time</label>
                          <input type="time" className={inputCls} value={modifyForm.pickup_time}
                            onChange={e => setModifyForm(f => ({ ...f, pickup_time: e.target.value }))} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-white mb-1">Pickup</label>
                        <input className={inputCls} value={modifyForm.pickup_location}
                          onChange={e => setModifyForm(f => ({ ...f, pickup_location: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-xs text-white mb-1">Dropoff</label>
                        <input className={inputCls} value={modifyForm.dropoff_location}
                          onChange={e => setModifyForm(f => ({ ...f, dropoff_location: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-xs text-white mb-1">Flight Number</label>
                        <input className={inputCls} placeholder="e.g. AA1234" value={modifyForm.flight_number}
                          onChange={e => setModifyForm(f => ({ ...f, flight_number: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-xs text-white mb-1">Notes</label>
                        <textarea className={inputCls + ' resize-none'} rows={2} value={modifyForm.notes}
                          onChange={e => setModifyForm(f => ({ ...f, notes: e.target.value }))} />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setModifying(null)} className="flex-1 border border-slate-200 text-white text-sm font-semibold py-2 rounded-xl hover:bg-slate-50">
                          Cancel
                        </button>
                        <button onClick={() => submitModify(b.id)} disabled={actionLoading}
                          className="flex-1 bg-[#0a1017] text-white text-sm font-semibold py-2 rounded-xl hover:bg-[#1a2530] disabled:opacity-50">
                          {actionLoading ? 'Submitting…' : 'Submit Request'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
