import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ObligationStatus,
  PaymentAttempt,
  PaymentAttemptInitiator,
  PaymentAttemptStatus,
  Profile,
  RentObligation,
} from "@/lib/types";
import type {
  PaymentProvider,
  ProviderEventType,
  ProviderWebhookEvent,
  SplitConfig,
} from "./payment-providers/types";

// ─── Pure decision logic (unit-testable, no DB) ──────────────────────────────

/** An obligation can be paid unless it's already fully settled or waived. */
export function isObligationPayable(status: ObligationStatus): boolean {
  return status !== "paid" && status !== "waived";
}

export function isOwnedByTenant(
  obligation: Pick<RentObligation, "tenant_id">,
  tenantId: string,
): boolean {
  return obligation.tenant_id === tenantId;
}

export function isOwnedByLandlord(
  obligation: Pick<RentObligation, "landlord_id">,
  landlordId: string,
): boolean {
  return obligation.landlord_id === landlordId;
}

/**
 * If an obligation already has a payment attempt in flight, reuse its
 * checkout instead of spawning a duplicate — the tenant re-clicking "Pay
 * rent" should not create two concurrent charges.
 */
export function pickReusableAttempt(
  attempts: PaymentAttempt[],
): PaymentAttempt | null {
  return (
    attempts.find((a) => a.status === "pending" || a.status === "processing") ??
    null
  );
}

export function attemptStatusForEvent(type: ProviderEventType): PaymentAttemptStatus {
  return type === "succeeded" ? "succeeded" : type;
}

export type ObligationUpdateAfterEvent = {
  amount_paid_cents: number;
  status: ObligationStatus;
  paid_at: string | null;
};

/**
 * Given a terminal provider event for one attempt, decides the obligation's
 * new amount_paid_cents/status/paid_at. A failed or cancelled attempt never
 * regresses an obligation that already collected a prior partial payment —
 * it stays 'partial' and remains payable for the remaining balance.
 */
export function resolveObligationAfterPaymentEvent(
  obligation: Pick<RentObligation, "amount_due_cents" | "amount_paid_cents" | "paid_at">,
  event: { type: ProviderEventType; amountCents: number },
  now: Date = new Date(),
): ObligationUpdateAfterEvent {
  if (event.type === "succeeded") {
    const amountPaid = obligation.amount_paid_cents + event.amountCents;
    const status: ObligationStatus =
      amountPaid >= obligation.amount_due_cents ? "paid" : "partial";
    return {
      amount_paid_cents: amountPaid,
      status,
      paid_at: status === "paid" ? now.toISOString() : obligation.paid_at,
    };
  }

  // failed or cancelled: this attempt collected nothing.
  if (obligation.amount_paid_cents > 0) {
    return {
      amount_paid_cents: obligation.amount_paid_cents,
      status: "partial",
      paid_at: obligation.paid_at,
    };
  }

  return {
    amount_paid_cents: obligation.amount_paid_cents,
    status: event.type === "failed" ? "failed" : "pending",
    paid_at: null,
  };
}

/**
 * Builds the split-recipient config for a checkout from the landlord's
 * payout fields, or returns undefined if the landlord hasn't configured one
 * yet. Groundwork only: no real provider reads this today (the mock
 * provider ignores `split` entirely), but this is the seam a real
 * PaymentProvider will consume once Payfast vendor registration details are
 * confirmed (see SplitConfig's TODO in payment-providers/types.ts).
 *
 * A landlord with no payout destination is an expected, current-phase
 * state, not an error — this never throws — but it's logged so the gap is
 * visible instead of silently proceeding as if nothing were missing.
 */
export function buildSplitConfig(
  landlord: Pick<Profile, "id" | "payout_provider" | "payout_provider_ref">,
): SplitConfig | undefined {
  if (!landlord.payout_provider_ref) {
    console.warn(
      `[buildSplitConfig] landlord ${landlord.id} has no payout_provider_ref configured — proceeding without a split recipient`,
    );
    return undefined;
  }

  return { recipientRef: landlord.payout_provider_ref };
}

// ─── DB-touching orchestration ────────────────────────────────────────────────

export type CreateCheckoutResult = {
  attempt: PaymentAttempt;
  checkoutUrl: string;
};

/**
 * Creates a provider checkout session and records the payment_attempt row.
 * splitConfig is optional and pre-resolved by the caller (e.g. via
 * buildSplitConfig against the landlord's profile) rather than fetched
 * here, so this function's obligation-shaped input stays unchanged for
 * callers that don't need split payments yet — including the mock
 * provider, which ignores `split` completely.
 */
