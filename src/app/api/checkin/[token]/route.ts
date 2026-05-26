import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const runtime = 'nodejs'

/**
 * POST /api/checkin/:token
 * Tenant submits their monthly check-in response.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const body = await req.json()
    const { unit_working, maintenance_needed, maintenance_details, flag_text } = body as {
      unit_working:        boolean
      maintenance_needed:  boolean
      maintenance_details: string
      flag_text:           string
    }

    if (typeof unit_working !== 'boolean' || typeof maintenance_needed !== 'boolean') {
      return NextResponse.json({ error: 'unit_working and maintenance_needed are required booleans' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Verify token exists and hasn't been responded to
    const { data: checkin } = await supabase
      .from('checkin_responses')
      .select('id, responded_at, tenant_id')
      .eq('token', params.token)
      .single()

    if (!checkin) {
      return NextResponse.json({ error: 'Invalid or expired check-in link' }, { status: 404 })
    }

    if (checkin.responded_at) {
      return NextResponse.json({ error: 'Check-in already completed' }, { status: 409 })
    }

    const { error } = await supabase
      .from('checkin_responses')
      .update({
        unit_working,
        maintenance_needed,
        maintenance_details: maintenance_needed ? (maintenance_details?.trim() || null) : null,
        flag_text:           flag_text?.trim() || null,
        responded_at:        new Date().toISOString(),
      })
      .eq('token', params.token)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If maintenance needed, automatically create a query
    if (maintenance_needed && maintenance_details?.trim()) {
      await supabase.from('tenant_queries').insert({
        tenant_id:   checkin.tenant_id,
        category:    'maintenance',
        subcategory: 'other',
        title:       'Maintenance request (from check-in)',
        description: maintenance_details.trim(),
        status:      'open',
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[checkin POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
