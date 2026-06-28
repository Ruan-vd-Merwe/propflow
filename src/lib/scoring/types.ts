export interface TenantProfile {
  monthly_income: number;
  rental_budget: number;
  total_living_budget: number;
  preferred_suburbs: string[];
  desired_bedrooms: number;
  move_in_month: number;
  work_locations?: string[];
  lifestyle_tags?: string[];
  must_haves?: string[];
  dealbreakers?: string[];
  has_car?: boolean;
  has_pets?: boolean;
  credit_score?: number;
  employment_type?: string;
}

export interface BuyerProfile {
  budget: number;
  strategy: "yield" | "growth" | "stability" | "balanced";
  risk_tolerance: "low" | "medium" | "high";
  preferred_suburbs?: string[];
  target_yield?: number;
  must_haves?: string[];
  dealbreakers?: string[];
}

export interface PropertyData {
  property_id?: string;
  suburb?: string;
  rent?: number;
  purchase_price?: number;
  monthly_rent?: number;
  bedrooms?: number;
  pets_allowed?: boolean;
  property_tags?: string[];
  suburb_avg_rent?: number;
  rent_per_m2?: number;
  suburb_avg_rent_per_m2?: number;
  estimated_electricity?: number;
  estimated_water?: number;
  estimated_internet?: number;
  parking_cost?: number;
  estimated_transport?: number;
  tenant_extra_costs?: number;
  area_tags?: string[];
  area_personality?: string[];
  minutes_to_coffee?: number;
  minutes_to_grocery?: number;
  minutes_to_gym?: number;
  minutes_to_park?: number;
  distance_to_main_road_m?: number;
  bars_within_500m?: number;
  building_density_index?: number;
  schools_within_300m?: number;
  commute_times?: Record<string, number>;
  street_lighting_score?: number;
  pedestrian_activity_score?: number;
  crime_index?: number;
  security_presence_score?: number;
  applications_count?: number;
  landlord_communication_score?: number;
  maintenance_score?: number;
  deposit_return_score?: number;
  tenant_dispute_count?: number;
  views_last_7_days?: number;
  days_on_market?: number;
  area_events?: Array<{ event_type: string }>;
  area_stats?: { monthly_avg_rent?: Record<number, number> };
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
  risk_index?: number;
}

export interface InsightResult {
  score: number;
  message: string;
}

export interface TenantScoringResult {
  property_id?: string;
  score: number;
  confidence: number;
  passed_filter: boolean;
  insights: {
    financial?: InsightResult;
    deal?: InsightResult;
    safety?: InsightResult;
    lifestyle?: InsightResult;
    commute?: InsightResult;
    approval?: InsightResult;
    landlord?: InsightResult;
    market_pressure?: InsightResult;
    area_momentum?: InsightResult;
    hidden_cost?: InsightResult;
    timing?: InsightResult;
  };
  top_reasons: string[];
  warnings: string[];
}

export interface BuyerScoringResult {
  property_id?: string;
  score: number;
  confidence: number;
  passed_filter: boolean;
  insights: {
    yield?: InsightResult;
    capital_growth?: InsightResult;
    stability?: InsightResult;
    value?: InsightResult;
    liquidity?: InsightResult;
    risk?: InsightResult;
  };
  top_reasons: string[];
  warnings: string[];
}
