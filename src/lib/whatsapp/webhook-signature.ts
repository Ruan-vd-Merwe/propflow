import { createHmac, timingSafeEqual } from "crypto";

/**
 * Signs a raw body the way Meta signs webhook deliveries — used by tests to
 * build a valid X-Hub-Signature-256 header without hand-computing HMACs.
 */
export function signMetaWebhookBody(rawBody: string, appSecret: string): string {
  return "sha256=" + createHmac("sha256", appSecret).update(rawBody).digest("hex");
}

/**
 * Verifies Meta's X-Hub-Signature-256 header against the exact raw body
 * bytes Meta signed — mirrors the rent payment webhook's raw-body-first
 * verification (see @/lib/rent/payment-providers/mock verifyWebhookSignature),
 * using a constant-time comparison since this guards a real internet-facing
 * endpoint rather than a dev-only mock secret.
 */
export function verifyMetaWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) {
    console.error("[whatsapp webhook] WHATSAPP_APP_SECRET is not set — rejecting all deliveries");
    return false;
  }
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) return false;

  const expected = createHmac("sha256", appSecret).update(rawBody).digest("hex");
  const provided = signatureHeader.slice("sha256=".length);

  const expectedBuf = Buffer.from(expected, "hex");
  const providedBuf = Buffer.from(provided, "hex");
  if (expectedBuf.length !== providedBuf.length) return false;

  return timingSafeEqual(expectedBuf, providedBuf);
}
