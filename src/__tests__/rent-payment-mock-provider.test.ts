import { describe, it, expect } from "vitest";
import {
  mockProvider,
  signMockWebhookBody,
  buildMockWebhookRequest,
  parseSplitFromCheckoutUrl,
} from "@/lib/rent/payment-providers/mock";

describe("mockProvider.createCheckoutSession", () => {
  it("returns a pending session with a unique provider payment id", async () => {
    const a = await mockProvider.createCheckoutSession({
      obligationId: "ob-1",
      amountCents: 10000,
      currency: "ZAR",
    });
    const b = await mockProvider.createCheckoutSession({
      obligationId: "ob-1",
      amountCents: 10000,
      currency: "ZAR",
    });

    expect(a.status).toBe("pending");
    expect(a.providerPaymentId).toMatch(/^mock_/);
    expect(a.providerPaymentId).not.toBe(b.providerPaymentId);
  });

  it("embeds the obligation id and amount in the dev checkout URL", async () => {
    const session = await mockProvider.createCheckoutSession({
      obligationId: "ob-42",
      amountCents: 55500,
      currency: "ZAR",
    });
    expect(session.checkoutUrl).toContain("/dev/mock-checkout/");
    expect(session.checkoutUrl).toContain("obligation_id=ob-42");
    expect(session.checkoutUrl).toContain("amount_cents=55500");
  });

  it("embeds a split recipient in the checkout URL when a split config is given", async () => {
    const session = await mockProvider.createCheckoutSession({
      obligationId: "ob-42",
      amountCents: 55500,
      currency: "ZAR",
      split: { recipientRef: "vendor-abc", amountCents: 40000 },
    });
    expect(session.checkoutUrl).toContain("split_recipient_ref=vendor-abc");
    expect(session.checkoutUrl).toContain("split_amount_cents=40000");
  });

  it("does not add split params to the checkout URL when no split is given", async () => {
    const session = await mockProvider.createCheckoutSession({
      obligationId: "ob-42",
      amountCents: 55500,
      currency: "ZAR",
    });
    expect(session.checkoutUrl).not.toContain("split_recipient_ref");
  });
});

describe("parseSplitFromCheckoutUrl", () => {
  it("reads the split recipient and amount back out of a checkout URL", () => {
    const split = parseSplitFromCheckoutUrl(
      "/dev/mock-checkout/mock_abc?obligation_id=ob-1&split_recipient_ref=vendor-abc&split_amount_cents=40000",
    );
    expect(split).toEqual({ recipient_ref: "vendor-abc", amount_cents: 40000 });
  });

  it("returns undefined when the checkout URL has no split params", () => {
    const split = parseSplitFromCheckoutUrl(
      "/dev/mock-checkout/mock_abc?obligation_id=ob-1&amount_cents=10000",
    );
    expect(split).toBeUndefined();
  });
});

describe("mockProvider.verifyWebhookSignature", () => {
  it("accepts a correctly signed body", () => {
    const rawBody = JSON.stringify({ hello: "world" });
    const signatureHeader = signMockWebhookBody(rawBody);
    expect(
      mockProvider.verifyWebhookSignature({ rawBody, signatureHeader }),
    ).toBe(true);
  });

  it("rejects a tampered body", () => {
    const rawBody = JSON.stringify({ hello: "world" });
    const signatureHeader = signMockWebhookBody(rawBody);
    const tamperedBody = JSON.stringify({ hello: "mallory" });
    expect(
      mockProvider.verifyWebhookSignature({
        rawBody: tamperedBody,
        signatureHeader,
      }),
    ).toBe(false);
  });

  it("rejects a missing signature header", () => {
    const rawBody = JSON.stringify({ hello: "world" });
    expect(
      mockProvider.verifyWebhookSignature({ rawBody, signatureHeader: null }),
    ).toBe(false);
  });
});

describe("mockProvider.parseWebhookEvent", () => {
  it("parses a raw JSON body into a ProviderWebhookEvent", () => {
    const rawBody = JSON.stringify({
      provider_payment_id: "mock_123",
      type: "succeeded",
      amount_cents: 20000,
    });
    const event = mockProvider.parseWebhookEvent(rawBody);
    expect(event).toMatchObject({
      providerPaymentId: "mock_123",
      type: "succeeded",
      amountCents: 20000,
    });
  });

  it("carries a failure_reason through to failureReason", () => {
    const rawBody = JSON.stringify({
      provider_payment_id: "mock_123",
      type: "failed",
      amount_cents: 20000,
      failure_reason: "insufficient_funds",
    });
    const event = mockProvider.parseWebhookEvent(rawBody);
    expect(event.failureReason).toBe("insufficient_funds");
  });
});

describe("buildMockWebhookRequest", () => {
  it("produces a rawBody + signature the provider itself accepts", () => {
    const { rawBody, signatureHeader } = buildMockWebhookRequest({
      provider_payment_id: "mock_abc",
      type: "succeeded",
      amount_cents: 12345,
    });
    expect(
      mockProvider.verifyWebhookSignature({ rawBody, signatureHeader }),
    ).toBe(true);
    expect(mockProvider.parseWebhookEvent(rawBody)).toMatchObject({
      providerPaymentId: "mock_abc",
      type: "succeeded",
      amountCents: 12345,
    });
  });

  it("carries a split config through to the parsed event's raw payload", () => {
    const { rawBody, signatureHeader } = buildMockWebhookRequest({
      provider_payment_id: "mock_abc",
      type: "succeeded",
      amount_cents: 12345,
      split: { recipient_ref: "vendor-abc" },
    });
    expect(
      mockProvider.verifyWebhookSignature({ rawBody, signatureHeader }),
    ).toBe(true);
    const event = mockProvider.parseWebhookEvent(rawBody);
    expect(event.raw).toMatchObject({ split: { recipient_ref: "vendor-abc" } });
  });
});
