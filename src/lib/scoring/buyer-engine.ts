import type {
  BuyerProfile,
  PropertyData,
  InsightResult,
  BuyerScoringResult,
} from "./types";
import {
  safe_div,
  normalize,
  inverse_normalize,
  weighted_sum,
  confidence_score,
  percentage_difference,
  clamp,
} from "./utils";

export function yield_insight(property: PropertyData): InsightResult {
  const monthly_rent = property.monthly_rent ?? 0;
  const purchase_price = property.purchase_price ?? 0;

  if (purchase_price === 0 || monthly_rent === 0) {
    return { score: 0.5, message: "Insufficient data to calculate yield." };
  }

  const gross_yield = safe_div(monthly_rent * 12, purchase_price);
  const net_yield = gross_yield * 0.85;

  if (gross_yield >= 0.1) {
    return {
      score: 0.95,
      message: `Excellent yield — ${(gross_yield * 100).toFixed(1)}% gross (${(net_yield * 100).toFixed(1)}% net estimated).`,
    };
  } else if (gross_yield >= 0.08) {
    return {
      score: 0.8,
      message: `Strong yield — ${(gross_yield * 100).toFixed(1)}% gross.`,
    };
  } else if (gross_yield >= 0.06) {
    return {
      score: 0.65,
      message: `Decent yield — ${(gross_yield * 100).toFixed(1)}% gross. Market average.`,
    };
  } else if (gross_yield >= 0.04) {
    return {
      score: 0.4,
      message: `Below-average yield — ${(gross_yield * 100).toFixed(1)}% gross.`,
    };
  } else {
    return {
      score: 0.15,
      message: `Poor yield — ${(gross_yield * 100).toFixed(1)}% gross. Likely capital-growth play.`,
    };
  }
}

export function capital_growth_insight(property: PropertyData): InsightResult {
  const growth = property.annual_price_growth ?? 0.05;

  if (growth >= 0.12) {
    return {
      score: 0.95,
      message: `Exceptional growth — ${(growth * 100).toFixed(1)}% annual price appreciation.`,
    };
  } else if (growth >= 0.08) {
    return {
      score: 0.8,
      message: `Strong growth area — ${(growth * 100).toFixed(1)}% annual appreciation.`,
    };
  } else if (growth >= 0.05) {
    return {
      score: 0.65,
      message: `Moderate growth — ${(growth * 100).toFixed(1)}% annually. Tracks inflation.`,
    };
  } else if (growth >= 0.02) {
    return {
      score: 0.4,
      message: `Slow growth — ${(growth * 100).toFixed(1)}% annually.`,
    };
  } else {
    return {
      score: 0.15,
      message: `Flat or declining values — ${(growth * 100).toFixed(1)}% growth rate.`,
    };
  }
}

export function stability_insight(property: PropertyData): InsightResult {
  const vacancy = property.vacancy_rate ?? 0.08;
  const demand = property.tenant_demand_index ?? 5;
  const family_score = property.family_rental_score ?? 5;

  const vacancy_score = inverse_normalize(vacancy, 0, 0.25);
  const demand_score = normalize(demand, 0, 10);
  const family_score_norm = normalize(family_score, 0, 10);

  const overall = weighted_sum([
    [vacancy_score, 0.5],
    [demand_score, 0.3],
    [family_score_norm, 0.2],
  ]);

  if (overall >= 0.8) {
    return {
      score: overall,
      message: `Very stable — ${(vacancy * 100).toFixed(1)}% vacancy rate with strong demand.`,
    };
  } else if (overall >= 0.6) {
    return {
      score: overall,
      message:
        "Good stability — below-average vacancy and consistent rental demand.",
    };
  } else if (overall >= 0.4) {
    return {
      score: overall,
      message: `Moderate stability — ${(vacancy * 100).toFixed(1)}% vacancy. Monitor demand trends.`,
    };
  } else {
    return {
      score: overall,
      message: `Higher volatility — ${(vacancy * 100).toFixed(1)}% vacancy rate.`,
    };
  }
}

