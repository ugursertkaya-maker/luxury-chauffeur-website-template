'use client'
import { useEffect, useState } from 'react'
import { formatPrice } from '@/lib/pricing'

interface CorporateAccount {
  id: string; company_name: string; contact_name: string; contact_email: string
  billing_email: string; phone: string; address: string; payment_terms: number
  credit_limit: number | null; discount_rate: number; corporate_code: string
  notes: string; is_active: boolean; created_at: string; outstanding: number
}
interface Booking {
  id: string; booking_number: string; pickup_date: string; pickup_time: string
  pickup_location: string; dropoff_location: string; name: string
  total_price: number; status: string; invoice_status: string
}
interface Invoice {
  id: string; invoice_number: string; period_start: string; period_end: string
  total_amount: number; status: string; sent_at: string | null; paid_at: string | null; created_at: string
}

const EMPTY: Partial<CorporateAccount> = {
  company_name: '', contact_name: '', contact_email: '', billing_email: '',
  phone: '', address: '', payment_terms: 30, discount_rate: 0, corporate_code: '', notes: '', is_active: true,
}

export default function CorporatePage() {
  const [accounts, setAccounts] = useState<CorporateAccount[]>([])
  const [selected, setSelected] = useState<CorporateAccount | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [modal, setModal] = useState<'create' | 'edit' | 'invoice' | null>(null)
  const [form, setForm] = useState<Partial<CorporateAccount>>(EMPTY)
  const [invPeriod, setInvPeriod] = useState({ start: '', end: '' })
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'bookings' | 'invoices'>('bookings')
  const [credSending, setCredSending] = useState(false)

  async function load() {
    const r = await fetch('/api/admin/corporate')
    const d = await r.json()
    setAccounts(d.accounts ?? [])
  }

  async function loadAccount(acc: CorporateAccount) {
    setSelected(acc)
    const [br, ir] = await Promise.all([
      fetch('/api/admin/corporate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'get_bookings', account_id: acc.id }) }).then(r => r.json()),
      fetch('/api/admin/corporate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'get_invoices', account_id: acc.id }) }).then(r => r.json()),
    ])
    setBookings(br.bookings ?? [])
    setInvoices(ir.invoices ?? [])
  }

  useEffect(() => { load() }, [])

  async function save() {
    setLoading(true)
    const action = modal === 'create' ? 'create' : 'update'
    await fetch('/api/admin/corporate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...form }) })
    await load()
    setModal(null)
    setLoading(false)
  }

  async function generateInvoice() {
    if (!selected) return
    setLoading(true)
    const r = await fetch('/api/admin/corporate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'generate_invoice', account_id: selected.id, period_start: invPeriod.start, period_end: invPeriod.end }),
    })
    const d = await r.json()
    if (d.error) { alert(d.error); setLoading(false); return }
    if (d.email_error) {
      alert(`Invoice ${d.invoice.invoice_number} created but email failed: ${d.email_error}\n\nTrips: ${d.trip_count} · Total: ${formatPrice(d.total)}`)
    } else {
      alert(`Invoice ${d.invoice.invoice_number} sent — ${d.trip_count} trips · ${formatPrice(d.total)}`)
    }
    setModal(null)
    await loadAccount(selected)
    await load()
    setLoading(false)
  }

  async function sendPortalCredentials() {
    if (!selected) return
    if (!confirm(`Send portal login credentials to ${selected.contact_email}?`)) return
    setCredSending(true)
    const r = await fetch('/api/admin/corporate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'send_portal_credentials', account_id: selected.id }),
    })
    const d = await r.json()
    setCredSending(false)
    if (d.email_error) {
      alert(`Password set but email failed: ${d.email_error}`)
    } else {
      alert(`Portal credentials sent to ${selected.contact_email}`)
    }
  }

  async function markPaid(invoice_id: string) {
    await fetch('/api/admin/corporate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'mark_paid', invoice_id }) })
    if (selected) await loadAccount(selected)
    await load()
  }

  const totalOutstanding = accounts.reduce((s, a) => s + a.outstanding, 0)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1a2530]">Corporate Accounts</h1>
          <p className="text-sm text-slate-500 mt-0.5">{accounts.length} accounts · {formatPrice(totalOutstanding)} outstanding</p>
        </div>
        <button onClick={() => { setForm(EMPTY); setModal('create') }}
          className="bg-[#1a2530] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#0f1922] transition-colors">
          + New Account
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account list */}
        <div className="space-y-3">
          {accounts.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-400 text-sm">No accounts yet</div>
          )}
          {accounts.map(acc => (
            <div key={acc.id}
              onClick={() => { loadAccount(acc); setTab('bookings') }}
              className={`bg-white rounded-2xl border p-4 cursor-pointer hover:shadow-md transition-all ${selected?.id === acc.id ? 'border-[#1a2530] shadow-md' : 'border-slate-100'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 truncate">{acc.company_name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{acc.contact_name}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-semibold ${acc.is_active ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                  {acc.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              {acc.outstanding > 0 && (
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-slate-500">Outstanding</span>
                  <span className="font-bold text-amber-600">{formatPrice(acc.outstanding)}</span>
                </div>
              )}
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>Net {acc.payment_terms} days{acc.discount_rate > 0 ? ` · %${acc.discount_rate} off` : ''}</span>
                {acc.corporate_code && <span className="font-mono font-bold text-slate-700">{acc.corporate_code}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Account detail */}
        {selected ? (
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-[#1a2530]">{selected.company_name}</h2>
                  <p className="text-sm text-slate-500">{selected.contact_email} · {selected.phone}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => { setModal('invoice'); setInvPeriod({ start: '', end: '' }) }}
                    className="text-sm bg-[#1a2530] text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-[#0f1922] transition-colors">
                    Generate Invoice
                  </button>
                  <button onClick={sendPortalCredentials} disabled={credSending}
                    className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50">
                    {credSending ? 'Sending…' : 'Send Portal Access'}
                  </button>
                  <button onClick={() => { setForm(selected); setModal('edit') }}
                    className="text-sm border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-50">
                    Edit
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-500 mb-1">Outstanding</p>
                  <p className="text-lg font-extrabold text-amber-600">{formatPrice(selected.outstanding)}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-500 mb-1">Payment Terms</p>
                  <p className="text-lg font-extrabold text-slate-800">Net {selected.payment_terms}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-500 mb-1">Discount</p>
                  <p className="text-lg font-extrabold text-blue-600">{selected.discount_rate > 0 ? `%${selected.discount_rate}` : '—'}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-500 mb-1">Total Trips</p>
                  <p className="text-lg font-extrabold text-slate-800">{bookings.length}</p>
                </div>
              </div>
              {selected.corporate_code && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-blue-700">Customer Code:</span>
                  <span className="font-mono font-extrabold text-blue-900 tracking-widest">{selected.corporate_code}</span>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 gap-4">
              {(['bookings', 'invoices'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`pb-2 text-sm font-semibold capitalize border-b-2 transition-colors ${tab === t ? 'border-[#1a2530] text-[#1a2530]' : 'border-transparent text-slate-500'}`}>
                  {t} {t === 'bookings' ? `(${bookings.length})` : `(${invoices.length})`}
                </button>
              ))}
            </div>

            {tab === 'bookings' && (
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                {bookings.length === 0 ? (
                  <p className="p-6 text-center text-sm text-slate-400">No bookings assigned</p>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {bookings.map(b => (
                      <div key={b.id} className="flex items-center justify-between px-4 py-3 text-sm">
                        <div className="min-w-0">
                          <span className="font-mono text-xs text-slate-500 mr-2">{b.booking_number}</span>
                          <span className="text-slate-700">{b.pickup_date} · {b.name}</span>
                          <p className="text-xs text-slate-400 truncate mt-0.5">{b.pickup_location} → {b.dropoff_location}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                          <span className="font-bold text-slate-800">{formatPrice(b.total_price)}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            b.invoice_status === 'paid' ? 'bg-green-50 text-green-700' :
                            b.invoice_status === 'invoiced' ? 'bg-blue-50 text-blue-700' :
                            'bg-amber-50 text-amber-600'
                          }`}>{b.invoice_status === 'none' ? 'Pending' : b.invoice_status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'invoices' && (
              <div className="space-y-3">
                {invoices.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center text-sm text-slate-400">No invoices yet</div>
                ) : invoices.map(inv => (
                  <div key={inv.id} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{inv.invoice_number}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{inv.period_start} — {inv.period_end}</p>
                      {inv.paid_at && <p className="text-xs text-green-600 mt-0.5">Paid {new Date(inv.paid_at).toLocaleDateString('en-US')}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-slate-800 text-lg">{formatPrice(inv.total_amount)}</span>
                      {inv.status === 'pending' || inv.status === 'sent' ? (
                        <button onClick={() => markPaid(inv.id)}
                          className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-green-700">
                          Mark Paid
                        </button>
                      ) : (
                        <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full font-semibold">✓ Paid</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 text-sm p-16">
            Select an account to view details
          </div>
        )}
      </div>

      {/* Create/Edit modal */}
      {(modal === 'create' || modal === 'edit') && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="font-bold text-lg text-[#1a2530]">{modal === 'create' ? 'New Corporate Account' : 'Edit Account'}</h3>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-700 text-xl">×</button>
            </div>
            <div className="p-6 space-y-4">
              {[
                ['company_name', 'Company Name', 'text', true],
                ['contact_name', 'Contact Name', 'text', true],
                ['contact_email', 'Contact Email', 'email', true],
                ['billing_email', 'Billing Email', 'email', false],
                ['phone', 'Phone', 'tel', false],
                ['address', 'Address', 'text', false],
              ].map(([field, label, type, required]) => (
                <div key={field as string}>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{label as string}{required ? ' *' : ''}</label>
                  <input type={type as string} value={(form as Record<string, unknown>)[field as string] as string ?? ''}
                    onChange={e => setForm(f => ({ ...f, [field as string]: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a2530]" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Payment Terms (days)</label>
                  <input type="number" min="1" value={form.payment_terms ?? 30}
                    onChange={e => setForm(f => ({ ...f, payment_terms: Number(e.target.value) }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a2530]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Discount Rate (%)</label>
                  <input type="number" min="0" max="50" step="1" value={form.discount_rate ?? 0}
                    onChange={e => setForm(f => ({ ...f, discount_rate: Number(e.target.value) }))}
                    placeholder="0"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a2530]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Corporate Code</label>
                  <input type="text" value={form.corporate_code ?? ''}
                    onChange={e => setForm(f => ({ ...f, corporate_code: e.target.value.toUpperCase() }))}
                    placeholder="CORP-ACME"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono tracking-wider focus:outline-none focus:border-[#1a2530] uppercase" />
                  <p className="text-xs text-slate-400 mt-1">Customers enter this at checkout</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Credit Limit ($)</label>
                  <input type="number" min="0" value={form.credit_limit ?? ''}
                    onChange={e => setForm(f => ({ ...f, credit_limit: Number(e.target.value) || null }))}
                    placeholder="Unlimited"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a2530]" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Notes</label>
                <textarea value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a2530] resize-none" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active ?? true}
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  className="w-4 h-4 accent-[#1a2530]" />
                <span className="text-sm text-slate-700">Active account</span>
              </label>
            </div>
            <div className="p-6 border-t border-slate-100 flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-xl text-sm font-semibold">Cancel</button>
              <button onClick={save} disabled={loading || !form.company_name || !form.contact_email}
                className="flex-1 bg-[#1a2530] text-white py-2.5 rounded-xl text-sm font-bold disabled:opacity-50">
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate invoice modal */}
      {modal === 'invoice' && selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="font-bold text-lg text-[#1a2530]">Generate Invoice</h3>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-700 text-xl">×</button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-700">Invoice for <strong>{selected.company_name}</strong></p>
              <p className="text-xs text-slate-500">If dates are left blank, all unbilled trips will be included.</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Period Start <span className="font-normal text-slate-400">(optional)</span></label>
                  <input type="date" value={invPeriod.start} onChange={e => setInvPeriod(p => ({ ...p, start: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a2530]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Period End <span className="font-normal text-slate-400">(optional)</span></label>
                  <input type="date" value={invPeriod.end} onChange={e => setInvPeriod(p => ({ ...p, end: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a2530]" />
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
                Invoice will be emailed to <strong>{selected.billing_email || selected.contact_email}</strong>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-xl text-sm font-semibold">Cancel</button>
              <button onClick={generateInvoice} disabled={loading}
                className="flex-1 bg-[#1a2530] text-white py-2.5 rounded-xl text-sm font-bold disabled:opacity-50">
                {loading ? 'Sending...' : 'Generate & Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
