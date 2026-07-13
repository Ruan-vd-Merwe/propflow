import type { WhatsAppProvider, WhatsAppSendResult } from "./types";

export type MockWhatsAppSend = {
  to: string;
  templateName: string;
  params: string[];
  sentAt: string;
};

/** In-memory log of sends made through the mock provider — inspectable in tests/dev. */
export const mockWhatsAppLog: MockWhatsAppSend[] = [];

/** Dev/test provider: never talks to the network, just logs and records the send. */
export const mockWhatsAppProvider: WhatsAppProvider = {
  name: "mock",

  async sendTemplate(
    to: string,
    templateName: string,
    params: string[],
  ): Promise<WhatsAppSendResult> {
    const record: MockWhatsAppSend = {
      to,
      templateName,
      params,
      sentAt: new Date().toISOString(),
    };
    mockWhatsAppLog.push(record);
    console.log(
      `[whatsapp mock] to=${to} template=${templateName} params=${JSON.stringify(params)}`,
    );
    return { ok: true, providerMessageId: `mock_${Date.now()}_${mockWhatsAppLog.length}` };
  },
};
