'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Suspense } from 'react'
import { brand } from '@/config/brand'

function RegisterForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirm: '',
    referral_code: params.get('ref') ?? '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirm) return setError('Passwords do not match')
    setLoading(true); setError('')
    const res = await fetch('/api/account/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name, email: form.email, phone: form.phone,
        password: form.password, referral_code: form.referral_code || undefined,
      }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) return setError(data.error)
    router.push('/account')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/"><Image src="/logo.svg" alt={`${brand.company.displayName}`} width={130} height={53} className="mx-auto mb-6" /></Link>
          <h1 className="text-2xl font-black text-slate-900">Create Account</h1>
          <p className="text-white text-sm mt-1">Track bookings and manage your trips</p>
        </div>
        <form onSubmit={submit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          {[
            ['name', 'Full Name', 'text', true, 'John Smith'],
            ['email', 'Email', 'email', true, 'your@email.com'],
            ['phone', 'Phone', 'tel', false, '+1 (555) 000-0000'],
            ['password', 'Password', 'password', true, 'Min. 6 characters'],
            ['confirm', 'Confirm Password', 'password', true, '••••••••'],
          ].map(([field, label, type, required, placeholder]) => (
            <div key={field as string}>
              <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5">
                {label as string}{!required ? <span className="text-white font-normal normal-case"> (optional)</span> : ''}
              </label>
              <input type={type as string} required={required as boolean}
                value={(form as Record<string, string>)[field as string]}
                onChange={e => setForm(f => ({ ...f, [field as string]: e.target.value }))}
                placeholder={placeholder as string}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b353d]" />
            </div>
          ))}

          {/* Referral code */}
          <div>
            <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5">
              Referral Code <span className="text-white font-normal normal-case">(optional)</span>
            </label>
            <input type="text" value={form.referral_code}
              onChange={e => setForm(f => ({ ...f, referral_code: e.target.value.toUpperCase() }))}
              placeholder="KML·····"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#2b353d] uppercase tracking-widest" />
            {form.referral_code.length > 0 && (
              <p className="text-xs text-emerald-600 mt-1">You&apos;ll receive $10 credit after signup!</p>
            )}
          </div>

          {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-[#2b353d] hover:bg-[#1e262d] disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-sm transition-colors">
            {loading ? 'Creating account...' : 'Create Account →'}
          </button>
        </form>
        <p className="text-center text-sm text-white mt-4">
          Already have an account?{' '}
          <Link href="/account/login" className="text-[#2b353d] font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return <Suspense><RegisterForm /></Suspense>
}
