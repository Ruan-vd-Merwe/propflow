import type { SupabaseClient } from "@supabase/supabase-js";
import { generateRentObligations } from "@/lib/rent/schedule";
import type { LeaseExtractedFields, LeaseExtraction } from "@/lib/types";

// Matches MONTHS_AHEAD in /api/rent/generate. Obligations are generated
// this many months ahead regardless of which flow created the schedule.
const MONTHS_AHEAD = 3;

/** Fields required to confirm a landlord-side lease extraction. */
export type LandlordConfirmFields = LeaseExtractedFields & {
  tenant_name: string;
  monthly_rent_cents: number;
  lease_start: string;
};

export function isLandlordConfirmReady(
  fields: LeaseExtractedFields,
): fields is LandlordConfirmFields {
  return (
    !!fields.tenant_name &&
    fields.monthly_rent_cents != null &&
    fields.monthly_rent_cents > 0 &&
    !!fields.lease_start
  );
}

export type TenantInsertPayload = {
  property_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  lease_start: string;
  lease_end: string | null;
  monthly_rent: number;
};

export function buildTenantInsertPayload(opts: {
  fields: LandlordConfirmFields;
  tenantEmail: string;
  tenantPhone?: string | null;
  propertyId: string;
}): TenantInsertPayload {
  return {
    property_id: opts.propertyId,
    full_name: opts.fields.tenant_name,
    email: opts.tenantEmail,
    phone: opts.tenantPhone ?? null,
    lease_start: opts.fields.lease_start,
    lease_end: opts.fields.lease_end ?? null,
    monthly_rent: opts.fields.monthly_rent_cents,
  };
}

export type LeaseAgreementInsertPayload = {
  property_id: string;
  tenant_id: string;
  landlord_id: string;
  lease_start: string;
  lease_end: string | null;
  monthly_rent: number;
  deposit_amount: number | null;
  payment_due_day: number;
  status: "signed";
  landlord_signed_at: string;
  tenant_signed_at: string;
};

export function buildLeaseAgreementInsertPayload(opts: {
  fields: LandlordConfirmFields;
  propertyId: string;
  tenantId: string;
  landlordId: string;
  now?: Date;
}): LeaseAgreementInsertPayload {
  const nowIso = (opts.now ?? new Date()).toISOString();
  return {
    property_id: opts.propertyId,
    tenant_id: opts.tenantId,
    landlord_id: opts.landlordId,
    lease_start: opts.fields.lease_start,
    lease_end: opts.fields.lease_end ?? null,
    monthly_rent: opts.fields.monthly_rent_cents,
    deposit_amount: opts.fields.deposit_amount_cents ?? null,
    payment_due_day: opts.fields.payment_due_day ?? 1,
    status: "signed",
    landlord_signed_at: nowIso,
    tenant_signed_at: nowIso,
  };
}

export type RentScheduleInsertPayload = {
  lease_id: string;
  amount_cents: number;
  due_day: number;
  start_date: string;
  end_date: string | null;
  escalation_date: string | null;
  escalation_pct: number | null;
  status: "active";
};

export function buildRentScheduleInsertPayload(opts: {
  fields: LandlordConfirmFields;
  leaseId: string;
}): RentScheduleInsertPayload {
  return {
    lease_id: opts.leaseId,
    amount_cents: opts.fields.monthly_rent_cents,
    due_day: opts.fields.payment_due_day ?? 1,
    start_date: opts.fields.lease_start,
    end_date: opts.fields.lease_end ?? null,
    escalation_date: opts.fields.escalation_date ?? null,
    escalation_pct: opts.fields.escalation_pct ?? null,
    status: "active",
  };
}

/** Merges extracted_fields with manual_fields, manual entries winning. */
export function mergeLeaseFields(
  extracted: LeaseExtractedFields | null,
  manual: LeaseExtractedFields | null,
): LeaseExtractedFields {
  const base: LeaseExtractedFields = {
    tenant_name: null,
    landlord_name: null,
    property_address: null,
    monthly_rent_cents: null,
    deposit_amount_cents: null,
    lease_start: null,
    lease_end: null,
    payment_due_day: null,
    escalation_pct: null,
    escalation_date: null,
  };
  return { ...base, ...extracted, ...removeNulls(manual) };
}

/**
 * Given what extraction originally found and the final reviewed values,
 * returns only the fields extraction left null that the human filled in.
 * This is what gets stored in manual_fields: a diff, not a duplicate of
 * everything the form currently holds.
 */
