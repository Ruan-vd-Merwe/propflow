import type { SupabaseClient } from "@supabase/supabase-js";
import type { Notice, OwnerNotificationType } from "../types";

type ResendClient = {
  emails: {
    send: (opts: {
      from: string;
      to: string[];
      subject: string;
      html: string;
    }) => Promise<{ data?: { id: string } | null; error?: { message: string } | null }>;
  };
};

function getResend(): ResendClient | null {
  if (!process.env.RESEND_API_KEY) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Resend } = require("resend");
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM_ADDRESS =
  process.env.RESEND_FROM_EMAIL ?? "PropTrust <notifications@proptrust.co.za>";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://proptrust.co.za";

function noticeEmailHtml(opts: {
  ownerName: string;
  propertyName: string;
  notice: Notice;
  pdfUrl: string | null;
}): { subject: string; html: string } {
  const { ownerName, propertyName, notice } = opts;

  const isUnverified = notice.verification_status === "unverified";
  const subject = isUnverified
    ? `[Review needed] Notice received for ${propertyName}`
    : `Body corporate notice: ${notice.title ?? notice.subject ?? "New notice"}`;

  const summaryBlock = notice.summary
    ? `<p style="margin:12px 0;color:#334155;">${notice.summary}</p>`
    : "";

  const deadlineBlock = notice.deadline
    ? `<p style="margin:8px 0;"><strong>Deadline:</strong> ${new Date(notice.deadline + "T00:00:00").toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}</p>`
    : "";

  const actionBlock = notice.action_required
    ? `<p style="margin:8px 0;padding:8px 12px;background:#fef3c7;border-radius:6px;color:#92400e;font-weight:600;">Action required from you</p>`
    : "";

  const unverifiedBanner = isUnverified
    ? `<div style="margin:0 0 16px;padding:12px;background:#fee2e2;border-radius:6px;color:#991b1b;font-size:13px;">
        This email came from an unrecognised sender and needs your review before it can be treated as a trusted notice.
      </div>`
    : "";

  const viewLink = `${SITE_URL}/properties/${notice.property_id}/notices/${notice.id}`;

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
      <h2 style="color:#0f172a;margin:0 0 16px;">Body Corporate Notice</h2>
      ${unverifiedBanner}
      <p style="margin:0 0 4px;color:#64748b;font-size:13px;">${propertyName}</p>
      <h3 style="color:#0f172a;margin:0 0 12px;">${notice.title ?? notice.subject ?? "New notice"}</h3>
      ${summaryBlock}
      ${deadlineBlock}
      ${actionBlock}
      <a href="${viewLink}" style="display:inline-block;margin:16px 0;padding:10px 20px;background:#1d4ed8;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
        View notice
      </a>
      ${opts.pdfUrl ? `<p style="margin:8px 0;font-size:13px;"><a href="${opts.pdfUrl}" style="color:#2563eb;">Download original PDF</a></p>` : ""}
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
      <p style="color:#94a3b8;font-size:12px;">
        Hi ${ownerName}, this is an automated notice from PropTrust.
        You're receiving this because a body corporate email was forwarded to your property's inbound address.
      </p>
    </div>`;

  return { subject, html };
}

export async function notifyOwnerOfNotice(opts: {
  supabase: SupabaseClient;
  notice: Notice;
  propertyName: string;
  ownerName: string;
  ownerEmail: string;
  ownerId: string;
  pdfSignedUrl: string | null;
}): Promise<void> {
  const { supabase, notice, propertyName, ownerName, ownerEmail, ownerId } = opts;

  const notifType: OwnerNotificationType =
    notice.verification_status === "unverified"
      ? "notice_unverified"
      : notice.status === "extracted"
        ? "notice_extracted"
        : "notice_received";

  const notifTitle =
    notice.verification_status === "unverified"
      ? `Unverified notice received for ${propertyName}`
      : `New body corporate notice: ${notice.title ?? notice.subject ?? "notice"}`;

  await supabase.from("owner_notifications").insert({
    owner_id: ownerId,
    property_id: notice.property_id,
    type: notifType,
    title: notifTitle,
    body: notice.summary ?? null,
    link: `/properties/${notice.property_id}/notices/${notice.id}`,
  });

  const resend = getResend();
  const { subject, html } = noticeEmailHtml({
    ownerName,
    propertyName,
    notice,
    pdfUrl: opts.pdfSignedUrl,
  });

  if (!resend) {
    console.log(`[notices DEV] To: ${ownerEmail} | Subject: ${subject}`);
    return;
  }

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: [ownerEmail],
      subject,
      html,
    });
  } catch (err) {
    console.error("[notices] Failed to send email:", err);
  }
}
