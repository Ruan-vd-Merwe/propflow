import { NextResponse } from "next/server";
import { randomInt } from "node:crypto";
import { Resend } from "resend";
import { createServiceClient } from "@/lib/supabase/service";
import { confirmationCodeEmail } from "@/lib/email-templates";

const FROM_ADDRESS =
  process.env.RESEND_FROM_EMAIL ?? "PropTrust <noreply@proptrust.co.za>";

export async function POST(request: Request) {
  let body: { email?: string; userId?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const userId = body.userId ?? null;
  const code = String(randomInt(100000, 1000000));
  const supabase = createServiceClient();

  // Delete any prior unconfirmed rows for this email
  const { error: deleteErr } = await supabase
    .from("email_confirmations")
    .delete()
    .eq("email", email)
    .eq("confirmed", false);

  if (deleteErr) {
    console.error("[send-confirmation] delete prior rows failed:", deleteErr);
    return NextResponse.json(
      { error: "Failed to prepare confirmation" },
      { status: 500 },
    );
  }

  // Insert new confirmation row (1 hour expiry)
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const { data: row, error: insertErr } = await supabase
    .from("email_confirmations")
    .insert({
      email,
      user_id: userId,
      token: code,
      confirmed: false,
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (insertErr) {
    console.error("[send-confirmation] insert failed:", insertErr);
    return NextResponse.json(
      { error: "Failed to create confirmation" },
      { status: 500 },
    );
  }

  // Send the code email via Resend
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.log(`[send-confirmation DEV] code=${code} email=${email}`);
    return NextResponse.json({ success: true });
  }

  const resend = new Resend(resendKey);
  const { subject, html } = confirmationCodeEmail(code);

  try {
    const { error: sendErr } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: [email],
      subject,
      html,
    });

    if (sendErr) {
      console.error("[send-confirmation] Resend error:", sendErr);
      // Roll back the row
      await supabase.from("email_confirmations").delete().eq("id", row.id);
      return NextResponse.json(
        { error: "Failed to send confirmation email" },
        { status: 502 },
      );
    }
  } catch (err) {
    console.error("[send-confirmation] Resend threw:", err);
    await supabase.from("email_confirmations").delete().eq("id", row.id);
    return NextResponse.json(
      { error: "Failed to send confirmation email" },
      { status: 502 },
    );
  }

  return NextResponse.json({ success: true });
}
