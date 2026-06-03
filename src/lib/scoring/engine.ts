// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface TenantProfile {
  monthly_income: number
  rental_budget: number
  total_living_budget: number
  preferred_suburbs: string[]
  desired_bedrooms: number
  move_in_month: number
  work_locations?: string[]
  lifestyle_tags?: string[]
  must_haves?: string[]
  dealbreakers?: string[]
  has_car?: boolean
  has_pets?: boolean
  credit_score?: number
  employment_type?: string
}

export interface BuyerProfile {
  budget: number
  strategy: 'yield' | 'growth' | 'stability' | 'balanced'
  risk_tolerance: 'low' | 'medium' | 'high'
  preferred_suburbs?: string[]
  target_yield?: number
  must_haves?: string[]
  dealbreakers?: string[]
}

export interface PropertyData {
  property_id?: string
  suburb?: string
  rent?: number
  purchase_price?: number
  monthly_rent?: number
  bedrooms?: number
  pets_allowed?: boolean
  property_tags?: string[]
  suburb_avg_rent?: number
  rent_per_m2?: number
  suburb_avg_rent_per_m2?: number
  estimated_electricity?: number
  estimated_water?: number
  estimated_internet?: number
  parking_cost?: number
  estimated_transport?: number
  tenant_extra_costs?: number
  area_tags?: string[]
  area_personality?: string[]
  minutes_to_coffee?: number
  minutes_to_grocery?: number
  minutes_to_gym?: number
  minutes_to_park?: number
  distance_to_main_road_m?: number
  bars_within_500m?: number
  building_density_index?: number
  schools_within_300m?: number
  commute_times?: Record<string, number>
  street_lighting_score?: number
  pedestrian_activity_score?: number
  crime_index?: number
  security_presence_score?: number
  applications_count?: number
  landlord_communication_score?: number
  maintenance_score?: number
  deposit_return_score?: number
  tenant_dispute_count?: number
  views_last_7_days?: number
  days_on_market?: number
  area_events?: Array<{ event_type: string }>
  area_stats?: { monthly_avg_rent?: Record<number, number> }
  annual_price_growth?: number
  vacancy_rate?: number
  tenant_demand_index?: number
  family_rental_score?: number
  discount_to_market?: number
  price_per_m2?: number
  area_avg_price_per_m2?: number
  sales_volume_index?: number
  avg_days_to_sell?: number
  buyer_demand_index?: number
  new_units_pipeline?: number
  levy_risk_index?: number
  building_maintenance_risk?: number
  risk_index?: number
}

export interface InsightResult {
  score: number
  message: string
}

export interface TenantScoringResult {
  property_id?: string
  score: number
  confidence: number
  passed_filter: boolean
  insights: {
    financial?: InsightResult
    deal?: InsightResult
    safety?: InsightResult
    lifestyle?: InsightResult
    commute?: InsightResult
    approval?: InsightResult
    landlord?: InsightResult
    market_pressure?: InsightResult
    area_momentum?: InsightResult
    hidden_cost?: InsightResult
    timing?: InsightResult
  }
  top_reasons: string[]
  warnings: string[]
}

export interface BuyerScoringResult {
  property_id?: string
  score: number
  confidence: number
  passed_filter: boolean
  insights: {
    yield?: InsightResult
    capital_growth?: InsightResult
    stability?: InsightResult
    value?: InsightResult
    liquidity?: InsightResult
    risk?: InsightResult
  }
  top_reasons: string[]
  warnings: string[]
}

// ─── Utility functions ────────────────────────────────────────────────────────

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function safe_div(a: number, b: number, fallback = 0): number {
  if (b === 0 || !isFinite(b)) return fallback
  return a / b
}

export function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0
  return clamp((value - min) / (max - min), 0, 1)
}

export function inverse_normalize(value: number, min: number, max: number): number {
  return 1 - normalize(value, min, max)
}

export function weighted_sum(scores: [number, number][]): number {
  let total_weight = 0
  let total_score = 0
  for (const [score, weight] of scores) {
    total_score += score * weight
    total_weight += weight
  }
  return safe_div(total_score, total_weight, 0)
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
  ]
  const present = fields.filter((f) => f !== undefined && f !== null).length
  return present / fields.length
}

export function percentage_difference(a: number, b: number): number {
  if (b === 0) return 0
  return (a - b) / b
}

