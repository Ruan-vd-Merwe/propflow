import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { mockProvider } from "@/lib/rent/payment-providers/mock";
import { processProviderWebhookEvent } from "@/lib/rent/payment-service";

export const runtime = "nodejs";

/**
 * POST /api/rent/payment-webhook
 *
 * Provider-agnostic webhook receiver. Today only the mock provider is wired
 * up (signed via a shared dev secret); a real gateway later verifies its own
 * signature scheme through the same PaymentProvider.verifyWebhookSignature
 * contract. Always reads the raw body first — signature verification must
 * run against the exact bytes the provider signed.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signatureHeader = req.headers.get("x-mock-signature");

  const supabase = createServiceClient();
  const result = await processProviderWebhookEvent(supabase, mockProvider, {
    rawBody,
    signatureHeader,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ received: true });
}
