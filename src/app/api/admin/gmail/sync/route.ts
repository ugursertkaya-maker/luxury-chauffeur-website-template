import { getAdminSession } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

async function getValidToken(db: ReturnType<typeof getSupabaseAdmin>) {
  const { data } = await db.from('app_settings').select('value').eq('key', 'gmail_tokens').single()
  if (!data) return null
  const tokens = JSON.parse(data.value)
  if (Date.now() < tokens.expiry_date - 60000) return tokens.access_token
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GMAIL_CLIENT_ID!,
      client_secret: process.env.GMAIL_CLIENT_SECRET!,
      refresh_token: tokens.refresh_token,
      grant_type: 'refresh_token',
    }),
  })
  const refreshed = await res.json()
  if (!refreshed.access_token) return null
  const updated = { ...tokens, access_token: refreshed.access_token, expiry_date: Date.now() + (refreshed.expires_in * 1000) }
  await db.from('app_settings').upsert({ key: 'gmail_tokens', value: JSON.stringify(updated) })
  return updated.access_token
}

export async function POST() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseAdmin()
  const token = await getValidToken(db)
  if (!token) return NextResponse.json({ error: 'not_connected' }, { status: 400 })

  // Load already-synced message IDs
  const { data: seenData } = await db.from('app_settings').select('value').eq('key', 'gmail_synced_ids').single()
  const seenIds: string[] = seenData ? JSON.parse(seenData.value) : []

  const listRes = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=30&labelIds=INBOX',
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const list = await listRes.json()
  if (!list.messages) return NextResponse.json({ synced: 0 })

  const newIds: string[] = []
  let synced = 0

  for (const { id } of list.messages) {
    if (seenIds.includes(id)) continue

    const msgRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const msg = await msgRes.json()

    const hdrs: Record<string, string> = {}
    for (const h of msg.payload?.headers ?? []) hdrs[h.name.toLowerCase()] = h.value

    const from = hdrs['from'] ?? ''
    const fromEmail = from.match(/<(.+?)>/)?.[1] ?? from
    const fromName = from.match(/^(.+?)\s*</)?.[1]?.trim() ?? null
    const to = hdrs['to'] ?? ''
    const subject = hdrs['subject'] ?? '(no subject)'
    const date = hdrs['date'] ? new Date(hdrs['date']).toISOString() : new Date().toISOString()

    let bodyText = ''
    function extractText(part: { mimeType?: string; body?: { data?: string }; parts?: unknown[] }) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        bodyText = Buffer.from(part.body.data, 'base64').toString('utf8')
      }
      if (part.parts) part.parts.forEach(p => extractText(p as { mimeType?: string; body?: { data?: string }; parts?: unknown[] }))
    }
    extractText(msg.payload)

    await db.from('inbound_emails').insert({
      source: 'email',
      from_email: fromEmail,
      from_name: fromName,
      to_email: to,
      subject,
      body_text: bodyText || null,
      is_read: !msg.labelIds?.includes('UNREAD'),
      received_at: date,
    })

    newIds.push(id)
    synced++
  }

  if (newIds.length > 0) {
    const allIds = [...seenIds, ...newIds].slice(-500)
    await db.from('app_settings').upsert({ key: 'gmail_synced_ids', value: JSON.stringify(allIds) })
  }

  return NextResponse.json({ synced })
}
