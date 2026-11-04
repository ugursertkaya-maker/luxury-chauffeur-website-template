import { createHash } from 'crypto'
import { passwordSalt } from '@/lib/env'

/** Admin-panel password hash. See docs/KNOWN_ISSUES.md before production use. */
export function hashPassword(password: string) {
  return createHash('sha256').update(password + passwordSalt('admin')).digest('hex')
}
