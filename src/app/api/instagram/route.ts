// Fetches Instagram Business media via Graph API.
// Caches for 1 hour. Token auto-refreshed when within 7 days of expiry.
import { NextResponse } from 'next/server'

const TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN
const APP_ID = process.env.INSTAGRAM_APP_ID
const APP_SECRET = process.env.INSTAGRAM_APP_SECRET

export const revalidate = 3600 // ISR: rebuild feed every hour

async function refreshTokenIfNeeded(token: string) {
  if (!APP_ID || !APP_SECRET) return token
  try {
    // Check token expiry
    const info = await fetch(
      `https://graph.facebook.com/debug_token?input_token=${token}&access_token=${APP_ID}|${APP_SECRET}`
    ).then(r => r.json())

    const expiresAt = info?.data?.expires_at
    if (!expiresAt) return token

    const daysLeft = (expiresAt * 1000 - Date.now()) / 86400000
    if (daysLeft > 7) return token

    // Refresh
    const refreshed = await fetch(
      `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${token}`
    ).then(r => r.json())

    return refreshed.access_token ?? token
  } catch {
    return token
  }
}

export async function GET() {
  if (!TOKEN) {
    return NextResponse.json({ posts: [], configured: false })
  }

  try {
    const token = await refreshTokenIfNeeded(TOKEN)

    const res = await fetch(
      `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=12&access_token=${token}`,
      { next: { revalidate: 3600 } }
    )

    if (!res.ok) {
      const err = await res.json()
      console.error('Instagram API error:', err)
      return NextResponse.json({ posts: [], error: err?.error?.message })
    }

    const data = await res.json()

    const posts = (data.data ?? [])
      .filter((p: { media_type: string }) => p.media_type === 'IMAGE' || p.media_type === 'CAROUSEL_ALBUM' || p.media_type === 'VIDEO')
      .map((p: { id: string; media_type: string; media_url?: string; thumbnail_url?: string; permalink: string; caption?: string; timestamp: string }) => ({
        id: p.id,
        url: p.media_type === 'VIDEO' ? p.thumbnail_url : p.media_url,
        permalink: p.permalink,
        caption: p.caption?.split('\n')[0]?.slice(0, 80) ?? '',
        type: p.media_type,
        timestamp: p.timestamp,
      }))

    return NextResponse.json({ posts, configured: true })
  } catch (e) {
    console.error('Instagram fetch error:', e)
    return NextResponse.json({ posts: [], error: 'Fetch failed' })
  }
}
