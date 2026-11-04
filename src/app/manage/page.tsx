'use client'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import PlacesInput from '@/components/PlacesInput'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { formatPrice } from '@/lib/pricing'
import { POLICY_TIERS } from '@/lib/cancellation'
import { brand } from '@/config/brand'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const SERVICE_LABELS: Record<string, string> = {
  airport: 'Airport Transfer', wedding: 'Wedding', hourly: 'Hourly',
  corporate: 'Corporate', cruise: 'Cruise', event: 'Event',
}

const ACTIVE_STATUSES = ['pending', 'confirmed', 'modification_requested']

interface Booking {
  id: string
  booking_number: string
  name: string
  email: string
  service_type: string
  pickup_location: string
  dropoff_location?: string
  pickup_date: string
  pickup_time: string
  hours?: number
  passengers: number
  total_price: number
  status: string
  payment_status: string
  flight_number?: string
  notes?: string
  pending_changes?: Record<string, unknown> | null
  driver_status?: string | null
  drivers?: { name: string; phone: string; vehicles?: { make?: string; model?: string; plate?: string } | null } | null
}

interface PricePreview {
  old_price: number
  new_price: number
  diff: number
  action: 'charge' | 'refund' | 'same'
  distance: string
}

function ExtraPaymentForm({ clientSecret, amount, onSuccess }: { clientSecret: string; amount: number; onSuccess: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setError(null)
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/manage` },
      redirect: 'if_required',
    })
    if (stripeError) { setError(stripeError.message ?? 'Payment failed'); setLoading(false) }
    else onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <PaymentElement />
      {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">{error}</p>}
      <button type="submit" disabled={!stripe || loading}
        className="w-full bg-[#141414] hover:bg-[#1e262d] disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-sm">
        {loading ? 'Processing...' : `Pay ${formatPrice(amount)} & Submit Request`}
      </button>
    </form>
  )
}

const statusColor: Record<string, string> = {
  confirmed: 'bg-green-50 text-green-700 border-green-200',
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  completed: 'bg-[#0e0e0e] text-white border-[#D4A017]/15',
  modification_requested: 'bg-white/8 text-white border-[#D4A017]/30',
}

const statusLabel: Record<string, string> = {
  confirmed: 'Confirmed', pending: 'Pending', cancelled: 'Cancelled',
  completed: 'Completed', modification_requested: 'Change Pending',
}

function BookingCard({ b, emailInput, onUpdate }: { b: Booking; emailInput: string; onUpdate: (updated: Booking) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [action, setAction] = useState<'cancel' | 'modify' | null>(null)
  const [modifyDate, setModifyDate] = useState(b.pickup_date)

  const refundPreview = useMemo(() => {
    const pickup = new Date(`${b.pickup_date}T${b.pickup_time}`)
    const hoursUntil = (pickup.getTime() - Date.now()) / (1000 * 60 * 60)
    const price = Number(b.total_price)
    if (hoursUntil >= 24) return { percent: 100, amount: price, color: 'text-green-700', bg: 'bg-green-50 border-green-200' }
    if (hoursUntil >= 2) return { percent: 50, amount: Math.round(price * 0.5 * 100) / 100, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' }
    return { percent: 0, amount: 0, color: 'text-red-700', bg: 'bg-red-50 border-red-200' }
  }, [b.pickup_date, b.pickup_time, b.total_price])
  const [modifyTime, setModifyTime] = useState(b.pickup_time)
  const [modifyPickup, setModifyPickup] = useState(b.pickup_location)
  const [modifyDropoff, setModifyDropoff] = useState(b.dropoff_location ?? '')
  const [modifyFlight, setModifyFlight] = useState(b.flight_number ?? '')
  const [modifyNotes, setModifyNotes] = useState(b.notes ?? '')
  const [modifyPassengers, setModifyPassengers] = useState(String(b.passengers))
  const [pricePreview, setPricePreview] = useState<PricePreview | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionResult, setActionResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [extraPayment, setExtraPayment] = useState<{ clientSecret: string; amount: number } | null>(null)

  async function previewPrice(pickup?: string, dropoff?: string) {
    const p = pickup ?? modifyPickup
    const d = dropoff ?? modifyDropoff
    if (!p || !d || (p === b.pickup_location && d === (b.dropoff_location ?? ''))) { setPricePreview(null); return }
    setPreviewLoading(true)
    const res = await fetch('/api/manage/price-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_number: b.booking_number, email: emailInput, new_pickup: p, new_dropoff: d }),
    })
    const data = await res.json()
    setPreviewLoading(false)
    if (res.ok) setPricePreview(data)
    else setError(data.error)
  }

  async function submitModify() {
    setActionLoading(true); setError(null)
    const changes: Record<string, unknown> = {}
    if (modifyDate !== b.pickup_date) changes.pickup_date = modifyDate
    if (modifyTime !== b.pickup_time) changes.pickup_time = modifyTime
    if (modifyPickup !== b.pickup_location) changes.pickup_location = modifyPickup
    if (modifyDropoff !== (b.dropoff_location ?? '')) changes.dropoff_location = modifyDropoff
    if (modifyFlight !== (b.flight_number ?? '')) changes.flight_number = modifyFlight
    if (modifyNotes !== (b.notes ?? '')) changes.notes = modifyNotes
    if (modifyPassengers !== String(b.passengers)) changes.passengers = Number(modifyPassengers)
    if (pricePreview) changes.new_price = pricePreview.new_price
    if (Object.keys(changes).length === 0) { setError('No changes detected.'); setActionLoading(false); return }

    const res = await fetch('/api/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_number: b.booking_number, email: emailInput, action: 'modify', changes }),
    })
    const data = await res.json()
    setActionLoading(false)
    if (!res.ok) return setError(data.error ?? 'Something went wrong')
    if (data.requiresPayment) { setExtraPayment({ clientSecret: data.clientSecret, amount: data.amount }); return }
    setActionResult(data.message ?? 'Change request submitted.')
    onUpdate({ ...b, status: 'modification_requested' })
    setAction(null)
  }

  async function submitCancel() {
    setActionLoading(true)
    const res = await fetch('/api/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_number: b.booking_number, email: emailInput, action: 'cancel', changes: {} }),
    })
    const data = await res.json()
    setActionLoading(false)
    if (!res.ok) return setError(data.error ?? 'Something went wrong')
    setActionResult(data.message)
    onUpdate({ ...b, status: 'cancelled' })
    setAction(null)
  }

  const canManage = !['cancelled', 'completed', 'modification_requested'].includes(b.status) && !actionResult

  return (
    <div className="bg-[#0e0e0e] border border-[#D4A017]/10 rounded-2xl overflow-hidden">
      <button onClick={() => setExpanded(v => !v)} className="w-full text-left p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-black text-white tracking-wider text-sm">{b.booking_number}</span>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${statusColor[b.status] ?? 'bg-[#0e0e0e] text-white border-[#D4A017]/15'}`}>
                {statusLabel[b.status] ?? b.status}
              </span>
            </div>
            <p className="text-sm text-white">{SERVICE_LABELS[b.service_type] ?? b.service_type} · {b.pickup_date}</p>
            <p className="text-xs text-white mt-0.5">{b.pickup_location}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-bold text-white">{formatPrice(b.total_price)}</p>
            <svg className={`w-4 h-4 text-white ml-auto mt-1 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-[#D4A017]/10 pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-xs text-white mb-0.5">Date & Time</p><p className="font-semibold text-white/90">{b.pickup_date} · {b.pickup_time}</p></div>
            <div><p className="text-xs text-white mb-0.5">Passengers</p><p className="font-semibold text-white/90">{b.passengers}</p></div>
            {b.dropoff_location && <div className="col-span-2"><p className="text-xs text-white mb-0.5">Dropoff</p><p className="font-semibold text-white/90">{b.dropoff_location}</p></div>}
            {b.flight_number && <div><p className="text-xs text-white mb-0.5">Flight</p><p className="font-semibold text-white/90">{b.flight_number}</p></div>}
            {b.notes && <div className="col-span-2"><p className="text-xs text-white mb-0.5">Notes</p><p className="font-semibold text-white/90">{b.notes}</p></div>}
            {b.drivers && (
              <div className="col-span-2 mt-1 bg-[#141414] rounded-xl px-4 py-3 space-y-1">
                <p className="text-xs font-semibold text-white uppercase tracking-wider mb-1">Your Chauffeur</p>
                <p className="font-bold text-white">{b.drivers.name}</p>
                <p className="text-sm text-white">{b.drivers.phone}</p>
                {b.drivers.vehicles?.plate && (
                  <p className="text-sm text-white">{b.drivers.vehicles.make} {b.drivers.vehicles.model} · {b.drivers.vehicles.plate}</p>
                )}
                {b.driver_status && (
                  <p className="text-xs text-white mt-1 capitalize">Status: {b.driver_status.replace('_', ' ')}</p>
                )}
              </div>
            )}
          </div>

          {actionResult && <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 text-sm font-medium">{actionResult}</div>}

          {b.status === 'modification_requested' && !actionResult && (
            <div className="bg-white/8 border border-[#D4A017]/30 rounded-xl px-4 py-3 text-white text-sm">
              Your change request is pending review.
            </div>
          )}

          {canManage && action === null && (
            <div className="flex gap-3">
              <button onClick={() => setAction('modify')} className="flex-1 border-2 border-[#D4A017]/15 text-white/80 font-semibold py-2.5 rounded-xl hover:border-[#2b353d] hover:text-white transition-colors text-sm">
                Modify
              </button>
              <button onClick={() => setAction('cancel')} className="flex-1 border-2 border-red-100 text-red-500 font-semibold py-2.5 rounded-xl hover:bg-red-50 transition-colors text-sm">
                Cancel
              </button>
            </div>
          )}

          {action === 'modify' && !extraPayment && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-white mb-1">Date</label>
                  <input type="date" value={modifyDate} onChange={e => setModifyDate(e.target.value)} className="w-full border border-[#D4A017]/15 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b353d]" /></div>
                <div><label className="block text-xs text-white mb-1">Time</label>
                  <input type="time" value={modifyTime} onChange={e => setModifyTime(e.target.value)} className="w-full border border-[#D4A017]/15 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b353d]" /></div>
              </div>
              <div><label className="block text-xs text-white mb-1">Pickup</label>
                <PlacesInput value={modifyPickup} onChange={setModifyPickup} onSelect={val => { setModifyPickup(val); previewPrice(val, modifyDropoff) }} placeholder="Pickup address" /></div>
              <div><label className="block text-xs text-white mb-1">Dropoff</label>
                <PlacesInput value={modifyDropoff} onChange={setModifyDropoff} onSelect={val => { setModifyDropoff(val); previewPrice(modifyPickup, val) }} placeholder="Dropoff address" /></div>
              <div><label className="block text-xs text-white mb-1">Flight Number</label>
                <input value={modifyFlight} onChange={e => setModifyFlight(e.target.value)} placeholder="e.g. AA1234" className="w-full border border-[#D4A017]/15 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b353d]" /></div>
              <div><label className="block text-xs text-white mb-1">Passengers</label>
                <input type="number" min={1} max={14} value={modifyPassengers} onChange={e => setModifyPassengers(e.target.value)} className="w-full border border-[#D4A017]/15 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b353d]" /></div>
              <div><label className="block text-xs text-white mb-1">Notes / Special Requests</label>
                <textarea value={modifyNotes} onChange={e => setModifyNotes(e.target.value)} rows={3} placeholder="Any additional requests..." className="w-full border border-[#D4A017]/15 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b353d] resize-none" /></div>

              {previewLoading && <p className="text-xs text-white">Calculating new price...</p>}
              {pricePreview && (
                <div className={`rounded-xl px-4 py-3 border text-sm ${pricePreview.action === 'refund' ? 'bg-green-50 border-green-200 text-green-700' : pricePreview.action === 'charge' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-[#0e0e0e] border-[#D4A017]/15 text-white'}`}>
                  <p className="font-semibold mb-0.5">New price: {formatPrice(pricePreview.new_price)} · {pricePreview.distance}</p>
                  {pricePreview.action === 'refund' && <p>You will receive a <strong>{formatPrice(Math.abs(pricePreview.diff))}</strong> refund after approval.</p>}
                  {pricePreview.action === 'charge' && <p>An additional payment of <strong>{formatPrice(pricePreview.diff)}</strong> will be required.</p>}
                </div>
              )}
              {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>}
              <div className="flex gap-3">
                <button onClick={() => { setAction(null); setPricePreview(null) }} className="flex-1 border border-[#D4A017]/15 text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-[#0e0e0e]">Back</button>
                <button onClick={submitModify} disabled={actionLoading} className="flex-1 bg-white hover:bg-white/90 disabled:opacity-50 text-[#080808] font-bold py-2.5 rounded-xl text-sm">
                  {actionLoading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
          )}

          {action === 'modify' && extraPayment && (
            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-700 text-sm">
                Additional payment of <strong>{formatPrice(extraPayment.amount)}</strong> required.
              </div>
              <Elements stripe={stripePromise} options={{ clientSecret: extraPayment.clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#2b353d' } } }}>
                <ExtraPaymentForm clientSecret={extraPayment.clientSecret} amount={extraPayment.amount}
                  onSuccess={() => { setExtraPayment(null); setActionResult('Change request submitted. Payment authorized and will be charged upon approval.'); setAction(null) }} />
              </Elements>
            </div>
          )}

          {action === 'cancel' && (
            <div className={`border rounded-xl p-4 space-y-3 ${refundPreview.bg}`}>
              <p className="text-sm font-semibold text-white/90">Cancel this booking?</p>
              <div className={`text-sm font-medium ${refundPreview.color}`}>
                {refundPreview.percent === 100 && `✅ You'll receive a full refund of $${refundPreview.amount.toFixed(2)}`}
                {refundPreview.percent === 50 && `⚠️ You'll receive a 50% refund of $${refundPreview.amount.toFixed(2)}`}
                {refundPreview.percent === 0 && `🚫 No refund applies (less than 2 hours before pickup)`}
              </div>
              <p className="text-xs text-white">
                Refunds appear within 5–10 business days. <Link href="/cancellation-policy" target="_blank" className="underline">View policy</Link>
              </p>
              <div className="flex gap-3">
                <button onClick={() => setAction(null)} className="flex-1 border border-[#D4A017]/15 text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-[#080808] bg-[#080808]/50">Back</button>
                <button onClick={submitCancel} disabled={actionLoading} className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm">
                  {actionLoading ? 'Cancelling...' : 'Yes, Cancel'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ManageInner() {
  const params = useSearchParams()
  const [bookingInput, setBookingInput] = useState(params.get('booking') ?? '')
  const [emailInput, setEmailInput] = useState(params.get('email') ?? '')
  const [bookings, setBookings] = useState<Booking[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'active' | 'past'>('active')

  useEffect(() => {
    const b = params.get('booking')
    const e = params.get('email')
    if (b && e) {
      setLoading(true)
      fetch(`/api/manage?booking=${encodeURIComponent(b)}&email=${encodeURIComponent(e)}`)
        .then(r => r.json().then(d => ({ ok: r.ok, d })))
        .then(({ ok, d }) => { setLoading(false); if (ok) setBookings(d); else setError(d.error ?? 'Not found') })
        .catch(() => setLoading(false))
    }
  }, [])

  async function lookup(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBookings(null)
    setLoading(true)
    const res = await fetch(`/api/manage?booking=${encodeURIComponent(bookingInput)}&email=${encodeURIComponent(emailInput)}`)
    const data = await res.json()
    setLoading(false)
    if (!res.ok) return setError(data.error ?? 'Not found')
    setBookings(data)
  }

  function updateBooking(updated: Booking) {
    setBookings(prev => prev ? prev.map(b => b.id === updated.id ? updated : b) : prev)
  }

  const active = bookings?.filter(b => ACTIVE_STATUSES.includes(b.status)) ?? []
  const past = bookings?.filter(b => !ACTIVE_STATUSES.includes(b.status)) ?? []

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#0e0e0e] py-16 px-4">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-10">
            <p className="text-white text-xs font-semibold uppercase tracking-widest mb-2">{brand.company.displayName}</p>
            <h1 className="text-4xl font-black text-white tracking-tight">Manage Bookings</h1>
            <p className="text-white text-sm mt-2">Enter any booking number and your email to access all your reservations.</p>
          </div>

          <form onSubmit={lookup} className="bg-[#0e0e0e] rounded-2xl border border-[#D4A017]/15 p-6 mb-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5">Booking Number</label>
              <input value={bookingInput} onChange={e => setBookingInput(e.target.value.toUpperCase())} placeholder="MAX-XXXXXX" required
                className="w-full border border-[#D4A017]/15 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#2b353d]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5">Email Address</label>
              <input type="email" value={emailInput} onChange={e => setEmailInput(e.target.value)} placeholder="your@email.com" required
                className="w-full border border-[#D4A017]/15 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2b353d]" />
            </div>
            {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-[#141414] hover:bg-[#1e262d] disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-colors text-sm">
              {loading ? 'Looking up...' : 'Find Reservations →'}
            </button>
          </form>

          {bookings && (
            <div>
              <div className="flex gap-2 mb-4">
                <button onClick={() => setTab('active')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${tab === 'active' ? 'bg-white text-[#080808]' : 'bg-[#141414] border border-[#D4A017]/20 text-white hover:border-[#D4A017]/40'}`}>
                  Active {active.length > 0 && `(${active.length})`}
                </button>
                <button onClick={() => setTab('past')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${tab === 'past' ? 'bg-white text-[#080808]' : 'bg-[#141414] border border-[#D4A017]/20 text-white hover:border-[#D4A017]/40'}`}>
                  Past {past.length > 0 && `(${past.length})`}
                </button>
              </div>

              {tab === 'active' && (
                <div className="space-y-3">
                  {active.length === 0
                    ? <p className="text-center text-white text-sm py-8">No active reservations.</p>
                    : active.map(b => <BookingCard key={b.id} b={b} emailInput={emailInput} onUpdate={updateBooking} />)
                  }
                </div>
              )}

              {tab === 'past' && (
                <div className="space-y-3">
                  {past.length === 0
                    ? <p className="text-center text-white text-sm py-8">No past reservations.</p>
                    : past.map(b => <BookingCard key={b.id} b={b} emailInput={emailInput} onUpdate={updateBooking} />)
                  }
                </div>
              )}
            </div>
          )}

          <p className="text-center text-white text-xs mt-8">
            Need help? <Link href="/" className="text-white font-semibold hover:underline">Contact us</Link>
          </p>
        </div>
      </div>
    </>
  )
}

export default function ManagePage() {
  return (
    <Suspense>
      <ManageInner />
    </Suspense>
  )
}
