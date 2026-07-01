import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { rank_properties_for_tenant_interests } from "@/lib/scoring/interest-engine";
import { mapTenantProfile, mapProperty } from "@/lib/scoring/mappers";
import { EditPreferencesPanel } from "./EditPreferencesPanel";
import type {
  TenantProfile,
  PropertyListing,
  IntroductionRequest,
} from "@/lib/types";

export const dynamic = "force-dynamic";

const EMPLOYMENT_LABELS: Record<string, string> = {
  employed: "Employed",
  self_employed: "Self-employed",
  student: "Student",
  other: "Other",
};

const INCOME_BAND_LABELS: Record<string, string> = {
  under_10k: "Under R10,000",
  "10k_20k": "R10k – R20k",
  "20k_35k": "R20k – R35k",
  "35k_50k": "R35k – R50k",
  "50k_plus": "R50,000+",
};

const VERIFICATION_BADGE: Record<string, { label: string; cls: string }> = {
  unverified: { label: "Unverified", cls: "bg-slate-100 text-slate-500" },
  pending: { label: "Verification pending", cls: "bg-amber-100 text-amber-700" },
  verified: { label: "TrustScore ✓", cls: "bg-green-100 text-green-700" },
  rejected: { label: "Verification rejected", cls: "bg-red-100 text-red-700" },
};

function fmt(cents: number) {
  return `R${(cents / 100).toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`;
}

