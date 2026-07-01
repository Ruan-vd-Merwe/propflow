// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface TenantInterestProfile {
  monthly_income: number;
  rental_budget: number;
  total_living_budget: number;
  preferred_suburbs?: string[];
  desired_bedrooms?: number;
  move_in_month?: number;
  work_locations?: string[];
  lifestyle_interests?: string[];
  property_interests?: string[];
  area_interests?: string[];
  must_haves?: string[];
  dealbreakers?: string[];
  has_car?: boolean;
  has_pets?: boolean;
  importance_weights?: Record<string, number>;
}

export interface PropertyData {
  property_id?: string;
  title?: string;
  suburb?: string;
  rent?: number;
  bedrooms?: number;
  floor_size_m2?: number;
  property_tags?: string[];
  area_tags?: string[];
  lifestyle_tags?: string[];
  pets_allowed?: boolean;
  parking_available?: boolean;
  fibre_available?: boolean;
  building_security_score?: number;
  estimated_electricity?: number;
  estimated_water?: number;
  estimated_internet?: number;
  parking_cost?: number;
  estimated_transport?: number;
  tenant_extra_costs?: number;
  suburb_avg_rent?: number;
  rent_per_m2?: number;
  suburb_avg_rent_per_m2?: number;
  days_on_market?: number;
  walkability_score?: number;
  public_transport_score?: number;
  school_quality_score?: number;
  retail_access_score?: number;
  green_space_score?: number;
  minutes_to_coffee?: number;
  minutes_to_grocery?: number;
  minutes_to_gym?: number;
  minutes_to_park?: number;
  minutes_to_restaurant?: number;
  distance_to_main_road_m?: number;
  bars_within_500m?: number;
  building_density_index?: number;
  social_life_score?: number;
  outdoor_lifestyle_score?: number;
  remote_work_score?: number;
  commute_times?: Record<string, number>;
  street_lighting_score?: number;
  pedestrian_activity_score?: number;
  crime_index?: number;
  security_presence_score?: number;
  applications_count?: number;
  purchase_price?: number;
  monthly_rent?: number;
  annual_price_growth?: number;
  vacancy_rate?: number;
  tenant_demand_index?: number;
  family_rental_score?: number;
  discount_to_market?: number;
  price_per_m2?: number;
  area_avg_price_per_m2?: number;
  sales_volume_index?: number;
  avg_days_to_sell?: number;
  buyer_demand_index?: number;
  new_units_pipeline?: number;
  levy_risk_index?: number;
  building_maintenance_risk?: number;
}

export interface ScoreResult {
  property_id?: string;
  title?: string;
  suburb?: string;
  rent?: number;
  bedrooms?: number;
  score: number;
  confidence: number;
  status: "ranked" | "rejected";
  match_reasons: string[];
  warnings: string[];
  rejected_reasons?: string[];
  insights: Record<
    string,
    {
      score: number;
      message: string;
      [key: string]: unknown;
    }
  >;
}

// ─── Default weights ──────────────────────────────────────────────────────────

const DEFAULT_WEIGHTS: Record<string, number> = {
  affordability: 0.22,
  property_fit: 0.18,
  area_fit: 0.17,
  lifestyle_fit: 0.15,
  commute: 0.1,
  deal_quality: 0.08,
  safety: 0.06,
  approval: 0.04,
};

// ─── Utility functions ────────────────────────────────────────────────────────

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

// ─── Scoring helpers ──────────────────────────────────────────────────────────

export function affordability_score(
  profile: TenantInterestProfile,
  property: PropertyData,
): number {
  const rent = property.rent ?? 0;
  if (rent === 0) return 0.5;

  const income_ratio = safe_div(rent, profile.monthly_income);
  const budget_ratio = safe_div(rent, profile.rental_budget);

  const income_score =
    income_ratio <= 0.25
      ? 1.0
      : income_ratio <= 0.3
        ? 0.85
        : income_ratio <= 0.35
          ? 0.65
          : income_ratio <= 0.4
            ? 0.45
            : income_ratio <= 0.5
              ? 0.25
              : 0.05;

  const budget_score =
    budget_ratio <= 0.85
      ? 1.0
      : budget_ratio <= 1.0
        ? 0.8
        : budget_ratio <= 1.1
          ? 0.5
          : budget_ratio <= 1.25
            ? 0.25
            : 0.05;

  return weighted_sum([
    [income_score, 0.55],
    [budget_score, 0.45],
  ]);
}

