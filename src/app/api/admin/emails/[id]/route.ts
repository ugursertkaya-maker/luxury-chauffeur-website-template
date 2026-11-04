import { getAdminSession } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { emailTemplate } from '@/lib/emailTemplate'
import { Resend } from 'resend'
import { brand } from '@/config/brand'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const db = getSupabaseAdmin()
  const { error } = await db.from('inbound_emails').update({ is_read: true }).eq('id', id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession()
  if (!session || session.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { reply_text, reply_html } = await request.json()
  if (!reply_text) return Response.json({ error: 'reply_text required' }, { status: 400 })

  const db = getSupabaseAdmin()
  const { data: email, error: fetchErr } = await db.from('inbound_emails').select('*').eq('id', id).single()
  if (fetchErr || !email) return Response.json({ error: 'Email not found' }, { status: 404 })

  const fromAddress = email.to_email?.includes('reservations')
    ? brand.contact.emailReservations
    : email.to_email?.includes('info')
    ? brand.contact.emailInfo
    : brand.contact.emailReservations

  const subject = email.subject?.startsWith('Re:') ? email.subject : `Re: ${email.subject ?? '(no subject)'}`

  const html = emailTemplate({
    subject,
    greeting: `Dear ${email.from_name ?? email.from_email.split('@')[0]},`,
    body: reply_text,
    fromAddress,
  })

  const { error: sendErr } = await resend.emails.send({
    from: `${brand.company.displayName} <${fromAddress}>`,
    to: [email.from_email],
    subject,
    text: reply_text,
    html,
  })

  if (sendErr) return Response.json({ error: sendErr.message }, { status: 500 })

  await db.from('inbound_emails').update({
    is_read: true,
    replied_at: new Date().toISOString(),
    replied_by: session.username,
  }).eq('id', id)

  await db.from('inbound_emails').insert({
    source: 'outbound',
    from_email: fromAddress,
    from_name: brand.company.displayName,
    to_email: email.from_email,
    subject,
    body_text: reply_text,
    is_read: true,
    replied_by: session.username,
    received_at: new Date().toISOString(),
  })

  return Response.json({ ok: true })
}
