'use client'
import { useEffect, useState } from 'react'
import { formatPrice } from '@/lib/pricing'

type Subscriber = {
  id: string; email: string; name: string | null; source: string; subscribed_at: string
  booking_count: number; total_spent: number; last_booking: string | null; is_customer: boolean
}

type CustomerOnly = {
  id: string; email: string; name: string | null; source: string; subscribed_at: string
  booking_count: number; total_spent: number; last_booking: string | null; is_customer: boolean
}

type Tab = 'customers' | 'subscribers' | 'all'
type Segment = 'customers' | 'subscribers' | 'all'

const SEGMENT_LABELS: Record<Segment, string> = {
  customers: 'All Customers (booked)',
  subscribers: 'Subscribers Only (never booked)',
  all: 'Everyone (customers + subscribers)',
}

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [customers, setCustomers] = useState<CustomerOnly[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('customers')
  const [search, setSearch] = useState('')
  const [addEmail, setAddEmail] = useState('')
  const [addName, setAddName] = useState('')
  const [adding, setAdding] = useState(false)
  const [showEmail, setShowEmail] = useState(false)
  const [emailSegment, setEmailSegment] = useState<Segment>('all')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number; total: number } | null>(null)

  useEffect(() => {
    fetch('/api/admin/subscribers')
      .then(r => r.json())
      .then(d => {
        setSubscribers(d.subscribers ?? [])
        setCustomers(d.customers ?? [])
        setLoading(false)
      })
  }, [])

  async function add() {
    setAdding(true)
    const r = await fetch('/api/admin/subscribers', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: addEmail, name: addName }),
    })
    if (r.ok) {
      const data = await r.json()
      setSubscribers(prev => [{ ...data, booking_count: 0, total_spent: 0, last_booking: null, is_customer: false }, ...prev.filter(s => s.email !== data.email)])
    }
    setAddEmail(''); setAddName(''); setAdding(false)
  }

  async function remove(id: string) {
    await fetch('/api/admin/subscribers', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setSubscribers(prev => prev.filter(s => s.id !== id))
  }

  async function sendBulkEmail() {
    setSending(true); setSendResult(null)
    const r = await fetch('/api/admin/subscribers/bulk-email', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ segment: emailSegment, subject: emailSubject, message: emailBody }),
    })
    const data = await r.json()
    setSendResult(data)
    setSending(false)
  }

  function recipientCount(seg: Segment) {
    if (seg === 'customers') return allCustomers.length
    if (seg === 'subscribers') return subscriberOnly.length
    return allCustomers.length + subscriberOnly.length
  }

  // Customers = people who have booked (in subscribers or not)
  const bookedSubscribers = subscribers.filter(s => s.is_customer)
  const subscriberOnly = subscribers.filter(s => !s.is_customer)
  const allCustomers = [...bookedSubscribers, ...customers].sort((a, b) => (b.total_spent ?? 0) - (a.total_spent ?? 0))

  function exportCsv(rows: (Subscriber | CustomerOnly)[]) {
    const data = [['Email', 'Name', 'Bookings', 'Total Spent', 'Source', 'Last Booking'],
      ...rows.map(s => [s.email, s.name ?? '', String(s.booking_count), String(s.total_spent), s.source, s.last_booking ? new Date(s.last_booking).toLocaleDateString() : ''])]
    const csv = data.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `${tab}-export.csv`; a.click()
  }

  const q = search.toLowerCase()
  function filter<T extends { email: string; name: string | null }>(rows: T[]) {
    if (!q) return rows
    return rows.filter(r => r.email.includes(q) || (r.name ?? '').toLowerCase().includes(q))
  }

  const totalRevenue = allCustomers.reduce((s, c) => s + (c.total_spent ?? 0), 0)

  function Row({ row, showRemove = false }: { row: Subscriber | CustomerOnly; showRemove?: boolean }) {
    return (
      <tr className="hover:bg-slate-50 transition-colors">
        <td className="px-5 py-3">
          <p className="font-medium text-slate-800">{row.email}</p>
          {row.name && <p className="text-xs text-slate-500 mt-0.5">{row.name}</p>}
        </td>
        <td className="px-4 py-3">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${
            row.source === 'booking_only' ? 'bg-orange-100 text-orange-700' :
            row.source === 'booking' ? 'bg-blue-100 text-blue-700' :
            'bg-slate-100 text-slate-600'
          }`}>
            {row.source === 'booking_only' ? 'booking' : row.source}
          </span>
        </td>
        <td className="px-4 py-3 text-center">
          {row.booking_count > 0 ? (
            <span className="font-bold text-slate-900">{row.booking_count}</span>
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </td>
        <td className="px-4 py-3 text-right hidden sm:table-cell">
          {row.total_spent > 0 ? (
            <span className="font-semibold text-emerald-600">{formatPrice(row.total_spent)}</span>
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </td>
        <td className="px-4 py-3 text-slate-500 text-xs hidden sm:table-cell whitespace-nowrap">
          {row.last_booking
            ? new Date(row.last_booking).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : row.subscribed_at
              ? new Date(row.subscribed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : '—'}
        </td>
        <td className="px-4 py-3 text-right">
          {showRemove && !row.id.startsWith('customer_') && (
            <button onClick={() => remove(row.id)} className="text-slate-400 hover:text-red-500 text-xs font-semibold transition-colors">Remove</button>
          )}
        </td>
      </tr>
    )
  }

  const tableHead = (
    <thead>
      <tr className="bg-[#0f1922] text-white text-sm">
        <th className="text-left px-5 py-3 font-semibold">Email</th>
        <th className="text-left px-4 py-3 font-semibold">Source</th>
        <th className="text-center px-4 py-3 font-semibold">Bookings</th>
        <th className="text-right px-4 py-3 font-semibold hidden sm:table-cell">Total Spent</th>
        <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Last Activity</th>
        <th className="px-4 py-3" />
      </tr>
    </thead>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Subscribers & Customers</h1>
          <p className="text-sm text-slate-500 mt-1">
            {allCustomers.length} customers · {subscriberOnly.length} subscriber-only · {formatPrice(totalRevenue)} total revenue
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowEmail(true); setSendResult(null) }}
            className="bg-[#2b353d] text-white font-bold px-5 py-2.5 rounded-xl hover:bg-[#1e262d] transition-colors text-sm">
            Send Email
          </button>
          <button onClick={() => exportCsv(tab === 'customers' ? filter(allCustomers) : tab === 'subscribers' ? filter(subscriberOnly) : filter([...allCustomers, ...subscriberOnly]))}
            className="border border-slate-200 text-slate-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-sm">
            Export CSV
          </button>
        </div>
      </div>

      {/* Bulk Email Modal */}
      {showEmail && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-[#0f1922] to-[#2b353d] px-6 py-4 flex items-center justify-between flex-shrink-0">
              <div>
                <p className="font-bold text-white">Send Bulk Email</p>
                <p className="text-[#8fa4b4] text-xs mt-0.5">Branded email via Resend</p>
              </div>
              <button onClick={() => { setShowEmail(false); setSendResult(null) }} className="text-[#8fa4b4] hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              {sendResult ? (
                <div className="text-center py-8">
                  <div className={`text-5xl mb-4`}>{sendResult.failed === 0 ? '✅' : '⚠️'}</div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Email Campaign Sent</h3>
                  <div className="flex gap-6 justify-center mt-4">
                    <div className="text-center">
                      <p className="text-3xl font-extrabold text-green-600">{sendResult.sent}</p>
                      <p className="text-xs text-slate-500 mt-1">Sent</p>
                    </div>
                    {sendResult.failed > 0 && (
                      <div className="text-center">
                        <p className="text-3xl font-extrabold text-red-500">{sendResult.failed}</p>
                        <p className="text-xs text-slate-500 mt-1">Failed</p>
                      </div>
                    )}
                    <div className="text-center">
                      <p className="text-3xl font-extrabold text-slate-700">{sendResult.total}</p>
                      <p className="text-xs text-slate-500 mt-1">Total</p>
                    </div>
                  </div>
                  <button onClick={() => { setSendResult(null); setEmailSubject(''); setEmailBody('') }}
                    className="mt-8 text-sm text-[#2b353d] underline">Send another</button>
                </div>
              ) : (
                <>
                  {/* Segment selector */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Send To</label>
                    <div className="space-y-2">
                      {(['customers', 'subscribers', 'all'] as Segment[]).map(seg => (
                        <label key={seg} className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-colors ${emailSegment === seg ? 'border-[#2b353d] bg-slate-50' : 'border-slate-200 hover:border-slate-300'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${emailSegment === seg ? 'border-[#2b353d]' : 'border-slate-300'}`}>
                              {emailSegment === seg && <div className="w-2 h-2 rounded-full bg-[#2b353d]" />}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800 capitalize">{seg === 'all' ? 'Everyone' : seg === 'customers' ? 'Customers' : 'Subscribers Only'}</p>
                              <p className="text-xs text-slate-500">{SEGMENT_LABELS[seg]}</p>
                            </div>
                          </div>
                          <span className={`text-sm font-bold px-3 py-1 rounded-full ${emailSegment === seg ? 'bg-[#2b353d] text-white' : 'bg-slate-100 text-slate-600'}`}>
                            {recipientCount(seg)} recipients
                          </span>
                          <input type="radio" className="hidden" checked={emailSegment === seg} onChange={() => setEmailSegment(seg)} />
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Subject *</label>
                    <input value={emailSubject} onChange={e => setEmailSubject(e.target.value)}
                      placeholder="e.g. Exclusive offer for our customers"
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2b353d] focus:ring-1 focus:ring-[#2b353d]" />
                  </div>

                  {/* Body */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Message *</label>
                    <textarea rows={8} value={emailBody} onChange={e => setEmailBody(e.target.value)}
                      placeholder="Write your message here. Each recipient will be greeted by name.&#10;&#10;You can include discount codes, announcements, or any update."
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2b353d] focus:ring-1 focus:ring-[#2b353d] resize-none" />
                    <p className="text-xs text-slate-500 mt-1.5">Personalized greeting (Hi [Name]) added automatically. "Book a Ride" button included in footer.</p>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setShowEmail(false)} className="flex-1 border border-slate-200 text-slate-600 font-semibold py-3 rounded-xl hover:bg-slate-50 transition-colors text-sm">Cancel</button>
                    <button onClick={sendBulkEmail} disabled={sending || !emailSubject.trim() || !emailBody.trim() || recipientCount(emailSegment) === 0}
                      className="flex-1 bg-[#2b353d] text-white font-bold py-3 rounded-xl hover:bg-[#1e262d] disabled:opacity-40 transition-colors text-sm">
                      {sending ? `Sending to ${recipientCount(emailSegment)} recipients…` : `Send to ${recipientCount(emailSegment)} recipients →`}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {[
          { label: 'Total Customers', value: allCustomers.length, sub: 'Made a booking', color: 'text-[#2b353d]' },
          { label: 'Repeat Customers', value: allCustomers.filter(c => c.booking_count > 1).length, sub: '2+ bookings', color: 'text-purple-600' },
          { label: 'Subscribers Only', value: subscriberOnly.length, sub: 'Never booked', color: 'text-blue-600' },
          { label: 'Total Revenue', value: formatPrice(totalRevenue), sub: 'from known emails', color: 'text-emerald-600' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-100 rounded-xl p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Add manually */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 mb-6">
        <p className="text-sm font-semibold text-slate-700 mb-3">Add Subscriber Manually</p>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <input placeholder="Email *" type="email" value={addEmail} onChange={e => setAddEmail(e.target.value)}
            className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#2b353d] focus:ring-1 focus:ring-[#2b353d]" />
          <input placeholder="Name" value={addName} onChange={e => setAddName(e.target.value)}
            className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#2b353d] focus:ring-1 focus:ring-[#2b353d]" />
          <button onClick={add} disabled={adding || !addEmail}
            className="bg-[#2b353d] text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-[#1e262d] disabled:opacity-40 transition-colors sm:w-auto w-full">
            {adding ? '…' : 'Add'}
          </button>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 overflow-x-auto">
          {([
            ['customers', `Customers (${allCustomers.length})`],
            ['subscribers', `Sub Only (${subscriberOnly.length})`],
            ['all', `All (${allCustomers.length + subscriberOnly.length})`],
          ] as [Tab, string][]).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${tab === key ? 'bg-white shadow-sm text-[#2b353d]' : 'text-slate-500 hover:text-slate-700'}`}>
              {label}
            </button>
          ))}
        </div>
        <input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
          className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#2b353d] focus:ring-1 focus:ring-[#2b353d] w-full sm:w-56" />
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : (
        <>
          {/* CUSTOMERS TAB */}
          {tab === 'customers' && (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Customers — Made a Booking</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                  {tableHead}
                  <tbody className="divide-y divide-slate-100">
                    {filter(allCustomers).map(row => <Row key={row.id} row={row} showRemove />)}
                    {filter(allCustomers).length === 0 && (
                      <tr><td colSpan={6} className="text-center text-slate-400 py-12">No customers found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUBSCRIBERS ONLY TAB */}
          {tab === 'subscribers' && (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subscribers — Never Booked</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                  {tableHead}
                  <tbody className="divide-y divide-slate-100">
                    {filter(subscriberOnly).map(row => <Row key={row.id} row={row} showRemove />)}
                    {filter(subscriberOnly).length === 0 && (
                      <tr><td colSpan={6} className="text-center text-slate-400 py-12">No subscriber-only entries.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ALL TAB */}
          {tab === 'all' && (
            <div className="space-y-6">
              {allCustomers.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Customers ({allCustomers.length})</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[560px]">
                      {tableHead}
                      <tbody className="divide-y divide-slate-100">
                        {filter(allCustomers).map(row => <Row key={row.id} row={row} showRemove />)}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {subscriberOnly.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subscribers Only ({subscriberOnly.length})</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[560px]">
                      {tableHead}
                      <tbody className="divide-y divide-slate-100">
                        {filter(subscriberOnly).map(row => <Row key={row.id} row={row} showRemove />)}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
