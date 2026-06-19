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

  // Set profiles.email_confirmed = true
  if (row.user_id) {
    const { error: profileErr } = await supabase
      .from("profiles")
      .update({ email_confirmed: true })
      .eq("id", row.user_id);

    if (profileErr) {
      console.error("[verify-confirmation] profiles update failed:", profileErr);
    }

    // Confirm the user in Supabase Auth so they can log in
    const { error: authErr } = await supabase.auth.admin.updateUserById(
      row.user_id,
      { email_confirm: true },
    );

    if (authErr) {
      console.error("[verify-confirmation] auth.admin.updateUserById failed:", authErr);
    }
  }

  return NextResponse.json({ success: true });
}
