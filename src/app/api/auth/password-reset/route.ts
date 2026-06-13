import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: Request) {
  // Lazy init — env vars are only available at runtime, not build time
  const resend = new Resend(process.env.RESEND_API_KEY);
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { email } = (await request.json()) as { email: string };

  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: "https://proptrust.co.za/reset-password",
      },
    });

    if (error || !data?.properties?.action_link) {
      // User not found or other error — return success for security
      // (do not reveal whether the email is registered)
      return NextResponse.json({ success: true });
    }

    const resetUrl = data.properties.action_link;

    await resend.emails.send({
      from: "PropTrust <noreply@proptrust.co.za>",
      to: email,
      subject: "Reset your PropTrust password",
      html: `
        <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
          background:#f8fafc;margin:0;padding:40px 20px;">
          <div style="max-width:520px;margin:0 auto;background:white;border-radius:16px;
            padding:40px;border:1px solid #e2e8f0;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:28px;">
              <div style="width:32px;height:32px;background:#0f172a;border-radius:8px;
                display:flex;align-items:center;justify-content:center;">
                <span style="color:white;font-weight:700;">P</span>
              </div>
              <span style="font-weight:700;font-size:17px;color:#0f172a;">PropTrust</span>
            </div>
            <h1 style="font-size:20px;font-weight:700;color:#0f172a;margin:0 0 12px;">
              Reset your password
            </h1>
            <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 24px;">
              Click the button below to reset your PropTrust password.
              This link expires in 1 hour.
            </p>
            <a href="${resetUrl}"
              style="display:block;text-align:center;background:#1e40af;color:white;
              padding:13px 24px;border-radius:9px;font-weight:700;font-size:15px;
              text-decoration:none;margin-bottom:20px;">
              Reset my password
            </a>
            <p style="color:#94a3b8;font-size:11px;margin:0;">
              If you did not request this, you can safely ignore this email.
            </p>
          </div>
          <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:24px;">
            PropTrust · proptrust.co.za · Cape Town, South Africa
          </p>
        </body>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Password reset failed:", err);
    // Always return success — never reveal errors to prevent email enumeration
    return NextResponse.json({ success: true });
  }
}
