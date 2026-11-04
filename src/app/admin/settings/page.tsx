'use client'
import { useState } from 'react'

const EMAIL_TYPES = [
  { value: 'confirmation', label: 'Booking Confirmation' },
  { value: 'modification_received', label: 'Modification Received' },
  { value: 'modification_approved', label: 'Modification Approved' },
  { value: 'cancellation', label: 'Cancellation' },
  { value: 'driver_assigned', label: 'Driver Assigned' },
]

export default function SettingsPage() {
  const [email, setEmail] = useState('')
  const [type, setType] = useState('confirmation')
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function send() {
    if (!email.trim()) return
    setStatus('sending')
    setMessage('')
    const res = await fetch('/api/admin/test-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, email: email.trim() }),
    })
    const data = await res.json()
    if (res.ok) {
      setStatus('ok')
      setMessage(`Test email sent to ${email}`)
    } else {
      setStatus('error')
      setMessage(data.error ?? 'Unknown error')
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-black text-slate-900 mb-8">Settings</h1>

      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h2 className="font-bold text-slate-900 mb-1">Email Templates Test</h2>
        <p className="text-sm text-white mb-5">Send a test email with mock booking data to verify all templates are working.</p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5">Template</label>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b353d]"
            >
              {EMAIL_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5">Send To</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b353d]"
            />
          </div>

          <button
            onClick={send}
            disabled={status === 'sending' || !email.trim()}
            className="w-full bg-[#2b353d] hover:bg-[#1e262d] disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-colors"
          >
            {status === 'sending' ? 'Sending...' : 'Send Test Email'}
          </button>

          {status === 'ok' && (
            <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-xl px-4 py-3">{message}</p>
          )}
          {status === 'error' && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">Error: {message}</p>
          )}
        </div>
      </div>
    </div>
  )
}
