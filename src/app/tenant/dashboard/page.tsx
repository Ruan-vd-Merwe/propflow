import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { rank_properties_for_tenant_interests } from "@/lib/scoring/interest-engine";
import { mapTenantProfile, mapProperty } from "@/lib/scoring/mappers";
import type { TenantProfile, PropertyListing } from "@/lib/types";

export const dynamic = "force-dynamic";

// ── Local types for joined rows ───────────────────────────────────────────────

type AppRow = {
  id: string;
  property_id: string;
  status: string;
  created_at: string;
  properties: { name: string; suburb: string | null } | null;
};

type IntroRow = {
  id: string;
  landlord_id: string;
  property_id: string;
  status: string;
  created_at: string;
  properties: { name: string; suburb: string | null } | null;
};

// ── Display maps ──────────────────────────────────────────────────────────────

const VERIFICATION_BADGE: Record<string, { label: string; cls: string }> = {
  unverified: { label: "Unverified",       cls: "bg-slate-100 text-slate-500"  },
  pending:    { label: "Pending review",   cls: "bg-amber-100 text-amber-700"  },
  verified:   { label: "TrustScore ✓",    cls: "bg-green-100 text-green-700"  },
  rejected:   { label: "Review rejected",  cls: "bg-red-100 text-red-700"     },
};

const APP_STATUS: Record<string, { label: string; cls: string }> = {
  pending:  { label: "Under review",  cls: "bg-amber-100 text-amber-700" },
  approved: { label: "Approved",      cls: "bg-green-100 text-green-700" },
  rejected: { label: "Not approved",  cls: "bg-red-100 text-red-700"    },
};

