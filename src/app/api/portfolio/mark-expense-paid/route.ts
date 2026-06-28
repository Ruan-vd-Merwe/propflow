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
    const { expense_id, paid_at } = body;

    if (!expense_id || typeof expense_id !== "string") {
      return NextResponse.json(
        { error: "expense_id is required" },
        { status: 400 },
      );
    }

    const paidDate =
      typeof paid_at === "string" && /^\d{4}-\d{2}-\d{2}$/.test(paid_at)
        ? paid_at
        : new Date().toISOString().split("T")[0];

    // Verify ownership via owner_id on the expense (RLS also enforces this)
    const { data: existing } = await supabase
      .from("property_expenses")
      .select("id")
      .eq("id", expense_id)
      .eq("owner_id", user.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data: updated, error } = await supabase
      .from("property_expenses")
      .update({ status: "paid", paid_at: paidDate })
      .eq("id", expense_id)
      .eq("owner_id", user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ expense: updated });
  } catch (err) {
    console.error("[portfolio/mark-expense-paid]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
