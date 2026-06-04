import { createClient } from "@supabase/supabase-js";

/**
 * Plain Supabase client using the anon key.
 * Use in public-facing API routes that don't require a user session.
 */
export function createAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
