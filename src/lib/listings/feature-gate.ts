// The public_listings view and the tenant_applications additions this
// feature needs only exist once supabase/migrations/20260720120000_public_listings.sql
// has actually been run (it is a file-only migration in this branch, never
// executed automatically). Every entry point into the public listings
// feature checks this first so the branch degrades gracefully to "not yet
// available" instead of throwing on a missing relation/column.

type FeatureGateError = { code?: string; message: string };
type MinimalSupabaseClient = {
  from: (table: string) => {
    select: (columns: string) => {
      limit: (
        n: number,
      ) => PromiseLike<{ data: unknown; error: FeatureGateError | null }>;
    };
  };
};

// 42P01: Postgres undefined_table (also raised for a missing view).
// PGRST205: PostgREST could not find the table/view in its schema cache.
const MISSING_RELATION_CODES = new Set(["42P01", "PGRST205"]);

export async function isPublicListingsEnabled(
  supabase: MinimalSupabaseClient,
): Promise<boolean> {
  const { error } = await supabase.from("public_listings").select("id").limit(1);
  if (!error) return true;
  if (error.code && MISSING_RELATION_CODES.has(error.code)) return false;
  console.error("[listings] public_listings feature check failed:", error.message);
  return false;
}

export function isMissingRelationError(error: FeatureGateError | null | undefined): boolean {
  return !!error?.code && MISSING_RELATION_CODES.has(error.code);
}
