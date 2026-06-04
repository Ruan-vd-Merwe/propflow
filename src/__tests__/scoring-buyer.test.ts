import { describe, it, expect } from "vitest";
import {
  score_buyer_property,
  rank_buyer_properties,
  buyer_hard_filter,
  yield_insight,
  capital_growth_insight,
  buyer_weights,
} from "@/lib/scoring/buyer-engine";
import type { BuyerProfile, PropertyData } from "@/lib/scoring/types";

const baseBuyer: BuyerProfile = {
  budget: 2_000_000,
  strategy: "balanced",
  risk_tolerance: "medium",
};

const baseProperty: PropertyData = {
  property_id: "prop-1",
  purchase_price: 1_500_000,
  monthly_rent: 12_000,
  annual_price_growth: 0.07,
  vacancy_rate: 0.07,
  crime_index: 35,
  discount_to_market: 0,
};

describe("yield_insight", () => {
  it("returns excellent score for >10% yield", () => {
    const result = yield_insight({
      ...baseProperty,
      monthly_rent: 15000,
      purchase_price: 1_000_000,
    });
    expect(result.score).toBeGreaterThanOrEqual(0.9);
    expect(result.message).toContain("Excellent");
  });

  it("returns poor score for <4% yield", () => {
    const result = yield_insight({
      ...baseProperty,
      monthly_rent: 4000,
      purchase_price: 2_000_000,
    });
    expect(result.score).toBeLessThan(0.2);
  });

  it("returns neutral score when data missing", () => {
    const result = yield_insight({ ...baseProperty, monthly_rent: 0 });
    expect(result.score).toBe(0.5);
  });
});

describe("capital_growth_insight", () => {
  it("returns exceptional score for 15% growth", () => {
    const result = capital_growth_insight({
      ...baseProperty,
      annual_price_growth: 0.15,
    });
    expect(result.score).toBeGreaterThanOrEqual(0.9);
  });

  it("returns low score for 0% growth", () => {
    const result = capital_growth_insight({
      ...baseProperty,
      annual_price_growth: 0.0,
    });
    expect(result.score).toBeLessThan(0.2);
  });
});

describe("buyer_weights", () => {
  it("yield strategy weights yield highest", () => {
    const w = buyer_weights({ ...baseBuyer, strategy: "yield" });
    expect(w.yield).toBeGreaterThan(w.capital_growth);
    expect(w.yield).toBeGreaterThan(w.stability);
  });

  it("growth strategy weights capital_growth highest", () => {
    const w = buyer_weights({ ...baseBuyer, strategy: "growth" });
    expect(w.capital_growth).toBeGreaterThan(w.yield);
  });

  it("falls back to balanced for unknown strategy", () => {
    const w = buyer_weights({ ...baseBuyer, strategy: "unknown" as never });
    expect(w.yield).toBe(0.2);
    expect(w.capital_growth).toBe(0.2);
  });
});

describe("buyer_hard_filter", () => {
  it("rejects when purchase_price > 110% of budget", () => {
    const passed = buyer_hard_filter(baseBuyer, {
      ...baseProperty,
      purchase_price: 2_300_000,
    });
    expect(passed).toBe(false);
  });

  it("rejects dealbreaker tag", () => {
    const passed = buyer_hard_filter(
      { ...baseBuyer, dealbreakers: ["leasehold"] },
      { ...baseProperty, property_tags: ["leasehold", "sea_view"] },
    );
    expect(passed).toBe(false);
  });

  it("passes a valid property", () => {
    const passed = buyer_hard_filter(baseBuyer, baseProperty);
    expect(passed).toBe(true);
  });
});

describe("score_buyer_property", () => {
  it("returns score between 0 and 100", () => {
    const result = score_buyer_property(baseBuyer, baseProperty);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("returns passed_filter true for affordable property", () => {
    const result = score_buyer_property(baseBuyer, baseProperty);
    expect(result.passed_filter).toBe(true);
  });

  it("high-yield property scores well for yield-strategy buyer", () => {
    const yieldBuyer: BuyerProfile = { ...baseBuyer, strategy: "yield" };
    const highYield = score_buyer_property(yieldBuyer, {
      ...baseProperty,
      monthly_rent: 18_000,
      purchase_price: 1_200_000,
    });
    const lowYield = score_buyer_property(yieldBuyer, {
      ...baseProperty,
      monthly_rent: 5_000,
      purchase_price: 1_800_000,
    });
    expect(highYield.score).toBeGreaterThan(lowYield.score);
  });
});

describe("rank_buyer_properties", () => {
  it("returns results in descending score order", () => {
    const props: PropertyData[] = [
      {
        ...baseProperty,
        property_id: "a",
        monthly_rent: 6_000,
        purchase_price: 1_800_000,
      },
      {
        ...baseProperty,
        property_id: "b",
        monthly_rent: 15_000,
        purchase_price: 1_200_000,
      },
      {
        ...baseProperty,
        property_id: "c",
        monthly_rent: 10_000,
        purchase_price: 1_500_000,
      },
    ];
    const results = rank_buyer_properties(props, baseBuyer);
    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i].score).toBeGreaterThanOrEqual(results[i + 1].score);
    }
  });

  it("excludes properties above budget", () => {
    const props: PropertyData[] = [
      { ...baseProperty, property_id: "cheap", purchase_price: 1_000_000 },
      {
        ...baseProperty,
        property_id: "too-expensive",
        purchase_price: 2_500_000,
      },
    ];
    const results = rank_buyer_properties(props, baseBuyer);
    expect(
      results.find((r) => r.property_id === "too-expensive"),
    ).toBeUndefined();
  });
});
