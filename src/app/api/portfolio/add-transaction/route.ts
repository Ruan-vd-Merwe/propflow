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

    if (property_id !== undefined) {
      if (typeof property_id !== "string") {
        return NextResponse.json(
          { error: "Invalid property_id" },
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
    }

    const transaction_date = body["transaction_date"];
    if (
      typeof transaction_date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(transaction_date)
    ) {
      return NextResponse.json(
        { error: "transaction_date is required (YYYY-MM-DD)" },
        { status: 400 },
      );
    }

    const description = body["description"];
    if (!description || typeof description !== "string") {
      return NextResponse.json(
        { error: "description is required" },
        { status: 400 },
      );
    }

    const amount_cents = body["amount_cents"];
    if (typeof amount_cents !== "number") {
      return NextResponse.json(
        { error: "amount_cents must be a number" },
        { status: 400 },
      );
    }

    const transaction_type = body["transaction_type"];
    if (transaction_type !== "credit" && transaction_type !== "debit") {
      return NextResponse.json(
        { error: "transaction_type must be credit or debit" },
        { status: 400 },
      );
    }

    const { data: tx, error } = await supabase
      .from("bank_transactions")
      .insert({
        owner_id: user.id,
        property_id: typeof property_id === "string" ? property_id : null,
        transaction_date,
        description,
        amount_cents: Math.round(amount_cents),
        transaction_type,
        category:
          typeof body["category"] === "string"
            ? body["category"]
            : "uncategorised",
        bank_reference:
          typeof body["bank_reference"] === "string"
            ? body["bank_reference"]
            : null,
        is_reconciled: false,
        source:
          typeof body["source"] === "string" ? body["source"] : "manual",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ transaction: tx });
  } catch (err) {
    console.error("[portfolio/add-transaction]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
