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

type MockWebhookBody = {
  provider_payment_id: string;
  type: "succeeded" | "failed" | "cancelled";
  amount_cents: number;
  failure_reason?: string;
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
  }: CheckoutSessionInput): Promise<CheckoutSession> {
    const providerPaymentId = `mock_${randomUUID()}`;
    const params = new URLSearchParams({
      obligation_id: obligationId,
      amount_cents: String(amountCents),
      currency,
      ...(description ? { description } : {}),
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
