import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isObligationPayable,
  isOwnedByTenant,
  isOwnedByLandlord,
  pickReusableAttempt,
  attemptStatusForEvent,
  resolveObligationAfterPaymentEvent,
  createCheckoutForObligation,
  processProviderWebhookEvent,
  buildSplitConfig,
} from "@/lib/rent/payment-service";
import { mockProvider, buildMockWebhookRequest } from "@/lib/rent/payment-providers/mock";
import type { PaymentAttempt, RentObligation } from "@/lib/types";

// ─── Minimal in-memory fake for the exact query shapes payment-service.ts
// issues (select/eq/single, update/eq/select/single, insert/select/single).
// Not a Supabase client — just enough surface to exercise the orchestration
// functions without a live database.
function makeFakeSupabase(seed: {
  attempts?: Partial<PaymentAttempt>[];
  obligations?: Partial<RentObligation>[];
}) {
  const state = {
    attempts: [...(seed.attempts ?? [])] as Record<string, unknown>[],
    obligations: [...(seed.obligations ?? [])] as Record<string, unknown>[],
  };

  function rowsFor(table: string) {
    return table === "payment_attempts" ? state.attempts : state.obligations;
  }

  function from(table: string) {
    return {
      select() {
        const filters: Record<string, unknown> = {};
        const chain = {
          eq(col: string, val: unknown) {
            filters[col] = val;
            return chain;
          },
          async single() {
            const row = rowsFor(table).find((r) =>
              Object.entries(filters).every(([k, v]) => r[k] === v),
            );
            return row
              ? { data: row, error: null }
              : { data: null, error: { message: "not found" } };
          },
        };
        return chain;
      },
      update(patch: Record<string, unknown>) {
        const filters: Record<string, unknown> = {};
        return {
          eq(col: string, val: unknown) {
            filters[col] = val;
            return this;
          },
          select() {
            return {
              async single() {
                const rows = rowsFor(table);
                const idx = rows.findIndex((r) =>
                  Object.entries(filters).every(([k, v]) => r[k] === v),
                );
                if (idx === -1) return { data: null, error: { message: "not found" } };
                rows[idx] = { ...rows[idx], ...patch };
                return { data: rows[idx], error: null };
              },
            };
          },
        };
      },
      insert(row: Record<string, unknown>) {
        return {
          select() {
            return {
              async single() {
                const newRow = {
                  id: `generated-${rowsFor(table).length + 1}`,
                  created_at: new Date().toISOString(),
                  ...row,
                };
                rowsFor(table).push(newRow);
                return { data: newRow, error: null };
              },
            };
          },
        };
      },
    };
  }

  return { client: { from } as unknown as SupabaseClient, state };
}

const baseObligation = {
  id: "ob-1",
  schedule_id: "sched-1",
  tenant_id: "tenant-1",
  property_id: "prop-1",
  landlord_id: "landlord-1",
  period_start: "2024-01-01",
  due_date: "2024-01-01",
  amount_due_cents: 10000,
  amount_paid_cents: 0,
  status: "processing" as const,
  paid_at: null as string | null,
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
};

const baseAttempt = {
  id: "att-1",
  obligation_id: "ob-1",
  provider: "mock",
  provider_ref: "mock_abc",
  provider_checkout_url: "/dev/mock-checkout/mock_abc",
  amount_cents: 10000,
  currency: "ZAR",
  status: "pending" as const,
  method: null,
  failure_reason: null,
  raw_provider_event: null,
  initiated_by: "tenant" as const,
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
  confirmed_at: null,
};

// ─── Pure guards ──────────────────────────────────────────────────────────────

describe("isObligationPayable", () => {
  it("is payable for every status except paid and waived", () => {
    expect(isObligationPayable("pending")).toBe(true);
    expect(isObligationPayable("processing")).toBe(true);
    expect(isObligationPayable("partial")).toBe(true);
    expect(isObligationPayable("late")).toBe(true);
    expect(isObligationPayable("failed")).toBe(true);
  });

  it("is not payable once paid or waived", () => {
    expect(isObligationPayable("paid")).toBe(false);
    expect(isObligationPayable("waived")).toBe(false);
  });
});

describe("ownership guards", () => {
  it("tenant cannot pay someone else's obligation", () => {
    expect(isOwnedByTenant({ tenant_id: "tenant-1" }, "tenant-1")).toBe(true);
    expect(isOwnedByTenant({ tenant_id: "tenant-1" }, "tenant-2")).toBe(false);
  });

  it("landlord cannot act on another landlord's obligation", () => {
    expect(isOwnedByLandlord({ landlord_id: "landlord-1" }, "landlord-1")).toBe(true);
    expect(isOwnedByLandlord({ landlord_id: "landlord-1" }, "landlord-2")).toBe(false);
  });
});

