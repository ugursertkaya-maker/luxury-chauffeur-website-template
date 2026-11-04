import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { createHash } from 'crypto'

import { getJwtSecret, passwordSalt } from '@/lib/env'

const COOKIE = 'corporate_session'

export function hashCorporatePassword(password: string) {
  return createHash('sha256').update(password + passwordSalt('corporate')).digest('hex')
}

export async function createCorporateSession(accountId: string, companyName: string) {
  const token = await new SignJWT({ sub: accountId, company: companyName, role: 'corporate' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(getJwtSecret())

  const jar = await cookies()
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
}

export async function getCorporateSession(): Promise<{ id: string; company: string } | null> {
  try {
    const jar = await cookies()
    const token = jar.get(COOKIE)?.value
    if (!token) return null
    const { payload } = await jwtVerify(token, getJwtSecret())
    return { id: payload.sub as string, company: payload.company as string }
  } catch {
    return null
  }
}

export async function clearCorporateSession() {
  const jar = await cookies()
  jar.delete(COOKIE)
}

export { COOKIE as CORPORATE_COOKIE }
