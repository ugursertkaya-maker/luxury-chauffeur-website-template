'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { brand } from '@/config/brand'

const NAV = [
  { label: 'Services', href: '/services' },
  { label: 'Locations', href: '/locations' },
  { label: 'Airports', href: '/airports' },
  { label: 'Blog', href: '/blog' },
  { label: 'About', href: '/about' },
  { label: 'My Account', href: '/account' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 border-b ${
      scrolled
        ? 'bg-[#080808]/95 backdrop-blur-md shadow-lg shadow-black/30 border-[#D4A017]/10'
        : 'bg-[#080808] border-[#D4A017]/10'
    }`}>
      <div className="max-w-6xl mx-auto px-6 h-[68px] flex items-center justify-between">
        <Link href="/" className="flex-shrink-0">
          <Image
            src="/logo-nav.svg"
            alt={`${brand.company.displayName}`}
            width={200}
            height={44}
            priority
          />
        </Link>

        <ul className="hidden md:flex items-center gap-0.5">
          {NAV.map(item => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="text-[13px] font-bold tracking-wide text-white hover:text-white px-3.5 py-2 rounded-lg hover:bg-white/[0.07] transition-all"
              >
                {item.label}
              </Link>
            </li>
          ))}
          <li className="ml-4 pl-4 border-l border-[#D4A017]/20">
            <Link
              href="/#booking"
              className="bg-white text-[#080808] text-[13px] font-bold tracking-wide px-5 py-2.5 rounded-xl hover:bg-white/90 transition-all"
            >
              Book Now →
            </Link>
          </li>
        </ul>

        <button
          className="md:hidden p-2 text-white hover:text-white"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-[#080808] border-t border-[#D4A017]/10 px-6 py-4 flex flex-col gap-1">
          {NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="text-sm font-bold text-white hover:text-white py-2.5 px-3 rounded-lg hover:bg-white/5 transition-all"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/#booking"
            onClick={() => setOpen(false)}
            className="mt-2 bg-white text-[#080808] text-sm font-bold px-5 py-3 rounded-xl text-center"
          >
            Book Now →
          </Link>
        </div>
      )}
    </nav>
  )
}
