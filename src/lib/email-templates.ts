/** Shared data for all payment notification emails */
export interface PaymentEmailData {
  tenantName: string
  propertyName: string
  propertyAddress: string
  dueDate: string         // human-readable e.g. "1 June 2025"
  amountRand: string      // formatted e.g. "R 15 000"
  daysLate?: number
  landlordName: string
  landlordEmail: string
  landlordPhone?: string | null
}

export interface CheckinEmailData {
  tenantName: string
  propertyName: string
  checkinUrl: string      // full URL to /checkin/[token]
  month: string           // e.g. "June 2025"
  landlordName: string
}

// ─── Shared HTML primitives ───────────────────────────────────────────────────

function baseLayout(accentColor: string, content: string, footerNote = ''): string {
  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>PropTrust</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#f8fafc;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.06);">

        <!-- Header -->
        <tr>
          <td style="background:#0f172a;padding:20px 28px;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:28px;height:28px;background:${accentColor};border-radius:6px;text-align:center;vertical-align:middle;">
                  <span style="color:#ffffff;font-size:15px;line-height:28px;display:block;">🏠</span>
                </td>
                <td style="padding-left:10px;vertical-align:middle;">
                  <span style="color:#ffffff;font-size:17px;font-weight:700;letter-spacing:-0.3px;">PropTrust</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Accent bar -->
        <tr><td style="height:4px;background:${accentColor};"></td></tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px 28px 24px;">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="border-top:1px solid #e2e8f0;background:#f8fafc;padding:16px 28px;">
            <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5;">
              PropTrust Property Management · Automated notification<br />
              ${footerNote ? footerNote + '<br />' : ''}
              Please do not reply to this email. Contact your landlord directly.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function pill(text: string, bg: string, color: string): string {
  return `<span style="display:inline-block;padding:4px 12px;border-radius:20px;background:${bg};color:${color};font-size:12px;font-weight:600;letter-spacing:0.3px;">${text}</span>`
}

function amountBox(label: string, amount: string, bg: string, color: string): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:20px 0;border-radius:8px;background:${bg};border:1px solid ${color}30;overflow:hidden;">
    <tr>
      <td style="padding:16px 20px;">
        <p style="margin:0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:${color};">${label}</p>
        <p style="margin:4px 0 0;font-size:28px;font-weight:800;color:#0f172a;">${amount}</p>
      </td>
    </tr>
  </table>`
}

function detailRow(label: string, value: string): string {
  return `
  <tr>
    <td style="padding:6px 0;font-size:13px;color:#64748b;width:40%;">${label}</td>
    <td style="padding:6px 0;font-size:13px;color:#0f172a;font-weight:500;">${value}</td>
  </tr>`
}

// ─── 1. Friendly Reminder (3 days before due) ─────────────────────────────────

export function paymentReminderEmail(d: PaymentEmailData): { subject: string; html: string } {
  const subject = `Rent reminder: ${d.amountRand} due on ${d.dueDate}`

  const content = /* html */ `
    <p style="margin:0 0 4px;font-size:13px;color:#64748b;">Hi ${d.tenantName},</p>
    <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#0f172a;line-height:1.3;">
      Your rent is due in 3 days
    </h1>
    <p style="margin:12px 0 0;font-size:15px;color:#475569;line-height:1.6;">
      Just a friendly reminder that your monthly rent payment is coming up shortly.
    </p>

    ${amountBox('Amount due', d.amountRand, '#f0fdf4', '#16a34a')}

    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-radius:8px;background:#f8fafc;border:1px solid #e2e8f0;">
      <tr><td style="padding:16px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
          ${detailRow('Due date', d.dueDate)}
          ${detailRow('Property', d.propertyName)}
          ${detailRow('Address', d.propertyAddress)}
        </table>
      </td></tr>
    </table>

    <p style="margin:20px 0 0;font-size:14px;color:#475569;line-height:1.6;">
      Please ensure your payment reaches your landlord on or before the due date to avoid any late fees.
      If you anticipate any issues, please contact <strong>${d.landlordName}</strong> as soon as possible.
    </p>

    <p style="margin:16px 0 0;font-size:13px;color:#94a3b8;">
      Landlord contact: <a href="mailto:${d.landlordEmail}" style="color:#3b82f6;">${d.landlordEmail}</a>
      ${d.landlordPhone ? ` · ${d.landlordPhone}` : ''}
    </p>
  `

  return { subject, html: baseLayout('#16a34a', content) }
}

// ─── 2. Payment Due Today ─────────────────────────────────────────────────────

export function paymentDueTodayEmail(d: PaymentEmailData): { subject: string; html: string } {
  const subject = `Your rent is due today — ${d.amountRand}`

  const content = /* html */ `
    <p style="margin:0 0 4px;font-size:13px;color:#64748b;">Hi ${d.tenantName},</p>
    <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#0f172a;line-height:1.3;">
      Your rent payment is due today
    </h1>
    <p style="margin:12px 0 0;font-size:15px;color:#475569;line-height:1.6;">
      This is a reminder that your rent payment is due today. Please arrange payment as soon as possible.
    </p>

    ${amountBox('Due today', d.amountRand, '#fffbeb', '#d97706')}

    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-radius:8px;background:#f8fafc;border:1px solid #e2e8f0;">
      <tr><td style="padding:16px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
          ${detailRow('Due date', d.dueDate)}
          ${detailRow('Property', d.propertyName)}
        </table>
      </td></tr>
    </table>

    <p style="margin:20px 0 0;font-size:14px;color:#475569;line-height:1.6;">
      If you have already made payment, please disregard this message. If you are experiencing difficulties,
      please contact your landlord <strong>${d.landlordName}</strong> immediately to make alternative arrangements.
    </p>

    <p style="margin:16px 0 0;font-size:13px;color:#94a3b8;">
      Contact: <a href="mailto:${d.landlordEmail}" style="color:#3b82f6;">${d.landlordEmail}</a>
      ${d.landlordPhone ? ` · ${d.landlordPhone}` : ''}
    </p>
  `

  return { subject, html: baseLayout('#d97706', content) }
}

// ─── 3. First Warning — 3 days overdue ────────────────────────────────────────

export function paymentLate3dEmail(d: PaymentEmailData): { subject: string; html: string } {
  const subject = `⚠ Overdue rent: ${d.amountRand} — 3 days late`

  const content = /* html */ `
    ${pill('OVERDUE — 3 DAYS', '#fef3c7', '#92400e')}
    <p style="margin:4px 0 4px;font-size:13px;color:#64748b;">Hi ${d.tenantName},</p>
    <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#0f172a;line-height:1.3;">
      Your rent payment is 3 days overdue
    </h1>
    <p style="margin:12px 0 0;font-size:15px;color:#475569;line-height:1.6;">
      We have not yet received your rent payment for ${d.propertyName}. Your account is now 3 days overdue.
    </p>

    ${amountBox('Outstanding amount', d.amountRand, '#fff7ed', '#c2410c')}

    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-radius:8px;background:#f8fafc;border:1px solid #e2e8f0;">
      <tr><td style="padding:16px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
          ${detailRow('Was due', d.dueDate)}
          ${detailRow('Days overdue', '3 days')}
          ${detailRow('Property', d.propertyName)}
        </table>
      </td></tr>
    </table>

    <p style="margin:20px 0 0;font-size:14px;color:#475569;line-height:1.6;">
      Please make payment immediately to avoid further action. If you are experiencing financial
      difficulties, please contact <strong>${d.landlordName}</strong> urgently to discuss a repayment arrangement.
    </p>

    <p style="margin:16px 0 0;font-size:14px;color:#b45309;font-weight:500;">
      Continued non-payment may result in a formal written notice in terms of your lease agreement.
    </p>

    <p style="margin:16px 0 0;font-size:13px;color:#94a3b8;">
      Contact: <a href="mailto:${d.landlordEmail}" style="color:#3b82f6;">${d.landlordEmail}</a>
      ${d.landlordPhone ? ` · ${d.landlordPhone}` : ''}
    </p>
  `

  return { subject, html: baseLayout('#f59e0b', content) }
}

// ─── 4. Formal Warning — 7 days overdue ──────────────────────────────────────

export function paymentLate7dEmail(d: PaymentEmailData): { subject: string; html: string } {
  const subject = `FORMAL WARNING — Rent overdue 7 days: ${d.amountRand}`

  const content = /* html */ `
    ${pill('FORMAL WARNING — 7 DAYS', '#fee2e2', '#991b1b')}
    <p style="margin:4px 0 4px;font-size:13px;color:#64748b;">Dear ${d.tenantName},</p>
    <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#0f172a;line-height:1.3;">
      Formal Warning: Rent 7 Days Overdue
    </h1>
    <p style="margin:12px 0 0;font-size:15px;color:#475569;line-height:1.6;">
      This constitutes a formal written warning. Despite previous reminders, your rent payment
      for the above property remains outstanding.
    </p>

    ${amountBox('Amount overdue', d.amountRand, '#fef2f2', '#dc2626')}

    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-radius:8px;background:#f8fafc;border:1px solid #e2e8f0;">
      <tr><td style="padding:16px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
          ${detailRow('Original due date', d.dueDate)}
          ${detailRow('Days overdue', '7 days')}
          ${detailRow('Property', d.propertyName)}
          ${detailRow('Address', d.propertyAddress)}
        </table>
      </td></tr>
    </table>

    <div style="margin:20px 0;padding:16px 20px;background:#fef2f2;border-radius:8px;border-left:4px solid #dc2626;">
      <p style="margin:0;font-size:14px;color:#7f1d1d;line-height:1.6;">
        <strong>Demand for payment:</strong> In terms of your lease agreement, you are required to
        settle all outstanding rent within <strong>48 hours</strong> of receiving this notice.
        Failure to do so may result in further legal action being taken against you in terms of
        the <em>Rental Housing Act 50 of 1999</em>.
      </p>
    </div>

    <p style="margin:16px 0 0;font-size:14px;color:#475569;line-height:1.6;">
      Please contact your landlord <strong>${d.landlordName}</strong> immediately to resolve this matter
      or arrange a payment plan. We strongly urge you to act without further delay.
    </p>

    <p style="margin:16px 0 0;font-size:13px;color:#94a3b8;">
      Contact: <a href="mailto:${d.landlordEmail}" style="color:#3b82f6;">${d.landlordEmail}</a>
      ${d.landlordPhone ? ` · ${d.landlordPhone}` : ''}
    </p>
  `

  return { subject, html: baseLayout('#dc2626', content) }
}

// ─── 5. Final Notice — 14 days overdue ───────────────────────────────────────

export function paymentLate14dEmail(d: PaymentEmailData): { subject: string; html: string } {
  const subject = `FINAL NOTICE — Eviction process may commence — ${d.amountRand} overdue`

  const content = /* html */ `
    ${pill('FINAL NOTICE — 14 DAYS', '#450a0a', '#fca5a5')}
    <p style="margin:4px 0 4px;font-size:13px;color:#64748b;">Dear ${d.tenantName},</p>
    <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#0f172a;line-height:1.3;">
      FINAL NOTICE: Rent 14 Days Overdue
    </h1>
    <p style="margin:12px 0 0;font-size:15px;color:#475569;line-height:1.6;">
      Despite repeated notices, your rent for <strong>${d.propertyName}</strong> remains
      unpaid. This is your final notice before formal legal proceedings are initiated.
    </p>

    ${amountBox('Total amount overdue', d.amountRand, '#fef2f2', '#991b1b')}

    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-radius:8px;background:#f8fafc;border:1px solid #e2e8f0;">
      <tr><td style="padding:16px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
          ${detailRow('Original due date', d.dueDate)}
          ${detailRow('Days overdue', '14 days')}
          ${detailRow('Property', d.propertyName)}
          ${detailRow('Address', d.propertyAddress)}
        </table>
      </td></tr>
    </table>

    <div style="margin:20px 0;padding:16px 20px;background:#450a0a;border-radius:8px;">
      <p style="margin:0;font-size:14px;color:#fca5a5;line-height:1.6;font-weight:500;">
        NOTICE IN TERMS OF SECTION 4 OF THE PREVENTION OF ILLEGAL EVICTION FROM AND
        UNLAWFUL OCCUPATION OF LAND ACT 19 OF 1998 (PIE ACT):
      </p>
      <p style="margin:8px 0 0;font-size:13px;color:#fecaca;line-height:1.6;">
        Your landlord intends to apply to the Magistrate's Court / High Court for an order
        of eviction if this outstanding amount is not settled or a written payment arrangement
        agreed within <strong style="color:#ffffff;">72 hours</strong> of this notice.
        Eviction proceedings, if granted, will be served in accordance with the Rental Housing Act 50 of 1999.
      </p>
    </div>

    <p style="margin:16px 0 0;font-size:14px;color:#475569;line-height:1.6;">
      To avoid eviction proceedings, you must contact <strong>${d.landlordName}</strong>
      immediately. A written payment plan may be accepted at the landlord's sole discretion.
    </p>

    <p style="margin:16px 0 0;font-size:13px;font-weight:600;color:#dc2626;">
      This notice constitutes the formal written notice required under South African tenancy law.
      Keep a copy for your records.
    </p>

    <p style="margin:16px 0 0;font-size:13px;color:#94a3b8;">
      Urgent contact: <a href="mailto:${d.landlordEmail}" style="color:#3b82f6;">${d.landlordEmail}</a>
      ${d.landlordPhone ? ` · ${d.landlordPhone}` : ''}
    </p>
  `

  return {
    subject,
    html: baseLayout('#991b1b', content, 'This is a legal notice. Please retain for your records.'),
  }
}

// ─── 6. Monthly Check-in ─────────────────────────────────────────────────────

export function monthlyCheckinEmail(d: CheckinEmailData): { subject: string; html: string } {
  const subject = `Quick check-in from ${d.landlordName} — ${d.month}`

  const content = /* html */ `
    <p style="margin:0 0 4px;font-size:13px;color:#64748b;">Hi ${d.tenantName},</p>
    <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#0f172a;line-height:1.3;">
      Monthly Check-in — ${d.month}
    </h1>
    <p style="margin:12px 0 0;font-size:15px;color:#475569;line-height:1.6;">
      Your landlord <strong>${d.landlordName}</strong> would like to check in on how things are going
      at <strong>${d.propertyName}</strong>. It only takes 30 seconds!
    </p>

    <div style="margin:24px 0;padding:20px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">
      <p style="margin:0;font-size:14px;color:#475569;font-weight:600;">This month we're asking:</p>
      <ul style="margin:12px 0 0;padding-left:20px;font-size:14px;color:#475569;line-height:2;">
        <li>Is everything in your unit working correctly?</li>
        <li>Do you have any maintenance requests?</li>
        <li>Is there anything else you'd like to flag?</li>
      </ul>
    </div>

    <a href="${d.checkinUrl}" style="display:inline-block;margin:8px 0;padding:14px 28px;background:#0f172a;color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:-0.2px;">
      Complete Check-in →
    </a>

    <p style="margin:20px 0 0;font-size:13px;color:#94a3b8;line-height:1.5;">
      This link is unique to you and expires at month end.
      If you have an urgent issue, please contact your landlord directly.
    </p>
  `

  return { subject, html: baseLayout('#3b82f6', content) }
}

// ─── Introduction emails ──────────────────────────────────────────────────────

export interface IntroductionEmailData {
  tenantDisplayName: string   // "Sarah D." (privacy)
  tenantFullName:    string   // only revealed to tenant themselves
  landlordName:      string
  propertyName:      string
  propertySuburb:    string
  propertyProvince:  string
  appUrl:            string
}

export function introductionToTenantEmail(d: IntroductionEmailData): { subject: string; html: string } {
  const subject = `A landlord is interested in your profile on PropTrust`
  const content = `
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#0f172a;">
      You have a new introduction request 🎉
    </h2>
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.6;">
      Hi ${d.tenantDisplayName},
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6;">
      A landlord on PropTrust is interested in your profile for a property in
      <strong>${d.propertySuburb}, ${d.propertyProvince}</strong>.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0"
      style="width:100%;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;margin:0 0 24px;">
      <tr><td style="padding:16px 20px;">
        <p style="margin:0;font-size:13px;font-weight:600;color:#16a34a;text-transform:uppercase;letter-spacing:0.5px;">Property</p>
        <p style="margin:4px 0 0;font-size:15px;color:#0f172a;font-weight:600;">${d.propertyName}</p>
        <p style="margin:2px 0 0;font-size:13px;color:#64748b;">${d.propertySuburb}, ${d.propertyProvince}</p>
      </td></tr>
    </table>
    <p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.6;">
      Log in to PropTrust to view the introduction request and decide whether to accept or decline.
      Your contact details are kept private until you choose to accept.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
      <tr><td style="background:#0f172a;border-radius:8px;padding:12px 28px;">
        <a href="${d.appUrl}/tenant/profile"
          style="color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">
          View Introduction Request →
        </a>
      </td></tr>
    </table>
    <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.5;">
      If you are not looking for a property right now, you can hide your profile by toggling
      "Actively looking" off in your PropTrust profile.
    </p>
  `
  return { subject, html: baseLayout('#10b981', content) }
}

export function introductionToLandlordEmail(d: IntroductionEmailData): { subject: string; html: string } {
  const subject = `Introduction request sent — ${d.propertyName}`
  const content = `
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#0f172a;">
      Introduction request sent ✓
    </h2>
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.6;">
      Hi ${d.landlordName},
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6;">
      Your introduction request has been sent to the tenant for
      <strong>${d.propertyName}</strong>. We will notify you as soon as they respond.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0"
      style="width:100%;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;margin:0 0 24px;">
      <tr><td style="padding:16px 20px;">
        <p style="margin:0;font-size:13px;font-weight:600;color:#2563eb;text-transform:uppercase;letter-spacing:0.5px;">What happens next</p>
        <ul style="margin:8px 0 0;padding-left:18px;font-size:14px;color:#334155;line-height:1.8;">
          <li>The tenant will be notified by email</li>
          <li>They can accept or decline the introduction</li>
          <li>If they accept, their full contact details will be shared with you</li>
          <li>You can view all your introduction requests on the property page</li>
        </ul>
      </td></tr>
    </table>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
      <tr><td style="background:#0f172a;border-radius:8px;padding:12px 28px;">
        <a href="${d.appUrl}/properties"
          style="color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">
          View My Properties →
        </a>
      </td></tr>
    </table>
  `
  return { subject, html: baseLayout('#3b82f6', content) }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatAmountRand(cents: number): string {
  return `R ${(cents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 0 })}`
}

export function formatDateLong(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-ZA', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}
