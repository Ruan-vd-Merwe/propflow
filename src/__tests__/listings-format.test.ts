import { describe, it, expect } from "vitest";
import {
  formatListingPrice,
  formatBedrooms,
  formatFeatureLabel,
} from "@/lib/listings/format";

// en-ZA's toLocaleString uses a non-breaking space (U+00A0) as the
// thousands separator, not a regular space.
const NBSP = " ";

describe("formatListingPrice", () => {
  it("formats cents as Rand per month", () => {
    expect(formatListingPrice(1200000)).toBe(`R 12${NBSP}000/month`);
  });

  it("never fabricates a price when none exists", () => {
    expect(formatListingPrice(null)).toBe("Price on request");
    expect(formatListingPrice(undefined)).toBe("Price on request");
  });

  it("handles zero as a real, distinct value from missing", () => {
    expect(formatListingPrice(0)).toBe("R 0/month");
  });

  it("uses zero decimal places, matching the app-wide fmtRand convention", () => {
    expect(formatListingPrice(150050)).toBe(`R 1${NBSP}501/month`);
  });
});

describe("formatBedrooms", () => {
  it("labels zero bedrooms as Studio", () => {
    expect(formatBedrooms(0)).toBe("Studio");
  });

  it("singularizes one bedroom", () => {
    expect(formatBedrooms(1)).toBe("1 bedroom");
  });

  it("pluralizes multiple bedrooms", () => {
    expect(formatBedrooms(3)).toBe("3 bedrooms");
  });

  it("returns null instead of fabricating a bedroom count", () => {
    expect(formatBedrooms(null)).toBeNull();
    expect(formatBedrooms(undefined)).toBeNull();
  });
});

describe("formatFeatureLabel", () => {
  it("replaces underscores with spaces", () => {
    expect(formatFeatureLabel("pet_friendly")).toBe("pet friendly");
  });

  it("leaves tags without underscores unchanged", () => {
    expect(formatFeatureLabel("fibre")).toBe("fibre");
  });
});
