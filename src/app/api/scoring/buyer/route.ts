import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { rank_buyer_properties } from '@/lib/scoring/engine'

export async function POST(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const {
    budget,
    strategy = 'balanced',
    risk_tolerance = 'medium',
    property_ids,
  } = await request.json()

  const buyerProfile = {
    budget: budget || 2000000,
    strategy,
    risk_tolerance,
    preferred_suburbs: [],
    must_haves: [],
    dealbreakers: [],
  }

  const { data: properties } = await supabase
    .from('properties')
    .select('*')
    .in('id', property_ids || [])

  if (!properties?.length) return NextResponse.json({ results: [] })

  const propertyData = properties.map((p) => ({
    property_id: p.id,
    suburb: p.suburb,
    purchase_price: ((p.asking_rent || 0) / 100) * 200,
    monthly_rent: (p.asking_rent || 0) / 100,
    annual_price_growth: 0.06,
    vacancy_rate: 0.07,
    crime_index: 40,
    discount_to_market: 0,
  }))

  const results = rank_buyer_properties(propertyData, buyerProfile)

  return NextResponse.json({ results })
}
