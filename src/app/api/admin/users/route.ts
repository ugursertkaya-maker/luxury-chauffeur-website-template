import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { hashPassword } from '@/lib/password'
import { getAdminSession } from '@/lib/auth'

export async function GET() {
  const session = await getAdminSession()
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getSupabaseAdmin()
  const { data } = await db.from('admin_users').select('id, username, role, created_at').order('created_at')
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { username, password, role } = await req.json()
  if (!username || !password || !['admin', 'dispatcher'].includes(role)) {
    return NextResponse.json({ error: 'Invalid fields' }, { status: 400 })
  }

  const db = getSupabaseAdmin()
  const { error } = await db.from('admin_users').insert({
    username: username.toLowerCase().trim(),
    password_hash: hashPassword(password),
    role,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const session = await getAdminSession()
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  const db = getSupabaseAdmin()
  const { error } = await db.from('admin_users').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
