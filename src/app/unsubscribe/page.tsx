'use client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function UnsubscribeContent() {
  const params = useSearchParams()
  const done = params.get('done') === '1'
  const email = params.get('email') ?? ''

  return (
    <main style={{ minHeight: '100vh', background: '#0f1922', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 440, width: '100%', margin: '0 16px', background: '#1a2530', borderRadius: 16, padding: '48px 40px', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, background: done ? '#22c55e22' : '#2b353d', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 24 }}>
          {done ? '✓' : '✉'}
        </div>
        {done ? (
          <>
            <h1 style={{ margin: '0 0 12px', fontSize: 22, fontWeight: 700, color: '#ffffff' }}>Unsubscribed</h1>
            <p style={{ margin: '0 0 8px', fontSize: 14, color: '#8fa4b4', lineHeight: 1.7 }}>
              <strong style={{ color: '#c0cdd6' }}>{email}</strong> has been removed from our marketing list.
            </p>
            <p style={{ margin: '0 0 32px', fontSize: 13, color: '#8fa4b4' }}>
              You will still receive transactional emails for bookings you make.
            </p>
          </>
        ) : (
          <>
            <h1 style={{ margin: '0 0 12px', fontSize: 22, fontWeight: 700, color: '#ffffff' }}>Unsubscribe</h1>
            <p style={{ margin: '0 0 32px', fontSize: 14, color: '#8fa4b4' }}>
              Use the unsubscribe link in the email you received.
            </p>
          </>
        )}
        <Link href="/" style={{ display: 'inline-block', background: '#2b353d', color: '#c0cdd6', padding: '12px 28px', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
          Back to Home
        </Link>
      </div>
    </main>
  )
}

export default function UnsubscribePage() {
  return (
    <Suspense>
      <UnsubscribeContent />
    </Suspense>
  )
}
