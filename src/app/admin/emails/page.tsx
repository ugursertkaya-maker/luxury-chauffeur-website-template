'use client'
import { useEffect, useState, useRef } from 'react'
import { brand } from '@/config/brand'

type Email = {
  id: string
  source: string
  from_email: string
  from_name: string | null
  to_email: string | null
  subject: string | null
  body_text: string | null
  body_html: string | null
  is_read: boolean
  replied_at: string | null
  replied_by: string | null
  received_at: string
}

type Tab = 'inbox' | 'sent' | 'compose'

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const SOURCE_LABEL: Record<string, string> = {
  contact_form: 'Form',
  email: 'Email',
  outbound: 'Sent',
}

export default function EmailsPage() {
  const [tab, setTab] = useState<Tab>('inbox')
  const [emails, setEmails] = useState<Email[]>([])
  const [selected, setSelected] = useState<Email | null>(null)
  const [loading, setLoading] = useState(true)
  const [unread, setUnread] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')
  const [gmailConnected, setGmailConnected] = useState<boolean | null>(null)

  useEffect(() => {
    fetch('/api/admin/gmail/status').then(r => r.json()).then(d => {
      setGmailConnected(d.connected)
      if (d.connected) syncGmail()
    })
  }, [])

  useEffect(() => {
    if (!gmailConnected) return
    const interval = setInterval(() => syncGmail(), 2 * 60 * 1000)
    return () => clearInterval(interval)
  }, [gmailConnected])

  async function syncGmail() {
    setSyncing(true)
    setSyncMsg('')
    const r = await fetch('/api/admin/gmail/sync', { method: 'POST' })
    const d = await r.json()
    if (d.error === 'not_connected') { setGmailConnected(false); setSyncing(false); return }
    setSyncMsg(d.synced > 0 ? `${d.synced} new email synced` : 'Up to date')
    setSyncing(false)
    if (d.synced > 0) load(tab)
  }

  // Reply
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [sentMsg, setSentMsg] = useState('')

  // Compose
  const [composeTo, setComposeTo] = useState('')
  const [composeSubject, setComposeSubject] = useState('')
  const [composeBody, setComposeBody] = useState('')
  const [composeFrom, setComposeFrom] = useState<'info' | 'reservations'>('info')
  const [composeSending, setComposeSending] = useState(false)
  const [composeMsg, setComposeMsg] = useState('')

  const replyRef = useRef<HTMLTextAreaElement>(null)

  async function load(t: Tab = tab) {
    if (t === 'compose') return
    setLoading(true)
    const r = await fetch(`/api/admin/emails?tab=${t}`)
    const d = await r.json()
    setEmails(d.emails ?? [])
    if (t === 'inbox') setUnread((d.emails ?? []).filter((e: Email) => !e.is_read).length)
    setLoading(false)
  }

  useEffect(() => { load(tab) }, [tab])

  function switchTab(t: Tab) {
    setTab(t)
    setSelected(null)
    setReply('')
    setSentMsg('')
  }

  async function select(email: Email) {
    setSelected(email)
    setReply('')
    setSentMsg('')
    if (!email.is_read && tab === 'inbox') {
      await fetch(`/api/admin/emails/${email.id}`, { method: 'PATCH' })
      setEmails(prev => prev.map(e => e.id === email.id ? { ...e, is_read: true } : e))
      setUnread(prev => Math.max(0, prev - 1))
    }
  }

  async function sendReply() {
    if (!selected || !reply.trim()) return
    setSending(true)
    setSentMsg('')
    const r = await fetch(`/api/admin/emails/${selected.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply_text: reply }),
    })
    if (r.ok) {
      setSentMsg('Sent!')
      setReply('')
      setSelected(prev => prev ? { ...prev, replied_at: new Date().toISOString() } : null)
      setEmails(prev => prev.map(e => e.id === selected.id ? { ...e, replied_at: new Date().toISOString() } : e))
    } else {
      const d = await r.json()
      setSentMsg(`Error: ${d.error}`)
    }
    setSending(false)
  }

  async function sendCompose() {
    if (!composeTo.trim() || !composeSubject.trim() || !composeBody.trim()) return
    setComposeSending(true)
    setComposeMsg('')
    const r = await fetch('/api/admin/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: composeTo, subject: composeSubject, body: composeBody, from_alias: composeFrom }),
    })
    if (r.ok) {
      setComposeMsg('Email sent!')
      setComposeTo('')
      setComposeSubject('')
      setComposeBody('')
    } else {
      const d = await r.json()
      setComposeMsg(`Error: ${d.error}`)
    }
    setComposeSending(false)
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Email</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {tab === 'inbox' && (unread > 0 ? <span className="text-[#2b353d] font-semibold">{unread} unread · </span> : '')}
            {tab !== 'compose' && `${emails.length} ${tab === 'sent' ? 'sent' : 'messages'}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {gmailConnected === false && (
            <a href="/api/auth/gmail" className="text-xs bg-red-50 text-red-600 border border-red-200 font-semibold px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors">
              🔗 Connect Gmail
            </a>
          )}
          {gmailConnected === true && (
            <button onClick={syncGmail} disabled={syncing} className="text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50">
              {syncing ? 'Syncing…' : '↻ Sync Gmail'}
              {syncMsg && <span className="ml-2 text-green-600">{syncMsg}</span>}
            </button>
          )}
          {tab !== 'compose' && (
            <button onClick={() => load(tab)} className="text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg px-3 py-1.5 transition-colors">
              ↻ Refresh
            </button>
          )}
          <button
            onClick={() => switchTab('compose')}
            className="bg-[#2b353d] text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-[#1e262d] transition-colors"
          >
            + Compose
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-slate-100 p-1 rounded-xl w-fit">
        {(['inbox', 'sent'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => switchTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors capitalize ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t === 'inbox' && unread > 0 ? `Inbox (${unread})` : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Compose view */}
      {tab === 'compose' ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm max-w-2xl">
          <div className="bg-[#0f1922] px-6 py-4 rounded-t-2xl">
            <p className="font-bold text-white">New Email</p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">From</label>
              <div className="flex gap-2">
                {(['info', 'reservations'] as const).map(f => (
                  <button key={f} onClick={() => setComposeFrom(f)}
                    className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-colors ${composeFrom === f ? 'bg-[#2b353d] text-white border-[#2b353d]' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                    {f}@{brand.site.domain}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">To</label>
              <input value={composeTo} onChange={e => setComposeTo(e.target.value)} placeholder="recipient@email.com" type="email"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2b353d] focus:ring-1 focus:ring-[#2b353d]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Subject</label>
              <input value={composeSubject} onChange={e => setComposeSubject(e.target.value)} placeholder="Subject..."
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2b353d] focus:ring-1 focus:ring-[#2b353d]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Message</label>
              <textarea value={composeBody} onChange={e => setComposeBody(e.target.value)} rows={10} placeholder="Write your message..."
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2b353d] focus:ring-1 focus:ring-[#2b353d] resize-none" />
            </div>
            {composeMsg && (
              <p className={`text-sm font-semibold ${composeMsg.startsWith('Error') ? 'text-red-500' : 'text-green-600'}`}>{composeMsg}</p>
            )}
            <div className="flex gap-3">
              <button onClick={() => switchTab('inbox')} className="flex-1 border border-slate-200 text-slate-600 font-semibold py-3 rounded-xl hover:bg-slate-50 transition-colors text-sm">
                Cancel
              </button>
              <button onClick={sendCompose} disabled={composeSending || !composeTo || !composeSubject || !composeBody}
                className="flex-[2] bg-[#2b353d] text-white font-bold py-3 rounded-xl hover:bg-[#1e262d] disabled:opacity-40 transition-colors text-sm">
                {composeSending ? 'Sending…' : 'Send Email →'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex gap-5 h-[calc(100vh-230px)] min-h-[500px]">
          {/* Email list */}
          <div className="w-72 flex-shrink-0 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}</div>
            ) : emails.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6 text-center">
                <div className="text-4xl mb-3">{tab === 'sent' ? '📤' : '📭'}</div>
                <p className="text-sm">{tab === 'sent' ? 'No sent emails yet' : 'No emails yet'}</p>
              </div>
            ) : emails.map(email => (
              <button
                key={email.id}
                onClick={() => select(email)}
                className={`w-full text-left px-4 py-3.5 border-b border-slate-100 hover:bg-slate-50 transition-colors ${selected?.id === email.id ? 'bg-[#0f1922]/5 border-l-2 border-l-[#2b353d]' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {!email.is_read && tab === 'inbox' && <span className="w-2 h-2 rounded-full bg-[#2b353d] flex-shrink-0" />}
                      <span className={`text-xs truncate ${!email.is_read && tab === 'inbox' ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
                        {tab === 'sent' ? email.to_email : (email.from_name ?? email.from_email)}
                      </span>
                    </div>
                    <p className={`text-xs truncate ${!email.is_read && tab === 'inbox' ? 'font-semibold text-slate-800' : 'text-slate-500'}`}>
                      {email.subject ?? '(no subject)'}
                    </p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{email.body_text?.slice(0, 55) ?? ''}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className="text-xs text-slate-400">{timeAgo(email.received_at)}</span>
                    {email.replied_at && tab === 'inbox' && <div className="text-xs text-green-600 mt-0.5">✓ Replied</div>}
                    {SOURCE_LABEL[email.source] && (
                      <div className="text-xs text-blue-500 mt-0.5">{SOURCE_LABEL[email.source]}</div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Email detail */}
          <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {!selected ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <div className="text-5xl mb-4">✉️</div>
                <p className="text-sm font-medium">Select an email to read</p>
              </div>
            ) : (
              <>
                <div className="bg-[#0f1922] px-6 py-5">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-white font-bold text-lg leading-snug">{selected.subject ?? '(no subject)'}</h2>
                    <button onClick={() => setSelected(null)} className="text-[#8fa4b4] hover:text-white text-xl leading-none flex-shrink-0 mt-0.5">✕</button>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-[#8fa4b4]">
                    <span>From: <span className="text-[#c0cdd6]">{selected.from_name ? `${selected.from_name} <${selected.from_email}>` : selected.from_email}</span></span>
                    {selected.to_email && <span>To: <span className="text-[#c0cdd6]">{selected.to_email}</span></span>}
                    <span>{new Date(selected.received_at).toLocaleString()}</span>
                  </div>
                  {selected.replied_at && (
                    <div className="mt-2 text-xs text-green-400">✓ Replied by {selected.replied_by} · {new Date(selected.replied_at).toLocaleString()}</div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-5">
                  {selected.body_html ? (
                    <div className="prose prose-sm max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: selected.body_html }} />
                  ) : (
                    <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">{selected.body_text ?? '(empty message)'}</pre>
                  )}
                </div>

                {tab === 'inbox' && (
                  <div className="border-t border-slate-100 px-6 py-4 bg-slate-50">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Reply to {selected.from_email}</span>
                      {sentMsg && (
                        <span className={`text-xs font-semibold ${sentMsg.startsWith('Error') ? 'text-red-500' : 'text-green-600'}`}>{sentMsg}</span>
                      )}
                    </div>
                    <textarea ref={replyRef} value={reply} onChange={e => setReply(e.target.value)} rows={4}
                      placeholder="Type your reply..."
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2b353d] focus:ring-1 focus:ring-[#2b353d] resize-none bg-white" />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-slate-500">
                        From: {selected.to_email?.includes('reservations') ? `${brand.contact.emailReservations}` : `${brand.contact.emailInfo}`}
                      </span>
                      <button onClick={sendReply} disabled={sending || !reply.trim()}
                        className="bg-[#2b353d] text-white text-sm font-bold px-5 py-2 rounded-xl hover:bg-[#1e262d] disabled:opacity-40 transition-colors">
                        {sending ? 'Sending…' : 'Send Reply →'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
