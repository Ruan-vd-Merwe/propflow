import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * On full signature, the lease_agreements row becomes the source of truth
 * for lease dates and rent, so mirror those three fields onto the tenants
 * row. tenants/payments remain the operational tables for portal access and
 * rent tracking; this does not create schedules or obligations.
 */
export async function syncSignedLeaseToTenant(
  supabase: SupabaseClient,
  lease: {
    tenant_id: string;
    lease_start: string;
    lease_end: string | null;
    monthly_rent: number;
  },
): Promise<void> {
  const { error } = await supabase
    .from("tenants")
    .update({
      lease_start: lease.lease_start,
      lease_end: lease.lease_end,
      monthly_rent: lease.monthly_rent,
    })
    .eq("id", lease.tenant_id);

  if (error) {
    console.error("[syncSignedLeaseToTenant] tenants update failed:", error.message);
  }
}