export function proximity_score(
  profile: TenantInterestProfile,
  property: PropertyData,
): number {
  const preferred = profile.preferred_suburbs ?? [];
  if (preferred.length === 0 || !property.suburb) return 0.5;
  const match = preferred.some(
    (s) => s.toLowerCase() === property.suburb!.toLowerCase(),
  );
  return match ? 1.0 : 0.25;
}

export function tag_match_score(interests: string[], tags: string[]): number {
  if (interests.length === 0 || tags.length === 0) return 0.5;
  const interestsLower = interests.map((s) => s.toLowerCase());
  const tagsLower = tags.map((s) => s.toLowerCase());
  let matches = 0;
  for (const interest of interestsLower) {
    if (tagsLower.some((t) => t.includes(interest) || interest.includes(t))) {
      matches++;
    }
  }
  const ratio = safe_div(matches, interestsLower.length);
  return clamp(0.25 + ratio * 0.75, 0, 1);
}

export function soft_preference_score(
  interests: string[],
  tags: string[],
): number {
  if (interests.length === 0) return 0.6;
  if (tags.length === 0) return 0.4;
  const interestsLower = interests.map((s) => s.toLowerCase());
  const tagsLower = tags.map((s) => s.toLowerCase());
  let score = 0;
  for (const interest of interestsLower) {
    const best = tagsLower.reduce((max, t) => {
      if (t.includes(interest) || interest.includes(t))
        return Math.max(max, 1.0);
      const shorter = interest.length < t.length ? interest : t;
      const longer = interest.length < t.length ? t : interest;
      if (longer.includes(shorter.slice(0, Math.max(3, shorter.length - 2))))
        return Math.max(max, 0.5);
      return max;
    }, 0);
    score += best;
  }
  return clamp(0.2 + safe_div(score, interestsLower.length) * 0.8, 0, 1);
}

// ─── Bedroom size helpers ─────────────────────────────────────────────────────

export function tenant_min_size(desired_bedrooms?: number): number {
  const sizes: Record<number, number> = { 0: 25, 1: 40, 2: 60, 3: 80, 4: 100 };
  const beds = desired_bedrooms ?? 1;
  return sizes[Math.min(beds, 4)] ?? 100;
}

export function tenant_ideal_size(desired_bedrooms?: number): number {
  const sizes: Record<number, number> = { 0: 35, 1: 55, 2: 80, 3: 110, 4: 140 };
  const beds = desired_bedrooms ?? 1;
  return sizes[Math.min(beds, 4)] ?? 140;
}

// ─── Hard filter ──────────────────────────────────────────────────────────────

export function tenant_interest_hard_filter(
  profile: TenantInterestProfile,
  property: PropertyData,
): { passed: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const tags = (property.property_tags ?? []).map((t) => t.toLowerCase());

  // Pets
  if (profile.has_pets && property.pets_allowed === false) {
    reasons.push("Pets not allowed at this property.");
  }

  // Dealbreakers
  for (const breaker of profile.dealbreakers ?? []) {
    if (tags.some((t) => t.includes(breaker.toLowerCase()))) {
      reasons.push(`Dealbreaker matched: ${breaker}.`);
    }
  }

  // Must-haves
  for (const need of profile.must_haves ?? []) {
    const needLower = need.toLowerCase();
    if (!tags.some((t) => t.includes(needLower))) {
      reasons.push(`Required feature not listed: ${need}.`);
    }
  }

  // Hard budget ceiling — > 1.5× budget is unaffordable
  if (property.rent && profile.rental_budget > 0) {
    if (property.rent > profile.rental_budget * 1.5) {
      reasons.push(
        `Rent R${property.rent.toLocaleString("en-ZA")} exceeds your budget by more than 50%.`,
      );
    }
  }

  return { passed: reasons.length === 0, reasons };
}

