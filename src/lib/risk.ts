import type {
  Payment,
  RiskScore,
  TenantProfile as DbTenantProfile,
} from "./types";
import {
  score_tenant_property,
  type TenantProfile as EngineTenantProfile,
  type PropertyData,
  type InsightResult,
} from "./scoring/engine";

export type EnrichedRiskScore = RiskScore & {
  insights: InsightResult[];
  engineScore?: number;
};

/**
 * Calculate risk score for a tenant based on their payment history.
 *
 * Rules:
 * - Start at 100
 * - Each missed payment: -20
 * - Each late payment: -8
 * - Each payment >14 days late: additional -5
 * - 3+ consecutive on-time payments: +10 (once per streak, applied each time streak hits 3+)
 * - Floor: 0, Ceiling: 100
 */
export function calculateRiskScore(payments: Payment[]): RiskScore {
  let score = 100;

  let missed = 0;
  let late = 0;
  let veryLate = 0;

  // Sort by due date ascending to process streak correctly
  const sorted = [...payments].sort(
    (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime(),
  );

  let currentStreak = 0;
  let streakBonuses = 0;

  for (const p of sorted) {
    if (p.status === "missed") {
      score -= 20;
      missed++;
      currentStreak = 0;
    } else if (p.status === "late" || p.status === "paid") {
      // Determine if it was actually late
      const isLate =
        p.status === "late" ||
        (p.paid_date !== null && new Date(p.paid_date) > new Date(p.due_date));

      if (isLate) {
        score -= 8;
        late++;
        currentStreak = 0;

        // Extra penalty if >14 days late
        if (p.paid_date) {
          const daysLate = Math.floor(
            (new Date(p.paid_date).getTime() - new Date(p.due_date).getTime()) /
              (1000 * 60 * 60 * 24),
          );
          if (daysLate > 14) {
            score -= 5;
            veryLate++;
          }
        }
      } else {
        // On time
        currentStreak++;
        if (currentStreak >= 3 && currentStreak % 3 === 0) {
          score += 10;
          streakBonuses++;
        }
      }
    }
  }

  score = Math.max(0, Math.min(100, score));

  let colour: RiskScore["colour"];
  let label: string;
  if (score >= 80) {
    colour = "green";
    label = "Low Risk";
  } else if (score >= 50) {
    colour = "amber";
    label = "Medium Risk";
  } else {
    colour = "red";
    label = "High Risk";
  }

  return {
    score,
    colour,
    label,
    breakdown: { missed, late, veryLate, streak: streakBonuses },
  };
}

/**
 * Returns an enriched risk score that incorporates the full scoring engine
 * when a tenant profile and property data are available, falling back to the
 * payment-history score otherwise.
 */
export function getEnrichedRiskScore(
  payments: Payment[],
  tenantProfile?: DbTenantProfile | null,
  propertyData?: {
    missed_payments?: number;
    late_payments?: number;
    streak?: number;
    rent?: number;
  } | null,
): EnrichedRiskScore {
  const base = calculateRiskScore(payments);

  if (!tenantProfile || !propertyData) {
    return { ...base, insights: [] };
  }

  const avgRent = propertyData.rent ?? (tenantProfile.budget_max ?? 0) / 100;

  // Map the DB TenantProfile to the engine's TenantProfile shape
  const engineProfile: EngineTenantProfile = {
    monthly_income: (tenantProfile.monthly_income ?? 0) / 100,
    rental_budget: avgRent,
    total_living_budget: avgRent * 1.4,
    preferred_suburbs: tenantProfile.looking_in_area
      ? [tenantProfile.looking_in_area]
      : [],
    desired_bedrooms: 1,
    move_in_month: tenantProfile.move_in_date
      ? new Date(tenantProfile.move_in_date).getMonth() + 1
      : 6,
    employment_type: tenantProfile.employment_status ?? undefined,
  };

  const engineProperty: PropertyData = {
    rent: propertyData.rent,
    crime_index: Math.min(100, (propertyData.missed_payments ?? 0) * 20),
    landlord_communication_score: Math.max(
      0,
      10 - (propertyData.late_payments ?? 0) * 2,
    ),
    maintenance_score: Math.min(10, (propertyData.streak ?? 0) * 2),
    deposit_return_score: 5,
  };

  const result = score_tenant_property(engineProfile, engineProperty);

  const insights: InsightResult[] = Object.values(result.insights).filter(
    (v): v is InsightResult => v !== undefined,
  );

  let colour: RiskScore["colour"];
  const engineScore = result.score;
  if (engineScore >= 80) colour = "green";
  else if (engineScore >= 50) colour = "amber";
  else colour = "red";

  return {
    score: engineScore,
    colour,
    label:
      colour === "green"
        ? "Low Risk"
        : colour === "amber"
          ? "Medium Risk"
          : "High Risk",
    breakdown: base.breakdown,
    insights,
    engineScore,
  };
}
