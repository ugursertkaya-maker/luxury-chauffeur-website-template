import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body) return Response.json({ ok: true })

  const from = body.from?.value?.[0]?.address ?? body.from?.text ?? ''
  const fromName = body.from?.value?.[0]?.name ?? null
  const to = body.to?.value?.[0]?.address ?? body.to?.text ?? ''
  const subject = body.subject ?? '(no subject)'
  const text = body.text ?? null
  const html = body.html ?? null

  if (!from) return Response.json({ ok: true })

  const db = getSupabaseAdmin()
  await db.from('inbound_emails').insert({
    source: 'email',
    from_email: from,
    from_name: fromName,
    to_email: to,
    subject,
    body_text: text,
    body_html: html,
    is_read: false,
    received_at: new Date().toISOString(),
  })

  return Response.json({ ok: true })
}
