import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  buildMockWebhookRequest,
  mockProvider,
  parseSplitFromCheckoutUrl,
} from "@/lib/rent/payment-providers/mock";
import { processProviderWebhookEvent } from "@/lib/rent/payment-service";
import type { ProviderEventType } from "@/lib/rent/payment-providers/types";

export const runtime = "nodejs";

const VALID_OUTCOMES: ProviderEventType[] = ["succeeded", "failed", "cancelled"];

/**
 * POST /api/rent/payment-attempts/[id]/simulate
 *
 * Development-only. Stands in for a real gateway's sandbox/test mode: lets
 * the tenant's dev-checkout panel or a landlord testing the dashboard force
 * an attempt to a terminal state. Goes through processProviderWebhookEvent —
 * the exact function a real webhook delivery calls — so this exercises the
 * same code path, it just signs the event itself instead of a gateway doing
 * it. Hard-gated off in production regardless of caller.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Payment simulation is not available in production" },
      { status: 403 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const { outcome, failure_reason, token } = body as {
    outcome?: string;
    failure_reason?: string;
    token?: string;
  };

  if (!outcome || !VALID_OUTCOMES.includes(outcome as ProviderEventType)) {
    return NextResponse.json(
      { error: "outcome must be succeeded, failed or cancelled" },
      { status: 400 },
    );
  }

  const service = createServiceClient();

  const { data: attempt } = await service
    .from("payment_attempts")
    .select(`*, rent_obligations!inner ( tenant_id, landlord_id )`)
    .eq("id", params.id)
    .single();

  if (!attempt) {
    return NextResponse.json({ error: "Payment attempt not found" }, { status: 404 });
  }

  const obligationRef = (
    attempt as unknown as {
      rent_obligations: { tenant_id: string; landlord_id: string };
    }
  ).rent_obligations;

  // Caller must be either the tenant who owns the obligation (portal token,
  // matching how the pay route authenticates) or the landlord (Supabase
  // session) — dev convenience, gated primarily by the production check above.
  let authorised = false;

  if (token) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        token,
      );
    const col = isUuid ? "portal_token" : "access_token";
    const { data: tenant } = await service
      .from("tenants")
      .select("id")
      .eq(col, token)
      .single();
    if (tenant && tenant.id === obligationRef.tenant_id) authorised = true;
  }

  if (!authorised) {
    const sessionSupabase = createClient();
    const {
      data: { user },
    } = await sessionSupabase.auth.getUser();
    if (user && user.id === obligationRef.landlord_id) authorised = true;
  }

  if (!authorised) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (attempt.provider !== "mock") {
    return NextResponse.json(
      { error: "Simulation is only supported for the mock provider" },
      { status: 400 },
    );
  }

  // Split config isn't stored on payment_attempts itself; it was embedded
  // in the checkout URL when the session was created (see mock.ts), so it's
  // read back out here the same way a real gateway's dashboard would let
  // you inspect what split a checkout was configured with.
  const split = attempt.provider_checkout_url
    ? parseSplitFromCheckoutUrl(attempt.provider_checkout_url)
    : undefined;

  const { rawBody, signatureHeader } = buildMockWebhookRequest({
    provider_payment_id: attempt.provider_ref,
    type: outcome as ProviderEventType,
    amount_cents: attempt.amount_cents,
    failure_reason:
      failure_reason ?? (outcome === "failed" ? "simulated_failure" : undefined),
    ...(split ? { split } : {}),
  });

  const result = await processProviderWebhookEvent(service, mockProvider, {
    rawBody,
    signatureHeader,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    payment_attempt: result.attempt,
    obligation: result.obligation,
  });
}
