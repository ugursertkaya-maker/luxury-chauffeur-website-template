'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CorporateSidebar from '@/components/CorporateSidebar'
import { brand } from '@/config/brand'

interface Account {
  company_name: string; contact_name: string; contact_email: string
  phone: string; payment_terms: number; discount_rate: number; corporate_code: string
}

export default function CorporateSettingsPage() {
  const router = useRouter()
  const [account, setAccount] = useState<Account | null>(null)
  const [loading, setLoading] = useState(true)

  // Password form
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwLoading, setPwLoading] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // Email form
  const [emForm, setEmForm] = useState({ new_email: '', password: '' })
  const [emLoading, setEmLoading] = useState(false)
  const [emMsg, setEmMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    fetch('/api/corporate/dashboard?type=account')
      .then(r => { if (r.status === 401) { router.replace('/corporate/login'); return null } return r.json() })
      .then(d => { if (d?.account) setAccount(d.account); setLoading(false) })
  }, [router])

  async function logout() {
    await fetch('/api/corporate/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'logout' }) })
    window.location.href = '/corporate/login'
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwMsg(null)
    if (pwForm.next !== pwForm.confirm) { setPwMsg({ ok: false, text: 'Passwords do not match' }); return }
    if (pwForm.next.length < 8) { setPwMsg({ ok: false, text: 'Password must be at least 8 characters' }); return }
    setPwLoading(true)
    const r = await fetch('/api/corporate/settings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'change_password', current_password: pwForm.current, new_password: pwForm.next }),
    })
    const d = await r.json()
    setPwLoading(false)
    if (d.ok) { setPwMsg({ ok: true, text: 'Password updated successfully' }); setPwForm({ current: '', next: '', confirm: '' }) }
    else setPwMsg({ ok: false, text: d.error ?? 'Failed' })
  }

  async function changeEmail(e: React.FormEvent) {
    e.preventDefault()
    setEmMsg(null)
    setEmLoading(true)
    const r = await fetch('/api/corporate/settings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'change_email', new_email: emForm.new_email, password: emForm.password }),
    })
    const d = await r.json()
    setEmLoading(false)
    if (d.ok) {
      setEmMsg({ ok: true, text: 'Email updated. Please use your new email to log in next time.' })
      setAccount(prev => prev ? { ...prev, contact_email: emForm.new_email } : prev)
      setEmForm({ new_email: '', password: '' })
    } else setEmMsg({ ok: false, text: d.error ?? 'Failed' })
  }

  const inputCls = 'w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a1017]'
  const labelCls = 'block text-xs font-semibold text-white uppercase tracking-wide mb-1.5'

  if (loading) return (
    <div className="min-h-screen bg-[#0a1017] flex items-center justify-center">
      <div className="text-white text-sm">Loading…</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <CorporateSidebar company={account?.company_name} onLogout={logout} />
      <div className="flex-1 lg:ml-56">
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
          <h1 className="text-2xl font-bold text-slate-800">Settings</h1>

          {/* Account info (read-only) */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
            <h2 className="font-semibold text-slate-800">Account Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-white mb-0.5">Company</p>
                <p className="font-medium text-slate-800">{account?.company_name}</p>
              </div>
              <div>
                <p className="text-xs text-white mb-0.5">Contact Name</p>
                <p className="font-medium text-slate-800">{account?.contact_name}</p>
              </div>
              <div>
                <p className="text-xs text-white mb-0.5">Login Email</p>
                <p className="font-medium text-slate-800">{account?.contact_email}</p>
              </div>
              <div>
                <p className="text-xs text-white mb-0.5">Phone</p>
                <p className="font-medium text-slate-800">{account?.phone || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-white mb-0.5">Corporate Code</p>
                <p className="font-mono font-bold text-slate-800 tracking-widest">{account?.corporate_code}</p>
              </div>
              <div>
                <p className="text-xs text-white mb-0.5">Discount</p>
                <p className="font-medium text-slate-800">{account?.discount_rate ? `${account.discount_rate}%` : '—'}</p>
              </div>
            </div>
            <p className="text-xs text-white">To update company details, contact <a href={`mailto:${brand.contact.emailInfo}`} className="text-white hover:underline">{brand.contact.emailInfo}</a></p>
          </div>

          {/* Change Email */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h2 className="font-semibold text-slate-800 mb-4">Change Login Email</h2>
            <form onSubmit={changeEmail} className="space-y-4">
              {emMsg && (
                <div className={`text-sm rounded-xl px-4 py-3 border ${emMsg.ok ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                  {emMsg.text}
                </div>
              )}
              <div>
                <label className={labelCls}>New Email</label>
                <input type="email" required className={inputCls} placeholder="new@company.com"
                  value={emForm.new_email} onChange={e => setEmForm(f => ({ ...f, new_email: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Current Password</label>
                <input type="password" required className={inputCls} placeholder="••••••••"
                  value={emForm.password} onChange={e => setEmForm(f => ({ ...f, password: e.target.value }))} />
              </div>
              <button type="submit" disabled={emLoading}
                className="bg-[#0a1017] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#1a2530] transition-colors disabled:opacity-50">
                {emLoading ? 'Updating…' : 'Update Email'}
              </button>
            </form>
          </div>

          {/* Change Password */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h2 className="font-semibold text-slate-800 mb-4">Change Password</h2>
            <form onSubmit={changePassword} className="space-y-4">
              {pwMsg && (
                <div className={`text-sm rounded-xl px-4 py-3 border ${pwMsg.ok ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                  {pwMsg.text}
                </div>
              )}
              <div>
                <label className={labelCls}>Current Password</label>
                <input type="password" required className={inputCls} placeholder="••••••••"
                  value={pwForm.current} onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>New Password</label>
                <input type="password" required minLength={8} className={inputCls} placeholder="Min. 8 characters"
                  value={pwForm.next} onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Confirm New Password</label>
                <input type="password" required className={inputCls} placeholder="••••••••"
                  value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} />
              </div>
              <button type="submit" disabled={pwLoading}
                className="bg-[#0a1017] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#1a2530] transition-colors disabled:opacity-50">
                {pwLoading ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  )
}
