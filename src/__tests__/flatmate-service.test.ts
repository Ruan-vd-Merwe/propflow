import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import {
  isListingOwnedByTenant,
  resolveFlatmateApplicantAction,
  buildFlatmateShareUrl,
} from "@/lib/flatmate/service";

describe("isListingOwnedByTenant", () => {
  it("returns true when the listing belongs to the tenant", () => {
    expect(
      isListingOwnedByTenant({ created_by_tenant_id: "tenant-1" }, "tenant-1"),
    ).toBe(true);
  });

  it("returns false for a different tenant (RLS scoping)", () => {
    expect(
      isListingOwnedByTenant({ created_by_tenant_id: "tenant-1" }, "tenant-2"),
    ).toBe(false);
  });
});

describe("resolveFlatmateApplicantAction", () => {
  const now = new Date("2026-08-01T00:00:00.000Z");

  it("approve marks the applicant approved and the listing filled", () => {
    const result = resolveFlatmateApplicantAction("approve", now);
    expect(result.applicantUpdate).toEqual({ status: "approved" });
    expect(result.listingUpdate).toEqual({
      status: "filled",
      filled_at: now.toISOString(),
    });
  });

  it("decline marks only the applicant declined and never touches the listing", () => {
    const result = resolveFlatmateApplicantAction("decline", now);
    expect(result.applicantUpdate).toEqual({ status: "declined" });
    expect(result.listingUpdate).toBeNull();
  });

  it("approve and decline never produce the same applicant status", () => {
    const approve = resolveFlatmateApplicantAction("approve", now);
    const decline = resolveFlatmateApplicantAction("decline", now);
    expect(approve.applicantUpdate.status).not.toBe(decline.applicantUpdate.status);
  });
});

describe("buildFlatmateShareUrl", () => {
  it("builds a full apply URL from an origin and share token", () => {
    expect(buildFlatmateShareUrl("https://proptrust.co.za", "abc-123")).toBe(
      "https://proptrust.co.za/flatmate/abc-123",
    );
  });

  it("strips a trailing slash from the origin", () => {
    expect(buildFlatmateShareUrl("https://proptrust.co.za/", "abc-123")).toBe(
      "https://proptrust.co.za/flatmate/abc-123",
    );
  });
});

// The share_token column has no application-level generation code (it is a
// Postgres column default), so its uniqueness/generation guarantee is
// verified by asserting the migration declares it correctly rather than by
// exercising a JS function.
describe("flatmate_listings.share_token schema", () => {
  const migrationPath = join(
    process.cwd(),
    "supabase",
    "migration_flatmate_finder.sql",
  );
  const migrationSql = readFileSync(migrationPath, "utf-8");

  it("declares share_token as not null with a random uuid default", () => {
    expect(migrationSql).toMatch(
      /share_token\s+uuid not null default gen_random_uuid\(\)/,
    );
  });

  it("declares a unique index on share_token", () => {
    expect(migrationSql).toMatch(
      /create unique index if not exists flatmate_listings_share_token_idx\s+on public\.flatmate_listings \(share_token\)/,
    );
  });

  it("does not expose a public RLS SELECT policy on flatmate_listings", () => {
    // Only the single "for all" tenant-ownership policy should exist.
    const policyMatches = migrationSql.match(/create policy[^;]*on public\.flatmate_listings/g) ?? [];
    expect(policyMatches).toHaveLength(1);
    expect(migrationSql).toContain('create policy "tenant manages own flatmate listing"');
  });
});
