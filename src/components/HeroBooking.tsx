'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import PlacesInput from './PlacesInput'

type Mode = 'oneway' | 'hourly'

const TIME_SLOTS = Array.from({ length: 96 }, (_, i) => {
  const totalMins = i * 15
  const h = Math.floor(totalMins / 60)
  const m = totalMins % 60
  const val = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  const label = `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
  return { val, label }
})

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function formatDate(d: string) {
  if (!d) return ''
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function Calendar({ value, onChange, onClose }: { value: string; onChange: (v: string) => void; onClose: () => void }) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const init = value ? new Date(value + 'T12:00:00') : new Date()
  const [view, setView] = useState(new Date(init.getFullYear(), init.getMonth(), 1))

  const year = view.getFullYear()
  const month = view.getMonth()
  const monthLabel = view.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  function isPast(day: number) {
    const d = new Date(year, month, day); d.setHours(0, 0, 0, 0)
    return d < today
  }
  function isSelected(day: number) {
    return value === `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }
  function select(day: number) {
    if (isPast(day)) return
    onChange(`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`)
    onClose()
  }

  return (
    <div className="bg-[#1a2030]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl w-80 max-w-[calc(100vw-2rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => setView(new Date(year, month - 1, 1))}
          className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-[#080808]/10 transition-colors text-lg"
        >
          ‹
        </button>
        <span className="text-white font-bold text-base">{monthLabel}</span>
        <button
          onClick={() => setView(new Date(year, month + 1, 1))}
          className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-[#080808]/10 transition-colors text-lg"
        >
          ›
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-white/10 pb-3 mb-3">
        {DAYS.map(d => (
          <div key={d} className="text-center text-white text-xs font-semibold tracking-wide">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => (
          <div key={i} className="flex items-center justify-center py-0.5">
            {day ? (
              <button
                onClick={() => select(day)}
                disabled={isPast(day)}
                className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                  isSelected(day)
                    ? 'bg-[#141414] text-white font-bold'
                    : isPast(day)
                    ? 'text-white cursor-not-allowed'
                    : 'text-white hover:bg-[#080808]/10'
                }`}
              >
                {day}
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function HeroBooking() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('oneway')
  const [pickup, setPickup] = useState('')
  const [dropoff, setDropoff] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [hours, setHours] = useState(3)
  const [details, setDetails] = useState('')
  const [addressOpen, setAddressOpen] = useState(false)
  const [showCal, setShowCal] = useState(false)
  const [showTime, setShowTime] = useState(false)
  const [showHours, setShowHours] = useState(false)

  const widgetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if ((addressOpen || showCal || showTime || showHours) && widgetRef.current) {
      widgetRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [addressOpen, showCal, showTime, showHours])
  const calRef = useRef<HTMLDivElement>(null)
  const timeRef = useRef<HTMLDivElement>(null)
  const hoursRef = useRef<HTMLDivElement>(null)
  const timeListRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (calRef.current && !calRef.current.contains(e.target as Node)) setShowCal(false)
      if (timeRef.current && !timeRef.current.contains(e.target as Node)) setShowTime(false)
      if (hoursRef.current && !hoursRef.current.contains(e.target as Node)) setShowHours(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Scroll selected time into view
  useEffect(() => {
    if (showTime && time && timeListRef.current) {
      const el = timeListRef.current.querySelector('[data-selected="true"]')
      el?.scrollIntoView({ block: 'center' })
    }
  }, [showTime, time])

  function go() {
    const p = new URLSearchParams()
    if (pickup) p.set('pickup', pickup)
    if (mode === 'oneway' && dropoff) p.set('dropoff', dropoff)
    if (date) p.set('date', date)
    if (time) p.set('time', time)
    if (mode === 'hourly') p.set('service', 'hourly')
    if (mode === 'hourly' && details) p.set('details', details)
    router.push(`/book?${p.toString()}`)
  }

  const valid = !!pickup && !!date && !!time
  const lbl = 'block text-white text-xs font-semibold uppercase tracking-wider mb-2 whitespace-nowrap'

  return (
    <div ref={widgetRef} className={`w-full transition-[padding] duration-200 ${(addressOpen || showCal || showTime || showHours) ? 'pb-72' : ''}`}>
      {/* Toggle */}
      <div className="flex justify-center mb-5">
        <div className="inline-flex bg-[#080808]/10 backdrop-blur-sm rounded-full p-1 border border-white/15">
          {(['oneway', 'hourly'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-7 py-2.5 rounded-full text-sm font-semibold transition-all ${
                mode === m ? 'bg-[#141414] text-white shadow' : 'text-white hover:text-white'
              }`}
            >
              {m === 'oneway' ? 'One way' : 'By the hour'}
            </button>
          ))}
        </div>
      </div>

      {/* Widget row */}
      <div className="bg-black/30 backdrop-blur-md border border-white/15 rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-stretch divide-y md:divide-y-0 md:divide-x divide-white/10">

          {/* Pickup */}
          <div className="flex-[3_1_0%] px-6 py-5 min-w-0">
            <label className={lbl}>Pickup location</label>
            <PlacesInput value={pickup} onChange={setPickup} onSelect={setPickup} onOpenChange={setAddressOpen} placeholder="Address, airport, hotel..." dark />
          </div>

          {/* Dropoff / Duration */}
          {mode === 'oneway' ? (
            <div className="flex-[3_1_0%] px-6 py-5 min-w-0">
              <label className={lbl}>Drop-off location</label>
              <PlacesInput value={dropoff} onChange={setDropoff} onSelect={setDropoff} onOpenChange={setAddressOpen} placeholder="Address, airport, hotel..." dark />
            </div>
          ) : (
            <div className="flex-[1_1_0%] px-6 py-5 relative min-w-[110px]" ref={hoursRef}>
              <label className={lbl}>Duration</label>
              <button onClick={() => setShowHours(!showHours)} className="flex items-center gap-2 w-full border-b border-white/20 pb-1">
                <span className="text-white text-sm font-medium flex-1 text-left whitespace-nowrap">{hours} hours</span>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showHours ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
                </svg>
              </button>
              {showHours && (
                <div className="absolute z-50 left-0 top-full mt-2 w-40 bg-[#1a2030]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                  {[2,3,4,5,6,8,10,12].map(h => (
                    <button key={h} onClick={() => { setHours(h); setShowHours(false) }}
                      className={`block w-full text-left px-5 py-3.5 text-base font-medium transition-colors ${hours === h ? 'bg-black/40 text-white' : 'text-white/80 hover:bg-[#080808]/5'}`}>
                      {h} hours
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Date */}
          <div className="flex-[2_1_0%] px-6 py-5 relative min-w-[170px]" ref={calRef}>
            <label className={lbl}>Date</label>
            <button onClick={() => { setShowCal(!showCal); setShowTime(false) }} className="flex items-center gap-2 w-full border-b border-white/20 pb-1">
              <svg className="w-4 h-4 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className={`text-sm flex-1 text-left whitespace-nowrap ${date ? 'text-white font-medium' : 'text-white'}`}>
                {date ? formatDate(date) : 'Select a date'}
              </span>
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showCal ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
              </svg>
            </button>
            {showCal && (
              <div className="absolute z-50 left-0 top-full mt-2">
                <Calendar value={date} onChange={setDate} onClose={() => setShowCal(false)} />
              </div>
            )}
          </div>

          {/* Time */}
          <div className="flex-[2_1_0%] px-6 py-5 relative min-w-[160px]" ref={timeRef}>
            <label className={lbl}>Pickup time</label>
            <button onClick={() => { setShowTime(!showTime); setShowCal(false) }} className="flex items-center gap-2 w-full border-b border-white/20 pb-1">
              <svg className="w-4 h-4 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className={`text-sm flex-1 text-left whitespace-nowrap ${time ? 'text-white font-medium' : 'text-white'}`}>
                {time ? TIME_SLOTS.find(s => s.val === time)?.label : 'Select a time'}
              </span>
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showTime ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
              </svg>
            </button>
            {showTime && (
              <div ref={timeListRef} className="absolute z-50 left-0 top-full mt-2 w-44 bg-[#1a2030]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-y-auto max-h-64">
                {TIME_SLOTS.map(slot => (
                  <button
                    key={slot.val}
                    data-selected={time === slot.val}
                    onClick={() => { setTime(slot.val); setShowTime(false) }}
                    className={`block w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                      time === slot.val
                        ? 'bg-black/50 text-white rounded-xl'
                        : 'text-white hover:bg-[#080808]/5 hover:text-white'
                    }`}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="px-5 py-5 flex items-center">
            <button
              onClick={go}
              disabled={!valid}
              className="w-full md:w-auto bg-[#141414] hover:bg-[#1e262d] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-7 py-3 rounded-xl transition-colors whitespace-nowrap"
            >
              View options →
            </button>
          </div>
        </div>
      </div>

      {/* Hourly details field */}
      {mode === 'hourly' && !addressOpen && !showCal && !showTime && !showHours && (
        <div className="mt-2 bg-black/30 backdrop-blur-md border border-white/15 rounded-2xl px-6 py-4">
          <label className={lbl}>Trip details <span className="text-white normal-case font-normal">(optional)</span></label>
          <textarea
            value={details}
            onChange={e => setDetails(e.target.value)}
            placeholder="Describe your trip — destinations, stops, special requests..."
            rows={2}
            className="w-full bg-transparent text-white text-sm placeholder:text-white resize-none outline-none border-b border-white/20 pb-1 leading-relaxed"
          />
        </div>
      )}
    </div>
  )
}
