import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID

export async function POST(request: Request) {
  const { email, firstName } = await request.json()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: 'Invalid email' }, { status: 400 })
  }

  if (!AUDIENCE_ID) {
    return Response.json({ error: 'Newsletter not configured' }, { status: 503 })
  }

  try {
    await resend.contacts.create({
      email,
      firstName: firstName ?? '',
      audienceId: AUDIENCE_ID,
      unsubscribed: false,
    })
    return Response.json({ success: true })
  } catch (err) {
    console.error('Newsletter subscribe error:', err)
    return Response.json({ error: 'Failed to subscribe' }, { status: 500 })
  }
}
