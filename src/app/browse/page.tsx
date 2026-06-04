import { createClient } from '@/lib/supabase/server'
import { BrowseListing } from './BrowseListing'
import type { PropertyListing } from '@/lib/types'
import { rank_properties_for_tenant_interests } from '@/lib/scoring/interest-engine'
import { mapTenantProfile, mapProperty } from '@/lib/scoring/mappers'
import type { ScoreResult } from '@/lib/scoring/interest-engine'

export const dynamic = 'force-dynamic'

export default async function BrowsePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Auth state
  let isTenant = false
  let hasTenantProfile = false

  if (user) {
    const { data: prof } = await supabase
      .from('profiles')
      .select('is_tenant')
      .eq('id', user.id)
      .single()
    isTenant = prof?.is_tenant ?? false
  }

  // Load all listed properties
  const { data: rawProps } = await supabase
    .from('properties')
    .select('*')
    .eq('is_listed', true)
    .order('created_at', { ascending: false })
    .limit(100)

  const properties = (rawProps ?? []) as PropertyListing[]

  // Score properties server-side
  let scoreMap: Record<string, ScoreResult> = {}

  const defaultProfile = { monthly_income: 25000, rental_budget: 12000, total_living_budget: 17000 }
  let tenantProfile = defaultProfile

  if (user && isTenant) {
    const { data: tp } = await supabase
      .from('tenant_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
    if (tp) {
      hasTenantProfile = true
      tenantProfile = mapTenantProfile(tp as Record<string, unknown>)
    }
  }

  if (properties.length > 0) {
    const propertyData = properties.map(p => mapProperty(p as unknown as Record<string, unknown>))
    const results = rank_properties_for_tenant_interests(propertyData, tenantProfile)
    scoreMap = Object.fromEntries(results.map(r => [r.property_id ?? '', r]))
  }

  return (
    <BrowseListing
      properties={properties}
      scoreMap={scoreMap}
      isLoggedIn={!!user}
      isTenant={isTenant}
      hasTenantProfile={hasTenantProfile}
    />
  )
}
