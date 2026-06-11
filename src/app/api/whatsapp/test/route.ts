import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendWhatsApp } from "@/lib/whatsapp";

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

  const result = await sendWhatsApp(
    targetPhone,
    "PropTrust WhatsApp test message. Your integration is working. ✓\n\n" +
      "If you are using the Twilio sandbox, ensure your number has joined the " +
      "sandbox by sending the join code to the sandbox number first.",
  );

  if (!result.success) {
    const sandboxNote = result.error?.includes("not a participant")
      ? " Your phone has not joined the Twilio WhatsApp sandbox yet. " +
        "Send the join code (e.g. 'join <word>-<word>') to the sandbox number to opt in."
      : "";
    return NextResponse.json(
      { error: result.error + sandboxNote },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    sid: result.sid,
    to: targetPhone,
  });
}
