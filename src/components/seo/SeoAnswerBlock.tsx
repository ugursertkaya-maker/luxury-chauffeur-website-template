import type { FaqItem } from '@/lib/seo/types'

export default function SeoAnswerBlock({ items, title = 'Frequently Asked Questions' }: { items: FaqItem[]; title?: string }) {
  if (!items?.length) return null
  return (
    <section className="my-10">
      <h2 className="text-2xl font-bold text-white mb-6">{title}</h2>
      <div className="space-y-3">
        {items.map((item, i) => (
          <details key={i} className="group bg-[#080808] border border-[#D4A017]/10 rounded-xl overflow-hidden">
            <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none select-none">
              <span className="font-semibold text-white/90 text-sm pr-4">{item.question}</span>
              <span className="text-white flex-shrink-0 group-open:rotate-180 transition-transform">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </summary>
            <div className="px-5 pb-4 text-sm text-white leading-relaxed border-t border-[#D4A017]/10">
              {item.answer}
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}
