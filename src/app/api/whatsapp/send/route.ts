import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendWhatsApp } from "@/lib/whatsapp";

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

  const fullMessage = message.trim() + "\n\n— PropTrust";
  const result = await sendWhatsApp(tenant.phone, fullMessage);

  // Log the message
  await supabase.from("communications_log").insert({
    tenant_id: tenant_id,
    type: "whatsapp_custom",
    subject: message.slice(0, 100),
    sent_at: new Date().toISOString(),
    status: result.success ? "sent" : "failed",
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
