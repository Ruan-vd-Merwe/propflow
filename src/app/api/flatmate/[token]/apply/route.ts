import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

/**
 * POST /api/flatmate/[token]/apply
 *
 * Public route (no session required to reach it, but a session IS required
 * to actually apply, since TrustScore is read from the applicant's own
 * tenant_profiles row). Listing lookup goes through the service role key,
 * same caution as other token-based routes. flatmate_listings has no
 * public RLS SELECT policy.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } },
) {
  const body = await req.json().catch(() => ({}));
  const { full_name, email, phone } = body as {
    full_name?: string;
    email?: string;
    phone?: string;
  };

  if (!full_name?.trim() || !email?.trim()) {
    return NextResponse.json(
      { error: "full_name and email are required" },
      { status: 400 },
    );
  }

  const service = createServiceClient();
  const { data: listing, error: listingErr } = await service
    .from("flatmate_listings")
    .select("id, status")
    .eq("share_token", params.token)
    .single();

  if (listingErr || !listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }
  if (listing.status !== "active") {
    return NextResponse.json(
      { error: "This listing is no longer accepting applicants" },
      { status: 400 },
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in to apply", needs_auth: true },
      { status: 401 },
    );
  }

  const { data: tp, error: tpErr } = await supabase
    .from("tenant_profiles")
    .select("verification_status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (tpErr) {
    console.error("[flatmate apply] tenant_profiles lookup failed:", tpErr.message);
    return NextResponse.json({ error: tpErr.message }, { status: 500 });
  }

  const verificationStatus = tp?.verification_status ?? "unverified";
  if (verificationStatus === "unverified") {
    return NextResponse.json(
      { error: "Build your TrustScore before applying", needs_verification: true },
      { status: 403 },
    );
  }

  const { data: applicant, error: insertErr } = await service
    .from("flatmate_applicants")
    .insert({
      listing_id: listing.id,
      full_name: full_name.trim(),
      email: email.trim(),
      phone: phone?.trim() || null,
      applicant_profile_id: user.id,
      trust_status_snapshot: verificationStatus,
      status: "pending",
    })
    .select()
    .single();

  if (insertErr) {
    console.error("[flatmate apply] insert failed:", insertErr.message);
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ applicant }, { status: 201 });
}
