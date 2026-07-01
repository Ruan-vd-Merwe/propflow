import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request) {
  let body: { email?: string; code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const code = body.code?.trim();
  if (!email || !code) {
    return NextResponse.json(
      { error: "email and code are required" },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();

  // Look up matching unconfirmed + unexpired row
  const { data: row, error: lookupErr } = await supabase
    .from("email_confirmations")
    .select("id, user_id, expires_at")
    .eq("email", email)
    .eq("token", code)
    .eq("confirmed", false)
    .single();

  if (lookupErr || !row) {
    return NextResponse.json(
      { error: "Invalid or expired code. Please request a new one." },
      { status: 400 },
    );
  }

  if (new Date(row.expires_at) < new Date()) {
    return NextResponse.json(
      { error: "Code has expired. Please request a new one." },
      { status: 400 },
    );
  }

  // Mark confirmed
  const { error: updateErr } = await supabase
    .from("email_confirmations")
    .update({ confirmed: true })
    .eq("id", row.id);

  if (updateErr) {
    console.error("[verify-confirmation] update email_confirmations failed:", updateErr);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 },
    );
  }

  if (row.user_id) {
    // Confirm the user in Supabase Auth so they can log in
    const { error: authErr } = await supabase.auth.admin.updateUserById(
      row.user_id,
      { email_confirm: true },
    );

    if (authErr) {
      console.error("[verify-confirmation] auth.admin.updateUserById failed:", authErr);
    }

    // Retrieve user metadata to populate profile + tenant data
    const { data: userData } = await supabase.auth.admin.getUserById(row.user_id);
    const m = userData?.user?.user_metadata ?? {};
    const isLandlord = !!(m.is_landlord ?? m.user_type === "landlord");
    const isTenant = !!(m.is_tenant ?? m.user_type === "tenant");
    const isConnector = !!(m.is_connector ?? m.user_type === "connector");

    // Upsert profile with role flags and all metadata
    const { error: profileErr } = await supabase.from("profiles").upsert({
      id: row.user_id,
      full_name: m.full_name ?? userData?.user?.email ?? "",
      email: userData?.user?.email ?? email,
      is_landlord: isLandlord,
      is_tenant: isTenant,
      is_connector: isConnector,
      user_type: isLandlord ? "landlord" : isTenant ? "tenant" : "connector",
      phone: m.phone ?? null,
      province: m.province ?? null,
      city: m.city ?? null,
      whatsapp_opted_in: m.whatsapp_opted_in ?? true,
      email_confirmed: true,
    });

    if (profileErr) {
      console.error("[verify-confirmation] profiles upsert failed:", profileErr);
    }

    // Create tenant_profiles row from signup metadata
    if (isTenant) {
      const { data: existing } = await supabase
        .from("tenant_profiles")
        .select("id")
        .eq("user_id", row.user_id)
        .single();

      if (!existing) {
        const { error: tenantErr } = await supabase
          .from("tenant_profiles")
          .insert({
            user_id: row.user_id,
            sa_id_number: m.sa_id_number ?? null,
            current_area: m.current_area ?? null,
            current_province: m.current_province ?? null,
            looking_in_area: m.looking_in_area ?? null,
            looking_in_province: m.looking_in_province ?? null,
            budget_min: m.budget_min ?? null,
            budget_max: m.budget_max ?? null,
            move_in_date: m.move_in_date ?? null,
            lease_length_months: m.lease_length_months ?? null,
            employment_status: m.employment_status ?? null,
            monthly_income: m.monthly_income ?? null,
            whatsapp_opted_in: m.whatsapp_opted_in ?? true,
          });

        if (tenantErr) {
          console.error("[verify-confirmation] tenant_profiles insert failed:", tenantErr);
        }
      }
    }
  }

  return NextResponse.json({ success: true });
}