export function computeManualOverlay(
  extracted: LeaseExtractedFields | null,
  final: LeaseExtractedFields,
): LeaseExtractedFields {
  const overlay: LeaseExtractedFields = {
    tenant_name: null,
    landlord_name: null,
    property_address: null,
    monthly_rent_cents: null,
    deposit_amount_cents: null,
    lease_start: null,
    lease_end: null,
    payment_due_day: null,
    escalation_pct: null,
    escalation_date: null,
  };
  for (const key of Object.keys(overlay) as (keyof LeaseExtractedFields)[]) {
    const extractedValue = extracted?.[key] ?? null;
    const finalValue = final[key] ?? null;
    if (extractedValue === null && finalValue !== null) {
      (overlay[key] as unknown) = finalValue;
    }
  }
  return overlay;
}

function removeNulls(
  fields: LeaseExtractedFields | null,
): Partial<LeaseExtractedFields> {
  if (!fields) return {};
  const out: Partial<LeaseExtractedFields> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value !== null && value !== undefined) {
      (out as Record<string, unknown>)[key] = value;
    }
  }
  return out;
}

// ─── DB-touching orchestration ────────────────────────────────────────────────
// Both routes are thin wrappers around these two functions, so both landlord
// entry points (property creation, Leases page) and the tenant entry point
// go through identical logic regardless of which UI triggered them.

export type ConfirmResult<T> =
  | ({ ok: true } & T)
  | { ok: false; status: number; error: string };

export type ConfirmLandlordOutcome = {
  extraction: LeaseExtraction;
  tenantId: string;
  leaseId: string;
  rentScheduleId: string;
  obligationsCreated: number;
};

/**
 * Confirms a landlord-side lease extraction: property (already exists) ->
 * tenant -> lease_agreements -> rent_schedules -> rent_obligations. Reuses
 * an existing tenants row for this property/email if one already exists.
 */
