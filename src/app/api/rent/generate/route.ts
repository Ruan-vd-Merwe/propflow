import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { generateRentObligations } from "@/lib/rent/schedule";
import type { RentSchedule } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60; // seconds

// How many months of obligations to keep generated ahead of today.
const MONTHS_AHEAD = 3;

/**
 * POST /api/rent/generate
 *
 * Called daily by Vercel Cron (see vercel.json). For every active
 * rent_schedule, generates the next MONTHS_AHEAD months of rent_obligations
 * (idempotent — relies on the schedule_id/period_start unique index to skip
 * periods that already exist).
 */
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || auth !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  const { data: schedules, error: schedulesError } = await supabase
    .from("rent_schedules")
    .select(
      `*, lease_agreements!inner ( tenant_id, property_id, landlord_id )`,
    )
    .eq("status", "active");

  if (schedulesError) {
    console.error("[rent/generate]", schedulesError);
    return NextResponse.json({ error: schedulesError.message }, { status: 500 });
  }

  const results: { schedule_id: string; generated: number; error?: string }[] = [];

  for (const row of schedules ?? []) {
    const { lease_agreements, ...schedule } = row as RentSchedule & {
      lease_agreements: {
        tenant_id: string;
        property_id: string;
        landlord_id: string;
      };
    };

    const obligations = generateRentObligations(
      schedule,
      {
        tenant_id: lease_agreements.tenant_id,
        property_id: lease_agreements.property_id,
        landlord_id: lease_agreements.landlord_id,
      },
      MONTHS_AHEAD,
    );

    if (obligations.length === 0) continue;

    const { error: insertError } = await supabase
      .from("rent_obligations")
      .upsert(obligations, {
        onConflict: "schedule_id,period_start",
        ignoreDuplicates: true,
      });

    if (insertError) {
      results.push({ schedule_id: schedule.id, generated: 0, error: insertError.message });
      continue;
    }

    results.push({ schedule_id: schedule.id, generated: obligations.length });
  }

  return NextResponse.json({
    processed: results.length,
    results,
    runAt: new Date().toISOString(),
  });
}
