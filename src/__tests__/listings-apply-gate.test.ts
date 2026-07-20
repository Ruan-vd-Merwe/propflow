import { describe, it, expect } from "vitest";
import { evaluateApplyGate } from "@/lib/listings/apply-gate";

describe("evaluateApplyGate", () => {
  it("blocks signed-out visitors with 401 needs_auth", () => {
    const result = evaluateApplyGate({
      hasSession: false,
      alreadyApplied: false,
      verificationStatus: null,
    });
    expect(result).toEqual({
      ok: false,
      status: 401,
      error: "Sign in to apply",
      needsAuth: true,
    });
  });

  it("blocks a duplicate application with 409 before checking TrustScore", () => {
    const result = evaluateApplyGate({
      hasSession: true,
      alreadyApplied: true,
      verificationStatus: "unverified",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(409);
  });

  it("blocks unverified tenants with 403 needs_verification", () => {
    const result = evaluateApplyGate({
      hasSession: true,
      alreadyApplied: false,
      verificationStatus: "unverified",
    });
    expect(result).toEqual({
      ok: false,
      status: 403,
      error: "Build your TrustScore before applying",
      needsVerification: true,
    });
  });

  it("treats a null verification status (no tenant_profiles row) the same as unverified", () => {
    const result = evaluateApplyGate({
      hasSession: true,
      alreadyApplied: false,
      verificationStatus: null,
    });
    expect(result.ok).toBe(false);
  });

  it("allows a verified tenant with no prior application through", () => {
    const result = evaluateApplyGate({
      hasSession: true,
      alreadyApplied: false,
      verificationStatus: "verified",
    });
    expect(result).toEqual({ ok: true });
  });

  it("allows pending and rejected tenants through, same as verified", () => {
    for (const status of ["pending", "rejected"] as const) {
      const result = evaluateApplyGate({
        hasSession: true,
        alreadyApplied: false,
        verificationStatus: status,
      });
      expect(result).toEqual({ ok: true });
    }
  });
});
