import { describe, it, expect } from "vitest";
import { checkSendGate } from "@/lib/whatsapp/gate";

describe("checkSendGate", () => {
  it("skips with a reason when there is no phone number", () => {
    const result = checkSendGate({ phone: null, optedIn: true });
    expect(result).toEqual({ allowed: false, reason: "no phone number on record" });
  });

  it("skips with a reason when the recipient has not opted in", () => {
    const result = checkSendGate({ phone: "0821234567", optedIn: false });
    expect(result).toEqual({
      allowed: false,
      reason: "recipient has not opted in to WhatsApp",
    });
  });

  it("skips when both phone is missing and opt-in is false (phone checked first)", () => {
    const result = checkSendGate({ phone: undefined, optedIn: false });
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toBe("no phone number on record");
  });

  it("allows the send when phone is present and opted in", () => {
    expect(checkSendGate({ phone: "0821234567", optedIn: true })).toEqual({ allowed: true });
  });
});
