import { describe, it, expect } from "vitest";
import {
  score_tenant_property,
  rank_tenant_properties,
  tenant_hard_filter,
  financial_insight,
  safety_insight,
  commute_insight,
} from "@/lib/scoring/tenant-engine";
import type { TenantProfile, PropertyData } from "@/lib/scoring/types";

const baseTenant: TenantProfile = {
  monthly_income: 40000,
  rental_budget: 12000,
  total_living_budget: 16000,
  preferred_suburbs: ["Sea Point"],
  desired_bedrooms: 2,
  move_in_month: 4,
};

const baseProperty: PropertyData = {
  property_id: "prop-1",
  suburb: "Sea Point",
  rent: 10000,
  suburb_avg_rent: 11000,
  bedrooms: 2,
  pets_allowed: true,
};

describe("financial_insight", () => {
  it("returns excellent score when rent < 25% of income", () => {
    const result = financial_insight(baseTenant, {
      ...baseProperty,
      rent: 8000,
    });
    expect(result.score).toBeGreaterThanOrEqual(0.9);
    expect(result.message).toContain("budget");
  });

  it("returns low score when rent > 45% of income", () => {
    const result = financial_insight(baseTenant, {
      ...baseProperty,
      rent: 20000,
    });
    expect(result.score).toBeLessThan(0.2);
    expect(result.message).toContain("pressure");
  });

  it("returns neutral score when no income", () => {
    const result = financial_insight(
      { ...baseTenant, monthly_income: 0 },
      baseProperty,
    );
    expect(result.score).toBeGreaterThanOrEqual(0.5);
    expect(result.message).toContain("budget");
  });
});

describe("safety_insight", () => {
  it("returns high score for low crime area", () => {
    // crime_index=5 with default lighting/security averages → ~0.70
    const result = safety_insight({ ...baseProperty, crime_index: 5 });
    expect(result.score).toBeGreaterThan(0.65);
  });

  it("returns low score for high crime area", () => {
    const result = safety_insight({ ...baseProperty, crime_index: 95 });
    expect(result.score).toBeLessThan(0.35);
  });
});

describe("commute_insight", () => {
  it("returns excellent score for 10min commute", () => {
    const result = commute_insight(
      { ...baseTenant, work_locations: ["CBD"] },
      { ...baseProperty, commute_times: { CBD: 10 } },
    );
    expect(result.score).toBeGreaterThanOrEqual(0.9);
    expect(result.message).toContain("Excellent");
  });

  it("returns neutral when no work locations set", () => {
    const result = commute_insight(
      { ...baseTenant, work_locations: [] },
      { ...baseProperty, commute_times: { CBD: 20 } },
    );
    expect(result.score).toBe(0.5);
  });
});

describe("tenant_hard_filter", () => {
  it("rejects when rent is 1.5x budget", () => {
    const passed = tenant_hard_filter(baseTenant, {
      ...baseProperty,
      rent: baseTenant.rental_budget * 1.6,
    });
    expect(passed).toBe(false);
  });

  it("rejects pets when not allowed", () => {
    const passed = tenant_hard_filter(
      { ...baseTenant, has_pets: true },
      { ...baseProperty, pets_allowed: false },
    );
    expect(passed).toBe(false);
  });

  it("passes a valid property", () => {
    const passed = tenant_hard_filter(baseTenant, baseProperty);
    expect(passed).toBe(true);
  });

  it("rejects dealbreaker tag", () => {
    const passed = tenant_hard_filter(
      { ...baseTenant, dealbreakers: ["no_parking"] },
      { ...baseProperty, property_tags: ["no_parking", "garden"] },
    );
    expect(passed).toBe(false);
  });
});

describe("score_tenant_property", () => {
  it("returns a score between 0 and 100", () => {
    const result = score_tenant_property(baseTenant, baseProperty);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("returns passed_filter true for valid property", () => {
    const result = score_tenant_property(baseTenant, baseProperty);
    expect(result.passed_filter).toBe(true);
  });

  it("includes all insight keys", () => {
    const result = score_tenant_property(baseTenant, baseProperty);
    expect(result.insights).toHaveProperty("financial");
    expect(result.insights).toHaveProperty("safety");
    expect(result.insights).toHaveProperty("deal");
  });

  it("scores a well-matched property higher than a poor one", () => {
    const good = score_tenant_property(baseTenant, {
      ...baseProperty,
      rent: 8000,
      suburb: "Sea Point",
      crime_index: 10,
      landlord_communication_score: 9,
    });
    const poor = score_tenant_property(baseTenant, {
      ...baseProperty,
      rent: 11500,
      suburb: "Unknown Suburb",
      crime_index: 80,
      landlord_communication_score: 2,
    });
    expect(good.score).toBeGreaterThan(poor.score);
  });
});

describe("rank_tenant_properties", () => {
  it("returns properties sorted by score descending", () => {
    const props: PropertyData[] = [
      { ...baseProperty, property_id: "a", rent: 11000, crime_index: 70 },
      { ...baseProperty, property_id: "b", rent: 9000, crime_index: 10 },
      { ...baseProperty, property_id: "c", rent: 10000, crime_index: 40 },
    ];
    const results = rank_tenant_properties(props, baseTenant);
    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i].score).toBeGreaterThanOrEqual(results[i + 1].score);
    }
  });

  it("filters out properties that fail the hard filter", () => {
    const props: PropertyData[] = [
      { ...baseProperty, property_id: "ok", rent: 10000 },
      {
        ...baseProperty,
        property_id: "too-expensive",
        rent: baseTenant.rental_budget * 2,
      },
    ];
    const results = rank_tenant_properties(props, baseTenant);
    expect(results.every((r) => r.passed_filter)).toBe(true);
    expect(
      results.find((r) => r.property_id === "too-expensive"),
    ).toBeUndefined();
  });
});
