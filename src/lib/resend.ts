import { Resend } from 'resend'
import type { CommunicationType } from './types'
import {
  paymentReminderEmail,
  paymentDueTodayEmail,
  paymentLate3dEmail,
  paymentLate7dEmail,
  paymentLate14dEmail,
  monthlyCheckinEmail,
  introductionToTenantEmail,
  introductionToLandlordEmail,
  formatAmountRand,
  formatDateLong,
  type PaymentEmailData,
  type CheckinEmailData,
  type IntroductionEmailData,
} from './email-templates'

/** Lazy-init Resend client — returns null if API key is not configured */
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null
  return new Resend(process.env.RESEND_API_KEY)
}

const FROM_ADDRESS =
  process.env.RESEND_FROM_EMAIL ?? 'PropTrust <notifications@proptrust.co.za>'

export interface SendResult {
  success: boolean
  resend_id: string | null
  error?: string
}

/** Map a notification type to its email builder */
function buildPaymentEmail(
  type: CommunicationType,
  data: PaymentEmailData
): { subject: string; html: string } {
  switch (type) {
    case 'payment_before_3d': return paymentReminderEmail(data)
    case 'payment_due_today': return paymentDueTodayEmail(data)
    case 'payment_late_3d':   return paymentLate3dEmail(data)
    case 'payment_late_7d':   return paymentLate7dEmail(data)
    case 'payment_late_14d':  return paymentLate14dEmail(data)
    default:
      return { subject: 'PropTrust notification', html: '<p>Notification</p>' }
  }
}

// ─── Payment notification ─────────────────────────────────────────────────────

export async function sendPaymentNotification(opts: {
  type: CommunicationType
  toEmail: string
  tenantName: string
  propertyName: string
  propertyAddress: string
  dueDateIso: string
  amountCents: number
  daysLate?: number
  landlordName: string
  landlordEmail: string
  landlordPhone?: string | null
}): Promise<SendResult> {
  const resend = getResend()

  const emailData: PaymentEmailData = {
    tenantName:       opts.tenantName,
    propertyName:     opts.propertyName,
    propertyAddress:  opts.propertyAddress,
    dueDate:          formatDateLong(opts.dueDateIso),
    amountRand:       formatAmountRand(opts.amountCents),
    daysLate:         opts.daysLate,
    landlordName:     opts.landlordName,
    landlordEmail:    opts.landlordEmail,
    landlordPhone:    opts.landlordPhone,
  }

  const { subject, html } = buildPaymentEmail(opts.type, emailData)

  if (!resend) {
    // Dev mode — log to console and return success so cron logic can be tested
    console.log(`[resend DEV] To: ${opts.toEmail} | Subject: ${subject}`)
    return { success: true, resend_id: `dev_${Date.now()}` }
  }

  try {
    const { data, error } = await resend.emails.send({
      from:    FROM_ADDRESS,
      to:      [opts.toEmail],
      subject,
      html,
    })

    if (error) return { success: false, resend_id: null, error: error.message }
    return { success: true, resend_id: data?.id ?? null }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, resend_id: null, error: msg }
  }
}

// ─── Introduction emails ──────────────────────────────────────────────────────

export async function sendIntroductionEmails(opts: {
  tenantEmail:     string
  tenantFullName:  string
  tenantDisplayName: string
  landlordEmail:   string
  landlordName:    string
  propertyName:    string
  propertySuburb:  string
  propertyProvince: string
  appUrl:          string
}): Promise<{ tenant: SendResult; landlord: SendResult }> {
  const resend = getResend()
  const data: IntroductionEmailData = {
    tenantDisplayName: opts.tenantDisplayName,
    tenantFullName:    opts.tenantFullName,
    landlordName:      opts.landlordName,
    propertyName:      opts.propertyName,
    propertySuburb:    opts.propertySuburb,
    propertyProvince:  opts.propertyProvince,
    appUrl:            opts.appUrl,
  }

  const tenantEmail   = introductionToTenantEmail(data)
  const landlordEmail = introductionToLandlordEmail(data)

  if (!resend) {
    console.log(`[resend DEV] Introduction → tenant: ${opts.tenantEmail}`)
    console.log(`[resend DEV] Introduction → landlord: ${opts.landlordEmail}`)
    return {
      tenant:   { success: true, resend_id: `dev_t_${Date.now()}` },
      landlord: { success: true, resend_id: `dev_l_${Date.now()}` },
    }
  }

  const [tRes, lRes] = await Promise.allSettled([
    resend.emails.send({ from: FROM_ADDRESS, to: [opts.tenantEmail],   subject: tenantEmail.subject,   html: tenantEmail.html }),
    resend.emails.send({ from: FROM_ADDRESS, to: [opts.landlordEmail], subject: landlordEmail.subject, html: landlordEmail.html }),
  ])

  const tResult: SendResult = tRes.status === 'fulfilled' && !tRes.value.error
    ? { success: true,  resend_id: tRes.value.data?.id ?? null }
    : { success: false, resend_id: null, error: tRes.status === 'rejected' ? String(tRes.reason) : tRes.value.error?.message }

  const lResult: SendResult = lRes.status === 'fulfilled' && !lRes.value.error
    ? { success: true,  resend_id: lRes.value.data?.id ?? null }
    : { success: false, resend_id: null, error: lRes.status === 'rejected' ? String(lRes.reason) : lRes.value.error?.message }

  return { tenant: tResult, landlord: lResult }
}

// ─── Monthly check-in notification ───────────────────────────────────────────

export async function sendCheckinNotification(opts: {
  toEmail: string
  tenantName: string
  propertyName: string
  checkinUrl: string
  month: string
  landlordName: string
}): Promise<SendResult> {
  const resend = getResend()

  const emailData: CheckinEmailData = {
    tenantName:   opts.tenantName,
    propertyName: opts.propertyName,
    checkinUrl:   opts.checkinUrl,
    month:        opts.month,
    landlordName: opts.landlordName,
  }

  const { subject, html } = monthlyCheckinEmail(emailData)

  if (!resend) {
    console.log(`[resend DEV] To: ${opts.toEmail} | Subject: ${subject}`)
    console.log(`[resend DEV] Check-in URL: ${opts.checkinUrl}`)
    return { success: true, resend_id: `dev_${Date.now()}` }
  }

  try {
    const { data, error } = await resend.emails.send({
      from:    FROM_ADDRESS,
      to:      [opts.toEmail],
      subject,
      html,
    })

    if (error) return { success: false, resend_id: null, error: error.message }
    return { success: true, resend_id: data?.id ?? null }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, resend_id: null, error: msg }
  }
}
