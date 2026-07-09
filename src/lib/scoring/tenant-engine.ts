import type {
  TenantProfile,
  PropertyData,
  InsightResult,
  TenantScoringResult,
} from "./types";
import {
  safe_div,
  normalize,
  inverse_normalize,
  weighted_sum,
  confidence_score,
  percentage_difference,
  count_events,
  clamp,
} from "./utils";

export function financial_insight(
  profile: TenantProfile,
  property: PropertyData,
): InsightResult {
  const rent = property.rent ?? 0;
  const income = profile.monthly_income;
  const budget = profile.rental_budget;

  if (income === 0)
    return {
      score: budget > 0 && rent <= budget ? 0.8 : 0.5,
      message:
        budget > 0 && rent <= budget
          ? "Within your stated rental budget. Add affordability details for a more complete view."
          : "Add affordability details for a more complete budget view.",
    };

  const income_ratio = safe_div(rent, income);
  const budget_ratio = safe_div(rent, budget);

  if (income_ratio <= 0.25 && budget_ratio <= 0.9) {
    return {
      score: 0.95,
      message: "Comfortably within your stated rental budget.",
    };
  } else if (income_ratio <= 0.3 && budget_ratio <= 1.0) {
    return {
      score: 0.8,
      message: "Within your stated rental budget.",
    };
  } else if (income_ratio <= 0.35 || budget_ratio <= 1.1) {
    return {
      score: 0.6,
      message: "Close to your stated budget. Review total monthly costs.",
    };
  } else if (income_ratio <= 0.45) {
    return {
      score: 0.35,
      message: "This may stretch your budget. Consider your full cost of living.",
    };
  } else {
    return {
      score: 0.1,
      message: "This is likely to place pressure on your budget.",
    };
  }
}

export function deal_insight(
  profile: TenantProfile,
  property: PropertyData,
): InsightResult {
  void profile;
  const rent = property.rent ?? 0;
  const avg = property.suburb_avg_rent ?? rent;

  if (avg === 0)
    return {
      score: 0.5,
      message: "No suburb average data to assess deal value.",
    };

  const diff = percentage_difference(rent, avg);

  if (diff <= -0.1) {
    return {
      score: 0.95,
      message: `${Math.round(Math.abs(diff) * 100)}% below suburb average. Excellent deal.`,
    };
  } else if (diff <= -0.03) {
    return {
      score: 0.8,
      message: "Slightly below suburb average. Good value.",
    };
  } else if (diff <= 0.05) {
    return { score: 0.65, message: "In line with suburb average pricing." };
  } else if (diff <= 0.15) {
    return {
      score: 0.4,
      message: `${Math.round(diff * 100)}% above suburb average. On the higher end.`,
    };
  } else {
    return {
      score: 0.15,
      message: `${Math.round(diff * 100)}% above suburb average. Significantly overpriced.`,
    };
  }
}

export function timing_insight(
  profile: TenantProfile,
  property: PropertyData,
): InsightResult {
  void property;
  const month = profile.move_in_month;
  const peak_months = [1, 7, 12];
  const shoulder_months = [2, 6, 8, 11];

  if (peak_months.includes(month)) {
    return {
      score: 0.5,
      message:
        "Peak rental season. Expect high competition and standard pricing.",
    };
  } else if (shoulder_months.includes(month)) {
    return {
      score: 0.7,
      message:
        "Shoulder season. Moderate competition with potential negotiating room.",
    };
  } else {
    return {
      score: 0.85,
      message:
        "Off-peak timing. Good position to negotiate and less competition.",
    };
  }
}

