import { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { hashCorporatePassword, createCorporateSession, clearCorporateSession } from '@/lib/corporate-auth'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action } = body

  if (action === 'login') {
    const { email, password } = body
    if (!email || !password) return Response.json({ error: 'Email and password required' }, { status: 400 })

    const db = getSupabaseAdmin()
    const { data } = await db
      .from('corporate_accounts')
      .select('id, company_name, portal_password, is_active')
      .eq('contact_email', email.trim().toLowerCase())
      .eq('is_active', true)
      .single()

    if (!data?.portal_password) return Response.json({ error: 'Invalid credentials' }, { status: 401 })

    const hashed = hashCorporatePassword(password)
    if (hashed !== data.portal_password) return Response.json({ error: 'Invalid credentials' }, { status: 401 })

    await createCorporateSession(data.id, data.company_name)
    return Response.json({ ok: true, company: data.company_name })
  }

  if (action === 'logout') {
    await clearCorporateSession()
    return Response.json({ ok: true })
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 })
}
