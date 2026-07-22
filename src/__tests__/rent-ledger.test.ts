import { describe, it, expect } from "vitest";
import {
  obligationStatusRank,
  worstObligationStatus,
  rentLedgerTotals,
  groupObligationsByTenant,
  lateTenantIds,
} from "@/lib/rent/ledger";
import type { ObligationStatus, RentObligation } from "@/lib/types";

function makeObligation(overrides: Partial<RentObligation> = {}): RentObligation {
  return {
    id: "ob-1",
    schedule_id: "sched-1",
    tenant_id: "tenant-1",
    property_id: "prop-1",
    landlord_id: "landlord-1",
    period_start: "2024-01-01",
    due_date: "2024-01-01",
    amount_due_cents: 10000,
    amount_paid_cents: 0,
    status: "pending",
    paid_at: null,
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("obligationStatusRank / worstObligationStatus", () => {
  it("ranks failed as most severe and waived as least severe", () => {
    expect(obligationStatusRank("failed")).toBeLessThan(
      obligationStatusRank("late"),
    );
    expect(obligationStatusRank("waived")).toBeGreaterThan(
      obligationStatusRank("pending"),
    );
  });

  it("follows failed > late > partial > paid > pending precedence", () => {
    const order: ObligationStatus[] = [
      "failed",
      "late",
      "partial",
      "paid",
      "pending",
    ];
    for (let i = 0; i < order.length - 1; i++) {
      expect(obligationStatusRank(order[i])).toBeLessThan(
        obligationStatusRank(order[i + 1]),
      );
    }
  });

  it("picks the single most severe status out of a mixed set", () => {
    expect(
      worstObligationStatus(["paid", "pending", "late", "partial"]),
    ).toBe("late");
    expect(worstObligationStatus(["paid", "failed", "late"])).toBe("failed");
    expect(worstObligationStatus(["waived", "paid"])).toBe("paid");
  });

  it("returns null for an empty list", () => {
    expect(worstObligationStatus([])).toBeNull();
  });
});

describe("rentLedgerTotals", () => {
  it("sums expected, collected and outstanding across obligations", () => {
    const obligations = [
      makeObligation({ amount_due_cents: 10000, amount_paid_cents: 10000, status: "paid" }),
      makeObligation({ amount_due_cents: 8000, amount_paid_cents: 0, status: "pending" }),
      makeObligation({ amount_due_cents: 5000, amount_paid_cents: 2000, status: "partial" }),
    ];
    const totals = rentLedgerTotals(obligations);
    expect(totals.expectedCents).toBe(23000);
    expect(totals.collectedCents).toBe(12000);
    expect(totals.outstandingCents).toBe(11000);
  });

  it("excludes waived obligations from expected and outstanding", () => {
    const obligations = [
      makeObligation({ amount_due_cents: 10000, amount_paid_cents: 0, status: "waived" }),
      makeObligation({ amount_due_cents: 5000, amount_paid_cents: 5000, status: "paid" }),
    ];
    const totals = rentLedgerTotals(obligations);
    expect(totals.expectedCents).toBe(5000);
    expect(totals.outstandingCents).toBe(0);
    expect(totals.collectedCents).toBe(5000);
  });

  it("counts late and failed obligations as lateCount", () => {
    const obligations = [
      makeObligation({ status: "late" }),
      makeObligation({ status: "failed" }),
      makeObligation({ status: "paid" }),
      makeObligation({ status: "pending" }),
    ];
    expect(rentLedgerTotals(obligations).lateCount).toBe(2);
  });

  it("never lets outstanding go negative when overpaid", () => {
    const obligations = [
      makeObligation({ amount_due_cents: 5000, amount_paid_cents: 6000, status: "paid" }),
    ];
    expect(rentLedgerTotals(obligations).outstandingCents).toBe(0);
  });

  it("returns zeroes for an empty obligation list", () => {
    expect(rentLedgerTotals([])).toEqual({
      expectedCents: 0,
      collectedCents: 0,
      outstandingCents: 0,
      lateCount: 0,
    });
  });
});

describe("groupObligationsByTenant", () => {
  it("groups obligations under their tenant_id", () => {
    const obligations = [
      makeObligation({ tenant_id: "a", id: "1" }),
      makeObligation({ tenant_id: "b", id: "2" }),
      makeObligation({ tenant_id: "a", id: "3" }),
    ];
    const grouped = groupObligationsByTenant(obligations);
    expect(grouped.get("a")?.map((o) => o.id)).toEqual(["1", "3"]);
    expect(grouped.get("b")?.map((o) => o.id)).toEqual(["2"]);
  });
});

describe("lateTenantIds", () => {
  it("includes a tenant whose worst obligation is late", () => {
    const obligations = [
      makeObligation({ tenant_id: "a", status: "paid" }),
      makeObligation({ tenant_id: "a", status: "late" }),
      makeObligation({ tenant_id: "b", status: "paid" }),
    ];
    expect(lateTenantIds(obligations)).toEqual(["a"]);
  });

  it("includes a tenant whose worst obligation is failed", () => {
    const obligations = [makeObligation({ tenant_id: "c", status: "failed" })];
    expect(lateTenantIds(obligations)).toEqual(["c"]);
  });

  it("excludes tenants whose worst obligation is only partial or pending", () => {
    const obligations = [
      makeObligation({ tenant_id: "a", status: "partial" }),
      makeObligation({ tenant_id: "b", status: "pending" }),
    ];
    expect(lateTenantIds(obligations)).toEqual([]);
  });
});
