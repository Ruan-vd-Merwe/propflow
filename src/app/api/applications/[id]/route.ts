import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calcCreditScore } from "@/lib/credit-score";
import type {
  ReferenceCheck,
  BankStatementAnalysis,
  IdVerification,
} from "@/lib/types";

export const runtime = "nodejs";

/** PATCH /api/applications/:id
 *  Authenticated (landlord only).
 *  Accepts: status, landlord_notes, reference_checks (full array replace)
 */
export async function PATCH(
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

  try {
    const body = await req.json();

    // Fetch existing application (RLS ensures landlord ownership)
    const { data: existing, error: fetchError } = await supabase
      .from("tenant_applications")
      .select("*")
      .eq("id", params.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 },
      );
    }

    // Build update payload
    const updates: Record<string, unknown> = {};

    if ("status" in body) {
      const validStatuses = ["pending", "approved", "rejected"];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      updates.status = body.status;
    }

    if ("landlord_notes" in body) {
      updates.landlord_notes = body.landlord_notes;
    }

    if ("reference_checks" in body) {
      const refs = body.reference_checks as ReferenceCheck[];
      updates.reference_checks = refs;

      // Recalculate credit score with updated references
      const analysis =
        existing.bank_statement_analysis as BankStatementAnalysis;
      const idVerif = existing.id_verification as IdVerification;
      const fraudFlags = existing.fraud_flags as string[];
      const rent = existing.requested_rent_cents ?? 0;
      const income =
        existing.monthly_income_cents ?? analysis?.avgMonthlyIncome ?? 0;

      const { score, breakdown } = calcCreditScore({
        bankAnalysis: analysis,
        rentCents: rent,
        incomeCents: income,
        idVerification: idVerif,
        fraudFlags,
        referenceChecks: refs,
      });

      updates.credit_score = score;
      updates.credit_score_breakdown = breakdown;
    }

    const { data: updated, error: updateError } = await supabase
      .from("tenant_applications")
      .update(updates)
      .eq("id", params.id)
      .select("*")
      .single();

    if (updateError) {
      console.error("[applications PATCH]", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, application: updated });
  } catch (err) {
    console.error("[applications PATCH]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
