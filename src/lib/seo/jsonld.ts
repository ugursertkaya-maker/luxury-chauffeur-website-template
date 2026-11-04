import { BASE_URL } from './canonical'
import type { FaqItem } from './types'
import { brand, socialProfiles } from '@/config/brand'

export function localBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LimousineService',
    name: brand.company.displayName,
    url: BASE_URL,
    logo: `${BASE_URL}${brand.assets.logoHero}`,
    image: brand.site.ogImage,
    telephone: brand.contact.phoneE164,
    email: brand.contact.emailInfo,
    priceRange: brand.service.priceRange,
    currenciesAccepted: brand.service.currency,
    paymentAccepted: 'Credit Card',
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
      opens: '00:00',
      closes: '23:59',
    },
    areaServed: {
      '@type': brand.service.areaServedType,
      name: brand.service.areaServed,
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: brand.address.locality,
      addressRegion: brand.address.region,
      addressCountry: brand.address.country,
    },
    // Only emitted once brand.aggregateRating holds genuine collected reviews.
    ...(brand.aggregateRating
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: brand.aggregateRating.ratingValue,
            bestRating: '5',
            worstRating: '1',
            ratingCount: brand.aggregateRating.ratingCount,
          },
        }
      : {}),
    ...(socialProfiles.length ? { sameAs: socialProfiles } : {}),
  }
}

export function serviceSchema(name: string, description: string, url: string, priceFrom?: number) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    url: `${BASE_URL}${url}`,
    provider: {
      '@type': 'LimousineService',
      name: brand.company.displayName,
      url: BASE_URL,
    },
    ...(priceFrom ? { offers: { '@type': 'Offer', price: priceFrom, priceCurrency: brand.service.currency } } : {}),
    areaServed: { '@type': brand.service.areaServedType, name: brand.service.areaServed },
  }
}

export function faqSchema(items: FaqItem[]) {
  if (!items?.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }
}

export function breadcrumbSchema(crumbs: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.url.startsWith('http') ? c.url : `${BASE_URL}${c.url}`,
    })),
  }
}

export function articleSchema(title: string, description: string, slug: string, publishedAt?: string, author = brand.company.displayName) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    url: `${BASE_URL}/blog/${slug}`,
    author: { '@type': 'Organization', name: author },
    publisher: { '@type': 'Organization', name: brand.company.displayName, url: BASE_URL },
    ...(publishedAt ? { datePublished: publishedAt } : {}),
  }
}
