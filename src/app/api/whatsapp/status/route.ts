import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export type WhatsAppStatusResponse = {
  configured: boolean;
  missing: string[];
  phoneNumberId: string | null;
};

function maskId(raw: string): string {
  if (raw.length <= 6) return raw;
  return `${raw.slice(0, 4)}${"*".repeat(raw.length - 7)}${raw.slice(-3)}`;
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
  if (!process.env.WHATSAPP_PHONE_NUMBER_ID) missing.push("WHATSAPP_PHONE_NUMBER_ID");
  if (!process.env.WHATSAPP_BUSINESS_ACCOUNT_ID) missing.push("WHATSAPP_BUSINESS_ACCOUNT_ID");
  if (!process.env.WHATSAPP_ACCESS_TOKEN) missing.push("WHATSAPP_ACCESS_TOKEN");

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID ?? null;

  const body: WhatsAppStatusResponse = {
    configured: missing.length === 0,
    missing,
    phoneNumberId: phoneNumberId ? maskId(phoneNumberId) : null,
  };

  return NextResponse.json(body);
}
