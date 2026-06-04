import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { rank_properties_for_tenant_interests } from '@/lib/scoring/interest-engine'
import { mapTenantProfile, mapProperty } from '@/lib/scoring/mappers'
import type { ScoreResult } from '@/lib/scoring/interest-engine'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { property_ids } = await request.json()

  // Try to load tenant profile
  let tenantProfile = null
  if (user) {
    const { data: tp } = await supabase
      .from('tenant_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
    if (tp?.budget_max && tp?.looking_in_area) {
      tenantProfile = mapTenantProfile(tp as Record<string, unknown>)
    }
  }

  // Load properties
  let query = supabase.from('properties').select('*')
  if (property_ids?.length) {
    query = query.in('id', property_ids)
  } else {
    query = query.eq('is_listed', true).limit(100)
  }

  const { data: properties } = await query

  if (!properties?.length) {
    return NextResponse.json({ personalised: false, results: [] })
  }

  // Personalised: run full interest engine
  if (tenantProfile) {
    const propertyData = properties.map(p => mapProperty(p as Record<string, unknown>))
    const results = rank_properties_for_tenant_interests(propertyData, tenantProfile)
    return NextResponse.json({ personalised: true, results })
  }

  // Guest fallback: basic affordability score (cheapest=80, expensive=20)
  const rents = properties.map(p => (p.asking_rent as number | null) ?? 0).filter(r => r > 0)
  const minRent = rents.length ? Math.min(...rents) : 0
  const maxRent = rents.length ? Math.max(...rents) : 0
  const rentRange = maxRent - minRent

  const fallbackResults: ScoreResult[] = properties.map(p => {
    const rent = (p.asking_rent as number | null) ?? 0
    let basic_score = 50
    if (rentRange > 0 && rent > 0) {
      basic_score = Math.round(80 - ((rent - minRent) / rentRange) * 60)
    }
    return {
      property_id: p.id as string,
      title: p.name as string,
      suburb: (p.suburb as string | null) ?? undefined,
      rent: rent / 100,
      score: basic_score,
      confidence: 0.2,
      status: 'ranked' as const,
      match_reasons: [],
      warnings: [],
      insights: {},
    }
  })

  return NextResponse.json({ personalised: false, results: fallbackResults })
}
