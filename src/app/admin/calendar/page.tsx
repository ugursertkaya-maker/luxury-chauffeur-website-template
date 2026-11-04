'use client'
import { useEffect, useState } from 'react'

type Booking = {
  id: string
  booking_number: string
  pickup_date: string
  pickup_time: string
  service_type: string
  pickup_location: string
  dropoff_location?: string
  passengers: number
  status: string
  driver_id: string | null
  drivers: { name: string } | null
}

const SERVICE_COLORS: Record<string, string> = {
  airport_transfer: 'bg-blue-600',
  hourly_charter:   'bg-purple-600',
  point_to_point:   'bg-[#2b353d]',
  event_transfer:   'bg-amber-600',
  wedding:          'bg-pink-500',
  corporate:        'bg-teal-600',
}

const STATUS_BADGE: Record<string, string> = {
  pending:                'bg-slate-100 text-slate-600',
  confirmed:              'bg-blue-50 text-blue-700',
  modification_requested: 'bg-amber-50 text-amber-700',
  completed:              'bg-green-50 text-green-700',
}

function formatService(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default function AdminCalendar() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/calendar').then(r => r.json()).then(setBookings)
  }, [])

  const { year, month } = calMonth
  const today = new Date().toISOString().split('T')[0]
  const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startOffset = firstDay === 0 ? 6 : firstDay - 1

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const bookingsByDate = new Map<string, Booking[]>()
  for (const b of bookings) {
    if (!bookingsByDate.has(b.pickup_date)) bookingsByDate.set(b.pickup_date, [])
    bookingsByDate.get(b.pickup_date)!.push(b)
  }

  const selectedBookings = selectedDate ? (bookingsByDate.get(selectedDate) ?? []) : []
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`
  const monthBookings = Array.from(bookingsByDate.entries())
    .filter(([d]) => d.startsWith(monthPrefix))
    .sort(([a], [b]) => a.localeCompare(b))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-900">Dispatch Calendar</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCalMonth(m => { const d = new Date(m.year, m.month - 1); return { year: d.getFullYear(), month: d.getMonth() } })}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold"
          >‹</button>
          <span className="font-semibold text-slate-700 min-w-[160px] text-center">{monthName}</span>
          <button
            onClick={() => setCalMonth(m => { const d = new Date(m.year, m.month + 1); return { year: d.getFullYear(), month: d.getMonth() } })}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold"
          >›</button>
          <button
            onClick={() => { const now = new Date(); setCalMonth({ year: now.getFullYear(), month: now.getMonth() }) }}
            className="ml-2 px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
          >Today</button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                <div key={d} className="py-2.5 text-center text-xs font-semibold text-slate-500">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {cells.map((day, i) => {
                if (!day) return <div key={i} className="min-h-[90px] border-r border-b border-slate-50 bg-slate-50/30 last:border-r-0" />
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const dayBookings = bookingsByDate.get(dateStr) ?? []
                const isToday = dateStr === today
                const isSelected = dateStr === selectedDate
                const isPast = dateStr < today

                return (
                  <div
                    key={i}
                    onClick={() => setSelectedDate(selectedDate === dateStr ? null : dateStr)}
                    className={`min-h-[90px] p-1.5 border-r border-b border-slate-50 last:border-r-0 cursor-pointer transition-colors ${
                      isSelected ? 'bg-slate-100' : isPast ? 'bg-slate-50/40 hover:bg-slate-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className={`text-xs font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday ? 'bg-[#2b353d] text-white' : 'text-slate-700'
                    }`}>
                      {day}
                    </div>
                    <div className="space-y-0.5">
                      {dayBookings.slice(0, 3).map(b => (
                        <div
                          key={b.id}
                          title={`${b.pickup_time} · ${b.drivers?.name ?? 'Unassigned'} · ${b.pickup_location}`}
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded truncate text-white ${SERVICE_COLORS[b.service_type] ?? 'bg-slate-400'} ${!b.driver_id ? 'opacity-60' : ''}`}
                        >
                          {b.pickup_time.slice(0, 5)}
                          {!b.driver_id && ' ⚠'}
                        </div>
                      ))}
                      {dayBookings.length > 3 && (
                        <div className="text-[10px] text-slate-500 font-medium pl-1">+{dayBookings.length - 3} more</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-3 flex flex-wrap gap-3">
            {Object.entries(SERVICE_COLORS).map(([s, c]) => (
              <div key={s} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded ${c}`} />
                <span className="text-xs text-slate-500">{formatService(s)}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-slate-400 opacity-60" />
              <span className="text-xs text-slate-500">No driver ⚠</span>
            </div>
          </div>
        </div>

        {/* Detail panel */}
        <div className="space-y-4">
          {selectedDate ? (
            <>
              <h2 className="font-semibold text-slate-700 text-sm">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                <span className="ml-2 text-slate-500 font-normal">({selectedBookings.length} ride{selectedBookings.length !== 1 ? 's' : ''})</span>
              </h2>
              {selectedBookings.length === 0 ? (
                <p className="text-sm text-slate-500">No bookings this day.</p>
              ) : (
                selectedBookings
                  .sort((a, b) => a.pickup_time.localeCompare(b.pickup_time))
                  .map(b => (
                    <div key={b.id} className="bg-white rounded-xl border border-slate-100 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono text-slate-500">{b.booking_number}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[b.status] ?? 'bg-slate-100 text-slate-600'}`}>
                          {b.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="font-bold text-slate-800 text-sm">{b.pickup_time} · {formatService(b.service_type)}</p>
                      <p className="text-xs text-slate-500 mt-1 truncate">{b.pickup_location}</p>
                      {b.dropoff_location && <p className="text-xs text-slate-500 truncate">→ {b.dropoff_location}</p>}
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-slate-500">{b.passengers} pax</span>
                        {b.drivers
                          ? <span className="text-xs font-semibold text-[#2b353d]">{b.drivers.name}</span>
                          : <span className="text-xs font-semibold text-slate-500">⚠ No driver</span>
                        }
                      </div>
                    </div>
                  ))
              )}
            </>
          ) : (
            <>
              <h2 className="font-semibold text-slate-700 text-sm">This Month</h2>
              {monthBookings.length === 0 ? (
                <p className="text-sm text-slate-500">No bookings this month.</p>
              ) : (
                monthBookings.map(([date, bs]) => (
                  <div key={date}
                    onClick={() => setSelectedDate(date)}
                    className="bg-white rounded-xl border border-slate-100 p-3 cursor-pointer hover:border-slate-200 transition-colors"
                  >
                    <p className="text-xs font-semibold text-slate-600 mb-2">
                      {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    {bs.sort((a, b) => a.pickup_time.localeCompare(b.pickup_time)).map(b => (
                      <div key={b.id} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${SERVICE_COLORS[b.service_type] ?? 'bg-slate-400'}`} />
                          <span className="text-xs text-slate-700">{b.pickup_time.slice(0, 5)}</span>
                          <span className="text-xs text-slate-500">{b.booking_number}</span>
                        </div>
                        {b.drivers
                          ? <span className="text-xs text-slate-600 font-medium">{b.drivers.name}</span>
                          : <span className="text-xs text-slate-400 font-medium">Unassigned</span>
                        }
                      </div>
                    ))}
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
