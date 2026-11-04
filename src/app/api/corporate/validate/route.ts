import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')?.trim().toUpperCase()
  if (!code) return Response.json({ valid: false })

  const db = getSupabaseAdmin()
  const { data } = await db
    .from('corporate_accounts')
    .select('id, company_name, payment_terms, discount_rate')
    .eq('corporate_code', code)
    .eq('is_active', true)
    .single()

  if (!data) return Response.json({ valid: false, error: 'Invalid corporate code' })
  return Response.json({ valid: true, company_name: data.company_name, account_id: data.id, payment_terms: data.payment_terms, discount_rate: data.discount_rate ?? 0 })
}
