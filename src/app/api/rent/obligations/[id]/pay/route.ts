import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { mockProvider } from "@/lib/rent/payment-providers/mock";
import {
  createCheckoutForObligation,
  isObligationPayable,
  isOwnedByTenant,
  pickReusableAttempt,
} from "@/lib/rent/payment-service";
import type { PaymentAttempt, RentObligation } from "@/lib/types";

export const runtime = "nodejs";

/**
 * POST /api/rent/obligations/[id]/pay
 *
 * Token-authenticated (mirrors /api/tenant/paid, /api/queries etc — tenants
 * in this app aren't Supabase-auth users, they carry a portal_token/
 * access_token). Creates a payment_attempt via the mock provider and
 * returns a checkout URL. Reuses an in-flight attempt instead of spawning a
 * duplicate if the tenant re-clicks "Pay rent".
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const body = await req.json().catch(() => ({}));
  const { token } = body as { token?: string };

  if (!token) {
    return NextResponse.json({ error: "token required" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      token,
    );
  const col = isUuid ? "portal_token" : "access_token";

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq(col, token)
    .single();

  if (!tenant) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const { data: obligationRaw, error: fetchErr } = await supabase
    .from("rent_obligations")
    .select("*")
    .eq("id", params.id)
    .single();

  if (fetchErr || !obligationRaw) {
    return NextResponse.json({ error: "Obligation not found" }, { status: 404 });
  }
  const obligation = obligationRaw as RentObligation;

  // A tenant may only ever pay their own obligation.
  if (!isOwnedByTenant(obligation, tenant.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isObligationPayable(obligation.status)) {
    return NextResponse.json(
      { error: `Obligation is ${obligation.status} and cannot be paid` },
      { status: 400 },
    );
  }

  const { data: existingAttemptsRaw } = await supabase
    .from("payment_attempts")
    .select("*")
    .eq("obligation_id", obligation.id)
    .order("created_at", { ascending: false });

  const reusable = pickReusableAttempt((existingAttemptsRaw ?? []) as PaymentAttempt[]);
  if (reusable) {
    return NextResponse.json({
      payment_attempt: reusable,
      checkout_url: reusable.provider_checkout_url,
    });
  }

  const { attempt, checkoutUrl } = await createCheckoutForObligation(
    supabase,
    mockProvider,
    obligation,
    "tenant",
  );

  await supabase
    .from("rent_obligations")
    .update({ status: "processing" })
    .eq("id", obligation.id);

  return NextResponse.json(
    { payment_attempt: attempt, checkout_url: checkoutUrl },
    { status: 201 },
  );
}
