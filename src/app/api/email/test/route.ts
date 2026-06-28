import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail =
    process.env.RESEND_FROM_EMAIL ?? "PropTrust <notifications@proptrust.co.za>";
  const toEmail = user.email;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Resend is not configured. Add RESEND_API_KEY to your environment." },
      { status: 503 },
    );
  }

  if (!toEmail) {
    return NextResponse.json(
      { error: "No email address on your account." },
      { status: 400 },
    );
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      subject: "PropTrust — test email",
      html: `<p>This is a test email from PropTrust.<br>Your email integration is working correctly.</p><p style="color:#6b7280;font-size:12px;">Sent to ${toEmail} via Resend.</p>`,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id ?? null, to: toEmail });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
