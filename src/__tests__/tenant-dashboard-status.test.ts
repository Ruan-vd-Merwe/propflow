import { describe, it, expect } from "vitest";
import {
  getFindingPlaceStatus,
  getLeaseStatus,
  getApplicationsStatus,
  getPaymentsStatus,
  getTrustScoreStatus,
} from "@/lib/tenant-dashboard/status";

describe("getFindingPlaceStatus", () => {
  it("flags a paused search first, even with matches", () => {
    expect(
      getFindingPlaceStatus({ discoverable: false, prefsComplete: true, matchCount: 5 }),
    ).toEqual({ status: "attention", label: "Search paused" });
  });

  it("reports no matches yet when preferences are incomplete", () => {
    expect(
      getFindingPlaceStatus({ discoverable: true, prefsComplete: false, matchCount: 0 }),
    ).toEqual({ status: "neutral", label: "No matches yet" });
  });

  it("reports no matches yet when discoverable with zero matches", () => {
    expect(
      getFindingPlaceStatus({ discoverable: true, prefsComplete: true, matchCount: 0 }),
    ).toEqual({ status: "neutral", label: "No matches yet" });
  });

  it("counts matches within budget", () => {
    expect(
      getFindingPlaceStatus({ discoverable: true, prefsComplete: true, matchCount: 3 }),
    ).toEqual({ status: "active", label: "3 matches within budget" });
  });

  it("singularizes a single match", () => {
    expect(
      getFindingPlaceStatus({ discoverable: true, prefsComplete: true, matchCount: 1 }),
    ).toEqual({ status: "active", label: "1 match within budget" });
  });
});

describe("getLeaseStatus", () => {
  it("is neutral with no lease on file", () => {
    expect(getLeaseStatus({ hasLease: false, leaseEnd: null })).toEqual({
      status: "neutral",
      label: "Not added yet",
    });
  });

  it("shows the expiry date for a fixed-term lease", () => {
    expect(getLeaseStatus({ hasLease: true, leaseEnd: "2026-12-01" })).toEqual({
      status: "active",
      label: "Signed, expires 01 Dec 2026",
    });
  });

  it("falls back to month to month when there's no end date", () => {
    expect(getLeaseStatus({ hasLease: true, leaseEnd: null })).toEqual({
      status: "active",
      label: "Signed, month to month",
    });
  });
});

describe("getApplicationsStatus", () => {
  it("is neutral with no active applications", () => {
    expect(getApplicationsStatus({ activeCount: 0 })).toEqual({
      status: "neutral",
      label: "None active",
    });
  });

  it("reports the active count", () => {
    expect(getApplicationsStatus({ activeCount: 2 })).toEqual({
      status: "active",
      label: "2 active",
    });
  });
});

describe("getPaymentsStatus", () => {
  it("is neutral with no obligation", () => {
    expect(getPaymentsStatus({ obligation: null })).toEqual({
      status: "neutral",
      label: "Nothing due yet",
    });
  });

  it("is neutral once the obligation is paid", () => {
    expect(
      getPaymentsStatus({
        obligation: { amountDueCents: 1200000, dueDate: "2026-08-01", status: "paid" },
      }),
    ).toEqual({ status: "neutral", label: "Nothing due yet" });
  });

  it("is neutral when waived", () => {
    expect(
      getPaymentsStatus({
        obligation: { amountDueCents: 1200000, dueDate: "2026-08-01", status: "waived" },
      }),
    ).toEqual({ status: "neutral", label: "Nothing due yet" });
  });

  it("shows the due amount and date when pending", () => {
    expect(
      getPaymentsStatus({
        obligation: { amountDueCents: 1200000, dueDate: "2026-08-01", status: "pending" },
      }),
    ).toEqual({ status: "active", label: "R12 000 due 01 Aug 2026" });
  });

  it("flags a late obligation for attention", () => {
    expect(
      getPaymentsStatus({
        obligation: { amountDueCents: 1200000, dueDate: "2026-07-01", status: "late" },
      }),
    ).toEqual({ status: "attention", label: "R12 000 due 01 Jul 2026" });
  });
});

describe("getTrustScoreStatus", () => {
  it("reports completion progress", () => {
    expect(
      getTrustScoreStatus({ doneCount: 2, totalCount: 4, verificationStatus: "unverified" }),
    ).toEqual({ status: "neutral", label: "2 of 4 complete" });
  });

  it("is active once everything is complete and verified", () => {
    expect(
      getTrustScoreStatus({ doneCount: 4, totalCount: 4, verificationStatus: "verified" }),
    ).toEqual({ status: "active", label: "4 of 4 complete" });
  });

  it("appends the pending-review note and flags attention", () => {
    expect(
      getTrustScoreStatus({ doneCount: 3, totalCount: 4, verificationStatus: "pending" }),
    ).toEqual({ status: "attention", label: "3 of 4 complete · ID pending review" });
  });
});
