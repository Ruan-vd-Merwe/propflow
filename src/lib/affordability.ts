import type { IncomeBand } from "./types";

export const RENT_TO_INCOME_RATIO = 0.30;

export const INCOME_BANDS: {
  value: IncomeBand;
  label: string;
  minCents: number;
  maxCents: number | null;
}[] = [
  { value: "under_10k", label: "Under R10,000", minCents: 0, maxCents: 1000000 },
  { value: "10k_20k", label: "R10,000 – R20,000", minCents: 1000000, maxCents: 2000000 },
  { value: "20k_35k", label: "R20,000 – R35,000", minCents: 2000000, maxCents: 3500000 },
  { value: "35k_50k", label: "R35,000 – R50,000", minCents: 3500000, maxCents: 5000000 },
  { value: "50k_plus", label: "R50,000+", minCents: 5000000, maxCents: null },
];

export function deriveAffordability(band: IncomeBand): {
  min: number;
  max: number | null;
} {
  const b = INCOME_BANDS.find((ib) => ib.value === band);
  if (!b) return { min: 0, max: 0 };
  const min = Math.round(b.minCents * RENT_TO_INCOME_RATIO);
  const max = b.maxCents ? Math.round(b.maxCents * RENT_TO_INCOME_RATIO) : null;
  return { min, max };
}
