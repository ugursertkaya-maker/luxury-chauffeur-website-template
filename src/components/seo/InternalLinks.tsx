import Link from 'next/link'

type LinkRef = { slug: string; name: string; url: string }

type RelatedLinks = {
  airports?: LinkRef[]
  locations?: LinkRef[]
  routes?: LinkRef[]
  services?: LinkRef[]
  attractions?: LinkRef[]
  hotels?: LinkRef[]
  cruisePorts?: LinkRef[]
  destinations?: LinkRef[]
}

const SECTION_LABELS: Record<keyof RelatedLinks, string> = {
  airports:     'Nearby Airports',
  locations:    'Service Areas',
  routes:       'Popular Routes',
  services:     'Our Services',
  attractions:  'Nearby Attractions',
  hotels:       'Nearby Hotels',
  cruisePorts:  'Cruise Ports',
  destinations: 'Destinations',
}

export default function InternalLinks({ related }: { related: RelatedLinks }) {
  const sections = (Object.entries(related) as [keyof RelatedLinks, LinkRef[]][])
    .filter(([, links]) => links?.length > 0)

  if (!sections.length) return null

  return (
    <section className="my-10">
      <div className="space-y-6">
        {sections.map(([key, links]) => (
          <div key={key}>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">{SECTION_LABELS[key]}</h3>
            <div className="flex flex-wrap gap-2">
              {links.map(link => (
                <Link
                  key={link.slug}
                  href={link.url}
                  className="inline-block px-4 py-2 rounded-lg bg-[#141414] text-white text-sm font-medium hover:bg-white/10 hover:text-white transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
