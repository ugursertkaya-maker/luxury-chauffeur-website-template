'use client'
import { useState, useEffect, useCallback } from 'react'
import { Booking, BookingStatus } from '@/types'
import { formatPrice } from '@/lib/pricing'
import { brand } from '@/config/brand'

interface Driver {
  id: string; name: string; phone: string; commission_rate: number
  acceptRate: number | null; avgRating: number | null; score: number
  accepted_count: number; rejected_count: number
  vehicles?: { name?: string; make?: string; model?: string; plate?: string } | null
}

interface RouteInfo {
  distance?: string; distance_miles?: number; duration?: string; duration_minutes?: number
}

interface AuditEntry {
  id: string; action: string; actor: string; booking_number: string
  details?: Record<string, unknown>; created_at: string
}

interface FlightStatus {
  ident?: string; status?: string; origin?: string; destination?: string
  scheduled_out?: string; actual_out?: string; scheduled_in?: string; estimated_in?: string; actual_in?: string
  delay_minutes?: number
}

type ExtendedBooking = Booking & {
  booking_number?: string; driver_id?: string; admin_notes?: string
  estimated_miles?: number; flight_number?: string; meet_greet?: boolean
  luggage?: number; vehicle_id?: string; stripe_payment_intent_id?: string
  driver_status?: string; driver_accepted?: string
  price_base?: number; price_per_mile?: number; price_distance_charge?: number
  price_time_charge?: number; price_surcharges?: { label: string; amount: number }[]
  discount_code?: string; discount_amount?: number; gratuity_amount?: number
  corporate_account_id?: string | null; invoice_status?: string
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-slate-100 text-slate-600',
  modification_requested: 'bg-blue-100 text-blue-700',
}

const ACTION_LABELS: Record<string, string> = {
  booking_confirmed: 'Confirmed',
  booking_cancelled: 'Cancelled',
  booking_completed: 'Completed',
  driver_assigned: 'Driver Assigned',
  modification_approved: 'Change Approved',
  modification_rejected: 'Change Rejected',
  price_override: 'Price Changed',
  sms_sent: 'SMS Sent',
  email_sent: 'Email Sent',
}

