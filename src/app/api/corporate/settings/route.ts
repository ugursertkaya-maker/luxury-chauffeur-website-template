import { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getCorporateSession, hashCorporatePassword, createCorporateSession } from '@/lib/corporate-auth'

export async function POST(req: NextRequest) {
  const session = await getCorporateSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { action } = body
  const db = getSupabaseAdmin()

  if (action === 'change_password') {
    const { current_password, new_password } = body
    if (!current_password || !new_password) return Response.json({ error: 'Missing fields' }, { status: 400 })
    if (new_password.length < 8) return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 })

    const { data: account } = await db
      .from('corporate_accounts')
      .select('portal_password')
      .eq('id', session.id)
      .single()

    if (!account?.portal_password || hashCorporatePassword(current_password) !== account.portal_password) {
      return Response.json({ error: 'Current password is incorrect' }, { status: 401 })
    }

    await db.from('corporate_accounts')
      .update({ portal_password: hashCorporatePassword(new_password) })
      .eq('id', session.id)

    return Response.json({ ok: true })
  }

  if (action === 'change_email') {
    const { new_email, password } = body
    if (!new_email || !password) return Response.json({ error: 'Missing fields' }, { status: 400 })

    const { data: account } = await db
      .from('corporate_accounts')
      .select('portal_password, company_name')
      .eq('id', session.id)
      .single()

    if (!account?.portal_password || hashCorporatePassword(password) !== account.portal_password) {
      return Response.json({ error: 'Password is incorrect' }, { status: 401 })
    }

    // Check email not taken by another account
    const { data: existing } = await db
      .from('corporate_accounts')
      .select('id')
      .eq('contact_email', new_email.trim().toLowerCase())
      .neq('id', session.id)
      .single()

    if (existing) return Response.json({ error: 'Email already in use' }, { status: 400 })

    await db.from('corporate_accounts')
      .update({ contact_email: new_email.trim().toLowerCase() })
      .eq('id', session.id)

    // Refresh session with same ID/company
    await createCorporateSession(session.id, account.company_name)
    return Response.json({ ok: true })
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 })
}
