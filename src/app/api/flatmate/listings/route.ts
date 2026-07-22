import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * POST /api/flatmate/listings
 *
 * Tenant-initiated: creates a Flatmate Finder listing for the caller's own
 * property. property_id is derived server-side from the caller's own
 * tenants row (resolved by the same email bridge the tenant dashboard uses)
 * so a tenant cannot list a property they do not occupy.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .single();
  if (profileErr || !profile?.email) {
    console.error("[flatmate listings] profile lookup failed:", profileErr?.message);
    return NextResponse.json(
      { error: profileErr?.message ?? "Profile not found" },
      { status: 500 },
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const { data: tenant, error: tenantErr } = await supabase
    .from("tenants")
    .select("id, property_id")
    .eq("email", profile.email)
    .or(`lease_end.is.null,lease_end.gte.${today}`)
    .limit(1)
    .maybeSingle();

  if (tenantErr) {
    console.error("[flatmate listings] tenant lookup failed:", tenantErr.message);
    return NextResponse.json({ error: tenantErr.message }, { status: 500 });
  }
  if (!tenant) {
    return NextResponse.json(
      { error: "No active tenancy found for this account" },
      { status: 403 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const { note, rent_portion_cents, move_in_date } = body as {
    note?: string;
    rent_portion_cents?: number;
    move_in_date?: string;
  };

  if (!rent_portion_cents || rent_portion_cents <= 0 || !move_in_date) {
    return NextResponse.json(
      { error: "rent_portion_cents and move_in_date are required" },
      { status: 400 },
    );
  }

  const { data: existing, error: existingErr } = await supabase
    .from("flatmate_listings")
    .select("id")
    .eq("created_by_tenant_id", tenant.id)
    .eq("status", "active")
    .maybeSingle();

  if (existingErr) {
    console.error("[flatmate listings] existing-listing check failed:", existingErr.message);
    return NextResponse.json({ error: existingErr.message }, { status: 500 });
  }
  if (existing) {
    return NextResponse.json(
      { error: "You already have an active flatmate listing" },
      { status: 409 },
    );
  }

  const { data: listing, error: insertErr } = await supabase
    .from("flatmate_listings")
    .insert({
      property_id: tenant.property_id,
      created_by_tenant_id: tenant.id,
      note: note?.trim() || null,
      rent_portion_cents,
      move_in_date,
      status: "active",
    })
    .select()
    .single();

  if (insertErr) {
    console.error("[flatmate listings] insert failed:", insertErr.message);
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ listing }, { status: 201 });
}
