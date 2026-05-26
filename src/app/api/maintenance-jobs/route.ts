import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: props } = await supabase
    .from('properties').select('id').eq('owner_id', user.id)
  const ids = (props ?? []).map((p) => p.id)

  if (!ids.length) return NextResponse.json({ jobs: [] })

  const status = new URL(req.url).searchParams.get('status')
  let query = supabase
    .from('maintenance_jobs')
    .select(`*, property_components(name, component_type), properties(name)`)
    .in('property_id', ids)
    .order('updated_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data } = await query
  return NextResponse.json({ jobs: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { property_id, title, urgency, component_id, tenant_query_id } = body

    if (!property_id || !title) {
      return NextResponse.json({ error: 'property_id and title are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('maintenance_jobs')
      .insert({
        property_id, title,
        urgency:         urgency        ?? 'normal',
        component_id:    component_id   ?? null,
        tenant_query_id: tenant_query_id ?? null,
        status:          'draft',
      })
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, id: data.id }, { status: 201 })
  } catch (err) {
    console.error('[maintenance-jobs POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
