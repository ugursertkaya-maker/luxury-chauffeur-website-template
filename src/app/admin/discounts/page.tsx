'use client'
import { useEffect, useState } from 'react'

type DiscountCode = {
  id: string; code: string; description: string | null; type: 'percentage' | 'fixed'
  value: number; min_order_amount: number; max_uses: number | null; max_uses_per_email: number
  uses_count: number; expires_at: string | null; active: boolean; created_at: string; created_by: string
}

const empty = {
  code: '', description: '', type: 'percentage' as const, value: '', min_order_amount: '',
  max_uses: '', max_uses_per_email: '1', expires_at: '', no_expiry: true,
}

export default function DiscountsPage() {
  const [codes, setCodes] = useState<DiscountCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/discounts').then(r => r.json()).then(d => { setCodes(d); setLoading(false) })
  }, [])

  function set(k: string, v: unknown) { setForm(f => ({ ...f, [k]: v })) }

  async function create() {
    setSaving(true); setError('')
    const payload = {
      code: form.code, description: form.description, type: form.type,
      value: parseFloat(form.value), min_order_amount: parseFloat(form.min_order_amount) || 0,
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      max_uses_per_email: parseInt(form.max_uses_per_email) || 1,
      expires_at: !form.no_expiry && form.expires_at ? form.expires_at : null,
    }
    const r = await fetch('/api/admin/discounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const data = await r.json()
    if (!r.ok) { setError(data.error ?? 'Error'); setSaving(false); return }
    setCodes(prev => [data, ...prev])
    setShowForm(false); setForm(empty); setSaving(false)
  }

  async function toggle(code: DiscountCode) {
    const updated = await fetch(`/api/admin/discounts/${code.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !code.active })
    }).then(r => r.json())
    setCodes(prev => prev.map(c => c.id === code.id ? updated : c))
  }

  async function del(id: string) {
    if (!confirm('Delete this code?')) return
    await fetch(`/api/admin/discounts/${id}`, { method: 'DELETE' })
    setCodes(prev => prev.filter(c => c.id !== id))
  }

  const isExpired = (c: DiscountCode) => !!c.expires_at && new Date(c.expires_at) < new Date()
  const isMaxed = (c: DiscountCode) => c.max_uses != null && c.uses_count >= c.max_uses

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Discount Codes</h1>
          <p className="text-sm text-slate-500 mt-1">{codes.filter(c => c.active).length} active codes · {codes.reduce((s, c) => s + c.uses_count, 0)} total uses</p>
        </div>
        <button onClick={() => { setShowForm(true); setError('') }}
          className="bg-[#2b353d] text-white font-bold px-5 py-2.5 rounded-xl hover:bg-[#1e262d] transition-colors text-sm">
          + New Code
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-gradient-to-r from-[#0f1922] to-[#2b353d] px-6 py-4 flex items-center justify-between">
              <p className="font-bold text-white">Create Discount Code</p>
              <button onClick={() => setShowForm(false)} className="text-[#8fa4b4] hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Code *</label>
                  <input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="SUMMER20"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono uppercase focus:outline-none focus:border-[#2b353d] focus:ring-1 focus:ring-[#2b353d]" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Description</label>
                  <input value={form.description} onChange={e => set('description', e.target.value)} placeholder="Summer sale"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2b353d] focus:ring-1 focus:ring-[#2b353d]" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Discount Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['percentage', 'fixed'] as const).map(t => (
                    <button key={t} onClick={() => set('type', t)}
                      className={`py-3 rounded-xl border text-sm font-semibold transition-colors ${form.type === t ? 'bg-[#2b353d] text-white border-[#2b353d]' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                      {t === 'percentage' ? '% Percentage' : '$ Fixed Amount'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
                    {form.type === 'percentage' ? 'Discount %' : 'Discount Amount ($)'} *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{form.type === 'percentage' ? '%' : '$'}</span>
                    <input type="number" min="0" max={form.type === 'percentage' ? 100 : undefined} step="0.01"
                      value={form.value} onChange={e => set('value', e.target.value)}
                      className="w-full pl-8 pr-3 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#2b353d] focus:ring-1 focus:ring-[#2b353d]" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Min. Order ($)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                    <input type="number" min="0" step="0.01" placeholder="0"
                      value={form.min_order_amount} onChange={e => set('min_order_amount', e.target.value)}
                      className="w-full pl-8 pr-3 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#2b353d] focus:ring-1 focus:ring-[#2b353d]" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Total Max Uses</label>
                  <input type="number" min="1" placeholder="Unlimited"
                    value={form.max_uses} onChange={e => set('max_uses', e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2b353d] focus:ring-1 focus:ring-[#2b353d]" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Per Email Uses</label>
                  <input type="number" min="1" value={form.max_uses_per_email} onChange={e => set('max_uses_per_email', e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2b353d] focus:ring-1 focus:ring-[#2b353d]" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-white uppercase tracking-wide block mb-2">Expiry</label>
                <label className="flex items-center gap-2 mb-3 cursor-pointer">
                  <div onClick={() => set('no_expiry', !form.no_expiry)}
                    className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${form.no_expiry ? 'bg-[#2b353d]' : 'bg-slate-300'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${form.no_expiry ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                  <span className="text-sm text-slate-600">No expiry (all time)</span>
                </label>
                {!form.no_expiry && (
                  <input type="datetime-local" value={form.expires_at} onChange={e => set('expires_at', e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2b353d] focus:ring-1 focus:ring-[#2b353d]" />
                )}
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 border border-slate-200 text-slate-600 font-semibold py-3 rounded-xl hover:bg-slate-50 transition-colors text-sm">Cancel</button>
                <button onClick={create} disabled={saving || !form.code || !form.value}
                  className="flex-1 bg-[#2b353d] text-white font-bold py-3 rounded-xl hover:bg-[#1e262d] disabled:opacity-40 transition-colors text-sm">
                  {saving ? 'Creating…' : 'Create Code'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : codes.length === 0 ? (
        <div className="text-center py-20 text-slate-400">No discount codes yet.</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-[#0f1922] text-white">
                <th className="text-left px-5 py-3 font-semibold">Code</th>
                <th className="text-left px-4 py-3 font-semibold">Discount</th>
                <th className="text-left px-4 py-3 font-semibold">Limits</th>
                <th className="text-left px-4 py-3 font-semibold">Expiry</th>
                <th className="text-center px-4 py-3 font-semibold">Uses</th>
                <th className="text-center px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {codes.map(c => {
                const expired = isExpired(c)
                const maxed = isMaxed(c)
                const effectivelyInactive = !c.active || expired || maxed
                return (
                  <tr key={c.id} className={`hover:bg-slate-50 transition-colors ${effectivelyInactive ? 'opacity-60' : ''}`}>
                    <td className="px-5 py-4">
                      <p className="font-mono font-bold text-slate-900 text-base tracking-wider">{c.code}</p>
                      {c.description && <p className="text-xs text-slate-500 mt-0.5">{c.description}</p>}
                      {c.min_order_amount > 0 && <p className="text-xs text-slate-500">Min: ${c.min_order_amount}</p>}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`font-bold text-lg ${c.type === 'percentage' ? 'text-green-600' : 'text-blue-600'}`}>
                        {c.type === 'percentage' ? `%${c.value}` : `$${c.value}`}
                      </span>
                      <p className="text-xs text-slate-500">{c.type}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      <p>{c.max_uses ? `${c.uses_count} / ${c.max_uses} total` : `${c.uses_count} uses (unlimited)`}</p>
                      <p className="text-xs text-slate-500">{c.max_uses_per_email}× per email</p>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      {c.expires_at ? (
                        <span className={expired ? 'text-red-500 font-semibold' : 'text-slate-600'}>
                          {new Date(c.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {expired && ' (Expired)'}
                        </span>
                      ) : (
                        <span className="text-slate-400">No expiry</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="font-bold text-slate-900">{c.uses_count}</span>
                      {c.max_uses && <span className="text-slate-400 text-xs"> / {c.max_uses}</span>}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {expired ? (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-semibold">Expired</span>
                      ) : maxed ? (
                        <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-semibold">Maxed</span>
                      ) : (
                        <button onClick={() => toggle(c)}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${c.active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                          {c.active ? 'Active' : 'Inactive'}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button onClick={() => del(c.id)} className="text-slate-400 hover:text-red-500 transition-colors text-xs font-semibold">Delete</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
