'use client'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { UserCheck, Clock, XCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

function ConfirmationInner() {
  const params = useSearchParams()
  const status = params.get('redirect_status')
  const paymentIntent = params.get('payment_intent')
  const bookingNumberParam = params.get('booking_number')
  const success = status === 'succeeded'
  const [bookingNumber, setBookingNumber] = useState<string | null>(bookingNumberParam)
  const [serviceType, setServiceType] = useState<string | null>(null)

  useEffect(() => {
    if (!success) return
    if (paymentIntent) {
      fetch(`/api/bookings/by-payment-intent?pi=${paymentIntent}`)
        .then(r => r.json())
        .then(d => {
          if (d.booking_number) setBookingNumber(d.booking_number)
          if (d.service_type) setServiceType(d.service_type)
        })
        .catch(() => {})
    }
  }, [success, paymentIntent])

  const waitMins = serviceType === 'airport' ? 60 : 30

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center px-4 py-20">
        <div className="max-w-lg w-full">

          {success ? (
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-[#141414] flex items-center justify-center mx-auto mb-8">
                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <p className="text-white text-xs font-semibold uppercase tracking-widest mb-3">Reservation confirmed</p>
              <h1 className="text-4xl font-black text-white mb-4 tracking-tight">You&apos;re all set.</h1>

              {bookingNumber && (
                <div className="bg-[#0e0e0e] border border-[#D4A017]/15 rounded-2xl px-6 py-4 mb-6 inline-block">
                  <p className="text-white text-xs uppercase tracking-widest mb-1">Booking Number</p>
                  <p className="text-2xl font-black text-white tracking-wider">{bookingNumber}</p>
                  <p className="text-white text-xs mt-1">Save this to manage your reservation</p>
                </div>
              )}

              <p className="text-white text-base leading-relaxed mb-10">
                Your booking is confirmed. A confirmation email is on its way.<br />
                Your chauffeur will reach out 24 hours before pickup.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
                {([
                  { Icon: UserCheck, label: 'Meet & greet', sub: 'at your door' },
                  { Icon: Clock, label: `${waitMins} min`, sub: 'free wait time' },
                  { Icon: XCircle, label: 'Free cancel', sub: 'up to 24hrs before' },
                ] as { Icon: LucideIcon; label: string; sub: string }[]).map(item => (
                  <div key={item.label} className="bg-[#0e0e0e] border border-[#D4A017]/10 rounded-2xl px-3 py-4">
                    <item.Icon className="w-6 h-6 text-white mb-2" strokeWidth={1.5} />
                    <p className="text-white/90 text-xs font-semibold">{item.label}</p>
                    <p className="text-white text-xs">{item.sub}</p>
                  </div>
                ))}
              </div>

              <p className="text-xs text-white mb-6">
                Full refund if cancelled 24+ hours before · 50% refund 2–24 hours before ·{' '}
                <Link href="/cancellation-policy" className="underline">View policy</Link>
              </p>

              <div className="flex gap-3 justify-center">
                <Link
                  href="/"
                  className="inline-block bg-[#141414] hover:bg-[#1e262d] text-white font-bold px-10 py-3.5 rounded-xl transition-colors text-sm"
                >
                  Back to Home
                </Link>
                {bookingNumber && (
                  <Link
                    href={`/manage?booking=${bookingNumber}`}
                    className="inline-block border-2 border-[#D4A017]/15 text-white font-semibold px-8 py-3.5 rounded-xl hover:border-[#D4A017]/20 transition-colors text-sm"
                  >
                    Manage Booking
                  </Link>
                )}
              </div>
            </div>

          ) : (
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-8">
                <svg className="w-9 h-9 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-3xl font-black text-white mb-3">Payment failed</h1>
              <p className="text-white mb-8">Something went wrong. Please try again.</p>
              <div className="flex gap-3 justify-center">
                <Link href="/book" className="bg-white text-[#080808] font-bold px-8 py-3 rounded-xl hover:bg-white/90 transition-colors text-sm">
                  Try Again
                </Link>
                <Link href="/" className="border-2 border-[#D4A017]/15 text-white font-semibold px-8 py-3 rounded-xl hover:border-[#D4A017]/20 transition-colors text-sm">
                  Home
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}

export default function ConfirmationPage() {
  return (
    <Suspense>
      <ConfirmationInner />
    </Suspense>
  )
}
