import Link from 'next/link'
import BreadcrumbNav from './BreadcrumbNav'
import SeoAnswerBlock from './SeoAnswerBlock'
import InternalLinks from './InternalLinks'
import type { FaqItem } from '@/lib/seo/types'
import { Plane, Clock, UserCheck, CreditCard, Car, Smartphone, MapPin, Navigation, CheckCircle, Phone } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { brand } from '@/config/brand'

type Crumb = { name: string; url: string }
type LinkRef = { slug: string; name: string; url: string }
type RelatedLinks = {
  airports?: LinkRef[]; locations?: LinkRef[]; routes?: LinkRef[]
  services?: LinkRef[]; attractions?: LinkRef[]; hotels?: LinkRef[]
  cruisePorts?: LinkRef[]; destinations?: LinkRef[]
}

type Props = {
  crumbs: Crumb[]
  h1: string
  badge?: string
  intro_html?: string
  body_html?: string
  faq_items?: FaqItem[]
  related?: RelatedLinks
  meta?: { distance?: string; duration?: string; price_from?: number; iata?: string; stars?: number; city?: string }
  cta?: { label: string; href: string }
}

const WHY_CHOOSE: { Icon: LucideIcon; title: string; desc: string }[] = [
  { Icon: Plane, title: 'Flight Tracking', desc: 'We monitor your flight in real time. Delays never cost you extra.' },
  { Icon: Clock, title: '60 Min Free Wait', desc: 'Complimentary wait time on every airport transfer — no rush.' },
  { Icon: UserCheck, title: 'Meet & Greet', desc: 'Your chauffeur meets you at arrivals holding your name sign.' },
  { Icon: CreditCard, title: 'Fixed Pricing', desc: 'All-inclusive rates. No surge pricing, no hidden fees, ever.' },
  { Icon: Car, title: 'Luxury Fleet', desc: 'Describe your own fleet here — pristine, late-model vehicles.' },
  { Icon: Smartphone, title: 'Easy Booking', desc: 'Book online in 2 minutes. Instant confirmation, 24/7.' },
]

/**
 * Reviews shown on every SEO landing page, from src/config/brand.ts.
 *
 * Empty by default, which hides the reviews band. Add only real reviews you
 * have permission to publish — see the note in src/config/brand.ts.
 */
const TESTIMONIALS = brand.testimonials.map(t => ({ name: t.name, text: t.text, stars: 5 }))

