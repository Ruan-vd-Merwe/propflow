import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendFlatmateApprovalEmail } from "@/lib/resend";
import { getSiteUrl } from "@/lib/site-url";
import { resolveFlatmateApplicantAction } from "@/lib/flatmate/service";

export const runtime = "nodejs";

/**
 * PATCH /api/flatmate/applicants/[id]
 *
 * Tenant-only (the listing's owning tenant). RLS on flatmate_applicants
 * already restricts reads/updates to that tenant, so a non-owner's select
 * below simply returns no row.
 *
 * action: "approve" sets the applicant approved and the listing filled.
 * action: "decline" sets only the applicant declined; the listing status is
 * never touched by a decline.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { action } = body as { action?: string };
  if (action !== "approve" && action !== "decline") {
    return NextResponse.json(
      { error: "action must be approve or decline" },
      { status: 400 },
    );
  }

  const { data: applicant, error: fetchErr } = await supabase
    .from("flatmate_applicants")
    .select(
      `*, flatmate_listings ( id, status, property_id, properties!inner ( name, owner_id, profiles!inner ( email, full_name ) ) )`,
    )
    .eq("id", params.id)
    .single();

  if (fetchErr || !applicant) {
    return NextResponse.json({ error: "Applicant not found" }, { status: 404 });
  }

  const { applicantUpdate, listingUpdate } = resolveFlatmateApplicantAction(action);

  const { data: updatedApplicant, error: applicantErr } = await supabase
    .from("flatmate_applicants")
    .update(applicantUpdate)
    .eq("id", params.id)
    .select()
    .single();

  if (applicantErr) {
    console.error(`[flatmate applicants] ${action} failed:`, applicantErr.message);
    return NextResponse.json({ error: applicantErr.message }, { status: 500 });
  }

  if (!listingUpdate) {
    // decline never touches the listing
    return NextResponse.json({ applicant: updatedApplicant });
  }

  const listing = applicant.flatmate_listings as unknown as {
    id: string;
    status: string;
    property_id: string;
    properties: {
      name: string;
      owner_id: string;
      profiles: { email: string; full_name: string } | null;
    };
  };

  const { data: updatedListing, error: listingErr } = await supabase
    .from("flatmate_listings")
    .update(listingUpdate)
    .eq("id", listing.id)
    .eq("status", "active")
    .select()
    .single();

  if (listingErr) {
    console.error("[flatmate applicants] listing update failed:", listingErr.message);
    return NextResponse.json({ error: listingErr.message }, { status: 500 });
  }

  const landlord = listing.properties?.profiles;
  let emailSent = false;
  let emailError: string | undefined;

  if (landlord?.email) {
    const result = await sendFlatmateApprovalEmail({
      toEmail: landlord.email,
      landlordName: landlord.full_name,
      propertyName: listing.properties.name,
      applicantName: applicant.full_name,
      applicantEmail: applicant.email,
      applicantPhone: applicant.phone,
      trustStatusSnapshot: applicant.trust_status_snapshot,
      appUrl: getSiteUrl(),
    });
    emailSent = result.success;
    if (!result.success) {
      emailError = result.error;
      console.error("[flatmate applicants] landlord email failed:", result.error);
    }
  } else {
    emailError = "Landlord email not found";
    console.error("[flatmate applicants] landlord email not found for listing", listing.id);
  }

  return NextResponse.json({
    applicant: updatedApplicant,
    listing: updatedListing,
    email_sent: emailSent,
    email_error: emailError,
  });
}
