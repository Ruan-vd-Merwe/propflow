import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EditPreferencesPanel } from "./EditPreferencesPanel";
import type { TenantProfile } from "@/lib/types";

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

      <div className="mx-auto max-w-4xl px-4 pb-12 pt-6 sm:py-8">
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
          <div className="mb-6 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
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
              className="min-h-[44px] shrink-0 rounded-lg border border-slate-200 px-4 py-2.5 text-center text-sm font-semibold text-blue-700 transition hover:bg-slate-50"
            >
              Verify now
            </Link>
          </div>
        )}

        {verStatus === "pending" && (
          <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-semibold text-blue-950">
              Verification pending
            </p>
            <p className="mt-1 text-sm leading-relaxed text-blue-900">
              Your documents are being checked for affordability and profile verification. Reviews usually finish within 24-48 hours.
            </p>
            <Link
              href="/onboarding/verification"
              className="mt-3 inline-flex min-h-[44px] items-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
            >
              View verification status
            </Link>
          </div>
        )}

        {/* ── Profile card ─────────────────────────────────────────────── */}
        <div className="card mb-6 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">
                  {profile?.full_name}
                </h1>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    tenantProfile.discoverable
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {tenantProfile.discoverable
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
                No preferences set. Add some to improve your match scores.
              </span>
            )}
          </div>
        </div>

        {/* ── Matches and applications live one tap away ──────────────────── */}
        <section className="mb-8">
          <div className="card flex flex-wrap items-center justify-between gap-3 p-5">
            <p className="text-sm text-slate-600">
              Property matches and introduction requests now have their own screens.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/tenant/matches"
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-slate-50"
              >
                View matches
              </Link>
              <Link
                href="/tenant/applications"
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-slate-50"
              >
                View applications
              </Link>
            </div>
          </div>
        </section>
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
