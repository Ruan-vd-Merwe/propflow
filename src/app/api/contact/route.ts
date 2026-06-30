import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createServiceClient } from "@/lib/supabase/service";

const CONTACT_TO = "ruanvandermerwe343@gmail.com";
const FROM_ADDRESS =
  process.env.RESEND_FROM_EMAIL ?? "PropTrust <noreply@proptrust.co.za>";

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const { name, email, subject, message, source } = body as Record<string, string>;

  if (
    typeof name !== "string" || !name.trim() ||
    typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    typeof subject !== "string" || !subject.trim() ||
    typeof message !== "string" || !message.trim()
  ) {
    return NextResponse.json({ ok: false, error: "Missing or invalid fields" }, { status: 400 });
  }

  const safeSource =
    source === "contact_page" ? "contact_page" : "homepage";

  const db = createServiceClient();

  const { data: row, error: insertError } = await db
    .from("contact_messages")
    .insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
      source: safeSource,
      status: "new",
    })
    .select("id")
    .single();

  if (insertError || !row) {
    console.error("[contact] DB insert failed:", insertError);
    return NextResponse.json({ ok: false, error: "Could not save your message" }, { status: 500 });
  }

  const resend = getResend();
  let emailStatus: "emailed" | "failed" = "failed";

  if (!resend) {
    console.log(`[contact DEV] Would email ${CONTACT_TO} re: ${subject}`);
    emailStatus = "emailed";
  } else {
    try {
      const { error: sendError } = await resend.emails.send({
        from: FROM_ADDRESS,
        to: [CONTACT_TO],
        replyTo: `${name.trim()} <${email.trim()}>`,
        subject: `[PropTrust Contact] ${subject.trim()}`,
        html: `
<p><strong>Name:</strong> ${name.trim()}</p>
<p><strong>Email:</strong> ${email.trim()}</p>
<p><strong>Subject:</strong> ${subject.trim()}</p>
<p><strong>Source:</strong> ${safeSource}</p>
<hr />
<p>${message.trim().replace(/\n/g, "<br />")}</p>
        `.trim(),
      });
      if (sendError) {
        console.error("[contact] Resend error:", sendError);
      } else {
        emailStatus = "emailed";
      }
    } catch (err) {
      console.error("[contact] Resend threw:", err);
    }
  }

  await db
    .from("contact_messages")
    .update({ status: emailStatus })
    .eq("id", row.id);

  return NextResponse.json({ ok: true });
}