export function affordability_score(profile: TenantProfile, property: PropertyData): number {
  const rent = property.rent ?? 0
  if (rent === 0) return 0.5
  const budget_ratio = safe_div(rent, profile.rental_budget, 1)
  const income_ratio = safe_div(rent, profile.monthly_income, 1)
  const budget_score =
    budget_ratio <= 1 ? 1 - budget_ratio * 0.5 : Math.max(0, 1.5 - budget_ratio)
  const income_score =
    income_ratio <= 0.3
      ? 1
      : income_ratio <= 0.4
        ? 0.7
        : income_ratio <= 0.5
          ? 0.4
          : 0.1
  return weighted_sum([
    [budget_score, 0.6],
    [income_score, 0.4],
  ])
}

export function proximity_score(profile: TenantProfile, property: PropertyData): number {
  if (!profile.preferred_suburbs?.length || !property.suburb) return 0.5
  const inPreferred = profile.preferred_suburbs.some(
    (s) => s.toLowerCase() === property.suburb!.toLowerCase(),
  )
  return inPreferred ? 1.0 : 0.3
}

// ─── Tenant insight functions ─────────────────────────────────────────────────

export function financial_insight(
  profile: TenantProfile,
  property: PropertyData,
): InsightResult {
  const rent = property.rent ?? 0
  const income = profile.monthly_income
  const budget = profile.rental_budget

  if (income === 0) return { score: 0.5, message: 'No income data to assess affordability.' }

  const income_ratio = safe_div(rent, income)
  const budget_ratio = safe_div(rent, budget)

  if (income_ratio <= 0.25 && budget_ratio <= 0.9) {
    return {
      score: 0.95,
      message: `Excellent fit — rent is ${Math.round(income_ratio * 100)}% of income, well within budget.`,
    }
  } else if (income_ratio <= 0.3 && budget_ratio <= 1.0) {
    return {
      score: 0.80,
      message: `Good fit — rent is ${Math.round(income_ratio * 100)}% of income and within budget.`,
    }
  } else if (income_ratio <= 0.35 || budget_ratio <= 1.1) {
    return {
      score: 0.60,
      message: `Manageable — rent is ${Math.round(income_ratio * 100)}% of income, slightly stretched.`,
    }
  } else if (income_ratio <= 0.45) {
    return {
      score: 0.35,
      message: `Stretched — rent takes ${Math.round(income_ratio * 100)}% of income. Consider your full cost of living.`,
    }
  } else {
    return {
      score: 0.10,
      message: `High financial strain — rent exceeds ${Math.round(income_ratio * 100)}% of income.`,
    }
  }
}

export function deal_insight(profile: TenantProfile, property: PropertyData): InsightResult {
  void profile
  const rent = property.rent ?? 0
  const avg = property.suburb_avg_rent ?? rent

  if (avg === 0) return { score: 0.5, message: 'No suburb average data to assess deal value.' }

  const diff = percentage_difference(rent, avg)

  if (diff <= -0.1) {
    return {
      score: 0.95,
      message: `${Math.round(Math.abs(diff) * 100)}% below suburb average — excellent deal.`,
    }
  } else if (diff <= -0.03) {
    return { score: 0.80, message: 'Slightly below suburb average — good value.' }
  } else if (diff <= 0.05) {
    return { score: 0.65, message: 'In line with suburb average pricing.' }
  } else if (diff <= 0.15) {
    return {
      score: 0.40,
      message: `${Math.round(diff * 100)}% above suburb average — on the higher end.`,
    }
  } else {
    return {
      score: 0.15,
      message: `${Math.round(diff * 100)}% above suburb average — significantly overpriced.`,
    }
  }
}

export function timing_insight(
  profile: TenantProfile,
  property: PropertyData,
): InsightResult {
  void property
  const month = profile.move_in_month
  const peak_months = [1, 7, 12]
  const shoulder_months = [2, 6, 8, 11]

  if (peak_months.includes(month)) {
    return {
      score: 0.50,
      message: 'Peak rental season — expect high competition and standard pricing.',
    }
  } else if (shoulder_months.includes(month)) {
    return {
      score: 0.70,
      message: 'Shoulder season — moderate competition with potential negotiating room.',
    }
  } else {
    return {
      score: 0.85,
      message: 'Off-peak timing — good position to negotiate and less competition.',
    }
  }
}