function MatchBadge({ score }: { score: number }) {
  const cls =
    score >= 75
      ? "bg-green-100 text-green-800"
      : score >= 45
        ? "bg-amber-100 text-amber-800"
        : "bg-red-100 text-red-800";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${cls}`}
    >
      {score}/100
    </span>
  );
}

export default async function TenantProfilePage({
  searchParams,
}: {
  searchParams: { welcome?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const isWelcome = searchParams.welcome === "1";

  const [{ data: tp }, { data: profile }] = await Promise.all([
    supabase
      .from("tenant_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("profiles")
      .select("full_name, email, phone")
      .eq("id", user.id)
      .single(),
  ]);

  const tenantProfile = tp as TenantProfile | null;

  if (!tenantProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="card max-w-md p-8 text-center">
          <h1 className="text-xl font-bold text-slate-900">
            Profile not found
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Your tenant profile could not be loaded. Please contact support or
            try logging in again.
          </p>
        </div>
      </div>
    );
  }

  // ── Match listed properties ───────────────────────────────────────────────
  const { data: rawProps } = await supabase
    .from("properties")
    .select("*")
    .in("status", ["available", "available_from"])
    .order("created_at", { ascending: false })
    .limit(50);

  const tenantMappedProfile = mapTenantProfile(
    tenantProfile as unknown as Record<string, unknown>,
  );
  const props = (rawProps ?? []) as PropertyListing[];
  const scoredProperties = (() => {
    if (props.length === 0) return [];
    const propData = props.map((p) =>
      mapProperty(p as unknown as Record<string, unknown>),
    );
    const results = rank_properties_for_tenant_interests(
      propData,
      tenantMappedProfile,
    );
    const propById = new Map(props.map((p) => [p.id, p]));
    return results
      .filter(
        (r) =>
          r.status === "ranked" && r.property_id && propById.has(r.property_id),
      )
      .slice(0, 12)
      .map((r) => ({
        property: propById.get(r.property_id!)! as PropertyListing,
        score: r.score,
        match_reasons: r.match_reasons,
      }));
  })();

  // ── Introduction requests ─────────────────────────────────────────────────
  const { data: introRaw } = await supabase
    .from("introduction_requests")
    .select("*")
    .eq("tenant_id", user.id)
    .order("created_at", { ascending: false });

  const introductions = (introRaw ?? []) as IntroductionRequest[];

  // ── Onboarding state ────────────────────────────────────────────────────────
  const prefsDone = tenantProfile.preferences_complete;
  const affordDone = tenantProfile.affordability_complete;
  const verStatus = tenantProfile.verification_status ?? "unverified";

  return (
    <div className="min-h-screen bg-slate-50">

      {isWelcome && (
        <div className="border-b border-green-500 bg-green-600 px-6 py-4 text-center text-white">
          <p className="font-semibold">Welcome to PropTrust!</p>
          <p className="mt-0.5 text-sm text-green-100">
            Your profile is set up. Landlords matching your preferences will be
            able to find and contact you.
          </p>
        </div>
      )}

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* ── Onboarding prompts based on step completion ─────────────── */}
        {!prefsDone && (
          <div className="mb-6 overflow-hidden rounded-2xl bg-[#0f172a] p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex-1">
                <p className="text-base font-bold text-white">
                  Complete your preferences to see recommendations
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Tell us where you want to live and your budget so we can match
                  you with suitable properties.
                </p>
              </div>
              <Link
                href="/onboarding/preferences"
                className="shrink-0 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Add preferences
              </Link>
            </div>
          </div>
        )}

        {prefsDone && !affordDone && (
          <div className="mb-6 overflow-hidden rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex-1">
                <p className="text-sm font-bold text-blue-900">
                  Complete your affordability profile for better matches
                </p>
                <p className="mt-1 text-xs text-blue-700">
                  We&apos;re showing recommendations based on your budget. Add your
                  income range to see which properties you&apos;ll qualify for.
                </p>
              </div>
              <Link
                href="/onboarding/affordability"
                className="shrink-0 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
              >
                Add affordability
              </Link>
            </div>
          </div>
        )}

        {/* Verification nudge — non-pushy, never a blocker */}
        {prefsDone && affordDone && verStatus === "unverified" && (
          <div className="mb-6 flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
              <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-700">
                Get verified to rank higher in landlord searches
              </p>
            </div>
            <Link
              href="/onboarding/verification"
              className="shrink-0 text-sm font-semibold text-blue-700 hover:underline"
            >
              Verify now
            </Link>
          </div>
        )}

        {/* ── Profile card ─────────────────────────────────────────────── */}
        <div className="card mb-6 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">
                  {profile?.full_name}
                </h1>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    tenantProfile.is_visible
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {tenantProfile.is_visible
                    ? "● Actively looking"
                    : "○ Not looking"}
                </span>
                {verStatus !== "unverified" && (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${VERIFICATION_BADGE[verStatus]?.cls ?? ""}`}
                  >
                    {VERIFICATION_BADGE[verStatus]?.label ?? verStatus}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500">{profile?.email}</p>
              {profile?.phone && (
                <p className="text-sm text-slate-500">{profile.phone}</p>
              )}
            </div>

            {/* Edit button — client component island */}
            <div className="shrink-0">
              <EditPreferencesPanel
                tenantProfile={tenantProfile}
                userId={user.id}
              />
            </div>
          </div>

          {/* Preferences summary */}
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {tenantProfile.looking_in_area ? (
              <Stat
                label="Looking in"
                value={`${tenantProfile.looking_in_area}${tenantProfile.looking_in_province ? ", " + tenantProfile.looking_in_province : ""}`}
              />
            ) : (
              <StatEmpty label="Looking in" />
            )}
            {tenantProfile.budget_max ? (
              <Stat
                label="Budget"
                value={`${tenantProfile.budget_min ? fmt(tenantProfile.budget_min) : "–"} – ${fmt(tenantProfile.budget_max)}/mo`}
              />
            ) : (
              <StatEmpty label="Budget" />
            )}
            {tenantProfile.move_in_date ? (
              <Stat
                label="Move-in"
                value={new Date(tenantProfile.move_in_date).toLocaleDateString(
                  "en-ZA",
                  {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  },
                )}
              />
            ) : (
              <StatEmpty label="Move-in" />
            )}
            {tenantProfile.lease_length_months ? (
              <Stat
                label="Lease"
                value={`${tenantProfile.lease_length_months} months`}
              />
            ) : (
              <StatEmpty label="Lease" />
            )}
            {tenantProfile.employment_status && (
              <Stat
                label="Employment"
                value={
                  EMPLOYMENT_LABELS[tenantProfile.employment_status] ??
                  tenantProfile.employment_status
                }
              />
            )}
            {tenantProfile.income_band && (
              <Stat
                label="Income range"
                value={INCOME_BAND_LABELS[tenantProfile.income_band] ?? tenantProfile.income_band}
              />
            )}
            {tenantProfile.affordability_max_cents && (
              <Link
                href="/onboarding/affordability"
                className="group rounded-lg bg-slate-50 px-3 py-2.5 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <p className="text-xs font-medium text-slate-400">Affordability</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900 group-hover:text-blue-700">
                  {tenantProfile.affordability_min_cents
                    ? fmt(tenantProfile.affordability_min_cents)
                    : "–"}{" "}
                  – {fmt(tenantProfile.affordability_max_cents)}/mo
                </p>
              </Link>
            )}
          </div>

          {/* Search preferences link */}
          <div className="mt-4 border-t border-slate-100 pt-4">
            <Link
              href="/tenant/preferences"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Edit search preferences
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
            {prefsDone ? (
              <span className="ml-3 text-xs text-slate-400">Preferences saved</span>
            ) : (
              <span className="ml-3 text-xs text-amber-600">
                No preferences set — add some to improve your match scores
              </span>
            )}
          </div>
        </div>

        {/* ── Matched properties ────────────────────────────────────────── */}
        <section className="mb-8">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900">
              Matched properties
              <span className="ml-2 text-sm font-normal text-slate-500">
                {scoredProperties.length} listing
                {scoredProperties.length !== 1 ? "s" : ""} match your search
              </span>
            </h2>
            <Link
              href="/how-scoring-works"
              className="shrink-0 text-xs text-slate-400 hover:text-slate-700 hover:underline"
            >
              How scoring works
            </Link>
          </div>

          {scoredProperties.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-slate-500">
                {!prefsDone
                  ? "Complete your preferences to see property recommendations."
                  : "No listed properties match your search yet."}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {!prefsDone
                  ? "We need your area and budget to start matching."
                  : !affordDone
                    ? "Completing your affordability profile will improve match accuracy."
                    : "Update your preferences or check back soon."}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {scoredProperties.map(({ property: p, score, match_reasons }) => (
                <Link
                  key={p.id}
                  href={`/browse/${p.id}`}
                  className="card overflow-hidden transition hover:shadow-md"
                >
                  {p.photos?.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.photos[0]}
                      alt={p.name}
                      className="h-40 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-40 items-center justify-center bg-slate-100">
                      <svg
                        className="h-10 w-10 text-slate-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                        />
                      </svg>
                    </div>
                  )}
                  <div className="p-4">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <p className="font-semibold leading-snug text-slate-900">
                        {p.name}
                      </p>
                      <MatchBadge score={score} />
                    </div>
                    <p className="text-xs text-slate-500">
                      {p.suburb}
                      {p.province ? `, ${p.province}` : ""}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      {p.asking_rent && (
                        <span className="text-base font-bold text-slate-900">
                          {fmt(p.asking_rent)}
                          <span className="text-xs font-normal text-slate-400">
                            /mo
                          </span>
                        </span>
                      )}
                      <div className="flex gap-2 text-xs text-slate-500">
                        {p.bedrooms != null && (
                          <span>
                            {p.bedrooms === 0 ? "Studio" : `${p.bedrooms} bed`}
                          </span>
                        )}
                        {p.property_type && (
                          <span className="capitalize">{p.property_type}</span>
                        )}
                      </div>
                    </div>
                    {match_reasons.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {match_reasons.slice(0, 3).map((r, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                            <span className="text-xs text-green-700">{r}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="mt-3 text-xs font-medium text-blue-600">
                      View score breakdown →
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ── Introduction requests ──────────────────────────────────────── */}
        {introductions.length > 0 && (
          <section id="introductions" className="mb-8">
            <h2 className="mb-4 text-lg font-bold text-slate-900">
              Introduction requests
            </h2>
            <div className="card divide-y divide-slate-100">
              {introductions.map((intro) => (
                <IntroductionRow key={intro.id} intro={intro} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

// ── Server-side helpers ────────────────────────────────────────────────────────

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2.5">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function StatEmpty({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2.5">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="mt-0.5 text-xs text-slate-300">Not set</p>
    </div>
  );
}

function IntroductionRow({ intro }: { intro: IntroductionRequest }) {
  const statusCls =
    intro.status === "pending"
      ? "bg-amber-100 text-amber-700"
      : intro.status === "accepted"
        ? "bg-green-100 text-green-700"
        : "bg-slate-100 text-slate-500";
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div>
        <p className="text-sm font-medium text-slate-900">
          Introduction request
        </p>
        <p className="text-xs text-slate-500">
          {new Date(intro.created_at).toLocaleDateString("en-ZA", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>
      <span
        className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusCls}`}
      >
        {intro.status}
      </span>
    </div>
  );
}



