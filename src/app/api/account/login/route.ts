import { getSupabaseAdmin } from '@/lib/supabase'
import { hashPassword, createCustomerSession } from '@/lib/customer-auth'

export async function POST(req: Request) {
  const { email, password } = await req.json()
  if (!email || !password) return Response.json({ error: 'Missing fields' }, { status: 400 })

  const db = getSupabaseAdmin()
  const { data } = await db.from('customers')
    .select('id, email, name, phone, password_hash')
    .eq('email', email.toLowerCase())
    .single()

  if (!data || data.password_hash !== hashPassword(password))
    return Response.json({ error: 'Invalid email or password' }, { status: 401 })

  await createCustomerSession(data.id, data.email)
  const { password_hash: _, ...customer } = data
  return Response.json({ customer })
}
