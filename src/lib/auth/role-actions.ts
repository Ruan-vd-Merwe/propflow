import type { SupabaseClient } from "@supabase/supabase-js";

type RoleActionResult = { error: string | null };

/**
 * Grants the landlord role to an already-signed-in account.
 * Writes profiles.is_landlord and mirrors the flag into auth user_metadata
 * so middleware (which gates /dashboard off user_metadata) sees the change
 * on the very next request instead of drifting out of sync with profiles.
 */
export async function grantLandlordRole(
  supabase: SupabaseClient,
  userId: string,
  details: { province: string | null; city: string | null },
): Promise<RoleActionResult> {
  const { error: profileErr } = await supabase
    .from("profiles")
    .update({
      is_landlord: true,
      user_type: "landlord",
      province: details.province,
      city: details.city,
    })
    .eq("id", userId);
  if (profileErr) {
    console.error("[grantLandlordRole] profiles update failed:", profileErr.message);
    return { error: profileErr.message };
  }

  const { error: metaErr } = await supabase.auth.updateUser({
    data: { is_landlord: true, user_type: "landlord" },
  });
  if (metaErr) {
    console.error("[grantLandlordRole] auth.updateUser failed:", metaErr.message);
    return { error: metaErr.message };
  }

  return { error: null };
}

/**
 * Grants the tenant role to an already-signed-in account, creating a
 * minimal tenant_profiles row if one does not exist yet. Mirrors
 * grantLandlordRole's metadata sync so middleware stays consistent.
 */
export async function grantTenantRole(
  supabase: SupabaseClient,
  userId: string,
): Promise<RoleActionResult> {
  const { data: existing, error: existingErr } = await supabase
    .from("tenant_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (existingErr) {
    console.error("[grantTenantRole] tenant_profiles lookup failed:", existingErr.message);
    return { error: existingErr.message };
  }

  if (!existing) {
    const { error: insertErr } = await supabase.from("tenant_profiles").insert({
      user_id: userId,
      budget_min: 300000, // R3 000 in cents
      budget_max: 1500000,
    });
    if (insertErr) {
      console.error("[grantTenantRole] tenant_profiles insert failed:", insertErr.message);
      return { error: insertErr.message };
    }
  }

  const { error: profileErr } = await supabase
    .from("profiles")
    .update({ is_tenant: true })
    .eq("id", userId);
  if (profileErr) {
    console.error("[grantTenantRole] profiles update failed:", profileErr.message);
    return { error: profileErr.message };
  }

  const { error: metaErr } = await supabase.auth.updateUser({
    data: { is_tenant: true },
  });
  if (metaErr) {
    console.error("[grantTenantRole] auth.updateUser failed:", metaErr.message);
    return { error: metaErr.message };
  }

  return { error: null };
}
