import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getSiteUrl, getAuthCallbackUrl, getResetPasswordUrl } from "@/lib/site-url";

export type EmailStatusResponse = {
  resendConfigured: boolean;
  fromEmail: string | null;
  siteUrl: string;
  confirmRedirectUrl: string;
  resetRedirectUrl: string;
};

function maskEmail(raw: string): string {
  // "PropTrust <foo@bar.com>" → "PropTrust <f**@bar.com>"
  const match = raw.match(/<([^>]+)>/);
  const addr = match ? match[1] : raw;
  const [local, domain] = addr.split("@");
  if (!domain || local.length < 2) return raw;
  const masked = `${local[0]}${"*".repeat(Math.max(1, local.length - 1))}@${domain}`;
  return match ? raw.replace(addr, masked) : masked;
}

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const siteUrl = getSiteUrl();
  const rawFrom = process.env.RESEND_FROM_EMAIL ?? null;
  const resendConfigured = !!(process.env.RESEND_API_KEY && rawFrom);

  const body: EmailStatusResponse = {
    resendConfigured,
    fromEmail: rawFrom ? maskEmail(rawFrom) : null,
    siteUrl,
    confirmRedirectUrl: getAuthCallbackUrl("/dashboard"),
    resetRedirectUrl: getResetPasswordUrl(),
  };

  return NextResponse.json(body);
}
