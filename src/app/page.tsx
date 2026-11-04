import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import HeroBooking from '@/components/HeroBooking'
import NewsletterSection from '@/components/NewsletterSection'
import { Plane, Briefcase, Clock, Heart, Ship, CalendarDays, UserCheck, Music, Zap, Shield, MapPin, Map, Building2, Star, Compass, FileText } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { brand } from '@/config/brand'

const services: { Icon: LucideIcon; title: string; desc: string; gradient: string; light: boolean }[] = [
  {
    Icon: Plane,
    title: 'Airport Transfers',
    desc: 'Smooth landings, every time. Flight tracking and complimentary wait time included.',
    gradient: 'from-[#1a262e] to-[#2b353d]',
    light: false,
  },
  {
    Icon: Briefcase,
    title: 'Corporate Travel',
    desc: 'Executive transportation for meetings, conferences, and client entertainment.',
    gradient: 'from-[#141414] to-[#eef0f2]',
    light: true,
  },
  {
    Icon: Clock,
    title: 'Hourly Charter',
    desc: `Book by the hour for events, errands, city tours, or a full day of travel across ${brand.service.areaServed}.`,
    gradient: 'from-amber-50 to-orange-50',
    light: true,
  },
  {
    Icon: Heart,
    title: 'Weddings',
    desc: 'Arrive at your special day in elegance. Decorated and ready for your moment.',
    gradient: 'from-rose-50 to-pink-50',
    light: true,
  },
  {
    Icon: Ship,
    title: 'Cruise Port Transfers',
    desc: 'Seamless rides to and from Port of Example City. We handle the timing so you don\'t miss a moment.',
    gradient: 'from-sky-50 to-blue-50',
    light: true,
  },
  {
    Icon: CalendarDays,
    title: 'Night Out & Events',
    desc: 'Concerts, sports games, galas, and more. Arrive in style, leave without the parking hassle.',
    gradient: 'from-violet-50 to-purple-50',
    light: true,
  },
]

const experience: { Icon: LucideIcon; title: string; desc: string }[] = [
  {
    Icon: UserCheck,
    title: 'A welcome like no other',
    desc: 'Your chauffeur meets you at the door, handles your luggage, and ensures you\'re comfortable before departure.',
  },
  {
    Icon: Music,
    title: 'You set the tone',
    desc: 'Temperature, music, conversation — your ride adapts to your preferences. Silence or small talk, your call.',
  },
  {
    Icon: Zap,
    title: 'Recharge your batteries',
    desc: 'iOS and Android chargers, complimentary water, and tissues on board for every ride.',
  },
]

const trust: { Icon: LucideIcon; title: string; desc: string }[] = [
  { Icon: Shield, title: 'Licensed & Insured', desc: `Fully licensed and insured chauffeur service operating across ${brand.address.locality}.` },
  { Icon: Clock, title: '24/7 Available', desc: 'Early morning flights, late night events — we\'re available around the clock.' },
  { Icon: Plane, title: 'Flight Tracking', desc: 'We monitor your flight in real time and adjust for delays automatically.' },
  { Icon: Zap, title: 'Instant Confirmation', desc: 'Secure Stripe payment with instant booking confirmation to your inbox.' },
]

/**
 * Customer reviews, from src/config/brand.ts.
 *
 * Empty by default, which hides the whole Reviews section below. Add only
 * real reviews you have permission to publish.
 */
const testimonials = brand.testimonials

