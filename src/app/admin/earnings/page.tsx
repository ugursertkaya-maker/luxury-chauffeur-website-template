'use client'
import { useEffect, useState } from 'react'

type Booking = {
  id: string
  booking_number: string
  pickup_date: string
  pickup_time: string
  total_price: number
  earning_paid: boolean
  earning_paid_at: string | null
  earning_paid_by: string | null
  driver_id: string
  drivers: { id: string; name: string; commission_rate: number } | null
}

type WeekGroup = {
  label: string
  week_start: string
  bookings: Booking[]
  total: number
  allPaid: boolean
}

function getWeekStart(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

function weekLabel(weekStart: string) {
  const start = new Date(weekStart + 'T00:00:00')
  const end = new Date(weekStart + 'T00:00:00')
  end.setDate(end.getDate() + 6)
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(start)} – ${fmt(end)}, ${start.getFullYear()}`
}

function earning(b: Booking) {
  return Math.round(b.total_price * ((b.drivers?.commission_rate ?? 0) / 100) * 100) / 100
}

export default function EarningsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [selectedDriver, setSelectedDriver] = useState<string>('all')
  const [showPaid, setShowPaid] = useState(false)
  const [loading, setLoading] = useState(false)

  async function load() {
    const r = await fetch('/api/admin/earnings')
    setBookings(await r.json())
  }

  useEffect(() => { load() }, [])

  const drivers = Array.from(
    new Map(bookings.filter(b => b.drivers).map(b => [b.driver_id, b.drivers!.name])).entries()
  )

  const filtered = bookings.filter(b =>
    (selectedDriver === 'all' || b.driver_id === selectedDriver) &&
    (showPaid || !b.earning_paid)
  )

  // Group by driver → week
  const byDriver = new Map<string, { name: string; weeks: Map<string, WeekGroup> }>()
  for (const b of filtered) {
    if (!b.drivers) continue
    if (!byDriver.has(b.driver_id)) byDriver.set(b.driver_id, { name: b.drivers.name, weeks: new Map() })
    const driver = byDriver.get(b.driver_id)!
    const ws = getWeekStart(b.pickup_date)
    if (!driver.weeks.has(ws)) driver.weeks.set(ws, { label: weekLabel(ws), week_start: ws, bookings: [], total: 0, allPaid: true })
    const week = driver.weeks.get(ws)!
    week.bookings.push(b)
    week.total += earning(b)
    if (!b.earning_paid) week.allPaid = false
  }

  async function markPaid(ids: string[], paid: boolean) {
    setLoading(true)
    await fetch('/api/admin/earnings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_ids: ids, paid }),
    })
    await load()
    setLoading(false)
  }

  const totalUnpaid = bookings.filter(b => !b.earning_paid && b.drivers).reduce((s, b) => s + earning(b), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Driver Earnings</h1>
          {totalUnpaid > 0 && (
            <p className="text-sm text-amber-600 mt-0.5">
              ${totalUnpaid.toFixed(2)} unpaid across all drivers
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedDriver}
            onChange={e => setSelectedDriver(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2b353d]"
          >
            <option value="all">All Drivers</option>
            {drivers.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
            <input type="checkbox" checked={showPaid} onChange={e => setShowPaid(e.target.checked)} className="rounded" />
            Show paid
          </label>
        </div>
      </div>

      {byDriver.size === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-10 text-center text-white text-sm">
          No earnings to display.
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(byDriver.entries()).map(([driverId, { name, weeks }]) => {
            const driverUnpaid = Array.from(weeks.values()).flatMap(w => w.bookings).filter(b => !b.earning_paid)
            const driverUnpaidTotal = driverUnpaid.reduce((s, b) => s + earning(b), 0)

            return (
              <div key={driverId} className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                {/* Driver header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
                  <div>
                    <span className="font-semibold text-slate-800">{name}</span>
                    {driverUnpaidTotal > 0 && (
                      <span className="ml-2 text-xs text-amber-600 font-medium">${driverUnpaidTotal.toFixed(2)} unpaid</span>
                    )}
                  </div>
                  {driverUnpaid.length > 0 && (
                    <button
                      onClick={() => markPaid(driverUnpaid.map(b => b.id), true)}
                      disabled={loading}
                      className="text-xs bg-[#2b353d] text-white px-3 py-1.5 rounded-lg font-medium hover:bg-[#1e262c] transition-colors disabled:opacity-50"
                    >
                      Pay All (${driverUnpaidTotal.toFixed(2)})
                    </button>
                  )}
                </div>

                {/* Weeks */}
                {Array.from(weeks.entries())
                  .sort((a, b) => b[0].localeCompare(a[0]))
                  .map(([ws, week]) => {
                    const unpaidInWeek = week.bookings.filter(b => !b.earning_paid)
                    return (
                      <div key={ws} className="border-b border-slate-50 last:border-0">
                        {/* Week header */}
                        <div className="flex items-center justify-between px-5 py-2.5 bg-slate-50/50">
                          <span className="text-xs font-semibold text-white">{week.label}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-white font-medium">${week.total.toFixed(2)}</span>
                            {unpaidInWeek.length > 0 && (
                              <button
                                onClick={() => markPaid(unpaidInWeek.map(b => b.id), true)}
                                disabled={loading}
                                className="text-xs bg-emerald-600 text-white px-2.5 py-1 rounded-md font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                              >
                                Pay Week
                              </button>
                            )}
                            {week.allPaid && (
                              <span className="text-xs text-emerald-600 font-semibold">✓ Paid</span>
                            )}
                          </div>
                        </div>

                        {/* Rides */}
                        {week.bookings.map(b => (
                          <div key={b.id} className="flex items-center justify-between px-5 py-2.5 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-mono text-white">{b.booking_number}</span>
                              <span className="text-sm text-slate-700">{b.pickup_date} · {b.pickup_time}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold text-slate-800">${earning(b).toFixed(2)}</span>
                              {b.earning_paid ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs text-emerald-600 font-medium">Paid</span>
                                  <button
                                    onClick={() => markPaid([b.id], false)}
                                    disabled={loading}
                                    className="text-xs text-white hover:text-red-400 transition-colors"
                                  >
                                    undo
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => markPaid([b.id], true)}
                                  disabled={loading}
                                  className="text-xs border border-slate-200 text-white px-2 py-0.5 rounded hover:border-emerald-400 hover:text-emerald-600 transition-colors disabled:opacity-50"
                                >
                                  Mark Paid
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