export function lifestyle_insight(
  profile: TenantProfile,
  property: PropertyData,
): InsightResult {
  const lifestyle_tags = profile.lifestyle_tags ?? []
  const area_tags = property.area_tags ?? []
  const area_personality = property.area_personality ?? []

  if (lifestyle_tags.length === 0) {
    const scores: number[] = []
    if (property.minutes_to_coffee !== undefined)
      scores.push(inverse_normalize(property.minutes_to_coffee, 0, 30))
    if (property.minutes_to_grocery !== undefined)
      scores.push(inverse_normalize(property.minutes_to_grocery, 0, 20))
    if (property.minutes_to_gym !== undefined)
      scores.push(inverse_normalize(property.minutes_to_gym, 0, 30))
    if (property.minutes_to_park !== undefined)
      scores.push(inverse_normalize(property.minutes_to_park, 0, 20))

    if (scores.length === 0) return { score: 0.5, message: 'No lifestyle data available for this area.' }

    const avg = scores.reduce((a, b) => a + b, 0) / scores.length
    const msg =
      avg > 0.7
        ? 'Great amenity access — coffee, groceries and parks nearby.'
        : avg > 0.5
          ? 'Good access to daily amenities.'
          : 'Some amenities may require travel.'
    return { score: avg, message: msg }
  }

  const all_area = [...area_tags, ...area_personality].map((t) => t.toLowerCase())
  const matches = lifestyle_tags.filter((tag) =>
    all_area.some(
      (a) => a.includes(tag.toLowerCase()) || tag.toLowerCase().includes(a),
    ),
  )

  const match_ratio = safe_div(matches.length, lifestyle_tags.length)

  if (match_ratio >= 0.7) {
    return { score: 0.90, message: 'Strong lifestyle match — this area fits your profile well.' }
  } else if (match_ratio >= 0.4) {
    return {
      score: 0.65,
      message: 'Moderate lifestyle match — some preferences align with this area.',
    }
  } else {
    return {
      score: 0.35,
      message: 'Limited lifestyle match — this area may not align with your preferences.',
    }
  }
}

export function noise_comfort_score(property: PropertyData): number {
  const bars = property.bars_within_500m ?? 0
  const density = property.building_density_index ?? 5
  const road_dist = property.distance_to_main_road_m ?? 500

  const bar_score = inverse_normalize(bars, 0, 10)
  const density_score = inverse_normalize(density, 0, 10)
  const road_score = normalize(road_dist, 0, 1000)

  return weighted_sum([
    [bar_score, 0.4],
    [density_score, 0.3],
    [road_score, 0.3],
  ])
}

export function commute_insight(
  profile: TenantProfile,
  property: PropertyData,
): InsightResult {
  const work_locations = profile.work_locations ?? []
  const commute_times = property.commute_times ?? {}

  if (work_locations.length === 0 || Object.keys(commute_times).length === 0) {
    return {
      score: 0.5,
      message: 'No commute data available. Add work locations for personalised scoring.',
    }
  }

  const times: number[] = []
  for (const loc of work_locations) {
    const time = commute_times[loc]
    if (time !== undefined) times.push(time)
  }

  if (times.length === 0) return { score: 0.5, message: 'Work location not found in commute data.' }

  const avg_time = times.reduce((a, b) => a + b, 0) / times.length

  if (avg_time <= 15) {
    return { score: 0.95, message: `Excellent commute — ${Math.round(avg_time)} min average to work.` }
  } else if (avg_time <= 30) {
    return { score: 0.80, message: `Good commute — ${Math.round(avg_time)} min to work.` }
  } else if (avg_time <= 45) {
    return { score: 0.60, message: `Moderate commute — ${Math.round(avg_time)} min to work.` }
  } else if (avg_time <= 60) {
    return {
      score: 0.35,
      message: `Long commute — ${Math.round(avg_time)} min to work. Consider transport costs.`,
    }
  } else {
    return {
      score: 0.10,
      message: `Very long commute — ${Math.round(avg_time)} min. This may significantly impact your daily life.`,
    }
  }
}

export function safety_insight(property: PropertyData): InsightResult {
  const crime = property.crime_index ?? 50
  const lighting = property.street_lighting_score ?? 5
  const pedestrian = property.pedestrian_activity_score ?? 5
  const security = property.security_presence_score ?? 5

  const crime_score = inverse_normalize(crime, 0, 100)
  const lighting_score = normalize(lighting, 0, 10)
  const ped_score = normalize(pedestrian, 0, 10)
  const security_score = normalize(security, 0, 10)

  const overall = weighted_sum([
    [crime_score, 0.45],
    [security_score, 0.25],
    [lighting_score, 0.15],
    [ped_score, 0.15],
  ])

  if (overall >= 0.8) {
    return { score: overall, message: 'Very safe area — low crime index and good security presence.' }
  } else if (overall >= 0.6) {
    return { score: overall, message: 'Reasonably safe area with average security measures.' }
  } else if (overall >= 0.4) {
    return { score: overall, message: 'Moderate safety concerns — check neighbourhood security.' }
  } else {
    return {
      score: overall,
      message: 'Higher crime area — consider security measures and local safety resources.',
    }
  }
}

