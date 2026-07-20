import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isPublicListingsEnabled, isMissingRelationError } from "@/lib/listings/feature-gate";
import { PUBLIC_LISTING_COLUMNS, type PublicListing } from "@/lib/listings/columns";
import { getVerificationStatusForUser } from "@/lib/listings/trustscore-server";
import { formatListingPrice } from "@/lib/listings/format";
import MarketingNav from "@/components/marketing/MarketingNav";
import { ApplyForm } from "./ApplyForm";

export const dynamic = "force-dynamic";

export default async function ApplyPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Defensive: middleware already gates this route for signed-out visitors
  // (it is not in the isPublic allowlist), this is a second layer.
  if (!user) redirect("/login");

  const enabled = await isPublicListingsEnabled(supabase);
  if (!enabled) notFound();

  const { data, error } = await supabase
    .from("public_listings")
    .select(PUBLIC_LISTING_COLUMNS)
    .eq("id", params.id)
    .maybeSingle();

  if (error && !isMissingRelationError(error)) {
    console.error("[listings/apply] failed to load listing:", error.message);
  }
  const listing = data as unknown as PublicListing | null;
  if (!listing) notFound();

  const { data: existing, error: existingErr } = await supabase
    .from("tenant_applications")
    .select("id")
    .eq("property_id", listing.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (existingErr) {
    console.error("[listings/apply] existing-application check failed:", existingErr.message);
  }

  const verificationStatus = await getVerificationStatusForUser(supabase, user.id);

  return (
    <div className="min-h-screen bg-[#F1ECE1] font-[family-name:var(--font-ibm-plex-sans)] text-[#1E2A2E] antialiased">
      <MarketingNav />

      <main className="mx-auto max-w-lg px-4 py-10 sm:px-6">
        <nav className="mb-6 text-sm text-[#1E2A2E]/60">
          <Link href={`/listings/${listing.id}`} className="hover:text-[#2A5462]">
            {listing.title}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[#2A5462]">Apply</span>
        </nav>

        <h1 className="font-[family-name:var(--font-newsreader)] text-3xl font-semibold text-[#2A5462]">
          Apply with your TrustScore
        </h1>
        <p className="mt-2 text-sm text-[#1E2A2E]/70">
          {listing.title}
          {listing.price_cents != null && ` · ${formatListingPrice(listing.price_cents)}`}
        </p>

        <div className="mt-6">
          <ApplyForm
            listingId={listing.id}
            alreadyApplied={!!existing}
            verificationStatus={verificationStatus}
          />
        </div>
      </main>
    </div>
  );
}
