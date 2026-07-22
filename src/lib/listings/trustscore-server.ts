import type { SupabaseClient } from "@supabase/supabase-js";
import type { VerificationStatus } from "@/lib/types";

/**
 * Minimal landlord-safe TrustScore accessor. Returns ONLY the verification
 * status for a given tenant user id, nothing else. Display name comes from
 * tenant_applications.full_name (captured at submission time) rather than
 * from a second query here, so this function never touches tenant_profiles
 * columns beyond verification_status (no sa_id_number, income, budget,
 * affordability, employment_status, area preferences). Never pass a full
 * tenant_profiles row to a landlord-facing component.
 *
 * Mirrors the honest-empty-state pattern from
 * src/app/api/flatmate/[token]/apply/route.ts: .maybeSingle() + nullish
 * coalesce to "unverified", so "no profile row yet" and "explicit
 * unverified row" render identically.
 */
export async function getVerificationStatusForUser(
  supabase: SupabaseClient,
  userId: string | null,
): Promise<VerificationStatus> {
  if (!userId) return "unverified";

  const { data, error } = await supabase
    .from("tenant_profiles")
    .select("verification_status")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[listings] verification_status lookup failed:", error.message);
    return "unverified";
  }

  return (data?.verification_status as VerificationStatus | undefined) ?? "unverified";
}
