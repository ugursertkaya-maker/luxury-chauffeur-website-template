import { getSupabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { brand } from '@/config/brand'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const origin = process.env.NEXT_PUBLIC_SITE_URL || brand.site.url
  const code = searchParams.get('code')
  if (!code) return NextResponse.redirect(`${origin}/admin/emails?error=no_code`)

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GMAIL_CLIENT_ID!,
      client_secret: process.env.GMAIL_CLIENT_SECRET!,
      redirect_uri: process.env.GMAIL_REDIRECT_URI!,
      grant_type: 'authorization_code',
    }),
  })

  const tokens = await res.json()
  if (!tokens.access_token) return NextResponse.redirect(`${origin}/admin/emails?error=token_failed`)

  const db = getSupabaseAdmin()
  await db.from('app_settings').upsert({
    key: 'gmail_tokens',
    value: JSON.stringify({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: Date.now() + (tokens.expires_in * 1000),
    }),
  })

  return NextResponse.redirect(`${origin}/admin/emails?connected=1`)
}
