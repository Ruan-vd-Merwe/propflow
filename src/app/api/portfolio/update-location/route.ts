import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SA_PROVINCES = new Set([
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
]);

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

    const body = (await req.json()) as Record<string, unknown>;
    const { property_id } = body;

    if (!property_id || typeof property_id !== "string") {
      return NextResponse.json(
        { error: "property_id is required" },
        { status: 400 },
      );
    }

    const { data: existing } = await supabase
      .from("properties")
      .select("id")
      .eq("id", property_id)
      .eq("owner_id", user.id)
      .single();

    if (!existing)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const update: Record<string, unknown> = {};

    const textFields = ["suburb", "city", "postal_code"] as const;
    for (const field of textFields) {
      if (field in body) {
        const v = body[field];
        update[field] =
          typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
      }
    }

    if ("province" in body) {
      const v = body["province"];
      if (v === null) {
        update["province"] = null;
      } else if (typeof v === "string" && SA_PROVINCES.has(v)) {
        update["province"] = v;
      }
    }

    if ("latitude" in body) {
      const v = body["latitude"];
      if (v === null) {
        update["latitude"] = null;
      } else if (typeof v === "number" && v >= -35 && v <= -22) {
        update["latitude"] = v;
      }
    }

    if ("longitude" in body) {
      const v = body["longitude"];
      if (v === null) {
        update["longitude"] = null;
      } else if (typeof v === "number" && v >= 16 && v <= 33) {
        update["longitude"] = v;
      }
    }

    if ("area_news_enabled" in body) {
      update["area_news_enabled"] = body["area_news_enabled"] === true;
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

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ property: updated });
  } catch (err) {
    console.error("[portfolio/update-location]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
