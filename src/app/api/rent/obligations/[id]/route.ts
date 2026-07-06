import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ObligationStatus } from "@/lib/types";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("rent_obligations")
    .select(
      `*, tenants ( id, full_name, email, phone ), properties ( id, name, address )`,
    )
    .eq("id", params.id)
    .eq("landlord_id", user.id)
    .single();

  if (error || !data)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ obligation: data });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action } = body;

  const { data: current, error: fetchErr } = await supabase
    .from("rent_obligations")
    .select("landlord_id, amount_due_cents, amount_paid_cents, status")
    .eq("id", params.id)
    .single();

  if (fetchErr || !current)
    return NextResponse.json({ error: "Obligation not found" }, { status: 404 });
  if (current.landlord_id !== user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const updates: {
    amount_paid_cents?: number;
    amount_due_cents?: number;
    status: ObligationStatus;
    paid_at?: string;
  } = {
    status: current.status,
  };
  let attempt: {
    obligation_id: string;
    provider: string;
    amount_cents: number;
    status: "succeeded";
    method: string;
    initiated_by: "landlord";
    confirmed_at: string;
  };

  if (action === "mark_paid") {
    const outstanding = current.amount_due_cents - current.amount_paid_cents;
    const amount = body.amount_cents ?? outstanding;
    const newAmountPaid = current.amount_paid_cents + amount;

    updates.amount_paid_cents = newAmountPaid;
    updates.status = newAmountPaid >= current.amount_due_cents ? "paid" : "partial";
    if (updates.status === "paid") updates.paid_at = new Date().toISOString();

    attempt = {
      obligation_id: params.id,
      provider: "manual",
      amount_cents: amount,
      status: "succeeded",
      method: body.method ?? "manual",
      initiated_by: "landlord",
      confirmed_at: new Date().toISOString(),
    };
  } else if (action === "waive") {
    updates.status = "waived";

    attempt = {
      obligation_id: params.id,
      provider: "manual",
      amount_cents: 0,
      status: "succeeded",
      method: "waived",
      initiated_by: "landlord",
      confirmed_at: new Date().toISOString(),
    };
  } else if (action === "adjust") {
    const newAmountDue = body.amount_due_cents;
    if (typeof newAmountDue !== "number") {
      return NextResponse.json(
        { error: "amount_due_cents is required for adjust" },
        { status: 400 },
      );
    }

    updates.amount_due_cents = newAmountDue;
    updates.status =
      current.amount_paid_cents >= newAmountDue
        ? "paid"
        : current.amount_paid_cents > 0
          ? "partial"
          : "pending";
    if (updates.status === "paid") updates.paid_at = new Date().toISOString();

    attempt = {
      obligation_id: params.id,
      provider: "manual",
      amount_cents: newAmountDue - current.amount_due_cents,
      status: "succeeded",
      method: "adjustment",
      initiated_by: "landlord",
      confirmed_at: new Date().toISOString(),
    };
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const { error: attemptErr } = await supabase
    .from("payment_attempts")
    .insert(attempt);
  if (attemptErr)
    return NextResponse.json({ error: attemptErr.message }, { status: 500 });

  const { data, error } = await supabase
    .from("rent_obligations")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ obligation: data });
}
