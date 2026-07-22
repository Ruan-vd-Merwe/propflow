import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  signMetaWebhookBody,
  verifyMetaWebhookSignature,
} from "@/lib/whatsapp/webhook-signature";

describe("verifyMetaWebhookSignature", () => {
  const originalSecret = process.env.WHATSAPP_APP_SECRET;

  beforeEach(() => {
    process.env.WHATSAPP_APP_SECRET = "test-app-secret";
  });

  afterEach(() => {
    process.env.WHATSAPP_APP_SECRET = originalSecret;
  });

  it("accepts a correctly signed raw body", () => {
    const rawBody = JSON.stringify({ entry: [] });
    const signature = signMetaWebhookBody(rawBody, "test-app-secret");
    expect(verifyMetaWebhookSignature(rawBody, signature)).toBe(true);
  });

  it("rejects a tampered body", () => {
    const rawBody = JSON.stringify({ entry: [] });
    const signature = signMetaWebhookBody(rawBody, "test-app-secret");
    const tampered = JSON.stringify({ entry: [{ id: "mallory" }] });
    expect(verifyMetaWebhookSignature(tampered, signature)).toBe(false);
  });

  it("rejects a missing signature header", () => {
    const rawBody = JSON.stringify({ entry: [] });
    expect(verifyMetaWebhookSignature(rawBody, null)).toBe(false);
  });

  it("rejects a signature signed with the wrong secret", () => {
    const rawBody = JSON.stringify({ entry: [] });
    const signature = signMetaWebhookBody(rawBody, "wrong-secret");
    expect(verifyMetaWebhookSignature(rawBody, signature)).toBe(false);
  });

  it("rejects when WHATSAPP_APP_SECRET is not configured", () => {
    delete process.env.WHATSAPP_APP_SECRET;
    const rawBody = JSON.stringify({ entry: [] });
    const signature = signMetaWebhookBody(rawBody, "test-app-secret");
    expect(verifyMetaWebhookSignature(rawBody, signature)).toBe(false);
  });
});
