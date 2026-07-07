import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncSignedLeaseToTenant } from "@/lib/lease/sync-tenant";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("lease_agreements")
    .select(
      `
      *,
      properties ( id, name, address, property_type, bedrooms ),
      tenants ( id, full_name, email, phone, portal_token ),
      profiles!landlord_id ( full_name, email, phone )
    `,
    )
    .eq("id", params.id)
    .eq("landlord_id", user.id)
    .single();

  if (error || !data)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ lease: data });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action } = body;

  // Fetch current lease to verify ownership and get current state
  const { data: current, error: fetchErr } = await supabase
    .from("lease_agreements")
    .select("landlord_id, landlord_signed_at, tenant_signed_at, status")
    .eq("id", params.id)
    .single();

  if (fetchErr || !current)
    return NextResponse.json({ error: "Lease not found" }, { status: 404 });
  if (current.landlord_id !== user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const updates: Record<string, unknown> = {};

  if (action === "sign_landlord") {
    updates.landlord_signed_at = new Date().toISOString();
    if (current.tenant_signed_at) updates.status = "signed";
  } else if (action === "send_to_tenant") {
    updates.status = "sent";
  } else if (action === "enroll_xpello") {
    updates.xpello_enrolled = true;
    updates.xpello_enrolled_at = new Date().toISOString();
  } else if (action === "update_terms") {
    if (current.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft leases can be edited" },
        { status: 400 },
      );
    }
    const editable = [
      "lease_start",
      "lease_end",
      "monthly_rent",
      "deposit_amount",
      "payment_due_day",
      "notice_period_days",
      "pet_allowed",
      "subletting_allowed",
      "special_conditions",
    ] as const;
    for (const key of editable) {
      if (key in body) updates[key] = body[key];
    }
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("lease_agreements")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  if (data.status === "signed") {
    await syncSignedLeaseToTenant(supabase, data);
  }

  return NextResponse.json({ lease: data });
}
