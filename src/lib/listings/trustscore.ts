import type { VerificationStatus } from "@/lib/types";

// TrustScore is tenant_profiles.verification_status, a 4-value enum. There
// is no numeric TrustScore anywhere in this codebase (confirmed in
// docs/overnight/diagnosis-trustscore.md) — never render a number here.

const APPLY_BLOCKED_STATUSES: VerificationStatus[] = ["unverified"];

// Matches the one existing TrustScore-gated flow in the app
// (src/app/api/flatmate/[token]/apply/route.ts): only "unverified" blocks
// applying. pending/verified/rejected are all allowed through, with the
// status shown to the landlord so they can decide.
export function canApplyWithTrustScore(status: VerificationStatus): boolean {
  return !APPLY_BLOCKED_STATUSES.includes(status);
}

const TRUST_LABEL: Record<VerificationStatus, string> = {
  unverified: "No rental history yet",
  pending: "TrustScore pending review",
  verified: "TrustScore verified",
  rejected: "TrustScore review rejected",
};

// Never distinguish "no tenant_profiles row" from an explicit "unverified"
// row — both collapse to the same honest empty state.
export function trustScoreLabel(status: VerificationStatus | null | undefined): string {
  if (!status) return TRUST_LABEL.unverified;
  return TRUST_LABEL[status];
}
