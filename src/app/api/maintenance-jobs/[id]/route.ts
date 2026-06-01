import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateJobDescription, summariseQuote } from '@/lib/anthropic'
import { sendPaymentNotification } from '@/lib/resend'
import { Resend } from 'resend'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('maintenance_jobs')
    .select(`
      *,
      properties!inner(name, address, owner_id,
        profiles!inner(full_name, email)
      ),
      property_components(name, component_type, installed_date, lifespan_max_years)
    `)
    .eq('id', params.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((data.properties as any).owner_id !== user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({ job: data })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { action, ...rest } = body

    // ── AI action: generate description ────────────────────────────────────
    if (action === 'generate_description') {
      const { data: job } = await supabase
        .from('maintenance_jobs')
        .select(`
          *, title, urgency,
          properties!inner(name, address, profiles!inner(full_name, email)),
          property_components(name, component_type, installed_date, lifespan_max_years)
        `)
        .eq('id', params.id)
        .single()

      if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prop     = (job.properties as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const landlord = prop.profiles as any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const comp     = job.property_components as any

      let ageYears: number | undefined
      if (comp?.installed_date) {
        const ms = Date.now() - new Date(comp.installed_date).getTime()
        ageYears = ms / (1000 * 60 * 60 * 24 * 365.25)
      }

      const description = await generateJobDescription({
        componentType:    comp?.component_type  ?? 'general maintenance',
        componentName:    comp?.name            ?? job.title,
        propertyName:     prop.name,
        propertyAddress:  prop.address,
        issueDescription: body.issue_description ?? job.title,
        urgency:          job.urgency,
        installedDate:    comp?.installed_date,
        ageYears,
        landlordName:     landlord.full_name,
        landlordEmail:    landlord.email,
      })

      await supabase
        .from('maintenance_jobs')
        .update({ generated_description: description, final_description: description })
        .eq('id', params.id)

      return NextResponse.json({ success: true, description })
    }

    // ── AI action: summarise quote ─────────────────────────────────────────
    if (action === 'summarise_quote') {
      const { quote_text } = body
      if (!quote_text?.trim()) {
        return NextResponse.json({ error: 'quote_text is required' }, { status: 400 })
      }

      const { data: job } = await supabase
        .from('maintenance_jobs')
        .select('title, properties!inner(name)')
        .eq('id', params.id)
        .single()
      if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const jobProp = job.properties as any
      const summary = await summariseQuote({
        quoteText:    quote_text,
        jobTitle:     job.title,
        propertyName: (jobProp as { name: string }).name,
      })

      await supabase
        .from('maintenance_jobs')
        .update({
          quote_text,
          quote_summary:     summary,
          quote_received_at: new Date().toISOString(),
          status:            'quote_received',
        })
        .eq('id', params.id)

      return NextResponse.json({ success: true, summary })
    }

    // ── Action: send email to contractor ───────────────────────────────────
    if (action === 'send_email') {
      const { contractor_name, contractor_email, final_description } = body

      if (!contractor_email || !final_description) {
        return NextResponse.json(
          { error: 'contractor_email and final_description are required' },
          { status: 400 }
        )
      }

      // Fetch job + property for context
      const { data: job } = await supabase
        .from('maintenance_jobs')
        .select('title, properties!inner(name, profiles!inner(full_name, email))')
        .eq('id', params.id)
        .single()
      if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prop     = (job.properties as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const landlord = prop.profiles as any

      let resendId: string | null = null

      if (process.env.RESEND_API_KEY) {
        const resend  = new Resend(process.env.RESEND_API_KEY)
        const from    = process.env.RESEND_FROM_EMAIL ?? 'PropTrust <notifications@proptrust.co.za>'
        const subject = `Maintenance Enquiry — ${job.title} — ${prop.name}`

        const html = /* html */`<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
<div style="background:#0f172a;padding:16px 24px;border-radius:8px 8px 0 0;">
  <span style="color:#fff;font-size:17px;font-weight:700;">PropTrust — Maintenance Enquiry</span>
</div>
<div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
  <p>Dear ${contractor_name ?? 'Contractor'},</p>
  <pre style="white-space:pre-wrap;font-family:inherit;font-size:14px;color:#334155;">${final_description}</pre>
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0"/>
  <p style="font-size:12px;color:#94a3b8;">
    Sent via PropTrust Property Management<br/>
    Reply directly to this email or contact ${landlord.full_name} at ${landlord.email}
  </p>
</div>
</body></html>`

        const { data: sent } = await resend.emails.send({
          from,
          to:      [contractor_email],
          replyTo: landlord.email,
          subject,
          html,
        })
        resendId = sent?.id ?? null
      } else {
        console.log(`[maintenance-jobs DEV] Email to ${contractor_email}: ${job.title}`)
        resendId = `dev_${Date.now()}`
      }

      await supabase
        .from('maintenance_jobs')
        .update({
          contractor_name:      contractor_name ?? null,
          contractor_email,
          final_description,
          status:               'sent',
        })
        .eq('id', params.id)

      return NextResponse.json({ success: true, resend_id: resendId })
    }

    // ── Generic field update ───────────────────────────────────────────────
    const { data, error } = await supabase
      .from('maintenance_jobs')
      .update(rest)
      .eq('id', params.id)
      .select('id, status')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, job: data })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error'
    console.error('[maintenance-jobs PATCH]', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// Unused import suppression
void sendPaymentNotification
