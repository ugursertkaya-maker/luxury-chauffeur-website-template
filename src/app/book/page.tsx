'use client'
import { useState, Suspense, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import PlacesInput from '@/components/PlacesInput'
import RouteMap from '@/components/RouteMap'
import { calculatePrice, formatPrice, CountyRates } from '@/lib/pricing'
import { ServiceType } from '@/types'
import { Car, Truck, UserCheck, XCircle, Zap, Scissors, Clock, Plane, Lock } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { brand } from '@/config/brand'

const SERVICE_LABELS: Record<ServiceType, string> = {
  airport: 'Airport Transfer',
  wedding: 'Wedding',
  hourly: 'Hourly Charter',
  corporate: 'Corporate',
  cruise: 'Cruise Port',
  event: 'Night Out & Events',
}

const VEHICLES = [
  {
    id: 'sedan',
    name: 'Premium Sedan',
    model: 'Executive Sedan',
    capacity: 3,
    luggage: 2,
    tagline: 'Refined comfort for solo travelers and business trips.',
    Icon: Car,
  },
  {
    id: 'suv',
    name: 'Premium SUV',
    model: 'Luxury Sport Utility',
    capacity: 5,
    luggage: 5,
    tagline: 'Bold and spacious, for larger plans done in comfort.',
    Icon: Truck,
  },
]

const INCLUDED_BASE: { Icon: LucideIcon; label: string }[] = [
  { Icon: UserCheck, label: 'Personal meet & greet' },
  { Icon: XCircle, label: 'Free cancellation up to 24 hours before' },
  { Icon: Zap, label: 'iOS and Android chargers onboard' },
  { Icon: Scissors, label: 'Complimentary tissues & wipes' },
  { Icon: Zap, label: 'Complimentary chilled water' },
]

const inputCls = 'w-full border border-[#D4A017]/20 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A017]/20 bg-[#141414] text-white placeholder-white/20'
const labelCls = 'block text-xs font-semibold text-white uppercase tracking-wider mb-2'

type Phase = 'search' | 'select' | 'details'

function BookContent() {
  const searchParams = useSearchParams()
  const initialPickup = searchParams.get('pickup') || ''
  const initialDropoff = searchParams.get('dropoff') || ''
  const initialDate = searchParams.get('date') || ''
  const initialTime = searchParams.get('time') || ''
  const isDirect = searchParams.get('direct') === '1'
  const hasParams = !!(initialPickup && initialDate && initialTime) || isDirect
  const router = useRouter()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (!params.get('pickup') && !params.get('direct')) router.replace('/#booking')
  }, [])

  const [phase, setPhase] = useState<Phase>(hasParams ? 'search' : 'search')
  const [selectedVehicleId, setSelectedVehicleId] = useState('suv')

  function selectVehicle(id: string) {
    const v = VEHICLES.find(v => v.id === id)!
    setSelectedVehicleId(id)
    setPax(p => ({
      ...p,
      passengers: Math.min(p.passengers, v.capacity),
      luggage: Math.min(p.luggage, v.luggage),
    }))
  }
  const [realMiles, setRealMiles] = useState<number | null>(null)
  const [confirmedPickup, setConfirmedPickup] = useState(initialPickup)
  const [confirmedDropoff, setConfirmedDropoff] = useState(initialDropoff)
  const [loading, setLoading] = useState(false)
  const [countyRates, setCountyRates] = useState<CountyRates | null>(null)
  const [pricingSource, setPricingSource] = useState<string | null>(null)
  const lookupRef = useRef<string>('')

  const [trip, setTrip] = useState({
    service_type: 'airport' as ServiceType,
    pickup_location: initialPickup,
    dropoff_location: initialDropoff,
    pickup_date: initialDate,
    pickup_time: initialTime,
    hours: 3,
    flight_number: '',
  })

  const [pax, setPax] = useState({
    name: '', email: '', phone: '',
    passengers: 1, luggage: 0, notes: '',
  })

  const setT = (k: string, v: unknown) => setTrip(f => ({ ...f, [k]: v }))
  const setP = (k: string, v: unknown) => setPax(f => ({ ...f, [k]: v }))

  // Fetch county pricing when pickup location is confirmed
  useEffect(() => {
    const loc = confirmedPickup || trip.pickup_location
    if (!loc || loc === lookupRef.current) return
    lookupRef.current = loc
    fetch(`/api/pricing/lookup?location=${encodeURIComponent(loc)}`)
      .then(r => r.json())
      .then(d => {
        if (d.rates) { setCountyRates(d.rates); setPricingSource(d.source) }
        else { setCountyRates(null); setPricingSource(null) }
      })
      .catch(() => {})
  }, [confirmedPickup, trip.pickup_location])

  const isHourly = trip.service_type === 'hourly' || trip.service_type === 'event'
  const isAirport = trip.service_type === 'airport'
  const hasAirport = /airport/i.test(trip.pickup_location) || /airport/i.test(trip.dropoff_location)
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pax.email)
  const validPhone = /^[\+]?[\d\s\-\(\)]{7,15}$/.test(pax.phone)
  const estimatedMiles = realMiles ?? 25
  const selectedVehicle = VEHICLES.find(v => v.id === selectedVehicleId)!

  function getPrice(vehicleId: string) {
    if (!trip.pickup_date || !trip.pickup_time) return null
    return calculatePrice({
      serviceType: trip.service_type,
      distanceMiles: estimatedMiles,
      hours: trip.hours,
      pickupDateTime: new Date(`${trip.pickup_date}T${trip.pickup_time}`),
      vehicleId,
      countyRates,
    })
  }

  const currentPrice = getPrice(selectedVehicleId)
  const searchValid = !!trip.pickup_location && !!trip.pickup_date && !!trip.pickup_time

  const [discountCode, setDiscountCode] = useState('')
  const [discountResult, setDiscountResult] = useState<{ valid: boolean; discount_amount?: number; final_amount?: number; value?: number; type?: string; description?: string; error?: string } | null>(null)
  const [checkingDiscount, setCheckingDiscount] = useState(false)

  const [corporateCode, setCorporateCode] = useState('')
  const [corporateResult, setCorporateResult] = useState<{ valid: boolean; company_name?: string; account_id?: string; payment_terms?: number; discount_rate?: number; error?: string } | null>(null)
  const [checkingCorporate, setCheckingCorporate] = useState(false)

  async function applyDiscount() {
    if (!discountCode.trim() || !pax.email) return
    setCheckingDiscount(true)
    const r = await fetch('/api/discount/validate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: discountCode, email: pax.email, order_amount: currentPrice?.total ?? 0 }),
    })
    setDiscountResult(await r.json())
    setCheckingDiscount(false)
  }

  async function applyCorporate() {
    if (!corporateCode.trim()) return
    setCheckingCorporate(true)
    const r = await fetch(`/api/corporate/validate?code=${encodeURIComponent(corporateCode.trim())}`)
    const d = await r.json()
    setCorporateResult(d)
    setCheckingCorporate(false)
  }

  const isCorporateValid = corporateResult?.valid === true
  const corporateDiscount = isCorporateValid && (corporateResult!.discount_rate ?? 0) > 0
    ? Math.round((currentPrice?.total ?? 0) * (corporateResult!.discount_rate! / 100) * 100) / 100
    : 0
  const corporateTotal = isCorporateValid ? Math.round(((currentPrice?.total ?? 0) - corporateDiscount) * 100) / 100 : null
  const finalTotal = isCorporateValid ? corporateTotal : (discountResult?.valid ? (discountResult.final_amount ?? currentPrice?.total) : currentPrice?.total)

  async function handleSubmit() {
    setLoading(true)
    try {
      const price = getPrice(selectedVehicleId)
      const total = isCorporateValid ? corporateTotal : (discountResult?.valid ? (discountResult.final_amount ?? price?.total) : price?.total)
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...trip, ...pax,
          vehicle_id: selectedVehicleId,
          estimated_miles: estimatedMiles,
          total_price: total,
          price_base: price?.base,
          price_per_mile: price?.per_mile,
          price_distance_charge: price?.distance_charge,
          price_time_charge: price?.time_charge,
          price_surcharges: price?.surcharges?.length ? price.surcharges : null,
          corporate_code: isCorporateValid ? corporateCode.trim().toUpperCase() : null,
          corporate_account_id: isCorporateValid ? corporateResult!.account_id : null,
          discount_code: isCorporateValid && corporateDiscount > 0 ? `CORP-${corporateCode.trim().toUpperCase()}` : (discountResult?.valid ? discountCode.toUpperCase() : null),
          discount_amount: isCorporateValid ? corporateDiscount : (discountResult?.valid ? discountResult.discount_amount : 0),
        }),
      })
      const data = await res.json()
      if (!data.id) return
      if (data.is_corporate) {
        window.location.href = `/confirmation?redirect_status=succeeded&booking_number=${data.booking_number}`
      } else {
        window.location.href = `/book/payment?id=${data.id}&amount=${total}`
      }
    } finally {
      setLoading(false)
    }
  }

  // ── SEARCH PHASE ──────────────────────────────────────────────────────────
  if (phase === 'search') {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-[#0e0e0e] flex items-start justify-center py-16 px-4">
          <div className="w-full max-w-lg bg-[#0e0e0e] rounded-2xl border border-[#D4A017]/15 p-8">
            <h1 className="text-2xl font-extrabold text-white mb-1">Book Your Ride</h1>
            <p className="text-white text-sm mb-7">Premium chauffeur service in {brand.address.locality}</p>

            <div className="space-y-5">
              <div>
                <label className={labelCls}>Service</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.keys(SERVICE_LABELS) as ServiceType[]).map(s => (
                    <button
                      key={s}
                      onClick={() => setT('service_type', s)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-medium transition-all ${
                        trip.service_type === s
                          ? 'border-[#2b353d] bg-[#141414] text-white'
                          : 'border-[#D4A017]/10 text-white hover:border-[#D4A017]/20'
                      }`}
                    >
                      {SERVICE_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCls}>Pickup</label>
                <PlacesInput
                  value={trip.pickup_location}
                  onChange={v => { setT('pickup_location', v); setConfirmedPickup('') }}
                  onSelect={v => { setT('pickup_location', v); setConfirmedPickup(v) }}
                  placeholder="e.g. Example International Airport"
                />
              </div>

              {!isHourly && (
                <div>
                  <label className={labelCls}>Dropoff</label>
                  <PlacesInput
                    value={trip.dropoff_location}
                    onChange={v => { setT('dropoff_location', v); setConfirmedDropoff('') }}
                    onSelect={v => { setT('dropoff_location', v); setConfirmedDropoff(v) }}
                    placeholder="e.g. Downtown Example Hotel"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Date</label>
                  <input
                    type="date"
                    className={inputCls}
                    min={new Date().toISOString().split('T')[0]}
                    value={trip.pickup_date}
                    onChange={e => setT('pickup_date', e.target.value)}
                    onBlur={e => setT('pickup_date', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>Time</label>
                  <select className={inputCls} value={trip.pickup_time} onChange={e => setT('pickup_time', e.target.value)}>
                    <option value="">Select...</option>
                    {Array.from({ length: 48 }, (_, i) => {
                      const h = Math.floor(i / 2)
                      const m = i % 2 === 0 ? '00' : '30'
                      const val = `${String(h).padStart(2, '0')}:${m}`
                      const label = `${h === 0 ? 12 : h > 12 ? h - 12 : h}:${m} ${h < 12 ? 'AM' : 'PM'}`
                      return <option key={val} value={val}>{label}</option>
                    })}
                  </select>
                </div>
              </div>

              {isHourly && (
                <div>
                  <label className={labelCls}>Hours</label>
                  <select className={inputCls} value={trip.hours} onChange={e => setT('hours', Number(e.target.value))}>
                    {[2,3,4,5,6,8,10,12].map(h => <option key={h} value={h}>{h} hours</option>)}
                  </select>
                </div>
              )}

              {isAirport && (
                <div>
                  <label className={labelCls}>Flight Number <span className="normal-case font-normal text-white">(optional)</span></label>
                  <input className={inputCls} placeholder="e.g. AA1234" value={trip.flight_number} onChange={e => setT('flight_number', e.target.value)} />
                </div>
              )}

              <button
                onClick={() => setPhase('select')}
                disabled={!searchValid}
                className="w-full bg-[#141414] hover:bg-[#1e262d] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors"
              >
                See Available Vehicles →
              </button>

              {!searchValid && (
                <div className="text-xs text-white space-y-1">
                  {!trip.pickup_location && <p>• Pickup location required</p>}
                  {!trip.pickup_date && <p>• Date required</p>}
                  {!trip.pickup_time && <p>• Time required</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    )
  }

  // ── SELECT / DETAILS PHASE ────────────────────────────────────────────────
  return (
    <>
      <Navbar />

      {/* Route bar */}
      <div className="sticky top-0 z-30 bg-[#141414] border-b border-[#D4A017]/10 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-3 text-sm flex-wrap">
          <div className="flex items-center gap-2 bg-[#141414] rounded-full px-4 py-2 text-white/80">
            <span className="truncate max-w-[150px]">{trip.pickup_location}</span>
            <span className="text-white text-xs">→</span>
            <span className="truncate max-w-[150px]">{trip.dropoff_location || '—'}</span>
          </div>
          <div className="flex items-center gap-2 bg-[#141414] rounded-full px-4 py-2 text-white/80">
            {isAirport && <Plane className="w-4 h-4 inline" strokeWidth={1.5} />}
            <span>{trip.pickup_date}</span>
            <span className="text-white text-xs">·</span>
            <span>{trip.pickup_time}</span>
          </div>
          <button onClick={() => setPhase('search')} className="text-white text-xs font-semibold hover:underline ml-1">
            Edit
          </button>
        </div>
      </div>

      <div className="min-h-screen bg-[#0e0e0e]">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col-reverse lg:flex-row gap-6 lg:gap-8 items-start">

          {/* LEFT COLUMN */}
          <div className="flex-1 min-w-0 w-full">

            {/* Vehicle tabs */}
            <div className="flex gap-3 mb-6 flex-wrap">
              {VEHICLES.map(v => {
                const p = getPrice(v.id)
                const isActive = selectedVehicleId === v.id
                return (
                  <button
                    key={v.id}
                    onClick={() => selectVehicle(v.id)}
                    className={`flex items-center gap-3 px-5 py-3 rounded-full border-2 text-sm font-semibold transition-all bg-[#141414] ${
                      isActive
                        ? 'border-[#2b353d] text-white'
                        : 'border-[#D4A017]/15 text-white hover:border-[#D4A017]/30'
                    }`}
                  >
                    <span>{v.name}</span>
                    {p && <span className="font-bold">{formatPrice(p.total)}</span>}
                  </button>
                )
              })}
            </div>

            {/* Vehicle photo */}
            <div className="rounded-2xl h-64 overflow-hidden mb-2 bg-[#f5f5f5]">
              <img
                src={selectedVehicle.id === 'suv' ? '/vehicles/placeholder-suv.svg' : '/vehicles/placeholder-sedan.svg'}
                alt={selectedVehicle.model}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-white text-sm italic mb-6 px-1">{selectedVehicle.tagline}</p>

            {/* Route map */}
            {confirmedPickup && confirmedDropoff && (
              <div className="mb-6">
                <RouteMap
                  pickup={confirmedPickup}
                  dropoff={confirmedDropoff}
                  onRouteCalculated={info => setRealMiles(info.distanceMiles)}
                />
              </div>
            )}

            {/* What's included */}
            <div className="bg-[#0e0e0e] rounded-2xl border border-[#D4A017]/10 p-6 mb-4">
              <h2 className="text-xl font-extrabold text-white mb-6">What&apos;s included</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {([{ Icon: Clock, label: `Up to ${isAirport ? '60' : '30'} min free wait time` }, ...INCLUDED_BASE] as { Icon: LucideIcon; label: string }[]).map(item => (
                  <div key={item.label} className="flex flex-col gap-2">
                    <item.Icon className="w-6 h-6 text-white" strokeWidth={1.5} />
                    <span className="text-sm text-white leading-snug">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Capacity */}
            <div className="bg-[#0e0e0e] rounded-2xl border border-[#D4A017]/10 p-6 mb-4">
              <h2 className="text-xl font-extrabold text-white mb-4">Capacity</h2>
              <div className="flex gap-8 text-sm text-white">
                <span>👥 Up to {selectedVehicle.capacity} passengers</span>
                <span>🧳 Up to {selectedVehicle.luggage} bags</span>
              </div>
            </div>

            {/* Price breakdown */}
            {currentPrice && (
              <div className="bg-[#0e0e0e] rounded-2xl border border-[#D4A017]/10 p-6">
                <h2 className="text-xl font-extrabold text-white mb-5">Price breakdown</h2>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm pb-3 border-b border-dashed border-[#D4A017]/10">
                    <span className="text-white">Base fare</span>
                    <span className="font-semibold text-white">
                      {formatPrice(currentPrice.base + currentPrice.distance_charge + currentPrice.time_charge)}
                    </span>
                  </div>
                  {currentPrice.surcharges.map(s => (
                    <div key={s.label} className="flex justify-between text-sm pb-3 border-b border-dashed border-[#D4A017]/10">
                      <span className="text-white">{s.label}</span>
                      <span className="font-semibold text-white">{formatPrice(s.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold text-white pt-1">
                    <span>Total</span>
                    <span>{formatPrice(currentPrice.total)}</span>
                  </div>
                </div>
                <p className="text-xs text-white mt-4">All fees included · No hidden charges</p>
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="w-full lg:w-[320px] lg:flex-shrink-0 lg:sticky lg:top-24">
            <div className="bg-[#0e0e0e] rounded-2xl border border-[#D4A017]/10 overflow-hidden">

              {/* Header */}
              <div className="px-6 pt-6 pb-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-extrabold text-white text-base">{selectedVehicle.name}</p>
                    <p className="text-xs text-white mt-0.5 font-medium">{selectedVehicle.model}</p>
                  </div>
                  {currentPrice && (
                    <div className="text-right">
                      <p className="font-black text-white text-xl leading-none">{formatPrice(currentPrice.total)}</p>
                      <p className="text-[11px] text-white mt-1">all fees included</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="h-px bg-[#141414]" />

              {phase === 'select' && (
                <div className="px-6 py-5">
                  {/* Counter row */}
                  <div className="space-y-4 mb-6">
                    {[
                      { label: 'Passengers', icon: '👤', value: pax.passengers, min: 1, max: selectedVehicle.capacity, key: 'passengers' },
                      { label: 'Luggage', icon: '🧳', value: pax.luggage, min: 0, max: selectedVehicle.luggage, key: 'luggage' },
                    ].map(({ label, icon, value, min, max, key }) => (
                      <div key={key} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{icon}</span>
                          <div>
                            <p className="text-sm font-semibold text-white/90">{label}</p>
                            <p className="text-[11px] text-white">max {max}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setP(key, Math.max(min, value - 1))}
                            disabled={value <= min}
                            className="w-8 h-8 rounded-full border-2 border-[#D4A017]/15 flex items-center justify-center text-white font-bold text-lg hover:border-[#D4A017]/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >−</button>
                          <span className="w-5 text-center font-bold text-white text-sm">{value}</span>
                          <button
                            onClick={() => setP(key, Math.min(max, value + 1))}
                            disabled={value >= max}
                            className="w-8 h-8 rounded-full border-2 border-[#D4A017]/15 flex items-center justify-center text-white font-bold text-lg hover:border-[#D4A017]/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setPhase('details')}
                    className="w-full bg-[#141414] hover:bg-[#1e262d] text-white font-bold py-3.5 rounded-xl transition-colors text-sm"
                  >
                    Continue →
                  </button>
                </div>
              )}

              {phase === 'details' && (
                <div className="px-6 py-5">
                  <div className="space-y-3 mb-5">
                    <div>
                      <label className={labelCls}>Full Name</label>
                      <input className={inputCls} placeholder="John Smith" value={pax.name} onChange={e => setP('name', e.target.value)} />
                    </div>
                    <div>
                      <label className={labelCls}>Email</label>
                      <input type="email" className={inputCls} placeholder="john@example.com" value={pax.email} onChange={e => setP('email', e.target.value)} />
                      {pax.email && !validEmail && <p className="text-red-500 text-xs mt-1">Please enter a valid email address.</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Phone</label>
                      <input type="tel" className={inputCls} placeholder="+1 (555) 000-0000" value={pax.phone} onChange={e => setP('phone', e.target.value)} />
                      {pax.phone && !validPhone && <p className="text-red-500 text-xs mt-1">Please enter a valid phone number.</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Notes <span className="normal-case font-normal text-white">(optional)</span></label>
                      <textarea
                        rows={2}
                        className={`${inputCls} resize-none`}
                        placeholder="Child seat, special requests..."
                        value={pax.notes}
                        onChange={e => setP('notes', e.target.value)}
                      />
                    </div>
                  </div>
                  {hasAirport && (
                    <div className="mb-4 p-3 bg-[#0e0e0e] rounded-xl border border-[#D4A017]/10">
                      <label className={labelCls}>Flight Number <span className="normal-case font-normal text-white">(optional)</span></label>
                      <input
                        className={inputCls}
                        placeholder="e.g. AA1234, UA567"
                        value={trip.flight_number}
                        onChange={e => setT('flight_number', e.target.value)}
                      />
                      <p className="text-[11px] text-white mt-1.5">We track your flight for delays & early arrivals.</p>
                    </div>
                  )}
                  {/* Corporate Code */}
                  {currentPrice && (
                    <div className="mb-4">
                      <label className={labelCls}>Corporate Account Code <span className="normal-case font-normal text-white">(optional)</span></label>
                      <div className="flex gap-2">
                        <input
                          className={`${inputCls} uppercase font-mono tracking-wider`}
                          placeholder="CORP-XXXXX"
                          value={corporateCode}
                          onChange={e => { setCorporateCode(e.target.value.toUpperCase()); setCorporateResult(null) }}
                        />
                        <button onClick={applyCorporate} disabled={checkingCorporate || !corporateCode.trim()}
                          className="px-4 py-3 bg-[#141414] text-white/80 font-semibold rounded-xl hover:bg-[#1a1a1a] disabled:opacity-40 transition-colors text-sm whitespace-nowrap">
                          {checkingCorporate ? '…' : 'Apply'}
                        </button>
                      </div>
                      {corporateResult?.valid && (
                        <div className="mt-2 bg-white/8 border border-[#D4A017]/30 rounded-xl px-4 py-3">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">🏢</span>
                            <div>
                              <p className="text-white font-bold text-sm">{corporateResult.company_name}</p>
                              <p className="text-white text-xs">Billed to account · Net {corporateResult.payment_terms ?? 30} days</p>
                            </div>
                          </div>
                          {corporateDiscount > 0 && currentPrice && (
                            <div className="border-t border-[#D4A017]/30 pt-2 space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-white">Original</span>
                                <span className="line-through text-white">{formatPrice(currentPrice.total)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-white font-semibold">Corporate Discount ({corporateResult.discount_rate}%)</span>
                                <span className="text-white font-semibold">-{formatPrice(corporateDiscount)}</span>
                              </div>
                              <div className="flex justify-between font-bold border-t border-[#D4A017]/30 pt-1">
                                <span className="text-white/90">Total</span>
                                <span className="text-white">{formatPrice(corporateTotal!)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {corporateResult && !corporateResult.valid && (
                        <p className="text-red-500 text-xs mt-1.5">{corporateResult.error ?? 'Invalid corporate code'}</p>
                      )}
                    </div>
                  )}

                  {/* Discount Code */}
                  {currentPrice && !isCorporateValid && (
                    <div className="mb-4">
                      <label className={labelCls}>Discount Code <span className="normal-case font-normal text-white">(optional)</span></label>
                      <div className="flex gap-2">
                        <input
                          className={`${inputCls} uppercase font-mono tracking-wider`}
                          placeholder="ENTER CODE"
                          value={discountCode}
                          onChange={e => { setDiscountCode(e.target.value.toUpperCase()); setDiscountResult(null) }}
                        />
                        <button
                          onClick={applyDiscount}
                          disabled={checkingDiscount || !discountCode.trim() || !pax.email}
                          className="px-4 py-3 bg-[#141414] text-white/80 font-semibold rounded-xl hover:bg-[#1a1a1a] disabled:opacity-40 transition-colors text-sm whitespace-nowrap"
                        >
                          {checkingDiscount ? '…' : 'Apply'}
                        </button>
                      </div>
                      {discountResult?.valid && (
                        <div className="mt-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                          <p className="text-green-700 font-semibold text-sm">
                            {discountResult.type === 'percentage' ? `%${discountResult.value} discount` : `$${discountResult.value} off`} applied!
                          </p>
                          <div className="flex justify-between text-sm mt-1.5">
                            <span className="text-white">Original</span>
                            <span className="line-through text-white">{formatPrice(currentPrice.total)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-white">Discount</span>
                            <span className="text-green-600 font-semibold">-{formatPrice(discountResult.discount_amount!)}</span>
                          </div>
                          <div className="flex justify-between text-base font-bold mt-1 border-t border-green-200 pt-1.5">
                            <span className="text-white/90">Total</span>
                            <span className="text-green-700">{formatPrice(discountResult.final_amount!)}</span>
                          </div>
                        </div>
                      )}
                      {discountResult && !discountResult.valid && (
                        <p className="text-red-500 text-xs mt-1.5">{discountResult.error}</p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => setPhase('select')}
                      className="border-2 border-[#D4A017]/15 text-white font-semibold py-3 px-4 rounded-xl hover:border-[#D4A017]/20 transition-colors text-sm"
                    >
                      ←
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={loading || !pax.name || !validEmail || !validPhone}
                      className="flex-1 bg-[#141414] hover:bg-[#1e262d] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors text-sm"
                    >
                      {loading ? 'Processing...' : isCorporateValid ? `Confirm Booking →` : `Pay ${finalTotal ? formatPrice(finalTotal) : ''} →`}
                    </button>
                  </div>
                  {isCorporateValid
                    ? <p className="text-xs text-center text-white">No payment required — billed to {corporateResult!.company_name}</p>
                    : <p className="text-xs text-center text-white flex items-center justify-center gap-1"><Lock className="w-3 h-3" strokeWidth={2} /> Secured by Stripe</p>
                  }
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}

export default function BookPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center text-white">Loading...</div>}>
      <BookContent />
    </Suspense>
  )
}
