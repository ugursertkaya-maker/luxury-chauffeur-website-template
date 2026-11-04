/**
 * ============================================================================
 *  BRAND CONFIGURATION — EDIT THIS FILE FIRST
 * ============================================================================
 *
 *  This is the single source of truth for every company-specific value in the
 *  website: names, contact details, address, service area, social profiles,
 *  logos and colours.
 *
 *  Everything here ships with neutral placeholder values. Replace them with
 *  your own before deploying. Nothing in this file is a real business.
 *
 *  Where a value can differ per environment (the public site URL, the
 *  Instagram handle, the Google review link), it reads from an environment
 *  variable first and falls back to the placeholder below.
 *
 *  See docs/CLIENT_SETUP_CHECKLIST.md for the full setup walkthrough.
 * ============================================================================
 */

/** Public site origin, no trailing slash. Set NEXT_PUBLIC_SITE_URL in production. */
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com').replace(/\/$/, '')

export const brand = {
  company: {
    /** Full legal entity name — used on invoices, receipts and legal pages. */
    legalName: 'Your Chauffeur Company LLC',
    /** Customer-facing name — used in headers, emails and page titles. */
    displayName: 'Your Chauffeur Company',
    /** Compact name for tight UI spaces and email subject lines. */
    shortName: 'YourChauffeur',
    /** One-line description used in metadata and structured data. */
    tagline: 'Premier Chauffeured Service',
    /** Longer description for Open Graph and the about page. */
    description:
      'Professional chauffeured car service. Airport transfers, corporate travel, weddings, and hourly charter. Available 24/7.',
  },

  contact: {
    /** Display format, shown to users. */
    phone: '(555) 000-0000',
    /** E.164 format, used in tel: links and structured data. */
    phoneE164: '+15550000000',
    /** General enquiries inbox. */
    emailInfo: 'info@example.com',
    /** Reservations inbox — also the transactional email sender. */
    emailReservations: 'reservations@example.com',
  },

  address: {
    street: '123 Example Street, Suite 100',
    locality: 'Your City',
    /** Two-letter state/province code. */
    region: 'ST',
    /** Full state/province name, used in structured data areaServed. */
    regionName: 'Your State',
    postalCode: '00000',
    /** ISO 3166-1 alpha-2. */
    country: 'US',
  },

  site: {
    url: SITE_URL,
    domain: SITE_URL.replace(/^https?:\/\//, ''),
    /** Site name for Open Graph. Defaults to the display name. */
    name: 'Your Chauffeur Company',
    /** Absolute URL of the social share image. */
    ogImage: `${SITE_URL}/opengraph-image`,
    locale: 'en_US',
  },

  social: {
    /** Set to null to hide a profile. These placeholders are intentionally null. */
    facebook: null as string | null,
    instagram: null as string | null,
    linkedin: null as string | null,
    /** Instagram handle without the @, for the feed component. */
    instagramHandle: process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE ?? null,
    /** Direct "leave us a review" link, shown after a completed trip. */
    googleReviewUrl: process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL ?? null,
  },

  service: {
    /** Primary area served, used in structured data and marketing copy. */
    areaServed: 'Your State',
    /** schema.org type for areaServed: 'State' | 'City' | 'Country'. */
    areaServedType: 'State' as 'State' | 'City' | 'Country',
    /** Cities shown in the footer quick-links. Each needs a matching seo_locations row. */
    serviceAreas: [] as { name: string; slug: string }[],
    currency: 'USD',
    /** schema.org priceRange hint. */
    priceRange: '$$$',
    /**
     * Sales tax applied to corporate invoices, as a decimal (0.0625 = 6.25%).
     * Set to your own jurisdiction's rate, or 0 to disable.
     */
    salesTaxRate: 0,
    /** Additional local surtax, as a decimal. */
    surtaxRate: 0,
  },

  assets: {
    /** Header logo — wide lockup, transparent background. */
    logoNav: '/logo-nav.svg',
    /** Hero/footer logo — square or stacked lockup. */
    logoHero: '/logo.svg',
    /** Raster logo for PDF invoices (@react-pdf cannot render SVG). */
    logoPdf: '/logo.png',
  },

  colors: {
    /** Page background. */
    background: '#080808',
    backgroundAlt: '#0e0e0e',
    backgroundRaised: '#141414',
    /** Primary accent — buttons, highlights, borders. */
    accent: '#D4A017',
    /** Dark slate used across emails and PDFs. */
    ink: '#2b353d',
    inkMid: '#475665',
  },

  /**
   * Customer testimonials shown on the homepage.
   *
   * Intentionally EMPTY. The homepage testimonial section only renders when
   * this array has entries. Add only real, attributable reviews you have
   * permission to publish — never invent them.
   */
  testimonials: [] as { name: string; location: string; text: string }[],

  /**
   * Aggregate rating for structured data (schema.org AggregateRating).
   *
   * Intentionally null. Only populate this once you have genuine collected
   * reviews, and make sure the numbers match what is publicly verifiable —
   * search engines treat fabricated ratings as spam and may penalise the site.
   */
  aggregateRating: null as { ratingValue: string; ratingCount: string } | null,
}

export type Brand = typeof brand

/** Convenience: "Your City, ST" */
export const cityState = `${brand.address.locality}, ${brand.address.region}`

/** Convenience: transactional email From header. */
export const emailFrom = `${brand.company.displayName} <${brand.contact.emailReservations}>`

/** Convenience: non-null social profile URLs, for structured data sameAs. */
export const socialProfiles = [
  brand.social.facebook,
  brand.social.instagram,
  brand.social.linkedin,
].filter((u): u is string => Boolean(u))
