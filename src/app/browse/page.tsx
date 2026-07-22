import { createClient } from "@/lib/supabase/server";
import { BrowseListing } from "./BrowseListing";
import { PUBLIC_PROPERTY_COLUMNS, type PropertyListing } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BrowsePage() {
  const supabase = createClient();

  // Load properties server-side for fast initial render.
  // Auth detection and score personalisation happen client-side in BrowseListing.
  const { data: rawProps } = await supabase
    .from("properties")
    .select(PUBLIC_PROPERTY_COLUMNS)
    .in("status", ["available", "available_from"])
    .order("created_at", { ascending: false })
    .limit(100);

  const properties = (rawProps ?? []) as unknown as PropertyListing[];

  return <BrowseListing properties={properties} />;
}
