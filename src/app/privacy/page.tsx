import BackButton from '@/app/cancellation-policy/BackButton'
import { brand } from '@/config/brand'

export const metadata = { title: `Privacy Policy — ${brand.company.displayName}` }

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#080808]">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <BackButton />
        <div className="mb-10">
          <p className="text-xs font-bold tracking-widest text-white uppercase mb-2">{brand.company.displayName}</p>
          <h1 className="text-3xl font-black text-white mb-3">Privacy Policy</h1>
          <p className="text-white text-sm">Last updated: June 5, 2026</p>
        </div>

        <div className="space-y-8 text-white text-sm leading-relaxed">
          <section>
            <h2 className="font-bold text-white text-base mb-3">1. Information We Collect</h2>
            <p>We collect information you provide when making a reservation, including your name, email address, phone number, and pickup/dropoff locations. We also collect payment information processed securely through Stripe.</p>
          </section>

          <section>
            <h2 className="font-bold text-white text-base mb-3">2. How We Use Your Information</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>To process and manage your reservations</li>
              <li>To send booking confirmations, driver assignments, and trip updates via email and SMS</li>
              <li>To contact you regarding your booking</li>
              <li>To improve our services</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-white text-base mb-3">3. SMS Communications</h2>
            <p>By providing your phone number during the booking process, you consent to receive transactional SMS notifications related to your booking, including confirmations, driver assignments, and trip status updates. Message and data rates may apply. You can opt out at any time by replying STOP.</p>
          </section>

          <section>
            <h2 className="font-bold text-white text-base mb-3">4. Information Sharing</h2>
            <p>We do not sell, trade, or share your personal information with third parties for marketing purposes. We share information only with service providers necessary to fulfill your reservation (e.g., assigned driver, payment processor).</p>
          </section>

          <section>
            <h2 className="font-bold text-white text-base mb-3">5. Data Security</h2>
            <p>We use industry-standard security measures to protect your personal information. Payment data is processed by Stripe and never stored on our servers.</p>
          </section>

          <section>
            <h2 className="font-bold text-white text-base mb-3">6. Contact</h2>
            <p>For privacy-related questions, contact us at <a href={`mailto:${brand.contact.emailInfo}`} className="text-white font-semibold hover:underline">{brand.contact.emailInfo}</a>.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
