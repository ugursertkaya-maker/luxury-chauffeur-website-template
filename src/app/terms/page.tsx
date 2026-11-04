import BackButton from '@/app/cancellation-policy/BackButton'
import { brand } from '@/config/brand'

export const metadata = { title: `Terms & Conditions — ${brand.company.displayName}` }

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#080808]">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <BackButton />
        <div className="mb-10">
          <p className="text-xs font-bold tracking-widest text-white uppercase mb-2">{brand.company.displayName}</p>
          <h1 className="text-3xl font-black text-white mb-3">Terms & Conditions</h1>
          <p className="text-white text-sm">Last updated: June 5, 2026</p>
        </div>

        <div className="space-y-8 text-white text-sm leading-relaxed">
          <section>
            <h2 className="font-bold text-white text-base mb-3">1. Service Description</h2>
            <p>{brand.company.displayName} (operated by {brand.company.legalName}) provides premium limousine and black car transportation services across {brand.service.areaServed}. Bookings are made through {brand.site.domain}.</p>
          </section>

          <section>
            <h2 className="font-bold text-white text-base mb-3">2. Reservations & Payment</h2>
            <p>All reservations require full payment at the time of booking. Prices are displayed prior to checkout and include all fees. Payment is processed securely via Stripe.</p>
          </section>

          <section>
            <h2 className="font-bold text-white text-base mb-3">3. Cancellation Policy</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li><strong>24+ hours before pickup:</strong> Full refund</li>
              <li><strong>2–24 hours before pickup:</strong> 50% refund</li>
              <li><strong>Less than 2 hours before pickup:</strong> No refund</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-white text-base mb-3">4. SMS Notifications</h2>
            <p>By providing your phone number, you agree to receive transactional SMS messages related to your booking. Program: {brand.company.displayName} booking notifications. Message frequency varies per booking. Message &amp; data rates may apply.</p>
            <p className="mt-2">To opt out, reply <strong>STOP</strong> to any message. For help, reply <strong>HELP</strong> or contact {brand.contact.emailInfo}.</p>
          </section>

          <section>
            <h2 className="font-bold text-white text-base mb-3">5. Liability</h2>
            <p>{brand.company.legalName} is not liable for delays caused by traffic, weather, or circumstances beyond our control. We reserve the right to substitute vehicles of equal or greater value.</p>
          </section>

          <section>
            <h2 className="font-bold text-white text-base mb-3">6. Contact</h2>
            <p>Questions? Email us at <a href={`mailto:${brand.contact.emailInfo}`} className="text-white font-semibold hover:underline">{brand.contact.emailInfo}</a></p>
          </section>
        </div>
      </div>
    </div>
  )
}