export function buyer_value_insight(
  profile: BuyerProfile,
  property: PropertyData,
): InsightResult {
  const price = property.purchase_price ?? 0;
  const avg_price = property.area_avg_price_per_m2;
  const price_m2 = property.price_per_m2;
  const discount = property.discount_to_market ?? 0;

  if (price > profile.budget) {
    return {
      score: 0.1,
      message: `Above budget — R${((price - profile.budget) / 1).toLocaleString("en-ZA", { maximumFractionDigits: 0 })} over your limit.`,
    };
  }

  if (discount <= -0.1) {
    return {
      score: 0.95,
      message: `${Math.round(Math.abs(discount) * 100)}% below market value — strong buy opportunity.`,
    };
  } else if (discount <= -0.03) {
    return { score: 0.8, message: "Slightly below market — good entry value." };
  } else if (avg_price && price_m2) {
    const vm2_diff = percentage_difference(price_m2, avg_price);
    if (vm2_diff <= 0) {
      return {
        score: 0.75,
        message: "Fair value — priced at or below area average per m².",
      };
    } else {
      return {
        score: 0.45,
        message: `${Math.round(vm2_diff * 100)}% above area average per m².`,
      };
    }
  }

  return { score: 0.55, message: "Market value in line with suburb pricing." };
}

export function liquidity_insight(property: PropertyData): InsightResult {
  const days_to_sell = property.avg_days_to_sell ?? 90;
  const sales_volume = property.sales_volume_index ?? 5;
  const buyer_demand = property.buyer_demand_index ?? 5;

  const days_score = inverse_normalize(days_to_sell, 0, 180);
  const volume_score = normalize(sales_volume, 0, 10);
  const demand_score = normalize(buyer_demand, 0, 10);

  const overall = weighted_sum([
    [days_score, 0.5],
    [volume_score, 0.25],
    [demand_score, 0.25],
  ]);

  if (overall >= 0.75) {
    return {
      score: overall,
      message: `Highly liquid market — properties sell in ~${days_to_sell} days.`,
    };
  } else if (overall >= 0.5) {
    return {
      score: overall,
      message: `Moderate liquidity — typical sale time ${days_to_sell} days.`,
    };
  } else {
    return {
      score: overall,
      message: `Lower liquidity — expect ~${days_to_sell} days to sell. Consider exit strategy.`,
    };
  }
}

export function buyer_risk_insight(property: PropertyData): InsightResult {
  const crime = property.crime_index ?? 50;
  const levy_risk = property.levy_risk_index ?? 3;
  const maint_risk = property.building_maintenance_risk ?? 3;
  const new_units = property.new_units_pipeline ?? 0;
  const risk_idx = property.risk_index ?? 50;

  const crime_score = inverse_normalize(crime, 0, 100);
  const levy_score = inverse_normalize(levy_risk, 0, 10);
  const maint_score = inverse_normalize(maint_risk, 0, 10);
  const supply_score = inverse_normalize(new_units, 0, 1000);
  const risk_score_norm = inverse_normalize(risk_idx, 0, 100);

  const overall = weighted_sum([
    [crime_score, 0.25],
    [levy_score, 0.2],
    [maint_score, 0.2],
    [supply_score, 0.15],
    [risk_score_norm, 0.2],
  ]);

  if (overall >= 0.75) {
    return {
      score: overall,
      message: "Low risk profile — minimal crime, levy and supply concerns.",
    };
  } else if (overall >= 0.55) {
    return {
      score: overall,
      message: "Moderate risk — some factors to monitor.",
    };
  } else if (overall >= 0.35) {
    return {
      score: overall,
      message: "Elevated risk — review crime index and body corporate levies.",
    };
  } else {
    return {
      score: overall,
      message: "High risk profile — significant crime, levy or supply risk.",
    };
  }
}

