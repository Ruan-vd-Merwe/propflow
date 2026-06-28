import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import {
  score_tenant_property,
  rank_tenant_properties,
} from "@/lib/scoring/engine";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { property_ids } = await request.json();

  const { data: tp } = await supabase
    .from("tenant_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!tp)
    return NextResponse.json(
      { error: "No tenant profile found" },
      { status: 404 },
    );

  const tenantProfile = {
    monthly_income: (tp.monthly_income || 0) / 100,
    rental_budget: (tp.budget_max || 0) / 100,
    total_living_budget: ((tp.budget_max || 0) / 100) * 1.4,
    preferred_suburbs: tp.looking_in_area ? [tp.looking_in_area] : [],
    desired_bedrooms: 1,
    move_in_month: tp.move_in_date
      ? new Date(tp.move_in_date).getMonth() + 1
      : 6,
    employment_type: tp.employment_status,
    has_car: true,
    has_pets: false,
    lifestyle_tags: [],
    must_haves: [],
    dealbreakers: [],
    work_locations: [],
  };

  const { data: properties } = await supabase
    .from("properties")
    .select("*")
    .in("id", property_ids || [])
    .in("status", ["available", "available_from"]);

  if (!properties?.length) return NextResponse.json({ results: [] });

  const propertyData = properties.map((p) => ({
    property_id: p.id,
    suburb: p.suburb,
    rent: (p.asking_rent || 0) / 100,
    bedrooms: p.bedrooms,
    pets_allowed: p.pet_friendly || false,
    suburb_avg_rent: (p.asking_rent || 0) / 100,
    area_tags: p.suburb ? [p.suburb.toLowerCase()] : [],
    property_tags: [p.property_type || "apartment"],
  }));

  // If multiple properties, rank them; otherwise score single
  const results =
    propertyData.length === 1
      ? [score_tenant_property(tenantProfile, propertyData[0])]
      : rank_tenant_properties(propertyData, tenantProfile);

  return NextResponse.json({ results });
}
