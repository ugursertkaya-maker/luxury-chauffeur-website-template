import BackButton from './BackButton'
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { brand } from '@/config/brand'

export const metadata = { title: `Cancellation Policy — ${brand.company.displayName}` }

export default function CancellationPolicy() {
  return (
    <div className="min-h-screen bg-[#0e0e0e]">
      <div className="max-w-2xl mx-auto px-6 py-16">

        <BackButton />

        <div className="mb-10">
          <p className="text-xs font-bold tracking-widest text-white uppercase mb-2">{brand.company.displayName}</p>
          <h1 className="text-3xl font-black text-white mb-3">Cancellation Policy</h1>
          <p className="text-white text-base">We understand that plans change. Our policy is designed to be fair to both our clients and our team.</p>
        </div>

        {/* Policy tiers */}
        <div className="space-y-3 mb-10">
          <div className="bg-[#0e0e0e] rounded-2xl border border-[#D4A017]/10 p-6 flex items-start gap-5">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0"><CheckCircle className="w-6 h-6 text-green-600" strokeWidth={1.5} /></div>
            <div>
              <p className="font-bold text-white text-lg">Full Refund</p>
              <p className="text-white font-semibold text-sm mt-0.5">Cancellation 24+ hours before pickup</p>
              <p className="text-white text-sm mt-1">Cancel at least 24 hours before your scheduled pickup and receive a 100% refund. No questions asked.</p>
            </div>
          </div>

          <div className="bg-[#0e0e0e] rounded-2xl border border-[#D4A017]/10 p-6 flex items-start gap-5">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0"><AlertTriangle className="w-6 h-6 text-amber-600" strokeWidth={1.5} /></div>
            <div>
              <p className="font-bold text-white text-lg">50% Refund</p>
              <p className="text-white font-semibold text-sm mt-0.5">Cancellation 2–24 hours before pickup</p>
              <p className="text-white text-sm mt-1">Cancellations made between 2 and 24 hours before pickup will receive a 50% refund. This covers our operational costs for the assigned driver and vehicle.</p>
            </div>
          </div>

          <div className="bg-[#0e0e0e] rounded-2xl border border-[#D4A017]/10 p-6 flex items-start gap-5">
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0"><XCircle className="w-6 h-6 text-red-600" strokeWidth={1.5} /></div>
            <div>
              <p className="font-bold text-white text-lg">No Refund</p>
              <p className="text-white font-semibold text-sm mt-0.5">Cancellation less than 2 hours before pickup</p>
              <p className="text-white text-sm mt-1">Cancellations within 2 hours of your scheduled pickup are non-refundable. Our team has already been deployed for your ride.</p>
            </div>
          </div>
        </div>

        {/* Additional notes */}
        <div className="bg-[#0e0e0e] rounded-2xl border border-[#D4A017]/10 p-6 mb-8">
          <h2 className="font-bold text-white mb-4">Additional Notes</h2>
          <ul className="space-y-3 text-sm text-white">
            <li className="flex gap-3">
              <span className="text-white font-bold flex-shrink-0">·</span>
              Refunds are returned to the original payment method and typically appear within 5–10 business days.
            </li>
            <li className="flex gap-3">
              <span className="text-white font-bold flex-shrink-0">·</span>
              Modifications to your booking (date, time, location) do not count as cancellations and may be made free of charge subject to availability.
            </li>
            <li className="flex gap-3">
              <span className="text-white font-bold flex-shrink-0">·</span>
              In the event of a no-show without prior cancellation, the full fare is charged.
            </li>
            <li className="flex gap-3">
              <span className="text-white font-bold flex-shrink-0">·</span>
              If {brand.company.displayName} cancels your booking for any reason, you will receive a 100% refund regardless of timing.
            </li>
          </ul>
        </div>

        <div className="text-center">
          <p className="text-white text-sm mb-4">Questions about our policy?</p>
          <a href={`mailto:${brand.contact.emailInfo}`} className="inline-block bg-white text-[#080808] font-bold px-6 py-3 rounded-xl text-sm hover:bg-white/90 transition-colors">
            Contact Us
          </a>
        </div>

      </div>
    </div>
  )
}
