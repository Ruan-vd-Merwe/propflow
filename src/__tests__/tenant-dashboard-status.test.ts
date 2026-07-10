import { describe, it, expect } from "vitest";
import {
  getSearchStatus,
  getSearchStripStatus,
  getLeaseStatus,
  getApplicationsStatus,
  getPaymentsStatus,
  getTrustScoreStatus,
  getRentalHistoryStatus,
} from "@/lib/tenant-dashboard/status";

describe("getSearchStatus", () => {
  it("is neutral when preferences were never set up", () => {
    expect(
      getSearchStatus({ discoverable: true, prefsComplete: false, area: null }),
    ).toEqual({ status: "neutral", label: "Not set up" });
  });

  it("flags a paused search with the area name", () => {
    expect(
      getSearchStatus({ discoverable: false, prefsComplete: true, area: "Camps Bay" }),
    ).toEqual({ status: "attention", label: "Camps Bay · Paused" });
  });

  it("is active with just the area name when searching", () => {
    expect(
      getSearchStatus({ discoverable: true, prefsComplete: true, area: "Camps Bay" }),
    ).toEqual({ status: "active", label: "Camps Bay" });
  });

  it("falls back to a generic label with no area set", () => {
    expect(
      getSearchStatus({ discoverable: false, prefsComplete: true, area: null }),
    ).toEqual({ status: "attention", label: "Your area · Paused" });
  });
});

describe("getSearchStripStatus", () => {
  it("is hidden when there's no search yet", () => {
    expect(
      getSearchStripStatus({ discoverable: true, prefsComplete: false, area: "Camps Bay" }),
    ).toBeNull();
  });

  it("shows the paused message with area name", () => {
    expect(
      getSearchStripStatus({ discoverable: false, prefsComplete: true, area: "Camps Bay" }),
    ).toEqual({ level: "attention", label: "Your Camps Bay search is paused" });
  });

  it("shows the active matching message", () => {
    expect(
      getSearchStripStatus({ discoverable: true, prefsComplete: true, area: "Camps Bay" }),
    ).toEqual({ level: "active", label: "Matching in Camps Bay" });
  });
});

describe("getLeaseStatus", () => {
  it("flags attention with no lease on file", () => {
    expect(getLeaseStatus({ hasLease: false, leaseEnd: null })).toEqual({
      status: "attention",
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
      label: "Nothing due",
    });
  });

  it("is neutral once the obligation is paid", () => {
    expect(
      getPaymentsStatus({
        obligation: { amountDueCents: 1200000, dueDate: "2026-08-01", status: "paid" },
      }),
    ).toEqual({ status: "neutral", label: "Nothing due" });
  });

  it("is neutral when waived", () => {
    expect(
      getPaymentsStatus({
        obligation: { amountDueCents: 1200000, dueDate: "2026-08-01", status: "waived" },
      }),
    ).toEqual({ status: "neutral", label: "Nothing due" });
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
  it("says ID still needed when unverified with nothing done", () => {
    expect(
      getTrustScoreStatus({ doneCount: 0, totalCount: 4, verificationStatus: "unverified" }),
    ).toEqual({ status: "attention", label: "ID still needed" });
  });

  it("reports completion progress while incomplete", () => {
    expect(
      getTrustScoreStatus({ doneCount: 2, totalCount: 4, verificationStatus: "unverified" }),
    ).toEqual({ status: "attention", label: "2 of 4 complete" });
  });

  it("is active and reads Verified once everything is complete and verified", () => {
    expect(
      getTrustScoreStatus({ doneCount: 4, totalCount: 4, verificationStatus: "verified" }),
    ).toEqual({ status: "active", label: "Verified" });
  });

  it("flags attention while pending review", () => {
    expect(
      getTrustScoreStatus({ doneCount: 3, totalCount: 4, verificationStatus: "pending" }),
    ).toEqual({ status: "attention", label: "ID pending review" });
  });

  it("flags attention when rejected", () => {
    expect(
      getTrustScoreStatus({ doneCount: 4, totalCount: 4, verificationStatus: "rejected" }),
    ).toEqual({ status: "attention", label: "Verification rejected" });
  });
});

describe("getRentalHistoryStatus", () => {
  it("is neutral with nothing on record", () => {
    expect(getRentalHistoryStatus({ count: 0 })).toEqual({
      status: "neutral",
      label: "Nothing on record",
    });
  });

  it("singularizes a single rental", () => {
    expect(getRentalHistoryStatus({ count: 1 })).toEqual({
      status: "active",
      label: "1 rental",
    });
  });

  it("reports the rental count", () => {
    expect(getRentalHistoryStatus({ count: 3 })).toEqual({
      status: "active",
      label: "3 rentals",
    });
  });
});
