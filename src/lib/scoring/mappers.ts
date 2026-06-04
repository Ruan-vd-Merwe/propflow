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

  const petsAllowed    = Boolean(property.pets_allowed)
  const parkingAvail   = Boolean(property.parking_available)
  const fibreAvail     = Boolean(property.fibre_available)

  const baseTags: string[] = [
    property.property_type ? String(property.property_type) : '',
    petsAllowed   ? 'pets_allowed'      : '',
    parkingAvail  ? 'parking'           : '',
    fibreAvail    ? 'fibre_available'   : '',
  ].filter(Boolean)

  const storedTags = Array.isArray(property.property_tags)
    ? (property.property_tags as string[])
    : []

  const areaTags = Array.isArray(property.area_tags)
    ? (property.area_tags as string[])
    : []

  const lifestyleTags = Array.isArray(property.lifestyle_tags)
    ? (property.lifestyle_tags as string[])
    : []

  return {
    property_id: String(property.id || ''),
    title: String(property.name || ''),
    suburb: property.suburb ? String(property.suburb) : undefined,
    rent,
    bedrooms: property.bedrooms != null ? Number(property.bedrooms) : undefined,
    floor_size_m2: property.floor_size_m2 != null ? Number(property.floor_size_m2) : undefined,
    property_tags: Array.from(new Set([...baseTags, ...storedTags])),
    area_tags: areaTags,
    lifestyle_tags: lifestyleTags,
    pets_allowed: petsAllowed,
    parking_available: parkingAvail,
    fibre_available: fibreAvail,
    suburb_avg_rent: rent,
    estimated_electricity: 1200,
    estimated_water: 300,
    estimated_internet: 700,
  }
}
