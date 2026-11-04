'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { brand } from '@/config/brand'

interface BookingInfo {
  booking_number: string
  name: string
  pickup_date: string
  service_type: string
  drivers?: { name: string; vehicles?: { make?: string; model?: string } | null } | null
}

export default function RatePage() {
  const { token } = useParams<{ token: string }>()
  const [booking, setBooking] = useState<BookingInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    fetch(`/api/rate?token=${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error === 'Already rated' ? 'You have already submitted a rating for this trip.' : 'This rating link is invalid or expired.')
        else setBooking(d)
        setLoading(false)
      })
  }, [token])

  async function submit() {
    if (!selected) return
    setSubmitting(true)
    const res = await fetch('/api/rate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, rating: selected, comment: comment.trim() || null }),
    })
    setSubmitting(false)
    if (res.ok) setDone(true)
    else setError('Something went wrong. Please try again.')
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#2b353d] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Image src="/logo.svg" alt={brand.company.displayName} width={130} height={53} className="mx-auto mb-6" />
        </div>

        <div className="bg-[#080808] rounded-2xl border border-[#D4A017]/10 shadow-sm p-6">
          {error ? (
            <div className="text-center py-4">
              <p className="text-white text-sm">{error}</p>
            </div>
          ) : done ? (
            <div className="text-center py-4 space-y-3">
              <div className="text-4xl mb-2">🌟</div>
              <h2 className="text-xl font-black text-white">Thank you!</h2>
              <p className="text-white text-sm">Your feedback helps us provide the best experience.</p>
              {selected === 5 && process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL && (
                <div className="mt-4 pt-4 border-t border-[#D4A017]/10">
                  <p className="text-xs text-white mb-3">Share your experience on Google?</p>
                  <a
                    href={process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#080808] border border-[#D4A017]/15 hover:border-[#D4A017]/20 text-white/80 font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Leave a Google Review
                  </a>
                </div>
              )}
            </div>
          ) : booking ? (
            <div className="space-y-5">
              <div>
                <p className="text-xs text-white uppercase tracking-wider mb-1">Rate Your Ride</p>
                <p className="font-bold text-white">{booking.drivers?.name ?? 'Your Chauffeur'}</p>
                {booking.drivers?.vehicles && (
                  <p className="text-xs text-white">{booking.drivers.vehicles.make} {booking.drivers.vehicles.model}</p>
                )}
                <p className="text-xs text-white mt-0.5">{booking.pickup_date} · {booking.booking_number}</p>
              </div>

              <div className="flex justify-center gap-2 py-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setSelected(star)}
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    className="text-4xl transition-transform hover:scale-110"
                  >
                    <span className={(hovered || selected) >= star ? 'text-yellow-400' : 'text-white'}>★</span>
                  </button>
                ))}
              </div>

              {selected > 0 && selected < 5 && (
                <div>
                  <label className="block text-xs text-white uppercase tracking-wider mb-1.5">What could we improve?</label>
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    rows={3}
                    placeholder="Tell us about your experience..."
                    className="w-full border border-[#D4A017]/15 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b353d] resize-none"
                  />
                </div>
              )}

              {selected > 0 && (
                <button
                  onClick={submit}
                  disabled={submitting}
                  className="w-full bg-[#141414] hover:bg-[#1e262d] disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-sm transition-colors"
                >
                  {submitting ? 'Submitting...' : 'Submit Rating →'}
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
