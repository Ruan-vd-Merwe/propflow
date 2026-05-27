import type { TenantProfile, PropertyListing, MatchScore, TenantMatch, Profile } from './types'

/**
 * Score a tenant profile against a property listing.
 *
 * Max 100 pts:
 *   30 — budget match
 *   25 — area match
 *   25 — income affordability (proxy for risk score for new tenants)
 *   20 — move-in date match
 */
export function calculateMatchScore(
  tenantProfile: TenantProfile,
  property: PropertyListing,
): MatchScore {
  // ── 1. Budget match (30 pts) ──────────────────────────────────────────────
  let budget = 0
  if (tenantProfile.budget_max !== null && property.asking_rent !== null && property.asking_rent > 0) {
    if (tenantProfile.budget_max >= property.asking_rent) {
      budget = 30
    } else {
      const shortfall = property.asking_rent - tenantProfile.budget_max
      const pct = shortfall / property.asking_rent
      if (pct <= 0.1) budget = 15   // within 10% below asking
    }
  }

  // ── 2. Area match (25 pts) ────────────────────────────────────────────────
  let area = 0
  const tProv = (tenantProfile.looking_in_province ?? '').toLowerCase().trim()
  const pProv = (property.province ?? '').toLowerCase().trim()
  const tArea = (tenantProfile.looking_in_area ?? '').toLowerCase().trim()
  const pSuburb = (property.suburb ?? '').toLowerCase().trim()

  if (tProv && pProv && tProv === pProv) {
    if (tArea && pSuburb && tArea === pSuburb) {
      area = 25  // same suburb
    } else {
      area = 12  // same province, different suburb
    }
  }

  // ── 3. Income affordability (25 pts — proxy for risk score) ──────────────
  // Standard rule: rent should be ≤ 30 % of net income (3× rent ≥ income)
  let income = 0
  if (tenantProfile.monthly_income !== null && property.asking_rent !== null && property.asking_rent > 0) {
    const ratio = tenantProfile.monthly_income / property.asking_rent
    if (ratio >= 3.5) income = 25
    else if (ratio >= 3)   income = 20
    else if (ratio >= 2.5) income = 14
    else if (ratio >= 2)   income = 8
    else if (ratio >= 1.5) income = 3
  }

  // ── 4. Move-in date match (20 pts) ────────────────────────────────────────
  let date = 0
  if (tenantProfile.move_in_date && property.available_from) {
    const diffMs = Math.abs(
      new Date(tenantProfile.move_in_date).getTime() -
      new Date(property.available_from).getTime(),
    )
    const days = diffMs / 86_400_000
    if (days <= 30) date = 20
    else if (days <= 60) date = 10
  }

  return { total: budget + area + income + date, budget, area, income, date }
}

/** Colour classification for a match score */
export function matchColour(score: number): 'green' | 'amber' | 'red' {
  if (score >= 70) return 'green'
  if (score >= 40) return 'amber'
  return 'red'
}

/** Privacy-safe display name: "Sarah D." */
export function displayName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0]}.`
}

/** Score multiple tenants against a property, sorted by match descending */
export function rankTenants(
  tenants: Array<{ profile: Pick<Profile, 'id' | 'full_name' | 'email'>; tenantProfile: TenantProfile }>,
  property: PropertyListing,
): TenantMatch[] {
  return tenants
    .map(({ profile, tenantProfile }) => ({
      profile,
      tenantProfile,
      match: calculateMatchScore(tenantProfile, property),
    }))
    .sort((a, b) => b.match.total - a.match.total)
}
