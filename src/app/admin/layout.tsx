'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { brand } from '@/config/brand'

const ALL_NAV = [
  {
    group: 'Operations',
    items: [
      { href: '/admin',           label: 'Dashboard',   roles: ['admin', 'dispatcher'], icon: <IconGrid /> },
      { href: '/admin/calendar',  label: 'Calendar',    roles: ['admin', 'dispatcher'], icon: <IconCalendar /> },
      { href: '/admin/emails',    label: 'Inbox',       roles: ['admin'],               icon: <IconMail /> },
    ]
  },
  {
    group: 'Fleet & Crew',
    items: [
      { href: '/admin/drivers',   label: 'Drivers',     roles: ['admin'], icon: <IconUser /> },
      { href: '/admin/vehicles',  label: 'Vehicles',    roles: ['admin'], icon: <IconCar /> },
      { href: '/admin/ratings',   label: 'Ratings',     roles: ['admin'], icon: <IconStar /> },
    ]
  },
  {
    group: 'Finance',
    items: [
      { href: '/admin/earnings',   label: 'Earnings',    roles: ['admin'], icon: <IconMoney /> },
      { href: '/admin/corporate', label: 'Corporate',   roles: ['admin'], icon: <IconBuilding /> },
      { href: '/admin/pricing',   label: 'Pricing',     roles: ['admin'], icon: <IconTag /> },
      { href: '/admin/discounts', label: 'Discounts',   roles: ['admin'], icon: <IconDiscount /> },
    ]
  },
  {
    group: 'System',
    items: [
      { href: '/admin/subscribers', label: 'Subscribers', roles: ['admin'], icon: <IconList /> },
      { href: '/admin/users',       label: 'Team',         roles: ['admin'], icon: <IconTeam /> },
      { href: '/admin/audit',       label: 'Audit Log',    roles: ['admin'], icon: <IconAudit /> },
      { href: '/admin/settings',    label: 'Settings',     roles: ['admin'], icon: <IconSettings /> },
    ]
  },
]

function IconGrid() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4.5 h-4.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> }
function IconCalendar() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4.5 h-4.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18"/></svg> }
function IconChat() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4.5 h-4.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg> }
function IconMail() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4.5 h-4.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg> }
function IconUser() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4.5 h-4.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg> }
function IconCar() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4.5 h-4.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17H7m10 0h-2M3 10l2-5h14l2 5M3 10h18v7a1 1 0 01-1 1H4a1 1 0 01-1-1v-7z"/><circle cx="7.5" cy="17" r="1.5" fill="currentColor" stroke="none"/><circle cx="16.5" cy="17" r="1.5" fill="currentColor" stroke="none"/></svg> }
function IconStar() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4.5 h-4.5"><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg> }
function IconMoney() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4.5 h-4.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> }
function IconTag() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4.5 h-4.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M3 3h8l9 9a2 2 0 010 2.828l-5.172 5.172a2 2 0 01-2.828 0L3 11V3z"/></svg> }
function IconDiscount() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4.5 h-4.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-6 0h.01M15 14h.01M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg> }
function IconBuilding() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4.5 h-4.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg> }
function IconList() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4.5 h-4.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg> }
function IconTeam() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4.5 h-4.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg> }
function IconAudit() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4.5 h-4.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg> }
function IconSettings() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4.5 h-4.5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg> }
function IconMenu() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16"/></svg> }
function IconClose() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/></svg> }
function IconLogout() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg> }
function IconExternalLink() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg> }

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const router = useRouter()
  const [role, setRole] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    fetch('/api/admin/me').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.role) setRole(d.role)
    })
  }, [path])

  useEffect(() => { setSidebarOpen(false) }, [path])

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  if (path === '/admin/login') return <>{children}</>

  const visibleGroups = ALL_NAV.map(g => ({
    ...g,
    items: g.items.filter(i => !role || i.roles.includes(role))
  })).filter(g => g.items.length > 0)

  const currentLabel = ALL_NAV.flatMap(g => g.items).find(i => i.href === path)?.label ?? 'Admin'

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-white font-black text-sm flex-shrink-0">K</div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">{brand.company.displayName}</p>
            <p className="text-white text-[11px] leading-tight">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {visibleGroups.map(group => (
          <div key={group.group}>
            <p className="text-[10px] font-bold text-white uppercase tracking-widest px-2 mb-1.5">{group.group}</p>
            <div className="space-y-0.5">
              {group.items.map(item => {
                const active = path === item.href
                return (
                  <Link key={item.href} href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? 'bg-white/15 text-white'
                        : 'text-white hover:text-white/80 hover:bg-white/8'
                    }`}>
                    <span className={active ? 'text-white' : 'text-white'}>{item.icon}</span>
                    {item.label}
                    {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/10 space-y-1">
        <a href="/" target="_blank" rel="noreferrer"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-white hover:text-white text-xs font-medium transition-colors">
          <IconExternalLink />
          View Website
        </a>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-white hover:text-red-400 text-xs font-medium transition-colors">
          <IconLogout />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f4f6f8] flex text-slate-900">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 flex-shrink-0 bg-[#1a2530] fixed top-0 left-0 h-screen z-30">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-56 bg-[#1a2530] h-full z-50 flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-56 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 h-14 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
              <IconMenu />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800 text-sm">{currentLabel}</span>
              {role && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide ${
                  role === 'admin' ? 'bg-[#1a2530] text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {role}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <a href="/" target="_blank" rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors font-medium">
              <IconExternalLink />
              Website
            </a>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium">
              <IconLogout />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 sm:px-6 py-6 sm:py-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
