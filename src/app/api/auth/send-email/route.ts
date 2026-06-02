import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const FROM = 'PropTrust <onboarding@resend.dev>'

export async function POST(request: Request) {
  const rawBody = await request.text()

  console.log('[send-email hook] raw body:', rawBody.slice(0, 500))

  let payload: { user: { email: string }; email_data: Record<string, string> }
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  console.log('[send-email hook] user.email:', payload?.user?.email)
  console.log('[send-email hook] action type:', payload?.email_data?.email_action_type)

  const { user, email_data } = payload
  const { token_hash, redirect_to, email_action_type } = email_data

  const verifyUrl =
    `${SUPABASE_URL}/auth/v1/verify?token=${token_hash}&type=${email_action_type}` +
    `&redirect_to=${encodeURIComponent(redirect_to)}`

  const btnStyle =
    'background:#0f172a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;font-family:sans-serif;font-size:14px;font-weight:600'

  let subject: string
  let html: string

  switch (email_action_type) {
    case 'signup':
      subject = 'Confirm your PropTrust account'
      html = `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 16px">
          <h2 style="color:#0f172a">Confirm your email address</h2>
          <p style="color:#475569">Click the link below to confirm your email and activate your PropTrust account.</p>
          <p><a href="${verifyUrl}" style="${btnStyle}">Confirm email address</a></p>
          <p style="color:#94a3b8;font-size:13px">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
        </div>`
      break
    case 'recovery':
      subject = 'Reset your PropTrust password'
      html = `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 16px">
          <h2 style="color:#0f172a">Reset your password</h2>
          <p style="color:#475569">Click the link below to choose a new password for your PropTrust account.</p>
          <p><a href="${verifyUrl}" style="${btnStyle}">Reset password</a></p>
          <p style="color:#94a3b8;font-size:13px">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
        </div>`
      break
    case 'email_change':
      subject = 'Confirm your new PropTrust email address'
      html = `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 16px">
          <h2 style="color:#0f172a">Confirm your new email address</h2>
          <p style="color:#475569">Click the link below to confirm your new email address.</p>
          <p><a href="${verifyUrl}" style="${btnStyle}">Confirm new email</a></p>
          <p style="color:#94a3b8;font-size:13px">If you didn't request this change, you can safely ignore this email.</p>
        </div>`
      break
    default:
      subject = 'PropTrust — action required'
      html = `<p><a href="${verifyUrl}">Click here</a> to continue.</p>`
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to: [user.email],
    subject,
    html,
  })

  if (error) {
    console.error('[send-email hook] Resend error name:', error.name)
    console.error('[send-email hook] Resend error message:', error.message)
    console.error('[send-email hook] to:', user.email, 'type:', email_action_type)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({})
}
