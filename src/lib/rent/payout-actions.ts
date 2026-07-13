import type { SupabaseClient } from "@supabase/supabase-js";

export type PayoutProvider = "payfast";

export type PayoutActionResult = { error: string | null };

/**
 * Sets a landlord's payout destination. Reference/ID only, never raw bank
 * account details, since the real Payfast vendor-reference shape is not
 * yet confirmed. Only checks that the reference is non-empty, not its
 * format, for the same reason.
 */
export async function updatePayoutSettings(
  supabase: SupabaseClient,
  landlordId: string,
  details: { payoutProvider: PayoutProvider; payoutProviderRef: string },
): Promise<PayoutActionResult> {
  const ref = details.payoutProviderRef.trim();
  if (!ref) {
    return { error: "Payout reference cannot be empty" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      payout_provider: details.payoutProvider,
      payout_provider_ref: ref,
    })
    .eq("id", landlordId);

  if (error) {
    console.error("[updatePayoutSettings] profiles update failed:", error.message);
    return { error: error.message };
  }

  return { error: null };
}