const INTRO_STATUS: Record<string, { label: string; cls: string }> = {
  pending:  { label: "Awaiting your response", cls: "bg-amber-100 text-amber-700" },
  accepted: { label: "Connected",              cls: "bg-green-100 text-green-700" },
  declined: { label: "Declined",               cls: "bg-slate-100 text-slate-500" },
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function TenantDashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: tp },
    { data: profile },
    { data: appsRaw },
    { data: introRaw },
    { data: rawProps },
  ] = await Promise.all([
    supabase.from("tenant_profiles").select("*").eq("user_id", user.id).single(),
    supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single(),
    supabase
      .from("tenant_applications")
      .select("id, property_id, status, created_at, properties(name, suburb)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("introduction_requests")
      .select("id, landlord_id, property_id, status, created_at, properties(name, suburb)")
      .eq("tenant_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("properties")
      .select("*")
      .in("status", ["available", "available_from"])
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const tenantProfile = tp as TenantProfile | null;
  if (!tenantProfile) redirect("/onboarding/preferences");

  const applications = (appsRaw ?? []) as unknown as AppRow[];
  const introductions = (introRaw ?? []) as unknown as IntroRow[];

  // ── Onboarding state ────────────────────────────────────────────────────────
  const prefsDone   = tenantProfile.preferences_complete;
  const affordDone  = tenantProfile.affordability_complete;
  const verStatus   = tenantProfile.verification_status ?? "unverified";
  const isLooking   = tenantProfile.is_visible ?? false;
  const firstName   = profile?.full_name?.split(" ")[0] ?? "there";
  const hasAnyIncomplete = !prefsDone || !affordDone || verStatus === "unverified";

  // ── Matched properties ──────────────────────────────────────────────────────
  const scoredProperties = (() => {
    const props = (rawProps ?? []) as PropertyListing[];
    if (props.length === 0 || !prefsDone) return [];
    const mapped = mapTenantProfile(tenantProfile as unknown as Record<string, unknown>);
    const propData = props.map((p) => mapProperty(p as unknown as Record<string, unknown>));
    const results = rank_properties_for_tenant_interests(propData, mapped);
    const propById = new Map(props.map((p) => [p.id, p]));
    return results
      .filter((r) => r.status === "ranked" && r.property_id && propById.has(r.property_id))
      .slice(0, 6)
      .map((r) => ({
        property: propById.get(r.property_id!)! as PropertyListing,
        score: r.score,
        match_reasons: r.match_reasons,
      }));
  })();

  const verBadge = VERIFICATION_BADGE[verStatus] ?? VERIFICATION_BADGE.unverified;

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />

      <main className="mx-auto max-w-6xl px-6 py-8">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Hi {firstName}</h1>
            <p className="mt-1 text-sm text-slate-500">Your rental dashboard</p>
          </div>
          <span
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              isLooking ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
            }`}
          >
            {isLooking ? "Actively looking" : "Search hidden"}
          </span>
        </div>

        {/* ── Stats row ───────────────────────────────────────────────────── */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard label="Applications sent" value={String(applications.length)} />
          <StatCard label="Introductions"     value={String(introductions.length)} />
          <div className="card p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              TrustScore
            </p>
            <span className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${verBadge.cls}`}>
              {verBadge.label}
            </span>
          </div>
        </div>

        {/* ── Onboarding prompts — self-hides when all complete ───────────── */}
        {hasAnyIncomplete && (
          <div className="mb-8 space-y-3">
            {!prefsDone && (
              <div className="overflow-hidden rounded-2xl bg-[#0f172a] p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex-1">
                    <p className="text-base font-bold text-white">
                      Complete your preferences
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Tell us where you want to live and your budget so we can
                      match you with suitable properties.
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
              <div className="overflow-hidden rounded-2xl border border-blue-200 bg-blue-50 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-blue-900">
                      Complete your affordability profile
                    </p>
                    <p className="mt-1 text-xs text-blue-700">
                      Add your income range to see which properties you&apos;ll
                      qualify for.
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

            {prefsDone && affordDone && verStatus === "unverified" && (
              <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                  <svg
                    className="h-5 w-5 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                    />
                  </svg>
                </div>
                <p className="flex-1 text-sm font-medium text-slate-700">
                  Get verified to rank higher in landlord searches
                </p>
                <Link
                  href="/onboarding/verification"
                  className="shrink-0 text-sm font-semibold text-blue-700 hover:underline"
                >
                  Verify now
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ── Applications ─────────────────────────────────────────────────── */}
        <section className="mb-8">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Applications
            </h2>
            {applications.length > 5 && (
              <Link
                href="/tenant/applications"
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                View all {applications.length} →
              </Link>
            )}
          </div>

          {applications.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-slate-500">
                You haven&apos;t applied to any properties yet.
              </p>
              <Link
                href="/tenant/browse"
                className="mt-3 inline-block text-sm font-semibold text-blue-700 hover:underline"
              >
                Find Properties →
              </Link>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="divide-y divide-slate-100">
                {applications.slice(0, 5).map((app) => {
                  const s =
                    APP_STATUS[app.status] ?? {
                      label: app.status,
                      cls: "bg-slate-100 text-slate-500",
                    };
                  const prop = app.properties;
                  return (
                    <div
                      key={app.id}
                      className="flex items-center gap-4 px-5 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {prop?.name ?? "Property"}
                        </p>
                        {prop?.suburb && (
                          <p className="text-xs text-slate-400">{prop.suburb}</p>
                        )}
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${s.cls}`}
                      >
                        {s.label}
                      </span>
                      <span className="shrink-0 text-xs text-slate-400">
                        {fmtDate(app.created_at)}
                      </span>
                    </div>
                  );
                })}
              </div>
              {applications.length > 5 && (
                <div className="border-t border-slate-100 px-5 py-3 text-center">
                  <Link
                    href="/tenant/applications"
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    View all {applications.length} applications →
                  </Link>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── Introductions ───────────────────────────────────────────────── */}
        <section className="mb-8">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
            Introductions
          </h2>

          {introductions.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-slate-500">No introductions yet.</p>
              <p className="mt-1 text-sm text-slate-400">
                When a landlord contacts you, their invitation will appear here.
              </p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="divide-y divide-slate-100">
                {introductions.map((intro) => {
                  const s =
                    INTRO_STATUS[intro.status] ?? {
                      label: intro.status,
                      cls: "bg-slate-100 text-slate-500",
                    };
                  const prop = intro.properties;
                  return (
                    <div
                      key={intro.id}
                      className="flex items-center gap-4 px-5 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {prop?.name ?? "Property"}
                        </p>
                        {prop?.suburb && (
                          <p className="text-xs text-slate-400">{prop.suburb}</p>
                        )}
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${s.cls}`}
                      >
                        {s.label}
                      </span>
                      <span className="shrink-0 text-xs text-slate-400">
                        {fmtDate(intro.created_at)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* ── Current tenancy — PARKED ────────────────────────────────────── */}
        <section className="mb-8">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
            Current Tenancy
          </h2>
          <div className="card p-8 text-center">
            <p className="text-sm font-medium text-slate-500">
              No active lease on PropTrust yet.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Lease tracking will appear here once your landlord adds you to a
              lease.
            </p>
          </div>
        </section>

        {/* ── Matched properties ───────────────────────────────────────────── */}
        <section>
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Matched Properties
            </h2>
            <Link
              href="/tenant/preferences"
              className="text-xs font-medium text-slate-400 hover:text-slate-700 hover:underline"
            >
              Edit preferences →
            </Link>
          </div>

          {/* Preferences summary pill-row */}
          {(tenantProfile.looking_in_area || tenantProfile.budget_max) && (
            <div className="card mb-4 p-4">
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600">
                {tenantProfile.looking_in_area && (
                  <span>
                    <span className="font-medium">Looking in:</span>{" "}
                    {tenantProfile.looking_in_area}
                    {tenantProfile.looking_in_province
                      ? `, ${tenantProfile.looking_in_province}`
                      : ""}
                  </span>
                )}
                {tenantProfile.budget_max && (
                  <span>
                    <span className="font-medium">Budget:</span> R
                    {((tenantProfile.budget_min ?? 0) / 100).toLocaleString()} –
                    R{(tenantProfile.budget_max / 100).toLocaleString()}/mo
                  </span>
                )}
                {tenantProfile.move_in_date && (
                  <span>
                    <span className="font-medium">Move in:</span>{" "}
                    {new Date(tenantProfile.move_in_date).toLocaleDateString(
                      "en-ZA",
                      { month: "short", year: "numeric" },
                    )}
                  </span>
                )}
              </div>
            </div>
          )}

          {scoredProperties.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-slate-500">No matching properties yet.</p>
              {!prefsDone ? (
                <Link
                  href="/onboarding/preferences"
                  className="mt-3 inline-block text-sm font-semibold text-blue-700 hover:underline"
                >
                  Add preferences to see matches →
                </Link>
              ) : (
                <Link
                  href="/tenant/browse"
                  className="mt-3 inline-block text-sm font-semibold text-blue-700 hover:underline"
                >
                  Browse all properties →
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {scoredProperties.map(({ property: p, score, match_reasons }) => (
                <div
                  key={p.id}
                  className="card flex items-center gap-4 overflow-hidden p-0"
                >
                  {/* Thumbnail */}
                  <div className="h-24 w-24 shrink-0 overflow-hidden sm:h-28 sm:w-32">
                    {p.photos?.length > 0 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.photos[0]}
                        alt={p.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-100">
                        <svg
                          className="h-8 w-8 text-slate-300"
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
                  </div>

                  {/* Details */}
                  <div className="min-w-0 flex-1 py-3">
                    <p className="truncate font-semibold text-slate-900">
                      {p.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {p.suburb}
                      {p.province ? `, ${p.province}` : ""}
                    </p>
                    {p.asking_rent && (
                      <p className="mt-1 text-sm font-bold text-slate-900">
                        R{(p.asking_rent / 100).toLocaleString("en-ZA")}
                        <span className="text-xs font-normal text-slate-400">
                          /mo
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Score + actions */}
                  <div className="flex shrink-0 flex-col items-end gap-2 pr-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ${
                        score >= 75
                          ? "bg-green-100 text-green-700"
                          : score >= 45
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {score}/100
                    </span>
                    {match_reasons.length > 0 && (
                      <ul className="max-w-[180px] space-y-1 text-right">
                        {match_reasons.slice(0, 2).map((r, i) => (
                          <li
                            key={i}
                            className="flex items-start justify-end gap-1.5"
                          >
                            <span className="text-[11px] leading-snug text-green-700">
                              {r}
                            </span>
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                          </li>
                        ))}
                      </ul>
                    )}
                    <Link
                      href={`/browse/${p.id}`}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}

              <div className="pt-2 text-center">
                <Link
                  href="/tenant/browse"
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  Browse all properties →
                </Link>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  valueClass = "text-slate-900",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="card p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold ${valueClass}`}>{value}</p>
    </div>
  );
}
