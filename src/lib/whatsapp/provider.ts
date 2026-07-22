import type { WhatsAppProvider } from "./types";
import { mockWhatsAppProvider } from "./mock-provider";
import { metaWhatsAppProvider } from "./meta-provider";

/**
 * Selects the real Meta provider when all three Cloud API env vars are
 * present, otherwise falls back to the mock provider — the same
 * env-presence convention the old Twilio sender used to decide dev vs
 * real, and the same "ship mock now, real gateway later" shape the rent
 * payment provider used before a real gateway existed. Checked at call
 * time (not module load) so it reflects the current environment.
 */
export function getWhatsAppProvider(): WhatsAppProvider {
  const configured =
    !!process.env.WHATSAPP_PHONE_NUMBER_ID &&
    !!process.env.WHATSAPP_BUSINESS_ACCOUNT_ID &&
    !!process.env.WHATSAPP_ACCESS_TOKEN;

  return configured ? metaWhatsAppProvider : mockWhatsAppProvider;
}