export function approval_insight(
  profile: TenantProfile,
  property: PropertyData,
): InsightResult {
  const apps = property.applications_count ?? 0
  const credit = profile.credit_score ?? 650
  const employment = profile.employment_type ?? 'employed'
  const income_ratio = safe_div(property.rent ?? 0, profile.monthly_income)

  const credit_score_norm = normalize(credit, 300, 850)
  const income_score = income_ratio <= 0.3 ? 1 : income_ratio <= 0.4 ? 0.7 : 0.4
  const employment_score =
    employment === 'employed' ? 0.9 : employment === 'self_employed' ? 0.7 : 0.5
  const competition_score = inverse_normalize(apps, 0, 20)

  const overall = weighted_sum([
    [credit_score_norm, 0.3],
    [income_score, 0.3],
    [employment_score, 0.2],
    [competition_score, 0.2],
  ])

  const pct = Math.round(overall * 100)

  if (overall >= 0.75) {
    return {
      score: overall,
      message: `Strong approval profile — ${pct}% likelihood based on your credentials.`,
    }
  } else if (overall >= 0.55) {
    return {
      score: overall,
      message: `Good approval chances — ${pct}% likelihood. ${apps} other applicants.`,
    }
  } else if (overall >= 0.4) {
    return {
      score: overall,
      message: `Moderate chances — ${pct}% likelihood. ${apps} competing applications.`,
    }
  } else {
    return {
      score: overall,
      message: `Lower approval likelihood — ${pct}%. Consider strengthening your application.`,
    }
  }
}

export function landlord_insight(property: PropertyData): InsightResult {
  const comm = property.landlord_communication_score ?? 5
  const maint = property.maintenance_score ?? 5
  const deposit = property.deposit_return_score ?? 5
  const disputes = property.tenant_dispute_count ?? 0

  const comm_score = normalize(comm, 0, 10)
  const maint_score = normalize(maint, 0, 10)
  const deposit_score = normalize(deposit, 0, 10)
  const dispute_score = inverse_normalize(disputes, 0, 5)

  const overall = weighted_sum([
    [comm_score, 0.3],
    [maint_score, 0.3],
    [deposit_score, 0.25],
    [dispute_score, 0.15],
  ])

  if (overall >= 0.8) {
    return {
      score: overall,
      message: 'Highly rated landlord — excellent communication and maintenance response.',
    }
  } else if (overall >= 0.6) {
    return { score: overall, message: 'Good landlord track record — responsive and fair.' }
  } else if (overall >= 0.4) {
    return { score: overall, message: 'Average landlord rating — some mixed feedback.' }
  } else {
    return {
      score: overall,
      message: 'Low landlord score — review dispute history before committing.',
    }
  }
}

export function market_pressure_insight(property: PropertyData): InsightResult {
  const views = property.views_last_7_days ?? 0
  const dom = property.days_on_market ?? 30
  const apps = property.applications_count ?? 0

  const views_score = normalize(views, 0, 100)
  const dom_score = inverse_normalize(dom, 0, 90)
  const apps_score = normalize(apps, 0, 15)

  const pressure = weighted_sum([
    [views_score, 0.3],
    [dom_score, 0.4],
    [apps_score, 0.3],
  ])

  if (pressure >= 0.7) {
    return {
      score: 1 - pressure,
      message: `High demand — ${views} views, ${apps} applications. Act quickly.`,
    }
  } else if (pressure >= 0.4) {
    return { score: 0.7, message: `Moderate interest — ${apps} applications received.` }
  } else {
    return {
      score: 0.9,
      message: `Low competition — ${dom} days on market with ${apps} applications.`,
    }
  }
}

export function future_area_insight(property: PropertyData): InsightResult {
  const events = property.area_events ?? []
  const dev_events = count_events(events, 'development')
  const retail_events = count_events(events, 'retail')
  const area_stats = property.area_stats

  let trend_score = 0.5
  if (area_stats?.monthly_avg_rent) {
    const rents = Object.values(area_stats.monthly_avg_rent)
    if (rents.length >= 2) {
      const first = rents[0]
      const last = rents[rents.length - 1]
      const growth = safe_div(last - first, first)
      trend_score = growth > 0.05 ? 0.8 : growth > 0 ? 0.65 : 0.4
    }
  }

  const event_score = normalize(dev_events + retail_events, 0, 5)
  const overall = weighted_sum([
    [trend_score, 0.7],
    [event_score, 0.3],
  ])

  if (overall >= 0.7) {
    return {
      score: overall,
      message: 'Area showing positive growth trends and development activity.',
    }
  } else if (overall >= 0.5) {
    return { score: overall, message: 'Stable area with moderate development activity.' }
  } else {
    return { score: overall, message: 'Limited area growth signals — worth monitoring.' }
  }
}

