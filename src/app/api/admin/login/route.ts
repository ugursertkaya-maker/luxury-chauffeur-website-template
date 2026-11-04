import { NextRequest, NextResponse } from 'next/server'
import { signAdminToken, COOKIE } from '@/lib/auth'
import { hashPassword } from '@/lib/password'
import { getSupabaseAdmin } from '@/lib/supabase'
import { logAction } from '@/lib/audit'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()
  if (!username || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const db = getSupabaseAdmin()
  const { data: user } = await db
    .from('admin_users')
    .select('username, password_hash, role')
    .eq('username', username.toLowerCase().trim())
    .single()

  if (!user || user.password_hash !== hashPassword(password)) {
    logAction('login_failed', username.toLowerCase().trim())
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  logAction('login', user.username, undefined, { role: user.role })
  const token = await signAdminToken(user.username, user.role)
  const res = NextResponse.json({ ok: true, role: user.role })
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 12,
    path: '/',
  })
  return res
}
