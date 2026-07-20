import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAnonClient } from "@/lib/supabase/anon";
import { createServiceClient } from "@/lib/supabase/service";
import { isPublicListingsEnabled } from "@/lib/listings/feature-gate";
import { getVerificationStatusForUser } from "@/lib/listings/trustscore-server";
import { evaluateApplyGate } from "@/lib/listings/apply-gate";

export const runtime = "nodejs";

/**
 * POST /api/listings/[id]/apply
 *
 * Requires a session (this route is only reachable from
 * /listings/[id]/apply, which middleware already gates for signed-out
 * visitors). Insert goes through the anon client because
 * tenant_applications only has an INSERT policy for the anon role
 * (tenant_applications_insert_anon) -- there is no authenticated INSERT
 * policy, matching the existing convention in
 * src/app/api/applications/route.ts. TrustScore gating happens here,
 * before the insert, because the anon client does not forward the caller's
 * JWT so auth.uid() is not available to a DB-level policy on this path.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();

  const enabled = await isPublicListingsEnabled(supabase);
  if (!enabled) {
    return NextResponse.json(
      { error: "Public listings are not available yet" },
      { status: 503 },
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const body = await req.json().catch(() => ({}));
  const { message } = body as { message?: string };

  const service = createServiceClient();
  const { data: listing, error: listingErr } = await service
    .from("public_listings")
    .select("id")
    .eq("id", params.id)
    .maybeSingle();

  if (listingErr) {
    console.error("[listings/apply] listing lookup failed:", listingErr.message);
    return NextResponse.json({ error: listingErr.message }, { status: 500 });
  }
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  let alreadyApplied = false;
  if (user) {
    const { data: existing, error: existingErr } = await service
      .from("tenant_applications")
      .select("id")
      .eq("property_id", params.id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (existingErr) {
      console.error("[listings/apply] duplicate check failed:", existingErr.message);
      return NextResponse.json({ error: existingErr.message }, { status: 500 });
    }
    alreadyApplied = !!existing;
  }

  const verificationStatus = user
    ? await getVerificationStatusForUser(supabase, user.id)
    : null;

  const gate = evaluateApplyGate({
    hasSession: !!user,
    alreadyApplied,
    verificationStatus,
  });

  if (!gate.ok) {
    return NextResponse.json(
      {
        error: gate.error,
        ...(gate.needsAuth ? { needs_auth: true } : {}),
        ...(gate.needsVerification ? { needs_verification: true } : {}),
      },
      { status: gate.status },
    );
  }

  // user is guaranteed non-null past evaluateApplyGate's hasSession check
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user!.id)
    .maybeSingle();

  if (profileErr) {
    console.error("[listings/apply] profile lookup failed:", profileErr.message);
    return NextResponse.json({ error: profileErr.message }, { status: 500 });
  }

  // anon has no SELECT policy on tenant_applications (only the owning
  // landlord and, separately, the authenticated applicant can select their
  // own row) -- .select().single() after an anon insert would return 0
  // rows, matching src/app/api/applications/route.ts's existing workaround.
  const applicationId = randomUUID();

  const anon = createAnonClient();
  const { error: insertErr } = await anon.from("tenant_applications").insert({
    id: applicationId,
    property_id: params.id,
    user_id: user!.id,
    full_name: profile?.full_name ?? user!.email ?? "PropTrust tenant",
    email: profile?.email ?? user!.email ?? "",
    message: message?.trim() || null,
    status: "pending",
  });

  if (insertErr) {
    console.error("[listings/apply] insert failed:", insertErr.message);
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ application: { id: applicationId } }, { status: 201 });
}
