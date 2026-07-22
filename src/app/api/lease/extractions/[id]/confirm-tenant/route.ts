import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { confirmTenantExtraction } from "@/lib/lease/confirm";
import type { LeaseExtractedFields } from "@/lib/types";

export const runtime = "nodejs";

/**
 * POST /api/lease/extractions/[id]/confirm-tenant
 *
 * Thin wrapper: confirmTenantExtraction in src/lib/lease/confirm.ts never
 * creates or touches a tenants or lease_agreements row, since there is no
 * guaranteed landlord counterpart on the platform for a tenant's own upload.
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
  const { fields } = body as { fields?: LeaseExtractedFields };
  if (!fields) {
    return NextResponse.json({ error: "fields is required" }, { status: 400 });
  }

  const result = await confirmTenantExtraction(supabase, {
    extractionId: params.id,
    profileId: user.id,
    fields,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ extraction: result.extraction });
}