export default function Home() {
  return (
    <>
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section id="booking" className="bg-gradient-to-b from-[#080808] via-[#0a0a0a] to-[#111111] pt-20 pb-24 px-6 text-center">
        <div className="max-w-2xl mx-auto mb-10">
          <p className="text-white text-xs font-semibold uppercase tracking-[4px] mb-5">
            Premier Chauffeur Limousine Service
          </p>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-4 leading-tight tracking-tight">
            Your Chauffeur<br />Awaits
          </h1>
          <p className="text-white text-lg">
            Set your pickup anywhere in {brand.service.areaServed}.<br className="hidden md:block" />
            We&apos;ll be there on time — every time.
          </p>
        </div>
        <div className="max-w-4xl mx-auto">
          <HeroBooking />
        </div>
      </section>

      {/* ── SERVICES ─────────────────────────────────────────────────────── */}
      <section id="services" className="bg-[#080808] py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-xs font-bold tracking-widest text-white uppercase mb-3">What We Offer</p>
          <h2 className="text-center text-4xl font-extrabold text-white tracking-tight mb-14">Premium Chauffeur Services</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map(s => (
              <div key={s.title} className="rounded-2xl overflow-hidden border border-[#D4A017]/10 hover:shadow-lg hover:-translate-y-1 transition-all group">
                <div className={`bg-gradient-to-br ${s.gradient} h-40 flex items-center justify-center`}>
                  <s.Icon className={`w-14 h-14 group-hover:scale-110 transition-transform ${s.light ? 'text-[#2b353d]' : 'text-white'}`} strokeWidth={1.5} />
                </div>
                <div className="p-6 bg-[#080808]">
                  <h3 className="font-bold text-white mb-2">{s.title}</h3>
                  <p className="text-sm text-white leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EXPERIENCE ───────────────────────────────────────────────────── */}
      <section className="bg-[#0e0e0e] py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-bold tracking-widest text-white uppercase mb-4">Every Ride</p>
          <h2 className="text-center text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
            Step in. Breathe out.
          </h2>
          <p className="text-center text-white mb-16 max-w-xl mx-auto">
            From the moment we pick you up, every detail is handled so you don&apos;t have to think about a thing.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {experience.map(e => (
              <div key={e.title} className="text-center">
                <div className="w-16 h-16 bg-[#141414] rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <e.Icon className="w-7 h-7 text-white" strokeWidth={1.5} />
                </div>
                <h3 className="font-bold text-white mb-3">{e.title}</h3>
                <p className="text-sm text-white leading-relaxed">{e.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST ────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-[#080808] to-[#141414] py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-bold tracking-widest text-white uppercase mb-4">Our Standards</p>
          <h2 className="text-center text-4xl font-extrabold text-white tracking-tight mb-16">Expect Excellence</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {trust.map(t => (
              <div key={t.title} className="text-center">
                <div className="w-14 h-14 bg-[#141414] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <t.Icon className="w-6 h-6 text-white" strokeWidth={1.5} />
                </div>
                <h3 className="font-bold text-white mb-2">{t.title}</h3>
                <p className="text-sm text-white leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FLEET ────────────────────────────────────────────────────────── */}
      <section id="fleet" className="bg-[#080808] py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-bold tracking-widest text-white uppercase mb-3">Our Fleet</p>
          <h2 className="text-center text-4xl font-extrabold text-white tracking-tight mb-14">Choose Your Vehicle</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="border border-[#D4A017]/10 rounded-3xl p-8 bg-[#080808] hover:shadow-lg transition-all">
              <div className="rounded-2xl h-48 overflow-hidden mb-6 bg-[#f5f5f5]">
                <img src="/vehicles/placeholder-suv.svg" alt="Premium SUV" className="w-full h-full object-cover" />
              </div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-xl font-extrabold text-white">Premium SUV</h3>
                  <p className="text-white font-semibold text-sm">Luxury Sport Utility</p>
                </div>
                <span className="bg-[#141414] text-white text-xs font-bold px-3 py-1 rounded-full">2 available</span>
              </div>
              <ul className="space-y-2 mb-6">
                {['Up to 5 passengers', '5 large bags', 'Premium leather interior', 'Panoramic sunroof', 'Climate control'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#475665] flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link href="/vehicles/suv" className="block text-center bg-[#141414] hover:bg-[#1e262d] text-white font-bold py-3 rounded-xl transition-colors">
                View Details →
              </Link>
            </div>

            <div className="border border-[#D4A017]/10 rounded-3xl p-8 bg-[#080808] hover:shadow-lg transition-all">
              <div className="rounded-2xl h-48 overflow-hidden mb-6 bg-[#f5f5f5]">
                <img src="/vehicles/placeholder-sedan.svg" alt="Executive Sedan" className="w-full h-full object-cover" />
              </div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-xl font-extrabold text-white">Premium Sedan</h3>
                  <p className="text-white font-semibold text-sm">Executive Sedan</p>
                </div>
                <span className="bg-[#141414] text-white text-xs font-bold px-3 py-1 rounded-full">1 available</span>
              </div>
              <ul className="space-y-2 mb-6">
                {['Up to 3 passengers', '2 carry-on bags', 'Executive leather seats', 'Ambient lighting', 'Quiet cabin'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#475665] flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link href="/vehicles/sedan" className="block text-center bg-[#475665] hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-colors">
                View Details →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
      {testimonials.length > 0 && (
      <section className="bg-[#0e0e0e] py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-bold tracking-widest text-white uppercase mb-3">Reviews</p>
          <h2 className="text-center text-4xl font-extrabold text-white tracking-tight mb-4">What Our Clients Say</h2>

          {/* Google rating badge — only shown once a real rating is configured. */}
          {brand.aggregateRating && brand.social.googleReviewUrl && (
          <div className="flex justify-center mb-12">
            <a
              href={brand.social.googleReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-[#080808] border border-[#D4A017]/15 hover:border-[#D4A017]/20 rounded-2xl px-5 py-3 shadow-sm transition-colors group"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white">{brand.aggregateRating.ratingValue}</span>
                <span className="text-sm text-white">on Google · {brand.aggregateRating.ratingCount} reviews</span>
              </div>
              <span className="text-xs text-white group-hover:text-white transition-colors">Leave a review →</span>
            </a>
          </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map(t => (
              <div key={t.name} className="bg-[#080808] border border-[#D4A017]/10 rounded-2xl p-7">
                <div className="text-white text-sm mb-3">★★★★★</div>
                <p className="text-white text-sm leading-relaxed mb-6">&quot;{t.text}&quot;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#080808] to-[#141414] flex items-center justify-center text-white text-xs font-bold">
                    {t.name.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{t.name}</div>
                    <div className="text-xs text-white">{t.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ── EXPLORE ──────────────────────────────────────────────────────── */}
      <section className="bg-[#080808] py-20 px-6 border-t border-[#D4A017]/10">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-bold tracking-widest text-white uppercase mb-3">Explore</p>
          <h2 className="text-center text-3xl font-extrabold text-white tracking-tight mb-10">Everything {brand.company.shortName}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {([
              { Icon: MapPin, label: 'Service Areas', sub: '53 cities', href: '/locations' },
              { Icon: Plane, label: 'Airports', sub: `8 ${brand.service.areaServed} airports`, href: '/airports' },
              { Icon: Map, label: 'Routes', sub: '56 flat-rate routes', href: '/routes' },
              { Icon: Building2, label: 'Hotels', sub: '20 premier hotels', href: '/hotels' },
              { Icon: Star, label: 'Attractions', sub: 'Theme parks & more', href: '/attractions' },
              { Icon: Compass, label: 'Destinations', sub: `20 ${brand.service.areaServed} gems`, href: '/destinations' },
              { Icon: Ship, label: 'Cruise Ports', sub: 'Port of Example City', href: '/cruise-ports' },
              { Icon: FileText, label: 'Travel Blog', sub: '100 articles', href: '/blog' },
            ] as { Icon: LucideIcon; label: string; sub: string; href: string }[]).map(item => (
              <Link key={item.href} href={item.href}
                className="flex flex-col items-center text-center bg-[#0e0e0e] hover:bg-white/10 group rounded-2xl p-5 transition-all hover:-translate-y-1 hover:shadow-md">
                <item.Icon className="w-7 h-7 text-white mb-2" strokeWidth={1.5} />
                <span className="text-sm font-bold text-white group-hover:text-white">{item.label}</span>
                <span className="text-xs text-white group-hover:text-white mt-0.5">{item.sub}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER ───────────────────────────────────────────────────── */}
      <NewsletterSection />

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="bg-[#080808]">
        {/* CTA Band */}
        <div className="border-b border-white/5">
          <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-white font-bold text-lg">Ready to ride in style?</p>
              <p className="text-white text-sm mt-0.5">Available 24/7 · Instant confirmation · Free cancellation</p>
            </div>
            <Link href="/#booking"
              className="flex-shrink-0 bg-white text-[#080808] font-bold text-sm px-8 py-3.5 rounded-xl hover:bg-white/90 transition-colors">
              Book Now →
            </Link>
          </div>
        </div>

        {/* Main footer */}
        <div className="max-w-6xl mx-auto px-6 pt-16 pb-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">

            {/* Brand — full width on mobile */}
            <div className="col-span-2 md:col-span-1">
              <Image src="/logo.svg" alt={`${brand.company.displayName}`} width={120} height={49} className="" />
              <p className="text-sm text-white leading-relaxed mb-6">
                Premier chauffeured car service across {brand.service.areaServed}.
              </p>
              <div className="space-y-2.5">
                <a href={`tel:${brand.contact.phoneE164}`} className="flex items-center gap-2.5 text-sm text-white hover:text-white transition-colors group">
                  <span className="w-8 h-8 rounded-lg bg-[#080808]/5 flex items-center justify-center group-hover:bg-[#080808]/10 transition-colors">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/></svg>
                  </span>
                  {brand.contact.phone}
                </a>
                <a href={`mailto:${brand.contact.emailInfo}`} className="flex items-center gap-2.5 text-sm text-white hover:text-white transition-colors group">
                  <span className="w-8 h-8 rounded-lg bg-[#080808]/5 flex items-center justify-center group-hover:bg-[#080808]/10 transition-colors">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/></svg>
                  </span>
                  {brand.contact.emailInfo}
                </a>
              </div>
            </div>

            {/* Services */}
            <div>
              <p className="text-[11px] font-bold tracking-widest text-white uppercase mb-5">Services</p>
              <ul className="space-y-3">
                {[
                  ['Airport Transfers', '/services/airport-transfers'],
                  ['Corporate Travel', '/services/corporate-travel'],
                  ['Weddings', '/services/wedding-transportation'],
                  ['Hourly Charter', '/services/hourly-charter'],
                  ['Cruise Ports', '/cruise-ports'],
                  ['All Services', '/services'],
                ].map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-sm text-white hover:text-white transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Destinations */}
            <div>
              <p className="text-[11px] font-bold tracking-widest text-white uppercase mb-5">Destinations</p>
              <ul className="space-y-3">
                {[
                  ['Example City', '/locations/example-city'],
                  ['Cambridge', '/locations/cambridge'],
                  ['Quincy', '/locations/quincy'],
                  ['Newton', '/locations/newton'],
                  ['Worcester', '/locations/worcester'],
                  ['All Locations', '/locations'],
                ].map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-sm text-white hover:text-white transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <p className="text-[11px] font-bold tracking-widest text-white uppercase mb-5">Company</p>
              <ul className="space-y-3">
                {[
                  ['About Us', '/about'],
                  ['My Account', '/account'],
                  ['Travel Blog', '/blog'],
                  ['Airports', '/airports'],
                  ['Contact', '/contact'],
                ].map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-sm text-white hover:text-white transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white">© 2026 {brand.company.displayName}. All rights reserved. · {brand.service.areaServed}</p>
            <div className="flex items-center gap-5">
              <Link href="/privacy" className="text-xs text-white hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="text-xs text-white hover:text-white transition-colors">Terms & Conditions</Link>
              <Link href="/cancellation-policy" className="text-xs text-white hover:text-white transition-colors">Cancellation Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