export function lifestyle_insight(
  profile: TenantProfile,
  property: PropertyData,
): InsightResult {
  const lifestyle_tags = profile.lifestyle_tags ?? [];
  const area_tags = property.area_tags ?? [];
  const area_personality = property.area_personality ?? [];

  if (lifestyle_tags.length === 0) {
    const scores: number[] = [];
    if (property.minutes_to_coffee !== undefined)
      scores.push(inverse_normalize(property.minutes_to_coffee, 0, 30));
    if (property.minutes_to_grocery !== undefined)
      scores.push(inverse_normalize(property.minutes_to_grocery, 0, 20));
    if (property.minutes_to_gym !== undefined)
      scores.push(inverse_normalize(property.minutes_to_gym, 0, 30));
    if (property.minutes_to_park !== undefined)
      scores.push(inverse_normalize(property.minutes_to_park, 0, 20));

    if (scores.length === 0)
      return {
        score: 0.5,
        message: "No lifestyle data available for this area.",
      };

    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const msg =
      avg > 0.7
        ? "Great amenity access. Coffee, groceries and parks nearby."
        : avg > 0.5
          ? "Good access to daily amenities."
          : "Some amenities may require travel.";
    return { score: avg, message: msg };
  }

  const all_area = [...area_tags, ...area_personality].map((t) =>
    t.toLowerCase(),
  );
  const matches = lifestyle_tags.filter((tag) =>
    all_area.some(
      (a) => a.includes(tag.toLowerCase()) || tag.toLowerCase().includes(a),
    ),
  );

  const match_ratio = safe_div(matches.length, lifestyle_tags.length);

  if (match_ratio >= 0.7) {
    return {
      score: 0.9,
      message: "Strong lifestyle match. This area fits your profile well.",
    };
  } else if (match_ratio >= 0.4) {
    return {
      score: 0.65,
      message:
        "Moderate lifestyle match. Some preferences align with this area.",
    };
  } else {
    return {
      score: 0.35,
      message:
        "Limited lifestyle match. This area may not align with your preferences.",
    };
  }
}

export function noise_comfort_score(property: PropertyData): number {
  const bars = property.bars_within_500m ?? 0;
  const density = property.building_density_index ?? 5;
  const road_dist = property.distance_to_main_road_m ?? 500;

  const bar_score = inverse_normalize(bars, 0, 10);
  const density_score = inverse_normalize(density, 0, 10);
  const road_score = normalize(road_dist, 0, 1000);

  return weighted_sum([
    [bar_score, 0.4],
    [density_score, 0.3],
    [road_score, 0.3],
  ]);
}

export function commute_insight(
  profile: TenantProfile,
  property: PropertyData,
): InsightResult {
  const work_locations = profile.work_locations ?? [];
  const commute_times = property.commute_times ?? {};

  if (work_locations.length === 0 || Object.keys(commute_times).length === 0) {
    return {
      score: 0.5,
      message:
        "No commute data available. Add work locations for personalised scoring.",
    };
  }

  const times: number[] = [];
  for (const loc of work_locations) {
    const time = commute_times[loc];
    if (time !== undefined) times.push(time);
  }

  if (times.length === 0)
    return { score: 0.5, message: "Work location not found in commute data." };

  const avg_time = times.reduce((a, b) => a + b, 0) / times.length;

  if (avg_time <= 15) {
    return {
      score: 0.95,
      message: `Excellent commute. ${Math.round(avg_time)} min average to work.`,
    };
  } else if (avg_time <= 30) {
    return {
      score: 0.8,
      message: `Good commute. ${Math.round(avg_time)} min to work.`,
    };
  } else if (avg_time <= 45) {
    return {
      score: 0.6,
      message: `Moderate commute. ${Math.round(avg_time)} min to work.`,
    };
  } else if (avg_time <= 60) {
    return {
      score: 0.35,
      message: `Long commute. ${Math.round(avg_time)} min. Consider transport costs.`,
    };
  } else {
    return {
      score: 0.1,
      message: `Very long commute. ${Math.round(avg_time)} min. This may significantly impact your daily life.`,
    };
  }
}