describe("pickReusableAttempt", () => {
  it("reuses a pending or processing attempt", () => {
    const attempts = [
      { ...baseAttempt, id: "a1", status: "failed" as const },
      { ...baseAttempt, id: "a2", status: "pending" as const },
    ];
    expect(pickReusableAttempt(attempts)?.id).toBe("a2");
  });

  it("does not reuse a terminal attempt — a retry needs a fresh one", () => {
    const attempts = [
      { ...baseAttempt, id: "a1", status: "failed" as const },
      { ...baseAttempt, id: "a2", status: "cancelled" as const },
    ];
    expect(pickReusableAttempt(attempts)).toBeNull();
  });
});

describe("attemptStatusForEvent", () => {
  it("maps succeeded to succeeded, and passes failed/cancelled through", () => {
    expect(attemptStatusForEvent("succeeded")).toBe("succeeded");
    expect(attemptStatusForEvent("failed")).toBe("failed");
    expect(attemptStatusForEvent("cancelled")).toBe("cancelled");
  });
});

describe("resolveObligationAfterPaymentEvent", () => {
  const now = new Date("2024-03-01T00:00:00.000Z");

  it("marks the obligation paid and sets paid_at on full success", () => {
    const result = resolveObligationAfterPaymentEvent(
      baseObligation,
      { type: "succeeded", amountCents: 10000 },
      now,
    );
    expect(result).toEqual({
      amount_paid_cents: 10000,
      status: "paid",
      paid_at: now.toISOString(),
    });
  });

  it("marks the obligation partial when success does not cover the full amount", () => {
    const result = resolveObligationAfterPaymentEvent(
      baseObligation,
      { type: "succeeded", amountCents: 4000 },
      now,
    );
    expect(result.status).toBe("partial");
    expect(result.amount_paid_cents).toBe(4000);
    expect(result.paid_at).toBeNull();
  });

  it("marks the obligation failed on failure when nothing was collected yet", () => {
    const result = resolveObligationAfterPaymentEvent(
      baseObligation,
      { type: "failed", amountCents: 10000 },
      now,
    );
    expect(result.status).toBe("failed");
    expect(result.amount_paid_cents).toBe(0);
    expect(result.paid_at).toBeNull();
  });

  it("does not incorrectly mark paid on failure", () => {
    const result = resolveObligationAfterPaymentEvent(
      baseObligation,
      { type: "failed", amountCents: 10000 },
      now,
    );
    expect(result.status).not.toBe("paid");
  });

  it("does not regress to failed when a prior partial payment already succeeded", () => {
    const partiallyPaid = { ...baseObligation, amount_paid_cents: 4000 };
    const result = resolveObligationAfterPaymentEvent(
      partiallyPaid,
      { type: "failed", amountCents: 6000 },
      now,
    );
    expect(result.status).toBe("partial");
    expect(result.amount_paid_cents).toBe(4000);
  });

  it("reverts a cancelled attempt with nothing collected back to pending", () => {
    const result = resolveObligationAfterPaymentEvent(
      baseObligation,
      { type: "cancelled", amountCents: 10000 },
      now,
    );
    expect(result.status).toBe("pending");
    expect(result.amount_paid_cents).toBe(0);
  });

  it("leaves the obligation payable again after a failure (retry path)", () => {
    const result = resolveObligationAfterPaymentEvent(
      baseObligation,
      { type: "failed", amountCents: 10000 },
      now,
    );
    expect(isObligationPayable(result.status)).toBe(true);
  });
});

// ─── DB-touching orchestration (fake in-memory Supabase) ─────────────────────

describe("createCheckoutForObligation", () => {
  it("creates a payment attempt for the outstanding balance via the mock provider", async () => {
    const { client } = makeFakeSupabase({});
    const { attempt, checkoutUrl } = await createCheckoutForObligation(
      client,
      mockProvider,
      { id: "ob-1", amount_due_cents: 10000, amount_paid_cents: 3000 },
      "tenant",
    );

    expect(attempt.amount_cents).toBe(7000); // outstanding balance only
    expect(attempt.provider).toBe("mock");
    expect(attempt.status).toBe("pending");
    expect(attempt.initiated_by).toBe("tenant");
    expect(checkoutUrl).toContain("/dev/mock-checkout/");
  });

  it("creates a normal pending session when a splitConfig is passed, and embeds the recipient in the checkout URL", async () => {
    const { client } = makeFakeSupabase({});
    const { attempt, checkoutUrl } = await createCheckoutForObligation(
      client,
      mockProvider,
      { id: "ob-1", amount_due_cents: 10000, amount_paid_cents: 0 },
      "tenant",
      { recipientRef: "vendor-123" },
    );

    expect(attempt.provider).toBe("mock");
    expect(attempt.status).toBe("pending");
    expect(attempt.amount_cents).toBe(10000);
    expect(checkoutUrl).toContain("/dev/mock-checkout/");
    expect(checkoutUrl).toContain("split_recipient_ref=vendor-123");
  });
});

