'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import PlacesInput from '@/components/PlacesInput'
import { brand } from '@/config/brand'

type CountyRow = {
  id: string
  county: string
  sedan_base: number
  sedan_per_mile: number
  suv_base: number
  suv_per_mile: number
  min_fare: number
  sedan_hourly: number | null
  suv_hourly: number | null
  sedan_event: number | null
  suv_event: number | null
  county_cities: string[]
  updated_at: string
}

type CityRow = {
  id?: string
  county: string
  city: string
  sedan_base: number
  sedan_per_mile: number
  suv_base: number
  suv_per_mile: number
  min_fare: number
}

type Surcharge = {
  id: string
  key: string
  label: string
  amount: number
  description: string
}

const SPECIAL: Record<string, string> = {
  '__default__': 'Default Rate (all areas)',
  '__usa_default__': 'Rest of USA',
}

const PRICE_FIELDS: { key: keyof CountyRow; label: string; tooltip?: string }[] = [
  { key: 'sedan_base', label: 'Sedan Base' },
  { key: 'sedan_per_mile', label: 'Sedan /mi' },
  { key: 'suv_base', label: 'SUV Base' },
  { key: 'suv_per_mile', label: 'SUV /mi' },
  { key: 'min_fare', label: 'Min Fare', tooltip: 'Minimum fare for this county — calculated price cannot go below this' },
]

function PriceInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="relative inline-flex items-center">
      <span className="absolute left-2 text-slate-400 text-xs pointer-events-none">$</span>
      <input
        type="number" step="0.01" min="0"
        value={value}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className="w-20 pl-5 pr-1 py-1.5 text-center border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#2b353d] focus:ring-1 focus:ring-[#2b353d] bg-white"
      />
    </div>
  )
}

// ─── Surcharges Section ──────────────────────────────────────────────────────
function SurchargesSection() {
  const [surcharges, setSurcharges] = useState<Surcharge[]>([])
  const [editing, setEditing] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/admin/pricing/surcharges').then(r => r.json()).then(d => {
      setSurcharges(d ?? [])
    })
  }, [])

  const isDirty = Object.keys(editing).length > 0

  function getAmt(s: Surcharge) {
    return editing[s.key] !== undefined ? editing[s.key] : s.amount
  }

  async function saveSurcharges() {
    setSaving(true)
    const payload = surcharges.map(s => ({
      key: s.key, label: s.label, description: s.description,
      amount: getAmt(s),
    }))
    await fetch('/api/admin/pricing/surcharges', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    })
    setSurcharges(prev => prev.map(s => ({ ...s, amount: getAmt(s) })))
    setEditing({})
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const ICONS: Record<string, string> = {
    night_fee: '🌙',
    weekend_fee: '📅',
    airport_meetgreet: '✋',
    airport_pickup: '✈️',
    airport_dropoff: '🛬',
    suv_hourly: '🚙',
    sedan_hourly: '🚗',
    suv_event: '🎉',
    sedan_event: '🎊',
  }

  function SurchargeCard({ s }: { s: Surcharge }) {
    return (
      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
        <div className="text-lg mb-1">{ICONS[s.key] ?? '💲'}</div>
        <div className="text-xs font-semibold text-slate-700 mb-0.5 leading-tight">{s.label}</div>
        <div className="text-xs text-slate-500 mb-2 leading-tight">{s.description}</div>
        <div className="relative inline-flex items-center">
          <span className="absolute left-2 text-slate-400 text-xs pointer-events-none">$</span>
          <input
            type="number" step="1" min="0"
            value={getAmt(s)}
            onChange={e => setEditing(prev => ({ ...prev, [s.key]: parseFloat(e.target.value) || 0 }))}
            className="w-20 pl-5 pr-1 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#2b353d] bg-white"
          />
        </div>
      </div>
    )
  }

  if (!surcharges.length) return null

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Extra Charges</h2>
          <p className="text-xs text-slate-500 mt-0.5">Automatically added fees based on conditions</p>
        </div>
        {isDirty && (
          <button onClick={saveSurcharges} disabled={saving}
            className="bg-[#2b353d] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#1e262d] disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
        )}
        {saved && !isDirty && <span className="text-green-600 font-semibold text-sm">✓ Kaydedildi</span>}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {surcharges.map(s => <SurchargeCard key={s.key} s={s} />)}
      </div>
    </div>
  )
}

