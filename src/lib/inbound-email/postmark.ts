import type {
  InboundEmail,
  InboundAttachment,
  SpfResult,
  DkimResult,
  DmarcResult,
} from "./types";

type PostmarkAttachment = {
  Name: string;
  ContentType: string;
  ContentLength: number;
  Content: string; // base64
};

type PostmarkHeaders = {
  Name: string;
  Value: string;
}[];

type PostmarkInbound = {
  MessageID: string;
  From: string;
  FromFull?: { Email: string };
  To: string;
  Subject: string;
  TextBody: string;
  HtmlBody: string;
  Date: string;
  Headers: PostmarkHeaders;
  Attachments: PostmarkAttachment[];
};

function normalizeSpf(headers: PostmarkHeaders): SpfResult {
  const h = headers.find(
    (h) => h.Name.toLowerCase() === "received-spf",
  );
  if (!h) return "none";
  const val = h.Value.toLowerCase();
  if (val.startsWith("pass")) return "pass";
  if (val.startsWith("fail")) return "fail";
  if (val.startsWith("softfail")) return "softfail";
  if (val.startsWith("neutral")) return "neutral";
  return "unknown";
}

function normalizeDkim(headers: PostmarkHeaders): DkimResult {
  const h = headers.find(
    (h) => h.Name.toLowerCase() === "x-postmark-dkim",
  );
  if (!h) return "none";
  const val = h.Value.toLowerCase();
  if (val === "pass" || val === "true") return "pass";
  if (val === "fail" || val === "false") return "fail";
  return "unknown";
}

function normalizeDmarc(headers: PostmarkHeaders): DmarcResult {
  const auth = headers.find(
    (h) => h.Name.toLowerCase() === "authentication-results",
  );
  if (!auth) return "none";
  const match = auth.Value.match(/dmarc=(pass|fail|none)/i);
  if (!match) return "none";
  return match[1].toLowerCase() as DmarcResult;
}

const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;

export function parsePostmarkInbound(body: unknown): InboundEmail {
  const pm = body as PostmarkInbound;

  if (!pm.MessageID) {
    throw new Error("Missing MessageID in Postmark payload");
  }

  const attachments: InboundAttachment[] = (pm.Attachments ?? [])
    .filter((a) => a.ContentLength <= MAX_ATTACHMENT_BYTES)
    .map((a) => ({
      filename: a.Name,
      contentType: a.ContentType,
      contentLength: a.ContentLength,
      content: Buffer.from(a.Content, "base64"),
    }));

  const headers = pm.Headers ?? [];

  return {
    messageId: pm.MessageID,
    from: pm.FromFull?.Email ?? pm.From,
    to: pm.To,
    subject: pm.Subject ?? "(no subject)",
    textBody: pm.TextBody ?? "",
    htmlBody: pm.HtmlBody ?? "",
    date: pm.Date ?? new Date().toISOString(),
    auth: {
      spf: normalizeSpf(headers),
      dkim: normalizeDkim(headers),
      dmarc: normalizeDmarc(headers),
    },
    attachments,
    rawJson: JSON.stringify(body),
  };
}
