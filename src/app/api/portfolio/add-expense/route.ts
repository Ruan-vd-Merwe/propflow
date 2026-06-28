import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const body = (await req.json()) as Record<string, unknown>;
    const { property_id } = body;

    if (!property_id || typeof property_id !== "string") {
      return NextResponse.json(
        { error: "property_id is required" },
        { status: 400 },
      );
    }

    // Verify ownership
    const { data: prop } = await supabase
      .from("properties")
      .select("id")
      .eq("id", property_id)
      .eq("owner_id", user.id)
      .single();

    if (!prop) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const VALID_TYPES = [
      "bond",
      "levy",
      "rates",
      "insurance",
      "maintenance",
      "management_fee",
      "water",
      "electricity",
      "other",
    ] as const;

    const expense_type = body["expense_type"];
    if (!VALID_TYPES.includes(expense_type as (typeof VALID_TYPES)[number])) {
      return NextResponse.json(
        { error: "Invalid expense_type" },
        { status: 400 },
      );
    }

    const amount_cents = body["amount_cents"];
    if (typeof amount_cents !== "number" || amount_cents <= 0) {
      return NextResponse.json(
        { error: "amount_cents must be a positive number" },
        { status: 400 },
      );
    }

    const { data: expense, error } = await supabase
      .from("property_expenses")
      .insert({
        property_id,
        owner_id: user.id,
        expense_type,
        description:
          typeof body["description"] === "string" ? body["description"] : null,
        amount_cents: Math.round(amount_cents),
        is_recurring: body["is_recurring"] === true,
        frequency:
          typeof body["frequency"] === "string" ? body["frequency"] : "once",
        period_month:
          typeof body["period_month"] === "number"
            ? body["period_month"]
            : null,
        period_year:
          typeof body["period_year"] === "number" ? body["period_year"] : null,
        status: "pending",
        reference:
          typeof body["reference"] === "string" ? body["reference"] : null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ expense });
  } catch (err) {
    console.error("[portfolio/add-expense]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
