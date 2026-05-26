import { createClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client — bypasses Row Level Security.
 * Only use in server-side code (API routes, cron jobs).
 * Never expose to the browser.
 *
 * Requires: SUPABASE_SERVICE_ROLE_KEY env var.
 * Find it in Supabase Dashboard → Settings → API → service_role key.
 */
export function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. ' +
      'Add it to .env.local (Supabase Dashboard → Settings → API).'
    )
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false },
  })
}
