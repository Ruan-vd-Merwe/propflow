/**
 * PropTrust WhatsApp helper — Twilio WhatsApp sandbox / API
 *
 * All sending is fire-and-forget; failures are logged, never thrown,
 * so a WhatsApp failure never breaks the calling request.
 *
 * SA numbers are normalised to E.164 (27XXXXXXXXX) before sending.
 */

export interface WaResult {
  success: boolean;
  sid: string | null;
  error?: string;
}

/** Normalise a South-African phone number to E.164 format (27XXXXXXXXX) */
function normaliseSaPhone(raw: string): string | null {
  // Strip everything except digits
  const digits = raw.replace(/\D/g, "");

  if (digits.startsWith("27") && digits.length === 11) return digits; // already 27XXXXXXXXX
  if (digits.startsWith("0") && digits.length === 10)
    return "27" + digits.slice(1); // 0XX → 27XX
  if (digits.length === 9) return "27" + digits; // XXXXXXXXX
  return null; // unrecognised format
}

/** Low-level send — returns WaResult, never throws */
export async function sendWhatsApp(
  to: string,
  message: string,
): Promise<WaResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM ?? "whatsapp:+14155238886";

  if (!sid || !token) {
    // Dev/preview — log instead of sending
    console.log(`[whatsapp DEV] To: ${to}\n${message}\n`);
    return { success: true, sid: `dev_${Date.now()}` };
  }

  const e164 = normaliseSaPhone(to);
  if (!e164) {
    console.warn(`[whatsapp] Skipping unrecognised phone number: ${to}`);
    return { success: false, sid: null, error: `Unrecognised phone: ${to}` };
  }

  const toWa = `whatsapp:+${e164}`;

  try {
    // Dynamic import so the server bundle isn't forced to load twilio everywhere
    const twilio = (await import("twilio")).default;
    const client = twilio(sid, token);
    const msg = await client.messages.create({ from, to: toWa, body: message });
    return { success: true, sid: msg.sid };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[whatsapp] Send failed to ${toWa}:`, msg);
    return { success: false, sid: null, error: msg };
  }
}

// ─── Typed message builders ───────────────────────────────────────────────────

function fmtRand(cents: number) {
  return `R${(cents / 100).toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Payment reminder (3 days before due) */
export function sendPaymentReminder(opts: {
  phone: string;
  name: string;
  amount: number;
  property: string;
  dueDate: string;
}) {
  return sendWhatsApp(
    opts.phone,
    `Hi ${opts.name.split(" ")[0]}, just a reminder that your rent of *${fmtRand(opts.amount)}* for *${opts.property}* is due on *${fmtDate(opts.dueDate)}*. Reply PAID if you've already paid. — PropTrust`,
  );
}

/** Rent due today */
export function sendPaymentDueToday(opts: {
  phone: string;
  name: string;
  amount: number;
  property: string;
  dueDate: string;
}) {
  return sendWhatsApp(
    opts.phone,
    `Hi ${opts.name.split(" ")[0]}, your rent of *${fmtRand(opts.amount)}* for *${opts.property}* is due *today* (${fmtDate(opts.dueDate)}). Please pay as soon as possible. Reply PAID once done. — PropTrust`,
  );
}

/** Overdue warning */
export function sendPaymentOverdue(opts: {
  phone: string;
  name: string;
  amount: number;
  property: string;
  daysLate: number;
}) {
  return sendWhatsApp(
    opts.phone,
    `Hi ${opts.name.split(" ")[0]}, your rent of *${fmtRand(opts.amount)}* for *${opts.property}* is now *${opts.daysLate} day${opts.daysLate !== 1 ? "s" : ""} overdue*. Please pay urgently to avoid further action. — PropTrust`,
  );
}

/** Maintenance status update */
export function sendMaintenanceUpdate(opts: {
  phone: string;
  name: string;
  subject: string;
  status: string;
}) {
  return sendWhatsApp(
    opts.phone,
    `Hi ${opts.name.split(" ")[0]}, your maintenance request *"${opts.subject}"* has been updated to: *${opts.status}*. — PropTrust`,
  );
}

/** Introduction request to tenant */
export function sendIntroductionWhatsApp(opts: {
  phone: string;
  name: string;
  suburb: string;
}) {
  return sendWhatsApp(
    opts.phone,
    `Hi ${opts.name.split(" ")[0]}, a landlord is interested in your PropTrust profile for a property in *${opts.suburb}*. Log in at *proptrust.co.za* to respond. — PropTrust`,
  );
}

/** "I paid" notification to landlord */
export function sendTenantPaidNotification(opts: {
  landlordPhone: string;
  tenantName: string;
  amount: number;
  property: string;
}) {
  return sendWhatsApp(
    opts.landlordPhone,
    `*${opts.tenantName}* says they have paid rent of *${fmtRand(opts.amount)}* for *${opts.property}*. Please verify and mark as paid in PropTrust.`,
  );
}

/** Custom message from landlord to tenant */
export function sendCustomMessage(phone: string, message: string) {
  return sendWhatsApp(phone, message);
}

/** Service booking confirmation to provider */
export function sendBookingToProvider(opts: {
  phone: string;
  providerName: string;
  service: string;
  tenantName: string;
  property: string;
  date: string;
  notes?: string;
}) {
  const notesPart = opts.notes ? `\nNotes: ${opts.notes}` : "";
  return sendWhatsApp(
    opts.phone,
    `Hi ${opts.providerName}, you have a new booking request via *PropTrust*:\n\n*Service:* ${opts.service}\n*Tenant:* ${opts.tenantName}\n*Property:* ${opts.property}\n*Date:* ${fmtDate(opts.date)}${notesPart}\n\nReply to confirm. — PropTrust`,
  );
}
