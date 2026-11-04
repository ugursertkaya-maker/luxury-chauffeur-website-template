import type { MetadataRoute } from 'next'
import { BASE_URL } from '@/lib/seo/canonical'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/book/', '/driver/', '/manage/', '/confirmation/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
