// Column list for the anon-safe public_listings view (see
// supabase/migrations/20260720120000_public_listings.sql). Keep this in
// sync with the view definition. Never select "*" against public_listings
// and never add owner_id, address, or any financial column here.

export const PUBLIC_LISTING_COLUMNS =
  "id, title, description, price_cents, suburb, bedrooms, features, image_refs, published";

export type PublicListing = {
  id: string;
  title: string;
  description: string | null;
  price_cents: number | null;
  suburb: string | null;
  bedrooms: number | null;
  features: string[];
  image_refs: string[];
  published: boolean;
};
