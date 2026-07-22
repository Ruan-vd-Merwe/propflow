import { randomUUID, createHmac } from "crypto";
import type {
  CheckoutSession,
  CheckoutSessionInput,
  PaymentProvider,
  ProviderWebhookEvent,
  WebhookVerificationInput,
} from "./types";

// Dev-only shared secret — never used for a real provider. Set
// MOCK_WEBHOOK_SECRET in .env.local to override the fallback locally.
const MOCK_SECRET = process.env.MOCK_WEBHOOK_SECRET ?? "dev-mock-secret";

export function signMockWebhookBody(rawBody: string): string {
  return createHmac("sha256", MOCK_SECRET).update(rawBody).digest("hex");
}

type MockWebhookSplit = {
  recipient_ref: string;
  amount_cents?: number;
  percentage?: number;
};

type MockWebhookBody = {
  provider_payment_id: string;
  type: "succeeded" | "failed" | "cancelled";
  amount_cents: number;
  failure_reason?: string;
  split?: MockWebhookSplit;
};

/** Builds and signs the raw JSON body a real mock-webhook call would send. */
export function buildMockWebhookRequest(body: MockWebhookBody): {
  rawBody: string;
  signatureHeader: string;
} {
  const rawBody = JSON.stringify(body);
  return { rawBody, signatureHeader: signMockWebhookBody(rawBody) };
}

/**
 * Reads the split_* params a checkout session embedded in its checkout URL
 * (see createCheckoutSession's comment) back out, so a caller building a
 * webhook event for that session can carry the same split through. Returns
 * undefined if the checkout had no split configured.
 */
export function parseSplitFromCheckoutUrl(checkoutUrl: string): MockWebhookSplit | undefined {
  const query = checkoutUrl.split("?")[1] ?? "";
  const params = new URLSearchParams(query);
  const recipientRef = params.get("split_recipient_ref");
  if (!recipientRef) return undefined;

  const amountCents = params.get("split_amount_cents");
  const percentage = params.get("split_percentage");

  return {
    recipient_ref: recipientRef,
    ...(amountCents !== null ? { amount_cents: Number(amountCents) } : {}),
    ...(percentage !== null ? { percentage: Number(percentage) } : {}),
  };
}

/**
 * Dev/test payment provider. Creates a fake checkout URL and never talks to
 * a real gateway — success/failure/cancellation is driven entirely by the
 * simulate route or a hand-signed webhook call, both of which go through the
 * same processProviderWebhookEvent() path a real webhook would use.
 */
export const mockProvider: PaymentProvider = {
  name: "mock",

  async createCheckoutSession({
    obligationId,
    amountCents,
    currency,
    description,
    split,
  }: CheckoutSessionInput): Promise<CheckoutSession> {
    const providerPaymentId = `mock_${randomUUID()}`;
    const params = new URLSearchParams({
      obligation_id: obligationId,
      amount_cents: String(amountCents),
      currency,
      ...(description ? { description } : {}),
      // The mock provider has no real backend to hold session state, so a
      // split config is round-tripped through the checkout URL's query
      // params instead. parseSplitFromCheckoutUrl reads it back out — the
      // simulate route uses this to carry split through to the webhook
      // event's raw payload, the same way a real gateway's dashboard would
      // let you inspect what split was configured for a given checkout.
      ...(split ? { split_recipient_ref: split.recipientRef } : {}),
      ...(split?.amountCents !== undefined
        ? { split_amount_cents: String(split.amountCents) }
        : {}),
      ...(split?.percentage !== undefined
        ? { split_percentage: String(split.percentage) }
        : {}),
    });

    return {
      providerPaymentId,
      checkoutUrl: `/dev/mock-checkout/${providerPaymentId}?${params.toString()}`,
      status: "pending",
    };
  },

  verifyWebhookSignature({ rawBody, signatureHeader }: WebhookVerificationInput): boolean {
    if (!signatureHeader) return false;
    return signatureHeader === signMockWebhookBody(rawBody);
  },

  parseWebhookEvent(rawBody: string): ProviderWebhookEvent {
    const body = JSON.parse(rawBody) as MockWebhookBody;
    return {
      providerPaymentId: body.provider_payment_id,
      type: body.type,
      amountCents: body.amount_cents,
      failureReason: body.failure_reason,
      raw: body as unknown as Record<string, unknown>,
    };
  },
};