// ─── Insight functions ────────────────────────────────────────────────────────

export function tenant_affordability_insight(
  profile: TenantInterestProfile,
  property: PropertyData,
): {
  score: number;
  message: string;
  income_ratio: number;
  budget_ratio: number;
} {
  const rent = property.rent ?? 0;
  const elec = property.estimated_electricity ?? 0;
  const water = property.estimated_water ?? 0;
  const internet = property.estimated_internet ?? 0;
  const total_extras =
    elec + water + internet + (property.tenant_extra_costs ?? 0);
  const total_cost = rent + total_extras;

  const income_ratio = safe_div(rent, profile.monthly_income);
  const budget_ratio = safe_div(rent, profile.rental_budget);
  const living_ratio = safe_div(total_cost, profile.total_living_budget);

  let score: number;
  let message: string;

  if (income_ratio <= 0.25 && budget_ratio <= 0.9) {
    score = 0.95;
    message = `Excellent fit. Rent is ${Math.round(income_ratio * 100)}% of income, well within budget.`;
  } else if (income_ratio <= 0.3 && budget_ratio <= 1.0) {
    score = 0.8;
    message = `Good fit. Rent is ${Math.round(income_ratio * 100)}% of income, within budget.`;
  } else if (income_ratio <= 0.35) {
    score = 0.6;
    message = `Manageable. Rent is ${Math.round(income_ratio * 100)}% of income. Slightly stretched.`;
  } else if (income_ratio <= 0.45) {
    score = 0.35;
    message = `Stretched. Rent takes ${Math.round(income_ratio * 100)}% of your income.`;
  } else {
    score = 0.1;
    message = `High financial strain. Rent is ${Math.round(income_ratio * 100)}% of income.`;
  }

  if (living_ratio > 1.0 && total_extras > 0) {
    score = Math.max(score - 0.15, 0.05);
    message += ` Total living costs exceed your budget by ${Math.round((living_ratio - 1) * 100)}%.`;
  }

  return { score, message, income_ratio, budget_ratio };
}

export function property_fit_insight(
  profile: TenantInterestProfile,
  property: PropertyData,
): { score: number; message: string } {
  const scores: [number, number][] = [];
  const notes: string[] = [];

  // Bedroom match
  if (
    profile.desired_bedrooms !== undefined &&
    property.bedrooms !== undefined
  ) {
    const diff = Math.abs(property.bedrooms - profile.desired_bedrooms);
    const bed_score = diff === 0 ? 1.0 : diff === 1 ? 0.65 : 0.3;
    scores.push([bed_score, 0.35]);
    if (diff === 0)
      notes.push(`${property.bedrooms}-bed matches your preference.`);
    else if (diff === 1)
      notes.push(
        `${property.bedrooms} beds, one off your preferred ${profile.desired_bedrooms}.`,
      );
  } else {
    scores.push([0.6, 0.35]);
  }

  // Property interest tag match
  const prop_interests = profile.property_interests ?? [];
  const prop_tags = property.property_tags ?? [];
  if (prop_interests.length > 0) {
    const match = tag_match_score(prop_interests, prop_tags);
    scores.push([match, 0.25]);
  } else {
    scores.push([0.65, 0.25]);
  }

  // Security
  const sec = property.building_security_score ?? 5;
  scores.push([normalize(sec, 0, 10), 0.15]);

  // Parking
  if (profile.has_car) {
    scores.push([property.parking_available ? 1.0 : 0.3, 0.15]);
    if (!property.parking_available)
      notes.push("No parking listed. May need street parking.");
  } else {
    scores.push([0.7, 0.15]);
  }

  // Pets
  if (profile.has_pets) {
    scores.push([property.pets_allowed ? 1.0 : 0.0, 0.1]);
  } else {
    scores.push([0.8, 0.1]);
  }

  const score = weighted_sum(scores);
  const message =
    notes.length > 0
      ? notes.join(" ")
      : score >= 0.75
        ? "Property features match your stated preferences well."
        : score >= 0.5
          ? "Property partially matches your preferences."
          : "Some property features do not match your preferences.";

  return { score, message };
}

