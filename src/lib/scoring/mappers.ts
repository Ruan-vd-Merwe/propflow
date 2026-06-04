import type { TenantInterestProfile, PropertyData } from './interest-engine'

export function mapTenantProfile(
  tenantProfile: Record<string, unknown>,
): TenantInterestProfile {
  return {
    monthly_income: Number(tenantProfile.monthly_income || 0) / 100,
    rental_budget: Number(tenantProfile.budget_max || 0) / 100,
    total_living_budget: (Number(tenantProfile.budget_max || 0) / 100) * 1.4,
    preferred_suburbs: tenantProfile.looking_in_area
      ? [String(tenantProfile.looking_in_area)]
      : [],
    desired_bedrooms: tenantProfile.desired_bedrooms != null
      ? Number(tenantProfile.desired_bedrooms)
      : undefined,
    move_in_month: tenantProfile.move_in_date
      ? new Date(String(tenantProfile.move_in_date)).getMonth() + 1
      : undefined,
    work_locations: tenantProfile.work_location
      ? [String(tenantProfile.work_location)]
      : [],
    lifestyle_interests: Array.isArray(tenantProfile.lifestyle_interests)
      ? (tenantProfile.lifestyle_interests as string[])
      : [],
    property_interests: Array.isArray(tenantProfile.property_interests)
      ? (tenantProfile.property_interests as string[])
      : [],
    area_interests: Array.isArray(tenantProfile.area_interests)
      ? (tenantProfile.area_interests as string[])
      : [],
    must_haves: Array.isArray(tenantProfile.must_haves)
      ? (tenantProfile.must_haves as string[])
      : [],
    dealbreakers: Array.isArray(tenantProfile.dealbreakers)
      ? (tenantProfile.dealbreakers as string[])
      : [],
    has_car: tenantProfile.has_car !== false,
    has_pets: Boolean(tenantProfile.has_pets),
  }
}

export function mapProperty(property: Record<string, unknown>): PropertyData {
  const rent = Number(property.asking_rent || 0) / 100
  return {
    property_id: String(property.id || ''),
    title: String(property.name || ''),
    suburb: property.suburb ? String(property.suburb) : undefined,
    rent,
    bedrooms: Number(property.bedrooms || 1),
    property_tags: [
      property.property_type as string,
      property.pet_friendly ? 'pets_allowed' : '',
      property.parking ? 'parking' : '',
    ].filter(Boolean),
    area_tags: [
      property.suburb
        ? String(property.suburb).toLowerCase().replace(/\s+/g, '_')
        : '',
      property.province
        ? String(property.province).toLowerCase().replace(/\s+/g, '_')
        : '',
    ].filter(Boolean),
    lifestyle_tags: [],
    pets_allowed: Boolean(property.pet_friendly),
    parking_available: Boolean(property.parking),
    suburb_avg_rent: rent,
    estimated_electricity: 1200,
    estimated_water: 300,
    estimated_internet: 700,
  }
}
