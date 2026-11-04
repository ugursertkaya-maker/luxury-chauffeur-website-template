'use client'
import { useEffect, useState } from 'react'

interface Rating {
  id: string
  created_at: string
  rating: number
  comment?: string
  drivers?: { name: string } | null
  bookings?: { booking_number: string; name: string; pickup_date: string } | null
}

function Stars({ n }: { n: number }) {
  return (
    <span>
      {[1,2,3,4,5].map(i => (
        <span key={i} className={i <= n ? 'text-yellow-400' : 'text-white'}>★</span>
      ))}
    </span>
  )
}

export default function RatingsPage() {
  const [ratings, setRatings] = useState<Rating[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/ratings').then(r => r.json()).then(d => { setRatings(d); setLoading(false) })
  }, [])

  const driverStats = ratings.reduce<Record<string, { name: string; total: number; count: number }>>((acc, r) => {
    if (!r.drivers) return acc
    const name = r.drivers.name
    if (!acc[name]) acc[name] = { name, total: 0, count: 0 }
    acc[name].total += r.rating
    acc[name].count++
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-extrabold text-slate-900">Ratings & Reviews</h2>

      {Object.values(driverStats).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.values(driverStats).map(d => (
            <div key={d.name} className="bg-white border border-slate-100 rounded-xl p-4">
              <p className="text-xs text-white uppercase tracking-wider mb-1">{d.name}</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-extrabold text-slate-900">{(d.total / d.count).toFixed(1)}</p>
                <span className="text-yellow-400 text-lg">★</span>
              </div>
              <p className="text-xs text-white">{d.count} ride{d.count !== 1 ? 's' : ''}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? <p className="text-white text-sm">Loading...</p> : (
        <div className="space-y-3">
          {ratings.map(r => (
            <div key={r.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Stars n={r.rating} />
                    <span className="text-sm font-semibold text-slate-700">{r.rating}/5</span>
                  </div>
                  <p className="text-sm text-white">
                    <span className="font-semibold">{r.bookings?.name}</span>
                    {r.drivers && <span className="text-white"> → {r.drivers.name}</span>}
                  </p>
                  <p className="text-xs text-white">{r.bookings?.booking_number} · {r.bookings?.pickup_date}</p>
                  {r.comment && (
                    <p className="mt-2 text-sm text-white bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                      &ldquo;{r.comment}&rdquo;
                    </p>
                  )}
                </div>
                <p className="text-xs text-white flex-shrink-0">{new Date(r.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
          {ratings.length === 0 && <p className="text-center text-white text-sm py-8">No ratings yet.</p>}
        </div>
      )}
    </div>
  )
}
