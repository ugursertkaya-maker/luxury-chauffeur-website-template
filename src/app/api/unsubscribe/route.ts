import { getSupabaseAdmin } from '@/lib/supabase'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return Response.json({ error: 'Missing token' }, { status: 400 })

  let email: string
  try {
    email = Buffer.from(token, 'base64url').toString('utf8')
  } catch {
    return Response.json({ error: 'Invalid token' }, { status: 400 })
  }

  const db = getSupabaseAdmin()
  await db.from('email_subscribers')
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq('email', email.toLowerCase())

  return Response.redirect(new URL(`/unsubscribe?done=1&email=${encodeURIComponent(email)}`, req.url))
}

export async function POST(req: NextRequest) {
  const { token } = await req.json()
  if (!token) return Response.json({ error: 'Missing token' }, { status: 400 })

  let email: string
  try {
    email = Buffer.from(token, 'base64url').toString('utf8')
  } catch {
    return Response.json({ error: 'Invalid token' }, { status: 400 })
  }

  const db = getSupabaseAdmin()
  await db.from('email_subscribers')
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq('email', email.toLowerCase())

  return Response.json({ success: true, email })
}
