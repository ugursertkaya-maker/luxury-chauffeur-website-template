import { ImageResponse } from 'next/og'
import { brand } from '@/config/brand'

export const runtime = 'edge'
export const alt = `${brand.company.displayName} — ${brand.address.locality} Premier Car Service`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// TODO: only advertise what is true of your own service.
const BADGES = ['Flight Tracking', '24/7 Available', 'Fixed Pricing']

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(160deg, #0f1922 0%, #2b353d 100%)',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Top accent bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #c0cdd6, #475665)', display: 'flex' }} />

        {/* Logo box */}
        <div style={{
          width: 80, height: 80,
          background: 'white',
          borderRadius: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 28,
        }}>
          <span style={{ fontSize: 44, fontWeight: 900, color: '#2b353d' }}>K</span>
        </div>

        {/* Brand label */}
        <div style={{ fontSize: 13, letterSpacing: 8, color: '#8fa4b4', textTransform: 'uppercase', marginBottom: 18, display: 'flex' }}>
          {brand.company.displayName.toUpperCase()}
        </div>

        {/* Main headline */}
        <div style={{ fontSize: 52, fontWeight: 900, color: '#ffffff', textAlign: 'center', lineHeight: 1.15, maxWidth: 820, marginBottom: 18, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span>{brand.address.locality}&apos;s Premier</span>
          <span>Chauffeured Car Service</span>
        </div>

        {/* Sub line */}
        <div style={{ fontSize: 20, color: '#8fa4b4', textAlign: 'center', display: 'flex' }}>
          Airport Transfers  ·  Corporate  ·  Weddings  ·  {brand.service.areaServed}
        </div>

        {/* Badges row */}
        <div style={{ display: 'flex', gap: 16, marginTop: 36 }}>
          {BADGES.map(b => (
            <div key={b} style={{
              display: 'flex',
              background: 'rgba(255,255,255,0.08)',
              borderRadius: 8,
              padding: '8px 18px',
              fontSize: 14,
              color: '#c0cdd6',
            }}>
              {b}
            </div>
          ))}
        </div>

        {/* URL footer */}
        <div style={{ position: 'absolute', bottom: 28, fontSize: 13, color: '#475665', letterSpacing: 2, display: 'flex' }}>
          {brand.site.domain}
        </div>
      </div>
    ),
    { ...size }
  )
}
