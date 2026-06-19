import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import { tenant_interest_match_model } from "@/lib/scoring/interest-engine";
import { mapTenantProfile, mapProperty } from "@/lib/scoring/mappers";
import type { PropertyListing } from "@/lib/types";

export const dynamic = "force-dynamic";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtRand(cents: number) {
  return `R ${(cents / 100).toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function IconMapPin() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-slate-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function IconHouse() {
  return (
    <svg
      className="h-14 w-14 text-slate-300"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg
      className="h-4 w-4 text-green-600"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg
      className="h-5 w-5 text-blue-600"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  );
}

// ─── Score section (collapsible client component) ─────────────────────────────

import { CollapsibleScore } from "./CollapsibleScore";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function BrowsePropertyPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Load property
  const { data: raw } = await supabase
    .from("properties")
    .select("*")
    .eq("id", params.id)
    .in("status", ["available", "available_from"])
    .single();

  if (!raw) notFound();
  const property = raw as PropertyListing;

  // User roles
  let isLandlord = false;
  let isTenant = false;
  let hasTenantProfile = false;
  let scoreResult: Awaited<
    ReturnType<typeof tenant_interest_match_model>
  > | null = null;

  if (user) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("is_landlord, is_tenant")
      .eq("id", user.id)
      .single();
    isLandlord = prof?.is_landlord ?? false;
    isTenant = prof?.is_tenant ?? false;

    if (isTenant) {
      const { data: tp } = await supabase
        .from("tenant_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (tp) {
        hasTenantProfile = true;
        const profile = mapTenantProfile(tp as Record<string, unknown>);
        const propData = mapProperty(raw as Record<string, unknown>);
        scoreResult = tenant_interest_match_model(profile, propData);
      }
    }
  }

  // Landlord info
  const { data: ownerProf } = await supabase
    .from("profiles")
    .select("created_at")
    .eq("id", property.owner_id)
    .single();

  const { count: ownerListingCount } = await supabase
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", property.owner_id)
    .in("status", ["available", "available_from"]);

  const memberSince = ownerProf?.created_at
    ? new Date(ownerProf.created_at).getFullYear()
    : null;

  // Similar properties
  let similar: PropertyListing[] = [];
  if (property.suburb || property.province) {
    const { data: simRaw } = await supabase
      .from("properties")
      .select("*")
      .in("status", ["available", "available_from"])
      .neq("id", property.id)
      .eq(
        property.suburb ? "suburb" : "province",
        (property.suburb ?? property.province) as string,
      )
      .limit(3);
    similar = (simRaw ?? []) as PropertyListing[];
  }

  const deposit = property.asking_rent ? property.asking_rent * 2 : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <MarketingNav />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/browse" className="hover:text-slate-900">
            Browse
          </Link>
          <span>/</span>
          {property.suburb && (
            <>
              <Link
                href={`/browse?suburb=${encodeURIComponent(property.suburb)}`}
                className="hover:text-slate-900"
              >
                {property.suburb}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="truncate text-slate-900">{property.name}</span>
        </nav>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          {/* ── Left column ─────────────────────────────────────────────── */}
          <div className="space-y-5">
            {/* Photo gallery */}
            {property.photos?.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto rounded-2xl pb-1">
                {property.photos.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={url}
                    alt={`${property.name} photo ${i + 1}`}
                    className={`rounded-2xl object-cover shadow-sm ${
                      property.photos.length === 1
                        ? "h-72 w-full sm:h-96"
                        : "h-64 w-80 shrink-0 sm:h-80 sm:w-96"
                    }`}
                  />
                ))}
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center rounded-2xl bg-slate-200 sm:h-80">
                <IconHouse />
              </div>
            )}

            {/* Title + location */}
            <div>
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                {property.name}
              </h1>
              {(property.suburb || property.province) && (
                <div className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-500">
                  <IconMapPin />
                  <span>
                    {property.suburb}
                    {property.province ? `, ${property.province}` : ""}
                  </span>
                </div>
              )}
            </div>

            {/* Badges row */}
            <div className="flex flex-wrap gap-2">
              {property.bedrooms != null && (
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-700">
                  {property.bedrooms === 0
                    ? "Studio"
                    : `${property.bedrooms} bedroom${property.bedrooms !== 1 ? "s" : ""}`}
                </span>
              )}
              {property.property_type && (
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium capitalize text-slate-700">
                  {property.property_type}
                </span>
              )}
              {property.pets_allowed && (
                <span className="flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-sm font-medium text-green-700">
                  <IconCheck /> Pet friendly
                </span>
              )}
              {property.parking_available && (
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-700">
                  Parking included
                </span>
              )}
              {property.fibre_available && (
                <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                  Fibre ready
                </span>
              )}
            </div>

            {/* Rent */}
            <div>
              {property.asking_rent ? (
                <p className="text-3xl font-extrabold text-[#0f172a]">
                  {fmtRand(property.asking_rent)}
                  <span className="text-base font-normal text-slate-400">
                    /month
                  </span>
                </p>
              ) : (
                <p className="text-lg text-slate-400">Price on request</p>
              )}
              {property.available_from && (
                <p className="mt-1 text-sm text-slate-500">
                  Available from {fmtDate(property.available_from)}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
                Description
              </h2>
              {property.description ? (
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                  {property.description}
                </p>
              ) : (
                <p className="text-sm text-slate-400">
                  No description provided.
                </p>
              )}
            </div>

            {/* Property details table */}
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
                Property details
              </h2>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-100">
                  {[
                    {
                      label: "Property type",
                      value: property.property_type
                        ? property.property_type.charAt(0).toUpperCase() +
                          property.property_type.slice(1)
                        : "—",
                    },
                    {
                      label: "Bedrooms",
                      value:
                        property.bedrooms != null
                          ? property.bedrooms === 0
                            ? "Studio"
                            : String(property.bedrooms)
                          : "—",
                    },
                    {
                      label: "Floor size",
                      value: property.floor_size_m2
                        ? `${property.floor_size_m2} m²`
                        : "—",
                    },
                    {
                      label: "Available from",
                      value: property.available_from
                        ? fmtDate(property.available_from)
                        : "—",
                    },
                    {
                      label: "Pet friendly",
                      value: property.pets_allowed ? "Yes" : "No",
                    },
                    {
                      label: "Parking",
                      value: property.parking_available
                        ? "Included"
                        : "Not included",
                    },
                    {
                      label: "Fibre",
                      value: property.fibre_available
                        ? "Available"
                        : "Not listed",
                    },
                    {
                      label: "Deposit",
                      value: deposit ? fmtRand(deposit) : "—",
                    },
                  ].map((row) => (
                    <tr key={row.label}>
                      <td className="py-2.5 pr-4 text-slate-500">
                        {row.label}
                      </td>
                      <td className="py-2.5 font-medium text-slate-900">
                        {row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Property feature tags */}
            {(property.property_tags?.length > 0 ||
              property.area_tags?.length > 0 ||
              property.lifestyle_tags?.length > 0) && (
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
                  Features &amp; area
                </h2>
                <div className="flex flex-wrap gap-2">
                  {[
                    ...(property.property_tags ?? []),
                    ...(property.area_tags ?? []),
                    ...(property.lifestyle_tags ?? []),
                  ].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium capitalize text-slate-600"
                    >
                      {tag.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Score section — shown on mobile, above apply card */}
            <div className="lg:hidden">
              <CollapsibleScore
                scoreResult={scoreResult}
                user={user ? { id: user.id } : null}
                hasTenantProfile={hasTenantProfile}
              />
            </div>
          </div>

          {/* ── Right column (sticky) ────────────────────────────────────── */}
          <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            {/* Apply card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              {property.asking_rent && (
                <p className="text-2xl font-extrabold text-[#0f172a]">
                  {fmtRand(property.asking_rent)}
                  <span className="text-sm font-normal text-slate-400">
                    /month
                  </span>
                </p>
              )}
              {deposit && (
                <p className="mt-1 text-sm text-slate-500">
                  Deposit: {fmtRand(deposit)}
                </p>
              )}
              {property.available_from && (
                <p className="mt-0.5 text-xs text-slate-400">
                  Available from {fmtDate(property.available_from)}
                </p>
              )}

              <div className="my-4 border-t border-slate-100" />

              {/* CTA — conditional on auth state */}
              {isTenant && hasTenantProfile && scoreResult ? (
                <>
                  {/* Personalised: show score + apply */}
                  <div className="mb-4 flex items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1.5 text-lg font-extrabold tabular-nums ${
                        scoreResult.score >= 75
                          ? "bg-green-100 text-green-800"
                          : scoreResult.score >= 45
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {scoreResult.score}%
                    </span>
                    <p className="text-sm font-semibold text-slate-900">
                      This property is a {scoreResult.score}% match for you
                    </p>
                  </div>
                  <Link
                    href={`/apply?property_id=${property.id}`}
                    className="block w-full rounded-xl bg-blue-700 py-3.5 text-center text-sm font-bold text-white transition hover:bg-blue-800"
                  >
                    Apply for this property
                  </Link>
                  <p className="mt-2 text-center text-xs text-slate-400">
                    Your verified profile will be shared with the landlord on
                    application.
                  </p>
                </>
              ) : isTenant && hasTenantProfile ? (
                <>
                  <Link
                    href={`/apply?property_id=${property.id}`}
                    className="block w-full rounded-xl bg-blue-700 py-3.5 text-center text-sm font-bold text-white transition hover:bg-blue-800"
                  >
                    Apply for this property
                  </Link>
                  <p className="mt-2 text-center text-xs text-slate-400">
                    Your verified profile will be shared with the landlord on
                    application.
                  </p>
                </>
              ) : isTenant && !hasTenantProfile ? (
                <>
                  <Link
                    href="/tenant/profile"
                    className="block w-full rounded-xl bg-amber-600 py-3.5 text-center text-sm font-bold text-white transition hover:bg-amber-700"
                  >
                    Complete your profile to apply
                  </Link>
                  <p className="mt-2 text-center text-xs text-slate-400">
                    Build your verified profile first.
                  </p>
                </>
              ) : isLandlord && !isTenant ? (
                <>
                  <p className="mb-3 text-center text-sm text-slate-500">
                    You are viewing as a landlord.
                  </p>
                  <Link
                    href="/settings"
                    className="block text-center text-sm font-medium text-blue-600 hover:underline"
                  >
                    Add tenant profile to apply
                  </Link>
                </>
              ) : (
                <>
                  <p className="mb-4 text-sm font-semibold text-slate-900">
                    Sign in to apply for this property
                  </p>
                  <Link
                    href="/login"
                    className="block w-full rounded-xl border border-slate-900 py-3 text-center text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    className="mt-2 block w-full rounded-xl bg-blue-700 py-3.5 text-center text-sm font-bold text-white transition hover:bg-blue-800"
                  >
                    Register free
                  </Link>
                  <p className="mt-2 text-center text-xs text-slate-400">
                    Free to apply. No agent fees.
                  </p>
                </>
              )}
            </div>

            {/* Score section — desktop only */}
            <div className="hidden lg:block">
              <CollapsibleScore
                scoreResult={scoreResult}
                user={user ? { id: user.id } : null}
                hasTenantProfile={hasTenantProfile}
              />
            </div>

            {/* Landlord info */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                  <IconShield />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Verified PropTrust landlord
                  </p>
                  {memberSince && (
                    <p className="text-xs text-slate-400">
                      Member since {memberSince}
                    </p>
                  )}
                </div>
              </div>
              {ownerListingCount != null && ownerListingCount > 0 && (
                <p className="text-xs text-slate-500">
                  {ownerListingCount} active{" "}
                  {ownerListingCount === 1 ? "listing" : "listings"}
                </p>
              )}
              <p className="mt-2 text-xs text-slate-400">
                Landlord contact details are shared only after your application
                is accepted.
              </p>
            </div>
          </div>
        </div>

        {/* Similar properties */}
        {similar.length > 0 && (
          <section className="mt-12">
            <div className="mb-5 flex items-baseline justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                More properties in {property.suburb ?? property.province}
              </h2>
              <Link
                href={`/browse?${property.suburb ? `suburb=${encodeURIComponent(property.suburb)}` : `province=${encodeURIComponent(property.province ?? "")}`}`}
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                See all
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-3 lg:overflow-visible">
              {similar.map((p) => (
                <Link
                  key={p.id}
                  href={`/browse/${p.id}`}
                  className="group w-64 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md lg:w-auto"
                >
                  {p.photos?.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.photos[0]}
                      alt={p.name}
                      className="h-36 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-36 items-center justify-center bg-slate-100">
                      <svg
                        className="h-8 w-8 text-slate-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                        />
                      </svg>
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-700">
                      {p.name}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">{p.suburb}</p>
                    {p.asking_rent && (
                      <p className="mt-1.5 text-sm font-bold text-slate-900">
                        {fmtRand(p.asking_rent)}
                        <span className="text-xs font-normal text-slate-400">
                          /mo
                        </span>
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <MarketingFooter />
    </div>
  );
}
