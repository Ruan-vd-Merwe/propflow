// Re-export barrel — preserves all existing import paths.
// Implementation lives in: types.ts / utils.ts / tenant-engine.ts / buyer-engine.ts

export type {
  TenantProfile,
  BuyerProfile,
  PropertyData,
  InsightResult,
  TenantScoringResult,
  BuyerScoringResult,
} from "./types";

export {
  clamp,
  safe_div,
  normalize,
  inverse_normalize,
  weighted_sum,
  confidence_score,
  percentage_difference,
  affordability_score,
  proximity_score,
  count_events,
} from "./utils";

export {
  financial_insight,
  deal_insight,
  timing_insight,
  lifestyle_insight,
  noise_comfort_score,
  commute_insight,
  safety_insight,
  approval_insight,
  landlord_insight,
  market_pressure_insight,
  future_area_insight,
  hidden_cost_insight,
  tenant_hard_filter,
  generate_tenant_reasons,
  generate_tenant_warnings,
  score_tenant_property,
  rank_tenant_properties,
} from "./tenant-engine";

export {
  yield_insight,
  capital_growth_insight,
  stability_insight,
  buyer_value_insight,
  liquidity_insight,
  buyer_risk_insight,
  buyer_weights,
  risk_penalty_factor,
  buyer_hard_filter,
  generate_buyer_reasons,
  generate_buyer_warnings,
  score_buyer_property,
  rank_buyer_properties,
} from "./buyer-engine";