export function safety_insight(property: PropertyData): InsightResult {
  const crime = property.crime_index ?? 50;
  const lighting = property.street_lighting_score ?? 5;
  const pedestrian = property.pedestrian_activity_score ?? 5;
  const security = property.security_presence_score ?? 5;

  const crime_score = inverse_normalize(crime, 0, 100);
  const lighting_score = normalize(lighting, 0, 10);
  const ped_score = normalize(pedestrian, 0, 10);
  const security_score = normalize(security, 0, 10);

  const overall = weighted_sum([
    [crime_score, 0.45],
    [security_score, 0.25],
    [lighting_score, 0.15],
    [ped_score, 0.15],
  ]);

  if (overall >= 0.8) {
    return {
      score: overall,
      message: "Very safe area. Low crime and good security presence.",
    };
  } else if (overall >= 0.6) {
    return {
      score: overall,
      message: "Reasonably safe area with average security measures.",
    };
  } else if (overall >= 0.4) {
    return {
      score: overall,
      message: "Moderate safety concerns. Check neighbourhood security.",
    };
  } else {
    return {
      score: overall,
      message:
        "Higher crime area. Consider security measures and local safety resources.",
    };
  }
}

export function approval_insight(
  profile: TenantProfile,
  property: PropertyData,
): InsightResult {
  const apps = property.applications_count ?? 0;
  const credit = profile.credit_score ?? 650;
  const employment = profile.employment_type ?? "employed";
  const income_ratio = safe_div(property.rent ?? 0, profile.monthly_income);

  const credit_score_norm = normalize(credit, 300, 850);
  const income_score =
    income_ratio <= 0.3 ? 1 : income_ratio <= 0.4 ? 0.7 : 0.4;
  const employment_score =
    employment === "employed"
      ? 0.9
      : employment === "self_employed"
        ? 0.7
        : 0.5;
  const competition_score = inverse_normalize(apps, 0, 20);

  const overall = weighted_sum([
    [credit_score_norm, 0.3],
    [income_score, 0.3],
    [employment_score, 0.2],
    [competition_score, 0.2],
  ]);

  const pct = Math.round(overall * 100);

  if (overall >= 0.75) {
    return {
      score: overall,
      message: `Strong approval profile. ${pct}% likelihood based on your credentials.`,
    };
  } else if (overall >= 0.55) {
    return {
      score: overall,
      message: `Good approval chances. ${pct}% likelihood, ${apps} other applicants.`,
    };
  } else if (overall >= 0.4) {
    return {
      score: overall,
      message: `Moderate chances. ${pct}% likelihood, ${apps} competing applications.`,
    };
  } else {
    return {
      score: overall,
      message: `Lower approval likelihood. ${pct}%. Consider strengthening your application.`,
    };
  }
}

export function landlord_insight(property: PropertyData): InsightResult {
  const comm = property.landlord_communication_score ?? 5;
  const maint = property.maintenance_score ?? 5;
  const deposit = property.deposit_return_score ?? 5;
  const disputes = property.tenant_dispute_count ?? 0;

  const comm_score = normalize(comm, 0, 10);
  const maint_score = normalize(maint, 0, 10);
  const deposit_score = normalize(deposit, 0, 10);
  const dispute_score = inverse_normalize(disputes, 0, 5);

  const overall = weighted_sum([
    [comm_score, 0.3],
    [maint_score, 0.3],
    [deposit_score, 0.25],
    [dispute_score, 0.15],
  ]);

  if (overall >= 0.8) {
    return {
      score: overall,
      message:
        "Highly rated landlord. Excellent communication and maintenance response.",
    };
  } else if (overall >= 0.6) {
    return {
      score: overall,
      message: "Good landlord track record. Responsive and fair.",
    };
  } else if (overall >= 0.4) {
    return {
      score: overall,
      message: "Average landlord rating. Some mixed feedback.",
    };
  } else {
    return {
      score: overall,
      message: "Low landlord score. Review dispute history before committing.",
    };
  }
}