export function area_fit_insight(
  profile: TenantInterestProfile,
  property: PropertyData,
): { score: number; message: string } {
  const scores: [number, number][] = [];

  // Suburb proximity
  const prox = proximity_score(profile, property);
  scores.push([prox, 0.35]);

  // Area interests vs area tags
  const area_interests = profile.area_interests ?? [];
  const area_tags = property.area_tags ?? [];
  const area_match = tag_match_score(area_interests, area_tags);
  scores.push([area_match, 0.25]);

  // Walkability
  const walk = property.walkability_score ?? 5;
  scores.push([normalize(walk, 0, 10), 0.15]);

  // School quality (relevant regardless of family status)
  const school = property.school_quality_score ?? 5;
  scores.push([normalize(school, 0, 10), 0.1]);

  // Retail access
  const retail = property.retail_access_score ?? 5;
  scores.push([normalize(retail, 0, 10), 0.1]);

  // Green space
  const green = property.green_space_score ?? 5;
  scores.push([normalize(green, 0, 10), 0.05]);

  const score = weighted_sum(scores);

  const preferred = profile.preferred_suburbs ?? [];
  const inArea =
    preferred.length > 0 &&
    property.suburb &&
    preferred.some((s) => s.toLowerCase() === property.suburb!.toLowerCase());

  const message = inArea
    ? `Located in ${property.suburb}, one of your preferred areas.`
    : score >= 0.75
      ? `${property.suburb ?? "This area"} has strong amenity access and matches your area preferences.`
      : score >= 0.5
        ? `${property.suburb ?? "This area"} partially matches your area preferences.`
        : `${property.suburb ?? "This area"} does not closely match your preferred areas.`;

  return { score, message };
}

export function lifestyle_fit_insight(
  profile: TenantInterestProfile,
  property: PropertyData,
): { score: number; message: string } {
  const scores: [number, number][] = [];
  const interests = profile.lifestyle_interests ?? [];

  // Lifestyle tag match
  const lifestyle_tags = property.lifestyle_tags ?? [];
  const tag_score = soft_preference_score(interests, lifestyle_tags);
  scores.push([tag_score, 0.3]);

  // Amenity proximity
  const proximity_scores: number[] = [];
  if (property.minutes_to_coffee !== undefined)
    proximity_scores.push(inverse_normalize(property.minutes_to_coffee, 0, 30));
  if (property.minutes_to_grocery !== undefined)
    proximity_scores.push(
      inverse_normalize(property.minutes_to_grocery, 0, 20),
    );
  if (property.minutes_to_gym !== undefined)
    proximity_scores.push(inverse_normalize(property.minutes_to_gym, 0, 30));
  if (property.minutes_to_park !== undefined)
    proximity_scores.push(inverse_normalize(property.minutes_to_park, 0, 20));
  if (property.minutes_to_restaurant !== undefined)
    proximity_scores.push(
      inverse_normalize(property.minutes_to_restaurant, 0, 15),
    );

  const avg_proximity =
    proximity_scores.length > 0
      ? proximity_scores.reduce((a, b) => a + b, 0) / proximity_scores.length
      : 0.5;
  scores.push([avg_proximity, 0.25]);

  // Interest-specific boosts
  const interestsLower = interests.map((i) => i.toLowerCase());

  const social_boost = interestsLower.some((i) =>
    ["social", "nightlife", "bars", "restaurants"].includes(i),
  )
    ? normalize(property.social_life_score ?? 5, 0, 10)
    : 0.6;
  scores.push([social_boost, 0.15]);

  const outdoor_boost = interestsLower.some((i) =>
    ["running", "hiking", "cycling", "outdoor", "nature"].includes(i),
  )
    ? normalize(property.outdoor_lifestyle_score ?? 5, 0, 10)
    : 0.6;
  scores.push([outdoor_boost, 0.15]);

  const remote_boost = interestsLower.some((i) =>
    ["remote", "work from home", "wfh", "freelance"].includes(i),
  )
    ? normalize(property.remote_work_score ?? 5, 0, 10)
    : 0.6;
  scores.push([remote_boost, 0.15]);

  const score = weighted_sum(scores);

  const message =
    score >= 0.75
      ? "Area lifestyle strongly matches your interests."
      : score >= 0.5
        ? "Area lifestyle partially aligns with your interests."
        : "Limited lifestyle alignment with this area.";

  return { score, message };
}

