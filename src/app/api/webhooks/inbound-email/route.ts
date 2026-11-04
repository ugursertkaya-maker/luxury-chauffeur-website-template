import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  const secret = process.env.INBOUND_EMAIL_SECRET
  if (secret) {
    const sig = request.headers.get('x-resend-signature') ?? ''
    if (sig !== secret) return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const db = getSupabaseAdmin()

  await db.from('inbound_emails').insert({
    source: 'email',
    from_email: body.from?.address ?? body.from ?? '',
    from_name: body.from?.name ?? null,
    to_email: Array.isArray(body.to) ? body.to[0]?.address ?? body.to[0] : body.to,
    subject: body.subject ?? '(no subject)',
    body_text: body.text ?? null,
    body_html: body.html ?? null,
    received_at: new Date().toISOString(),
  })

  return Response.json({ ok: true })
}