export function hidden_cost_insight(
  profile: TenantProfile,
  property: PropertyData,
): InsightResult {
  const elec = property.estimated_electricity ?? 0
  const water = property.estimated_water ?? 0
  const internet = property.estimated_internet ?? 0
  const parking = property.parking_cost ?? 0
  const transport = property.estimated_transport ?? 0
  const extra = property.tenant_extra_costs ?? 0

  const total_extra = elec + water + internet + parking + transport + extra
  const rent = property.rent ?? 0
  const total_cost = rent + total_extra
  const total_budget = profile.total_living_budget
  const cost_ratio = safe_div(total_cost, total_budget)

  if (total_extra === 0) {
    return {
      score: 0.6,
      message: 'No additional cost data available. Verify utility costs with the landlord.',
    }
  }

  if (cost_ratio <= 0.85) {
    return {
      score: 0.90,
      message: `Total costs R${Math.round(total_cost).toLocaleString('en-ZA')} incl. utilities — comfortable within your budget.`,
    }
  } else if (cost_ratio <= 1.0) {
    return {
      score: 0.65,
      message: `Total R${Math.round(total_cost).toLocaleString('en-ZA')} incl. extras — just within total budget.`,
    }
  } else {
    return {
      score: 0.25,
      message: `Total costs R${Math.round(total_cost).toLocaleString('en-ZA')} — exceeds your total living budget by ${Math.round((cost_ratio - 1) * 100)}%.`,
    }
  }
}

export function count_events(events: Array<{ event_type: string }>, type: string): number {
  return events.filter((e) => e.event_type === type).length
}

// ─── Tenant hard filter & scoring ─────────────────────────────────────────────

export function tenant_hard_filter(
  profile: TenantProfile,
  property: PropertyData,
): boolean {
  const dealbreakers = profile.dealbreakers ?? []
  const property_tags = property.property_tags ?? []

  for (const breaker of dealbreakers) {
    if (
      property_tags.some((t) => t.toLowerCase().includes(breaker.toLowerCase()))
    ) {
      return false
    }
  }

  if (profile.has_pets && property.pets_allowed === false) return false

  if (property.rent && profile.rental_budget > 0) {
    if (property.rent > profile.rental_budget * 1.5) return false
  }

  return true
}

export function generate_tenant_reasons(
  insights: TenantScoringResult['insights'],
): string[] {
  const reasons: string[] = []
  if (insights.financial && insights.financial.score >= 0.8) reasons.push(insights.financial.message)
  if (insights.deal && insights.deal.score >= 0.75) reasons.push(insights.deal.message)
  if (insights.safety && insights.safety.score >= 0.75) reasons.push(insights.safety.message)
  if (insights.lifestyle && insights.lifestyle.score >= 0.75) reasons.push(insights.lifestyle.message)
  if (insights.commute && insights.commute.score >= 0.75) reasons.push(insights.commute.message)
  if (insights.landlord && insights.landlord.score >= 0.75) reasons.push(insights.landlord.message)
  return reasons.slice(0, 5)
}

export function generate_tenant_warnings(
  profile: TenantProfile,
  property: PropertyData,
  insights: TenantScoringResult['insights'],
): string[] {
  const warnings: string[] = []
  if (insights.financial && insights.financial.score < 0.4) warnings.push(insights.financial.message)
  if (insights.safety && insights.safety.score < 0.4) warnings.push(insights.safety.message)
  if (insights.hidden_cost && insights.hidden_cost.score < 0.4) warnings.push(insights.hidden_cost.message)
  if (insights.approval && insights.approval.score < 0.4) warnings.push(insights.approval.message)
  if (profile.has_pets && property.pets_allowed === false) {
    warnings.push('Pets not allowed at this property.')
  }
  return warnings.slice(0, 5)
}

const TENANT_WEIGHTS = {
  financial: 0.20,
  deal: 0.14,
  safety: 0.12,
  lifestyle: 0.10,
  commute: 0.10,
  landlord: 0.08,
  approval: 0.09,
  market_pressure: 0.03,
  area_momentum: 0.04,
  hidden_cost: 0.03,
  timing: 0.07,
}