export function commute_fit_insight(
  profile: TenantInterestProfile,
  property: PropertyData,
): { score: number; message: string; avg_commute_minutes?: number } {
  const work_locations = profile.work_locations ?? [];
  const commute_times = property.commute_times ?? {};
  const has_car = profile.has_car ?? true;

  if (work_locations.length === 0) {
    // No work locations — score on transport infrastructure
    const transport = property.public_transport_score ?? 5;
    const walk = property.walkability_score ?? 5;
    const score = has_car
      ? 0.7
      : weighted_sum([
          [normalize(transport, 0, 10), 0.6],
          [normalize(walk, 0, 10), 0.4],
        ]);
    return {
      score,
      message:
        "No work locations saved. Add them to your profile for a commute score.",
    };
  }

  const times: number[] = [];
  for (const loc of work_locations) {
    if (commute_times[loc] !== undefined) times.push(commute_times[loc]);
  }

  if (times.length === 0) {
    return {
      score: 0.5,
      message: "Commute data not available for your work locations.",
    };
  }

  const avg = times.reduce((a, b) => a + b, 0) / times.length;

  let score: number;
  if (avg <= 15) score = 0.95;
  else if (avg <= 25) score = 0.8;
  else if (avg <= 35) score = 0.65;
  else if (avg <= 50) score = 0.45;
  else if (avg <= 65) score = 0.25;
  else score = 0.1;

  // Adjust for no-car transit quality
  if (!has_car) {
    const transit = property.public_transport_score ?? 5;
    score = weighted_sum([
      [score, 0.6],
      [normalize(transit, 0, 10), 0.4],
    ]);
  }

  const message =
    avg <= 15
      ? `Excellent commute. ${Math.round(avg)} min average to work.`
      : avg <= 30
        ? `Good commute. ${Math.round(avg)} min to work.`
        : avg <= 45
          ? `Moderate commute. ${Math.round(avg)} min to work.`
          : avg <= 60
            ? `Long commute. ${Math.round(avg)} min. Consider transport costs.`
            : `Very long commute. ${Math.round(avg)} min. This may impact your daily life.`;

  return { score, message, avg_commute_minutes: Math.round(avg) };
}

export function tenant_deal_quality_insight(property: PropertyData): {
  score: number;
  message: string;
  pct_vs_avg?: number;
} {
  const rent = property.rent ?? 0;
  const avg = property.suburb_avg_rent ?? 0;
  const dom = property.days_on_market;

  if (avg === 0) {
    return {
      score: 0.55,
      message: "No suburb average data. Deal quality cannot be assessed.",
    };
  }

  const diff = safe_div(rent - avg, avg);

  let base_score: number;
  let message: string;

  if (diff <= -0.12) {
    base_score = 0.95;
    message = `${Math.round(Math.abs(diff) * 100)}% below suburb average. Excellent value.`;
  } else if (diff <= -0.04) {
    base_score = 0.8;
    message = `Slightly below suburb average. Good deal.`;
  } else if (diff <= 0.05) {
    base_score = 0.65;
    message = `Priced in line with the suburb average.`;
  } else if (diff <= 0.15) {
    base_score = 0.4;
    message = `${Math.round(diff * 100)}% above suburb average.`;
  } else {
    base_score = 0.15;
    message = `${Math.round(diff * 100)}% above suburb average. Significantly overpriced.`;
  }

  // Days on market adjustment — longer = may have room to negotiate
  let score = base_score;
  if (dom !== undefined) {
    if (dom > 45) {
      score = Math.min(base_score + 0.08, 1.0);
      message += ` Listed ${dom} days. Good negotiating position.`;
    } else if (dom < 7) {
      score = Math.max(base_score - 0.05, 0);
      message += ` New listing. Expect high demand.`;
    }
  }

  return { score, message, pct_vs_avg: Math.round(diff * 100) };
}

