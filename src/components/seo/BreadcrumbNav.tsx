import Link from 'next/link'

export default function BreadcrumbNav({ crumbs }: { crumbs: { name: string; url: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-white">
        {crumbs.map((c, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-white">/</span>}
            {i === crumbs.length - 1 ? (
              <span className="text-white/80 font-medium" aria-current="page">{c.name}</span>
            ) : (
              <Link href={c.url} className="hover:text-white transition-colors">{c.name}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
