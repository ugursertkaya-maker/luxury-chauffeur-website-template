import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken, COOKIE } from '@/lib/auth'
import { jwtVerify } from 'jose'
import { getJwtSecret } from '@/lib/env'

const ADMIN_ONLY = [
  '/admin/vehicles', '/admin/drivers', '/admin/sms', '/admin/ratings',
  '/admin/users', '/admin/audit', '/admin/earnings', '/admin/corporate',
  '/admin/pricing', '/admin/discounts', '/admin/subscribers', '/admin/settings',
  '/admin/calendar', '/admin/emails',
]



export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Admin routes
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = req.cookies.get(COOKIE)?.value
    const session = token ? await verifyAdminToken(token) : null

    if (!session) {
      const url = req.nextUrl.clone()
      url.pathname = '/admin/login'
      url.searchParams.set('from', pathname)
      return NextResponse.redirect(url)
    }

    const isAdminOnly = ADMIN_ONLY.some(p => pathname.startsWith(p))
    if (isAdminOnly && session.role !== 'admin') {
      const url = req.nextUrl.clone()
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }
  }

  // Customer account routes
  if (pathname.startsWith('/account') && pathname !== '/account/login' && pathname !== '/account/register') {
    const token = req.cookies.get('customer_session')?.value
    if (!token) {
      const url = req.nextUrl.clone()
      url.pathname = '/account/login'
      url.searchParams.set('from', pathname)
      return NextResponse.redirect(url)
    }
    try {
      await jwtVerify(token, getJwtSecret())
    } catch {
      const url = req.nextUrl.clone()
      url.pathname = '/account/login'
      return NextResponse.redirect(url)
    }
  }

  // Corporate portal routes
  if (pathname.startsWith('/corporate') && pathname !== '/corporate/login') {
    const token = req.cookies.get('corporate_session')?.value
    if (!token) {
      const url = req.nextUrl.clone()
      url.pathname = '/corporate/login'
      return NextResponse.redirect(url)
    }
    try {
      await jwtVerify(token, getJwtSecret())
    } catch {
      const url = req.nextUrl.clone()
      url.pathname = '/corporate/login'
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*', '/corporate/:path*'],
}
