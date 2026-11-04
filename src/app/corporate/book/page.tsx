'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import PlacesInput from '@/components/PlacesInput'
import { calculatePrice, CountyRates } from '@/lib/pricing'
import CorporateSidebar from '@/components/CorporateSidebar'

const VEHICLES = [
  { id: 'sedan', name: 'Premium Sedan', capacity: 3, luggage: 2 },
  { id: 'suv', name: 'Premium SUV', capacity: 5, luggage: 5 },
]

const inputCls = 'w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b353d] bg-white'
const labelCls = 'block text-xs font-semibold text-white uppercase tracking-wide mb-1.5'

interface Account {
  id: string; company_name: string; discount_rate: number; corporate_code: string
}

export default function CorporateBookPage() {
  const router = useRouter()
  const [account, setAccount] = useState<Account | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [bookingNumber, setBookingNumber] = useState('')
  const lookupRef = useRef('')

  const [trip, setTrip] = useState({
    pickup_location: '',
    dropoff_location: '',
    pickup_date: '',
    pickup_time: '',
    flight_number: '',
  })
  const [pax, setPax] = useState({ name: '', email: '', phone: '', passengers: 1, notes: '' })
  const [vehicleId, setVehicleId] = useState('sedan')
  const [realMiles, setRealMiles] = useState<number | null>(null)
  const [countyRates, setCountyRates] = useState<CountyRates | null>(null)
  const [confirmedPickup, setConfirmedPickup] = useState('')

  useEffect(() => {
    fetch('/api/corporate/dashboard?type=account')
      .then(r => { if (r.status === 401) { router.replace('/corporate/login'); return null } return r.json() })
      .then(d => { if (d?.account) setAccount(d.account) })
  }, [router])

  useEffect(() => {
    const loc = confirmedPickup || trip.pickup_location
    if (!loc || loc === lookupRef.current) return
    lookupRef.current = loc
    fetch(`/api/pricing/lookup?location=${encodeURIComponent(loc)}`)
      .then(r => r.json())
      .then(d => { if (d.rates) setCountyRates(d.rates) })
      .catch(() => {})
  }, [confirmedPickup, trip.pickup_location])

  // Distance lookup via RouteMap logic — simple fallback 20mi
  useEffect(() => {
    if (!trip.pickup_location || !trip.dropoff_location) { setRealMiles(null); return }
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!key) return
    const svc = new window.google.maps.DistanceMatrixService()
    svc.getDistanceMatrix({
      origins: [trip.pickup_location],
      destinations: [trip.dropoff_location],
      travelMode: window.google.maps.TravelMode.DRIVING,
      unitSystem: window.google.maps.UnitSystem.IMPERIAL,
    }, (res: any, status: string) => {
      if (status === 'OK') {
        const meters = res?.rows?.[0]?.elements?.[0]?.distance?.value
        if (meters) setRealMiles(Math.round(meters / 1609.34))
      }
    })
  }, [trip.pickup_location, trip.dropoff_location])

  const setT = (k: string, v: unknown) => setTrip(f => ({ ...f, [k]: v }))
  const setP = (k: string, v: unknown) => setPax(f => ({ ...f, [k]: v }))

  const estimatedMiles = realMiles ?? 20
  const price = (trip.pickup_date && trip.pickup_time) ? calculatePrice({
    serviceType: 'corporate',
    distanceMiles: estimatedMiles,
    hours: 3,
    pickupDateTime: new Date(`${trip.pickup_date}T${trip.pickup_time}`),
    vehicleId,
    countyRates,
  }) : null

  const discount = account?.discount_rate && price ? Math.round(price.total * (account.discount_rate / 100) * 100) / 100 : 0
  const finalTotal = price ? Math.round((price.total - discount) * 100) / 100 : null

  const canSubmit = trip.pickup_location && trip.dropoff_location && trip.pickup_date && trip.pickup_time &&
    pax.name && pax.email && pax.phone && !loading

  async function handleSubmit() {
    if (!canSubmit || !account) return
    setLoading(true)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_type: 'corporate',
          pickup_location: trip.pickup_location,
          dropoff_location: trip.dropoff_location,
          pickup_date: trip.pickup_date,
          pickup_time: trip.pickup_time,
          flight_number: trip.flight_number,
          name: pax.name,
          email: pax.email,
          phone: pax.phone,
          passengers: pax.passengers,
          notes: pax.notes,
          vehicle_id: vehicleId,
          estimated_miles: estimatedMiles,
          total_price: finalTotal ?? price?.total,
          price_base: price?.base,
          price_per_mile: price?.per_mile,
          price_distance_charge: price?.distance_charge,
          corporate_account_id: account.id,
          corporate_code: account.corporate_code,
          discount_amount: discount,
          discount_code: discount > 0 ? `CORP-${account.corporate_code}` : null,
        }),
      })
      const data = await res.json()
      if (data.id || data.booking_number) {
        setBookingNumber(data.booking_number)
        setSubmitted(true)
      }
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    await fetch('/api/corporate/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'logout' }) })
    window.location.href = '/corporate/login'
  }

  if (submitted) return (
    <div className="min-h-screen bg-slate-50 flex">
      <CorporateSidebar company={account?.company_name} onLogout={logout} />
      <div className="flex-1 lg:ml-56 flex items-center justify-center px-4 py-16">
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center max-w-sm w-full">
          <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Booking Confirmed</h2>
          <p className="text-white text-sm mb-1">Booking number</p>
          <p className="font-mono font-bold text-lg text-slate-800 mb-6">{bookingNumber}</p>
          <div className="flex gap-3">
            <button onClick={() => { setSubmitted(false); setTrip({ pickup_location: '', dropoff_location: '', pickup_date: '', pickup_time: '', flight_number: '' }); setPax({ name: '', email: '', phone: '', passengers: 1, notes: '' }) }}
              className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50">
              New Booking
            </button>
            <button onClick={() => { window.location.href = '/corporate/dashboard' }}
              className="flex-1 bg-[#0a1017] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#1a2530]">
              Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <CorporateSidebar company={account?.company_name} onLogout={logout} />
      <div className="flex-1 lg:ml-56">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-6">
            <h1 className="text-xl font-bold text-slate-800">New Booking</h1>
            {account?.discount_rate ? (
              <span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2.5 py-0.5 font-medium ml-auto">
                {account.discount_rate}% corporate discount applied
              </span>
            ) : null}
          </div>

        <div className="space-y-4">
          {/* Trip details */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
            <h2 className="font-semibold text-slate-800 text-sm">Trip Details</h2>

            <div>
              <label className={labelCls}>Pickup Location</label>
              <PlacesInput
                value={trip.pickup_location}
                onChange={v => { setT('pickup_location', v); setConfirmedPickup('') }}
                onSelect={v => { setT('pickup_location', v); setConfirmedPickup(v) }}
                placeholder="e.g. Example International Airport"
              />
            </div>

            <div>
              <label className={labelCls}>Dropoff Location</label>
              <PlacesInput
                value={trip.dropoff_location}
                onChange={v => setT('dropoff_location', v)}
                onSelect={v => setT('dropoff_location', v)}
                placeholder="e.g. 123 Example Street"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Date</label>
                <input type="date" className={inputCls} min={new Date().toISOString().split('T')[0]}
                  value={trip.pickup_date} onChange={e => setT('pickup_date', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Time</label>
                <input type="time" className={inputCls}
                  value={trip.pickup_time} onChange={e => setT('pickup_time', e.target.value)} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Flight Number <span className="font-normal text-white normal-case">(optional)</span></label>
              <input type="text" className={inputCls} placeholder="e.g. AA1234"
                value={trip.flight_number} onChange={e => setT('flight_number', e.target.value)} />
            </div>
          </div>

          {/* Vehicle */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h2 className="font-semibold text-slate-800 text-sm mb-3">Vehicle</h2>
            <div className="grid grid-cols-2 gap-3">
              {VEHICLES.map(v => (
                <button key={v.id} onClick={() => setVehicleId(v.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${vehicleId === v.id ? 'border-[#0a1017] bg-slate-50' : 'border-slate-100 hover:border-slate-200'}`}>
                  <p className="font-semibold text-slate-800 text-sm">{v.name}</p>
                  <p className="text-xs text-white mt-0.5">Up to {v.capacity} passengers</p>
                  {price && (
                    <p className="text-sm font-bold text-slate-800 mt-2">
                      ${calculatePrice({ serviceType: 'corporate', distanceMiles: estimatedMiles, hours: 3, pickupDateTime: new Date(`${trip.pickup_date}T${trip.pickup_time}`), vehicleId: v.id, countyRates })?.total.toFixed(2) ?? '—'}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Passenger info */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
            <h2 className="font-semibold text-slate-800 text-sm">Passenger Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Full Name</label>
                <input type="text" className={inputCls} placeholder="Passenger name"
                  value={pax.name} onChange={e => setP('name', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" className={inputCls} placeholder="passenger@email.com"
                  value={pax.email} onChange={e => setP('email', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input type="tel" className={inputCls} placeholder="+1 (555) 000-0000"
                  value={pax.phone} onChange={e => setP('phone', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Passengers</label>
                <input type="number" className={inputCls} min={1} max={VEHICLES.find(v => v.id === vehicleId)?.capacity ?? 5}
                  value={pax.passengers} onChange={e => setP('passengers', Number(e.target.value))} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Notes <span className="font-normal text-white normal-case">(optional)</span></label>
              <textarea className={inputCls + ' resize-none'} rows={2} placeholder="Special requests or instructions"
                value={pax.notes} onChange={e => setP('notes', e.target.value)} />
            </div>
          </div>

          {/* Price summary */}
          {price && finalTotal !== null && (
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <h2 className="font-semibold text-slate-800 text-sm mb-3">Price Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-white"><span>Base fare</span><span>${price.total.toFixed(2)}</span></div>
                {discount > 0 && <div className="flex justify-between text-green-600"><span>Corporate discount ({account?.discount_rate}%)</span><span>-${discount.toFixed(2)}</span></div>}
                <div className="flex justify-between font-bold text-slate-800 text-base border-t border-slate-100 pt-2 mt-2">
                  <span>Total</span><span>${finalTotal.toFixed(2)}</span>
                </div>
                <p className="text-xs text-white">Billed to {account?.company_name} · Net {30} days</p>
              </div>
            </div>
          )}

          <button onClick={handleSubmit} disabled={!canSubmit}
            className="w-full bg-[#0a1017] text-white font-bold py-3.5 rounded-2xl hover:bg-[#1a2530] transition-colors disabled:opacity-40 text-sm">
            {loading ? 'Submitting…' : 'Confirm Booking'}
          </button>
        </div>
        </div>
      </div>
    </div>
  )
}