export function market_pressure_insight(property: PropertyData): InsightResult {
  const views = property.views_last_7_days ?? 0;
  const dom = property.days_on_market ?? 30;
  const apps = property.applications_count ?? 0;

  const views_score = normalize(views, 0, 100);
  const dom_score = inverse_normalize(dom, 0, 90);
  const apps_score = normalize(apps, 0, 15);

  const pressure = weighted_sum([
    [views_score, 0.3],
    [dom_score, 0.4],
    [apps_score, 0.3],
  ]);

  if (pressure >= 0.7) {
    return {
      score: 1 - pressure,
      message: `High demand. ${views} views, ${apps} applications. Act quickly.`,
    };
  } else if (pressure >= 0.4) {
    return {
      score: 0.7,
      message: `Moderate interest. ${apps} applications received.`,
    };
  } else {
    return {
      score: 0.9,
      message: `Low competition. ${dom} days on market with ${apps} applications.`,
    };
  }
}

export function future_area_insight(property: PropertyData): InsightResult {
  const events = property.area_events ?? [];
  const dev_events = count_events(events, "development");
  const retail_events = count_events(events, "retail");
  const area_stats = property.area_stats;

  let trend_score = 0.5;
  if (area_stats?.monthly_avg_rent) {
    const rents = Object.values(area_stats.monthly_avg_rent);
    if (rents.length >= 2) {
      const first = rents[0];
      const last = rents[rents.length - 1];
      const growth = safe_div(last - first, first);
      trend_score = growth > 0.05 ? 0.8 : growth > 0 ? 0.65 : 0.4;
    }
  }

  const event_score = normalize(dev_events + retail_events, 0, 5);
  const overall = weighted_sum([
    [trend_score, 0.7],
    [event_score, 0.3],
  ]);

  if (overall >= 0.7) {
    return {
      score: overall,
      message: "Area showing positive growth trends and development activity.",
    };
  } else if (overall >= 0.5) {
    return {
      score: overall,
      message: "Stable area with moderate development activity.",
    };
  } else {
    return {
      score: overall,
      message: "Limited area growth signals — worth monitoring.",
    };
  }
}

export function hidden_cost_insight(
  profile: TenantProfile,
  property: PropertyData,
): InsightResult {
  const elec = property.estimated_electricity ?? 0;
  const water = property.estimated_water ?? 0;
  const internet = property.estimated_internet ?? 0;
  const parking = property.parking_cost ?? 0;
  const transport = property.estimated_transport ?? 0;
  const extra = property.tenant_extra_costs ?? 0;

  const total_extra = elec + water + internet + parking + transport + extra;
  const rent = property.rent ?? 0;
  const total_cost = rent + total_extra;
  const total_budget = profile.total_living_budget;
  const cost_ratio = safe_div(total_cost, total_budget);

  if (total_extra === 0) {
    return {
      score: 0.6,
      message:
        "No additional cost data available. Verify utility costs with the landlord.",
    };
  }

  if (cost_ratio <= 0.85) {
    return {
      score: 0.9,
      message: `Total costs R${Math.round(total_cost).toLocaleString("en-ZA")} incl. utilities. Comfortable within your budget.`,
    };
  } else if (cost_ratio <= 1.0) {
    return {
      score: 0.65,
      message: `Total R${Math.round(total_cost).toLocaleString("en-ZA")} incl. extras. Just within total budget.`,
    };
  } else {
    return {
      score: 0.25,
      message: `Total costs R${Math.round(total_cost).toLocaleString("en-ZA")}. Exceeds your total living budget by ${Math.round((cost_ratio - 1) * 100)}%.`,
    };
  }
}

export function tenant_hard_filter(
  profile: TenantProfile,
  property: PropertyData,
): boolean {
  const dealbreakers = profile.dealbreakers ?? [];
  const property_tags = property.property_tags ?? [];

  for (const breaker of dealbreakers) {
    if (
      property_tags.some((t) => t.toLowerCase().includes(breaker.toLowerCase()))
    ) {
      return false;
    }
  }

  if (profile.has_pets && property.pets_allowed === false) return false;

  if (property.rent && profile.rental_budget > 0) {
    if (property.rent > profile.rental_budget * 1.5) return false;
  }

  return true;
}

