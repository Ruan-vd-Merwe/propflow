import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  confirmLandlordExtraction,
  confirmTenantExtraction,
} from "@/lib/lease/confirm";
import type { LeaseExtractedFields } from "@/lib/types";

// ─── Minimal in-memory fake matching the exact query shapes
// src/lib/lease/confirm.ts issues (select/eq/single/maybeSingle,
// update/eq/select/single, insert/select/single, and a bare awaited insert
// for the bulk rent_obligations write). Mirrors the fake used in
// rent-payment-service.test.ts.
function makeFakeSupabase(seed: {
  lease_extractions?: Record<string, unknown>[];
  tenants?: Record<string, unknown>[];
  lease_agreements?: Record<string, unknown>[];
  rent_schedules?: Record<string, unknown>[];
  rent_obligations?: Record<string, unknown>[];
}) {
  const state: Record<string, Record<string, unknown>[]> = {
    lease_extractions: [...(seed.lease_extractions ?? [])],
    tenants: [...(seed.tenants ?? [])],
    lease_agreements: [...(seed.lease_agreements ?? [])],
    rent_schedules: [...(seed.rent_schedules ?? [])],
    rent_obligations: [...(seed.rent_obligations ?? [])],
  };

  function rowsFor(table: string): Record<string, unknown>[] {
    if (!state[table]) state[table] = [];
    return state[table];
  }

  function matches(row: Record<string, unknown>, filters: Record<string, unknown>) {
    return Object.entries(filters).every(([k, v]) => row[k] === v);
  }

  function from(table: string) {
    return {
      select() {
        const filters: Record<string, unknown> = {};
        const chain = {
          eq(col: string, val: unknown) {
            filters[col] = val;
            return chain;
          },
          async single() {
            const row = rowsFor(table).find((r) => matches(r, filters));
            return row
              ? { data: row, error: null }
              : { data: null, error: { message: "not found" } };
          },
          async maybeSingle() {
            const row = rowsFor(table).find((r) => matches(r, filters));
            return { data: row ?? null, error: null };
          },
        };
        return chain;
      },
      update(patch: Record<string, unknown>) {
        const filters: Record<string, unknown> = {};
        return {
          eq(col: string, val: unknown) {
            filters[col] = val;
            return this;
          },
          select() {
            return {
              async single() {
                const rows = rowsFor(table);
                const idx = rows.findIndex((r) => matches(r, filters));
                if (idx === -1) return { data: null, error: { message: "not found" } };
                rows[idx] = { ...rows[idx], ...patch };
                return { data: rows[idx], error: null };
              },
            };
          },
        };
      },
      insert(rowOrRows: Record<string, unknown> | Record<string, unknown>[]) {
        const inputRows = Array.isArray(rowOrRows) ? rowOrRows : [rowOrRows];
        const inserted = inputRows.map((r, i) => ({
          id: `generated-${table}-${rowsFor(table).length + i + 1}`,
          created_at: new Date().toISOString(),
          ...r,
        }));
        let committed = false;
        const commit = () => {
          if (!committed) {
            rowsFor(table).push(...inserted);
            committed = true;
          }
        };
        return {
          select() {
            return {
              async single() {
                commit();
                return { data: inserted[0], error: null };
              },
            };
          },
          // Supports a bare `await supabase.from(t).insert(rows)` with no
          // .select() chain, used for the bulk rent_obligations insert.
          then(
            resolve: (value: { data: null; error: null }) => void,
          ) {
            commit();
            resolve({ data: null, error: null });
          },
        };
      },
    };
  }

  return { client: { from } as unknown as SupabaseClient, state };
}

const READY_FIELDS: LeaseExtractedFields = {
  tenant_name: "Jane Doe",
  landlord_name: "John Smith",
  property_address: "12 Kloof Street",
  monthly_rent_cents: 1250000,
  deposit_amount_cents: 2500000,
  lease_start: "2026-01-01",
  lease_end: null,
  payment_due_day: 1,
  escalation_pct: null,
  escalation_date: null,
};

