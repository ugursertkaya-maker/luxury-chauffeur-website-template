'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { brand } from '@/config/brand'

const HANDLE = process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE ?? ''

interface Post {
  id: string
  url: string
  permalink: string
  caption: string
  type: string
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  )
}

function Skeleton() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-1.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="aspect-square rounded-xl bg-[#080808]/[0.04] animate-pulse" />
      ))}
    </div>
  )
}

function Placeholder() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-1.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <a key={i} href={`https://instagram.com/${HANDLE}`} target="_blank" rel="noopener noreferrer"
          className="aspect-square rounded-xl bg-[#080808]/[0.04] border border-white/[0.06] flex items-center justify-center hover:bg-[#080808]/[0.07] transition-all group">
          <InstagramIcon className="w-6 h-6 text-white group-hover:text-white transition-colors" />
        </a>
      ))}
    </div>
  )
}

export default function InstagramFeed() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [configured, setConfigured] = useState(false)

  useEffect(() => {
    fetch('/api/instagram')
      .then(r => r.json())
      .then(d => {
        setPosts(d.posts ?? [])
        setConfigured(d.configured ?? false)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="bg-[#0a1017] py-14 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)' }}>
              <InstagramIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm tracking-wide">@{HANDLE}</p>
              <p className="text-white text-xs">Follow us on Instagram</p>
            </div>
          </div>
          <a href={`https://instagram.com/${HANDLE}`} target="_blank" rel="noopener noreferrer"
            className="text-xs font-semibold text-white hover:text-white border border-white/10 hover:border-white/30 px-4 py-2 rounded-full transition-all">
            Follow →
          </a>
        </div>

        {/* Grid */}
        {loading ? (
          <Skeleton />
        ) : configured && posts.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-1.5">
            {posts.slice(0, 12).map(post => (
              <a key={post.id} href={post.permalink} target="_blank" rel="noopener noreferrer"
                className="group relative aspect-square rounded-xl overflow-hidden bg-[#080808]/[0.04]">
                {post.url && (
                  <Image
                    src={post.url}
                    alt={post.caption || `${brand.company.displayName}`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 16vw"
                    unoptimized
                  />
                )}
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-[#0a1017]/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-1.5 p-3">
                  <InstagramIcon className="w-5 h-5 text-white/80" />
                  {post.caption && (
                    <p className="text-white/80 text-[10px] text-center leading-tight line-clamp-3">{post.caption}</p>
                  )}
                </div>
                {/* Video badge */}
                {post.type === 'VIDEO' && (
                  <div className="absolute top-2 right-2">
                    <svg className="w-4 h-4 text-white drop-shadow" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                )}
                {/* Carousel badge */}
                {post.type === 'CAROUSEL_ALBUM' && (
                  <div className="absolute top-2 right-2">
                    <svg className="w-4 h-4 text-white drop-shadow" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M2 19h14v-2H2v2zm0-6h14v-2H2v2zm0-6h14V5H2v2zm16 0v14l5-7-5-7z"/>
                    </svg>
                  </div>
                )}
              </a>
            ))}
          </div>
        ) : (
          <Placeholder />
        )}

      </div>
    </section>
  )
}
