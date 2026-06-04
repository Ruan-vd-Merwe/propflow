import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  const { email, firstName, userType } = await request.json()

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: existing } = await supabase
    .from('newsletter_subscribers')
    .select('id, is_subscribed')
    .eq('email', email.toLowerCase().trim())
    .single()

  if (existing) {
    if (existing.is_subscribed) {
      return NextResponse.json({ success: true, message: 'Already subscribed' })
    }
    await supabase
      .from('newsletter_subscribers')
      .update({ is_subscribed: true, unsubscribed_at: null, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
    return NextResponse.json({ success: true, message: 'Resubscribed' })
  }

  const { error } = await supabase.from('newsletter_subscribers').insert({
    email:      email.toLowerCase().trim(),
    first_name: firstName ?? null,
    user_type:  userType ?? null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Welcome email (best-effort)
  if (process.env.RESEND_API_KEY) {
    try {
      await resend.emails.send({
        from:    'PropTrust <newsletter@proptrust.co.za>',
        to:      email,
        subject: 'Welcome to PropTrust property market updates',
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 16px;">
            <div style="background:#0f172a;border-radius:12px;padding:28px;margin-bottom:20px;">
              <p style="color:white;font-size:18px;font-weight:700;margin:0;">PropTrust Weekly Digest</p>
              <p style="color:#94a3b8;font-size:14px;margin:8px 0 0;">South African property market updates</p>
            </div>
            <p style="color:#374151;font-size:15px;">Hi${firstName ? ' ' + firstName : ''},</p>
            <p style="color:#374151;font-size:15px;line-height:1.7;">
              You are now subscribed to the PropTrust weekly property market digest.
              Every Monday you will receive a curated summary of rental trends, price movements,
              interest rate news and area developments across South Africa.
            </p>
            <p style="color:#374151;font-size:15px;line-height:1.7;">
              No spam. Unsubscribe anytime.
            </p>
            <p style="color:#94a3b8;font-size:13px;margin-top:24px;">PropTrust (Pty) Ltd · Cape Town, South Africa</p>
          </div>`,
      })
    } catch (e) {
      console.error('Welcome email failed:', e)
    }
  }

  return NextResponse.json({ success: true })
}