function makeLandlordExtraction(overrides: Record<string, unknown> = {}) {
  return {
    id: "ext-1",
    uploaded_by_role: "landlord",
    uploaded_by_profile_id: "landlord-1",
    property_id: "prop-1",
    tenant_id: null,
    storage_path: "landlord-1/prop-1/1_lease.pdf",
    original_filename: "lease.pdf",
    status: "extracted",
    extracted_fields: READY_FIELDS,
    manual_fields: null,
    confirmed: false,
    confirmed_at: null,
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("confirmLandlordExtraction", () => {
  it("creates exactly one tenants, lease_agreements and rent_schedules row and generates obligations", async () => {
    const { client, state } = makeFakeSupabase({
      lease_extractions: [makeLandlordExtraction()],
    });

    const result = await confirmLandlordExtraction(client, {
      extractionId: "ext-1",
      landlordId: "landlord-1",
      tenantEmail: "jane@example.com",
      fields: READY_FIELDS,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok result");

    expect(state.tenants).toHaveLength(1);
    expect(state.lease_agreements).toHaveLength(1);
    expect(state.rent_schedules).toHaveLength(1);
    expect(state.rent_obligations.length).toBeGreaterThan(0);
    expect(result.obligationsCreated).toBe(state.rent_obligations.length);

    expect(state.lease_agreements[0]).toMatchObject({
      property_id: "prop-1",
      landlord_id: "landlord-1",
      status: "signed",
    });
    expect(state.lease_agreements[0].landlord_signed_at).toBeTruthy();
    expect(state.lease_agreements[0].tenant_signed_at).toBeTruthy();

    const extraction = state.lease_extractions[0];
    expect(extraction.confirmed).toBe(true);
    expect(extraction.tenant_id).toBeTruthy();
  });

  it("reuses an existing tenant on the same property/email instead of duplicating", async () => {
    const { client, state } = makeFakeSupabase({
      lease_extractions: [makeLandlordExtraction()],
      tenants: [
        {
          id: "existing-tenant-1",
          property_id: "prop-1",
          email: "jane@example.com",
          full_name: "Jane Doe",
        },
      ],
    });

    const result = await confirmLandlordExtraction(client, {
      extractionId: "ext-1",
      landlordId: "landlord-1",
      tenantEmail: "jane@example.com",
      fields: READY_FIELDS,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok result");
    expect(state.tenants).toHaveLength(1);
    expect(result.tenantId).toBe("existing-tenant-1");
  });

  it("produces the same lease and schedule shape regardless of which entry point created the extraction row", async () => {
    // "Property creation" style extraction and "Leases page" style
    // extraction differ only in how they were created upstream; the
    // confirm logic itself takes the same extractionId/fields/tenantEmail
    // shape either way, so the resulting writes are identical.
    const fromPropertyCreation = makeFakeSupabase({
      lease_extractions: [makeLandlordExtraction({ id: "ext-a" })],
    });
    const fromLeasesPage = makeFakeSupabase({
      lease_extractions: [makeLandlordExtraction({ id: "ext-b" })],
    });

    const resultA = await confirmLandlordExtraction(fromPropertyCreation.client, {
      extractionId: "ext-a",
      landlordId: "landlord-1",
      tenantEmail: "jane@example.com",
      fields: READY_FIELDS,
    });
    const resultB = await confirmLandlordExtraction(fromLeasesPage.client, {
      extractionId: "ext-b",
      landlordId: "landlord-1",
      tenantEmail: "jane@example.com",
      fields: READY_FIELDS,
    });

    expect(resultA.ok).toBe(true);
    expect(resultB.ok).toBe(true);
    if (!resultA.ok || !resultB.ok) throw new Error("expected ok results");

    const scheduleA = fromPropertyCreation.state.rent_schedules[0];
    const scheduleB = fromLeasesPage.state.rent_schedules[0];
    expect(scheduleA.amount_cents).toBe(scheduleB.amount_cents);
    expect(scheduleA.due_day).toBe(scheduleB.due_day);
    expect(scheduleA.start_date).toBe(scheduleB.start_date);
    expect(resultA.obligationsCreated).toBe(resultB.obligationsCreated);
  });

  it("rejects confirming an already-confirmed extraction", async () => {
    const { client } = makeFakeSupabase({
      lease_extractions: [makeLandlordExtraction({ confirmed: true })],
    });
    const result = await confirmLandlordExtraction(client, {
      extractionId: "ext-1",
      landlordId: "landlord-1",
      tenantEmail: "jane@example.com",
      fields: READY_FIELDS,
    });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected rejection");
    expect(result.status).toBe(409);
  });

  it("rejects when required fields are missing", async () => {
    const { client } = makeFakeSupabase({
      lease_extractions: [makeLandlordExtraction()],
    });
    const result = await confirmLandlordExtraction(client, {
      extractionId: "ext-1",
      landlordId: "landlord-1",
      tenantEmail: "jane@example.com",
      fields: { ...READY_FIELDS, tenant_name: null },
    });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected rejection");
    expect(result.status).toBe(400);
  });
});

describe("confirmTenantExtraction", () => {
  function makeTenantExtraction(overrides: Record<string, unknown> = {}) {
    return {
      id: "ext-t1",
      uploaded_by_role: "tenant",
      uploaded_by_profile_id: "tenant-user-1",
      property_id: null,
      tenant_id: null,
      storage_path: "tenant-user-1/self/1_lease.pdf",
      original_filename: "lease.pdf",
      status: "extracted",
      extracted_fields: { ...READY_FIELDS, payment_due_day: null },
      manual_fields: null,
      confirmed: false,
      confirmed_at: null,
      created_at: "2026-01-01T00:00:00.000Z",
      ...overrides,
    };
  }

  it("never creates or touches a tenants or lease_agreements row", async () => {
    const { client, state } = makeFakeSupabase({
      lease_extractions: [makeTenantExtraction()],
    });

    const result = await confirmTenantExtraction(client, {
      extractionId: "ext-t1",
      profileId: "tenant-user-1",
      fields: { ...READY_FIELDS, payment_due_day: 5 },
    });

    expect(result.ok).toBe(true);
    expect(state.tenants).toHaveLength(0);
    expect(state.lease_agreements).toHaveLength(0);
    expect(state.rent_schedules).toHaveLength(0);
    expect(state.rent_obligations).toHaveLength(0);

    const extraction = state.lease_extractions[0];
    expect(extraction.confirmed).toBe(true);
    expect(extraction.tenant_id).toBeNull();
  });

  it("stores only the manual overlay, not a full duplicate of fields", async () => {
    const { state } = await (async () => {
      const fake = makeFakeSupabase({ lease_extractions: [makeTenantExtraction()] });
      await confirmTenantExtraction(fake.client, {
        extractionId: "ext-t1",
        profileId: "tenant-user-1",
        fields: { ...READY_FIELDS, payment_due_day: 5 },
      });
      return fake;
    })();

    const overlay = state.lease_extractions[0].manual_fields as LeaseExtractedFields;
    expect(overlay.payment_due_day).toBe(5);
    expect(overlay.tenant_name).toBeNull();
  });

  it("rejects a different profile confirming someone else's tenant upload", async () => {
    const { client } = makeFakeSupabase({
      lease_extractions: [makeTenantExtraction()],
    });
    const result = await confirmTenantExtraction(client, {
      extractionId: "ext-t1",
      profileId: "some-other-user",
      fields: READY_FIELDS,
    });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected rejection");
    expect(result.status).toBe(403);
  });

  it("rejects a landlord-role extraction submitted to the tenant confirm path", async () => {
    const { client } = makeFakeSupabase({
      lease_extractions: [makeLandlordExtraction()],
    });
    const result = await confirmTenantExtraction(client, {
      extractionId: "ext-1",
      profileId: "landlord-1",
      fields: READY_FIELDS,
    });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected rejection");
    expect(result.status).toBe(400);
  });
});
