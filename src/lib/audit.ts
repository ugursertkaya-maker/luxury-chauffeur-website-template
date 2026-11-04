import { getSupabaseAdmin } from '@/lib/supabase'

export async function logAction(
  action: string,
  actor: string,
  booking_number?: string,
  details?: Record<string, unknown>
) {
  try {
    const db = getSupabaseAdmin()
    await db.from('audit_logs').insert({ action, actor, booking_number, details })
  } catch {
    // audit log failure should never break the main flow
  }
}
