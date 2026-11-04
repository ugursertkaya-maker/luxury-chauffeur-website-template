import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import BreadcrumbNav from '@/components/seo/BreadcrumbNav'
import SeoAnswerBlock from '@/components/seo/SeoAnswerBlock'
import InternalLinks from '@/components/seo/InternalLinks'
import { getBlogBySlug, getAllBlogSlugs, resolveRelatedLinks, getRelatedBlogPosts } from '@/lib/seo/queries'
import { buildBlogMetadata } from '@/lib/seo/metadata'
import { articleSchema, faqSchema, breadcrumbSchema } from '@/lib/seo/jsonld'
import ShareButtons from '@/components/ShareButtons'

export const revalidate = 3600
export const dynamicParams = true

export async function generateStaticParams() {
  const slugs = await getAllBlogSlugs()
  return slugs.map(r => ({ slug: r.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const row = await getBlogBySlug(slug)
  if (!row) return {}
  return buildBlogMetadata(row)
}

export default async function BlogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const row = await getBlogBySlug(slug)
  if (!row) notFound()

  const [related, relatedPosts] = await Promise.all([
    resolveRelatedLinks({
      routes: row.related_routes,
      services: row.related_services,
    }),
    getRelatedBlogPosts(slug, row.tags ?? []),
  ])

  const crumbs = [
    { name: 'Home', url: '/' },
    { name: 'Blog', url: '/blog' },
    { name: row.title, url: `/blog/${slug}` },
  ]

  return (
    <>
      <JsonLd data={articleSchema(row.title, row.meta_description, slug, row.published_at, row.author)} />
      <JsonLd data={faqSchema(row.faq_items)} />
      <JsonLd data={breadcrumbSchema(crumbs)} />

      <div className="min-h-screen bg-[#0e0e0e]">
        <div className="bg-gradient-to-b from-[#0a0a0a] via-[#0e0e0e] to-[#080808] px-6 py-16 text-center">
          <div className="max-w-3xl mx-auto">
            {row.tags?.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {row.tags.map(tag => (
                  <span key={tag} className="px-3 py-0.5 bg-[#080808]/10 text-white text-xs rounded-full font-medium">{tag}</span>
                ))}
              </div>
            )}
            <h1 className="text-3xl md:text-4xl font-black text-white leading-tight mb-4">{row.h1}</h1>
            {row.published_at && (
              <p className="text-[#8fa4b4] text-sm">
                {new Date(row.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} · {row.author}
              </p>
            )}
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 py-10">
          <BreadcrumbNav crumbs={crumbs} />

          {row.excerpt && (
            <p className="text-lg text-white leading-relaxed mb-8 font-light border-l-4 border-[#2b353d] pl-4">{row.excerpt}</p>
          )}

          <article
            className="space-y-4 text-base leading-relaxed text-white"
            dangerouslySetInnerHTML={{ __html: row.body_html }}
          />

          <ShareButtons title={row.title} slug={slug} />
          <SeoAnswerBlock items={row.faq_items} />
          <InternalLinks related={related} />

          {relatedPosts.length > 0 && (
            <div className="mt-12 pt-8 border-t border-[#D4A017]/15">
              <h2 className="text-xl font-bold text-white mb-6">Related Articles</h2>
              <div className="grid gap-4">
                {relatedPosts.map(post => (
                  <a key={post.slug} href={`/blog/${post.slug}`} className="group flex gap-4 bg-[#0e0e0e] border border-[#D4A017]/10 rounded-xl p-5 hover:border-[#D4A017]/30 transition-all">
                    <div className="flex-1 min-w-0">
                      {post.primary_tag && (
                        <span className="text-xs text-[#8fa4b4] font-medium uppercase tracking-wide">{post.primary_tag}</span>
                      )}
                      <h3 className="text-base font-semibold text-white group-hover:text-white mt-0.5 leading-snug line-clamp-2">{post.title}</h3>
                      {post.meta_description && (
                        <p className="text-sm text-white mt-1 line-clamp-2">{post.meta_description}</p>
                      )}
                    </div>
                    <div className="text-white self-center text-xl flex-shrink-0">→</div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
