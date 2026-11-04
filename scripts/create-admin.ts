/**
 * ============================================================================
 *  CREATE THE FIRST ADMIN USER
 * ============================================================================
 *
 *  The admin panel has no public sign-up. Run this once, after applying
 *  scripts/schema.sql, to create the account you will log in with at
 *  /admin/login.
 *
 *  Usage:
 *    npx tsx scripts/create-admin.ts <username> <password>
 *
 *  Example:
 *    npx tsx scripts/create-admin.ts owner 'a-long-random-password'
 *
 *  Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in
 *  .env.local. Creates the user with the 'admin' role (full access).
 *
 *  ⚠ Password hashing in this project is a single unsalted SHA-256 pass — see
 *    docs/KNOWN_ISSUES.md. Choose a long, unique, randomly generated password,
 *    and read that note before going live.
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) dotenv.config({ path: envPath })
else dotenv.config()

// Must stay identical to hashPassword() in src/lib/password.ts.
const PASSWORD_SALT = process.env.PASSWORD_SALT
if (!PASSWORD_SALT) {
  console.error('\u2716 Missing PASSWORD_SALT. Set it in .env.local first (see .env.example).')
  process.exit(1)
}
const hashPassword = (password: string) =>
  createHash('sha256').update(password + `${PASSWORD_SALT}:admin`).digest('hex')

const [username, password] = process.argv.slice(2)

if (!username || !password) {
  console.error('Usage: npx tsx scripts/create-admin.ts <username> <password>')
  process.exit(1)
}

if (password.length < 12) {
  console.error('✖ Refusing to create an admin with a password shorter than 12 characters.')
  process.exit(1)
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('✖ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
  console.error('  Copy .env.example to .env.local and fill them in first.')
  process.exit(1)
}

async function main() {
  const supabase = createClient(url!, key!)
  const { error } = await supabase.from('admin_users').insert({
    username: username.toLowerCase().trim(),
    password_hash: hashPassword(password),
    role: 'admin',
  })

  if (error) {
    console.error(`✖ ${error.message}`)
    if (error.message.includes('role')) {
      console.error('  Did you apply the current scripts/schema.sql? It adds admin_users.role.')
    }
    process.exit(1)
  }

  console.log(`✓ Admin user '${username.toLowerCase().trim()}' created with role 'admin'.`)
  console.log('  Log in at /admin/login')
}

main().catch(err => { console.error(err); process.exit(1) })
