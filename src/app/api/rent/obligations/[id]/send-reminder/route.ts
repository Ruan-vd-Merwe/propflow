import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendRentReminder } from "@/lib/whatsapp/rent-reminder";

export const runtime = "nodejs";

/**
 * POST /api/rent/obligations/[id]/send-reminder
 *
 * Development-only manual trigger for sendRentReminder — proves the
 * WhatsApp notification path end to end before a scheduler exists (the
 * cron itself is out of scope for this pass). Hard-gated off in
 * production regardless of caller, the same pattern as
 * /api/rent/payment-attempts/[id]/simulate.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "WhatsApp reminder trigger is not available in production" },
      { status: 403 },
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const service = createServiceClient();
  const { data: obligation } = await service
    .from("rent_obligations")
    .select("id, landlord_id")
    .eq("id", params.id)
    .single();

  if (!obligation) {
    return NextResponse.json({ error: "Obligation not found" }, { status: 404 });
  }
  if (obligation.landlord_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await sendRentReminder(service, params.id);
  return NextResponse.json(result);
}
