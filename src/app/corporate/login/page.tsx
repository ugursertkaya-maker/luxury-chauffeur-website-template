'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { brand } from '@/config/brand'

export default function CorporateLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const r = await fetch('/api/corporate/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', email, password }),
    })
    const d = await r.json()
    setLoading(false)
    if (!r.ok) { setError(d.error ?? 'Login failed'); return }
    router.push('/corporate/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#0a1017] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Image src="/logo.png" alt={`${brand.company.displayName}`} width={160} height={40} className="mx-auto invert mb-6" />
          <h1 className="text-white text-xl font-semibold">Corporate Portal</h1>
          <p className="text-white text-sm mt-1">Sign in to manage your account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b353d]"
              placeholder="your@company.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b353d]"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2b353d] text-white font-semibold py-2.5 rounded-xl hover:bg-[#1a2530] transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-white text-xs mt-6">
          Need access? Contact{' '}
          <a href={`mailto:${brand.contact.emailInfo}`} className="text-white hover:underline">
            {brand.contact.emailInfo}
          </a>
        </p>
      </div>
    </div>
  )
}
