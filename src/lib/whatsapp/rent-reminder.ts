import type { SupabaseClient } from "@supabase/supabase-js";
import { checkSendGate } from "./gate";
import { getWhatsAppProvider } from "./provider";
import { normaliseSaPhone } from "./index";
import { TEMPLATES } from "./templates";

export type SendRentReminderResult =
  | { status: "sent"; providerMessageId: string }
  | { status: "skipped"; reason: string }
  | { status: "error"; error: string };

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

type ObligationForReminder = {
  id: string;
  amount_due_cents: number;
  due_date: string;
  tenants: {
    full_name: string;
    phone: string | null;
    properties: { name: string };
  };
};

/**
 * Loads a rent obligation + its tenant/property, checks the send gate, and
 * sends RENT_REMINDER via whichever WhatsApp provider is currently selected
 * (mock in dev/preview, real Meta once configured).
 *
 * rent_obligations.tenant_id references the `tenants` table (landlord-entered
 * records, no auth account), not `profiles`/`tenant_profiles` — that table
 * has no whatsapp_opted_in column. Per product decision, tenants-table
 * recipients are treated as opted-in by default (the landlord entered them
 * directly; there is no self-service consent flow for this table today) and
 * gated on phone presence only. See the founder runbook for the follow-up
 * needed to give tenants explicit consent control.
 */
export async function sendRentReminder(
  supabase: SupabaseClient,
  obligationId: string,
): Promise<SendRentReminderResult> {
  const { data, error } = await supabase
    .from("rent_obligations")
    .select(
      `
      id, amount_due_cents, due_date,
      tenants!inner ( full_name, phone,
        properties!inner ( name )
      )
    `,
    )
    .eq("id", obligationId)
    .single();

  if (error || !data) {
    const message = error?.message ?? "Obligation not found";
    console.error(`[sendRentReminder] failed to load obligation ${obligationId}: ${message}`);
    return { status: "error", error: message };
  }

  const obligation = data as unknown as ObligationForReminder;
  const tenant = obligation.tenants;

  const gate = checkSendGate({ phone: tenant.phone, optedIn: true });
  if (!gate.allowed) {
    console.log(`[sendRentReminder] skipping obligation ${obligationId}: ${gate.reason}`);
    return { status: "skipped", reason: gate.reason };
  }

  const e164 = normaliseSaPhone(tenant.phone as string);
  if (!e164) {
    const reason = `unrecognised phone format: ${tenant.phone}`;
    console.warn(`[sendRentReminder] skipping obligation ${obligationId}: ${reason}`);
    return { status: "skipped", reason };
  }

  const template = TEMPLATES.RENT_REMINDER;
  const provider = getWhatsAppProvider();
  const result = await provider.sendTemplate(e164, template.metaTemplateName, [
    tenant.full_name.split(" ")[0],
    fmtRand(obligation.amount_due_cents),
    tenant.properties.name,
    fmtDate(obligation.due_date),
  ]);

  if (!result.ok) {
    console.error(`[sendRentReminder] send failed for obligation ${obligationId}: ${result.error}`);
    return { status: "error", error: result.error };
  }

  return { status: "sent", providerMessageId: result.providerMessageId };
}
