import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
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

    if (updates.status === "approved" && existing.status !== "approved") {
      await createDraftLeaseForApproval(supabase, updated);
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

/**
 * Best-effort side effect of approval: stand up a draft lease_agreements
 * row so the landlord lands straight on lease terms instead of starting
 * from the leases wizard. Never blocks or fails the approval itself.
 * Lease terms besides rent/start date are left at their column defaults
 * for the landlord to fill in via the draft lease's edit form.
 */
async function createDraftLeaseForApproval(
  supabase: SupabaseClient,
  application: {
    id: string;
    property_id: string | null;
    full_name: string;
    email: string;
    phone: string | null;
    requested_rent_cents: number | null;
  },
): Promise<void> {
  if (!application.property_id) return;

  try {
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("id, owner_id, asking_rent, available_from")
      .eq("id", application.property_id)
      .single();
    if (propertyError || !property) {
      console.error("[createDraftLeaseForApproval] property lookup failed:", propertyError?.message);
      return;
    }

    const monthlyRent = application.requested_rent_cents ?? property.asking_rent;
    if (!monthlyRent) {
      console.error(
        "[createDraftLeaseForApproval] no rent amount available for application",
        application.id,
      );
      return;
    }
    const leaseStart =
      property.available_from ?? new Date().toISOString().split("T")[0];

    const { data: existingTenant, error: existingTenantError } = await supabase
      .from("tenants")
      .select("id")
      .eq("property_id", property.id)
      .eq("email", application.email)
      .maybeSingle();
    if (existingTenantError) {
      console.error("[createDraftLeaseForApproval] tenant lookup failed:", existingTenantError.message);
      return;
    }

    let tenantId = existingTenant?.id as string | undefined;
    if (!tenantId) {
      const { data: newTenant, error: tenantInsertError } = await supabase
        .from("tenants")
        .insert({
          property_id: property.id,
          full_name: application.full_name,
          email: application.email,
          phone: application.phone,
          lease_start: leaseStart,
          monthly_rent: monthlyRent,
        })
        .select("id")
        .single();
      if (tenantInsertError || !newTenant) {
        console.error("[createDraftLeaseForApproval] tenant insert failed:", tenantInsertError?.message);
        return;
      }
      tenantId = newTenant.id;
    }

    const { data: existingLease, error: existingLeaseError } = await supabase
      .from("lease_agreements")
      .select("id")
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (existingLeaseError) {
      console.error("[createDraftLeaseForApproval] lease lookup failed:", existingLeaseError.message);
      return;
    }
    if (existingLease) return;

    const { error: leaseInsertError } = await supabase
      .from("lease_agreements")
      .insert({
        property_id: property.id,
        tenant_id: tenantId,
        landlord_id: property.owner_id,
        lease_start: leaseStart,
        monthly_rent: monthlyRent,
        status: "draft",
      });
    if (leaseInsertError) {
      console.error("[createDraftLeaseForApproval] lease insert failed:", leaseInsertError.message);
    }
  } catch (err) {
    console.error("[createDraftLeaseForApproval]", err);
  }
}
