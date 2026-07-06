import type { FlatmateApplicantStatus, FlatmateListingStatus } from "@/lib/types";

/**
 * Mirrors the RLS predicate on flatmate_listings/flatmate_applicants: only
 * the tenant who created a listing may act on it or its applicants.
 */
export function isListingOwnedByTenant(
  listing: { created_by_tenant_id: string },
  tenantId: string,
): boolean {
  return listing.created_by_tenant_id === tenantId;
}

export type FlatmateActionResult = {
  applicantUpdate: { status: FlatmateApplicantStatus };
  listingUpdate: { status: FlatmateListingStatus; filled_at: string } | null;
};

/**
 * Decides the applicant and listing updates for an approve/decline action.
 * Approving one applicant fills the listing; declining never touches the
 * listing at all, so no other applicant or the listing itself is affected
 * by a decline.
 */
export function resolveFlatmateApplicantAction(
  action: "approve" | "decline",
  now: Date = new Date(),
): FlatmateActionResult {
  if (action === "approve") {
    return {
      applicantUpdate: { status: "approved" },
      listingUpdate: { status: "filled", filled_at: now.toISOString() },
    };
  }
  return {
    applicantUpdate: { status: "declined" },
    listingUpdate: null,
  };
}

/** Builds the shareable apply link for a listing's share_token. */
export function buildFlatmateShareUrl(origin: string, shareToken: string): string {
  return `${origin.replace(/\/$/, "")}/flatmate/${shareToken}`;
}
