/** Canonical component types with default lifespan ranges */
export const COMPONENT_TYPES = {
  geyser: { label: "Geyser", minYears: 8, maxYears: 12 },
  roof: { label: "Roof", minYears: 20, maxYears: 30 },
  paint_interior: { label: "Interior Painting", minYears: 5, maxYears: 7 },
  paint_exterior: { label: "Exterior Painting", minYears: 3, maxYears: 5 },
  plumbing: { label: "Plumbing", minYears: 20, maxYears: 40 },
  electrical: { label: "Electrical", minYears: 25, maxYears: 40 },
  carpets: { label: "Carpets", minYears: 5, maxYears: 10 },
  appliance: { label: "Appliance", minYears: 5, maxYears: 15 },
  hvac: { label: "HVAC / Air-con", minYears: 10, maxYears: 15 },
  windows_doors: { label: "Windows & Doors", minYears: 20, maxYears: 30 },
  driveway: { label: "Driveway", minYears: 15, maxYears: 25 },
  other: { label: "Other", minYears: 5, maxYears: 15 },
} as const;

export type ComponentTypeKey = keyof typeof COMPONENT_TYPES;

export type ComponentStatus = "green" | "amber" | "red";

export interface ComponentHealth {
  status: ComponentStatus;
  ageYears: number;
  yearsRemaining: number; // negative = past max lifespan
  label: string;
}

/**
 * Calculate the health status of a property component.
 *
 * Rules (based on max lifespan):
 *   red   — past max lifespan
 *   amber — within 12 months of max lifespan
 *   green — more than 12 months remaining
 */
export function getComponentHealth(
  installedDate: string,
  lifespanMaxYears: number,
): ComponentHealth {
  const installed = new Date(installedDate);
  const today = new Date();

  const ageMs = today.getTime() - installed.getTime();
  const ageYears = ageMs / (1000 * 60 * 60 * 24 * 365.25);
  const yearsRemaining = lifespanMaxYears - ageYears;

  let status: ComponentStatus;
  let label: string;

  if (yearsRemaining < 0) {
    status = "red";
    label = `${Math.round(Math.abs(yearsRemaining))}y past lifespan`;
  } else if (yearsRemaining <= 1) {
    status = "amber";
    const months = Math.ceil(yearsRemaining * 12);
    label = months <= 1 ? "Due within 1 month" : `Due in ~${months} months`;
  } else {
    status = "green";
    label = `~${Math.floor(yearsRemaining)}y remaining`;
  }

  return { status, ageYears, yearsRemaining, label };
}

/** Returns a badge class string for a component status */
export function componentStatusClass(status: ComponentStatus): string {
  return status === "green"
    ? "bg-emerald-100 text-emerald-700"
    : status === "amber"
      ? "bg-amber-100 text-amber-700"
      : "bg-red-100 text-red-700";
}

/** Returns a dot class string for use in small indicators */
export function componentStatusDot(status: ComponentStatus): string {
  return status === "green"
    ? "bg-emerald-500"
    : status === "amber"
      ? "bg-amber-500"
      : "bg-red-500";
}
