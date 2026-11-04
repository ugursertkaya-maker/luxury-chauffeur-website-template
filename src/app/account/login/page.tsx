'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { brand } from '@/config/brand'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await fetch('/api/account/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) return setError(data.error)
    router.push('/account')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/"><Image src="/logo.svg" alt={`${brand.company.displayName}`} width={130} height={53} className="mx-auto mb-6" /></Link>
          <h1 className="text-2xl font-black text-slate-900">Sign In</h1>
          <p className="text-white text-sm mt-1">Access your bookings and account</p>
        </div>
        <form onSubmit={submit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5">Email</label>
            <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="your@email.com"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b353d]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5">Password</label>
            <input type="password" required value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b353d]" />
          </div>
          {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-[#2b353d] hover:bg-[#1e262d] disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-sm transition-colors">
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>
        <p className="text-center text-sm text-white mt-4">
          No account?{' '}
          <Link href="/account/register" className="text-[#2b353d] font-semibold hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  )
}
