/**
 * Required-secret accessors.
 *
 * The upstream project carried hardcoded fallback values for the JWT signing
 * secret and the password salts. Those fallbacks have been removed: a missing
 * secret must fail loudly rather than silently fall back to a value that is
 * identical in every deployment.
 *
 * Every accessor here is lazy, so importing this module during `next build`
 * never throws — the error surfaces on the first request that needs a secret.
 *
 * Edge-runtime safe: no Node built-ins are imported.
 */

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. ` +
      `Copy .env.example to .env.local and set it — see docs/API_SETUP.md.`
    )
  }
  return value
}

/** HS256 key for all three session cookies (admin, customer, corporate). */
export function getJwtSecret(): Uint8Array {
  return new TextEncoder().encode(requireEnv('JWT_SECRET'))
}

export type PasswordScope = 'admin' | 'customer' | 'corporate' | 'driver'

/**
 * Per-scope password salt, derived from the single PASSWORD_SALT secret.
 *
 * NOTE: this is still a single unsalted-per-user SHA-256 pass, which is not a
 * suitable password hash for production. See docs/KNOWN_ISSUES.md — moving to
 * bcrypt/argon2 is strongly recommended before taking real customer accounts.
 */
export function passwordSalt(scope: PasswordScope): string {
  return `${requireEnv('PASSWORD_SALT')}:${scope}`
}