describe("buildSplitConfig", () => {
  it("returns undefined and logs a clear gap message when payout_provider_ref is not set", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = buildSplitConfig({
      id: "landlord-1",
      payout_provider: null,
      payout_provider_ref: null,
    });

    expect(result).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain("landlord-1");
    warnSpy.mockRestore();
  });

  it("does not throw for a landlord with no payout destination configured", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() =>
      buildSplitConfig({ id: "landlord-1", payout_provider: null, payout_provider_ref: null }),
    ).not.toThrow();
    vi.restoreAllMocks();
  });

  it("builds a split config from a configured payout_provider_ref", () => {
    const result = buildSplitConfig({
      id: "landlord-1",
      payout_provider: "payfast",
      payout_provider_ref: "vendor-123",
    });

    expect(result).toEqual({ recipientRef: "vendor-123" });
  });
});

describe("processProviderWebhookEvent", () => {
  it("updates payment_attempt and obligation to paid on a succeeded event", async () => {
    const { client } = makeFakeSupabase({
      attempts: [baseAttempt],
      obligations: [baseObligation],
    });
    const { rawBody, signatureHeader } = buildMockWebhookRequest({
      provider_payment_id: "mock_abc",
      type: "succeeded",
      amount_cents: 10000,
    });

    const result = await processProviderWebhookEvent(client, mockProvider, {
      rawBody,
      signatureHeader,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok result");
    expect(result.obligation.status).toBe("paid");
    expect(result.obligation.amount_paid_cents).toBe(10000);
    expect(result.obligation.paid_at).not.toBeNull();
    expect(result.attempt.status).toBe("succeeded");
  });

  it("does not incorrectly mark paid on a failed webhook event", async () => {
    const { client } = makeFakeSupabase({
      attempts: [baseAttempt],
      obligations: [baseObligation],
    });
    const { rawBody, signatureHeader } = buildMockWebhookRequest({
      provider_payment_id: "mock_abc",
      type: "failed",
      amount_cents: 10000,
      failure_reason: "card_declined",
    });

    const result = await processProviderWebhookEvent(client, mockProvider, {
      rawBody,
      signatureHeader,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok result");
    expect(result.obligation.status).toBe("failed");
    expect(result.obligation.status).not.toBe("paid");
    expect(result.obligation.amount_paid_cents).toBe(0);
    expect(result.attempt.status).toBe("failed");
    expect(result.attempt.failure_reason).toBe("card_declined");
  });

  it("allows a fresh attempt after a failed webhook (retry)", async () => {
    const { client } = makeFakeSupabase({
      attempts: [baseAttempt],
      obligations: [baseObligation],
    });
    const failEvent = buildMockWebhookRequest({
      provider_payment_id: "mock_abc",
      type: "failed",
      amount_cents: 10000,
    });
    await processProviderWebhookEvent(client, mockProvider, failEvent);

    const { attempt } = await createCheckoutForObligation(
      client,
      mockProvider,
      { id: "ob-1", amount_due_cents: 10000, amount_paid_cents: 0 },
      "tenant",
    );

    expect(attempt.status).toBe("pending");
    expect(attempt.id).not.toBe("att-1");
  });

  it("rejects a webhook with an invalid signature", async () => {
    const { client } = makeFakeSupabase({
      attempts: [baseAttempt],
      obligations: [baseObligation],
    });
    const result = await processProviderWebhookEvent(client, mockProvider, {
      rawBody: JSON.stringify({ provider_payment_id: "mock_abc", type: "succeeded", amount_cents: 10000 }),
      signatureHeader: "not-a-real-signature",
    });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected rejection");
    expect(result.status).toBe(401);
  });

  it("404s when the payment attempt cannot be found", async () => {
    const { client } = makeFakeSupabase({ attempts: [], obligations: [] });
    const { rawBody, signatureHeader } = buildMockWebhookRequest({
      provider_payment_id: "mock_does_not_exist",
      type: "succeeded",
      amount_cents: 10000,
    });
    const result = await processProviderWebhookEvent(client, mockProvider, {
      rawBody,
      signatureHeader,
    });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected rejection");
    expect(result.status).toBe(404);
  });

  it("does not double-apply a re-delivered succeeded webhook", async () => {
    const { client } = makeFakeSupabase({
      attempts: [baseAttempt],
      obligations: [baseObligation],
    });
    const event = buildMockWebhookRequest({
      provider_payment_id: "mock_abc",
      type: "succeeded",
      amount_cents: 10000,
    });

    const first = await processProviderWebhookEvent(client, mockProvider, event);
    const second = await processProviderWebhookEvent(client, mockProvider, event);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) throw new Error("expected ok results");
    // Re-delivery must not double-count the payment.
    expect(second.obligation.amount_paid_cents).toBe(10000);
    expect(second.obligation.status).toBe("paid");
  });
});