export default function SeoPageTemplate({ crumbs, h1, badge, intro_html, body_html, faq_items, related, meta, cta }: Props) {
  return (
    <div className="min-h-screen bg-[#0e0e0e]">
      {/* Hero */}
      <div className="bg-gradient-to-b from-[#0a0a0a] via-[#0e0e0e] to-[#080808] px-6 py-16 text-center">
        <div className="max-w-3xl mx-auto">
          {badge && (
            <span className="inline-block px-3 py-1 rounded-full bg-[#080808]/10 text-white text-xs font-semibold tracking-widest uppercase mb-4">
              {badge}
            </span>
          )}
          <h1 className="text-3xl md:text-4xl font-black text-white leading-tight mb-4">{h1}</h1>
          {meta && (
            <div className="flex flex-wrap justify-center gap-4 text-sm text-[#8fa4b4] mb-6">
              {meta.iata && <span className="flex items-center gap-1"><Plane className="w-3 h-3" strokeWidth={1.5} />{meta.iata}</span>}
              {meta.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" strokeWidth={1.5} />{meta.city}, {brand.address.region}</span>}
              {meta.distance && <span className="flex items-center gap-1"><Navigation className="w-3 h-3" strokeWidth={1.5} />{meta.distance}</span>}
              {meta.duration && <span className="flex items-center gap-1"><Clock className="w-3 h-3" strokeWidth={1.5} />{meta.duration}</span>}
              {meta.stars && <span>{'★'.repeat(meta.stars)} Hotel</span>}
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={cta?.href ?? '/book'}
              className="inline-block bg-[#080808] text-white font-bold px-8 py-3.5 rounded-xl hover:bg-[#141414] transition-colors text-sm"
            >
              {cta?.label ?? 'Book Your Ride →'}
            </Link>
            <a
              href={`tel:${brand.contact.phoneE164}`}
              className="inline-block bg-[#080808]/10 text-white font-semibold px-6 py-3.5 rounded-xl hover:bg-[#080808]/20 transition-colors text-sm"
            >
              <Phone className="w-4 h-4 inline mr-1" strokeWidth={1.5} />Call Now
            </a>
          </div>
        </div>
      </div>

      {/* Trust bar */}
      <div className="bg-[#080808] border-b border-[#D4A017]/10 py-3">
        <div className="max-w-4xl mx-auto px-6 flex flex-wrap justify-center gap-6 text-xs text-white">
          {['60-Min Free Wait Time', 'Real-Time Flight Tracking', 'Fixed All-Inclusive Pricing', '24/7 Service', 'Licensed & Insured'].map(t => (
            <span key={t} className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-400" strokeWidth={2} />{t}</span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-10">
        <BreadcrumbNav crumbs={crumbs} />

        {intro_html && (
          <div
            className="space-y-4 text-base leading-relaxed text-white mb-8"
            dangerouslySetInnerHTML={{ __html: intro_html }}
          />
        )}

        {/* Why Choose us */}
        <section className="my-10">
          <h2 className="text-2xl font-bold text-white mb-6">Why Choose {brand.company.displayName}?</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {WHY_CHOOSE.map(item => (
              <div key={item.title} className="bg-[#080808] rounded-xl border border-[#D4A017]/10 p-4">
                <item.Icon className="w-6 h-6 text-white mb-2" strokeWidth={1.5} />
                <p className="font-semibold text-white/90 text-sm mb-1">{item.title}</p>
                <p className="text-xs text-white leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {body_html && (
          <div
            className="space-y-4 text-base leading-relaxed text-white my-8"
            dangerouslySetInnerHTML={{ __html: body_html }}
          />
        )}

        {related && <InternalLinks related={related} />}

        {/* Testimonials — hidden until real reviews are added to brand config. */}
        {TESTIMONIALS.length > 0 && (
        <section className="my-10">
          <h2 className="text-2xl font-bold text-white mb-6">What Our Clients Say</h2>
          <div className="space-y-4">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-[#080808] rounded-xl border border-[#D4A017]/10 p-5">
                <div className="text-white text-sm mb-2">{'★'.repeat(t.stars)}</div>
                <p className="text-white/80 text-sm leading-relaxed italic mb-3">&ldquo;{t.text}&rdquo;</p>
                <p className="text-xs font-semibold text-white">— {t.name}</p>
              </div>
            ))}
          </div>
        </section>
        )}

        {faq_items?.length ? <SeoAnswerBlock items={faq_items} /> : null}

        {/* Bottom CTA */}
        <section className="my-10 bg-[#141414] rounded-2xl p-8 text-center">
          <p className="text-xs font-bold tracking-widest text-[#8fa4b4] uppercase mb-2">Ready to Ride?</p>
          <h2 className="text-2xl font-black text-white mb-3">Book Your Luxury Transfer Today</h2>
          <p className="text-white text-sm mb-6">Fixed pricing · Instant confirmation · 24/7 availability</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={cta?.href ?? '/book'}
              className="inline-block bg-[#080808] text-white font-bold px-8 py-3.5 rounded-xl hover:bg-[#141414] transition-colors text-sm"
            >
              {cta?.label ?? 'Book Online Now →'}
            </Link>
            <a
              href={`tel:${brand.contact.phoneE164}`}
              className="inline-block border border-white/30 text-white font-semibold px-6 py-3.5 rounded-xl hover:bg-[#080808]/10 transition-colors text-sm"
            >
              <Phone className="w-4 h-4 inline mr-1" strokeWidth={1.5} />{brand.contact.phone}
            </a>
          </div>
        </section>
      </div>
    </div>
  )
}