// ─── Add County Modal ────────────────────────────────────────────────────────
function AddCountyModal({ onClose, onAdd }: { onClose: () => void; onAdd: (row: CountyRow) => void }) {
  const [countyName, setCountyName] = useState('')
  const [state, setState] = useState(brand.address.region)
  const [cities, setCities] = useState<string[]>([])
  const [fetching, setFetching] = useState(false)
  const [fetched, setFetched] = useState(false)
  const [prices, setPrices] = useState({ sedan_base: 85, sedan_per_mile: 1.47, suv_base: 90, suv_per_mile: 2.32, min_fare: 85 })
  const [saving, setSaving] = useState(false)
  const [customCities, setCustomCities] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const countyKey = countyName.trim().includes('County') ? countyName.trim() : `${countyName.trim()} County`

  async function fetchCities(nameOverride?: string, stateOverride?: string) {
    const key = nameOverride ?? countyKey
    const st = stateOverride ?? state
    if (!key.trim()) return
    setFetching(true)
    const res = await fetch(`/api/admin/pricing/county-cities?county=${encodeURIComponent(key)}&state=${st}`)
    const d = await res.json()
    setCities(d.cities ?? [])
    setCustomCities((d.cities ?? []).join(', '))
    setFetched(true)
    setFetching(false)
  }

  function onCountyChange(val: string) {
    setCountyName(val)
    setFetched(false)
    setCities([])
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const key = val.trim().includes('County') ? val.trim() : `${val.trim()} County`
    if (val.trim().length >= 3) {
      debounceRef.current = setTimeout(() => fetchCities(key, state), 600)
    }
  }

  function onStateChange(val: string) {
    setState(val)
    if (countyName.trim().length >= 3) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => fetchCities(countyKey, val), 300)
    }
  }

  async function addCounty() {
    setSaving(true)
    const finalCities = customCities.split(',').map(c => c.trim()).filter(Boolean)
    const res = await fetch('/api/admin/pricing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ county: countyKey, ...prices, county_cities: finalCities }),
    })
    const data = await res.json()
    if (res.ok) {
      // Also create city_pricing rows for all cities (bulk)
      if (finalCities.length > 0) {
        const cityRows = finalCities.map(city => ({ county: countyKey, city, ...prices }))
        await fetch('/api/admin/pricing/city-pricing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cityRows),
        })
      }
      onAdd(data)
    }
    setSaving(false)
  }

  const US_STATES = [
    'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
    'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
    'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
    'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
    'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
  ]

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-lg">Add New County</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none">×</button>
        </div>
        <div className="p-6 space-y-5">
          {/* County name + state */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">County Name</label>
              <input
                type="text" value={countyName}
                onChange={e => onCountyChange(e.target.value)}
                placeholder="Suffolk"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#2b353d]"
              />
            </div>
            <div className="w-24">
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">State</label>
              <select value={state} onChange={e => onStateChange(e.target.value)}
                className="w-full px-2 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#2b353d] bg-white">
                {US_STATES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              {fetching
                ? <div className="px-4 py-2 text-sm text-slate-500">Loading…</div>
                : fetched && cities.length === 0
                  ? <button onClick={() => fetchCities()} className="px-4 py-2 bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-300 whitespace-nowrap">Tekrar Dene</button>
                  : null
              }
            </div>
          </div>

          {/* Cities */}
          {fetched && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                {cities.length > 0 ? `${cities.length} cities found — you can edit` : 'No cities found — enter manually'}
              </label>
              <textarea
                value={customCities}
                onChange={e => setCustomCities(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#2b353d] resize-none"
                placeholder="Example City, Riverside, Lakeside, ..."
              />
              <p className="text-xs text-slate-400 mt-1">Separate with commas. Edit to complete the list.</p>
            </div>
          )}

          {/* Default pricing for all cities in this county */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-sm font-bold text-slate-700">County Pricing</h4>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">applies to all cities</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {PRICE_FIELDS.map(f => (
                <div key={f.key}>
                  <label className="block text-xs text-slate-500 mb-1 text-center">{f.label}</label>
                  <PriceInput value={prices[f.key as keyof typeof prices]} onChange={v => setPrices(prev => ({ ...prev, [f.key]: v }))} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900">Cancel</button>
          <button
            onClick={addCounty}
            disabled={!countyName.trim() || saving}
            className="px-5 py-2 bg-[#2b353d] text-white text-sm font-bold rounded-lg hover:bg-[#1e262d] disabled:opacity-50"
          >
            {saving ? 'Adding…' : 'Add County'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── County Row (expandable) ──────────────────────────────────────────────────
function CountyRowComponent({
  row, cityRows, onSave, onDelete, onSaveCities, disabled,
}: {
  row: CountyRow
  cityRows: CityRow[]
  onSave: (row: CountyRow, edits: Partial<CountyRow>) => Promise<void>
  onDelete: (county: string) => void
  onSaveCities: (county: string, cities: CityRow[]) => Promise<void>
  disabled?: boolean
}) {
  const [edits, setEdits] = useState<Partial<CountyRow>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [cityEdits, setCityEdits] = useState<Record<string, Partial<CityRow>>>({})
  const [savingCities, setSavingCities] = useState(false)
  const [savedCities, setSavedCities] = useState(false)
  const [bulkPrices, setBulkPrices] = useState({ sedan_base: row.sedan_base, sedan_per_mile: row.sedan_per_mile, suv_base: row.suv_base, suv_per_mile: row.suv_per_mile, min_fare: row.min_fare })
  const [applyingBulk, setApplyingBulk] = useState(false)
  const [hourlyEdits, setHourlyEdits] = useState<Partial<Record<'sedan_hourly'|'suv_hourly'|'sedan_event'|'suv_event', number>>>({})
  const [savingHourly, setSavingHourly] = useState(false)
  const [savedHourly, setSavedHourly] = useState(false)
  const [fetchingCities, setFetchingCities] = useState(false)
  const [fetchedCities, setFetchedCities] = useState<string[]>(row.county_cities ?? [])

  const isSpecial = row.county.startsWith('__')
  const isDirty = Object.keys(edits).length > 0
  const isCityDirty = Object.keys(cityEdits).length > 0

  function getVal(f: keyof CountyRow): number {
    return (edits[f] as number) ?? (row[f] as number)
  }

  function getCityVal(city: string, f: keyof CityRow): number {
    const cr = cityRows.find(c => c.city === city)
    return (cityEdits[city]?.[f] as number) ?? (cr?.[f] as number) ?? (row[f as keyof CountyRow] as number) ?? 0
  }

  async function handleSave() {
    setSaving(true)
    await onSave(row, edits)
    setEdits({})
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setSaving(false)
  }

  async function applyBulkToCities() {
    if (!cities.length) return
    setApplyingBulk(true)
    const newCityRows = cities.map(city => ({ county: row.county, city, ...bulkPrices }))
    await onSaveCities(row.county, newCityRows)
    setApplyingBulk(false)
  }

  async function handleSaveCities() {
    setSavingCities(true)
    const updatedCities = cityRows.map(cr => ({
      county: cr.county, city: cr.city,
      sedan_base: (cityEdits[cr.city]?.sedan_base as number) ?? cr.sedan_base,
      sedan_per_mile: (cityEdits[cr.city]?.sedan_per_mile as number) ?? cr.sedan_per_mile,
      suv_base: (cityEdits[cr.city]?.suv_base as number) ?? cr.suv_base,
      suv_per_mile: (cityEdits[cr.city]?.suv_per_mile as number) ?? cr.suv_per_mile,
      min_fare: (cityEdits[cr.city]?.min_fare as number) ?? cr.min_fare,
    }))
    await onSaveCities(row.county, updatedCities)
    setCityEdits({})
    setSavedCities(true)
    setTimeout(() => setSavedCities(false), 2000)
    setSavingCities(false)
  }

  type HourlyKey = 'sedan_hourly' | 'suv_hourly' | 'sedan_event' | 'suv_event'
  const HOURLY_FIELDS: { key: HourlyKey; label: string; icon: string }[] = [
    { key: 'sedan_hourly', label: 'Sedan /hr', icon: '🚗' },
    { key: 'suv_hourly',   label: 'SUV /hr',   icon: '🚙' },
    { key: 'sedan_event',  label: 'Sedan Event',  icon: '🎊' },
    { key: 'suv_event',    label: 'SUV Event',    icon: '🎉' },
  ]

  function getHourlyVal(k: HourlyKey): number {
    return hourlyEdits[k] !== undefined ? (hourlyEdits[k] as number) : (row[k] ?? 0)
  }

  async function saveHourly() {
    setSavingHourly(true)
    const payload: Partial<CountyRow> = {
      county: row.county,
      sedan_base: row.sedan_base, sedan_per_mile: row.sedan_per_mile,
      suv_base: row.suv_base, suv_per_mile: row.suv_per_mile, min_fare: row.min_fare,
      sedan_hourly: getHourlyVal('sedan_hourly') || null,
      suv_hourly:   getHourlyVal('suv_hourly')   || null,
      sedan_event:  getHourlyVal('sedan_event')  || null,
      suv_event:    getHourlyVal('suv_event')    || null,
    }
    await fetch('/api/admin/pricing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    setHourlyEdits({})
    setSavingHourly(false)
    setSavedHourly(true)
    setTimeout(() => setSavedHourly(false), 2000)
  }

  const isHourlyDirty = Object.keys(hourlyEdits).length > 0
  const cities = fetchedCities.length > 0 ? fetchedCities : (row.county_cities?.length ? row.county_cities : cityRows.map(c => c.city))

  async function fetchAndSaveCities() {
    setFetchingCities(true)
    try {
      const res = await fetch(`/api/admin/pricing/county-cities?county=${encodeURIComponent(row.county)}`)
      const json = await res.json() as { cities?: string[] }
      const fetched = json.cities ?? []
      if (fetched.length > 0) {
        setFetchedCities(fetched)
        await fetch('/api/admin/pricing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            county: row.county,
            sedan_base: row.sedan_base, sedan_per_mile: row.sedan_per_mile,
            suv_base: row.suv_base, suv_per_mile: row.suv_per_mile, min_fare: row.min_fare,
            county_cities: fetched,
          }),
        })
      }
    } finally {
      setFetchingCities(false)
    }
  }

  if (disabled) {
    return (
      <div className="border border-slate-100 rounded-xl overflow-hidden mb-3 opacity-40">
        <div className="flex items-center gap-2 px-4 py-3 bg-slate-50">
          <span className="flex-shrink-0 w-6 h-6" />
          <span className="w-48 font-semibold text-slate-400 text-sm truncate flex-shrink-0">
            {SPECIAL[row.county] ?? row.county}
          </span>
          {PRICE_FIELDS.map(f => (
            <div key={f.key} className={`flex-1 ${f.key === 'min_fare' ? 'border-l border-amber-200 pl-2' : ''}`}>
              <div className="relative inline-flex items-center">
                <span className="absolute left-2 text-slate-300 text-xs pointer-events-none">$</span>
                <input
                  type="number" value={getVal(f.key)} disabled
                  className="w-20 pl-5 pr-1 py-1.5 text-center border border-slate-100 rounded-lg text-sm bg-slate-50 text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>
          ))}
          <div className="w-24 flex-shrink-0 flex items-center justify-end">
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Disabled</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden mb-3">
      {/* County header row */}
      <div className={`flex items-center gap-2 px-4 py-3 ${isSpecial ? 'bg-slate-50' : 'bg-white'} hover:bg-blue-50/20 transition-colors`}>
        <button
          onClick={() => !isSpecial && setExpanded(e => !e)}
          className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded transition-colors ${!isSpecial ? 'hover:bg-slate-200 cursor-pointer' : 'cursor-default opacity-0'}`}
        >
          <span className={`text-slate-400 text-xs transition-transform ${expanded ? 'rotate-90' : ''}`}>▶</span>
        </button>

        <span className="w-48 font-semibold text-[#2b353d] text-sm truncate flex-shrink-0">
          {SPECIAL[row.county] ?? row.county}
        </span>

        {PRICE_FIELDS.map(f => (
          <div key={f.key} className={`flex-1 ${f.key === 'min_fare' ? 'border-l border-amber-200 pl-2' : ''}`}>
            <PriceInput value={getVal(f.key)} onChange={v => setEdits(prev => ({ ...prev, [f.key]: v }))} />
          </div>
        ))}

        <div className="w-24 flex-shrink-0 flex items-center justify-end gap-2">
          {saved ? (
            <span className="text-green-600 font-semibold text-xs">✓</span>
          ) : isDirty ? (
            <button onClick={handleSave} disabled={saving}
              className="bg-[#2b353d] text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-[#1e262d] disabled:opacity-50">
              {saving ? '…' : 'Save'}
            </button>
          ) : (
            !isSpecial && (
              <button onClick={() => onDelete(row.county)}
                className="text-red-400 hover:text-red-600 text-xs px-2 py-1 rounded hover:bg-red-50 transition-colors">
                Delete
              </button>
            )
          )}
        </div>
      </div>

      {/* Expanded: hourly rates + cities */}
      {expanded && !isSpecial && (
        <div className="border-t border-slate-100 bg-slate-50/50">
          {/* Hourly rates */}
          <div className="px-6 py-4 bg-amber-50/50 border-b border-amber-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">Hourly Rates</span>
              <div className="flex items-center gap-2">
                {savedHourly && <span className="text-green-600 text-xs font-semibold">✓ Saved</span>}
                {isHourlyDirty && (
                  <button onClick={saveHourly} disabled={savingHourly}
                    className="bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-amber-700 disabled:opacity-50">
                    {savingHourly ? '…' : 'Save'}
                  </button>
                )}
              </div>
            </div>
            <div className="flex gap-4 flex-wrap">
              {HOURLY_FIELDS.map(f => (
                <div key={f.key} className="flex flex-col items-center gap-1">
                  <span className="text-base">{f.icon}</span>
                  <span className="text-[10px] text-slate-500 font-medium">{f.label}</span>
                  <div className="relative inline-flex items-center">
                    <span className="absolute left-2 text-slate-400 text-xs pointer-events-none">$</span>
                    <input
                      type="number" step="1" min="0"
                      value={getHourlyVal(f.key)}
                      onChange={e => setHourlyEdits(prev => ({ ...prev, [f.key]: parseFloat(e.target.value) || 0 }))}
                      className="w-20 pl-5 pr-1 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-500 bg-white"
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-amber-700 mt-2">If set to 0, the default rate will be used.</p>
          </div>

          {/* Bulk apply bar */}
          <div className="px-6 py-3 bg-blue-50/60 border-b border-blue-100 flex items-center gap-3 flex-wrap">
            <span className="text-xs font-semibold text-blue-700">Apply to All Cities:</span>
            {PRICE_FIELDS.map(f => (
              <div key={f.key} className="flex flex-col items-center gap-0.5">
                <span className="text-[10px] text-slate-500">{f.label}</span>
                <PriceInput value={bulkPrices[f.key as keyof typeof bulkPrices]} onChange={v => setBulkPrices(prev => ({ ...prev, [f.key]: v }))} />
              </div>
            ))}
            <button
              onClick={applyBulkToCities}
              disabled={applyingBulk || cities.length === 0}
              className="ml-2 px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {applyingBulk ? '…' : `Apply to ${cities.length} Cities`}
            </button>
          </div>

          {/* City rows */}
          {cityRows.length === 0 && cities.length === 0 && (
            <div className="px-6 py-5 flex flex-col items-center gap-3 text-center">
              <p className="text-sm text-slate-400">No city list for this county.</p>
              <button
                onClick={fetchAndSaveCities}
                disabled={fetchingCities}
                className="px-4 py-2 bg-slate-700 text-white text-xs font-bold rounded-lg hover:bg-slate-800 disabled:opacity-50"
              >
                {fetchingCities ? 'Fetching…' : 'Fetch Cities'}
              </button>
            </div>
          )}

          {cityRows.length > 0 && (
            <>
              <div className="px-6 py-2 grid text-[10px] font-semibold text-slate-500 uppercase tracking-wide" style={{ gridTemplateColumns: '1fr 80px 80px 80px 80px 80px' }}>
                <span>City</span>
                <span className="text-center">Sedan Base</span>
                <span className="text-center">Sed /mi</span>
                <span className="text-center">SUV Base</span>
                <span className="text-center">SUV /mi</span>
                <span className="text-center">Min</span>
              </div>
              <div className="divide-y divide-slate-100">
                {cityRows.map(cr => (
                  <div key={cr.city} className="px-6 py-2 grid items-center gap-2" style={{ gridTemplateColumns: '1fr 80px 80px 80px 80px 80px' }}>
                    <span className="text-sm text-slate-700 font-medium">{cr.city}</span>
                    {(['sedan_base','sedan_per_mile','suv_base','suv_per_mile','min_fare'] as const).map(f => (
                      <PriceInput
                        key={f}
                        value={getCityVal(cr.city, f)}
                        onChange={v => setCityEdits(prev => ({ ...prev, [cr.city]: { ...prev[cr.city], [f]: v } }))}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <div className="px-6 py-3 flex justify-end gap-3 border-t border-slate-100">
                {savedCities && <span className="text-green-600 font-semibold text-xs self-center">✓ Saved</span>}
                {isCityDirty && (
                  <button onClick={handleSaveCities} disabled={savingCities}
                    className="bg-[#2b353d] text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-[#1e262d] disabled:opacity-50">
                    {savingCities ? '…' : 'Save Cities'}
                  </button>
                )}
              </div>
            </>
          )}

          {/* City list from county_cities (not yet in city_pricing) */}
          {cityRows.length === 0 && cities.length > 0 && (
            <div className="px-6 py-3 text-xs text-slate-500">
              <span className="font-semibold">{cities.length} cities defined:</span>{' '}
              {cities.join(', ')}
              <p className="mt-1 text-slate-400">Use "Apply to All Cities" above to add pricing.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Price Tester ─────────────────────────────────────────────────────────────
type TestResult = {
  total: number
  base: number
  distance_charge: number
  time_charge: number
  surcharges: { label: string; amount: number }[]
  distance_text: string
  duration_text: string
  distance_miles: number
  per_mile: number | null
  per_hour: number | null
  county_rates: {
    sedan_base: number; sedan_per_mile: number
    suv_base: number; suv_per_mile: number; min_fare: number
  } | null
}

const SERVICE_TYPES = [
  { value: 'airport', label: 'Airport Transfer' },
  { value: 'corporate', label: 'Corporate / Point-to-Point' },
  { value: 'hourly', label: 'Hourly (As Directed)' },
  { value: 'event', label: 'Event / Wedding' },
  { value: 'cruise', label: 'Cruise Port' },
]

function PriceTester() {
  const [pickup, setPickup] = useState('')
  const [dropoff, setDropoff] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [time, setTime] = useState('09:00')
  const [vehicle, setVehicle] = useState('suv')
  const [serviceType, setServiceType] = useState('airport')
  const [meetGreet, setMeetGreet] = useState(false)
  const [hours, setHours] = useState(2)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(true)

  const isHourly = serviceType === 'hourly' || serviceType === 'event'

  async function calculate() {
    if (!pickup.trim() || !dropoff.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    const res = await fetch('/api/admin/pricing/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pickup, dropoff, date, time, vehicle, service_type: serviceType, meet_greet: meetGreet, hours }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'An error occurred'); setLoading(false); return }
    setResult(data as TestResult)
    setLoading(false)
  }

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm mb-8 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">🧮</span>
          <div className="text-left">
            <div className="font-bold text-slate-900 text-sm">Price Tester</div>
            <div className="text-xs text-slate-500">Simulate fare between two addresses</div>
          </div>
        </div>
        <span className={`text-slate-400 text-xs transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {open && (
        <div className="border-t border-slate-100 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Pickup Adresi</label>
              <PlacesInput
                value={pickup}
                onChange={setPickup}
                onSelect={setPickup}
                placeholder="Example Airport, Terminal 1"
                inputClassName="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b353d]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Dropoff Adresi</label>
              <PlacesInput
                value={dropoff}
                onChange={setDropoff}
                onSelect={setDropoff}
                placeholder="Example Grand Hotel"
                inputClassName="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b353d]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tarih</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b353d]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Saat</label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b353d]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Vehicle Type</label>
              <select
                value={vehicle}
                onChange={e => setVehicle(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b353d] bg-white"
              >
                <option value="suv">SUV</option>
                <option value="sedan">Sedan</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Transfer Tipi</label>
              <select
                value={serviceType}
                onChange={e => setServiceType(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b353d] bg-white"
              >
                {SERVICE_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            {isHourly && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Number of Hours</label>
                <input
                  type="number" min={1} max={24}
                  value={hours}
                  onChange={e => setHours(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b353d]"
                />
              </div>
            )}
            {serviceType === 'airport' && (
              <div className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox" id="mg-check" checked={meetGreet}
                  onChange={e => setMeetGreet(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#2b353d]"
                />
                <label htmlFor="mg-check" className="text-sm font-medium text-slate-700">Meet &amp; Greet</label>
              </div>
            )}
          </div>

          <button
            onClick={calculate}
            disabled={loading || !pickup.trim() || !dropoff.trim()}
            className="bg-[#2b353d] hover:bg-[#1e262d] disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors"
          >
            {loading ? 'Calculating…' : '🧮 Calculate Price'}
          </button>

          {error && (
            <div className="mt-4 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">{error}</div>
          )}

          {result && (
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sol: detay */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Price Breakdown</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">📍 Mesafe</span>
                    <span className="font-semibold text-slate-800">{result.distance_text} ({result.distance_miles} mi)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">⏱ Duration</span>
                    <span className="font-semibold text-slate-800">{result.duration_text}</span>
                  </div>
                  {result.county_rates && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">📊 Uygulanan Tarife</span>
                      <span className="font-semibold text-slate-800">
                        {vehicle === 'suv'
                          ? `$${result.county_rates.suv_base} base + $${result.county_rates.suv_per_mile}/mi`
                          : `$${result.county_rates.sedan_base} base + $${result.county_rates.sedan_per_mile}/mi`}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-slate-200 pt-2 mt-2 space-y-1.5">
                    {result.base > 0 && (
                      <div className="flex justify-between text-slate-700">
                        <span>Base Fare</span>
                        <span>${result.base.toFixed(2)}</span>
                      </div>
                    )}
                    {result.distance_charge > 0 && (
                      <div className="flex justify-between text-slate-700">
                        <span>{result.distance_miles} mi × ${result.per_mile}/mi</span>
                        <span>${result.distance_charge.toFixed(2)}</span>
                      </div>
                    )}
                    {result.time_charge > 0 && (
                      <div className="flex justify-between text-slate-700">
                        <span>{hours}h × ${result.per_hour}/hr</span>
                        <span>${result.time_charge.toFixed(2)}</span>
                      </div>
                    )}
                    {result.surcharges.map((s, i) => (
                      <div key={i} className="flex justify-between text-amber-700">
                        <span>{s.label}</span>
                        <span>+${s.amount.toFixed(2)}</span>
                      </div>
                    ))}
                    {result.county_rates && (
                      <div className="flex justify-between text-slate-500 text-xs">
                        <span>Min Fare</span>
                        <span>${result.county_rates.min_fare.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: total */}
              <div className="bg-[#2b353d] rounded-xl p-4 flex flex-col items-center justify-center text-center">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tahmini Fiyat</div>
                <div className="text-4xl font-black text-white mb-1">${result.total.toFixed(2)}</div>
                <div className="text-xs text-slate-400 mb-4">
                  {vehicle === 'suv' ? 'SUV' : 'Sedan'} · {SERVICE_TYPES.find(s => s.value === serviceType)?.label}
                </div>
                <div className="text-[10px] text-slate-500 leading-relaxed">
                  Discount code not applied.<br />
                  Actual fare may vary based on exact address entered.
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PricingPage() {
  const [countyRows, setCountyRows] = useState<CountyRow[]>([])
  const [cityRows, setCityRows] = useState<CityRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [cr, ci] = await Promise.all([
      fetch('/api/admin/pricing').then(r => r.json()),
      fetch('/api/admin/pricing/city-pricing').then(r => r.json()),
    ])
    setCountyRows(cr ?? [])
    setCityRows(ci ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function saveCounty(row: CountyRow, edits: Partial<CountyRow>) {
    const payload = { county: row.county, ...Object.fromEntries(PRICE_FIELDS.map(f => [f.key, (edits[f.key as keyof CountyRow] as number) ?? (row[f.key as keyof CountyRow] as number)])) }
    const res = await fetch('/api/admin/pricing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (res.ok) {
      const updated = await res.json()
      setCountyRows(prev => prev.map(r => r.county === row.county ? updated : r))
    }
  }

  async function deleteCounty(county: string) {
    if (!confirm(`Delete "${county}" county and all its city pricing?`)) return
    setDeleting(county)
    await fetch('/api/admin/pricing', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ county }) })
    setCountyRows(prev => prev.filter(r => r.county !== county))
    setCityRows(prev => prev.filter(r => r.county !== county))
    setDeleting(null)
  }

  async function saveCities(county: string, cities: CityRow[]) {
    const res = await fetch('/api/admin/pricing/city-pricing', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cities),
    })
    if (res.ok) {
      const updated = await res.json() as CityRow[]
      setCityRows(prev => {
        const filtered = prev.filter(r => r.county !== county)
        return [...filtered, ...updated]
      })
    }
  }

  if (loading) return (
    <div className="space-y-3">
      {[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-slate-200 rounded-xl animate-pulse" />)}
    </div>
  )

  const special = countyRows.filter(r => r.county.startsWith('__'))
  const counties = countyRows.filter(r => !r.county.startsWith('__'))

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900">Pricing Management</h1>
        <p className="text-xs text-slate-500 mt-1">Single flat-rate policy active — the &ldquo;Default Rate (all areas)&rdquo; row is used for every region.</p>
      </div>

      {/* Price Tester */}
      <PriceTester />

      {/* Surcharges */}
      <SurchargesSection />

      {/* Active rate */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Aktif Fiyat</h2>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Aktif</span>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 border-b border-slate-100">
              <span className="w-6" />
              <span className="w-48 text-[10px] font-bold text-slate-500 uppercase tracking-wide">Region</span>
              {PRICE_FIELDS.map(f => (
                <span key={f.key} title={f.tooltip} className={`flex-1 text-[10px] font-bold uppercase tracking-wide text-center ${f.key === 'min_fare' ? 'text-amber-600' : 'text-slate-500'}`}>
                  {f.label}{f.key === 'min_fare' ? ' ↓' : ''}
                </span>
              ))}
              <span className="w-24" />
            </div>
            {special.filter(r => r.county === '__default__').map(row => (
              <CountyRowComponent key={row.county} row={row} cityRows={[]} onSave={saveCounty} onDelete={deleteCounty} onSaveCities={saveCities} />
            ))}
          </div>
        </div>
      </div>

      {/* Disabled rates (reference only) */}
      {(special.filter(r => r.county !== '__default__').length > 0 || counties.length > 0) && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Inactive Rates</h2>
            <span className="text-xs bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full font-semibold">Not in use</span>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
            <div className="min-w-[640px]">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-b border-slate-100">
                <span className="w-6" />
                <span className="w-48 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Region / County</span>
                {PRICE_FIELDS.map(f => (
                  <span key={f.key} className="flex-1 text-[10px] font-bold uppercase tracking-wide text-center text-slate-400">
                    {f.label}
                  </span>
                ))}
                <span className="w-24" />
              </div>
              {special.filter(r => r.county !== '__default__').map(row => (
                <CountyRowComponent key={row.county} row={row} cityRows={[]} onSave={saveCounty} onDelete={deleteCounty} onSaveCities={saveCities} disabled />
              ))}
              {counties.map(row => (
                <CountyRowComponent
                  key={row.county}
                  row={row}
                  cityRows={[]}
                  onSave={saveCounty}
                  onDelete={deleteCounty}
                  onSaveCities={saveCities}
                  disabled
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
