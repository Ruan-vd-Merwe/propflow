export function formatListingPrice(cents: number | null | undefined): string {
  if (cents == null) return "Price on request";
  return `R ${(cents / 100).toLocaleString("en-ZA", { maximumFractionDigits: 0 })}/month`;
}

export function formatBedrooms(bedrooms: number | null | undefined): string | null {
  if (bedrooms == null) return null;
  if (bedrooms === 0) return "Studio";
  return `${bedrooms} bedroom${bedrooms !== 1 ? "s" : ""}`;
}

export function formatFeatureLabel(tag: string): string {
  return tag.replace(/_/g, " ");
}
