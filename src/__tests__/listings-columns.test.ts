import { describe, it, expect } from "vitest";
import { PUBLIC_LISTING_COLUMNS } from "@/lib/listings/columns";

// This is the DB-view-exposure contract test: it asserts, without needing a
// live database, that the column list the app queries against
// public_listings contains only the fields Decision Rule 1 allows and
// nothing landlord-identifying. Keep this in lockstep with the view
// definition in supabase/migrations/20260720120000_public_listings.sql.

const ALLOWED_COLUMNS = [
  "id",
  "title",
  "description",
  "price_cents",
  "suburb",
  "bedrooms",
  "features",
  "image_refs",
  "published",
];

const FORBIDDEN_SUBSTRINGS = [
  "owner",
  "address",
  "email",
  "phone",
  "bond",
  "purchase_price",
  "current_value",
  "levy",
  "rates",
  "insurance",
  "management_fee",
  "notes",
  "postal_code",
  "street",
  "building_name",
  "block_number",
  "unit_number",
  "floor_number",
];

describe("PUBLIC_LISTING_COLUMNS (anon/authenticated view exposure)", () => {
  const requested = PUBLIC_LISTING_COLUMNS.split(",").map((c) => c.trim());

  it("requests only the allowed column set, nothing more", () => {
    for (const col of requested) {
      expect(ALLOWED_COLUMNS).toContain(col);
    }
  });

  it("requests every allowed column (no accidental omission)", () => {
    for (const col of ALLOWED_COLUMNS) {
      expect(requested).toContain(col);
    }
  });

  it("never requests a landlord-identifying or financial column", () => {
    const lower = PUBLIC_LISTING_COLUMNS.toLowerCase();
    for (const forbidden of FORBIDDEN_SUBSTRINGS) {
      expect(lower).not.toContain(forbidden);
    }
  });

  it("does not select owner_id specifically", () => {
    expect(requested).not.toContain("owner_id");
  });
});
