import type { VerificationStatus } from "@/lib/types";
import { canApplyWithTrustScore } from "./trustscore";

export type ApplyGateResult =
  | { ok: true }
  | {
      ok: false;
      status: number;
      error: string;
      needsAuth?: boolean;
      needsVerification?: boolean;
    };

// Order matters: auth first (cheapest, most common for a freshly-shared
// link), then duplicate (avoids leaking verification state to someone who
// already applied), then the TrustScore gate itself. Mirrors the status
// codes/shape of src/app/api/flatmate/[token]/apply/route.ts so client
// error handling can follow the same precedent.
export function evaluateApplyGate(input: {
  hasSession: boolean;
  alreadyApplied: boolean;
  verificationStatus: VerificationStatus | null;
}): ApplyGateResult {
  if (!input.hasSession) {
    return { ok: false, status: 401, error: "Sign in to apply", needsAuth: true };
  }
  if (input.alreadyApplied) {
    return {
      ok: false,
      status: 409,
      error: "You have already applied to this property",
    };
  }
  if (!canApplyWithTrustScore(input.verificationStatus ?? "unverified")) {
    return {
      ok: false,
      status: 403,
      error: "Build your TrustScore before applying",
      needsVerification: true,
    };
  }
  return { ok: true };
}
