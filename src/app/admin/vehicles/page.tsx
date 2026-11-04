'use client'
import { useEffect, useState } from 'react'

interface Vehicle {
  id: string
  name: string
  type: string
  make?: string
  model?: string
  plate?: string
  capacity: number
  luggage: number
  active: boolean
  notes?: string
}

const EMPTY: Omit<Vehicle, 'id'> = { name: '', type: 'suv', make: '', model: '', plate: '', capacity: 6, luggage: 4, active: true, notes: '' }

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<Omit<Vehicle, 'id'>>(EMPTY)
  const [editing, setEditing] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/admin/vehicles').then(r => r.json()).then(d => { setVehicles(d); setLoading(false) })
  }, [])

  function startEdit(v: Vehicle) {
    setEditing(v.id)
    setForm({ name: v.name, type: v.type, make: v.make ?? '', model: v.model ?? '', plate: v.plate ?? '', capacity: v.capacity, luggage: v.luggage, active: v.active, notes: v.notes ?? '' })
  }

  function cancelEdit() { setEditing(null); setForm(EMPTY) }

  async function save() {
    setSaving(true)
    if (editing) {
      const res = await fetch(`/api/admin/vehicles/${editing}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      setVehicles(prev => prev.map(v => v.id === editing ? data : v))
      setEditing(null)
    } else {
      const res = await fetch('/api/admin/vehicles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      setVehicles(prev => [data, ...prev])
    }
    setForm(EMPTY)
    setSaving(false)
  }

  async function remove(id: string) {
    if (!confirm('Delete this vehicle?')) return
    await fetch(`/api/admin/vehicles/${id}`, { method: 'DELETE' })
    setVehicles(prev => prev.filter(v => v.id !== id))
  }

  async function toggleActive(v: Vehicle) {
    const res = await fetch(`/api/admin/vehicles/${v.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !v.active }) })
    const data = await res.json()
    setVehicles(prev => prev.map(x => x.id === v.id ? data : x))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-extrabold text-slate-900">Vehicles</h2>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-4">{editing ? 'Edit Vehicle' : 'Add Vehicle'}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Premium SUV"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b353d]" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Make</label>
            <input value={form.make ?? ''} onChange={e => setForm(f => ({ ...f, make: e.target.value }))} placeholder="e.g. your vehicle make"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b353d]" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Model</label>
            <input value={form.model ?? ''} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} placeholder="e.g. your make and model"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b353d]" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Plate</label>
            <input value={form.plate ?? ''} onChange={e => setForm(f => ({ ...f, plate: e.target.value }))} placeholder="e.g. ABC1234"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b353d]" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Type</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b353d]">
              <option value="sedan">Sedan</option>
              <option value="suv">SUV</option>
              <option value="sprinter">Sprinter</option>
              <option value="limo">Limo</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Passengers</label>
            <input type="number" min={1} max={20} value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: Number(e.target.value) }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b353d]" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Luggage</label>
            <input type="number" min={0} max={20} value={form.luggage} onChange={e => setForm(f => ({ ...f, luggage: Number(e.target.value) }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b353d]" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Notes</label>
            <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b353d]" />
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={save} disabled={saving || !form.name}
            className="bg-[#2b353d] hover:bg-[#1e262d] disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">
            {saving ? 'Saving...' : editing ? 'Update' : 'Add Vehicle'}
          </button>
          {editing && <button onClick={cancelEdit} className="border border-slate-200 text-slate-600 font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-slate-50">Cancel</button>}
        </div>
      </div>

      {loading ? <p className="text-slate-500 text-sm">Loading...</p> : (
        <div className="space-y-3">
          {vehicles.map(v => (
            <div key={v.id} className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center justify-between gap-4 shadow-sm">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-slate-900">{v.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">{v.type}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${v.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                    {v.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-sm text-slate-500">{v.capacity} passengers · {v.luggage} luggage{v.plate ? ` · ${v.make} ${v.model} · ${v.plate}` : ''}{v.notes ? ` · ${v.notes}` : ''}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => toggleActive(v)} className="text-xs border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                  {v.active ? 'Deactivate' : 'Activate'}
                </button>
                <button onClick={() => startEdit(v)} className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors">Edit</button>
                <button onClick={() => remove(v.id)} className="text-xs bg-red-50 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors">Delete</button>
              </div>
            </div>
          ))}
          {vehicles.length === 0 && <p className="text-center text-slate-400 text-sm py-8">No vehicles yet.</p>}
        </div>
      )}
    </div>
  )
}