export default function BookingDrawer({ booking, drivers, onClose, onUpdate }: {
  booking: ExtendedBooking | null
  drivers: Driver[]
  onClose: () => void
  onUpdate: (b: Booking) => void
}) {
  const [tab, setTab] = useState<'details' | 'driver' | 'comms' | 'timeline'>('details')
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null)
  const [loadingRoute, setLoadingRoute] = useState(false)
  const [adminNote, setAdminNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [noteSaved, setNoteSaved] = useState(false)
  const [priceEdit, setPriceEdit] = useState('')
  const [savingPrice, setSavingPrice] = useState(false)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([])
  const [assigning, setAssigning] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [flightStatus, setFlightStatus] = useState<FlightStatus | null>(null)
  const [loadingFlight, setLoadingFlight] = useState(false)

  const patch = useCallback(async (body: Record<string, unknown>) => {
    const r = await fetch(`/api/bookings/${booking!.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    return r.json()
  }, [booking])

  useEffect(() => {
    if (!booking) return
    setTab('details')
    setAdminNote(booking.admin_notes ?? '')
    setPriceEdit(String(booking.total_price))
    setRouteInfo(null)
    setAuditLog([])
    setFlightStatus(null)
    setEmailSent(false); setNoteSaved(false)

    if (booking.pickup_location && booking.dropoff_location) {
      setLoadingRoute(true)
      fetch(`/api/admin/route-info?origin=${encodeURIComponent(booking.pickup_location)}&destination=${encodeURIComponent(booking.dropoff_location)}`)
        .then(r => r.json())
        .then(d => { if (!d.error) setRouteInfo(d) })
        .finally(() => setLoadingRoute(false))
    }

    if (booking.booking_number) {
      fetch(`/api/admin/audit?booking=${booking.booking_number}`)
        .then(r => r.json())
        .then(d => setAuditLog(Array.isArray(d) ? d : []))
        .catch(() => {})
    }

    if (booking.flight_number) {
      setLoadingFlight(true)
      fetch(`/api/admin/flight-status?flight=${encodeURIComponent(booking.flight_number)}`)
        .then(r => r.json())
        .then(d => { if (!d.error) setFlightStatus(d) })
        .catch(() => {})
        .finally(() => setLoadingFlight(false))
    }
  }, [booking?.id])

  if (!booking) return null

  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const mapSrc = booking.pickup_location && booking.dropoff_location && mapsKey
    ? `https://www.google.com/maps/embed/v1/directions?key=${mapsKey}&origin=${encodeURIComponent(booking.pickup_location)}&destination=${encodeURIComponent(booking.dropoff_location)}&mode=driving`
    : null

  async function updateStatus(status: BookingStatus) {
    setActionLoading(status)
    const updated = await patch({ status })
    onUpdate(updated)
    setActionLoading(null)
  }

  async function approveModification() {
    if (!booking) return
    setActionLoading('approve_mod')
    const changes = booking.pending_changes ?? {}
    const updated = await patch({ action: 'approve_modification', changes })
    onUpdate(updated)
    setActionLoading(null)
  }

  async function rejectModification() {
    setActionLoading('reject_mod')
    const updated = await patch({ action: 'reject_modification' })
    onUpdate(updated)
    setActionLoading(null)
  }

  async function saveNote() {
    setSavingNote(true)
    await patch({ action: 'save_note', note: adminNote })
    setSavingNote(false)
    setNoteSaved(true)
    setTimeout(() => setNoteSaved(false), 2500)
  }

  async function savePrice() {
    setSavingPrice(true)
    const updated = await patch({ action: 'override_price', price: parseFloat(priceEdit) })
    onUpdate(updated)
    setSavingPrice(false)
  }

  async function sendEmail() {
    setSendingEmail(true)
    await patch({ action: 'send_customer_email', subject: emailSubject, message: emailBody })
    setEmailBody('')
    setSendingEmail(false)
    setEmailSent(true)
    setTimeout(() => setEmailSent(false), 3000)
  }

  async function assignDriver(driverId: string) {
    setAssigning(true)
    const updated = await patch({ action: 'assign_driver', driver_id: driverId })
    onUpdate(updated)
    setAssigning(false)
  }

  const assignedDriver = drivers.find(d => d.id === booking.driver_id)
  const canEdit = booking.status !== 'cancelled' && booking.status !== 'completed'

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white z-50 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0f1922] to-[#2b353d] px-6 py-4 flex items-start justify-between flex-shrink-0">
          <div>
            <p className="text-[#8fa4b4] text-xs font-bold tracking-widest uppercase mb-1">Booking Detail</p>
            <div className="flex items-center gap-2 flex-wrap">
              {booking.booking_number && (
                <span className="font-mono text-white font-bold text-lg">{booking.booking_number}</span>
              )}
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[booking.status]}`}>
                {booking.status === 'modification_requested' ? 'Change Request' : booking.status}
              </span>
              {booking.payment_status === 'paid' && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Paid</span>
              )}
            </div>
            <p className="text-[#c0cdd6] text-sm mt-1">{booking.name} · {booking.pickup_date} {booking.pickup_time}</p>
          </div>
          <button onClick={onClose} className="text-[#8fa4b4] hover:text-white transition-colors mt-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-100 bg-white px-6 flex-shrink-0">
          <div className="flex gap-1">
            {([['details', 'Details'], ['driver', 'Driver'], ['comms', 'Communications'], ['timeline', 'Timeline']] as const).map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === key ? 'border-[#2b353d] text-[#2b353d]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                {label}
                {key === 'timeline' && auditLog.length > 0 && (
                  <span className="ml-1.5 bg-slate-200 text-slate-600 text-xs px-1.5 py-0.5 rounded-full">{auditLog.length}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* ── DETAILS TAB ── */}
          {tab === 'details' && (
            <div className="space-y-6">

              {/* Map */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Route</p>
                {mapSrc ? (
                  <div className="rounded-xl overflow-hidden border border-slate-200">
                    <iframe src={mapSrc} width="100%" height="260" loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="block" />
                  </div>
                ) : (
                  <div className="h-[260px] bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 text-sm">No route available</div>
                )}
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                    <p className="text-xs text-slate-500 mb-0.5">Distance</p>
                    <p className="font-bold text-[#2b353d] text-sm">
                      {loadingRoute ? '…' : routeInfo?.distance ?? `${booking.estimated_miles ?? '?'} mi`}
                    </p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                    <p className="text-xs text-slate-500 mb-0.5">Drive Time</p>
                    <p className="font-bold text-[#2b353d] text-sm">
                      {loadingRoute ? '…' : routeInfo?.duration ?? '—'}
                    </p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                    <p className="text-xs text-slate-500 mb-0.5">Total Price</p>
                    <p className="font-bold text-[#2b353d] text-sm">{formatPrice(booking.total_price)}</p>
                  </div>
                </div>
              </div>

              {/* Customer */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Customer</p>
                <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                  {[
                    { label: 'Name', value: booking.name },
                    { label: 'Email', value: booking.email },
                    { label: 'Phone', value: booking.phone },
                    booking.notes ? { label: 'Notes', value: booking.notes } : null,
                  ].filter(Boolean).map(row => (
                    <div key={row!.label} className="flex items-start justify-between px-4 py-3 text-sm">
                      <span className="text-slate-500 w-20 flex-shrink-0">{row!.label}</span>
                      <span className="text-slate-800 font-medium text-right break-all">{row!.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Flight Status */}
              {booking.flight_number && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Flight Status</p>
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-[#0f1922] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">✈️</span>
                        <span className="font-bold text-white font-mono">{booking.flight_number}</span>
                      </div>
                      {loadingFlight && <span className="text-[#8fa4b4] text-xs">Checking…</span>}
                      {flightStatus?.status && (
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          flightStatus.status === 'On Time' || flightStatus.status === 'In Air' ? 'bg-green-500 text-white' :
                          flightStatus.status?.includes('Delay') || flightStatus.status === 'Late' || flightStatus.status === 'Cancelled' ? 'bg-red-500 text-white' :
                          flightStatus.status === 'Landed' || flightStatus.status === 'Arrived' ? 'bg-slate-600 text-white' :
                          'bg-yellow-400 text-yellow-900'
                        }`}>{flightStatus.status}</span>
                      )}
                    </div>
                    {flightStatus && (
                      <div className="divide-y divide-slate-100">
                        {flightStatus.origin && (
                          <div className="flex items-center justify-between px-4 py-3 text-sm">
                            <span className="text-slate-500">Route</span>
                            <span className="font-medium text-slate-800">{flightStatus.origin} → {flightStatus.destination}</span>
                          </div>
                        )}
                        {flightStatus.scheduled_out && (
                          <div className="flex items-center justify-between px-4 py-3 text-sm">
                            <span className="text-slate-500">{flightStatus.actual_out ? 'Departed' : 'Dep. (sched.)'}</span>
                            <span className="font-medium text-slate-800">{new Date(flightStatus.actual_out ?? flightStatus.scheduled_out).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                          </div>
                        )}
                        {(() => {
                          const arrTime = flightStatus.actual_in ?? flightStatus.estimated_in ?? flightStatus.scheduled_in
                          if (!arrTime) return null
                          const arrLabel = flightStatus.actual_in ? 'Landed' : (flightStatus.estimated_in && flightStatus.estimated_in !== flightStatus.scheduled_in ? 'Est. Arrival' : 'Arr. (sched.)')
                          return (
                            <div className="flex items-center justify-between px-4 py-3 text-sm">
                              <span className="text-slate-500">{arrLabel}</span>
                              <span className="font-bold text-[#2b353d]">{new Date(arrTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                            </div>
                          )
                        })()}
                        {flightStatus.delay_minutes != null && flightStatus.delay_minutes > 0 && (
                          <div className="flex items-center justify-between px-4 py-3 text-sm bg-red-50">
                            <span className="text-red-400 font-semibold">Delay</span>
                            <span className="font-bold text-red-600">+{flightStatus.delay_minutes} min</span>
                          </div>
                        )}
                      </div>
                    )}
                    {!loadingFlight && !flightStatus && (
                      <p className="px-4 py-3 text-sm text-slate-500">Live status not available.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Trip Details */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Trip</p>
                <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                  {[
                    { label: 'Service', value: booking.service_type },
                    { label: 'Date', value: booking.pickup_date },
                    { label: 'Time', value: booking.pickup_time },
                    { label: 'Pickup', value: booking.pickup_location },
                    booking.dropoff_location ? { label: 'Dropoff', value: booking.dropoff_location } : null,
                    { label: 'Passengers', value: String(booking.passengers) },
                    booking.luggage != null ? { label: 'Luggage', value: String(booking.luggage) } : null,
                    booking.meet_greet ? { label: 'Meet & Greet', value: 'Yes' } : null,
                    booking.hours ? { label: 'Hours', value: `${booking.hours}h` } : null,
                  ].filter(Boolean).map(row => (
                    <div key={row!.label} className="flex items-start justify-between px-4 py-3 text-sm">
                      <span className="text-slate-500 w-24 flex-shrink-0">{row!.label}</span>
                      <span className="text-slate-800 font-medium text-right capitalize">{row!.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Price Breakdown</p>
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  {booking.price_base != null ? (
                    <div className="divide-y divide-slate-100">
                      <div className="flex items-center justify-between px-4 py-3 text-sm">
                        <span className="text-slate-500">Base Fee</span>
                        <span className="font-semibold text-slate-800">{formatPrice(booking.price_base)}</span>
                      </div>
                      {booking.price_per_mile != null && (booking.price_distance_charge ?? 0) > 0 && (
                        <div className="flex items-center justify-between px-4 py-3 text-sm">
                          <span className="text-slate-500">
                            {booking.estimated_miles != null ? `${booking.estimated_miles} mi` : 'Distance'} × ${booking.price_per_mile}/mi
                          </span>
                          <span className="font-semibold text-slate-800">{formatPrice(booking.price_distance_charge!)}</span>
                        </div>
                      )}
                      {booking.price_time_charge != null && booking.price_time_charge > 0 && (
                        <div className="flex items-center justify-between px-4 py-3 text-sm">
                          <span className="text-slate-500">Time Charge</span>
                          <span className="font-semibold text-slate-800">{formatPrice(booking.price_time_charge)}</span>
                        </div>
                      )}
                      {booking.price_surcharges && booking.price_surcharges.length > 0 && booking.price_surcharges.map((s, i) => (
                        <div key={i} className="flex items-center justify-between px-4 py-3 text-sm">
                          <span className="text-slate-500">{s.label}</span>
                          <span className="font-semibold text-slate-800">+{formatPrice(s.amount)}</span>
                        </div>
                      ))}
                      {booking.discount_code && (booking.discount_amount ?? 0) > 0 && (
                        <div className="flex items-center justify-between px-4 py-3 text-sm bg-green-50">
                          <span className="text-green-700 font-semibold">Discount ({booking.discount_code})</span>
                          <span className="font-bold text-green-600">-{formatPrice(booking.discount_amount!)}</span>
                        </div>
                      )}
                      {(booking.gratuity_amount ?? 0) > 0 && (
                        <div className="flex items-center justify-between px-4 py-3 text-sm bg-emerald-50">
                          <span className="text-emerald-700 font-semibold">Gratuity (→ driver)</span>
                          <span className="font-bold text-emerald-600">+{formatPrice(booking.gratuity_amount!)}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between px-4 py-3 bg-[#0f1922]">
                        <span className="text-[#8fa4b4] font-semibold text-sm">Total</span>
                        <span className="text-white font-extrabold text-lg">{formatPrice(booking.total_price)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {booking.estimated_miles != null && (
                        <div className="flex items-center justify-between px-4 py-3 text-sm">
                          <span className="text-slate-500">Estimated Miles</span>
                          <span className="font-semibold text-slate-800">{booking.estimated_miles} mi</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between px-4 py-3 bg-[#0f1922]">
                        <span className="text-[#8fa4b4] font-semibold text-sm">Total</span>
                        <span className="text-white font-extrabold text-lg">{formatPrice(booking.total_price)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Price Override */}
              {canEdit && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Price Override</p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                      <input type="number" step="0.01" min="0" value={priceEdit}
                        onChange={e => setPriceEdit(e.target.value)}
                        className="w-full pl-7 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#2b353d] focus:ring-1 focus:ring-[#2b353d]" />
                    </div>
                    <button onClick={savePrice} disabled={savingPrice || parseFloat(priceEdit) === booking.total_price}
                      className="bg-[#2b353d] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#1e262d] disabled:opacity-40 transition-colors">
                      {savingPrice ? '…' : 'Update'}
                    </button>
                  </div>
                  {booking.stripe_payment_intent_id && (
                    <a href={`https://dashboard.stripe.com/payments/${booking.stripe_payment_intent_id}`}
                      target="_blank" rel="noreferrer"
                      className="mt-2 text-xs text-[#2b353d] underline flex items-center gap-1">
                      View in Stripe Dashboard ↗
                    </a>
                  )}
                </div>
              )}

              {/* Corporate Account */}
              <CorporateAccountField booking={booking} onUpdate={onUpdate} />

              {/* Admin Note */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Internal Note</p>
                <textarea rows={3} value={adminNote} onChange={e => setAdminNote(e.target.value)}
                  placeholder="Private note — not visible to customer"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2b353d] focus:ring-1 focus:ring-[#2b353d] resize-none" />
                <div className="flex justify-end mt-2">
                  {noteSaved ? (
                    <span className="text-green-600 text-xs font-semibold">✓ Saved</span>
                  ) : (
                    <button onClick={saveNote} disabled={savingNote}
                      className="bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-slate-700 disabled:opacity-40 transition-colors">
                      {savingNote ? '…' : 'Save Note'}
                    </button>
                  )}
                </div>
              </div>

              {/* Modification request */}
              {booking.status === 'modification_requested' && booking.pending_changes && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Change Request</p>
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2 mb-3">
                    {Object.entries(booking.pending_changes as Record<string, string>).map(([key, val]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-blue-600 font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className="text-blue-900 font-semibold">{val}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={approveModification} disabled={!!actionLoading}
                      className="flex-1 bg-green-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors">
                      {actionLoading === 'approve_mod' ? '…' : '✓ Approve Change'}
                    </button>
                    <button onClick={rejectModification} disabled={!!actionLoading}
                      className="flex-1 bg-red-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors">
                      {actionLoading === 'reject_mod' ? '…' : '✕ Reject'}
                    </button>
                  </div>
                </div>
              )}

              {/* Status Actions */}
              {canEdit && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Actions</p>
                  <div className="flex gap-2 flex-wrap">
                    {booking.status === 'pending' && (
                      <button onClick={() => updateStatus('confirmed')} disabled={!!actionLoading}
                        className="bg-green-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors">
                        {actionLoading === 'confirmed' ? '…' : '✓ Confirm'}
                      </button>
                    )}
                    {(booking.status === 'confirmed' || booking.status === 'pending') && (
                      <button onClick={() => updateStatus('cancelled')} disabled={!!actionLoading}
                        className="bg-red-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors">
                        {actionLoading === 'cancelled' ? '…' : '✕ Cancel'}
                      </button>
                    )}
                    {booking.status === 'confirmed' && (
                      <button onClick={() => updateStatus('completed')} disabled={!!actionLoading}
                        className="bg-slate-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-colors">
                        {actionLoading === 'completed' ? '…' : 'Mark Complete'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── DRIVER TAB ── */}
          {tab === 'driver' && (
            <div className="space-y-6">
              {assignedDriver ? (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Assigned Driver</p>
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div className="px-5 py-4 bg-slate-50 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900 text-lg">{assignedDriver.name}</p>
                        <p className="text-sm text-slate-500">{assignedDriver.phone}</p>
                      </div>
                      <div className="text-right">
                        {assignedDriver.avgRating !== null && (
                          <p className="text-sm text-yellow-500 font-semibold">{'★'.repeat(Math.round(assignedDriver.avgRating ?? 0))} {assignedDriver.avgRating}/5</p>
                        )}
                        {assignedDriver.acceptRate !== null && (
                          <p className="text-xs text-slate-500">%{assignedDriver.acceptRate} accept rate</p>
                        )}
                      </div>
                    </div>
                    {assignedDriver.vehicles && (
                      <div className="px-5 py-3 border-t border-slate-100 text-sm text-slate-500">
                        {assignedDriver.vehicles.make} {assignedDriver.vehicles.model} · {assignedDriver.vehicles.plate}
                      </div>
                    )}
                    <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-sm">
                      <span className="text-slate-500">Commission ({assignedDriver.commission_rate}%)</span>
                      <span className="font-semibold text-[#2b353d]">
                        {formatPrice(Math.round(booking.total_price * (assignedDriver.commission_rate / 100) * 100) / 100)}
                      </span>
                    </div>
                    {booking.driver_status && (
                      <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-sm">
                        <span className="text-slate-500">Driver Status</span>
                        <span className={`font-semibold capitalize px-2 py-0.5 rounded-full text-xs ${
                          booking.driver_status === 'completed' ? 'bg-green-100 text-green-700' :
                          booking.driver_status === 'on_the_way' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>{booking.driver_status.replace(/_/g, ' ')}</span>
                      </div>
                    )}
                    {booking.driver_accepted && (
                      <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-sm">
                        <span className="text-slate-500">Acceptance</span>
                        <span className={`font-semibold capitalize text-xs ${booking.driver_accepted === 'accepted' ? 'text-green-600' : 'text-red-500'}`}>{booking.driver_accepted}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">No driver assigned yet.</p>
              )}

              {canEdit && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    {assignedDriver ? 'Reassign Driver' : 'Assign Driver'}
                  </p>
                  {drivers.length === 0 ? (
                    <p className="text-sm text-slate-500">No active drivers available.</p>
                  ) : (
                    <div className="space-y-2">
                      {drivers.map((d, i) => {
                        const earnings = Math.round(booking.total_price * (d.commission_rate / 100) * 100) / 100
                        return (
                          <button key={d.id} onClick={() => assignDriver(d.id)} disabled={assigning || d.id === booking.driver_id}
                            className={`w-full text-left border rounded-xl p-4 transition-colors disabled:opacity-50 ${d.id === booking.driver_id ? 'border-[#2b353d] bg-slate-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-slate-900">{d.name}</p>
                                  {d.id === booking.driver_id && <span className="text-xs bg-[#2b353d] text-white px-2 py-0.5 rounded-full">Current</span>}
                                  {i === 0 && d.id !== booking.driver_id && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">Recommended</span>}
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">{d.phone}</p>
                                {d.vehicles?.plate && <p className="text-xs text-slate-500">{d.vehicles.make} {d.vehicles.model} · {d.vehicles.plate}</p>}
                              </div>
                              <div className="text-right">
                                {d.avgRating !== null && <p className="text-xs text-yellow-500 font-semibold">{d.avgRating}/5</p>}
                                <p className="text-xs text-slate-500">%{d.commission_rate} → {formatPrice(earnings)}</p>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                  {assigning && <p className="text-xs text-slate-500 mt-2 text-center">Assigning driver…</p>}
                </div>
              )}
            </div>
          )}

          {/* ── COMMUNICATIONS TAB ── */}
          {tab === 'comms' && (
            <div className="space-y-8">

              {/* Send Email to Customer */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Email to Customer</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">To</label>
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm">
                      <span className="text-slate-800 font-medium">{booking.name}</span>
                      <span className="text-slate-500">&lt;{booking.email}&gt;</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Subject</label>
                    <input type="text" value={emailSubject} onChange={e => setEmailSubject(e.target.value)}
                      placeholder="Email subject…"
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2b353d] focus:ring-1 focus:ring-[#2b353d]" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Message</label>
                    <textarea rows={6} value={emailBody} onChange={e => setEmailBody(e.target.value)}
                      placeholder="Type your message to the customer…"
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2b353d] focus:ring-1 focus:ring-[#2b353d] resize-none" />
                  </div>
                  {emailSent ? (
                    <div className="text-center text-green-600 font-semibold text-sm py-2">✓ Email sent to {booking.email}</div>
                  ) : (
                    <button onClick={sendEmail} disabled={sendingEmail || !emailSubject.trim() || !emailBody.trim()}
                      className="w-full bg-[#2b353d] text-white font-semibold py-3 rounded-xl hover:bg-[#1e262d] disabled:opacity-40 transition-colors text-sm">
                      {sendingEmail ? 'Sending…' : `Send Email to ${booking.name} →`}
                    </button>
                  )}
                  <p className="text-xs text-slate-500">Sent from {brand.contact.emailReservations} using the brand template</p>
                </div>
              </div>

            </div>
          )}

          {/* ── TIMELINE TAB ── */}
          {tab === 'timeline' && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Activity Timeline</p>
              {auditLog.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-12">No activity recorded yet.</p>
              ) : (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-200" />
                  <div className="space-y-4">
                    {auditLog.map(entry => (
                      <div key={entry.id} className="flex gap-4 pl-10 relative">
                        <div className="absolute left-2.5 w-3 h-3 rounded-full bg-white border-2 border-[#2b353d] mt-1.5" />
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-slate-800 text-sm">
                              {ACTION_LABELS[entry.action] ?? entry.action.replace(/_/g, ' ')}
                            </p>
                            <span className="text-xs text-slate-400 flex-shrink-0">
                              {new Date(entry.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">by {entry.actor}</p>
                          {entry.details && Object.keys(entry.details).length > 0 && (
                            <div className="mt-1 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs text-slate-500 space-y-0.5">
                              {Object.entries(entry.details).map(([k, v]) => (
                                <p key={k}><span className="font-medium text-slate-600">{k}:</span> {String(v)}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}


function CorporateAccountField({ booking, onUpdate }: { booking: ExtendedBooking; onUpdate: (b: Booking) => void }) {
  const [accounts, setAccounts] = useState<{ id: string; company_name: string }[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/admin/corporate').then(r => r.json()).then(d => setAccounts(d.accounts ?? []))
  }, [])

  async function assign(corporate_account_id: string | null) {
    setSaving(true)
    const r = await fetch(`/api/bookings/${booking.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ corporate_account_id, invoice_status: corporate_account_id ? 'none' : null }),
    })
    const d = await r.json()
    if (d.booking) onUpdate(d.booking)
    setSaving(false)
  }

  if (accounts.length === 0) return null

  return (
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Corporate Account</p>
      <select
        value={booking.corporate_account_id ?? ''}
        onChange={e => assign(e.target.value || null)}
        disabled={saving}
        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#2b353d] bg-white"
      >
        <option value="">— None (direct pay) —</option>
        {accounts.map(a => <option key={a.id} value={a.id}>{a.company_name}</option>)}
      </select>
      {booking.corporate_account_id && (
        <p className="text-xs text-slate-500 mt-1.5">
          Invoice status: <span className={`font-semibold ${booking.invoice_status === 'paid' ? 'text-green-600' : booking.invoice_status === 'invoiced' ? 'text-blue-600' : 'text-amber-600'}`}>
            {booking.invoice_status === 'none' || !booking.invoice_status ? 'Pending invoice' : booking.invoice_status}
          </span>
        </p>
      )}
    </div>
  )
}
