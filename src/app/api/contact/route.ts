import { getSupabaseAdmin } from '@/lib/supabase'
import { brand } from '@/config/brand'

export async function POST(request: Request) {
  const { name, email, subject, message, to } = await request.json()
  if (!email || !message) return Response.json({ error: 'Email and message required' }, { status: 400 })

  const db = getSupabaseAdmin()
  const { error } = await db.from('inbound_emails').insert({
    source: 'contact_form',
    from_email: email,
    from_name: name ?? null,
    to_email: to ?? brand.contact.emailInfo,
    subject: subject ?? `Contact form message from ${name ?? email}`,
    body_text: message,
    body_html: null,
    received_at: new Date().toISOString(),
  })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
