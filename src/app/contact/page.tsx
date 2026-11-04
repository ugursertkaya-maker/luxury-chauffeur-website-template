'use client'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import JsonLd from '@/components/seo/JsonLd'
import { localBusinessSchema } from '@/lib/seo/jsonld'
import { useState } from 'react'
import { Mail, ClipboardList, MapPin, Clock, CheckCircle } from 'lucide-react'
import { brand } from '@/config/brand'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '', to: `${brand.contact.emailInfo}` })
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    const r = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setStatus(r.ok ? 'sent' : 'error')
  }

  return (
    <>
      <JsonLd data={localBusinessSchema()} />
      <Navbar />

      <div className="min-h-screen bg-[#0e0e0e]">
        <div className="bg-gradient-to-b from-[#0a0a0a] via-[#0e0e0e] to-[#080808] px-6 py-20 text-center">
          <div className="max-w-2xl mx-auto">
            <p className="text-[#8fa4b4] text-xs font-bold tracking-widest uppercase mb-4">Get in Touch</p>
            <h1 className="text-4xl font-black text-white mb-4">Contact Us</h1>
            <p className="text-white">We&apos;re available 24/7 for bookings, questions, and special requests.</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Contact info */}
            <div className="space-y-5">
              <h2 className="text-2xl font-extrabold text-white mb-6">Reach Us Directly</h2>

              <a href={`mailto:${brand.contact.emailInfo}`}
                className="flex items-center gap-4 bg-[#141414] border border-[#D4A017]/10 rounded-2xl p-5 hover:shadow-md transition-all group">
                <div className="w-12 h-12 bg-[#141414] rounded-xl flex items-center justify-center flex-shrink-0"><Mail className="w-5 h-5 text-white" strokeWidth={1.5} /></div>
                <div>
                  <p className="text-xs text-white uppercase tracking-wider mb-0.5">General</p>
                  <p className="font-semibold text-white group-hover:text-white">{brand.contact.emailInfo}</p>
                  <p className="text-xs text-white mt-0.5">Response within 1 hour</p>
                </div>
              </a>

              <a href={`mailto:${brand.contact.emailReservations}`}
                className="flex items-center gap-4 bg-[#141414] border border-[#D4A017]/10 rounded-2xl p-5 hover:shadow-md transition-all group">
                <div className="w-12 h-12 bg-[#141414] rounded-xl flex items-center justify-center flex-shrink-0"><ClipboardList className="w-5 h-5 text-white" strokeWidth={1.5} /></div>
                <div>
                  <p className="text-xs text-white uppercase tracking-wider mb-0.5">Reservations</p>
                  <p className="font-semibold text-white group-hover:text-white">{brand.contact.emailReservations}</p>
                  <p className="text-xs text-white mt-0.5">For booking modifications & questions</p>
                </div>
              </a>

              <div className="flex items-center gap-4 bg-[#141414] border border-[#D4A017]/10 rounded-2xl p-5">
                <div className="w-12 h-12 bg-[#141414] rounded-xl flex items-center justify-center flex-shrink-0"><MapPin className="w-5 h-5 text-white" strokeWidth={1.5} /></div>
                <div>
                  <p className="text-xs text-white uppercase tracking-wider mb-0.5">Service Area</p>
                  <p className="font-semibold text-white">{brand.service.areaServed}</p>
                  <p className="text-xs text-white mt-0.5">Serving all of {brand.service.areaServed} statewide</p>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-[#141414] border border-[#D4A017]/10 rounded-2xl p-5">
                <div className="w-12 h-12 bg-[#141414] rounded-xl flex items-center justify-center flex-shrink-0"><Clock className="w-5 h-5 text-white" strokeWidth={1.5} /></div>
                <div>
                  <p className="text-xs text-white uppercase tracking-wider mb-0.5">Availability</p>
                  <p className="font-semibold text-white">24 Hours · 7 Days a Week</p>
                  <p className="text-xs text-white mt-0.5">Always available</p>
                </div>
              </div>

              <div className="bg-[#141414] rounded-2xl p-6 text-center">
                <h3 className="text-lg font-black text-white mb-2">Ready to Book?</h3>
                <p className="text-white text-sm mb-4">Instant confirmation, flat-rate pricing.</p>
                <Link href="/book" className="block bg-white text-[#080808] font-bold px-6 py-3 rounded-xl hover:bg-white/90 transition-colors text-sm">
                  Book a Ride →
                </Link>
              </div>
            </div>

            {/* Contact form */}
            <div className="bg-[#0e0e0e] rounded-2xl border border-[#D4A017]/15 p-8">
              <h2 className="text-2xl font-extrabold text-white mb-6">Send a Message</h2>

              {status === 'sent' ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-14 h-14 text-white mx-auto mb-4" strokeWidth={1.5} />
                  <h3 className="text-xl font-bold text-white mb-2">Message Sent!</h3>
                  <p className="text-white text-sm">We&apos;ll get back to you within 1 hour.</p>
                  <button onClick={() => setStatus('idle')} className="mt-6 text-sm text-white underline">Send another message</button>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-white uppercase tracking-wide block mb-1.5">Name</label>
                      <input
                        type="text"
                        placeholder="Your name"
                        value={form.name}
                        onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                        className="w-full border border-[#D4A017]/15 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2b353d] focus:ring-1 focus:ring-[#2b353d]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-white uppercase tracking-wide block mb-1.5">Email *</label>
                      <input
                        type="email"
                        placeholder="your@email.com"
                        required
                        value={form.email}
                        onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                        className="w-full border border-[#D4A017]/15 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2b353d] focus:ring-1 focus:ring-[#2b353d]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-white uppercase tracking-wide block mb-1.5">Send To</label>
                    <select
                      value={form.to}
                      onChange={e => setForm(p => ({ ...p, to: e.target.value }))}
                      className="w-full border border-[#D4A017]/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#D4A017] focus:ring-1 focus:ring-[#D4A017]/30 bg-[#141414] text-white"
                    >
                      <option value={`${brand.contact.emailInfo}`}>{brand.contact.emailInfo} — General Inquiries</option>
                      <option value={`${brand.contact.emailReservations}`}>{brand.contact.emailReservations} — Reservations</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-white uppercase tracking-wide block mb-1.5">Subject</label>
                    <input
                      type="text"
                      placeholder="How can we help?"
                      value={form.subject}
                      onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                      className="w-full border border-[#D4A017]/15 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2b353d] focus:ring-1 focus:ring-[#2b353d]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-white uppercase tracking-wide block mb-1.5">Message *</label>
                    <textarea
                      rows={5}
                      placeholder="Tell us about your transportation needs..."
                      required
                      value={form.message}
                      onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                      className="w-full border border-[#D4A017]/15 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2b353d] focus:ring-1 focus:ring-[#2b353d] resize-none"
                    />
                  </div>

                  {status === 'error' && (
                    <p className="text-red-500 text-sm">Something went wrong. Please email us directly.</p>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="w-full bg-[#141414] text-white font-bold py-3.5 rounded-xl hover:bg-[#1e262d] disabled:opacity-50 transition-colors"
                  >
                    {status === 'sending' ? 'Sending…' : 'Send Message →'}
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="mt-8 bg-[#0e0e0e] border border-[#D4A017]/15 rounded-2xl p-5 text-sm text-white text-center">
            <strong className="text-white/80">Corporate Accounts:</strong> High-volume or recurring bookings?{' '}
            <a href={`mailto:${brand.contact.emailInfo}`} className="text-white font-semibold">Email us</a>{' '}
            with your company details for custom pricing.
          </div>
        </div>
      </div>
    </>
  )
}