export function tenant_safety_insight(property: PropertyData): {
  score: number;
  message: string;
} {
  const crime = property.crime_index ?? 50;
  const lighting = property.street_lighting_score ?? 5;
  const pedestrian = property.pedestrian_activity_score ?? 5;
  const security = property.security_presence_score ?? 5;

  const crime_score = inverse_normalize(crime, 0, 100);
  const lighting_score = normalize(lighting, 0, 10);
  const ped_score = normalize(pedestrian, 0, 10);
  const security_score = normalize(security, 0, 10);

  const score = weighted_sum([
    [crime_score, 0.45],
    [security_score, 0.25],
    [lighting_score, 0.15],
    [ped_score, 0.15],
  ]);

  const message =
    score >= 0.8
      ? "Safe area with low crime and good security presence."
      : score >= 0.6
        ? "Reasonably safe area with average security."
        : score >= 0.4
          ? "Moderate safety concerns. Check local security."
          : "Higher-risk area. Research local safety before committing.";

  return { score, message };
}

export function tenant_approval_insight(
  profile: TenantInterestProfile,
  property: PropertyData,
): { score: number; message: string; probability_pct: number } {
  const rent = property.rent ?? 0;
  const income_ratio = safe_div(rent, profile.monthly_income);
  const apps = property.applications_count ?? 2;

  const income_score =
    income_ratio <= 0.25
      ? 1.0
      : income_ratio <= 0.3
        ? 0.85
        : income_ratio <= 0.35
          ? 0.65
          : income_ratio <= 0.4
            ? 0.4
            : 0.2;

  const competition_score = inverse_normalize(apps, 0, 20);

  const score = weighted_sum([
    [income_score, 0.7],
    [competition_score, 0.3],
  ]);
  const probability_pct = Math.round(score * 100);

  const message =
    score >= 0.75
      ? `Strong approval profile. ${probability_pct}% estimated likelihood.`
      : score >= 0.55
        ? `Good approval chances. ${probability_pct}% likelihood, ${apps} competing applications.`
        : score >= 0.4
          ? `Moderate chances. ${probability_pct}% likelihood, ${apps} other applications.`
          : `Lower approval likelihood. ${probability_pct}%. Consider strengthening your profile.`;

  return { score, message, probability_pct };
}

// ─── Confidence ───────────────────────────────────────────────────────────────

export function tenant_match_confidence(property: PropertyData): number {
  const checks: boolean[] = [
    property.suburb !== undefined,
    property.rent !== undefined,
    property.bedrooms !== undefined,
    property.suburb_avg_rent !== undefined,
    property.crime_index !== undefined,
    property.commute_times !== undefined &&
      Object.keys(property.commute_times).length > 0,
    property.area_tags !== undefined && (property.area_tags?.length ?? 0) > 0,
    (property.estimated_electricity ?? 0) > 0,
    property.walkability_score !== undefined,
    property.days_on_market !== undefined,
  ];
  const score = checks.filter(Boolean).length / checks.length;
  return Math.round(score * 100) / 100;
}

// ─── Reasons and warnings ─────────────────────────────────────────────────────

export function generate_interest_match_reasons(
  insights: ScoreResult["insights"],
): string[] {
  const reasons: string[] = [];
  // deal_quality excluded: suburb_avg_rent is self-referential pending real data.
  const order = [
    "affordability",
    "area_fit",
    "property_fit",
    "lifestyle_fit",
    "commute",
    "safety",
  ];
  for (const key of order) {
    const ins = insights[key];
    if (ins && ins.score >= 0.75) {
      reasons.push(ins.message);
      if (reasons.length >= 4) break;
    }
  }
  return reasons;
}

