import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('lease_agreements')
    .select(`*, properties ( name, address ), tenants ( full_name )`)
    .eq('landlord_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ leases: data })
}

export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    property_id, tenant_id, lease_start, lease_end,
    monthly_rent, deposit_amount, payment_due_day,
    notice_period_days, pet_allowed, subletting_allowed, special_conditions,
  } = body

  if (!property_id || !tenant_id || !lease_start || !monthly_rent) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('lease_agreements')
    .insert({
      property_id,
      tenant_id,
      landlord_id: user.id,
      lease_start,
      lease_end: lease_end || null,
      monthly_rent,
      deposit_amount: deposit_amount || null,
      payment_due_day: payment_due_day ?? 1,
      notice_period_days: notice_period_days ?? 30,
      pet_allowed: pet_allowed ?? false,
      subletting_allowed: subletting_allowed ?? false,
      special_conditions: special_conditions || null,
      status: 'draft',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ lease: data }, { status: 201 })
}
