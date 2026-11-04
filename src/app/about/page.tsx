import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import JsonLd from '@/components/seo/JsonLd'
import { localBusinessSchema } from '@/lib/seo/jsonld'
import { UserCheck, Clock, Car, CreditCard, Shield, Smartphone } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { brand } from '@/config/brand'

export const metadata: Metadata = {
  title: `About ${brand.company.displayName} | ${brand.address.locality} Premier Car Service`,
  description: `${brand.company.displayName} — chauffeured car service in ${brand.address.locality}. Professional chauffeurs, luxury fleet, 24/7 availability. Serving ${brand.service.areaServed}.`,
  alternates: { canonical: `${brand.site.url}/about` },
}

/**
 * Headline stats shown under the hero.
 *
 * TODO: replace with figures that are true and verifiable for your business.
 * Do not advertise a rating, an insurance status or a licence you cannot
 * substantiate — leave the array empty to hide the band entirely.
 */
const stats: { value: string; label: string }[] = [
  { value: '24/7', label: 'Availability' },
  { value: brand.address.region, label: 'Service Area' },
]

const values: { Icon: LucideIcon; title: string; desc: string }[] = [
  { Icon: UserCheck, title: 'Professionalism', desc: 'Every chauffeur is background-checked, professionally dressed, and trained to the highest hospitality standards.' },
  { Icon: Clock, title: 'Punctuality', desc: 'We monitor your flight in real time. Delays are accounted for automatically — you will never wait for us.' },
  { Icon: Car, title: 'Premium Fleet', desc: 'Late-model luxury SUVs and executive sedans, maintained to the highest standards of cleanliness and comfort.' },
  { Icon: CreditCard, title: 'Transparent Pricing', desc: 'Flat-rate, all-inclusive quotes. No surge pricing, no hidden fees. What you see is what you pay.' },
  { Icon: Shield, title: 'Fully Insured', desc: 'Describe your own commercial insurance and operating licences here. Only state what you actually hold.' },
  { Icon: Smartphone, title: 'Seamless Booking', desc: 'Book in 2 minutes online, 24/7. Instant confirmation, easy modifications, hassle-free management.' },
]

export default function AboutPage() {
  return (
    <>
      <JsonLd data={localBusinessSchema()} />
      <Navbar />

      <div className="min-h-screen bg-[#0e0e0e]">
        {/* Hero */}
        <div className="bg-gradient-to-b from-[#0a0a0a] via-[#0e0e0e] to-[#080808] px-6 py-20 text-center">
          <div className="max-w-3xl mx-auto">
            <p className="text-[#8fa4b4] text-xs font-bold tracking-widest uppercase mb-4">About Us</p>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">
              {brand.address.locality}&apos;s Premier<br />Chauffeured Car Service
            </h1>
            <p className="text-white text-lg max-w-xl mx-auto">
              Professional, punctual, and impeccably presented — {brand.company.displayName} sets the standard for chauffeured transportation across {brand.service.areaServed}.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-[#080808] border-b border-[#D4A017]/10">
          <div className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map(s => (
              <div key={s.label}>
                <p className="text-3xl font-black text-white">{s.value}</p>
                <p className="text-xs text-white mt-1 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-16">
          {/* Story */}
          <section className="mb-16">
            <h2 className="text-3xl font-extrabold text-white mb-6">Our Story</h2>
            <div className="space-y-4 text-base leading-relaxed text-white">
              {/* TODO: replace this placeholder copy with your own story. */}
              <p>{brand.company.displayName} was founded with a simple mission: to provide {brand.service.areaServed} with chauffeured transportation that genuinely lives up to the word &ldquo;luxury.&rdquo; Not just a nice car &mdash; but a complete experience characterised by professionalism, reliability, and attention to every detail.</p>
              <p>We serve business travellers who need to arrive sharp and on time, families navigating an unfamiliar airport, wedding parties who deserve a flawless arrival, and everyone in between. Describe your own service area and the customers you look after here.</p>
              <p>Every vehicle in our fleet is late-model, maintained to the highest standards of cleanliness, and equipped with amenities that make the journey as important as the destination: premium leather, climate control, iOS and Android charging, complimentary water, and a chauffeur focused entirely on your comfort and safety.</p>
            </div>
          </section>

          {/* Values */}
          <section className="mb-16">
            <h2 className="text-3xl font-extrabold text-white mb-8">What Sets Us Apart</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {values.map(v => (
                <div key={v.title} className="bg-[#0e0e0e] border border-[#D4A017]/10 rounded-2xl p-6">
                  <v.Icon className="w-7 h-7 text-white mb-3" strokeWidth={1.5} />
                  <h3 className="font-bold text-white mb-2">{v.title}</h3>
                  <p className="text-sm text-white leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Fleet */}
          <section className="mb-16">
            <h2 className="text-3xl font-extrabold text-white mb-6">Our Fleet</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#0e0e0e] border border-[#D4A017]/10 rounded-2xl p-6">
                <h3 className="font-bold text-white mb-2">Premium SUV</h3>
                <p className="text-sm text-white mb-3">Your SUV make and model · Up to 6 passengers · 6 large bags</p>
                <ul className="text-xs text-white space-y-1">
                  {['Premium leather seating', 'Panoramic sunroof', 'Dual-zone climate control', 'Multiple charging ports', 'Complimentary water & amenities'].map(f => (
                    <li key={f} className="flex items-center gap-2"><span className="text-white">✓</span>{f}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-[#0e0e0e] border border-[#D4A017]/10 rounded-2xl p-6">
                <h3 className="font-bold text-white mb-2">Executive Sedan</h3>
                <p className="text-sm text-white mb-3">Your sedan make and model · Up to 3 passengers · 3 bags</p>
                <ul className="text-xs text-white space-y-1">
                  {['Executive leather interior', 'Ambient lighting', 'Quiet cabin for calls', 'Multiple charging ports', 'Complimentary water & amenities'].map(f => (
                    <li key={f} className="flex items-center gap-2"><span className="text-white">✓</span>{f}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="bg-[#141414] rounded-2xl p-10 text-center">
            <h2 className="text-2xl font-black text-white mb-3">Ready to Experience the Difference?</h2>
            <p className="text-white text-sm mb-6">Book your luxury transfer in minutes — instant confirmation, no hidden fees.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/book" className="bg-white text-[#080808] font-bold px-8 py-3.5 rounded-xl hover:bg-white/90 transition-colors text-sm">
                Book Now →
              </Link>
              <Link href="/contact" className="border border-white/30 text-white font-semibold px-6 py-3.5 rounded-xl hover:bg-[#080808]/10 transition-colors text-sm">
                Contact Us
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
