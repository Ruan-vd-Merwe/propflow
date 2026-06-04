import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendBookingToProvider } from "@/lib/whatsapp";

export const runtime = "nodejs";

/**
 * POST /api/service-bookings
 * Creates a service booking and notifies the provider via WhatsApp.
 *
 * Landlord flow: form POST (no tenant_token) — must be authenticated
 * Tenant portal flow: JSON POST with tenant_token — resolved to tenant via token
 */
export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";

  let provider_id: string;
  let property_id: string;
  let scheduled_date: string | undefined;
  let notes: string | undefined;
  let tenant_token: string | undefined;

  if (contentType.includes("application/json")) {
    const body = await req.json();
    provider_id = body.provider_id;
    property_id = body.property_id;
    scheduled_date = body.scheduled_date;
    notes = body.notes;
    tenant_token = body.tenant_token;
  } else {
    const form = await req.formData();
    provider_id = form.get("provider_id") as string;
    property_id = form.get("property_id") as string;
    scheduled_date = (form.get("scheduled_date") as string) || undefined;
    notes = (form.get("notes") as string) || undefined;
  }

  if (!provider_id || !property_id) {
    return NextResponse.json(
      { error: "provider_id and property_id are required" },
      { status: 400 },
    );
  }

  const supabase = createClient();
  const service = createServiceClient();

  let resolvedTenantId: string | null = null;
  let tenantName = "Tenant";
  let propertyName = "";

  if (tenant_token) {
    // Tenant portal flow: resolve tenant from token
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        tenant_token,
      );
    const col = isUuid ? "portal_token" : "access_token";

    const { data: tenant } = await service
      .from("tenants")
      .select("id, full_name, property_id")
      .eq(col, tenant_token)
      .single();

    if (!tenant) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    // Tenant may only book for their own property
    if (tenant.property_id !== property_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    resolvedTenantId = tenant.id;
    tenantName = tenant.full_name;

    const { data: prop } = await service
      .from("properties")
      .select("name")
      .eq("id", property_id)
      .single();
    if (!prop) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 },
      );
    }
    propertyName = prop.name;
  } else {
    // Landlord flow: must be authenticated and own the property
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const { data: property } = await service
      .from("properties")
      .select("id, name, owner_id")
      .eq("id", property_id)
      .single();

    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 },
      );
    }
    if (property.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    propertyName = property.name;
  }

  const { data: provider } = await service
    .from("service_providers")
    .select("id, name, phone, whatsapp")
    .eq("id", provider_id)
    .single();

  if (!provider) {
    return NextResponse.json({ error: "Provider not found" }, { status: 404 });
  }

  const { data: booking, error } = await service
    .from("service_bookings")
    .insert({
      tenant_id: resolvedTenantId,
      provider_id,
      property_id,
      scheduled_date: scheduled_date ?? null,
      notes: notes ?? null,
      status: "requested",
    })
    .select("id, status, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const providerPhone = provider.whatsapp ?? provider.phone;
  if (providerPhone && scheduled_date) {
    sendBookingToProvider({
      phone: providerPhone,
      providerName: provider.name,
      service: "Service booking",
      tenantName,
      property: propertyName,
      date: scheduled_date,
      notes,
    }).catch(console.error);
  }

  if (!contentType.includes("application/json")) {
    return NextResponse.redirect(new URL("/services?booked=1", req.url));
  }

  return NextResponse.json({ success: true, booking }, { status: 201 });
}
