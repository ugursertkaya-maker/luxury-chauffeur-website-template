import Link from 'next/link'
import type { Metadata } from 'next'
import { brand } from '@/config/brand'

export const metadata: Metadata = {
  title: `Page Not Found | ${brand.company.displayName}`,
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0f1922] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="text-[#8fa4b4] text-xs font-bold tracking-widest uppercase mb-4">Error 404</p>
        <h1 className="text-6xl font-black text-white mb-4">404</h1>
        <p className="text-white text-lg mb-2">Page not found</p>
        <p className="text-[#8fa4b4] text-sm mb-10">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="bg-[#080808] text-[#0f1922] font-bold px-6 py-3 rounded-xl hover:bg-[#141414] transition-colors text-sm">
            ← Back to Home
          </Link>
          <Link href="/book" className="bg-white text-[#080808] font-bold px-6 py-3 rounded-xl hover:bg-white/90 transition-colors text-sm">
            Book a Ride →
          </Link>
        </div>
      </div>
    </div>
  )
}
