import type { ObligationStatus, RentObligation } from "@/lib/types";

// Most severe first — used to roll many obligations for one tenant into a
// single representative status, and to rank in-flight statuses for display.
const STATUS_PRECEDENCE: ObligationStatus[] = [
  "failed",
  "late",
  "processing",
  "partial",
  "paid",
  "pending",
  "waived",
];

/** Lower rank = more severe. Unknown statuses sort last. */
export function obligationStatusRank(status: ObligationStatus): number {
  const idx = STATUS_PRECEDENCE.indexOf(status);
  return idx === -1 ? STATUS_PRECEDENCE.length : idx;
}

/** Returns the single most severe status among the given obligations. */
export function worstObligationStatus(
  statuses: ObligationStatus[],
): ObligationStatus | null {
  if (statuses.length === 0) return null;
  return statuses.reduce((worst, s) =>
    obligationStatusRank(s) < obligationStatusRank(worst) ? s : worst,
  );
}

export type LedgerTotals = {
  expectedCents: number;
  collectedCents: number;
  outstandingCents: number;
  lateCount: number;
};

/**
 * Rolls up a set of obligations (typically "this month") into the headline
 * numbers shown on the dashboard and portfolio pages. Waived obligations are
 * excluded from expected/outstanding — the landlord has written them off.
 */
export function rentLedgerTotals(obligations: RentObligation[]): LedgerTotals {
  let expectedCents = 0;
  let collectedCents = 0;
  let outstandingCents = 0;
  let lateCount = 0;

  for (const o of obligations) {
    collectedCents += o.amount_paid_cents;
    if (o.status === "waived") continue;

    expectedCents += o.amount_due_cents;
    outstandingCents += Math.max(o.amount_due_cents - o.amount_paid_cents, 0);
    if (o.status === "late" || o.status === "failed") lateCount++;
  }

  return { expectedCents, collectedCents, outstandingCents, lateCount };
}

/** Groups obligations by tenant_id, preserving input order within each group. */
export function groupObligationsByTenant(
  obligations: RentObligation[],
): Map<string, RentObligation[]> {
  const byTenant = new Map<string, RentObligation[]>();
  for (const o of obligations) {
    if (!byTenant.has(o.tenant_id)) byTenant.set(o.tenant_id, []);
    byTenant.get(o.tenant_id)!.push(o);
  }
  return byTenant;
}

/**
 * tenant_ids whose worst current obligation status is 'late' or 'failed' —
 * i.e. tenants a landlord should follow up with.
 */
export function lateTenantIds(obligations: RentObligation[]): string[] {
  const byTenant = groupObligationsByTenant(obligations);
  const late: string[] = [];
  byTenant.forEach((tenantObligations, tenantId) => {
    const worst = worstObligationStatus(
      tenantObligations.map((o) => o.status),
    );
    if (worst === "late" || worst === "failed") late.push(tenantId);
  });
  return late;
}
