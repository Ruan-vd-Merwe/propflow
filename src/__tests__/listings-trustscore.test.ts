import { describe, it, expect } from "vitest";
import { canApplyWithTrustScore, trustScoreLabel } from "@/lib/listings/trustscore";

describe("canApplyWithTrustScore", () => {
  it("blocks unverified tenants", () => {
    expect(canApplyWithTrustScore("unverified")).toBe(false);
  });

  it("allows pending tenants (matches the flatmate precedent)", () => {
    expect(canApplyWithTrustScore("pending")).toBe(true);
  });

  it("allows verified tenants", () => {
    expect(canApplyWithTrustScore("verified")).toBe(true);
  });

  it("allows rejected tenants through, landlord sees the status", () => {
    expect(canApplyWithTrustScore("rejected")).toBe(true);
  });
});

describe("trustScoreLabel", () => {
  it("never renders a numeric score, only text labels", () => {
    for (const status of ["unverified", "pending", "verified", "rejected"] as const) {
      expect(trustScoreLabel(status)).toEqual(expect.any(String));
      expect(trustScoreLabel(status)).not.toMatch(/^\d+$/);
    }
  });

  it("collapses null (no tenant_profiles row) into the same honest state as explicit unverified", () => {
    expect(trustScoreLabel(null)).toBe(trustScoreLabel("unverified"));
  });

  it("collapses undefined the same way", () => {
    expect(trustScoreLabel(undefined)).toBe(trustScoreLabel("unverified"));
  });

  it("uses honest 'no rental history yet' framing for unverified, not a fabricated score", () => {
    expect(trustScoreLabel("unverified")).toBe("No rental history yet");
  });
});
