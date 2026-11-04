import { getSupabaseAdmin } from '@/lib/supabase'
import { hashPassword, createCustomerSession } from '@/lib/customer-auth'

function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'KML'
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export async function POST(req: Request) {
  const { name, email, phone, password, referral_code } = await req.json()
  if (!email || !password || !name) return Response.json({ error: 'Missing fields' }, { status: 400 })
  if (password.length < 6) return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 })

  const db = getSupabaseAdmin()

  const { data: existing } = await db.from('customers').select('id').eq('email', email.toLowerCase()).single()
  if (existing) return Response.json({ error: 'Email already registered' }, { status: 409 })

  // Validate referral code
  let referrerId: string | null = null
  const codeUpper = referral_code?.trim()?.toUpperCase() ?? ''
  if (codeUpper) {
    const { data: referrer } = await db.from('customers').select('id').eq('referral_code', codeUpper).single()
    if (referrer) referrerId = referrer.id
  }

  // Generate unique referral code
  let myCode = generateReferralCode()
  for (let i = 0; i < 5; i++) {
    const { data: collision } = await db.from('customers').select('id').eq('referral_code', myCode).single()
    if (!collision) break
    myCode = generateReferralCode()
  }

  const { data, error } = await db.from('customers')
    .insert({
      email: email.toLowerCase(),
      password_hash: hashPassword(password),
      name,
      phone: phone ?? null,
      referral_code: myCode,
      referred_by: codeUpper || null,
      referral_credit: referrerId ? 10 : 0,
    })
    .select('id, email, name, phone, referral_code, referral_credit')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Give referrer $10 credit
  if (referrerId) {
    const { data: rd } = await db.from('customers').select('referral_credit').eq('id', referrerId).single()
    await db.from('customers').update({ referral_credit: (rd?.referral_credit ?? 0) + 10 }).eq('id', referrerId)
  }

  // Link existing bookings
  await db.from('bookings').update({ customer_id: data.id }).eq('email', email.toLowerCase()).is('customer_id', null)

  await createCustomerSession(data.id, data.email)
  return Response.json({ customer: data })
}
