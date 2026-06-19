export type SpfResult = "pass" | "fail" | "softfail" | "neutral" | "none" | "unknown";
export type DkimResult = "pass" | "fail" | "none" | "unknown";
export type DmarcResult = "pass" | "fail" | "none" | "unknown";

export type EmailAuthVerdicts = {
  spf: SpfResult;
  dkim: DkimResult;
  dmarc: DmarcResult;
};

export type InboundAttachment = {
  filename: string;
  contentType: string;
  contentLength: number;
  content: Buffer;
};

export type InboundEmail = {
  messageId: string;
  from: string;
  to: string;
  subject: string;
  textBody: string;
  htmlBody: string;
  date: string;
  auth: EmailAuthVerdicts;
  attachments: InboundAttachment[];
  rawJson: string;
};

export type InboundEmailProvider = "postmark" | "mailgun" | "sendgrid";
