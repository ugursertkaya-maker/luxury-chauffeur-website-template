'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { CheckCircle, AlertTriangle, XCircle, Lock } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { formatPrice } from '@/lib/pricing'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const TIP_OPTIONS = [
  { label: '10%', value: 0.10 },
  { label: '15%', value: 0.15 },
  { label: '20%', value: 0.20 },
]

function CheckoutForm({ amount, gratuity }: { amount: number; gratuity: number }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [agreed, setAgreed] = useState(false)
  const total = amount + gratuity

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements || !agreed) return
    setLoading(true)
    setError(null)
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/confirmation` },
    })
    if (error) setError(error.message ?? 'Payment failed')
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />

      <div className="bg-[#0e0e0e] rounded-xl p-4 border border-[#D4A017]/10 space-y-2">
        <p className="text-xs font-semibold text-white uppercase tracking-wider">Cancellation Policy</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" strokeWidth={1.5} />
            <span className="text-white/80"><strong>Full refund</strong> — cancel 24+ hours before</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" strokeWidth={1.5} />
            <span className="text-white/80"><strong>50% refund</strong> — cancel 2–24 hours before</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" strokeWidth={1.5} />
            <span className="text-white/80"><strong>No refund</strong> — cancel less than 2 hours before</span>
          </div>
        </div>
        <Link href="/cancellation-policy" target="_blank" className="text-xs text-white underline">Full policy →</Link>
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-[#2b353d] flex-shrink-0" />
        <span className="text-sm text-white">
          I have read and agree to the{' '}
          <Link href="/cancellation-policy" target="_blank" className="text-white font-semibold underline">
            Cancellation Policy
          </Link>
        </span>
      </label>

      {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}
      <button type="submit" disabled={!stripe || loading || !agreed}
        className="w-full bg-[#141414] hover:bg-[#1e262d] disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-colors">
        {loading ? 'Processing...' : `Pay ${formatPrice(total)} →`}
      </button>
      <p className="text-xs text-center text-white flex items-center justify-center gap-1"><Lock className="w-3 h-3" strokeWidth={2} /> Secured by Stripe. Your card details are never stored on our servers.</p>
    </form>
  )
}

function PaymentPageInner() {
  const params = useSearchParams()
  const bookingId = params.get('id')
  const amount = Number(params.get('amount') ?? 0)

  const [tipMode, setTipMode] = useState<'percent' | 'custom' | 'none' | null>(null)
  const [tipPercent, setTipPercent] = useState<number | null>(null)
  const [customTip, setCustomTip] = useState('')
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [step, setStep] = useState<'gratuity' | 'payment'>('gratuity')

  const gratuityAmount = (() => {
    if (tipMode === 'percent' && tipPercent != null) return Math.round(amount * tipPercent * 100) / 100
    if (tipMode === 'custom') { const v = parseFloat(customTip); return isNaN(v) ? 0 : Math.round(v * 100) / 100 }
    return 0
  })()

  const canContinue = tipMode === 'none' || tipMode === 'percent' || (tipMode === 'custom' && parseFloat(customTip) > 0)

  async function handleContinue() {
    if (!bookingId || !canContinue) return
    const total = amount + gratuityAmount
    const res = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, amount: total, gratuity: gratuityAmount }),
    })
    const data = await res.json()
    setClientSecret(data.clientSecret)
    setStep('payment')
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#0e0e0e] py-12 px-4">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Secure Payment</h1>
            <p className="text-white text-sm">Complete your booking · {formatPrice(amount)}</p>
          </div>

          {step === 'gratuity' && (
            <div className="bg-[#0e0e0e] rounded-2xl border border-[#D4A017]/15 p-8 space-y-6">
              {/* Gratuity section */}
              <div>
                <p className="text-base font-bold text-white mb-1">Add gratuity for your chauffeur?</p>
                <p className="text-xs text-white mb-5">100% goes directly to your driver — no deductions, no fees.</p>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  {TIP_OPTIONS.map(opt => (
                    <button
                      key={opt.label}
                      onClick={() => { setTipMode('percent'); setTipPercent(opt.value) }}
                      className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                        tipMode === 'percent' && tipPercent === opt.value
                          ? 'border-[#2b353d] bg-[#141414] text-white'
                          : 'border-[#D4A017]/15 text-white/80 hover:border-[#D4A017]/30'
                      }`}
                    >
                      <span className="block text-lg font-extrabold">{opt.label}</span>
                      <span className="block text-xs font-normal opacity-75 mt-0.5">{formatPrice(Math.round(amount * opt.value * 100) / 100)}</span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => { setTipMode('custom'); setTipPercent(null) }}
                  className={`w-full py-2.5 rounded-xl border-2 font-semibold text-sm transition-all mb-3 ${
                    tipMode === 'custom'
                      ? 'border-[#2b353d] bg-[#141414] text-white'
                      : 'border-[#D4A017]/15 text-white hover:border-[#D4A017]/30'
                  }`}
                >
                  Custom Amount
                </button>

                {tipMode === 'custom' && (
                  <div className="relative mb-3">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white font-bold">$</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="0.00"
                      value={customTip}
                      onChange={e => setCustomTip(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 border-2 border-[#D4A017]/15 rounded-xl text-white/90 font-semibold focus:outline-none focus:border-[#2b353d]"
                      autoFocus
                    />
                  </div>
                )}

                <button
                  onClick={() => { setTipMode('none'); setTipPercent(null); setCustomTip('') }}
                  className={`w-full py-2.5 rounded-xl border text-sm transition-all ${
                    tipMode === 'none'
                      ? 'border-[#D4A017]/20 bg-[#141414] text-white font-semibold'
                      : 'border-[#D4A017]/15 text-white hover:border-[#D4A017]/20'
                  }`}
                >
                  No gratuity
                </button>
              </div>

              {/* Summary */}
              {tipMode != null && (
                <div className="bg-[#0e0e0e] rounded-xl p-4 border border-[#D4A017]/10 divide-y divide-[#D4A017]/15 text-sm">
                  <div className="flex justify-between py-2">
                    <span className="text-white">Ride</span>
                    <span className="font-semibold text-white/90">{formatPrice(amount)}</span>
                  </div>
                  {gratuityAmount > 0 && (
                    <div className="flex justify-between py-2">
                      <span className="text-white">Gratuity</span>
                      <span className="font-semibold text-emerald-600">+{formatPrice(gratuityAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2">
                    <span className="font-bold text-white">Total</span>
                    <span className="font-extrabold text-white">{formatPrice(amount + gratuityAmount)}</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleContinue}
                disabled={!canContinue}
                className="w-full bg-[#141414] hover:bg-[#1e262d] disabled:opacity-40 text-white font-bold py-4 rounded-xl transition-colors"
              >
                Continue to Payment →
              </button>
            </div>
          )}

          {step === 'payment' && (
            <div className="bg-[#0e0e0e] rounded-2xl border border-[#D4A017]/15 p-8 space-y-6">
              {gratuityAmount > 0 && (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-sm">
                  <span className="text-emerald-600 text-lg">🤝</span>
                  <div>
                    <p className="font-semibold text-emerald-800">Gratuity: {formatPrice(gratuityAmount)}</p>
                    <p className="text-xs text-emerald-600">Goes 100% to your chauffeur</p>
                  </div>
                </div>
              )}
              {clientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#2b353d' } } }}>
                  <CheckoutForm amount={amount} gratuity={gratuityAmount} />
                </Elements>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-[#2b353d] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default function PaymentPage() {
  return (
    <Suspense>
      <PaymentPageInner />
    </Suspense>
  )
}
