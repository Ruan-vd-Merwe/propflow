/**
 * Provider-agnostic WhatsApp send contract. Mirrors the shape of
 * PaymentProvider (see @/lib/rent/payment-providers/types): a `name` plus
 * the one method callers actually need. Meta's Cloud API only accepts
 * pre-approved templates for business-initiated sends, so the contract is
 * template-shaped rather than free-text.
 */
export type WhatsAppSendResult =
  | { ok: true; providerMessageId: string }
  | { ok: false; error: string };

export interface WhatsAppProvider {
  name: string;
  /**
   * Sends a pre-approved template message.
   * @param to E.164 phone number, digits only (e.g. "27821234567").
   * @param templateName Exact template name as registered in Meta Business Manager.
   * @param params Positional values substituted into the template's {{n}} placeholders, in order.
   */
  sendTemplate(
    to: string,
    templateName: string,
    params: string[],
  ): Promise<WhatsAppSendResult>;
}
