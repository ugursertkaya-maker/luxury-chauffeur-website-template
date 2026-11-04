'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { formatPrice } from '@/lib/pricing'
import { brand } from '@/config/brand'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-slate-100 text-white',
  modification_requested: 'bg-blue-100 text-blue-700',
}

const SERVICE_ICONS: Record<string, string> = {
  airport: '✈️', wedding: '💍', hourly: '⏱️', corporate: '💼', tour: '🌴', sedan: '🚗', suv: '🚙',
}

interface Customer {
  id: string; email: string; name: string; phone?: string
  referral_code?: string; referral_credit?: number; created_at: string
}
interface Booking {
  id: string; booking_number?: string; service_type: string
  pickup_date: string; pickup_time: string; pickup_location: string
  dropoff_location?: string; total_price: number; status: string; payment_status: string
}

export default function AccountPage() {
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/account/me').then(r => {
      if (r.status === 401) { router.push('/account/login'); return null }
      return r.json()
    }).then(d => {
      if (!d) return
      setCustomer(d.customer)
      setBookings(d.bookings)
      setLoading(false)
    })
  }, [router])

  async function logout() {
    await fetch('/api/account/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  function copyCode() {
    if (!customer?.referral_code) return
    navigator.clipboard.writeText(customer.referral_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <>
      <Navbar />
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#2b353d] border-t-transparent rounded-full animate-spin" />
      </div>
    </>
  )

  const today = new Date().toISOString().slice(0, 10)
  const upcoming = bookings.filter(b => b.pickup_date >= today && b.status !== 'cancelled' && b.status !== 'completed')
  const past = bookings.filter(b => b.pickup_date < today || b.status === 'completed' || b.status === 'cancelled')
  const shown = tab === 'upcoming' ? upcoming : past

  const referralLink = customer?.referral_code
    ? `${typeof window !== 'undefined' ? window.location.origin : `${brand.site.url}`}/account/register?ref=${customer.referral_code}`
    : ''

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-slate-50 pt-20">
        <div className="max-w-3xl mx-auto px-4 py-10">

          {/* Header */}
          <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900">My Account</h1>
              <p className="text-white text-sm mt-0.5">{customer?.email}</p>
            </div>
            <div className="flex gap-2">
              <Link href="/#booking"
                className="bg-[#2b353d] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#1e262d] transition-colors">
                + New Booking
              </Link>
              <button onClick={logout}
                className="border border-slate-200 text-white text-sm px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors">
                Sign Out
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Total Trips', value: bookings.length },
              { label: 'Upcoming', value: upcoming.length },
              { label: 'Completed', value: bookings.filter(b => b.status === 'completed').length },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4 text-center">
                <p className="text-2xl font-extrabold text-[#2b353d]">{s.value}</p>
                <p className="text-xs text-white uppercase tracking-wide mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Referral section */}
          <div className="bg-gradient-to-r from-[#0f1922] to-[#1a2d3d] rounded-2xl p-5 mb-6 text-white">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold tracking-widest text-white uppercase mb-1">Refer a Friend</p>
                <p className="font-bold text-lg leading-tight">Give $10, Get $10</p>
                <p className="text-sm text-white mt-1">Share your code — your friend gets $10 off their first booking, and you get $10 credit.</p>
                {(customer?.referral_credit ?? 0) > 0 && (
                  <p className="text-sm font-bold text-emerald-400 mt-2">Your credit: {formatPrice(customer!.referral_credit!)}</p>
                )}
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0">
                <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-center">
                  <p className="text-xs text-white mb-0.5">Your Code</p>
                  <p className="font-mono font-extrabold text-lg tracking-widest">{customer?.referral_code ?? '—'}</p>
                </div>
                <button onClick={copyCode}
                  className={`text-sm font-semibold py-2 px-4 rounded-xl transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}>
                  {copied ? '✓ Copied!' : 'Copy Code'}
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            {(['upcoming', 'past'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-[#2b353d] text-white' : 'bg-white border border-slate-200 text-white hover:border-slate-300'}`}>
                {t === 'upcoming' ? `Upcoming (${upcoming.length})` : `Past (${past.length})`}
              </button>
            ))}
          </div>

          {/* Bookings */}
          {shown.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
              <p className="text-3xl mb-3">{tab === 'upcoming' ? '📅' : '🗂️'}</p>
              <p className="text-white text-sm">
                {tab === 'upcoming' ? 'No upcoming trips.' : 'No past bookings yet.'}
              </p>
              {tab === 'upcoming' && (
                <Link href="/#booking" className="inline-block mt-4 bg-[#2b353d] text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-[#1e262d] transition-colors">
                  Book a Ride
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {shown.map(b => (
                <div key={b.id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-sm transition-all">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl mt-0.5">{SERVICE_ICONS[b.service_type] ?? '🚗'}</span>
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-slate-900 capitalize">{b.service_type} Transfer</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[b.status] ?? 'bg-slate-100 text-white'}`}>
                            {b.status === 'modification_requested' ? 'Change Requested' : b.status}
                          </span>
                        </div>
                        <p className="text-sm text-white">{b.pickup_date} · {b.pickup_time?.slice(0, 5)}</p>
                        <p className="text-sm text-white truncate max-w-xs">{b.pickup_location}{b.dropoff_location ? ` → ${b.dropoff_location}` : ''}</p>
                        {b.booking_number && <p className="text-xs text-white font-mono mt-0.5">{b.booking_number}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-extrabold text-[#2b353d]">{formatPrice(b.total_price)}</p>
                      {b.status !== 'cancelled' && b.status !== 'completed' && (
                        <Link href={`/manage?booking=${b.booking_number}`}
                          className="text-xs text-[#2b353d] hover:underline font-medium">
                          Manage →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
