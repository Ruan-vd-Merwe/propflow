import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const propertyId = new URL(req.url).searchParams.get("property_id");

  let query = supabase
    .from("property_components")
    .select("*")
    .order("component_type")
    .order("name");

  if (propertyId) query = query.eq("property_id", propertyId);

  const { data, error } = await query;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ components: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      property_id,
      component_type,
      name,
      installed_date,
      lifespan_min_years,
      lifespan_max_years,
      brand,
      model_number,
      notes,
      last_serviced_date,
    } = body;

    if (!property_id || !component_type || !name || !installed_date) {
      return NextResponse.json(
        {
          error:
            "property_id, component_type, name and installed_date are required",
        },
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
    if (!prop)
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 },
      );

    const { data, error } = await supabase
      .from("property_components")
      .insert({
        property_id,
        component_type,
        name,
        installed_date,
        lifespan_min_years,
        lifespan_max_years,
        brand: brand ?? null,
        model_number: model_number ?? null,
        notes: notes ?? null,
        last_serviced_date: last_serviced_date ?? null,
      })
      .select("*")
      .single();

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(
      { success: true, component: data },
      { status: 201 },
    );
  } catch (err) {
    console.error("[property-components POST]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
