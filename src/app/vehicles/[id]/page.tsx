'use client'
import { notFound } from 'next/navigation'
import { use, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { UserCheck, Clock, XCircle, Zap, Scissors } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/**
 * Fleet detail pages.
 *
 * TODO: replace `model`, `available` and the captions with your own vehicles.
 * Swap the placeholder images in /public/vehicles for your own photography.
 */
const VEHICLES = {
  suv: {
    name: 'Premium SUV',
    model: 'Your SUV make and model',
    quote: 'Made for shared journeys, with generous space for up to five and their luggage, all in quiet comfort.',
    available: 1,
    color: '#2b353d',
    slides: [
      { src: '/vehicles/placeholder-suv.svg', caption: 'Bold and spacious, for larger plans done in comfort.' },
      { src: '/vehicles/placeholder-suv.svg', caption: 'Professional chauffeur service, day or night.' },
      { src: '/vehicles/placeholder-suv.svg', caption: 'Seamless airport pickups and drop-offs.' },
      { src: '/vehicles/placeholder-suv.svg', caption: 'Hotel and venue transfers done right.' },
      { src: '/vehicles/capacity/suv-seating-5.svg', caption: 'Up to 5 passengers in premium leather.' },
      { src: '/vehicles/capacity/suv-luggage-standard.svg', caption: 'Generous cargo space for every trip.' },
    ],
    luggage: [
      { label: '5 × Standard check-in', img: '/vehicles/capacity/suv-luggage-standard.svg' },
      { label: '3 × Extra large check-in', img: '/vehicles/capacity/suv-luggage-xlarge.svg' },
      { label: '8 × Carry-on', img: '/vehicles/capacity/suv-luggage-carryon.svg' },
    ],
    seating: [
      { label: 'Five passengers', img: '/vehicles/capacity/suv-seating-5.svg' },
      { label: 'Two passengers', img: '/vehicles/capacity/suv-seating-2.svg' },
    ],
    luggageNote: 'Based on standard luggage sizes, which may differ from yours. You can specify the details of your luggage in the "Pickup notes" on the next step.',
    seatingNote: 'Baby and child seats are available on request. Add your request in "Pickup notes" on the next step and include the child\'s age.',
  },
  sedan: {
    name: 'Premium Sedan',
    model: 'Your sedan make and model',
    quote: 'Premium made practical. Spacious seating, a smooth journey, and punctual pickups that keep your day in rhythm.',
    available: 1,
    color: '#475665',
    slides: [
      { src: '/vehicles/placeholder-sedan.svg', caption: 'Executive-level comfort and a quiet ride.' },
      { src: '/vehicles/capacity/sedan-seating-3.svg', caption: 'Up to 3 passengers in executive leather.' },
      { src: '/vehicles/capacity/sedan-luggage-standard.svg', caption: 'Refined cargo space for every journey.' },
    ],
    luggage: [
      { label: '2 × Standard check-in', img: '/vehicles/capacity/sedan-luggage-standard.svg' },
      { label: '1 × Extra large check-in', img: '/vehicles/capacity/sedan-luggage-xlarge.svg' },
      { label: '2 × Carry-on', img: '/vehicles/capacity/sedan-luggage-carryon.svg' },
    ],
    seating: [
      { label: 'Three passengers', img: '/vehicles/capacity/sedan-seating-3.svg' },
      { label: 'Two passengers', img: '/vehicles/capacity/sedan-seating-2.svg' },
      { label: 'Child seat', img: '/vehicles/capacity/sedan-seating-child.svg' },
      { label: 'Baby seat', img: '/vehicles/capacity/sedan-seating-baby.svg' },
    ],
    luggageNote: 'Based on standard luggage sizes, which may differ from yours. You can specify the details of your luggage in the "Pickup notes" on the next step.',
    seatingNote: 'Baby and child seats are available on request. Add your request in "Pickup notes" on the next step and include the child\'s age.',
  },
}

const INCLUDED: { Icon: LucideIcon; label: string }[] = [
  { Icon: UserCheck, label: 'Personal meet & greet' },
  { Icon: Clock, label: '60 min wait (airport) · 30 min (all other)' },
  { Icon: XCircle, label: 'Free to cancel up to 1 hour before' },
  { Icon: Zap, label: 'iOS and Android chargers onboard' },
  { Icon: Scissors, label: 'Complimentary tissues & wipes' },
  { Icon: Zap, label: 'Complimentary chilled water' },
]

export default function VehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const vehicle = VEHICLES[id as keyof typeof VEHICLES]
  if (!vehicle) notFound()

  const [slide, setSlide] = useState(0)
  const [capacityTab, setCapacityTab] = useState<'luggage' | 'seating'>('luggage')
  const [luggageIdx, setLuggageIdx] = useState(0)
  const [seatingIdx, setSeatingIdx] = useState(0)

  const activeImg = capacityTab === 'luggage'
    ? vehicle.luggage[luggageIdx].img
    : vehicle.seating[seatingIdx].img

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#080808]">

        {/* Slider */}
        <div className="pt-16">
          <div className="max-w-4xl mx-auto px-6 pt-10 pb-0">
            <Link href="/#fleet" className="inline-flex items-center gap-1.5 text-sm text-white hover:text-white/90 transition-colors mb-6">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
              All vehicles
            </Link>

            <div className="relative rounded-2xl overflow-hidden bg-[#141414]">
              <img
                src={vehicle.slides[slide].src}
                alt={vehicle.name}
                className="w-full h-[420px] object-cover transition-opacity duration-300"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-sm px-6 py-4">
                <p className="text-white text-sm mb-3">{vehicle.slides[slide].caption}</p>
                <div className="flex gap-2">
                  {vehicle.slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSlide(i)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${i === slide ? 'bg-[#080808] scale-110' : 'bg-[#080808]/40'}`}
                    />
                  ))}
                </div>
              </div>
              {slide < vehicle.slides.length - 1 && (
                <button
                  onClick={() => setSlide(s => s + 1)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#080808]/80 backdrop-blur flex items-center justify-center shadow hover:bg-[#080808] transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                </button>
              )}
            </div>

            {/* Quote */}
            <p className="text-center text-2xl md:text-3xl font-medium text-white mt-10 mb-12 leading-snug max-w-2xl mx-auto">
              {vehicle.quote}
            </p>
          </div>
        </div>

        <div className="border-t border-[#D4A017]/20/50" />

        {/* What's included */}
        <div className="max-w-4xl mx-auto px-6 py-14">
          <h2 className="text-3xl font-light text-white mb-10">What&apos;s included</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-12 gap-y-10">
            {INCLUDED.map(item => (
              <div key={item.label}>
                <item.Icon className="w-7 h-7 text-white mb-3" strokeWidth={1.5} />
                <p className="text-white/80 text-sm leading-relaxed">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-[#D4A017]/20/50" />

        {/* Capacity */}
        <div className="max-w-4xl mx-auto px-6 py-14">
          <h2 className="text-3xl font-light text-white mb-6">Capacity</h2>

          {/* Tabs */}
          <div className="flex border-b border-[#D4A017]/20 mb-6">
            {(['luggage', 'seating'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setCapacityTab(tab)}
                className={`px-1 pb-3 mr-8 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                  capacityTab === tab
                    ? 'border-[#2b353d] text-white'
                    : 'border-transparent text-white hover:text-white'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Note */}
          <p className="text-sm text-white mb-6 max-w-2xl">
            {capacityTab === 'luggage' ? vehicle.luggageNote : vehicle.seatingNote}
          </p>

          {/* Pill selector */}
          <div className="inline-flex bg-[#080808] rounded-full border border-[#D4A017]/15 p-1 mb-8 shadow-sm flex-wrap gap-1">
            {(capacityTab === 'luggage' ? vehicle.luggage : vehicle.seating).map((item, i) => {
              const isActive = capacityTab === 'luggage' ? luggageIdx === i : seatingIdx === i
              return (
                <button
                  key={i}
                  onClick={() => capacityTab === 'luggage' ? setLuggageIdx(i) : setSeatingIdx(i)}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                    isActive
                      ? 'text-white shadow'
                      : 'text-white hover:text-white'
                  }`}
                  style={isActive ? { backgroundColor: '#2b353d' } : {}}
                >
                  {item.label}
                </button>
              )
            })}
          </div>

          {/* Capacity image */}
          <div className="rounded-2xl overflow-hidden">
            <img
              key={activeImg}
              src={activeImg}
              alt="capacity"
              className="w-full object-cover max-h-80"
            />
          </div>
        </div>

        <div className="border-t border-[#D4A017]/20/50" />

        {/* Book CTA */}
        <div className="max-w-4xl mx-auto px-6 py-14 text-center">
          <Link
            href="/#booking"
            className="inline-block text-white font-bold px-12 py-4 rounded-xl transition-colors text-sm"
            style={{ backgroundColor: vehicle.color }}
          >
            Book {vehicle.name} →
          </Link>
        </div>

      </div>
    </>
  )
}