export function buyer_weights(profile: BuyerProfile): Record<string, number> {
  const strategies: Record<string, Record<string, number>> = {
    yield: {
      yield: 0.4,
      capital_growth: 0.1,
      stability: 0.2,
      value: 0.15,
      liquidity: 0.1,
      risk: 0.05,
    },
    growth: {
      yield: 0.1,
      capital_growth: 0.4,
      stability: 0.15,
      value: 0.15,
      liquidity: 0.15,
      risk: 0.05,
    },
    stability: {
      yield: 0.2,
      capital_growth: 0.15,
      stability: 0.35,
      value: 0.1,
      liquidity: 0.1,
      risk: 0.1,
    },
    balanced: {
      yield: 0.2,
      capital_growth: 0.2,
      stability: 0.2,
      value: 0.2,
      liquidity: 0.1,
      risk: 0.1,
    },
  };
  return strategies[profile.strategy] ?? strategies.balanced;
}

export function risk_penalty_factor(
  profile: BuyerProfile,
  risk_score: number,
): number {
  const tolerance_multipliers: Record<string, number> = {
    low: 0.8,
    medium: 0.9,
    high: 1.0,
  };
  const multiplier = tolerance_multipliers[profile.risk_tolerance] ?? 0.9;

  if (risk_score < 0.4) return multiplier * 0.85;
  if (risk_score < 0.6) return multiplier * 0.95;
  return 1.0;
}

export function buyer_hard_filter(
  profile: BuyerProfile,
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

  if (
    property.purchase_price &&
    property.purchase_price > profile.budget * 1.1
  ) {
    return false;
  }

  return true;
}

export function generate_buyer_reasons(
  insights: BuyerScoringResult["insights"],
  strategy: string,
): string[] {
  void strategy;
  const reasons: string[] = [];
  if (insights.yield && insights.yield.score >= 0.75)
    reasons.push(insights.yield.message);
  if (insights.capital_growth && insights.capital_growth.score >= 0.75)
    reasons.push(insights.capital_growth.message);
  if (insights.stability && insights.stability.score >= 0.75)
    reasons.push(insights.stability.message);
  if (insights.value && insights.value.score >= 0.75)
    reasons.push(insights.value.message);
  if (insights.liquidity && insights.liquidity.score >= 0.75)
    reasons.push(insights.liquidity.message);
  return reasons.slice(0, 4);
}

export function generate_buyer_warnings(
  insights: BuyerScoringResult["insights"],
): string[] {
  const warnings: string[] = [];
  if (insights.yield && insights.yield.score < 0.35)
    warnings.push(insights.yield.message);
  if (insights.risk && insights.risk.score < 0.4)
    warnings.push(insights.risk.message);
  if (insights.stability && insights.stability.score < 0.35)
    warnings.push(insights.stability.message);
  if (insights.value && insights.value.score < 0.3)
    warnings.push(insights.value.message);
  return warnings.slice(0, 4);
}

export function score_buyer_property(
  profile: BuyerProfile,
  property: PropertyData,
): BuyerScoringResult {
  const passed = buyer_hard_filter(profile, property);

  const yieldIns = yield_insight(property);
  const growth = capital_growth_insight(property);
  const stab = stability_insight(property);
  const value = buyer_value_insight(profile, property);
  const liquidity = liquidity_insight(property);
  const risk = buyer_risk_insight(property);

  const insights = {
    yield: yieldIns,
    capital_growth: growth,
    stability: stab,
    value,
    liquidity,
    risk,
  };

  const weights = buyer_weights(profile);
  const penalty = risk_penalty_factor(profile, risk.score);

  const raw_score = weighted_sum([
    [yieldIns.score, weights.yield],
    [growth.score, weights.capital_growth],
    [stab.score, weights.stability],
    [value.score, weights.value],
    [liquidity.score, weights.liquidity],
    [risk.score, weights.risk],
  ]);

  const score = Math.round(clamp(raw_score * penalty * 100, 0, 100));
  const confidence = confidence_score(property);
  const top_reasons = generate_buyer_reasons(insights, profile.strategy);
  const warnings = generate_buyer_warnings(insights);

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

export function rank_buyer_properties(
  properties: PropertyData[],
  profile: BuyerProfile,
): BuyerScoringResult[] {
  return properties
    .map((p) => score_buyer_property(profile, p))
    .filter((r) => r.passed_filter)
    .sort((a, b) => b.score - a.score);
}
