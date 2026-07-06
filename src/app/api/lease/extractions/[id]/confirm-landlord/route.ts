import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { confirmLandlordExtraction } from "@/lib/lease/confirm";
import type { LeaseExtractedFields } from "@/lib/types";

export const runtime = "nodejs";

/**
 * POST /api/lease/extractions/[id]/confirm-landlord
 *
 * Thin wrapper: confirmLandlordExtraction in src/lib/lease/confirm.ts does
 * the actual property -> tenant -> lease_agreements -> rent_schedules ->
 * rent_obligations chain, so both landlord entry points (property creation,
 * Leases page) go through identical logic.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { tenant_email, tenant_phone, fields } = body as {
    tenant_email?: string;
    tenant_phone?: string | null;
    fields?: LeaseExtractedFields;
  };

  if (!fields) {
    return NextResponse.json({ error: "fields is required" }, { status: 400 });
  }

  const result = await confirmLandlordExtraction(supabase, {
    extractionId: params.id,
    landlordId: user.id,
    tenantEmail: tenant_email ?? "",
    tenantPhone: tenant_phone,
    fields,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    extraction: result.extraction,
    tenant_id: result.tenantId,
    lease_id: result.leaseId,
    rent_schedule_id: result.rentScheduleId,
    obligations_created: result.obligationsCreated,
  });
}
