import { NextRequest, NextResponse } from "next/server";
import { verifyMetaWebhookSignature } from "@/lib/whatsapp/webhook-signature";

export const runtime = "nodejs";

/**
 * GET /api/webhooks/whatsapp
 *
 * Meta's verification handshake, run once when the webhook URL is configured
 * in the app dashboard. Echo hub.challenge back only if hub.verify_token
 * matches WHATSAPP_VERIFY_TOKEN.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && verifyToken && token === verifyToken && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

type MetaStatusEntry = {
  id: string;
  status: string;
  recipient_id?: string;
  timestamp?: string;
};

type MetaMessageEntry = {
  from: string;
  id: string;
  type: string;
};

type MetaWebhookPayload = {
  entry?: {
    changes?: {
      value?: {
        statuses?: MetaStatusEntry[];
        messages?: MetaMessageEntry[];
      };
    }[];
  }[];
};

/**
 * POST /api/webhooks/whatsapp
 *
 * Reads the raw body first — signature verification must run against the
 * exact bytes Meta signed, the same convention the rent payment webhook
 * follows (see /api/rent/payment-webhook). This pass only logs delivery
 * status updates and inbound messages; no action is taken on inbound
 * messages (the support bot is out of scope). Persisting these to a
 * dedicated table is a follow-up — it needs a new table, which is out of
 * scope for this pass (no schema changes).
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signatureHeader = req.headers.get("x-hub-signature-256");

  if (!verifyMetaWebhookSignature(rawBody, signatureHeader)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: MetaWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[whatsapp webhook] malformed payload:", message);
    return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
  }

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const status of change.value?.statuses ?? []) {
        console.log(
          `[whatsapp webhook] delivery status: messageId=${status.id} status=${status.status} recipient=${status.recipient_id ?? "unknown"}`,
        );
      }
      for (const message of change.value?.messages ?? []) {
        console.log(
          `[whatsapp webhook] inbound message from=${message.from} type=${message.type} (logged only — support bot is out of scope)`,
        );
      }
    }
  }

  return NextResponse.json({ received: true });
}
