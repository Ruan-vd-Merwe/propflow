import type { TenantProfile, PropertyData } from "./types";

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function safe_div(a: number, b: number, fallback = 0): number {
  if (b === 0 || !isFinite(b)) return fallback;
  return a / b;
}

export function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return clamp((value - min) / (max - min), 0, 1);
}

export function inverse_normalize(
  value: number,
  min: number,
  max: number,
): number {
  return 1 - normalize(value, min, max);
}

export function weighted_sum(scores: [number, number][]): number {
  let total_weight = 0;
  let total_score = 0;
  for (const [score, weight] of scores) {
    total_score += score * weight;
    total_weight += weight;
  }
  return safe_div(total_score, total_weight, 0);
}

export function confidence_score(property: PropertyData): number {
  const fields = [
    property.suburb,
    property.rent ?? property.monthly_rent,
    property.bedrooms,
    property.suburb_avg_rent,
    property.crime_index,
    property.landlord_communication_score,
    property.commute_times,
    property.area_tags,
    property.estimated_electricity,
    property.days_on_market,
  ];
  const present = fields.filter((f) => f !== undefined && f !== null).length;
  return present / fields.length;
}

export function percentage_difference(a: number, b: number): number {
  if (b === 0) return 0;
  return (a - b) / b;
}

export function affordability_score(
  profile: TenantProfile,
  property: PropertyData,
): number {
  const rent = property.rent ?? 0;
  if (rent === 0) return 0.5;
  const budget_ratio = safe_div(rent, profile.rental_budget, 1);
  const income_ratio = safe_div(rent, profile.monthly_income, 1);
  const budget_score =
    budget_ratio <= 1
      ? 1 - budget_ratio * 0.5
      : Math.max(0, 1.5 - budget_ratio);
  const income_score =
    income_ratio <= 0.3
      ? 1
      : income_ratio <= 0.4
        ? 0.7
        : income_ratio <= 0.5
          ? 0.4
          : 0.1;
  return weighted_sum([
    [budget_score, 0.6],
    [income_score, 0.4],
  ]);
}

export function proximity_score(
  profile: TenantProfile,
  property: PropertyData,
): number {
  if (!profile.preferred_suburbs?.length || !property.suburb) return 0.5;
  const inPreferred = profile.preferred_suburbs.some(
    (s) => s.toLowerCase() === property.suburb!.toLowerCase(),
  );
  return inPreferred ? 1.0 : 0.3;
}

export function count_events(
  events: Array<{ event_type: string }>,
  type: string,
): number {
  return events.filter((e) => e.event_type === type).length;
}
