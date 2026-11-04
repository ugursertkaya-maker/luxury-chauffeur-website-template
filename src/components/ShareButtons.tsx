'use client'
import { useEffect, useState } from 'react'

export default function ShareButtons({ title, slug }: { title: string; slug: string }) {
  const [url, setUrl] = useState('')

  useEffect(() => {
    setUrl(window.location.href)
  }, [])

  if (!url) return null

  const encoded = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  const shares = [
    {
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
      color: 'bg-[#1877f2] hover:bg-[#166fe5]',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
        </svg>
      ),
    },
    {
      label: 'X / Twitter',
      href: `https://twitter.com/intent/tweet?url=${encoded}&text=${encodedTitle}`,
      color: 'bg-black hover:bg-slate-800',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
    },
    {
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`,
      color: 'bg-[#0a66c2] hover:bg-[#004182]',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
          <circle cx="4" cy="4" r="2"/>
        </svg>
      ),
    },
  ]

  async function copyLink() {
    await navigator.clipboard.writeText(url)
  }

  return (
    <div className="my-8 py-6 border-t border-b border-[#D4A017]/15">
      <p className="text-xs font-bold text-white uppercase tracking-widest mb-3">Share this article</p>
      <div className="flex flex-wrap gap-2">
        {shares.map(s => (
          <a
            key={s.label}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 ${s.color} text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors`}
          >
            {s.icon}
            {s.label}
          </a>
        ))}
        <button
          onClick={copyLink}
          className="inline-flex items-center gap-2 bg-[#141414] hover:bg-[#1a1a1a] text-white/80 text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
          </svg>
          Copy Link
        </button>
      </div>
    </div>
  )
}
