import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

/**
 * POST /api/tenant/maintenance: authenticated tenant dashboard
 *
 * The authenticated tenant dashboard (auth.users) has no direct link to
 * public.tenants (the lease record, only reachable today via the token
 * portal). We match on profile email to find the tenant's active lease,
 * the same identity bridge the dashboard's "Current Tenancy" card already
 * relies on being absent.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .single();
  if (!profile?.email) {
    return NextResponse.json({ error: "No profile email on file" }, { status: 400 });
  }

  const body = await req.json();
  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? "").trim();
  if (!title || !description) {
    return NextResponse.json(
      { error: "title and description are required" },
      { status: 400 },
    );
  }

  const service = createServiceClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: tenant } = await service
    .from("tenants")
    .select("id, lease_end")
    .eq("email", profile.email)
    .or(`lease_end.is.null,lease_end.gte.${today}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!tenant) {
    return NextResponse.json(
      { error: "No active lease found for this account" },
      { status: 403 },
    );
  }

  const { data: query, error } = await service
    .from("tenant_queries")
    .insert({
      tenant_id: tenant.id,
      category: "maintenance",
      title,
      description,
      status: "open",
    })
    .select("id, status, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, query }, { status: 201 });
}
