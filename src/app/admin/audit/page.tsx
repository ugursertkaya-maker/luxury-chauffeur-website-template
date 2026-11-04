'use client'
import { useEffect, useState } from 'react'

type Log = {
  id: string
  action: string
  actor: string
  booking_number: string | null
  details: Record<string, unknown> | null
  created_at: string
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  login:                  { label: 'Login',               color: 'bg-slate-100 text-white' },
  login_failed:           { label: 'Login Failed',         color: 'bg-red-50 text-red-600' },
  payment_received:       { label: 'Payment Received',     color: 'bg-green-50 text-green-700' },
  driver_assigned:        { label: 'Driver Assigned',      color: 'bg-blue-50 text-blue-700' },
  modification_approved:  { label: 'Modification Approved',color: 'bg-green-50 text-green-700' },
  modification_rejected:  { label: 'Modification Rejected',color: 'bg-amber-50 text-amber-700' },
  booking_cancelled:      { label: 'Booking Cancelled',    color: 'bg-red-50 text-red-600' },
}

function formatDetails(details: Record<string, unknown> | null) {
  if (!details) return null
  return Object.entries(details).map(([k, v]) => `${k}: ${v}`).join(' · ')
}

export default function AuditPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [filter, setFilter] = useState('')

  useEffect(() => {
    fetch('/api/admin/audit').then(r => r.json()).then(setLogs)
  }, [])

  const filtered = logs.filter(l =>
    !filter ||
    l.action.includes(filter) ||
    l.actor.includes(filter) ||
    (l.booking_number ?? '').includes(filter.toUpperCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-900">Audit Log</h1>
        <input
          type="text"
          placeholder="Search by action, user, booking..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2b353d] w-64"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-sm text-white p-6">No logs found.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-semibold text-white px-5 py-3">Time</th>
                <th className="text-left text-xs font-semibold text-white px-5 py-3">Action</th>
                <th className="text-left text-xs font-semibold text-white px-5 py-3">By</th>
                <th className="text-left text-xs font-semibold text-white px-5 py-3">Booking</th>
                <th className="text-left text-xs font-semibold text-white px-5 py-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => {
                const meta = ACTION_LABELS[log.action] ?? { label: log.action, color: 'bg-slate-100 text-white' }
                return (
                  <tr key={log.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 text-xs text-white whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${meta.color}`}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-700 font-medium">{log.actor}</td>
                    <td className="px-5 py-3 text-xs font-mono text-white">{log.booking_number ?? '—'}</td>
                    <td className="px-5 py-3 text-xs text-white">{formatDetails(log.details) ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
