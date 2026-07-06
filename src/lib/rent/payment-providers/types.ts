import type { PaymentAttemptStatus } from "@/lib/types";

export type CheckoutSessionInput = {
  obligationId: string;
  amountCents: number;
  currency: string;
  description?: string;
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
