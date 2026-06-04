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
    desired_bedrooms: undefined,
    move_in_month: tenantProfile.move_in_date
      ? new Date(String(tenantProfile.move_in_date)).getMonth() + 1
      : undefined,
    work_locations: [],
    lifestyle_interests: [],
    property_interests: [],
    area_interests: [],
    must_haves: [],
    dealbreakers: [],
    has_car: true,
    has_pets: false,
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
