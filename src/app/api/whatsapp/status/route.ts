import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export type WhatsAppStatusResponse = {
  configured: boolean;
  missing: string[];
  fromNumber: string | null;
};

function maskNumber(raw: string): string {
  // Keep prefix and last 3 digits, mask the middle
  if (raw.length <= 8) return raw;
  const start = raw.slice(0, 10); // e.g. "whatsapp:+"
  const last3 = raw.slice(-3);
  const masked = "*".repeat(Math.max(0, raw.length - 13));
  return `${start}${masked}${last3}`;
}

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const missing: string[] = [];
  if (!process.env.TWILIO_ACCOUNT_SID) missing.push("TWILIO_ACCOUNT_SID");
  if (!process.env.TWILIO_AUTH_TOKEN) missing.push("TWILIO_AUTH_TOKEN");
  if (!process.env.TWILIO_WHATSAPP_FROM) missing.push("TWILIO_WHATSAPP_FROM");

  const from = process.env.TWILIO_WHATSAPP_FROM ?? null;

  const body: WhatsAppStatusResponse = {
    configured: missing.length === 0,
    missing,
    fromNumber: from ? maskNumber(from) : null,
  };

  return NextResponse.json(body);
}
