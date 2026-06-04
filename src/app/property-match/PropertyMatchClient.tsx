"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { NavBar } from "@/components/NavBar";
import type { SlimResult } from "./page";
import type { PropertyWithMeta } from "./mock-data";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtRent(zar: number) {
  return `R ${zar.toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
  });
}

function scoreBadge(score: number): string {
  if (score >= 75) return "bg-green-100 text-green-800";
  if (score >= 50) return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-600";
}

function scoreLabel(score: number): string {
  if (score >= 80) return "Strong match";
  if (score >= 65) return "Good match";
  if (score >= 50) return "Fair match";
  return "Weak match";
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconHouse() {
  return (
    <svg
      className="h-10 w-10 text-slate-300"
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
  );
}

function IconMapPin() {
  return (
    <svg
      className="h-3.5 w-3.5 shrink-0"
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

// ─── Property match card ──────────────────────────────────────────────────────

function PropertyMatchCard({
  property,
  result,
}: {
  property: PropertyWithMeta;
  result: SlimResult | undefined;
}) {
  const score = result?.score ?? 0;
  const reasons = result?.match_reasons ?? [];
  const warnings = result?.warnings ?? [];
  const isRanked = result?.status === "ranked";

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      {/* Photo strip */}
      <div className="relative h-44 overflow-hidden bg-slate-100">
        {property.photos.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={property.photos[0]}
            alt={property.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <IconHouse />
          </div>
        )}

        {/* Score badge */}
        {result && (
          <span
            className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold shadow-sm ${scoreBadge(score)}`}
          >
            {score}% match
          </span>
        )}

        {/* Available date */}
        {property.available_from && (
          <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm">
            Available {fmtDate(property.available_from)}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 px-5 py-4">
        {/* Title + location */}
        <h3 className="font-bold leading-snug text-slate-900">{property.name}</h3>

        {(property.suburb || property.province) && (
          <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
            <IconMapPin />
            <span>
              {property.suburb}
              {property.province ? `, ${property.province}` : ""}
            </span>
          </div>
        )}

        <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
          {property.bedrooms != null && (
            <span>
              {property.bedrooms === 0 ? "Studio" : `${property.bedrooms} bed`}
            </span>
          )}
          {property.bedrooms != null && property.property_type && (
            <span className="text-slate-200">·</span>
          )}
          {property.property_type && (
            <span className="capitalize">{property.property_type}</span>
          )}
        </div>

        {/* Rent */}
        <p className="mt-3 text-xl font-bold text-[#0f172a]">
          {fmtRent(property.rent)}
          <span className="text-sm font-normal text-slate-400">/mo</span>
        </p>

        {/* Match quality label */}
        {result && isRanked && (
          <p className="mt-0.5 text-xs font-semibold text-slate-400">
            {scoreLabel(score)}
          </p>
        )}

        {/* Match reasons */}
        {isRanked && reasons.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Why it matches
            </p>
            <ul className="space-y-1.5">
              {reasons.slice(0, 3).map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2 text-xs leading-relaxed text-slate-700"
                >
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Warnings */}
        {isRanked && warnings.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {warnings.slice(0, 2).map((w) => (
              <li
                key={w}
                className="flex items-start gap-2 text-xs leading-relaxed text-amber-700"
              >
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                {w}
              </li>
            ))}
          </ul>
        )}

        {/* Rejected notice */}
        {result?.status === "rejected" && result.rejected_reasons && (
          <div className="mt-4 rounded-xl bg-red-50 px-3 py-2.5">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-red-400">
              Does not meet your requirements
            </p>
            <ul className="space-y-1">
              {result.rejected_reasons.map((r) => (
                <li key={r} className="text-xs text-red-600">
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* CTA footer */}
      <div className="flex gap-2 border-t border-slate-100 p-4">
        <Link
          href={`/browse/${property.id}`}
          className={`rounded-xl border border-slate-200 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50 ${isRanked && score >= 40 ? "flex-1" : "w-full"}`}
        >
          View property
        </Link>
        {isRanked && score >= 40 && (
          <Link
            href={`/apply/${property.id}`}
            className="flex-1 rounded-xl bg-[#1e40af] py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            Apply with profile
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Sort types ───────────────────────────────────────────────────────────────

type SortKey = "score" | "price_asc" | "price_desc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "score", label: "Best match" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

// ─── No-profile state ─────────────────────────────────────────────────────────

function NoProfileState() {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <NavBar />
      <main className="flex items-center justify-center px-5 py-24">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100">
            <svg
              className="h-8 w-8 text-[#1e40af]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-[#0f172a]">
            Set up your profile first
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-500">
            PropTrust needs your budget, preferred area and lifestyle
            preferences to rank properties by how well they fit your life.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/tenant/preferences"
              className="rounded-full bg-[#1e40af] px-7 py-3.5 text-sm font-bold text-white transition hover:bg-blue-800"
            >
              Set up preferences
            </Link>
            <Link
              href="/browse"
              className="rounded-full border border-slate-200 px-7 py-3.5 text-sm font-bold text-slate-700 transition hover:border-slate-400"
            >
              Browse all properties
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Main client component ────────────────────────────────────────────────────

export function PropertyMatchClient({
  hasProfile,
  results,
  properties,
  isDemo,
  tenantSummary,
}: {
  hasProfile: boolean;
  results: SlimResult[];
  properties: PropertyWithMeta[];
  isDemo: boolean;
  tenantSummary: { area: string; budget: number } | null;
}) {
  const [sort, setSort] = useState<SortKey>("score");

  // Build lookup map — always call hooks before any early return
  const resultMap = useMemo(() => {
    const m: Record<string, SlimResult> = {};
    for (const r of results) {
      if (r.property_id) m[r.property_id] = r;
    }
    return m;
  }, [results]);

  const sorted = useMemo(() => {
    const ranked = properties.filter(
      (p) => resultMap[p.id]?.status === "ranked",
    );
    const rejected = properties.filter(
      (p) => resultMap[p.id]?.status === "rejected",
    );

    function applySortFn(a: PropertyWithMeta, b: PropertyWithMeta) {
      switch (sort) {
        case "score":
          return (
            (resultMap[b.id]?.score ?? 0) - (resultMap[a.id]?.score ?? 0)
          );
        case "price_asc":
          return a.rent - b.rent;
        case "price_desc":
          return b.rent - a.rent;
      }
    }

    return [...ranked.sort(applySortFn), ...rejected];
  }, [properties, resultMap, sort]);

  if (!hasProfile) return <NoProfileState />;

  const rankedCount = sorted.filter(
    (p) => resultMap[p.id]?.status === "ranked",
  ).length;
  const rejectedCount = sorted.length - rankedCount;

  const topScore = Math.max(0, ...results.map((r) => r.score));

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <NavBar />

      {/* Page header */}
      <div className="border-b border-slate-200 bg-white px-5 py-6 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-extrabold text-[#0f172a] sm:text-2xl">
                Property Match
              </h1>
              {tenantSummary && (
                <p className="mt-1 text-sm text-slate-500">
                  Ranked for{" "}
                  <span className="font-semibold text-slate-700">
                    {tenantSummary.area}
                  </span>{" "}
                  ·{" "}
                  <span className="font-semibold text-slate-700">
                    {fmtRent(tenantSummary.budget)}/mo
                  </span>{" "}
                  budget
                </p>
              )}
            </div>

            {/* Sort control */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-400">
                Sort
              </label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#1e40af] focus:outline-none focus:ring-2 focus:ring-[#1e40af]/20"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Match quality banner */}
          {topScore >= 70 && !isDemo && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <p className="text-sm font-medium text-green-800">
                {rankedCount} properties match your profile — top score{" "}
                {topScore}%
              </p>
            </div>
          )}
          {topScore >= 50 && topScore < 70 && !isDemo && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <p className="text-sm font-medium text-amber-800">
                {rankedCount} properties found. Broaden your preferences or
                area to see more strong matches.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Demo banner */}
      {isDemo && (
        <div className="border-b border-blue-200 bg-[#eff6ff] px-5 py-3 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Example properties</span> — these
              are scored against your real profile to show how Property Match
              will work once properties are listed in your area.
            </p>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-6">
        {/* Property grid */}
        {sorted.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {sorted.map((property) => (
              <PropertyMatchCard
                key={property.id}
                property={property}
                result={resultMap[property.id]}
              />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <p className="text-lg font-bold text-slate-700">
              No properties to show yet
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Check back soon — new properties are added regularly.
            </p>
            <Link
              href="/browse"
              className="mt-6 inline-block rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
            >
              Browse all properties
            </Link>
          </div>
        )}

        {/* Rejected count note */}
        {rejectedCount > 0 && (
          <p className="mt-8 text-center text-xs text-slate-400">
            {rejectedCount} propert{rejectedCount === 1 ? "y" : "ies"} excluded
            — {rejectedCount === 1 ? "it does" : "they do"} not meet your
            requirements (pets, must-haves or budget).
          </p>
        )}

        {/* Profile nudge */}
        <div className="mt-12 rounded-2xl border border-slate-200 bg-white px-6 py-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-[#0f172a]">
                Not seeing the right matches?
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">
                Update your budget, preferred area or lifestyle preferences to
                see different results.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              <Link
                href="/area-match"
                className="rounded-xl bg-[#0f172a] px-5 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Run area match
              </Link>
              <Link
                href="/tenant/preferences"
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:border-slate-400"
              >
                Edit preferences
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
