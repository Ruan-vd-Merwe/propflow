/**
 * POST /api/payment-warnings
 *
 * Dual-purpose endpoint:
 *  - Called by authenticated landlord via dashboard button → scoped to their tenants
 *  - Called by Vercel Cron (Authorization: Bearer <CRON_SECRET>) → all tenants system-wide
 *
 * For each unpaid payment in the ±14-day window it fires one of:
 *  -3 days  → payment_before_3d  (friendly reminder)
 *   0 days  → payment_due_today  (due today)
 *  +3 days  → payment_late_3d   (firm warning)
 *  +7 days  → payment_late_7d   (formal legal language)
 * +14 days  → payment_late_14d  (final notice / eviction mention)
 *
 * Idempotent: checks communications_log for (tenant_id, type, payment_id)
 * before sending — safe to call multiple times per day.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient }        from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendPaymentNotification } from '@/lib/resend'
import type { CommunicationType } from '@/lib/types'

export const runtime    = 'nodejs'
export const maxDuration = 60

// Days-from-due → notification type
const TRIGGER_DAYS: Record<number, CommunicationType> = {
  [-3]: 'payment_before_3d',
  [0]:  'payment_due_today',
  [3]:  'payment_late_3d',
  [7]:  'payment_late_7d',
  [14]: 'payment_late_14d',
}

export async function POST(req: NextRequest) {
  // ── 1. Auth ──────────────────────────────────────────────────────────────
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const cronToken = req.headers.get('authorization')?.replace('Bearer ', '')
  const isCron    = !!(process.env.CRON_SECRET && cronToken === process.env.CRON_SECRET)

  if (!user && !isCron) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()

  // ── 2. Resolve the set of tenant IDs in scope ─────────────────────────────
  let tenantIdFilter: string[] | null = null   // null = all tenants (cron mode)

  if (user) {
    // Dashboard mode: only this landlord's tenants
    const { data: props } = await supabase
      .from('properties')
      .select('id')
      .eq('owner_id', user.id)

    const propIds = (props ?? []).map((p: { id: string }) => p.id)
    if (propIds.length === 0) {
      return NextResponse.json({ sent: 0, skipped: 0, failed: 0, total: 0 })
    }

    const { data: tns } = await service
      .from('tenants')
      .select('id')
      .in('property_id', propIds)

    tenantIdFilter = (tns ?? []).map((t: { id: string }) => t.id)
    if (tenantIdFilter.length === 0) {
      return NextResponse.json({ sent: 0, skipped: 0, failed: 0, total: 0 })
    }
  }

  // ── 3. Date window [-3, +14] days around today ────────────────────────────
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const rangeStart = new Date(today)
  rangeStart.setDate(today.getDate() - 14)
  const rangeEnd = new Date(today)
  rangeEnd.setDate(today.getDate() + 3)

  // ── 4. Fetch unpaid payments in window ────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let paymentsQuery: any = service
    .from('payments')
    .select(`
      id, due_date, amount, status, tenant_id,
      tenants!inner (
        id, full_name, email, monthly_rent,
        properties!inner (
          name, address,
          profiles!inner ( id, full_name, email )
        )
      )
    `)
    .gte('due_date', rangeStart.toISOString().split('T')[0])
    .lte('due_date', rangeEnd.toISOString().split('T')[0])
    .neq('status', 'paid')

  if (tenantIdFilter !== null) {
    paymentsQuery = paymentsQuery.in('tenant_id', tenantIdFilter)
  }

  const { data: payments, error: paymentsError } = await paymentsQuery
  if (paymentsError) {
    console.error('[payment-warnings]', paymentsError)
    return NextResponse.json({ error: paymentsError.message }, { status: 500 })
  }

  // ── 5. Process each payment ───────────────────────────────────────────────
  let sent    = 0
  let skipped = 0
  let failed  = 0

  const results: Array<{
    paymentId: string
    tenantName: string
    type: string
    outcome: 'sent' | 'skipped' | 'failed'
    error?: string
  }> = []

  for (const payment of payments ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tenant   = payment.tenants   as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const property = tenant.properties as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const landlord = property.profiles as any

    // Calculate days from due
    const dueDate = new Date(payment.due_date)
    dueDate.setHours(0, 0, 0, 0)
    const daysFromDue = Math.round(
      (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
    )

    const notifType = TRIGGER_DAYS[daysFromDue]
    if (!notifType) {
      // Not a trigger day
      skipped++
      continue
    }

    // ── Dedup check: same (tenant, type, payment) ────────────────────────
    const { data: existing } = await service
      .from('communications_log')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('type', notifType)
      .contains('metadata', { payment_id: payment.id })
      .limit(1)

    if (existing?.length) {
      skipped++
      results.push({ paymentId: payment.id, tenantName: tenant.full_name, type: notifType, outcome: 'skipped' })
      continue
    }

    // ── Send email ────────────────────────────────────────────────────────
    const sendResult = await sendPaymentNotification({
      type:            notifType,
      toEmail:         tenant.email,
      tenantName:      tenant.full_name,
      propertyName:    property.name,
      propertyAddress: property.address,
      dueDateIso:      payment.due_date,
      amountCents:     payment.amount,
      daysLate:        daysFromDue > 0 ? daysFromDue : undefined,
      landlordName:    landlord.full_name,
      landlordEmail:   landlord.email,
    })

    // ── Log to communications_log ─────────────────────────────────────────
    await service.from('communications_log').insert({
      tenant_id: tenant.id,
      type:      notifType,
      subject:   null,
      to_email:  tenant.email,
      resend_id: sendResult.resend_id,
      status:    sendResult.success ? 'sent' : 'failed',
      metadata:  {
        payment_id:    payment.id,
        due_date:      payment.due_date,
        days_from_due: daysFromDue,
        triggered_by:  user ? 'dashboard' : 'cron',
      },
    })

    if (sendResult.success) {
      sent++
      results.push({ paymentId: payment.id, tenantName: tenant.full_name, type: notifType, outcome: 'sent' })
    } else {
      failed++
      results.push({ paymentId: payment.id, tenantName: tenant.full_name, type: notifType, outcome: 'failed', error: sendResult.error })
    }
  }

  return NextResponse.json({
    sent,
    skipped,
    failed,
    total: (payments ?? []).length,
    results,
    runAt: new Date().toISOString(),
  })
}
