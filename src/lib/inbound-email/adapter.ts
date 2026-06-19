import type { InboundEmail, InboundEmailProvider } from "./types";
import { parsePostmarkInbound } from "./postmark";

const PROVIDER: InboundEmailProvider =
  (process.env.INBOUND_EMAIL_PROVIDER as InboundEmailProvider) ?? "postmark";

export function parseInboundEmail(body: unknown): InboundEmail {
  switch (PROVIDER) {
    case "postmark":
      return parsePostmarkInbound(body);
    default:
      throw new Error(`Unsupported inbound email provider: ${PROVIDER}`);
  }
}

export function extractPropertyId(recipientAddress: string): string | null {
  // Expected format: notices+<uuid>@inbound.proptrust.co.za
  const match = recipientAddress.match(
    /notices\+([0-9a-f-]{36})@/i,
  );
  return match ? match[1] : null;
}
