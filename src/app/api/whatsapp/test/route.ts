import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendCustomMessage } from "@/lib/whatsapp";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  // Accept an explicit phone from the request body
  let targetPhone: string | null = null;
  try {
    const body = (await request.json()) as { phone?: string };
    if (typeof body.phone === "string" && body.phone.trim()) {
      targetPhone = body.phone.trim();
    }
  } catch {
    // body may be empty — fall through to profile lookup
  }

  // Fall back to the logged-in user's profile phone
  if (!targetPhone) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("phone")
      .eq("id", user.id)
      .single();
    targetPhone = (profile as { phone: string | null } | null)?.phone ?? null;
  }

  if (!targetPhone) {
    return NextResponse.json(
      {
        error:
          "No phone number provided and no phone on your profile. " +
          "Add your phone in Settings or pass a number in the request.",
      },
      { status: 400 },
    );
  }

  // Self-triggered test send to the logged-in user's own number — sent via
  // the CUSTOM_MESSAGE template (Meta requires an approved template for any
  // business-initiated message; see the founder runbook to register it).
  const result = await sendCustomMessage(
    targetPhone,
    true,
    "PropTrust WhatsApp test message. Your integration is working.",
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    providerMessageId: result.providerMessageId,
    to: targetPhone,
  });
}
