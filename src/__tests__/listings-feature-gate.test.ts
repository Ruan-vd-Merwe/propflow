import { describe, it, expect } from "vitest";
import { isPublicListingsEnabled, isMissingRelationError } from "@/lib/listings/feature-gate";

function stubClient(response: { data: unknown; error: { code?: string; message: string } | null }) {
  return {
    from: () => ({
      select: () => ({
        limit: async () => response,
      }),
    }),
  };
}

describe("isMissingRelationError", () => {
  it("recognises Postgres undefined_table (42P01)", () => {
    expect(isMissingRelationError({ code: "42P01", message: "x" })).toBe(true);
  });

  it("recognises PostgREST schema cache miss (PGRST205)", () => {
    expect(isMissingRelationError({ code: "PGRST205", message: "x" })).toBe(true);
  });

  it("does not treat an unrelated error as missing-relation", () => {
    expect(isMissingRelationError({ code: "42501", message: "permission denied" })).toBe(false);
  });

  it("handles null/undefined safely", () => {
    expect(isMissingRelationError(null)).toBe(false);
    expect(isMissingRelationError(undefined)).toBe(false);
  });
});

describe("isPublicListingsEnabled", () => {
  it("returns true when the view query succeeds", async () => {
    const client = stubClient({ data: [], error: null });
    expect(await isPublicListingsEnabled(client)).toBe(true);
  });

  it("returns false, not throw, when the view does not exist yet (pre-migration)", async () => {
    const client = stubClient({
      data: null,
      error: { code: "42P01", message: 'relation "public_listings" does not exist' },
    });
    expect(await isPublicListingsEnabled(client)).toBe(false);
  });

  it("returns false, not throw, on a PostgREST schema cache miss", async () => {
    const client = stubClient({
      data: null,
      error: { code: "PGRST205", message: "Could not find the table" },
    });
    expect(await isPublicListingsEnabled(client)).toBe(false);
  });

  it("treats any other error defensively as unavailable rather than crashing the page", async () => {
    const client = stubClient({
      data: null,
      error: { code: "42501", message: "permission denied for table public_listings" },
    });
    expect(await isPublicListingsEnabled(client)).toBe(false);
  });
});
