import type { PaymentAttemptStatus } from "@/lib/types";

/**
 * Split-payment recipient config for a checkout, e.g. Payfast Split
 * Payments: the buyer's payment lands in PropTrust's own account, which
 * then instantly splits a portion to the landlord's registered recipient.
 * Optional and additive — a provider that ignores `split` collects the
 * full amount as before. This is what the mock provider does today.
 *
 * TODO(payfast): the exact fields Payfast requires to identify a split
 * recipient (vendor ID, merchant ID, or something else) are not yet
 * confirmed, and neither is whether a landlord needs their own
 * Payfast-registered vendor identity to receive a split at all. Do not
 * implement a real PayfastProvider until both are confirmed directly with
 * Payfast. recipientRef is deliberately opaque until then — see
 * profiles.payout_provider_ref.
 */
export type SplitConfig = {
  recipientRef: string;
  amountCents?: number;
  percentage?: number;
};

export type CheckoutSessionInput = {
  obligationId: string;
  amountCents: number;
  currency: string;
  description?: string;
  split?: SplitConfig;
};

export type CheckoutSession = {
  providerPaymentId: string;
  checkoutUrl: string;
  status: PaymentAttemptStatus;
};

export type ProviderEventType = "succeeded" | "failed" | "cancelled";

export type ProviderWebhookEvent = {
  providerPaymentId: string;
  type: ProviderEventType;
  amountCents: number;
  failureReason?: string;
  raw: Record<string, unknown>;
};

export type WebhookVerificationInput = {
  rawBody: string;
  signatureHeader: string | null;
};

/**
 * Provider-agnostic payment gateway contract. Phase 2 ships only `mock`;
 * a real gateway (PayFast/Peach/Ozow/Stitch) implements the same shape.
 */
export interface PaymentProvider {
  name: string;
  createCheckoutSession(input: CheckoutSessionInput): Promise<CheckoutSession>;
  verifyWebhookSignature(input: WebhookVerificationInput): boolean;
  parseWebhookEvent(rawBody: string): ProviderWebhookEvent;
}
