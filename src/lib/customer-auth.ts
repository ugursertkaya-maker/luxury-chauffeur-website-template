import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { createHash } from 'crypto'

import { getJwtSecret, passwordSalt } from '@/lib/env'

const COOKIE = 'customer_session'

export function hashPassword(password: string) {
  return createHash('sha256').update(password + passwordSalt('customer')).digest('hex')
}

export async function createCustomerSession(customerId: string, email: string) {
  const token = await new SignJWT({ sub: customerId, email, role: 'customer' })
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

export async function getCustomerSession(): Promise<{ id: string; email: string } | null> {
  try {
    const jar = await cookies()
    const token = jar.get(COOKIE)?.value
    if (!token) return null
    const { payload } = await jwtVerify(token, getJwtSecret())
    return { id: payload.sub as string, email: payload.email as string }
  } catch {
    return null
  }
}

export async function clearCustomerSession() {
  const jar = await cookies()
  jar.delete(COOKIE)
}
