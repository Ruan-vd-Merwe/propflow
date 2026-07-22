import type { WhatsAppProvider, WhatsAppSendResult } from "./types";

const GRAPH_VERSION = "v21.0";

/**
 * Real Meta WhatsApp Cloud API implementation (direct, no BSP). Reads env
 * vars at call time, not at module load, so a missing var is caught per
 * send rather than at import time — matches the rest of this repo's
 * process.env convention (see @/lib/resend, @/lib/whatsapp's old Twilio check).
 */
export const metaWhatsAppProvider: WhatsAppProvider = {
  name: "meta",

  async sendTemplate(
    to: string,
    templateName: string,
    params: string[],
  ): Promise<WhatsAppSendResult> {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    const missing: string[] = [];
    if (!phoneNumberId) missing.push("WHATSAPP_PHONE_NUMBER_ID");
    if (!businessAccountId) missing.push("WHATSAPP_BUSINESS_ACCOUNT_ID");
    if (!accessToken) missing.push("WHATSAPP_ACCESS_TOKEN");
    if (missing.length > 0) {
      return { ok: false, error: `Missing WhatsApp env var(s): ${missing.join(", ")}` };
    }

    const url = `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`;
    const body = {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: params.map((text) => ({ type: "text", text })),
          },
        ],
      },
    };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const errMsg =
          json?.error?.message ?? `WhatsApp API error (HTTP ${res.status})`;
        return { ok: false, error: errMsg };
      }

      const messageId = json?.messages?.[0]?.id;
      if (!messageId) {
        return { ok: false, error: "WhatsApp API response had no message id" };
      }

      return { ok: true, providerMessageId: messageId };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { ok: false, error: message };
    }
  },
};
