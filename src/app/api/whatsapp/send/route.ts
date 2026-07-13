import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendCustomMessage } from "@/lib/whatsapp";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tenant_id, message } = await request.json();

  if (!tenant_id || !message?.trim()) {
    return NextResponse.json(
      { error: "tenant_id and message required" },
      { status: 400 },
    );
  }

  // Verify landlord owns this tenant's property
  const { data: tenant } = await supabase
    .from("tenants")
    .select("*, properties!inner(owner_id)")
    .eq("id", tenant_id)
    .single();

  if (!tenant || (tenant.properties as { owner_id: string }).owner_id !== user.id) {
    return NextResponse.json(
      { error: "Tenant not found or access denied" },
      { status: 403 },
    );
  }

  if (!tenant.phone) {
    return NextResponse.json(
      { error: "Tenant has no phone number on record" },
      { status: 400 },
    );
  }

  // tenants table has no whatsapp_opted_in column (only profiles/
  // tenant_profiles do) — landlord-entered records are treated as opted-in
  // by default; see the WhatsApp founder runbook. Sent as a single template
  // parameter, not free text — Meta forbids arbitrary body text for
  // business-initiated messages outside a 24h session window.
  const result = await sendCustomMessage(tenant.phone, true, message.trim());

  // Log the message
  await supabase.from("communications_log").insert({
    tenant_id: tenant_id,
    type: "whatsapp_custom",
    subject: message.slice(0, 100),
    sent_at: new Date().toISOString(),
    status: result.ok ? "sent" : "failed",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
