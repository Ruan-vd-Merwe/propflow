import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { rank_properties_for_tenant_interests } from '@/lib/scoring/interest-engine'
import { mapTenantProfile, mapProperty } from '@/lib/scoring/mappers'

export async function POST(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { property_ids } = await request.json()

  let tenantProfile = null
  if (user) {
    const { data: tp } = await supabase
      .from('tenant_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
    if (tp) tenantProfile = mapTenantProfile(tp as Record<string, unknown>)
  }

  if (!tenantProfile) {
    tenantProfile = {
      monthly_income: 25000,
      rental_budget: 12000,
      total_living_budget: 17000,
    }
  }

  let query = supabase.from('properties').select('*')
  if (property_ids?.length) {
    query = query.in('id', property_ids)
  } else {
    query = query.eq('is_listed', true).limit(50)
  }

  const { data: properties } = await query

  if (!properties?.length) {
    return NextResponse.json({ results: [] })
  }

  const propertyData = properties.map((p) => mapProperty(p as Record<string, unknown>))
  const results = rank_properties_for_tenant_interests(propertyData, tenantProfile)

  return NextResponse.json({ results })
}
