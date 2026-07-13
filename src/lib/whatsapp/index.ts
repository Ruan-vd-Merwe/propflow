/**
 * PropTrust WhatsApp helper — Meta WhatsApp Cloud API (direct, no BSP).
 *
 * Migrated from a Twilio free-text sender. Meta only allows pre-approved
 * templates for business-initiated messages, so every builder below now
 * sends a template (see ./templates) through whichever provider
 * getWhatsAppProvider() selects (mock in dev/preview, real Meta once
 * WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_BUSINESS_ACCOUNT_ID / WHATSAPP_ACCESS_TOKEN
 * are all set).
 *
 * Every builder takes `optedIn` and never sends without both a phone number
 * and opt-in — see ./gate. Callers backed by the `tenants` table (which has
 * no whatsapp_opted_in column, unlike `profiles`/`tenant_profiles`) pass
 * `optedIn: true` with a comment explaining the gap; see the founder runbook
 * for why and what closes it.
 *
 * All sending is fire-and-forget from the caller's perspective; failures are
 * returned, never thrown.
 */
import { checkSendGate } from "./gate";
import { getWhatsAppProvider } from "./provider";
import { TEMPLATES } from "./templates";
import type { WhatsAppSendResult } from "./types";

export type { WhatsAppSendResult } from "./types";

/** Normalise a South-African phone number to E.164 digits (27XXXXXXXXX), no "+". */
export function normaliseSaPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");

  if (digits.startsWith("27") && digits.length === 11) return digits;
  if (digits.startsWith("0") && digits.length === 10) return "27" + digits.slice(1);
  if (digits.length === 9) return "27" + digits;
  return null;
}

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

/**
 * Low-level send — checks the opt-in/phone gate, normalises the phone, and
 * sends the named template through the currently selected provider. Never
 * throws. Logs (not throws) when the gate skips a send, per the hard
 * product rule: never send to someone who hasn't opted in.
 */
async function sendTemplate(
  phone: string | null | undefined,
  optedIn: boolean,
  templateKey: keyof typeof TEMPLATES,
  params: string[],
): Promise<WhatsAppSendResult> {
  const gate = checkSendGate({ phone, optedIn });
  if (!gate.allowed) {
    console.log(`[whatsapp] skipping ${templateKey} to ${phone ?? "(no phone)"}: ${gate.reason}`);
    return { ok: false, error: gate.reason };
  }

  const e164 = normaliseSaPhone(phone as string);
  if (!e164) {
    console.warn(`[whatsapp] skipping ${templateKey}: unrecognised phone format ${phone}`);
    return { ok: false, error: `Unrecognised phone: ${phone}` };
  }

  const template = TEMPLATES[templateKey];
  const provider = getWhatsAppProvider();
  const result = await provider.sendTemplate(e164, template.metaTemplateName, params);

  if (!result.ok) {
    console.error(`[whatsapp] ${templateKey} send failed to ${e164}: ${result.error}`);
  }

  return result;
}

/** Payment reminder (3 days before due) */
export function sendPaymentReminder(opts: {
  phone: string | null;
  optedIn: boolean;
  name: string;
  amount: number;
  property: string;
  dueDate: string;
}) {
  return sendTemplate(opts.phone, opts.optedIn, "RENT_REMINDER", [
    opts.name.split(" ")[0],
    fmtRand(opts.amount),
    opts.property,
    fmtDate(opts.dueDate),
  ]);
}

/** Rent due today */
export function sendPaymentDueToday(opts: {
  phone: string | null;
  optedIn: boolean;
  name: string;
  amount: number;
  property: string;
  dueDate: string;
}) {
  return sendTemplate(opts.phone, opts.optedIn, "RENT_DUE_TODAY", [
    opts.name.split(" ")[0],
    fmtRand(opts.amount),
    opts.property,
    fmtDate(opts.dueDate),
  ]);
}

/** Overdue warning */
export function sendPaymentOverdue(opts: {
  phone: string | null;
  optedIn: boolean;
  name: string;
  amount: number;
  property: string;
  daysLate: number;
}) {
  return sendTemplate(opts.phone, opts.optedIn, "RENT_OVERDUE", [
    opts.name.split(" ")[0],
    fmtRand(opts.amount),
    opts.property,
    `${opts.daysLate} day${opts.daysLate !== 1 ? "s" : ""}`,
  ]);
}

/** Lease update */
export function sendLeaseUpdate(opts: {
  phone: string | null;
  optedIn: boolean;
  name: string;
  property: string;
  update: string;
}) {
  return sendTemplate(opts.phone, opts.optedIn, "LEASE_UPDATE", [
    opts.name.split(" ")[0],
    opts.property,
    opts.update,
  ]);
}

/** Maintenance status update */
export function sendMaintenanceUpdate(opts: {
  phone: string | null;
  optedIn: boolean;
  name: string;
  subject: string;
  status: string;
}) {
  return sendTemplate(opts.phone, opts.optedIn, "MAINTENANCE_UPDATE", [
    opts.name.split(" ")[0],
    opts.subject,
    opts.status,
  ]);
}

/** Introduction request to tenant */
export function sendIntroductionWhatsApp(opts: {
  phone: string | null;
  optedIn: boolean;
  name: string;
  suburb: string;
}) {
  return sendTemplate(opts.phone, opts.optedIn, "INTRODUCTION", [
    opts.name.split(" ")[0],
    opts.suburb,
  ]);
}

/** "I paid" notification to landlord */
export function sendTenantPaidNotification(opts: {
  landlordPhone: string | null;
  optedIn: boolean;
  tenantName: string;
  amount: number;
  property: string;
}) {
  return sendTemplate(opts.landlordPhone, opts.optedIn, "TENANT_PAID_NOTIFICATION", [
    opts.tenantName,
    fmtRand(opts.amount),
    opts.property,
  ]);
}

/** Custom free-text message from landlord to tenant — sent as a single template param. */
export function sendCustomMessage(phone: string, optedIn: boolean, message: string) {
  return sendTemplate(phone, optedIn, "CUSTOM_MESSAGE", [message]);
}

/** Service booking confirmation to provider */
export function sendBookingToProvider(opts: {
  phone: string | null;
  optedIn: boolean;
  providerName: string;
  service: string;
  tenantName: string;
  property: string;
  date: string;
  notes?: string;
}) {
  return sendTemplate(opts.phone, opts.optedIn, "SERVICE_BOOKING", [
    opts.providerName,
    opts.service,
    opts.tenantName,
    opts.property,
    fmtDate(opts.date),
    opts.notes ?? "No additional notes",
  ]);
}