export async function createCheckoutForObligation(
  supabase: SupabaseClient,
  provider: PaymentProvider,
  obligation: Pick<RentObligation, "id" | "amount_due_cents" | "amount_paid_cents">,
  initiatedBy: PaymentAttemptInitiator,
  splitConfig?: SplitConfig,
): Promise<CreateCheckoutResult> {
  const outstanding = obligation.amount_due_cents - obligation.amount_paid_cents;
  const currency = "ZAR";

  const session = await provider.createCheckoutSession({
    obligationId: obligation.id,
    amountCents: outstanding,
    currency,
    split: splitConfig,
  });

  const { data, error } = await supabase
    .from("payment_attempts")
    .insert({
      obligation_id: obligation.id,
      provider: provider.name,
      provider_ref: session.providerPaymentId,
      provider_checkout_url: session.checkoutUrl,
      amount_cents: outstanding,
      currency,
      status: session.status,
      initiated_by: initiatedBy,
    })
    .select()
    .single();

  if (error) {
    console.error("[createCheckoutForObligation] insert failed:", error.message);
    throw new Error(error.message);
  }

  return { attempt: data as PaymentAttempt, checkoutUrl: session.checkoutUrl };
}

export type ProcessWebhookResult =
  | { ok: true; attempt: PaymentAttempt; obligation: RentObligation }
  | { ok: false; status: number; error: string };

/**
 * Verifies + applies a provider webhook event. Used by both the real webhook
 * route and the dev simulate route so they share one code path end to end.
 * Idempotent: re-delivering an already-terminal event is a no-op.
 */
export async function processProviderWebhookEvent(
  supabase: SupabaseClient,
  provider: PaymentProvider,
  input: { rawBody: string; signatureHeader: string | null },
): Promise<ProcessWebhookResult> {
  if (!provider.verifyWebhookSignature(input)) {
    return { ok: false, status: 401, error: "Invalid webhook signature" };
  }

  let event: ProviderWebhookEvent;
  try {
    event = provider.parseWebhookEvent(input.rawBody);
  } catch {
    return { ok: false, status: 400, error: "Malformed webhook payload" };
  }

  const { data: attempt, error: attemptErr } = await supabase
    .from("payment_attempts")
    .select("*")
    .eq("provider", provider.name)
    .eq("provider_ref", event.providerPaymentId)
    .single();

  if (attemptErr || !attempt) {
    return { ok: false, status: 404, error: "Payment attempt not found" };
  }

  const terminalAttemptStatuses: PaymentAttemptStatus[] = ["succeeded", "failed", "cancelled"];
  if (terminalAttemptStatuses.includes(attempt.status)) {
    // Already processed — likely a retried webhook delivery. Don't re-apply.
    const { data: obligation } = await supabase
      .from("rent_obligations")
      .select("*")
      .eq("id", attempt.obligation_id)
      .single();
    return { ok: true, attempt: attempt as PaymentAttempt, obligation: obligation as RentObligation };
  }

  const { data: obligation, error: obligationErr } = await supabase
    .from("rent_obligations")
    .select("*")
    .eq("id", attempt.obligation_id)
    .single();

  if (obligationErr || !obligation) {
    return { ok: false, status: 404, error: "Obligation not found for this attempt" };
  }

  const now = new Date();
  const update = resolveObligationAfterPaymentEvent(
    obligation as RentObligation,
    { type: event.type, amountCents: event.amountCents },
    now,
  );

  const { data: updatedAttempt, error: updateAttemptErr } = await supabase
    .from("payment_attempts")
    .update({
      status: attemptStatusForEvent(event.type),
      failure_reason: event.failureReason ?? null,
      raw_provider_event: event.raw,
      confirmed_at: now.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq("id", attempt.id)
    .select()
    .single();

  if (updateAttemptErr) {
    console.error("[processProviderWebhookEvent] attempt update failed:", updateAttemptErr.message);
    return { ok: false, status: 500, error: updateAttemptErr.message };
  }

  const { data: updatedObligation, error: updateObligationErr } = await supabase
    .from("rent_obligations")
    .update(update)
    .eq("id", obligation.id)
    .select()
    .single();

  if (updateObligationErr) {
    console.error("[processProviderWebhookEvent] obligation update failed:", updateObligationErr.message);
    return { ok: false, status: 500, error: updateObligationErr.message };
  }

  return {
    ok: true,
    attempt: updatedAttempt as PaymentAttempt,
    obligation: updatedObligation as RentObligation,
  };
}
