import { describe, it, expect } from "vitest";

// ── Cron secret validation logic ──────────────────────────────────────────────
// Tests the hardened guard pattern: !CRON_SECRET || auth !== CRON_SECRET
// (replaces the old weak pattern: CRON_SECRET && auth !== CRON_SECRET)

function isCronAuthorised(
  cronSecret: string | undefined,
  authHeader: string | undefined,
): boolean {
  if (!cronSecret || authHeader !== cronSecret) return false;
  return true;
}

describe("cron secret validation", () => {
  it("rejects when CRON_SECRET env var is not set", () => {
    expect(isCronAuthorised(undefined, "any-token")).toBe(false);
  });

  it("rejects when CRON_SECRET is empty string", () => {
    expect(isCronAuthorised("", "any-token")).toBe(false);
  });

  it("rejects when token does not match", () => {
    expect(isCronAuthorised("correct-secret", "wrong-token")).toBe(false);
  });

  it("rejects when no auth header", () => {
    expect(isCronAuthorised("correct-secret", undefined)).toBe(false);
  });

  it("accepts when token matches", () => {
    expect(isCronAuthorised("correct-secret", "correct-secret")).toBe(true);
  });
});

// ── Admin auth helper logic ───────────────────────────────────────────────────
// Tests the is_landlord || ADMIN_TEST_EMAIL check from _auth.ts

function isAdminAuthorised(
  isLandlord: boolean,
  profileEmail: string,
  adminTestEmail: string | undefined,
): boolean {
  return isLandlord || (!!adminTestEmail && profileEmail === adminTestEmail);
}

describe("admin auth logic", () => {
  it("grants access to landlords", () => {
    expect(isAdminAuthorised(true, "anyone@example.com", undefined)).toBe(true);
  });

  it("grants access to admin test email", () => {
    expect(
      isAdminAuthorised(false, "admin@example.com", "admin@example.com"),
    ).toBe(true);
  });

  it("denies when not landlord and email does not match", () => {
    expect(
      isAdminAuthorised(false, "user@example.com", "admin@example.com"),
    ).toBe(false);
  });

  it("denies when ADMIN_TEST_EMAIL is not set and not landlord", () => {
    expect(isAdminAuthorised(false, "user@example.com", undefined)).toBe(false);
  });
});

// ── Token resolution logic ────────────────────────────────────────────────────
// The pattern used in tenant/paid, sign-lease, queries, service-bookings

function resolveTokenColumn(token: string): "portal_token" | "access_token" {
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      token,
    );
  return isUuid ? "portal_token" : "access_token";
}

describe("token column resolution", () => {
  it("resolves UUID to portal_token", () => {
    expect(resolveTokenColumn("550e8400-e29b-41d4-a716-446655440000")).toBe(
      "portal_token",
    );
  });

  it("resolves hex string to access_token", () => {
    expect(resolveTokenColumn("abc123def456")).toBe("access_token");
  });

  it("resolves non-UUID string to access_token", () => {
    expect(resolveTokenColumn("short")).toBe("access_token");
  });

  it("handles uppercase UUID as portal_token", () => {
    expect(resolveTokenColumn("550E8400-E29B-41D4-A716-446655440000")).toBe(
      "portal_token",
    );
  });
});
