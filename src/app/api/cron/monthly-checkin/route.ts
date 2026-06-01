import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendCheckinNotification } from '@/lib/resend'

export const runtime = 'nodejs'
export const maxDuration = 120

/**
 * POST /api/cron/monthly-checkin
 *
 * Called on the 1st of each month at 09:00 UTC by Vercel Cron (see vercel.json).
 * For each active tenant, creates a checkin_response record and sends them
 * a check-in email with their unique link.
 *
 * A tenant is "active" if today falls within their lease_start → lease_end window.
 * A check-in is only sent once per tenant per month (idempotent).
 */
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')?.replace('Bearer ', '')
  if (process.env.CRON_SECRET && auth !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  const today     = new Date()
  const monthKey  = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  const monthLabel = today.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })
  const appBase    = process.env.NEXT_PUBLIC_APP_URL ?? 'https://proptrust.co.za'

  // Get all active tenants (lease includes today)
  const todayStr = today.toISOString().split('T')[0]
  const { data: tenants, error } = await supabase
    .from('tenants')
    .select(`
      id, full_name, email, access_token,
      properties!inner ( name,
        profiles!inner ( full_name, email )
      )
    `)
    .lte('lease_start', todayStr)
    .or(`lease_end.is.null,lease_end.gte.${todayStr}`)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const results: { tenantId: string; sent: boolean; skipped: boolean; error?: string }[] = []

  for (const tenant of tenants ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const property = (tenant as any).properties
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const landlord = property?.profiles as any

    // Idempotency: skip if a check-in already exists for this tenant × month
    const { data: existing } = await supabase
      .from('checkin_responses')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('month', monthKey)
      .limit(1)

    if (existing?.length) {
      results.push({ tenantId: tenant.id, sent: false, skipped: true })
      continue
    }

    // Generate unique token
    const token = crypto.randomUUID().replace(/-/g, '') + Date.now().toString(36)

    // Insert checkin record
    const { error: insertError } = await supabase
      .from('checkin_responses')
      .insert({
        tenant_id: tenant.id,
        month:     monthKey,
        token,
        sent_at:   new Date().toISOString(),
      })

    if (insertError) {
      results.push({ tenantId: tenant.id, sent: false, skipped: false, error: insertError.message })
      continue
    }

    // Send email
    const checkinUrl = `${appBase}/checkin/${token}`
    const emailResult = await sendCheckinNotification({
      toEmail:      tenant.email,
      tenantName:   tenant.full_name,
      propertyName: property?.name ?? 'your property',
      checkinUrl,
      month:        monthLabel,
      landlordName: landlord?.full_name ?? 'Your landlord',
    })

    // Log communication
    await supabase.from('communications_log').insert({
      tenant_id: tenant.id,
      type:      'monthly_checkin',
      subject:   `Monthly check-in — ${monthLabel}`,
      to_email:  tenant.email,
      resend_id: emailResult.resend_id,
      status:    emailResult.success ? 'sent' : 'failed',
      metadata:  { month: monthKey, checkin_token: token },
    })

    results.push({ tenantId: tenant.id, sent: emailResult.success, skipped: false, error: emailResult.error })
  }

  return NextResponse.json({
    month:     monthKey,
    processed: results.length,
    sent:      results.filter((r) => r.sent).length,
    skipped:   results.filter((r) => r.skipped).length,
    results,
  })
}
