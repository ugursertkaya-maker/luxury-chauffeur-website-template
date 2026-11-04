import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import { brand } from '@/config/brand'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <footer className="bg-[#080808] border-t border-[#D4A017]/10 py-14 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <Image src="/logo-nav.svg" alt={`${brand.company.displayName}`} width={180} height={40} className="mb-4 opacity-90" />
              <p className="text-xs text-white leading-relaxed">Premier chauffeured limousine service. Luxury, comfort, and reliability.</p>
              <p className="text-xs text-white mt-3">
                <a href={`mailto:${brand.contact.emailInfo}`} className="hover:text-white transition-colors">{brand.contact.emailInfo}</a>
              </p>
            </div>

            <div>
              <p className="text-xs font-bold tracking-widest text-white uppercase mb-3">Services</p>
              <ul className="space-y-2">
                {[['All Services', '/services'], ['Airport Transfers', '/services'], ['Corporate', '/services'], ['Weddings', '/services'], ['Hourly Charter', '/services']].map(([l, h]) => (
                  <li key={l}><Link href={h} className="text-xs text-white hover:text-white transition-colors">{l}</Link></li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold tracking-widest text-white uppercase mb-3">Explore</p>
              <ul className="space-y-2">
                {[['Service Areas', '/locations'], ['Airports', '/airports'], ['Routes', '/routes'], ['Hotels', '/hotels'], ['Destinations', '/destinations'], ['Travel Blog', '/blog']].map(([l, h]) => (
                  <li key={l}><Link href={h} className="text-xs text-white hover:text-white transition-colors">{l}</Link></li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold tracking-widest text-white uppercase mb-3">Quick Links</p>
              <ul className="space-y-2">
                {[['Book a Ride', '/book'], ['Manage Booking', '/manage'], ['Cancellation Policy', '/cancellation-policy'], ['Attractions', '/attractions'], ['Cruise Ports', '/cruise-ports']].map(([l, h]) => (
                  <li key={l}><Link href={h} className="text-xs text-white hover:text-white transition-colors">{l}</Link></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-[#D4A017]/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white">
            <p>Available 24/7 · Professional Chauffeur Service</p>
            <p>© {new Date().getFullYear()} {brand.company.displayName}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  )
}
