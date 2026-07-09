import type { VerificationStatus } from "@/lib/types";

export type DoorStatusLevel = "active" | "attention" | "neutral";

export type DoorStatus = {
  status: DoorStatusLevel;
  label: string;
};

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
 * "Finding a place" door status. matchCount should already be filtered to
 * properties within the tenant's budget (the interest-engine scoring already
 * excludes anything the tenant marked as a dealbreaker or over budget).
 */
export function getFindingPlaceStatus(input: {
  discoverable: boolean;
  prefsComplete: boolean;
  matchCount: number;
}): DoorStatus {
  if (!input.discoverable) {
    return { status: "attention", label: "Search paused" };
  }
  if (!input.prefsComplete || input.matchCount === 0) {
    return { status: "neutral", label: "No matches yet" };
  }
  return {
    status: "active",
    label: `${input.matchCount} match${input.matchCount === 1 ? "" : "es"} within budget`,
  };
}

export function getLeaseStatus(input: {
  hasLease: boolean;
  leaseEnd: string | null;
}): DoorStatus {
  if (!input.hasLease) {
    return { status: "neutral", label: "Not added yet" };
  }
  return {
    status: "active",
    label: input.leaseEnd ? `Signed, expires ${fmtDate(input.leaseEnd)}` : "Signed, month to month",
  };
}

export function getApplicationsStatus(input: { activeCount: number }): DoorStatus {
  if (input.activeCount === 0) {
    return { status: "neutral", label: "None active" };
  }
  return { status: "active", label: `${input.activeCount} active` };
}

export function getPaymentsStatus(input: {
  obligation: { amountDueCents: number; dueDate: string; status: string } | null;
}): DoorStatus {
  const { obligation } = input;
  if (!obligation || obligation.status === "paid" || obligation.status === "waived") {
    return { status: "neutral", label: "Nothing due yet" };
  }
  const level: DoorStatusLevel = obligation.status === "failed" || obligation.status === "late"
    ? "attention"
    : "active";
  return {
    status: level,
    label: `${fmtRand(obligation.amountDueCents)} due ${fmtDate(obligation.dueDate)}`,
  };
}

export function getTrustScoreStatus(input: {
  doneCount: number;
  totalCount: number;
  verificationStatus: VerificationStatus;
}): DoorStatus {
  let label = `${input.doneCount} of ${input.totalCount} complete`;
  if (input.verificationStatus === "pending") {
    label += " · ID pending review";
  }
  const status: DoorStatusLevel =
    input.verificationStatus === "pending"
      ? "attention"
      : input.doneCount >= input.totalCount
        ? "active"
        : "neutral";
  return { status, label };
}
