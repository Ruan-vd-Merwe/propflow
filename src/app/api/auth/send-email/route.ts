import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

type EmailType = "confirmation" | "password_reset" | "welcome";

export async function POST(request: Request) {
  const {
    type,
    email,
    name,
    confirmationUrl,
    resetUrl,
  }: {
    type: EmailType;
    email: string;
    name?: string;
    confirmationUrl?: string;
    resetUrl?: string;
  } = await request.json();

  if (!email || !type) {
    return NextResponse.json(
      { error: "email and type required" },
      { status: 400 },
    );
  }

  const baseStyle = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #f8fafc;
    margin: 0;
    padding: 40px 20px;
  `;

  const cardStyle = `
    max-width: 520px;
    margin: 0 auto;
    background: white;
    border-radius: 16px;
    padding: 40px;
    border: 1px solid #e2e8f0;
  `;

  const logoHtml = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:32px;">
      <div style="width:36px;height:36px;background:#0f172a;border-radius:8px;
        display:flex;align-items:center;justify-content:center;">
        <span style="color:white;font-weight:700;font-size:16px;">P</span>
      </div>
      <span style="font-weight:700;font-size:18px;color:#0f172a;">PropTrust</span>
    </div>
  `;

  let subject = "";
  let html = "";

  if (type === "confirmation" && confirmationUrl) {
    subject = "Confirm your PropTrust account";
    html = `
      <body style="${baseStyle}">
        <div style="${cardStyle}">
          ${logoHtml}
          <h1 style="font-size:22px;font-weight:700;color:#0f172a;margin:0 0 12px;">
            Confirm your account
          </h1>
          <p style="color:#64748b;font-size:15px;line-height:1.6;margin:0 0 28px;">
            Hi ${name ?? "there"}, welcome to PropTrust.
            Click the button below to confirm your email address and activate your account.
          </p>
          <a href="${confirmationUrl}"
            style="display:block;text-align:center;background:#1e40af;color:white;
            padding:14px 28px;border-radius:10px;font-weight:700;font-size:16px;
            text-decoration:none;margin-bottom:24px;">
            Confirm my account
          </a>
          <p style="color:#94a3b8;font-size:13px;margin:0 0 8px;">Or copy this link:</p>
          <p style="color:#3b82f6;font-size:12px;word-break:break-all;margin:0 0 24px;">
            ${confirmationUrl}
          </p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin-bottom:20px;">
          <p style="color:#94a3b8;font-size:12px;margin:0;">
            This link expires in 24 hours. If you did not create a PropTrust account,
            you can ignore this email.
          </p>
        </div>
        <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:24px;">
          PropTrust · proptrust.co.za · Cape Town, South Africa
        </p>
      </body>
    `;
  }

  if (type === "password_reset" && resetUrl) {
    subject = "Reset your PropTrust password";
    html = `
      <body style="${baseStyle}">
        <div style="${cardStyle}">
          ${logoHtml}
          <h1 style="font-size:22px;font-weight:700;color:#0f172a;margin:0 0 12px;">
            Reset your password
          </h1>
          <p style="color:#64748b;font-size:15px;line-height:1.6;margin:0 0 28px;">
            We received a request to reset the password for your PropTrust account.
            Click below to choose a new password.
          </p>
          <a href="${resetUrl}"
            style="display:block;text-align:center;background:#1e40af;color:white;
            padding:14px 28px;border-radius:10px;font-weight:700;font-size:16px;
            text-decoration:none;margin-bottom:24px;">
            Reset my password
          </a>
          <p style="color:#94a3b8;font-size:13px;margin:0 0 8px;">Or copy this link:</p>
          <p style="color:#3b82f6;font-size:12px;word-break:break-all;margin:0 0 24px;">
            ${resetUrl}
          </p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin-bottom:20px;">
          <p style="color:#94a3b8;font-size:12px;margin:0;">
            This link expires in 1 hour. If you did not request a password reset,
            you can ignore this email safely.
          </p>
        </div>
        <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:24px;">
          PropTrust · proptrust.co.za · Cape Town, South Africa
        </p>
      </body>
    `;
  }

  if (!html) {
    return NextResponse.json(
      { error: "Invalid email type or missing URL" },
      { status: 400 },
    );
  }

  const { error } = await resend.emails.send({
    from: "PropTrust <noreply@proptrust.co.za>",
    to: email,
    subject,
    html,
  });

  if (error) {
    console.error("Resend error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