export function score_tenant_property(
  profile: TenantProfile,
  property: PropertyData,
): TenantScoringResult {
  const passed = tenant_hard_filter(profile, property)

  const financial = financial_insight(profile, property)
  const deal = deal_insight(profile, property)
  const safety = safety_insight(property)
  const lifestyle = lifestyle_insight(profile, property)
  const commute = commute_insight(profile, property)
  const approval = approval_insight(profile, property)
  const landlord = landlord_insight(property)
  const market_pressure = market_pressure_insight(property)
  const area_momentum = future_area_insight(property)
  const hidden_cost = hidden_cost_insight(profile, property)
  const timing = timing_insight(profile, property)

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
  }

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
  ])

  const score = Math.round(clamp(raw_score * 100, 0, 100))
  const confidence = confidence_score(property)
  const top_reasons = generate_tenant_reasons(insights)
  const warnings = generate_tenant_warnings(profile, property, insights)

  return {
    property_id: property.property_id,
    score,
    confidence,
    passed_filter: passed,
    insights,
    top_reasons,
    warnings,
  }
}

export function rank_tenant_properties(
  properties: PropertyData[],
  profile: TenantProfile,
): TenantScoringResult[] {
  return properties
    .map((p) => score_tenant_property(profile, p))
    .filter((r) => r.passed_filter)
    .sort((a, b) => b.score - a.score)
}

// ─── Buyer insight functions ───────────────────────────────────────────────────

export function yield_insight(property: PropertyData): InsightResult {
  const monthly_rent = property.monthly_rent ?? 0
  const purchase_price = property.purchase_price ?? 0

  if (purchase_price === 0 || monthly_rent === 0) {
    return { score: 0.5, message: 'Insufficient data to calculate yield.' }
  }

  const gross_yield = safe_div(monthly_rent * 12, purchase_price)
  const net_yield = gross_yield * 0.85

  if (gross_yield >= 0.1) {
    return {
      score: 0.95,
      message: `Excellent yield — ${(gross_yield * 100).toFixed(1)}% gross (${(net_yield * 100).toFixed(1)}% net estimated).`,
    }
  } else if (gross_yield >= 0.08) {
    return { score: 0.80, message: `Strong yield — ${(gross_yield * 100).toFixed(1)}% gross.` }
  } else if (gross_yield >= 0.06) {
    return {
      score: 0.65,
      message: `Decent yield — ${(gross_yield * 100).toFixed(1)}% gross. Market average.`,
    }
  } else if (gross_yield >= 0.04) {
    return {
      score: 0.40,
      message: `Below-average yield — ${(gross_yield * 100).toFixed(1)}% gross.`,
    }
  } else {
    return {
      score: 0.15,
      message: `Poor yield — ${(gross_yield * 100).toFixed(1)}% gross. Likely capital-growth play.`,
    }
  }
}

export function capital_growth_insight(property: PropertyData): InsightResult {
  const growth = property.annual_price_growth ?? 0.05

  if (growth >= 0.12) {
    return {
      score: 0.95,
      message: `Exceptional growth — ${(growth * 100).toFixed(1)}% annual price appreciation.`,
    }
  } else if (growth >= 0.08) {
    return { score: 0.80, message: `Strong growth area — ${(growth * 100).toFixed(1)}% annual appreciation.` }
  } else if (growth >= 0.05) {
    return { score: 0.65, message: `Moderate growth — ${(growth * 100).toFixed(1)}% annually. Tracks inflation.` }
  } else if (growth >= 0.02) {
    return { score: 0.40, message: `Slow growth — ${(growth * 100).toFixed(1)}% annually.` }
  } else {
    return { score: 0.15, message: `Flat or declining values — ${(growth * 100).toFixed(1)}% growth rate.` }
  }
}

export function stability_insight(property: PropertyData): InsightResult {
  const vacancy = property.vacancy_rate ?? 0.08
  const demand = property.tenant_demand_index ?? 5
  const family_score = property.family_rental_score ?? 5

  const vacancy_score = inverse_normalize(vacancy, 0, 0.25)
  const demand_score = normalize(demand, 0, 10)
  const family_score_norm = normalize(family_score, 0, 10)

  const overall = weighted_sum([
    [vacancy_score, 0.5],
    [demand_score, 0.3],
    [family_score_norm, 0.2],
  ])

  if (overall >= 0.8) {
    return {
      score: overall,
      message: `Very stable — ${(vacancy * 100).toFixed(1)}% vacancy rate with strong demand.`,
    }
  } else if (overall >= 0.6) {
    return {
      score: overall,
      message: 'Good stability — below-average vacancy and consistent rental demand.',
    }
  } else if (overall >= 0.4) {
    return {
      score: overall,
      message: `Moderate stability — ${(vacancy * 100).toFixed(1)}% vacancy. Monitor demand trends.`,
    }
  } else {
    return {
      score: overall,
      message: `Higher volatility — ${(vacancy * 100).toFixed(1)}% vacancy rate.`,
    }
  }
}

