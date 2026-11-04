'use client'
import { useEffect, useState } from 'react'

interface Vehicle { id: string; name: string; type: string }
interface Driver {
  id: string
  name: string
  phone: string
  email?: string
  license?: string
  vehicle_id?: string
  active: boolean
  notes?: string
  password?: string | null
  vehicles?: { name: string; type: string } | null
}

function generatePassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

const EMPTY = { name: '', phone: '', email: '', license: '', vehicle_id: '', commission_rate: 40, active: true, notes: '' }

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [sendingEmail, setSendingEmail] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/drivers').then(r => r.json()),
      fetch('/api/admin/vehicles').then(r => r.json()),
    ]).then(([d, v]) => {
      setDrivers(Array.isArray(d) ? d : [])
      setVehicles(Array.isArray(v) ? v.filter((x: Vehicle & { active: boolean }) => x.active) : [])
      setLoading(false)
    })
  }, [])

  function startEdit(d: Driver) {
    setEditing(d.id)
    setForm({ name: d.name, phone: d.phone, email: d.email ?? '', license: d.license ?? '', vehicle_id: d.vehicle_id ?? '', commission_rate: (d as Driver & { commission_rate?: number }).commission_rate ?? 40, active: d.active, notes: d.notes ?? '' })
  }

  function cancelEdit() { setEditing(null); setForm(EMPTY) }

  async function save() {
    setSaving(true)
    const payload: Record<string, unknown> = { ...form, vehicle_id: form.vehicle_id || null }

    if (!editing) {
      // Auto-generate password for new drivers
      payload.password = generatePassword()
    }

    if (editing) {
      const res = await fetch(`/api/admin/drivers/${editing}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      setDrivers(prev => prev.map(d => d.id === editing ? { ...d, ...data } : d))
      setEditing(null)
    } else {
      const res = await fetch('/api/admin/drivers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      setDrivers(prev => [data, ...prev])
      // Auto-send credentials email if email provided
      if (form.email && data.id) {
        sendCredentials(data.id)
      }
    }
    setForm(EMPTY)
    setSaving(false)
  }

  async function remove(id: string) {
    if (!confirm('Delete this driver?')) return
    await fetch(`/api/admin/drivers/${id}`, { method: 'DELETE' })
    setDrivers(prev => prev.filter(d => d.id !== id))
  }

  async function toggleActive(d: Driver) {
    const res = await fetch(`/api/admin/drivers/${d.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !d.active }) })
    const data = await res.json()
    setDrivers(prev => prev.map(x => x.id === d.id ? { ...x, ...data } : x))
  }

  async function resetPassword(d: Driver) {
    if (!d.email) return alert('Driver has no email address.')
    const newPassword = generatePassword()
    const res = await fetch(`/api/admin/drivers/${d.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword }),
    })
    if (res.ok) {
      setDrivers(prev => prev.map(x => x.id === d.id ? { ...x, password: newPassword } : x))
      sendCredentials(d.id)
    }
  }

  async function sendCredentials(driverId: string) {
    setSendingEmail(driverId)
    await fetch('/api/admin/drivers/send-credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driverId }),
    })
    setSendingEmail(null)
    setEmailSent(driverId)
    setTimeout(() => setEmailSent(null), 3000)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-extrabold text-slate-900">Drivers</h2>

      {/* Add/Edit form */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-4">{editing ? 'Edit Driver' : 'Add Driver'}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b353d]" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Phone</label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 (555) 000-0000"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b353d]" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Email</label>
            <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="driver@email.com"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b353d]" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">License #</label>
            <input value={form.license} onChange={e => setForm(f => ({ ...f, license: e.target.value }))} placeholder="License number"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b353d]" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Assign Vehicle</label>
            <select value={form.vehicle_id} onChange={e => setForm(f => ({ ...f, vehicle_id: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b353d]">
              <option value="">— None —</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.name} ({v.type})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Commission %</label>
            <input type="number" min={0} max={100} value={form.commission_rate} onChange={e => setForm(f => ({ ...f, commission_rate: Number(e.target.value) }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b353d]" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Notes</label>
            <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b353d]" />
          </div>
        </div>
        {!editing && (
          <p className="text-xs text-slate-500 mt-3">A password is auto-generated and sent to the driver's email address.</p>
        )}
        <div className="flex gap-3 mt-4">
          <button onClick={save} disabled={saving || !form.name || !form.phone}
            className="bg-[#2b353d] hover:bg-[#1e262d] disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">
            {saving ? 'Saving...' : editing ? 'Update' : 'Add Driver'}
          </button>
          {editing && <button onClick={cancelEdit} className="border border-slate-200 text-slate-600 font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-slate-50">Cancel</button>}
        </div>
      </div>

      {/* Driver list */}
      {loading ? <p className="text-slate-500 text-sm">Loading...</p> : (
        <div className="space-y-3">
          {drivers.map(d => (
            <div key={d.id} className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center justify-between gap-4 shadow-sm flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-bold text-slate-900">{d.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${d.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                    {d.active ? 'Active' : 'Inactive'}
                  </span>
                  {d.vehicles && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{d.vehicles.name}</span>}
                  {d.password
                    ? <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">Password ✓</span>
                    : <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-500">No Password</span>
                  }
                </div>
                <p className="text-sm text-slate-500">{d.phone}{d.email ? ` · ${d.email}` : ''}{d.license ? ` · #${d.license}` : ''}</p>
                {d.notes && <p className="text-xs text-slate-500 mt-0.5">{d.notes}</p>}
              </div>
              <div className="flex gap-2 flex-shrink-0 flex-wrap">
                {d.email && (
                  <button
                    onClick={() => emailSent === d.id ? undefined : sendingEmail === d.id ? undefined : sendCredentials(d.id)}
                    disabled={sendingEmail === d.id || !d.password}
                    className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-40">
                    {emailSent === d.id ? 'Sent ✓' : sendingEmail === d.id ? 'Sending...' : 'Send Password'}
                  </button>
                )}
                {d.email && (
                  <button onClick={() => resetPassword(d)}
                    className="text-xs bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors">
                    Reset
                  </button>
                )}
                <button onClick={() => toggleActive(d)} className="text-xs border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                  {d.active ? 'Deactivate' : 'Activate'}
                </button>
                <button onClick={() => startEdit(d)} className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors">Edit</button>
                <button onClick={() => remove(d.id)} className="text-xs bg-red-50 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors">Delete</button>
              </div>
            </div>
          ))}
          {drivers.length === 0 && <p className="text-center text-slate-400 text-sm py-8">No drivers yet.</p>}
        </div>
      )}
    </div>
  )
}