export function generate_interest_match_warnings(
  profile: TenantInterestProfile,
  property: PropertyData,
  insights: ScoreResult["insights"],
): string[] {
  const warnings: string[] = [];

  if (
    insights.affordability?.score !== undefined &&
    insights.affordability.score < 0.4
  ) {
    warnings.push(insights.affordability.message);
  }
  if (insights.safety?.score !== undefined && insights.safety.score < 0.4) {
    warnings.push(insights.safety.message);
  }
  if (insights.commute?.score !== undefined && insights.commute.score < 0.35) {
    warnings.push(insights.commute.message);
  }
  if (profile.has_pets && property.pets_allowed === false) {
    warnings.push("Pets are not permitted at this property.");
  }
  if (profile.has_car && !property.parking_available) {
    warnings.push("No dedicated parking listed.");
  }

  return warnings.slice(0, 3);
}

// ─── Main model ───────────────────────────────────────────────────────────────

export function tenant_interest_match_model(
  profile: TenantInterestProfile,
  property: PropertyData,
): ScoreResult {
  const filter = tenant_interest_hard_filter(profile, property);

  if (!filter.passed) {
    return {
      property_id: property.property_id,
      title: property.title,
      suburb: property.suburb,
      rent: property.rent,
      bedrooms: property.bedrooms,
      score: 0,
      confidence: tenant_match_confidence(property),
      status: "rejected",
      match_reasons: [],
      warnings: [],
      rejected_reasons: filter.reasons,
      insights: {},
    };
  }

  const affordability = tenant_affordability_insight(profile, property);
  const property_fit = property_fit_insight(profile, property);
  const area_fit = area_fit_insight(profile, property);
  const lifestyle_fit = lifestyle_fit_insight(profile, property);
  const commute = commute_fit_insight(profile, property);
  const safety = tenant_safety_insight(property);
  const approval = tenant_approval_insight(profile, property);

  // deal_quality excluded from insights: suburb_avg_rent is self-referential
  // until real suburb-average data is available; tenant_deal_quality_insight
  // exists for future use once that data is populated.
  const insights: ScoreResult["insights"] = {
    affordability,
    property_fit,
    area_fit,
    lifestyle_fit,
    commute,
    safety,
    approval,
  };

  const weights = { ...DEFAULT_WEIGHTS, ...(profile.importance_weights ?? {}) };

  // deal_quality excluded: suburb_avg_rent is self-referential; weighted_sum
  // auto-renormalizes over the remaining weights.
  const raw = weighted_sum([
    [affordability.score, weights.affordability],
    [property_fit.score, weights.property_fit],
    [area_fit.score, weights.area_fit],
    [lifestyle_fit.score, weights.lifestyle_fit],
    [commute.score, weights.commute],
    [safety.score, weights.safety],
    [approval.score, weights.approval],
  ]);

  const score = Math.round(clamp(raw * 100, 0, 100));
  const confidence = tenant_match_confidence(property);

  const match_reasons = generate_interest_match_reasons(insights);
  const warnings = generate_interest_match_warnings(
    profile,
    property,
    insights,
  );

  return {
    property_id: property.property_id,
    title: property.title,
    suburb: property.suburb,
    rent: property.rent,
    bedrooms: property.bedrooms,
    score,
    confidence,
    status: "ranked",
    match_reasons,
    warnings,
    insights,
  };
}

export function rank_properties_for_tenant_interests(
  properties: PropertyData[],
  profile: TenantInterestProfile,
): ScoreResult[] {
  return properties
    .map((p) => tenant_interest_match_model(profile, p))
    .sort((a, b) => {
      if (a.status === "ranked" && b.status !== "ranked") return -1;
      if (a.status !== "ranked" && b.status === "ranked") return 1;
      return b.score - a.score;
    });
}
