import Link from 'next/link'
import type { Metadata } from 'next'
import { getSupabaseAdmin } from '@/lib/supabase'
import JsonLd from '@/components/seo/JsonLd'
import BreadcrumbNav from '@/components/seo/BreadcrumbNav'
import { breadcrumbSchema } from '@/lib/seo/jsonld'
import { brand } from '@/config/brand'

export const revalidate = 3600

export const metadata: Metadata = {
  title: `${brand.address.locality} Travel Blog | ${brand.company.displayName}`,
  description: `${brand.service.areaServed} travel guides, ${brand.address.locality} tips, airport guides, and luxury transportation insights. 100+ articles from ${brand.company.displayName}.`,
  alternates: { canonical: `${brand.site.url}/blog` },
}

const crumbs = [{ name: 'Home', url: '/' }, { name: 'Blog', url: '/blog' }]

export default async function BlogIndexPage() {
  const db = getSupabaseAdmin()
  const { data: posts } = await db
    .from('seo_blog')
    .select('slug, title, excerpt, published_at, tags')
    .eq('is_published', true)
    .order('published_at', { ascending: false })

  const byTag: Record<string, typeof posts> = {}
  for (const p of posts ?? []) {
    const primary = p.tags?.[0] ?? 'General'
    if (!byTag[primary]) byTag[primary] = []
    byTag[primary]!.push(p)
  }

  return (
    <>
      <JsonLd data={breadcrumbSchema(crumbs)} />

      <div className="min-h-screen bg-[#0e0e0e]">
        <div className="bg-gradient-to-b from-[#0a0a0a] via-[#0e0e0e] to-[#080808] px-6 py-20 text-center">
          <div className="max-w-3xl mx-auto">
            <p className="text-[#8fa4b4] text-xs font-bold tracking-widest uppercase mb-4">Travel Guides & Tips</p>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">{brand.address.locality} Travel Blog</h1>
            <p className="text-white text-lg">{brand.service.areaServed} destinations, airport guides, luxury travel tips, and everything {brand.address.locality}.</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-10">
          <BreadcrumbNav crumbs={crumbs} />

          {Object.entries(byTag).slice(0, 12).map(([tag, articles]) => (
            <div key={tag} className="mb-12">
              <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-4 pb-2 border-b border-[#D4A017]/15">{tag}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {articles?.slice(0, 4).map(p => (
                  <Link key={p.slug} href={`/blog/${p.slug}`}
                    className="bg-[#0e0e0e] border border-[#D4A017]/10 rounded-2xl p-5 hover:border-[#D4A017]/30 hover:-translate-y-0.5 transition-all group">
                    <h3 className="font-bold text-white text-sm leading-snug mb-2 group-hover:text-white">{p.title}</h3>
                    {p.excerpt && <p className="text-xs text-white leading-relaxed line-clamp-2">{p.excerpt}</p>}
                    {p.published_at && (
                      <p className="text-xs text-white mt-3">
                        {new Date(p.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}

          <div className="text-center mt-8 py-10 border-t border-[#D4A017]/15">
            <Link href="/book" className="bg-[#141414] text-white font-bold px-8 py-4 rounded-xl hover:bg-[#1e262d] transition-colors">
              Book Your Ride →
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