export async function confirmLandlordExtraction(
  supabase: SupabaseClient,
  opts: {
    extractionId: string;
    landlordId: string;
    tenantEmail: string;
    tenantPhone?: string | null;
    fields: LeaseExtractedFields;
  },
): Promise<ConfirmResult<ConfirmLandlordOutcome>> {
  if (!opts.tenantEmail?.trim()) {
    return { ok: false, status: 400, error: "tenant_email is required" };
  }
  if (!isLandlordConfirmReady(opts.fields)) {
    return {
      ok: false,
      status: 400,
      error: "tenant_name, monthly_rent_cents and lease_start are required",
    };
  }
  const fields = opts.fields;

  const { data: extraction, error: fetchErr } = await supabase
    .from("lease_extractions")
    .select("*")
    .eq("id", opts.extractionId)
    .single();

  if (fetchErr || !extraction) {
    return { ok: false, status: 404, error: "Extraction not found" };
  }
  if (extraction.uploaded_by_role !== "landlord" || !extraction.property_id) {
    return {
      ok: false,
      status: 400,
      error: "This extraction is not a landlord property upload",
    };
  }
  if (extraction.confirmed) {
    return {
      ok: false,
      status: 409,
      error: "This extraction has already been confirmed",
    };
  }

  const propertyId = extraction.property_id as string;

  const { data: existingTenant, error: existingTenantErr } = await supabase
    .from("tenants")
    .select("id")
    .eq("property_id", propertyId)
    .eq("email", opts.tenantEmail.trim())
    .maybeSingle();

  if (existingTenantErr) {
    console.error("[confirmLandlordExtraction] existing tenant lookup failed:", existingTenantErr.message);
    return { ok: false, status: 500, error: existingTenantErr.message };
  }

  let tenantId = existingTenant?.id as string | undefined;

  if (!tenantId) {
    const tenantInsert = buildTenantInsertPayload({
      fields,
      tenantEmail: opts.tenantEmail.trim(),
      tenantPhone: opts.tenantPhone,
      propertyId,
    });
    const { data: newTenant, error: tenantErr } = await supabase
      .from("tenants")
      .insert(tenantInsert)
      .select("id")
      .single();

    if (tenantErr || !newTenant) {
      console.error("[confirmLandlordExtraction] tenant insert failed:", tenantErr?.message);
      return {
        ok: false,
        status: 500,
        error: tenantErr?.message ?? "Failed to create tenant",
      };
    }
    tenantId = newTenant.id;
  }

  const resolvedTenantId = tenantId as string;

  const leaseAgreementInsert = buildLeaseAgreementInsertPayload({
    fields,
    propertyId,
    tenantId: resolvedTenantId,
    landlordId: opts.landlordId,
  });
  const { data: lease, error: leaseErr } = await supabase
    .from("lease_agreements")
    .insert(leaseAgreementInsert)
    .select("id")
    .single();

  if (leaseErr || !lease) {
    console.error("[confirmLandlordExtraction] lease_agreements insert failed:", leaseErr?.message);
    return {
      ok: false,
      status: 500,
      error: leaseErr?.message ?? "Failed to create lease agreement",
    };
  }

  const rentScheduleInsert = buildRentScheduleInsertPayload({
    fields,
    leaseId: lease.id,
  });
  const { data: schedule, error: scheduleErr } = await supabase
    .from("rent_schedules")
    .insert(rentScheduleInsert)
    .select("*")
    .single();

  if (scheduleErr || !schedule) {
    console.error("[confirmLandlordExtraction] rent_schedules insert failed:", scheduleErr?.message);
    return {
      ok: false,
      status: 500,
      error: scheduleErr?.message ?? "Failed to create rent schedule",
    };
  }

  const obligations = generateRentObligations(
    schedule,
    { tenant_id: resolvedTenantId, property_id: propertyId, landlord_id: opts.landlordId },
    MONTHS_AHEAD,
  );

  if (obligations.length > 0) {
    const { error: obligationsErr } = await supabase
      .from("rent_obligations")
      .insert(obligations);
    if (obligationsErr) {
      console.error("[confirmLandlordExtraction] rent_obligations insert failed:", obligationsErr.message);
      return { ok: false, status: 500, error: obligationsErr.message };
    }
  }

  const manualOverlay = computeManualOverlay(
    extraction.extracted_fields as LeaseExtractedFields | null,
    fields,
  );

  const { data: updatedExtraction, error: updateErr } = await supabase
    .from("lease_extractions")
    .update({
      tenant_id: resolvedTenantId,
      manual_fields: manualOverlay,
      confirmed: true,
      confirmed_at: new Date().toISOString(),
    })
    .eq("id", opts.extractionId)
    .select()
    .single();

  if (updateErr) {
    console.error("[confirmLandlordExtraction] lease_extractions update failed:", updateErr.message);
    return { ok: false, status: 500, error: updateErr.message };
  }

  return {
    ok: true,
    extraction: updatedExtraction as LeaseExtraction,
    tenantId: resolvedTenantId,
    leaseId: lease.id,
    rentScheduleId: schedule.id,
    obligationsCreated: obligations.length,
  };
}

export type ConfirmTenantOutcome = { extraction: LeaseExtraction };

/**
 * Confirms a tenant-side lease extraction. Never creates or touches a
 * tenants or lease_agreements row: there is no guaranteed landlord
 * counterpart on the platform for a tenant's own upload.
 */
export async function confirmTenantExtraction(
  supabase: SupabaseClient,
  opts: { extractionId: string; profileId: string; fields: LeaseExtractedFields },
): Promise<ConfirmResult<ConfirmTenantOutcome>> {
  const { data: extraction, error: fetchErr } = await supabase
    .from("lease_extractions")
    .select("*")
    .eq("id", opts.extractionId)
    .single();

  if (fetchErr || !extraction) {
    return { ok: false, status: 404, error: "Extraction not found" };
  }
  if (extraction.uploaded_by_role !== "tenant") {
    return {
      ok: false,
      status: 400,
      error: "This extraction is not a tenant upload",
    };
  }
  if (extraction.uploaded_by_profile_id !== opts.profileId) {
    return { ok: false, status: 403, error: "Forbidden" };
  }
  if (extraction.confirmed) {
    return {
      ok: false,
      status: 409,
      error: "This extraction has already been confirmed",
    };
  }

  const manualOverlay = computeManualOverlay(
    extraction.extracted_fields as LeaseExtractedFields | null,
    opts.fields,
  );

  const { data: updated, error: updateErr } = await supabase
    .from("lease_extractions")
    .update({
      manual_fields: manualOverlay,
      confirmed: true,
      confirmed_at: new Date().toISOString(),
    })
    .eq("id", opts.extractionId)
    .select()
    .single();

  if (updateErr) {
    console.error("[confirmTenantExtraction] lease_extractions update failed:", updateErr.message);
    return { ok: false, status: 500, error: updateErr.message };
  }

  return { ok: true, extraction: updated as LeaseExtraction };
}
