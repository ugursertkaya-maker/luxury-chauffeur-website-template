'use client'
import { useState } from 'react'
import Image from 'next/image'
import { formatPrice } from '@/lib/pricing'
import { brand } from '@/config/brand'

interface Vehicle { name?: string; make?: string; model?: string; plate?: string }
interface Driver { id: string; name: string; phone: string; commission_rate: number; vehicles?: Vehicle | null }
interface Trip {
  id: string
  booking_number: string
  name: string
  phone: string
  email: string
  service_type: string
  pickup_location: string
  dropoff_location?: string
  pickup_date: string
  pickup_time: string
  passengers: number
  flight_number?: string
  notes?: string
  total_price: number
  status: string
  driver_status: string | null
  driver_accepted: string | null
}
interface CalendarEntry {
  id: string
  booking_number: string
  pickup_date: string
  pickup_time: string
  service_type: string
  pickup_location: string
  dropoff_location?: string
  status: string
  driver_status: string | null
}

interface EarningEntry {
  id: string
  booking_number: string
  pickup_date: string
  total_price: number
  gratuity_amount: number
  earning_paid: boolean
  earning_paid_at: string | null
}

function getWeekStart(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1))
  return d.toISOString().split('T')[0]
}

function weekLabel(ws: string) {
  const start = new Date(ws + 'T00:00:00')
  const end = new Date(ws + 'T00:00:00')
  end.setDate(end.getDate() + 6)
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(start)} – ${fmt(end)}`
}

const STATUS_STEPS: Record<string, { label: string; next: string | null; nextLabel: string | null; color: string }> = {
  assigned:   { label: 'Awaiting Response', next: 'on_the_way', nextLabel: 'I’m On My Way 🚗',    color: 'bg-blue-100 text-blue-700' },
  on_the_way: { label: 'On The Way',        next: 'arrived',    nextLabel: 'I’ve Arrived 📍',  color: 'bg-yellow-100 text-yellow-700' },
  arrived:    { label: 'Arrived',           next: 'completed',  nextLabel: 'Trip Completed ✅',     color: 'bg-orange-100 text-orange-700' },
  completed:  { label: 'Completed',         next: null,         nextLabel: null,                   color: 'bg-green-100 text-green-700' },
}

const SERVICE_LABELS: Record<string, string> = {
  airport: 'Airport Transfer', wedding: 'Wedding', hourly: 'Hourly',
  corporate: 'Corporate', cruise: 'Cruise', event: 'Event',
}

export default function DriverPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [driver, setDriver] = useState<Driver | null>(null)
  const [trips, setTrips] = useState<Trip[]>([])
  const [allBookings, setAllBookings] = useState<CalendarEntry[]>([])
  const [earnings, setEarnings] = useState<EarningEntry[]>([])
  const [avgRating, setAvgRating] = useState<number | null>(null)
  const [ratingCount, setRatingCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [tab, setTab] = useState<'trips' | 'calendar' | 'earnings'>('trips')
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  async function login(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    const res = await fetch(`/api/driver?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`)
    const data = await res.json()
    setLoading(false)
    if (!res.ok) return setError(data.error ?? 'Driver not found')
    setDriver(data.driver)
    setTrips(data.bookings)
    setAllBookings(data.allBookings ?? [])
    setEarnings(data.earnings ?? [])
    setAvgRating(data.avgRating)
    setRatingCount(data.ratingCount)
  }

  async function respondToTrip(tripId: string, response: 'accepted' | 'rejected') {
    setUpdating(tripId)
    await fetch(`/api/bookings/${tripId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'driver_response', response }),
    })
    setTrips(prev => prev.map(t => t.id === tripId ? { ...t, driver_accepted: response } : t))
    setUpdating(null)
  }

  async function updateStatus(trip: Trip, newStatus: string) {
    setUpdating(trip.id)
    await fetch(`/api/bookings/${trip.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'driver_status', status: newStatus }),
    })
    setTrips(prev => prev.map(t => t.id === trip.id ? { ...t, driver_status: newStatus, status: newStatus === 'completed' ? 'completed' : t.status } : t))
    setUpdating(null)
  }

  if (!driver) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <Image src="/logo.svg" alt={brand.company.displayName} width={140} height={57} className="mx-auto mb-6" />
            <h1 className="text-2xl font-black text-slate-900">Driver Panel</h1>
            <p className="text-white text-sm mt-1">Sign in with your email and password</p>
          </div>
          <form onSubmit={login} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b353d]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b353d]"
              />
            </div>
            {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>}
            <button type="submit" disabled={loading || !email || !password}
              className="w-full bg-[#2b353d] hover:bg-[#1e262d] disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-sm">
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  const vehicle = driver.vehicles
  const totalPaid = earnings.filter(e => e.earning_paid).reduce((s, e) => s + e.total_price * driver.commission_rate / 100, 0)
  const totalUnpaid = earnings.filter(e => !e.earning_paid).reduce((s, e) => s + e.total_price * driver.commission_rate / 100, 0)

  // Group earnings by week
  const earningsByWeek = new Map<string, EarningEntry[]>()
  for (const e of earnings) {
    const ws = getWeekStart(e.pickup_date)
    if (!earningsByWeek.has(ws)) earningsByWeek.set(ws, [])
    earningsByWeek.get(ws)!.push(e)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <div>
          <p className="font-bold text-slate-900">{driver.name}</p>
          {vehicle?.plate && <p className="text-xs text-white">{vehicle.make} {vehicle.model} · {vehicle.plate}</p>}
          {avgRating !== null && (
            <p className="text-xs text-yellow-500 font-semibold">
              {'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))} {avgRating}/5 ({ratingCount})
            </p>
          )}
        </div>
        <button onClick={() => { setDriver(null); setTrips([]); setEarnings([]) }} className="text-sm text-white hover:text-white">Sign Out</button>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-100 px-4">
        <div className="max-w-lg mx-auto flex gap-1">
          <button onClick={() => setTab('trips')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${tab === 'trips' ? 'border-[#2b353d] text-[#2b353d]' : 'border-transparent text-white'}`}>
            My Trips
          </button>
          <button onClick={() => setTab('calendar')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${tab === 'calendar' ? 'border-[#2b353d] text-[#2b353d]' : 'border-transparent text-white'}`}>
            Calendar
          </button>
          <button onClick={() => setTab('earnings')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${tab === 'earnings' ? 'border-[#2b353d] text-[#2b353d]' : 'border-transparent text-white'}`}>
            {`Earnings${totalUnpaid > 0 ? ` · $${totalUnpaid.toFixed(0)} pending` : ''}`}
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      {tab === 'calendar' ? (() => {
        const { year, month } = calMonth
        const firstDay = new Date(year, month, 1).getDay()
        const daysInMonth = new Date(year, month + 1, 0).getDate()
        const startOffset = firstDay === 0 ? 6 : firstDay - 1
        const today = new Date().toISOString().split('T')[0]

        const bookingsByDate = new Map<string, CalendarEntry[]>()
        for (const b of allBookings) {
          const d = b.pickup_date
          if (!bookingsByDate.has(d)) bookingsByDate.set(d, [])
          bookingsByDate.get(d)!.push(b)
        }

        const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        const cells: (number | null)[] = [...Array(startOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
        while (cells.length % 7 !== 0) cells.push(null)

        return (
          <>
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setCalMonth(m => { const d = new Date(m.year, m.month - 1); return { year: d.getFullYear(), month: d.getMonth() } })}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-white font-bold">‹</button>
              <span className="font-bold text-slate-800">{monthName}</span>
              <button onClick={() => setCalMonth(m => { const d = new Date(m.year, m.month + 1); return { year: d.getFullYear(), month: d.getMonth() } })}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-white font-bold">›</button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="grid grid-cols-7 border-b border-slate-100">
                {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                  <div key={d} className="py-2 text-center text-xs font-semibold text-white">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {cells.map((day, i) => {
                  if (!day) return <div key={i} className="min-h-[52px] border-r border-b border-slate-50 last:border-r-0" />
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  const dayBookings = bookingsByDate.get(dateStr) ?? []
                  const isToday = dateStr === today
                  const isPast = dateStr < today
                  return (
                    <div key={i} className={`min-h-[52px] p-1 border-r border-b border-slate-50 last:border-r-0 ${isPast ? 'bg-slate-50/50' : ''}`}>
                      <div className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-[#2b353d] text-white' : 'text-white'}`}>
                        {day}
                      </div>
                      {dayBookings.map(b => (
                        <div key={b.id} title={`${b.pickup_time} · ${b.pickup_location}`}
                          className={`text-[10px] font-semibold px-1 py-0.5 rounded mb-0.5 truncate ${
                            b.status === 'completed' ? 'bg-green-100 text-green-700' :
                            b.status === 'cancelled' ? 'bg-red-50 text-red-400' :
                            'bg-[#2b353d] text-white'
                          }`}>
                          {b.pickup_time}
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Selected day detail — show today's or this month's jobs */}
            {Array.from(bookingsByDate.entries())
              .filter(([d]) => d.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`))
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([date, bs]) => (
                <div key={date} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                    <span className="text-xs font-semibold text-white">
                      {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                  {bs.map(b => (
                    <div key={b.id} className="px-4 py-3 border-b border-slate-50 last:border-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-mono text-white">{b.booking_number}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          b.status === 'completed' ? 'bg-green-100 text-green-700' :
                          b.status === 'cancelled' ? 'bg-red-50 text-red-400' :
                          'bg-blue-50 text-blue-700'
                        }`}>{b.status}</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-800">{b.pickup_time} · {b.service_type.replace('_', ' ')}</p>
                      <p className="text-xs text-white mt-0.5 truncate">{b.pickup_location}</p>
                      {b.dropoff_location && <p className="text-xs text-white truncate">→ {b.dropoff_location}</p>}
                    </div>
                  ))}
                </div>
              ))
            }
          </>
        )
      })() : tab === 'earnings' ? (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl border border-slate-100 p-4 text-center">
              <p className="text-xs text-white mb-1">Pending Payment</p>
              <p className="text-xl font-black text-white">${totalUnpaid.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-4 text-center">
              <p className="text-xs text-white mb-1">Total Paid</p>
              <p className="text-xl font-black text-green-600">${totalPaid.toFixed(2)}</p>
            </div>
          </div>

          {earningsByWeek.size === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-white text-sm">No completed rides yet.</div>
          ) : (
            Array.from(earningsByWeek.entries())
              .sort((a, b) => b[0].localeCompare(a[0]))
              .map(([ws, entries]) => {
                const weekTotal = entries.reduce((s, e) => s + e.total_price * driver.commission_rate / 100, 0)
                const allPaid = entries.every(e => e.earning_paid)
                return (
                  <div key={ws} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                      <span className="text-xs font-semibold text-white">{weekLabel(ws)}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-700">${weekTotal.toFixed(2)}</span>
                        {allPaid
                          ? <span className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full">✓ Paid</span>
                          : <span className="text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-full">Pending</span>
                        }
                      </div>
                    </div>
                    {entries.map(e => {
                      const amt = Math.round(e.total_price * driver.commission_rate / 100 * 100) / 100
                      const tip = e.gratuity_amount ?? 0
                      return (
                        <div key={e.id} className="flex items-center justify-between px-4 py-3 border-b border-slate-50 last:border-0">
                          <div>
                            <span className="text-xs font-mono text-white mr-2">{e.booking_number}</span>
                            <span className="text-sm text-white">{e.pickup_date}</span>
                            {tip > 0 && (
                              <span className="ml-2 text-xs text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-full">+${tip.toFixed(2)} tip</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-800">${(amt + tip).toFixed(2)}</span>
                            {e.earning_paid
                              ? <span className="text-xs text-green-600">✓ Paid</span>
                              : <span className="text-xs text-white">Pending</span>
                            }
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })
          )}
        </>
      ) : (
        <>
        <h2 className="font-extrabold text-slate-900 text-lg">My Trips</h2>

        {trips.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-white text-sm">No upcoming trips assigned.</div>
        ) : (
          trips.map(trip => {
            const step = STATUS_STEPS[trip.driver_status ?? 'assigned']
            const total = Number(trip.total_price)
            const earnings = Math.round(total * (driver.commission_rate / 100) * 100) / 100

            return (
              <div key={trip.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-black text-[#2b353d] tracking-wider text-sm">{trip.booking_number}</span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${step?.color ?? 'bg-slate-100 text-white'}`}>
                      {step?.label ?? trip.driver_status}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex gap-2">
                      <span className="text-white w-20 flex-shrink-0">Service</span>
                      <span className="font-semibold text-slate-800">{SERVICE_LABELS[trip.service_type] ?? trip.service_type}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-white w-20 flex-shrink-0">Date</span>
                      <span className="font-semibold text-slate-800">{trip.pickup_date} · {trip.pickup_time}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-white w-20 flex-shrink-0">Pickup</span>
                      <span className="font-semibold text-slate-800">{trip.pickup_location}</span>
                    </div>
                    {trip.dropoff_location && (
                      <div className="flex gap-2">
                        <span className="text-white w-20 flex-shrink-0">Dropoff</span>
                        <span className="font-semibold text-slate-800">{trip.dropoff_location}</span>
                      </div>
                    )}
                    {trip.flight_number && (
                      <div className="flex gap-2">
                        <span className="text-white w-20 flex-shrink-0">Flight</span>
                        <span className="font-semibold text-slate-800">{trip.flight_number}</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <span className="text-white w-20 flex-shrink-0">Customer</span>
                      <span className="font-semibold text-slate-800">{trip.name}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-white w-20 flex-shrink-0">Phone</span>
                      <a href={`tel:${trip.phone}`} className="font-semibold text-[#2b353d] underline">{trip.phone}</a>
                    </div>
                    {trip.passengers && (
                      <div className="flex gap-2">
                        <span className="text-white w-20 flex-shrink-0">Passengers</span>
                        <span className="font-semibold text-slate-800">{trip.passengers}</span>
                      </div>
                    )}
                    {trip.notes && (
                      <div className="flex gap-2">
                        <span className="text-white w-20 flex-shrink-0">Notes</span>
                        <span className="font-semibold text-slate-800">{trip.notes}</span>
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-50 rounded-xl px-4 py-3 flex items-center justify-between mb-4">
                    <p className="text-xs text-white">Your Earnings</p>
                    <p className="font-extrabold text-green-600 text-lg">{formatPrice(Math.round(Number(trip.total_price) * (driver.commission_rate / 100) * 100) / 100)}</p>
                  </div>

                  {trip.driver_status === 'assigned' && trip.driver_accepted !== 'accepted' && trip.driver_accepted !== 'rejected' && (
                    <div className="flex gap-3">
                      <button onClick={() => respondToTrip(trip.id, 'rejected')} disabled={updating === trip.id}
                        className="flex-1 border-2 border-red-200 text-red-500 font-bold py-3 rounded-xl text-sm hover:bg-red-50 transition-colors disabled:opacity-50">
                        Reddet ✗
                      </button>
                      <button onClick={() => respondToTrip(trip.id, 'accepted')} disabled={updating === trip.id}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-50">
                        Kabul Et ✓
                      </button>
                    </div>
                  )}

                  {trip.driver_accepted === 'accepted' && step?.next && (
                    <button onClick={() => updateStatus(trip, step.next!)} disabled={updating === trip.id}
                      className="w-full bg-[#2b353d] hover:bg-[#1e262d] disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-sm transition-colors">
                      {updating === trip.id ? 'Updating...' : step.nextLabel}
                    </button>
                  )}

                  {trip.driver_accepted === 'rejected' && (
                    <div className="bg-red-50 rounded-xl px-4 py-3 text-center text-red-500 text-sm font-medium">Reddedildi</div>
                  )}
                </div>
              </div>
            )
          })
        )}
        </>
      )}
      </div>
    </div>
  )
}
