import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import { brand } from '@/config/brand'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

const TITLE = `${brand.company.displayName} — ${brand.company.tagline}`

export const metadata: Metadata = {
  title: TITLE,
  description: brand.company.description,
  metadataBase: new URL(brand.site.url),
  openGraph: {
    type: 'website',
    siteName: brand.site.name,
    title: TITLE,
    description: brand.company.description,
    // Generated at request time by src/app/opengraph-image.tsx.
    images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: brand.company.description,
    images: ['/opengraph-image'],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: brand.site.url },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <head>
        {GA_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script id="ga4-init" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { page_path: window.location.pathname });
            `}</Script>
          </>
        )}
      </head>
      <body className="min-h-screen bg-[var(--brand-bg)] text-white antialiased">
        {children}
      </body>
    </html>
  )
}
