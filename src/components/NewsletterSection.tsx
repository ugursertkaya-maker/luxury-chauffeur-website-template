'use client'
import { useState } from 'react'
import { brand } from '@/config/brand'

export default function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')

  async function subscribe(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    const res = await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    })
    setStatus(res.ok ? 'ok' : 'error')
  }

  return (
    <section className="bg-[#080808] border-t border-[#D4A017]/10 py-20 px-6">
      <div className="max-w-xl mx-auto text-center">
        <p className="text-white text-xs font-bold tracking-widest uppercase mb-3">{brand.company.shortName} Insider</p>
        <h2 className="text-3xl font-extrabold text-white mb-3">
          Exclusive Travel Tips & Offers
        </h2>
        <p className="text-white text-sm mb-8 leading-relaxed">
          Monthly guides for {brand.service.areaServed} — plus early access to seasonal deals.
        </p>

        {status === 'ok' ? (
          <div className="border border-[#D4A017]/20 rounded-2xl px-6 py-5">
            <p className="text-white font-semibold">You&apos;re on the list!</p>
            <p className="text-white text-sm mt-1">Welcome — your first guide arrives shortly.</p>
          </div>
        ) : (
          <form onSubmit={subscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              suppressHydrationWarning
              className="flex-1 bg-[#141414] border border-[#D4A017]/20 rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm focus:outline-none focus:border-[#D4A017]/60 transition-colors"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="bg-white text-[#080808] font-bold px-6 py-3 rounded-xl text-sm hover:bg-white/90 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {status === 'loading' ? 'Subscribing...' : 'Subscribe Free'}
            </button>
          </form>
        )}

        {status === 'error' && (
          <p className="text-red-400 text-xs mt-3">Something went wrong. Please try again.</p>
        )}

        <p className="text-white text-xs mt-4">No spam. Unsubscribe anytime.</p>
      </div>
    </section>
  )
}