export function buyer_value_insight(
  profile: BuyerProfile,
  property: PropertyData,
): InsightResult {
  const price = property.purchase_price ?? 0
  const avg_price = property.area_avg_price_per_m2
  const price_m2 = property.price_per_m2
  const discount = property.discount_to_market ?? 0

  if (price > profile.budget) {
    return {
      score: 0.10,
      message: `Above budget — R${((price - profile.budget) / 1).toLocaleString('en-ZA', { maximumFractionDigits: 0 })} over your limit.`,
    }
  }

  if (discount <= -0.1) {
    return {
      score: 0.95,
      message: `${Math.round(Math.abs(discount) * 100)}% below market value — strong buy opportunity.`,
    }
  } else if (discount <= -0.03) {
    return { score: 0.80, message: 'Slightly below market — good entry value.' }
  } else if (avg_price && price_m2) {
    const vm2_diff = percentage_difference(price_m2, avg_price)
    if (vm2_diff <= 0) {
      return { score: 0.75, message: 'Fair value — priced at or below area average per m².' }
    } else {
      return {
        score: 0.45,
        message: `${Math.round(vm2_diff * 100)}% above area average per m².`,
      }
    }
  }

  return { score: 0.55, message: 'Market value in line with suburb pricing.' }
}

export function liquidity_insight(property: PropertyData): InsightResult {
  const days_to_sell = property.avg_days_to_sell ?? 90
  const sales_volume = property.sales_volume_index ?? 5
  const buyer_demand = property.buyer_demand_index ?? 5

  const days_score = inverse_normalize(days_to_sell, 0, 180)
  const volume_score = normalize(sales_volume, 0, 10)
  const demand_score = normalize(buyer_demand, 0, 10)

  const overall = weighted_sum([
    [days_score, 0.5],
    [volume_score, 0.25],
    [demand_score, 0.25],
  ])

  if (overall >= 0.75) {
    return {
      score: overall,
      message: `Highly liquid market — properties sell in ~${days_to_sell} days.`,
    }
  } else if (overall >= 0.5) {
    return {
      score: overall,
      message: `Moderate liquidity — typical sale time ${days_to_sell} days.`,
    }
  } else {
    return {
      score: overall,
      message: `Lower liquidity — expect ~${days_to_sell} days to sell. Consider exit strategy.`,
    }
  }
}

export function buyer_risk_insight(property: PropertyData): InsightResult {
  const crime = property.crime_index ?? 50
  const levy_risk = property.levy_risk_index ?? 3
  const maint_risk = property.building_maintenance_risk ?? 3
  const new_units = property.new_units_pipeline ?? 0
  const risk_idx = property.risk_index ?? 50

  const crime_score = inverse_normalize(crime, 0, 100)
  const levy_score = inverse_normalize(levy_risk, 0, 10)
  const maint_score = inverse_normalize(maint_risk, 0, 10)
  const supply_score = inverse_normalize(new_units, 0, 1000)
  const risk_score_norm = inverse_normalize(risk_idx, 0, 100)

  const overall = weighted_sum([
    [crime_score, 0.25],
    [levy_score, 0.2],
    [maint_score, 0.2],
    [supply_score, 0.15],
    [risk_score_norm, 0.2],
  ])

  if (overall >= 0.75) {
    return {
      score: overall,
      message: 'Low risk profile — minimal crime, levy and supply concerns.',
    }
  } else if (overall >= 0.55) {
    return { score: overall, message: 'Moderate risk — some factors to monitor.' }
  } else if (overall >= 0.35) {
    return {
      score: overall,
      message: 'Elevated risk — review crime index and body corporate levies.',
    }
  } else {
    return {
      score: overall,
      message: 'High risk profile — significant crime, levy or supply risk.',
    }
  }
}

