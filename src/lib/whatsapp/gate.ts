/**
 * Hard product rule: never send WhatsApp to anyone without a phone number or
 * without opt-in. Centralised so every send path (existing and new) applies
 * the same check instead of re-implementing it ad hoc.
 */
export type SendGateResult = { allowed: true } | { allowed: false; reason: string };

export function checkSendGate(input: {
  phone: string | null | undefined;
  optedIn: boolean;
}): SendGateResult {
  if (!input.phone) return { allowed: false, reason: "no phone number on record" };
  if (!input.optedIn) return { allowed: false, reason: "recipient has not opted in to WhatsApp" };
  return { allowed: true };
}
