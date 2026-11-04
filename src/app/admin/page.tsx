'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Booking, BookingStatus } from '@/types'
import { formatPrice } from '@/lib/pricing'
import BookingDrawer from './BookingDrawer'

const STATUS_COLORS: Record<BookingStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-slate-100 text-slate-600',
  modification_requested: 'bg-blue-100 text-blue-700',
}

const SERVICE_ICONS: Record<string, string> = {
  airport: '✈️', wedding: '💍', hourly: '⏱️', corporate: '💼', tour: '🌴', sedan: '🚗', suv: '🚙',
}

interface Driver {
  id: string; name: string; phone: string; commission_rate: number
  accepted_count: number; rejected_count: number
  avgRating: number | null; ratingCount: number; acceptRate: number | null; score: number
  vehicles?: { name?: string; make?: string; model?: string; plate?: string } | null
}

type ExtendedBooking = Booking & {
  booking_number?: string; driver_id?: string; admin_notes?: string
  estimated_miles?: number; flight_number?: string; meet_greet?: boolean
  luggage?: number; vehicle_id?: string; stripe_payment_intent_id?: string
  driver_status?: string; driver_accepted?: string
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function BookingCard({ b, onClick }: { b: ExtendedBooking; onClick: () => void }) {
  return (
    <div onClick={onClick}
      className="bg-white border border-slate-100 rounded-xl p-4 cursor-pointer hover:shadow-md hover:border-slate-200 transition-all group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="text-xl mt-0.5">{SERVICE_ICONS[b.service_type] ?? SERVICE_ICONS[b.vehicle_id ?? ''] ?? '🚗'}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className="font-semibold text-slate-900 text-sm">{b.name}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[b.status]}`}>
                {b.status === 'modification_requested' ? 'Change' : b.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 capitalize">{b.service_type} · {b.pickup_date} {b.pickup_time}</p>
            <p className="text-xs text-slate-500 truncate max-w-[200px]">{b.pickup_location}</p>
          </div>
        </div>
        <p className="text-base font-bold text-[#2b353d] shrink-0">{formatPrice(b.total_price)}</p>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const [bookings, setBookings] = useState<ExtendedBooking[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ExtendedBooking | null>(null)
  const [view, setView] = useState<'dashboard' | 'all'>('dashboard')
  const [filter, setFilter] = useState<BookingStatus | 'all'>('all')

  useEffect(() => {
    Promise.all([
      fetch('/api/bookings').then(r => r.json()),
      fetch('/api/admin/drivers').then(r => r.json()),
    ]).then(([b, d]) => {
      setBookings(Array.isArray(b) ? b : [])
      setDrivers(Array.isArray(d) ? d : [])
      setLoading(false)
    })
  }, [])

  function handleUpdate(updated: Booking) {
    setBookings(prev => prev.map(b => b.id === updated.id ? { ...b, ...updated } : b))
    setSelected(prev => prev?.id === updated.id ? { ...prev, ...updated } : prev)
  }

  const today = todayStr()
  const revenue = bookings.filter(b => b.payment_status === 'paid').reduce((s, b) => s + b.total_price, 0)
  // incomplete = started but never paid; pending = paid but not yet confirmed (rare, but possible edge case)
  const incomplete = bookings.filter(b => b.status === 'pending' && b.payment_status !== 'paid')
  const pending = bookings.filter(b => b.status === 'pending' && b.payment_status === 'paid')
  const modifications = bookings.filter(b => b.status === 'modification_requested')
  const todayBookings = bookings.filter(b => b.pickup_date === today)
  const upcoming = bookings
    .filter(b => b.pickup_date >= today && b.status !== 'cancelled' && b.status !== 'completed')
    .sort((a, b) => (a.pickup_date + a.pickup_time).localeCompare(b.pickup_date + b.pickup_time))
    .slice(0, 5)

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter)

  const QUICK_LINKS = [
    { href: '/admin/drivers', icon: '🤵', label: 'Drivers', sub: `${drivers.length} active` },
    { href: '/admin/pricing', icon: '💰', label: 'Pricing', sub: 'Counties & rates' },
    { href: '/admin/subscribers', icon: '📋', label: 'Subscribers', sub: 'Email list' },
    { href: '/admin/fleet', icon: '🚗', label: 'Fleet', sub: 'Vehicles' },
  ]

  return (
    <div>
      {/* View toggle */}
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => setView('dashboard')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'dashboard' ? 'bg-[#2b353d] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'}`}>
          Dashboard
        </button>
        <button onClick={() => setView('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'all' ? 'bg-[#2b353d] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'}`}>
          All Bookings
          {bookings.length > 0 && <span className="ml-2 text-xs opacity-70">{bookings.length}</span>}
        </button>
      </div>

      {view === 'dashboard' && (
        <div className="space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Revenue', value: formatPrice(revenue), icon: '💵', color: 'text-emerald-600' },
              { label: 'Total Bookings', value: bookings.length, icon: '📦', color: 'text-slate-900' },
              { label: "Today's Trips", value: todayBookings.length, icon: '📅', color: 'text-blue-600' },
              { label: 'Needs Attention', value: pending.length + modifications.length, icon: '⚠️', color: 'text-yellow-600' },
            ].map(s => (
              <div key={s.label} className="bg-white border border-slate-100 rounded-2xl p-5">
                <div className="text-2xl mb-2">{s.icon}</div>
                <p className={`text-2xl font-extrabold ${s.color} mb-0.5`}>{s.value}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wide">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Needs Attention + Quick Links */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Needs Attention */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Needs Attention</h2>
                {(pending.length + modifications.length) > 0 && (
                  <button onClick={() => { setFilter('all'); setView('all') }}
                    className="text-xs text-[#2b353d] hover:underline font-medium">View all →</button>
                )}
              </div>
              {loading ? (
                <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}</div>
              ) : [...pending, ...modifications].length === 0 ? (
                <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center">
                  <p className="text-3xl mb-2">✅</p>
                  <p className="text-slate-500 text-sm">All caught up!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {[...pending, ...modifications].slice(0, 4).map(b => (
                    <BookingCard key={b.id} b={b} onClick={() => setSelected(b)} />
                  ))}
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div>
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Quick Links</h2>
              <div className="space-y-2">
                {QUICK_LINKS.map(l => (
                  <Link key={l.href} href={l.href}
                    className="flex items-center gap-3 bg-white border border-slate-100 rounded-xl px-4 py-3 hover:shadow-sm hover:border-slate-200 transition-all group">
                    <span className="text-xl">{l.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 group-hover:text-[#2b353d] transition-colors">{l.label}</p>
                      <p className="text-xs text-slate-500">{l.sub}</p>
                    </div>
                    <svg className="ml-auto w-4 h-4 text-slate-400 group-hover:text-[#2b353d] transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Incomplete / Abandoned */}
          {incomplete.length > 0 && (
            <IncompleteSection bookings={incomplete} onDelete={id => setBookings(prev => prev.filter(b => b.id !== id))} />
          )}

          {/* Upcoming Trips */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Upcoming Trips</h2>
              <button onClick={() => setView('all')} className="text-xs text-[#2b353d] hover:underline font-medium">View all →</button>
            </div>
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}</div>
            ) : upcoming.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center">
                <p className="text-slate-500 text-sm">No upcoming bookings.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {upcoming.map(b => (
                  <BookingCard key={b.id} b={b} onClick={() => setSelected(b)} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'all' && (
        <div>
          <div className="flex gap-2 mb-6 flex-wrap">
            {(['all', 'pending', 'confirmed', 'modification_requested', 'cancelled', 'completed'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${filter === f ? 'bg-[#2b353d] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                {f === 'modification_requested' ? 'Change Requests' : f}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-slate-400">No bookings found.</div>
          ) : (
            <div className="space-y-3">
              {filtered.map(b => (
                <div key={b.id} onClick={() => setSelected(b)}
                  className="bg-white border border-slate-100 rounded-xl p-5 cursor-pointer hover:shadow-md hover:border-slate-200 transition-all group">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-4">
                      <span className="text-2xl mt-0.5">{SERVICE_ICONS[b.service_type] ?? SERVICE_ICONS[b.vehicle_id ?? ''] ?? '🚗'}</span>
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-bold text-slate-900 group-hover:text-[#2b353d] transition-colors">{b.name}</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[b.status]}`}>
                            {b.status === 'modification_requested' ? 'Change Request' : b.status}
                          </span>
                          {b.payment_status === 'paid' && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Paid</span>}
                          {b.driver_id && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">Driver Assigned</span>}
                        </div>
                        <p className="text-sm text-slate-500 capitalize">{b.service_type} · {b.pickup_date} {b.pickup_time}</p>
                        <p className="text-sm text-slate-500 truncate max-w-sm">
                          {b.pickup_location}{b.dropoff_location ? ` → ${b.dropoff_location}` : ''}
                        </p>
                        {b.booking_number && <p className="text-xs text-slate-500 mt-0.5 font-mono">{b.booking_number}</p>}
                        <p className="text-xs text-slate-500">{b.email} · {b.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-extrabold text-[#2b353d] mb-1">{formatPrice(b.total_price)}</p>
                      <p className="text-xs text-slate-400 group-hover:text-[#2b353d] transition-colors">Click to open →</p>
                      {b.status === 'modification_requested' && b.pending_changes && (
                        <p className="text-xs text-blue-600 font-semibold mt-1">Change requested</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <BookingDrawer
        booking={selected}
        drivers={drivers}
        onClose={() => setSelected(null)}
        onUpdate={handleUpdate}
      />
    </div>
  )
}

function IncompleteSection({ bookings, onDelete }: { bookings: ExtendedBooking[]; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function del(id: string) {
    if (!confirm('Delete this incomplete booking?')) return
    setDeleting(id)
    await fetch(`/api/bookings/${id}`, { method: 'DELETE' })
    onDelete(id)
    setDeleting(null)
  }

  return (
    <div>
      <button onClick={() => setExpanded(e => !e)}
        className="flex items-center gap-2 w-full text-left mb-3 group">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Incomplete Bookings</h2>
        <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">{bookings.length}</span>
        <svg className={`ml-auto w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {expanded && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 mb-3">These customers started a booking but did not complete payment. No action needed.</p>
          {bookings.map(b => (
            <div key={b.id} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-700 truncate">{b.name} <span className="font-mono text-xs text-slate-500">{b.booking_number}</span></p>
                <p className="text-xs text-slate-500">{b.service_type} · {b.pickup_date} · {formatPrice(b.total_price)}</p>
              </div>
              <button onClick={() => del(b.id)} disabled={deleting === b.id}
                className="text-xs text-red-500 hover:text-red-700 font-semibold flex-shrink-0 disabled:opacity-40">
                {deleting === b.id ? '…' : 'Delete'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
