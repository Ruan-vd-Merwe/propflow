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

    // Verify ownership — RLS will enforce this but we check explicitly
    const { data: existing } = await supabase
      .from("properties")
      .select("id")
      .eq("id", property_id)
      .eq("owner_id", user.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Validate numeric fields
    const numericFields = [
      "purchase_price_cents",
      "current_value_cents",
      "bond_original_amount_cents",
      "bond_monthly_payment_cents",
      "bond_term_years",
      "levy_monthly_cents",
      "rates_monthly_cents",
      "insurance_monthly_cents",
    ];
    const update: Record<string, unknown> = {};

    for (const field of numericFields) {
      if (field in body) {
        const val = body[field];
        if (val === null) {
          update[field] = null;
        } else if (typeof val === "number" && isFinite(val)) {
          update[field] = Math.round(val);
        } else {
          update[field] = null;
        }
      }
    }

    // Float / text fields
    if ("bond_interest_rate_pct" in body) {
      const v = body["bond_interest_rate_pct"];
      if (v === null) {
        update["bond_interest_rate_pct"] = null;
      } else if (typeof v === "number" && v >= 0 && v <= 100) {
        update["bond_interest_rate_pct"] = v;
      }
    }

    if ("management_fee_pct" in body) {
      const v = body["management_fee_pct"];
      if (v === null) {
        update["management_fee_pct"] = null;
      } else if (typeof v === "number" && v >= 0 && v <= 100) {
        update["management_fee_pct"] = v;
      }
    }

    if ("bond_bank" in body) {
      update["bond_bank"] =
        typeof body["bond_bank"] === "string" ? body["bond_bank"] : null;
    }

    if ("bond_start_date" in body) {
      const v = body["bond_start_date"];
      update["bond_start_date"] =
        typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    const { data: updated, error } = await supabase
      .from("properties")
      .update(update)
      .eq("id", property_id)
      .eq("owner_id", user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ property: updated });
  } catch (err) {
    console.error("[portfolio/update-finance]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
