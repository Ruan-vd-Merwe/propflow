import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendTenantPaidNotification } from "@/lib/whatsapp";

export const runtime = "nodejs";

/**
 * POST /api/tenant/paid
 * Token-authenticated: tenant says "I've paid".
 * Notifies landlord via WhatsApp.
 */
export async function POST(req: NextRequest) {
  const { token, payment_id } = await req.json();

  if (!token) {
    return NextResponse.json({ error: "token required" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Resolve token → tenant
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      token,
    );
  const col = isUuid ? "portal_token" : "access_token";

  const { data: tenant } = await supabase
    .from("tenants")
    .select(
      `
      id, full_name, monthly_rent,
      properties!inner (
        name,
        profiles!inner ( full_name, phone, whatsapp_opted_in )
      )
    `,
    )
    .eq(col, token)
    .single();

  if (!tenant) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const property: any = (tenant as any).properties;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const landlord: any = property.profiles;

  const landlordOptedIn = landlord.whatsapp_opted_in ?? true;

  // Send WhatsApp to landlord
  if (landlord.phone) {
    sendTenantPaidNotification({
      landlordPhone: landlord.phone,
      optedIn: landlordOptedIn,
      tenantName: tenant.full_name,
      amount: payment_id ? 0 : tenant.monthly_rent, // try to get actual amount below
      property: property.name,
    }).catch(console.error);
  }

  // Look up actual payment amount if payment_id provided
  if (payment_id && landlord.phone) {
    const { data: pmt } = await supabase
      .from("payments")
      .select("amount")
      .eq("id", payment_id)
      .eq("tenant_id", tenant.id)
      .single();

    if (pmt && landlord.phone) {
      sendTenantPaidNotification({
        landlordPhone: landlord.phone,
        optedIn: landlordOptedIn,
        tenantName: tenant.full_name,
        amount: pmt.amount,
        property: property.name,
      }).catch(console.error);
    }
  }

  return NextResponse.json({ success: true });
}
