import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { parseInboundEmail, extractPropertyId } from "@/lib/inbound-email";
import type { InboundEmail } from "@/lib/inbound-email";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * POST /api/webhooks/inbound-email
 *
 * Receives parsed inbound emails from Postmark (or another provider via the
 * adapter layer). This is the entry point for the body-corporate notice pipeline.
 *
 * ── Setup ──────────────────────────────────────────────────────────────────────
 * 1. DNS: add an MX record for inbound.proptrust.co.za → Postmark's inbound MX.
 * 2. Postmark: create an inbound server, set the webhook URL to:
 *      https://<your-domain>/api/webhooks/inbound-email
 *    and configure the inbound domain as inbound.proptrust.co.za.
 * 3. Auth: set INBOUND_WEBHOOK_TOKEN in .env.local. Configure Postmark to send
 *    it via the Authorization header (basic auth or bearer token).
 *    Alternatively, for Postmark you can verify via the hook secret.
 * 4. Per-property address: the owner sets a forwarding rule on their email so
 *    body-corporate mail lands at: notices+<propertyId>@inbound.proptrust.co.za
 *
 * ── Pipeline ───────────────────────────────────────────────────────────────────
 * 1. Parse via provider adapter → InboundEmail
 * 2. Extract propertyId from the recipient address
 * 3. Dedupe on source_message_id
 * 4. Verify sender against allowlist + SPF/DKIM/DMARC verdicts
 * 5. Store raw email JSON + PDF attachments in Supabase Storage
 * 6. Create notices row (status = 'received')
 * 7. ACK with 200 immediately
 * 8. Fire async extraction (POST /api/notices/extract) — never block the webhook
 */

const MAX_PDF_BYTES = 25 * 1024 * 1024;

function verifyWebhookAuth(req: NextRequest): boolean {
  const token = process.env.INBOUND_WEBHOOK_TOKEN;
  if (!token) return true; // no token configured = dev mode, accept all

  const auth = req.headers.get("authorization") ?? "";
  return (
    auth === `Bearer ${token}` ||
    auth === `Basic ${Buffer.from(token).toString("base64")}`
  );
}

async function checkSenderAllowed(
  supabase: ReturnType<typeof createServiceClient>,
  propertyId: string,
  senderEmail: string,
  email: InboundEmail,
): Promise<boolean> {
  // Check SPF/DKIM/DMARC — any hard fail = reject
  if (email.auth.spf === "fail" || email.auth.dkim === "fail") {
    return false;
  }

  const { data: rules } = await supabase
    .from("notice_sender_allowlist")
    .select("sender_pattern")
    .eq("property_id", propertyId);

  if (!rules || rules.length === 0) return false;

  const sender = senderEmail.toLowerCase();
  const senderDomain = "@" + sender.split("@")[1];

  return rules.some((r) => {
    const pattern = r.sender_pattern.toLowerCase();
    return pattern === sender || pattern === senderDomain;
  });
}

export async function POST(req: NextRequest) {
  // 1. Authenticate webhook
  if (!verifyWebhookAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let email: InboundEmail;
  try {
    const body = await req.json();
    email = parseInboundEmail(body);
  } catch (err) {
    console.error("[inbound-email] Parse failed:", err);
    return NextResponse.json(
      { error: "Invalid payload" },
      { status: 400 },
    );
  }

  // 2. Extract property ID from recipient address
  const propertyId = extractPropertyId(email.to);
  if (!propertyId) {
    console.warn("[inbound-email] No property ID in recipient:", email.to);
    return NextResponse.json({ ok: true, skipped: "no property ID" });
  }

  const supabase = createServiceClient();

  // Verify property exists
  const { data: property } = await supabase
    .from("properties")
    .select("id")
    .eq("id", propertyId)
    .single();

  if (!property) {
    console.warn("[inbound-email] Property not found:", propertyId);
    return NextResponse.json({ ok: true, skipped: "property not found" });
  }

  // 3. Dedupe on Message-ID
  const { data: existing } = await supabase
    .from("notices")
    .select("id")
    .eq("source_message_id", email.messageId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ok: true, skipped: "duplicate" });
  }

  // 4. Verify sender
  const senderAllowed = await checkSenderAllowed(
    supabase,
    propertyId,
    email.from,
    email,
  );
  const verificationStatus = senderAllowed ? "verified" : "unverified";

  // 5. Store raw email JSON
  const emailPath = `${propertyId}/${email.messageId}/email.json`;
  await supabase.storage
    .from("bc-notices")
    .upload(emailPath, email.rawJson, {
      contentType: "application/json",
      upsert: false,
    });

  // 5b. Store PDF attachments (first PDF only)
  let pdfPath: string | null = null;
  const pdfAttachment = email.attachments.find(
    (a) =>
      a.contentType === "application/pdf" &&
      a.contentLength <= MAX_PDF_BYTES,
  );

  if (pdfAttachment) {
    pdfPath = `${propertyId}/${email.messageId}/${pdfAttachment.filename}`;
    await supabase.storage
      .from("bc-notices")
      .upload(pdfPath, pdfAttachment.content, {
        contentType: "application/pdf",
        upsert: false,
      });
  }

  // 6. Create notices row
  const { data: notice, error: insertErr } = await supabase
    .from("notices")
    .insert({
      property_id: propertyId,
      source_message_id: email.messageId,
      sender_email: email.from,
      subject: email.subject,
      verification_status: verificationStatus,
      raw_email_path: emailPath,
      pdf_path: pdfPath,
      status: "received",
    })
    .select("id")
    .single();

  if (insertErr) {
    console.error("[inbound-email] Insert failed:", insertErr);
    return NextResponse.json(
      { error: "Failed to store notice" },
      { status: 500 },
    );
  }

  // 7. ACK immediately — the webhook provider needs a fast 200
  // 8. Fire async extraction (fire-and-forget)
  if (pdfPath && notice) {
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const hookSecret = process.env.SUPABASE_HOOK_SECRET;

    fetch(`${siteUrl}/api/notices/extract`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(hookSecret ? { Authorization: `Bearer ${hookSecret}` } : {}),
      },
      body: JSON.stringify({ notice_id: notice.id }),
    }).catch((err) => {
      console.error("[inbound-email] Failed to trigger extraction:", err);
    });
  }

  return NextResponse.json({ ok: true, notice_id: notice?.id });
}
