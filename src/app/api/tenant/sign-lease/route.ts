import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(req: Request) {
  const supabase = createServiceClient();
  const { token, lease_id } = await req.json();

  if (!token || !lease_id) {
    return NextResponse.json(
      { error: "Missing token or lease_id" },
      { status: 400 },
    );
  }

  // Resolve tenant from portal_token (UUID) or legacy access_token
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      token,
    );
  const column = isUuid ? "portal_token" : "access_token";

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq(column, token)
    .single();

  if (!tenant)
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  // Fetch the lease and verify tenant match
  const { data: lease } = await supabase
    .from("lease_agreements")
    .select("tenant_id, landlord_signed_at, status")
    .eq("id", lease_id)
    .single();

  if (!lease)
    return NextResponse.json({ error: "Lease not found" }, { status: 404 });
  if (lease.tenant_id !== tenant.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const updates: Record<string, unknown> = {
    tenant_signed_at: new Date().toISOString(),
  };
  if (lease.landlord_signed_at) updates.status = "signed";

  const { data, error } = await supabase
    .from("lease_agreements")
    .update(updates)
    .eq("id", lease_id)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lease: data });
}
