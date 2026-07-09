import { describe, expect, it } from "vitest";
import {
  calculateRentalReliabilityScore,
  type RentalReliabilityInput,
} from "@/lib/rental-reliability";

const baseProfile: RentalReliabilityInput = {
  tenantName: "Test Tenant",
  monthlyIncome: 40000,
  rentAmount: 10000,
  incomeVerified: true,
  incomeMonthsVerified: 3,
  employmentStabilityMonths: 18,
  bureauConsentGranted: true,
  bureauProvider: "TPN",
  bureauScoreBand: "good",
  rentalPayments: [
    { month: "2026-04", status: "on_time", verified: true, source: "proof_of_payment" },
    { month: "2026-05", status: "on_time", verified: true, source: "proof_of_payment" },
    { month: "2026-06", status: "on_time", verified: true, source: "proof_of_payment" },
  ],
  landlordReference: { verified: true, wouldRentAgain: true, paymentComment: "positive" },
  documents: [
    { type: "lease", verified: true, confidence: "High" },
    { type: "income", verified: true, confidence: "High" },
    { type: "proof_of_payment", verified: true, confidence: "High" },
  ],
  profileCompleteness: 0.9,
};

describe("calculateRentalReliabilityScore", () => {
  it("does not automatically reject bad credit when there are 3 perfect rent payments", () => {
    const result = calculateRentalReliabilityScore({
      ...baseProfile,
      bureauScoreBand: "poor",
      bureauItems: [{ type: "minor_telecom", ageMonths: 30, amountBand: "small", settled: true }],
    });

    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.positiveFactors.join(" ")).toContain("verified on-time rental payments");
    expect(result.landlordSummary.warningFlags).not.toContain("Adverse event review recommended");
  });

  it("handles no credit history with strong income and rent evidence", () => {
    const result = calculateRentalReliabilityScore({
      ...baseProfile,
      bureauScoreBand: "thin_file",
      bureauItems: [],
      landlordReference: { verified: false },
    });

    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.components.find((item) => item.key === "bureau_credit_behaviour")?.explanation).toContain("thin");
  });

  it("flags good credit with weak affordability", () => {
    const result = calculateRentalReliabilityScore({
      ...baseProfile,
      monthlyIncome: 22000,
      rentAmount: 12500,
      bureauScoreBand: "excellent",
      rentalPayments: [],
      documents: [{ type: "id", verified: true, confidence: "Medium" }],
      landlordReference: { verified: false },
      profileCompleteness: 0.6,
    });

    expect(result.score).toBeLessThan(70);
    expect(result.landlordSummary.warningFlags).toContain("Affordability pressure indicated");
  });

  it("penalizes recent judgments/default events even with good rent proof", () => {
    const result = calculateRentalReliabilityScore({
      ...baseProfile,
      bureauItems: [{ type: "judgment", ageMonths: 4, amountBand: "large" }],
    });

    expect(result.score).toBeLessThan(85);
    expect(result.landlordSummary.warningFlags).toContain("Adverse event review recommended");
  });

  it("reduces impact of disputed bureau items and asks for tenant context", () => {
    const disputed = calculateRentalReliabilityScore({
      ...baseProfile,
      bureauScoreBand: "poor",
      bureauItems: [{ type: "recent_default", ageMonths: 2, amountBand: "medium", disputed: true }],
    });
    const undisputed = calculateRentalReliabilityScore({
      ...baseProfile,
      bureauScoreBand: "poor",
      bureauItems: [{ type: "recent_default", ageMonths: 2, amountBand: "medium" }],
    });

    expect(disputed.score).toBeGreaterThan(undisputed.score);
    expect(disputed.tenantActions).toContain("Add an explanation or supporting documents for disputed bureau information.");
    expect(disputed.landlordSummary.warningFlags).toContain("Tenant dispute or explanation pending");
  });

  it("scores missing documents as low confidence", () => {
    const result = calculateRentalReliabilityScore({
      ...baseProfile,
      incomeVerified: false,
      incomeMonthsVerified: 0,
      rentalPayments: [],
      documents: [],
      landlordReference: { verified: false },
      profileCompleteness: 0.25,
    });

    expect(result.confidence).toBe("Low");
    expect(result.score).toBeLessThan(55);
    expect(result.tenantActions).toContain("Upload at least three months of verifiable rent payment proof.");
  });

  it("flags inconsistent proof of payment", () => {
    const result = calculateRentalReliabilityScore({
      ...baseProfile,
      rentalPayments: [
        { month: "2026-04", status: "on_time", verified: true, source: "proof_of_payment" },
        { month: "2026-05", status: "inconsistent", verified: true, source: "proof_of_payment" },
        { month: "2026-06", status: "partial", verified: true, source: "proof_of_payment" },
      ],
    });

    expect(result.score).toBeLessThan(80);
    expect(result.landlordSummary.warningFlags).toContain("Rental payment evidence incomplete or inconsistent");
  });
});
