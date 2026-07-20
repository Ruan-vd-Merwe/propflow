import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";
import { isPublicListingsEnabled, isMissingRelationError } from "@/lib/listings/feature-gate";
import { PUBLIC_LISTING_COLUMNS, type PublicListing } from "@/lib/listings/columns";
import { formatListingPrice, formatBedrooms, formatFeatureLabel } from "@/lib/listings/format";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import { ApplyCTA } from "./ApplyCTA";

export const dynamic = "force-dynamic";

async function loadListing(id: string): Promise<PublicListing | null> {
  const supabase = createClient();

  const enabled = await isPublicListingsEnabled(supabase);
  if (!enabled) return null;

  const { data, error } = await supabase
    .from("public_listings")
    .select(PUBLIC_LISTING_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if (!isMissingRelationError(error)) {
      console.error("[listings] failed to load listing:", error.message);
    }
    return null;
  }

  return (data as unknown as PublicListing) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const listing = await loadListing(params.id);
  if (!listing) {
    return { title: "Listing not found | PropTrust" };
  }

  const description =
    listing.description?.slice(0, 160) ??
    `${formatBedrooms(listing.bedrooms) ?? "Property"} in ${listing.suburb ?? "South Africa"}, ${formatListingPrice(listing.price_cents)}.`;
  const image = listing.image_refs?.[0];
  const url = `${getSiteUrl()}/listings/${listing.id}`;

  return {
    title: `${listing.title} | PropTrust`,
    description,
    openGraph: {
      title: listing.title,
      description,
      url,
      type: "website",
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: listing.title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function PublicListingPage({
  params,
}: {
  params: { id: string };
}) {
  const listing = await loadListing(params.id);
  if (!listing) notFound();

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let alreadyApplied = false;
  if (user) {
    const { data: existing, error } = await supabase
      .from("tenant_applications")
      .select("id")
      .eq("property_id", listing.id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) {
      console.error("[listings] existing-application check failed:", error.message);
    }
    alreadyApplied = !!existing;
  }

  return (
    <div className="min-h-screen bg-[#F1ECE1] font-[family-name:var(--font-ibm-plex-sans)] text-[#1E2A2E] antialiased">
      <MarketingNav />

      <main className="mx-auto max-w-[var(--pt-container-max)] px-4 py-8 sm:px-6 sm:py-12">
        {/* Photos */}
        {listing.image_refs?.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto rounded-2xl pb-1">
            {listing.image_refs.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={url}
                alt={`${listing.title} photo ${i + 1}`}
                className={`rounded-2xl object-cover shadow-sm ${
                  listing.image_refs.length === 1
                    ? "h-64 w-full sm:h-96"
                    : "h-56 w-72 shrink-0 sm:h-80 sm:w-96"
                }`}
              />
            ))}
          </div>
        ) : (
          <div className="flex h-56 items-center justify-center rounded-2xl bg-white sm:h-80">
            <span className="text-sm text-[#1E2A2E]/40">No photos yet</span>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          {/* ── Left column ── */}
          <div className="space-y-5">
            <div>
              <h1 className="font-[family-name:var(--font-newsreader)] text-3xl font-semibold text-[#2A5462] sm:text-4xl">
                {listing.title}
              </h1>
              {listing.suburb && (
                <p className="mt-1.5 text-sm text-[#1E2A2E]/60">{listing.suburb}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {formatBedrooms(listing.bedrooms) && (
                <span className="rounded-full border border-[rgba(30,42,46,0.13)] bg-white px-3 py-1 text-sm font-medium text-[#1E2A2E]">
                  {formatBedrooms(listing.bedrooms)}
                </span>
              )}
              {listing.features.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[rgba(30,42,46,0.13)] bg-white px-3 py-1 text-xs font-medium capitalize text-[#1E2A2E]/80"
                >
                  {formatFeatureLabel(tag)}
                </span>
              ))}
            </div>

            <p className="text-3xl font-extrabold text-[#2A5462]">
              {formatListingPrice(listing.price_cents)}
            </p>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-[#1E2A2E]/50">
                Description
              </h2>
              {listing.description ? (
                <p className="whitespace-pre-line text-sm leading-relaxed text-[#1E2A2E]/80">
                  {listing.description}
                </p>
              ) : (
                <p className="text-sm text-[#1E2A2E]/40">No description provided.</p>
              )}
            </div>
          </div>

          {/* ── Right column: apply card ── */}
          <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border border-[rgba(30,42,46,0.13)] bg-white p-6 shadow-sm">
              <p className="text-2xl font-extrabold text-[#2A5462]">
                {formatListingPrice(listing.price_cents)}
              </p>

              <div className="my-4 border-t border-[rgba(30,42,46,0.13)]" />

              <ApplyCTA listingId={listing.id} alreadyApplied={alreadyApplied} />

              <p className="mt-3 text-center text-xs text-[#1E2A2E]/50">
                Applying through PropTrust is the contact channel for this property.
                No landlord contact details are shared before you apply.
              </p>
            </div>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
