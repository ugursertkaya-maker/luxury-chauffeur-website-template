'use client'
import { useEffect, useRef, useState } from 'react'
import { Map, Clock, AlertTriangle } from 'lucide-react'

interface RouteInfo {
  distance: string
  duration: string
  distanceMiles: number
}

interface Props {
  pickup: string
  dropoff: string
  onRouteCalculated?: (info: RouteInfo) => void
}

export default function RouteMap({ pickup, dropoff, onRouteCalculated }: Props) {
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cbRef = useRef(onRouteCalculated)
  cbRef.current = onRouteCalculated

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const mapSrc = pickup && dropoff
    ? `https://www.google.com/maps/embed/v1/directions?key=${key}&origin=${encodeURIComponent(pickup)}&destination=${encodeURIComponent(dropoff)}&mode=driving`
    : null

  useEffect(() => {
    if (!pickup || !dropoff || pickup.length < 5 || dropoff.length < 5) return

    const timer = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/distance?origin=${encodeURIComponent(pickup)}&destination=${encodeURIComponent(dropoff)}`)
        const data = await res.json()
        console.log('Distance API response:', data)
        if (data.distance) {
          setRouteInfo(data)
          cbRef.current?.(data)
        } else {
          setError('Could not calculate route.')
        }
      } catch {
        setError('Could not calculate route.')
      } finally {
        setLoading(false)
      }
    }, 800)

    return () => clearTimeout(timer)
  }, [pickup, dropoff])

  if (!pickup || !dropoff || pickup.length < 5 || dropoff.length < 5) return null

  return (
    <div className="rounded-2xl overflow-hidden border border-[#D4A017]/15 shadow-sm">
      {mapSrc && (
        <iframe
          src={mapSrc}
          width="100%"
          height="220"
          style={{ border: 0, display: 'block' }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      )}
      <div className="bg-[#080808] px-4 py-3 border-t border-[#D4A017]/10">
        {loading && (
          <div className="flex items-center gap-2 text-sm text-white">
            <div className="w-3 h-3 border-2 border-[#475665] border-t-transparent rounded-full animate-spin" />
            Calculating route...
          </div>
        )}
        {routeInfo && !loading && (
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <Map className="w-4 h-4 text-white" strokeWidth={1.5} />
              <div>
                <p className="text-xs text-white">Distance</p>
                <p className="text-sm font-bold text-white">{routeInfo.distance}</p>
              </div>
            </div>
            <div className="w-px h-7 bg-[#141414]" />
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-white" strokeWidth={1.5} />
              <div>
                <p className="text-xs text-white">Est. Drive Time</p>
                <p className="text-sm font-bold text-white">{routeInfo.duration}</p>
              </div>
            </div>
          </div>
        )}
        {error && <p className="text-xs text-red-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" strokeWidth={1.5} />{error}</p>}
      </div>
    </div>
  )
}
