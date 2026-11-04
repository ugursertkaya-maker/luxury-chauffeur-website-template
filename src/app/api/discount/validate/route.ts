import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  const { code, email, order_amount } = await req.json()
  if (!code || !email) return Response.json({ valid: false, error: 'Missing fields' })

  const db = getSupabaseAdmin()
  const { data: dc } = await db
    .from('discount_codes')
    .select('*')
    .eq('code', code.toUpperCase().trim())
    .eq('active', true)
    .single()

  if (!dc) return Response.json({ valid: false, error: 'Invalid code' })

  if (dc.expires_at && new Date(dc.expires_at) < new Date())
    return Response.json({ valid: false, error: 'This code has expired' })

  if (dc.max_uses != null && dc.uses_count >= dc.max_uses)
    return Response.json({ valid: false, error: 'Code usage limit reached' })

  if (dc.min_order_amount && order_amount < dc.min_order_amount)
    return Response.json({ valid: false, error: `Minimum order amount is $${dc.min_order_amount}` })

  if (dc.max_uses_per_email != null) {
    const { count } = await db
      .from('discount_code_uses')
      .select('*', { count: 'exact', head: true })
      .eq('code_id', dc.id)
      .eq('email', email.toLowerCase())

    if ((count ?? 0) >= dc.max_uses_per_email)
      return Response.json({ valid: false, error: 'You have already used this code' })
  }

  const discount_amount = dc.type === 'percentage'
    ? Math.round(order_amount * (dc.value / 100) * 100) / 100
    : Math.min(dc.value, order_amount)

  return Response.json({
    valid: true,
    code: dc.code,
    description: dc.description,
    type: dc.type,
    value: dc.value,
    discount_amount,
    final_amount: Math.max(0, order_amount - discount_amount),
  })
}
