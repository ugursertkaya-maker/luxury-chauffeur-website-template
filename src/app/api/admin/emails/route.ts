import { getAdminSession } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { emailTemplate } from '@/lib/emailTemplate'
import { Resend } from 'resend'
import { brand } from '@/config/brand'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(request: Request) {
  const session = await getAdminSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const tab = searchParams.get('tab') ?? 'inbox'
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = 50
  const from = (page - 1) * limit
  const db = getSupabaseAdmin()

  let query = db.from('inbound_emails').select('*', { count: 'exact' }).order('received_at', { ascending: false }).range(from, from + limit - 1)
  if (tab === 'sent') query = query.eq('source', 'outbound')
  else query = query.neq('source', 'outbound')

  const { data, error, count } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ emails: data, total: count })
}

export async function POST(request: Request) {
  const session = await getAdminSession()
  if (!session || session.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { to, subject, body, from_alias } = await request.json()
  if (!to || !subject || !body) return Response.json({ error: 'to, subject, body required' }, { status: 400 })

  const fromAddress = from_alias === 'reservations'
    ? brand.contact.emailReservations
    : brand.contact.emailInfo

  const html = emailTemplate({
    subject,
    greeting: 'Dear Valued Guest,',
    body,
    fromAddress,
  })

  const { error: sendErr } = await resend.emails.send({
    from: `${brand.company.displayName} <${fromAddress}>`,
    to: [to],
    subject,
    text: body,
    html,
  })

  if (sendErr) return Response.json({ error: sendErr.message }, { status: 500 })

  const db = getSupabaseAdmin()
  await db.from('inbound_emails').insert({
    source: 'outbound',
    from_email: fromAddress,
    from_name: brand.company.displayName,
    to_email: to,
    subject,
    body_text: body,
    is_read: true,
    replied_by: session.username,
    received_at: new Date().toISOString(),
  })

  return Response.json({ ok: true })
}
