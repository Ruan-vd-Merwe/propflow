import type { ListingFieldKey } from "@/lib/anthropic";

export type { ListingFieldKey };

// Canonical, comparable shape used by the assistant — Rand not cents,
// bathrooms as a number not the form's string bucket. The wizard
// (properties/new/page.tsx) converts to/from its own field types at the
// boundary so the assistant doesn't need to know about form-specific
// representations like the "3+" bathrooms bucket.
export interface ListingFormSnapshot {
  property_type: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  asking_rent: number | null;
  deposit_amount: number | null;
  available_from: string | null;
  suburb: string | null;
  description: string | null;
  pets_allowed: boolean;
  parking_available: boolean;
  fibre_available: boolean;
  property_tags: string[];
  area_tags: string[];
  lifestyle_tags: string[];
}

export const FIELD_LABELS: Record<
  keyof Omit<
    ListingFormSnapshot,
    "property_tags" | "area_tags" | "lifestyle_tags"
  >,
  string
> = {
  property_type: "Property type",
  bedrooms: "Bedrooms",
  bathrooms: "Bathrooms",
  asking_rent: "Monthly rent",
  deposit_amount: "Deposit",
  available_from: "Available from",
  suburb: "Suburb",
  description: "Description",
  pets_allowed: "Pets allowed",
  parking_available: "Parking",
  fibre_available: "Fibre internet",
};

export type TagCatalogEntry = { value: string; label: string };

export interface TagCatalogs {
  property_tags: TagCatalogEntry[];
  area_tags: TagCatalogEntry[];
  lifestyle_tags: TagCatalogEntry[];
}

export type FieldStatus = "found" | "missing" | "uncertain" | "conflict";