export function generate_tenant_reasons(
  insights: TenantScoringResult["insights"],
): string[] {
  const reasons: string[] = [];
  if (insights.financial && insights.financial.score >= 0.8)
    reasons.push(insights.financial.message);
  if (insights.deal && insights.deal.score >= 0.75)
    reasons.push(insights.deal.message);
  if (insights.safety && insights.safety.score >= 0.75)
    reasons.push(insights.safety.message);
  if (insights.lifestyle && insights.lifestyle.score >= 0.75)
    reasons.push(insights.lifestyle.message);
  if (insights.commute && insights.commute.score >= 0.75)
    reasons.push(insights.commute.message);
  if (insights.landlord && insights.landlord.score >= 0.75)
    reasons.push(insights.landlord.message);
  return reasons.slice(0, 5);
}

export function generate_tenant_warnings(
  profile: TenantProfile,
  property: PropertyData,
  insights: TenantScoringResult["insights"],
): string[] {
  const warnings: string[] = [];
  if (insights.financial && insights.financial.score < 0.4)
    warnings.push(insights.financial.message);
  if (insights.safety && insights.safety.score < 0.4)
    warnings.push(insights.safety.message);
  if (insights.hidden_cost && insights.hidden_cost.score < 0.4)
    warnings.push(insights.hidden_cost.message);
  if (insights.approval && insights.approval.score < 0.4)
    warnings.push(insights.approval.message);
  if (profile.has_pets && property.pets_allowed === false) {
    warnings.push("Pets not allowed at this property.");
  }
  return warnings.slice(0, 5);
}

const TENANT_WEIGHTS = {
  financial: 0.2,
  deal: 0.14,
  safety: 0.12,
  lifestyle: 0.1,
  commute: 0.1,
  landlord: 0.08,
  approval: 0.09,
  market_pressure: 0.03,
  area_momentum: 0.04,
  hidden_cost: 0.03,
  timing: 0.07,
};

export function score_tenant_property(
  profile: TenantProfile,
  property: PropertyData,
): TenantScoringResult {
  const passed = tenant_hard_filter(profile, property);

  const financial = financial_insight(profile, property);
  const deal = deal_insight(profile, property);
  const safety = safety_insight(property);
  const lifestyle = lifestyle_insight(profile, property);
  const commute = commute_insight(profile, property);
  const approval = approval_insight(profile, property);
  const landlord = landlord_insight(property);
  const market_pressure = market_pressure_insight(property);
  const area_momentum = future_area_insight(property);
  const hidden_cost = hidden_cost_insight(profile, property);
  const timing = timing_insight(profile, property);

  const insights = {
    financial,
    deal,
    safety,
    lifestyle,
    commute,
    approval,
    landlord,
    market_pressure,
    area_momentum,
    hidden_cost,
    timing,
  };

  const raw_score = weighted_sum([
    [financial.score, TENANT_WEIGHTS.financial],
    [deal.score, TENANT_WEIGHTS.deal],
    [safety.score, TENANT_WEIGHTS.safety],
    [lifestyle.score, TENANT_WEIGHTS.lifestyle],
    [commute.score, TENANT_WEIGHTS.commute],
    [landlord.score, TENANT_WEIGHTS.landlord],
    [approval.score, TENANT_WEIGHTS.approval],
    [market_pressure.score, TENANT_WEIGHTS.market_pressure],
    [area_momentum.score, TENANT_WEIGHTS.area_momentum],
    [hidden_cost.score, TENANT_WEIGHTS.hidden_cost],
    [timing.score, TENANT_WEIGHTS.timing],
  ]);

  const score = Math.round(clamp(raw_score * 100, 0, 100));
  const confidence = confidence_score(property);
  const top_reasons = generate_tenant_reasons(insights);
  const warnings = generate_tenant_warnings(profile, property, insights);

  return {
    property_id: property.property_id,
    score,
    confidence,
    passed_filter: passed,
    insights,
    top_reasons,
    warnings,
  };
}

export function rank_tenant_properties(
  properties: PropertyData[],
  profile: TenantProfile,
): TenantScoringResult[] {
  return properties
    .map((p) => score_tenant_property(profile, p))
    .filter((r) => r.passed_filter)
    .sort((a, b) => b.score - a.score);
}
