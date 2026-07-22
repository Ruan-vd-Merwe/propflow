import { describe, it, expect } from "vitest";
import { mockWhatsAppProvider, mockWhatsAppLog } from "@/lib/whatsapp/mock-provider";

describe("mockWhatsAppProvider", () => {
  it("never throws and returns ok with a provider message id", async () => {
    const result = await mockWhatsAppProvider.sendTemplate("27821234567", "rent_reminder", [
      "Sarah",
      "R15,000",
      "12 Main Road",
      "20 Jul 2026",
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.providerMessageId).toMatch(/^mock_/);
  });

  it("records the send in the in-memory log without calling the network", async () => {
    const before = mockWhatsAppLog.length;
    await mockWhatsAppProvider.sendTemplate("27821234567", "custom_message", ["hello"]);
    expect(mockWhatsAppLog.length).toBe(before + 1);
    const record = mockWhatsAppLog[mockWhatsAppLog.length - 1];
    expect(record).toMatchObject({
      to: "27821234567",
      templateName: "custom_message",
      params: ["hello"],
    });
  });
});