export function buyer_weights(profile: BuyerProfile): Record<string, number> {
  const strategies: Record<string, Record<string, number>> = {
    yield: {
      yield: 0.40,
      capital_growth: 0.10,
      stability: 0.20,
      value: 0.15,
      liquidity: 0.10,
      risk: 0.05,
    },
    growth: {
      yield: 0.10,
      capital_growth: 0.40,
      stability: 0.15,
      value: 0.15,
      liquidity: 0.15,
      risk: 0.05,
    },
    stability: {
      yield: 0.20,
      capital_growth: 0.15,
      stability: 0.35,
      value: 0.10,
      liquidity: 0.10,
      risk: 0.10,
    },
    balanced: {
      yield: 0.20,
      capital_growth: 0.20,
      stability: 0.20,
      value: 0.20,
      liquidity: 0.10,
      risk: 0.10,
    },
  }
  return strategies[profile.strategy] ?? strategies.balanced
}

export function risk_penalty_factor(
  profile: BuyerProfile,
  risk_score: number,
): number {
  const tolerance_multipliers: Record<string, number> = {
    low: 0.8,
    medium: 0.9,
    high: 1.0,
  }
  const multiplier = tolerance_multipliers[profile.risk_tolerance] ?? 0.9

  if (risk_score < 0.4) return multiplier * 0.85
  if (risk_score < 0.6) return multiplier * 0.95
  return 1.0
}

export function buyer_hard_filter(
  profile: BuyerProfile,
  property: PropertyData,
): boolean {
  const dealbreakers = profile.dealbreakers ?? []
  const property_tags = property.property_tags ?? []

  for (const breaker of dealbreakers) {
    if (property_tags.some((t) => t.toLowerCase().includes(breaker.toLowerCase()))) {
      return false
    }
  }

  if (property.purchase_price && property.purchase_price > profile.budget * 1.1) {
    return false
  }

  return true
}

export function generate_buyer_reasons(
  insights: BuyerScoringResult['insights'],
  strategy: string,
): string[] {
  void strategy
  const reasons: string[] = []
  if (insights.yield && insights.yield.score >= 0.75) reasons.push(insights.yield.message)
  if (insights.capital_growth && insights.capital_growth.score >= 0.75) reasons.push(insights.capital_growth.message)
  if (insights.stability && insights.stability.score >= 0.75) reasons.push(insights.stability.message)
  if (insights.value && insights.value.score >= 0.75) reasons.push(insights.value.message)
  if (insights.liquidity && insights.liquidity.score >= 0.75) reasons.push(insights.liquidity.message)
  return reasons.slice(0, 4)
}

export function generate_buyer_warnings(
  insights: BuyerScoringResult['insights'],
): string[] {
  const warnings: string[] = []
  if (insights.yield && insights.yield.score < 0.35) warnings.push(insights.yield.message)
  if (insights.risk && insights.risk.score < 0.4) warnings.push(insights.risk.message)
  if (insights.stability && insights.stability.score < 0.35) warnings.push(insights.stability.message)
  if (insights.value && insights.value.score < 0.3) warnings.push(insights.value.message)
  return warnings.slice(0, 4)
}

export function score_buyer_property(
  profile: BuyerProfile,
  property: PropertyData,
): BuyerScoringResult {
  const passed = buyer_hard_filter(profile, property)

  const yieldIns = yield_insight(property)
  const growth = capital_growth_insight(property)
  const stab = stability_insight(property)
  const value = buyer_value_insight(profile, property)
  const liquidity = liquidity_insight(property)
  const risk = buyer_risk_insight(property)

  const insights = {
    yield: yieldIns,
    capital_growth: growth,
    stability: stab,
    value,
    liquidity,
    risk,
  }

  const weights = buyer_weights(profile)
  const penalty = risk_penalty_factor(profile, risk.score)

  const raw_score = weighted_sum([
    [yieldIns.score, weights.yield],
    [growth.score, weights.capital_growth],
    [stab.score, weights.stability],
    [value.score, weights.value],
    [liquidity.score, weights.liquidity],
    [risk.score, weights.risk],
  ])

  const score = Math.round(clamp(raw_score * penalty * 100, 0, 100))
  const confidence = confidence_score(property)
  const top_reasons = generate_buyer_reasons(insights, profile.strategy)
  const warnings = generate_buyer_warnings(insights)

  return {
    property_id: property.property_id,
    score,
    confidence,
    passed_filter: passed,
    insights,
    top_reasons,
    warnings,
  }
}

export function rank_buyer_properties(
  properties: PropertyData[],
  profile: BuyerProfile,
): BuyerScoringResult[] {
  return properties
    .map((p) => score_buyer_property(profile, p))
    .filter((r) => r.passed_filter)
    .sort((a, b) => b.score - a.score)
}
