import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Resend } from "resend";

// NOTE: Supabase also sends its own reset email when generateLink is called.
// To suppress it, go to: Supabase > Authentication > Email Templates >
// Reset Password and replace the body with a blank/suppressed template
// (e.g. subject "[no-send] Password reset", body "<p>This email is suppressed.</p>").
// Our Resend email is the real one that users should receive.

export async function POST(request: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  let email: string;
  try {
    const body = (await request.json()) as { email?: string };
    email = body.email?.trim().toLowerCase() ?? "";
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  // Always return success at the end regardless of what happens —
  // never reveal whether the email address is registered.
  try {
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: "https://proptrust.co.za/reset-password",
      },
    });

    if (error) {
      console.error("generateLink error:", error.message);
      return NextResponse.json({ success: true });
    }

    if (!data?.properties?.action_link) {
      console.error("No action_link in response");
      return NextResponse.json({ success: true });
    }

    const rawLink = data.properties.action_link;

    console.log("Reset link domain:", new URL(rawLink).hostname);

    const { data: sendData, error: sendError } = await resend.emails.send({
      from: "PropTrust <noreply@proptrust.co.za>",
      to: email,
      subject: "Reset your PropTrust password",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width,initial-scale=1">
        </head>
        <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
          background:#f8fafc;margin:0;padding:40px 20px;">
          <div style="max-width:520px;margin:0 auto;background:white;border-radius:16px;
            padding:40px;border:1px solid #e2e8f0;">

            <div style="display:flex;align-items:center;gap:10px;margin-bottom:32px;">
              <div style="width:36px;height:36px;background:#0f172a;border-radius:8px;
                display:flex;align-items:center;justify-content:center;">
                <span style="color:white;font-weight:700;font-size:18px;">P</span>
              </div>
              <span style="font-weight:700;font-size:18px;color:#0f172a;">PropTrust</span>
            </div>

            <h1 style="font-size:22px;font-weight:700;color:#0f172a;margin:0 0 12px;">
              Reset your password
            </h1>

            <p style="color:#64748b;font-size:15px;line-height:1.6;margin:0 0 28px;">
              We received a request to reset the password for your PropTrust account.
              Click the button below to choose a new password.
            </p>

            <a href="${rawLink}"
              style="display:block;text-align:center;background:#1e40af;color:white;
              padding:14px 28px;border-radius:10px;font-weight:700;font-size:16px;
              text-decoration:none;margin-bottom:24px;">
              Reset my password
            </a>

            <p style="color:#94a3b8;font-size:13px;margin:0 0 8px;">
              Or copy this link into your browser:
            </p>
            <p style="color:#3b82f6;font-size:12px;word-break:break-all;margin:0 0 28px;">
              ${rawLink}
            </p>

            <hr style="border:none;border-top:1px solid #e2e8f0;margin-bottom:20px;">

            <p style="color:#94a3b8;font-size:12px;margin:0;">
              This link expires in 1 hour. If you did not request a password reset,
              you can safely ignore this email.
            </p>
          </div>

          <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:24px;">
            PropTrust (Pty) Ltd &middot; proptrust.co.za &middot; Cape Town, South Africa
          </p>
        </body>
        </html>
      `,
    });

    if (sendError) {
      console.error("Resend error:", sendError);
    } else {
      console.log("Reset email sent:", sendData?.id);
    }
  } catch (err) {
    console.error("Password reset error:", err);
  }

  return NextResponse.json({ success: true });
}
