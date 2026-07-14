import type { VerificationStatus } from "@/lib/types";

export type DoorStatusLevel = "active" | "attention" | "neutral";

export type DoorStatus = {
  status: DoorStatusLevel;
  label: string;
};

export type StripStatus = {
  level: "active" | "attention";
  label: string;
} | null;

function fmtRand(cents: number) {
  return `R${(cents / 100).toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Suburb names are free text on the way in (no normalisation at write time),
 * so "camps bay" and "Camps Bay" both end up stored as typed. Title-case for
 * display only; never write this back to the database.
 */
export function formatAreaName(area: string | null): string | null {
  if (!area) return area;
  return area
    .split(" ")
    .map((word) =>
      word
        .split("-")
        .map((part) => (part ? part[0].toUpperCase() + part.slice(1).toLowerCase() : part))
        .join("-"),
    )
    .join(" ");
}

/** "Search preferences" tool card pill. */
export function getSearchStatus(input: {
  discoverable: boolean;
  prefsComplete: boolean;
  area: string | null;
}): DoorStatus {
  if (!input.prefsComplete) {
    return { status: "neutral", label: "Not set up" };
  }
  const area = input.area ?? "Your area";
  if (!input.discoverable) {
    return { status: "attention", label: `${area} · Paused` };
  }
  return { status: "active", label: area };
}

/** Hub status strip. Only shown once a search exists (preferences are set). */
export function getSearchStripStatus(input: {
  discoverable: boolean;
  prefsComplete: boolean;
  area: string | null;
}): StripStatus {
  if (!input.prefsComplete) return null;
  const area = input.area ?? "your area";
  if (!input.discoverable) {
    return { level: "attention", label: `Your ${area} search is paused` };
  }
  return { level: "active", label: `Matching in ${area}` };
}

/** "Lease vault" tool card pill. */
export function getLeaseStatus(input: {
  hasLease: boolean;
  leaseEnd: string | null;
}): DoorStatus {
  if (!input.hasLease) {
    return { status: "attention", label: "Not added yet" };
  }
  return {
    status: "active",
    label: input.leaseEnd ? `Signed, expires ${fmtDate(input.leaseEnd)}` : "Signed, month to month",
  };
}

/** "Applications" tool card pill. */
export function getApplicationsStatus(input: { activeCount: number }): DoorStatus {
  if (input.activeCount === 0) {
    return { status: "neutral", label: "None active" };
  }
  return { status: "active", label: `${input.activeCount} active` };
}

/** "Payments" tool card pill. */
export function getPaymentsStatus(input: {
  obligation: { amountDueCents: number; dueDate: string; status: string } | null;
}): DoorStatus {
  const { obligation } = input;
  if (!obligation || obligation.status === "paid" || obligation.status === "waived") {
    return { status: "neutral", label: "Nothing due" };
  }
  const level: DoorStatusLevel = obligation.status === "failed" || obligation.status === "late"
    ? "attention"
    : "active";
  return {
    status: level,
    label: `${fmtRand(obligation.amountDueCents)} due ${fmtDate(obligation.dueDate)}`,
  };
}

/**
 * "TrustScore profile" tool card pill. Green is reserved for the messaging
 * prop only (never real product surfaces), so a fully verified profile uses
 * blue rather than trust-green.
 */
export function getTrustScoreStatus(input: {
  doneCount: number;
  totalCount: number;
  verificationStatus: VerificationStatus;
}): DoorStatus {
  if (input.verificationStatus === "rejected") {
    return { status: "attention", label: "Verification rejected" };
  }
  if (input.verificationStatus === "pending") {
    return { status: "attention", label: "ID pending review" };
  }
  if (input.verificationStatus === "unverified" && input.doneCount === 0) {
    return { status: "attention", label: "ID still needed" };
  }
  if (input.doneCount < input.totalCount) {
    return { status: "attention", label: `${input.doneCount} of ${input.totalCount} complete` };
  }
  if (input.verificationStatus === "verified") {
    return { status: "active", label: "Verified" };
  }
  return { status: "attention", label: "ID still needed" };
}

/** "Rental history" tool card pill. */
export function getRentalHistoryStatus(input: { count: number }): DoorStatus {
  if (input.count === 0) {
    return { status: "neutral", label: "Nothing on record" };
  }
  return { status: "active", label: `${input.count} rental${input.count === 1 ? "" : "s"}` };
}
