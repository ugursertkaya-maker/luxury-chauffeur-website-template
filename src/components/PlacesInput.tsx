'use client'
import { useEffect, useRef, useState } from 'react'

interface Suggestion {
  place_id: string
  description: string
}

interface Props {
  value: string
  onChange: (value: string) => void
  onSelect?: (value: string) => void
  onOpenChange?: (open: boolean) => void
  placeholder?: string
  dark?: boolean
  inputClassName?: string
}

export default function PlacesInput({ value, onChange, onSelect, onOpenChange, placeholder, dark, inputClassName }: Props) {
  const [query, setQuery] = useState(value)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  function toggleOpen(val: boolean) { setOpen(val); onOpenChange?.(val) }
  const [loaded, setLoaded] = useState(false)
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!key || key === 'your_google_maps_api_key') return

    const init = () => {
      autocompleteService.current = new window.google.maps.places.AutocompleteService()
      setLoaded(true)
    }

    if (window.google?.maps?.places) { init(); return }

    if (document.querySelector('script[data-gmaps]')) {
      window.addEventListener('gmaps-loaded', init, { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`
    script.async = true
    script.setAttribute('data-gmaps', '1')
    script.onload = () => {
      window.dispatchEvent(new Event('gmaps-loaded'))
      init()
    }
    document.head.appendChild(script)
  }, [])

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        toggleOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    onChange(val)

    if (!loaded || !autocompleteService.current || val.length < 3) {
      setSuggestions([])
      setOpen(false)
      return
    }

    autocompleteService.current.getPlacePredictions(
      { input: val, componentRestrictions: { country: 'us' }, types: ['geocode', 'establishment'], location: new window.google.maps.LatLng(42.3601, -71.0589), radius: 80000 },
      (predictions, status) => {
        if (status === 'OK' && predictions) {
          setSuggestions(predictions.map(p => ({ place_id: p.place_id, description: p.description })))
          toggleOpen(true)
        } else {
          setSuggestions([])
          toggleOpen(false)
        }
      }
    )
  }

  function handleSelect(description: string) {
    setQuery(description)
    onChange(description)
    onSelect?.(description)
    setSuggestions([])
    toggleOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        className={inputClassName ?? (dark
          ? 'w-full bg-transparent text-white placeholder-white/40 text-sm outline-none border-b border-white/20 pb-1 focus:border-white/60 transition-colors'
          : 'w-full border border-[#D4A017]/15 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#475665] focus:ring-2 focus:ring-[#eef0f2]'
        )}
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
        onFocus={() => suggestions.length > 0 && toggleOpen(true)}
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <div className={`absolute z-50 mt-2 rounded-2xl shadow-2xl overflow-hidden ${dark ? 'min-w-[420px] bg-[#0d1520]/70 backdrop-blur-2xl border border-white/10' : 'w-full bg-[#080808] border border-[#D4A017]/15'}`}>
          <ul>
            {suggestions.map(s => {
              const comma = s.description.indexOf(',')
              const main = comma !== -1 ? s.description.slice(0, comma) : s.description
              const secondary = comma !== -1 ? s.description.slice(comma + 2) : ''
              return (
                <li
                  key={s.place_id}
                  onMouseDown={() => handleSelect(s.description)}
                  className={`flex items-center gap-3 px-5 py-3.5 cursor-pointer border-b last:border-0 ${dark ? 'hover:bg-[#080808]/8 border-white/5' : 'hover:bg-[#141414] border-[#D4A017]/10'}`}
                >
                  <svg className={`flex-shrink-0 w-4 h-4 ${dark ? 'text-white' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                  <span className="min-w-0">
                    <span className={`block text-sm font-semibold ${dark ? 'text-white' : 'text-white/90'}`}>{main}</span>
                    {secondary && <span className={`block text-xs mt-0.5 ${dark ? 'text-white' : 'text-white'}`}>{secondary}</span>}
                  </span>
                </li>
              )
            })}
          </ul>
          {dark && (
            <div className="px-5 py-2.5 border-t border-white/5 flex justify-end">
              <span className="text-[10px] text-white tracking-wide">powered by Google</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
