import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { getJwtSecret } from '@/lib/env'

const COOKIE = 'admin_session'

export async function signAdminToken(username: string, role: string) {
  return new SignJWT({ role, username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(getJwtSecret())
}

export async function verifyAdminToken(token: string): Promise<{ role: string; username: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret())
    if (!payload.role || !payload.username) return null
    return { role: payload.role as string, username: payload.username as string }
  } catch {
    return null
  }
}

export async function getAdminSession(): Promise<{ role: string; username: string } | null> {
  const jar = await cookies()
  const token = jar.get(COOKIE)?.value
  if (!token) return null
  return verifyAdminToken(token)
}

export { COOKIE }
