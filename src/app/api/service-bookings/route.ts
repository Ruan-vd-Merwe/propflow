import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendBookingToProvider } from '@/lib/whatsapp'

export const runtime = 'nodejs'

/**
 * POST /api/service-bookings
 * Creates a service booking and notifies the provider via WhatsApp.
 * Called from both the landlord /services page (form POST) and
 * the tenant portal (JSON body).
 */
export async function POST(req: NextRequest) {
  const contentType = req.headers.get('content-type') ?? ''

  let provider_id: string
  let property_id: string
  let scheduled_date: string | undefined
  let notes: string | undefined
  let tenant_id: string | undefined

  if (contentType.includes('application/json')) {
    const body = await req.json()
    provider_id    = body.provider_id
    property_id    = body.property_id
    scheduled_date = body.scheduled_date
    notes          = body.notes
    tenant_id      = body.tenant_id   // optional — passed from tenant portal
  } else {
    // application/x-www-form-urlencoded (form POST from /services page)
    const form     = await req.formData()
    provider_id    = form.get('provider_id') as string
    property_id    = form.get('property_id') as string
    scheduled_date = (form.get('scheduled_date') as string) || undefined
    notes          = (form.get('notes') as string) || undefined
  }

  if (!provider_id || !property_id) {
    return NextResponse.json({ error: 'provider_id and property_id are required' }, { status: 400 })
  }

  const supabase = createClient()
  const service  = createServiceClient()

  // Verify the property belongs to the current user (or lookup via tenant_id)
  const tenantIdToStore = tenant_id ?? null
  let propertyName = ''
  let tenantName   = 'Tenant'

  const { data: property } = await service
    .from('properties')
    .select('id, name, owner_id')
    .eq('id', property_id)
    .single()

  if (!property) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 })
  }
  propertyName = property.name

  // Auth: landlord flow
  if (!tenant_id) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== property.owner_id) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }
  }

  // If tenant_id provided, look up their name
  if (tenant_id) {
    const { data: t } = await service.from('tenants').select('full_name').eq('id', tenant_id).single()
    if (t) tenantName = t.full_name
  }

  // Fetch provider details for WhatsApp
  const { data: provider } = await service
    .from('service_providers')
    .select('id, name, phone, whatsapp')
    .eq('id', provider_id)
    .single()

  if (!provider) {
    return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
  }

  // Create booking
  const { data: booking, error } = await service
    .from('service_bookings')
    .insert({
      tenant_id:      tenantIdToStore,
      provider_id,
      property_id,
      scheduled_date: scheduled_date ?? null,
      notes:          notes ?? null,
      status:         'requested',
    })
    .select('id, status, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Notify provider via WhatsApp (fire-and-forget)
  const providerPhone = provider.whatsapp ?? provider.phone
  if (providerPhone && scheduled_date) {
    sendBookingToProvider({
      phone:        providerPhone,
      providerName: provider.name,
      service:      'Service booking',
      tenantName,
      property:     propertyName,
      date:         scheduled_date,
      notes,
    }).catch(console.error)
  }

  // If called via form POST, redirect back to /services
  if (!contentType.includes('application/json')) {
    return NextResponse.redirect(new URL('/services?booked=1', req.url))
  }

  return NextResponse.json({ success: true, booking }, { status: 201 })
}
