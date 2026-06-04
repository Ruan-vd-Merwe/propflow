import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendIntroductionEmails } from "@/lib/resend";
import { sendIntroductionWhatsApp } from "@/lib/whatsapp";
import { displayName } from "@/lib/matching";

export const runtime = "nodejs";

// POST /api/introductions — landlord requests introduction to a tenant
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json();
  const { tenant_id, property_id } = body;

  if (!tenant_id || !property_id) {
    return NextResponse.json(
      { error: "tenant_id and property_id are required" },
      { status: 400 },
    );
  }

  // Verify the property belongs to this landlord
  const { data: property } = await supabase
    .from("properties")
    .select("id, name, suburb, province")
    .eq("id", property_id)
    .eq("owner_id", user.id)
    .single();

  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  // Create introduction request (unique constraint prevents duplicates)
  const { data: intro, error: introError } = await supabase
    .from("introduction_requests")
    .insert({ landlord_id: user.id, tenant_id, property_id, status: "pending" })
    .select()
    .single();

  if (introError) {
    if (introError.code === "23505") {
      return NextResponse.json(
        { error: "Introduction already requested" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: introError.message }, { status: 500 });
  }

  // Fetch emails via service client (bypasses RLS)
  const service = createServiceClient();

  const [{ data: landlordProfile }, { data: tenantProfile }] =
    await Promise.all([
      service
        .from("profiles")
        .select("full_name, email, phone")
        .eq("id", user.id)
        .single(),
      service
        .from("profiles")
        .select("full_name, email, phone")
        .eq("id", tenant_id)
        .single(),
    ]);

  if (landlordProfile && tenantProfile) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://proptrust.co.za";
    // Email (existing)
    await sendIntroductionEmails({
      tenantEmail: tenantProfile.email,
      tenantFullName: tenantProfile.full_name,
      tenantDisplayName: displayName(tenantProfile.full_name),
      landlordEmail: landlordProfile.email,
      landlordName: landlordProfile.full_name,
      propertyName: property.name,
      propertySuburb: property.suburb ?? "",
      propertyProvince: property.province ?? "",
      appUrl,
    });
    // WhatsApp (fire-and-forget)
    if (tenantProfile.phone) {
      sendIntroductionWhatsApp({
        phone: tenantProfile.phone,
        name: tenantProfile.full_name,
        suburb: property.suburb ?? property.province ?? "your area",
      }).catch(console.error);
    }
  }

  return NextResponse.json(
    { success: true, introduction: intro },
    { status: 201 },
  );
}

// GET /api/introductions?property_id=... — landlord checks existing requests
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const propertyId = searchParams.get("property_id");

  let query = supabase
    .from("introduction_requests")
    .select("*")
    .eq("landlord_id", user.id)
    .order("created_at", { ascending: false });

  if (propertyId) {
    query = query.eq("property_id", propertyId);
  }

  const { data, error } = await query;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
