import { describe, it, expect } from "vitest";
import {
  isLandlordConfirmReady,
  buildTenantInsertPayload,
  buildLeaseAgreementInsertPayload,
  buildRentScheduleInsertPayload,
  mergeLeaseFields,
  computeManualOverlay,
} from "@/lib/lease/confirm";
import type { LeaseExtractedFields } from "@/lib/types";

const EMPTY: LeaseExtractedFields = {
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

const READY_FIELDS: LeaseExtractedFields = {
  ...EMPTY,
  tenant_name: "Jane Doe",
  monthly_rent_cents: 1250000,
  lease_start: "2026-01-01",
};

describe("isLandlordConfirmReady", () => {
  it("is ready when tenant_name, monthly_rent_cents and lease_start are set", () => {
    expect(isLandlordConfirmReady(READY_FIELDS)).toBe(true);
  });

  it("is not ready when tenant_name is missing", () => {
    expect(isLandlordConfirmReady({ ...READY_FIELDS, tenant_name: null })).toBe(false);
  });

  it("is not ready when monthly_rent_cents is missing or zero", () => {
    expect(isLandlordConfirmReady({ ...READY_FIELDS, monthly_rent_cents: null })).toBe(false);
    expect(isLandlordConfirmReady({ ...READY_FIELDS, monthly_rent_cents: 0 })).toBe(false);
  });

  it("is not ready when lease_start is missing", () => {
    expect(isLandlordConfirmReady({ ...READY_FIELDS, lease_start: null })).toBe(false);
  });
});

describe("buildTenantInsertPayload", () => {
  it("builds the exact tenants insert shape", () => {
    const payload = buildTenantInsertPayload({
      fields: READY_FIELDS as never,
      tenantEmail: "jane@example.com",
      tenantPhone: "0821234567",
      propertyId: "prop-1",
    });
    expect(payload).toEqual({
      property_id: "prop-1",
      full_name: "Jane Doe",
      email: "jane@example.com",
      phone: "0821234567",
      lease_start: "2026-01-01",
      lease_end: null,
      monthly_rent: 1250000,
    });
  });

  it("defaults phone to null when not provided", () => {
    const payload = buildTenantInsertPayload({
      fields: READY_FIELDS as never,
      tenantEmail: "jane@example.com",
      propertyId: "prop-1",
    });
    expect(payload.phone).toBeNull();
  });
});

describe("buildLeaseAgreementInsertPayload", () => {
  const now = new Date("2026-06-01T00:00:00.000Z");

  it("builds a signed lease with both signed_at timestamps set to now", () => {
    const payload = buildLeaseAgreementInsertPayload({
      fields: READY_FIELDS as never,
      propertyId: "prop-1",
      tenantId: "tenant-1",
      landlordId: "landlord-1",
      now,
    });
    expect(payload.status).toBe("signed");
    expect(payload.landlord_signed_at).toBe(now.toISOString());
    expect(payload.tenant_signed_at).toBe(now.toISOString());
    expect(payload.monthly_rent).toBe(1250000);
  });

  it("defaults payment_due_day to 1 when not extracted", () => {
    const payload = buildLeaseAgreementInsertPayload({
      fields: READY_FIELDS as never,
      propertyId: "prop-1",
      tenantId: "tenant-1",
      landlordId: "landlord-1",
      now,
    });
    expect(payload.payment_due_day).toBe(1);
  });
});

describe("buildRentScheduleInsertPayload", () => {
  it("builds an active schedule matching the lease amount and dates", () => {
    const payload = buildRentScheduleInsertPayload({
      fields: { ...READY_FIELDS, escalation_pct: 8, escalation_date: "2027-01-01" } as never,
      leaseId: "lease-1",
    });
    expect(payload).toEqual({
      lease_id: "lease-1",
      amount_cents: 1250000,
      due_day: 1,
      start_date: "2026-01-01",
      end_date: null,
      escalation_date: "2027-01-01",
      escalation_pct: 8,
      status: "active",
    });
  });
});

describe("mergeLeaseFields", () => {
  it("manual entries win over extracted ones", () => {
    const extracted = { ...EMPTY, tenant_name: "AI Guess", monthly_rent_cents: 1000000 };
    const manual = { ...EMPTY, tenant_name: "Corrected Name" };
    const merged = mergeLeaseFields(extracted, manual);
    expect(merged.tenant_name).toBe("Corrected Name");
    expect(merged.monthly_rent_cents).toBe(1000000);
  });

  it("null manual entries do not override extracted values", () => {
    const extracted = { ...EMPTY, tenant_name: "Jane Doe" };
    const merged = mergeLeaseFields(extracted, EMPTY);
    expect(merged.tenant_name).toBe("Jane Doe");
  });

  it("handles null extracted and null manual", () => {
    expect(mergeLeaseFields(null, null)).toEqual(EMPTY);
  });
});

describe("computeManualOverlay", () => {
  it("captures a field extraction left null that the human filled in", () => {
    const extracted = { ...EMPTY, tenant_name: "Jane Doe", payment_due_day: null };
    const final = { ...extracted, payment_due_day: 5 };
    const overlay = computeManualOverlay(extracted, final);
    expect(overlay.payment_due_day).toBe(5);
  });

  it("does not capture a correction to a field extraction already found", () => {
    const extracted = { ...EMPTY, monthly_rent_cents: 1000000 };
    const final = { ...extracted, monthly_rent_cents: 1100000 };
    const overlay = computeManualOverlay(extracted, final);
    // By design, manual_fields only records what extraction left null, not
    // corrections to values extraction already found.
    expect(overlay.monthly_rent_cents).toBeNull();
  });

  it("returns all nulls when nothing new was filled in", () => {
    const extracted = { ...EMPTY, tenant_name: "Jane Doe" };
    const overlay = computeManualOverlay(extracted, extracted);
    expect(overlay).toEqual(EMPTY);
  });

  it("treats a null extracted_fields object as everything missing", () => {
    const final = { ...EMPTY, tenant_name: "Jane Doe" };
    const overlay = computeManualOverlay(null, final);
    expect(overlay.tenant_name).toBe("Jane Doe");
  });
});
