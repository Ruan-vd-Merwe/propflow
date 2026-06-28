"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import type { PropertyListing } from "@/lib/types";
import type { ScoreResult } from "@/lib/scoring/interest-engine";

// ─── Constants ────────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 12;

const PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
];

const PROP_TYPES = [
  { value: "any", label: "Any type" },
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "townhouse", label: "Townhouse" },
  { value: "room", label: "Room" },
];

const BEDROOM_OPTS = [
  { value: "any", label: "Any beds" },
  { value: "0", label: "Studio" },
  { value: "1", label: "1 bed" },
  { value: "2", label: "2 beds" },
  { value: "3", label: "3 beds" },
  { value: "4", label: "4+ beds" },
];

type SortKey = "score" | "price_asc" | "price_desc" | "newest";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "score", label: "Best match" },
  { value: "price_asc", label: "Price: low–high" },
  { value: "price_desc", label: "Price: high–low" },
  { value: "newest", label: "Newest" },
];

type AuthState = "checking" | "guest" | "no_profile" | "personalised";

type TenantSummary = {
  looking_in_area: string | null;
  looking_in_province: string | null;
  budget_min: number | null;
  budget_max: number | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtRand(cents: number) {
  return `R ${(cents / 100).toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function scoreBadgeColor(score: number) {
  if (score >= 75) return "bg-green-100 text-green-800";
  if (score >= 45) return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-700";
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconSearch({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function IconMapPin({ className }: { className?: string }) {
  return (
    <svg
      className={className}
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

function IconHouse({ className }: { className?: string }) {
  return (
    <svg
      className={className}
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

function IconBed({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 7v10M3 12h18m0-5v10M6 12v-1a2 2 0 012-2h8a2 2 0 012 2v1"
      />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="h-48 bg-slate-200" />
      <div className="p-4">
        <div className="mb-2 h-4 w-3/4 rounded bg-slate-200" />
        <div className="mb-3 h-3 w-1/2 rounded bg-slate-200" />
        <div className="mb-2 h-6 w-1/3 rounded bg-slate-200" />
        <div className="h-3 w-1/4 rounded bg-slate-200" />
      </div>
      <div className="border-t border-slate-100 p-4">
        <div className="h-9 rounded-lg bg-slate-200" />
      </div>
    </div>
  );
}

// ─── Property card ────────────────────────────────────────────────────────────

function PropertyCard({
  property: p,
  result,
  isPersonalised,
}: {
  property: PropertyListing;
  result: ScoreResult | undefined;
  isPersonalised: boolean;
}) {
  const score = result?.score;
  const showApply = isPersonalised && score != null && score >= 45;

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      {/* Photo */}
      <div className="relative h-48 overflow-hidden bg-slate-100">
        {p.photos?.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.photos[0]}
            alt={p.name}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-slate-100">
            <IconHouse className="h-12 w-12 text-slate-300" />
          </div>
        )}

        {/* Score badge — personalised only */}
        {isPersonalised && score != null && (
          <span
            className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums shadow-sm ${scoreBadgeColor(score)}`}
          >
            {score}% match
          </span>
        )}

        {/* Verified badge */}
        <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold text-green-700 shadow-sm">
          <IconCheck className="h-3 w-3" />
          Verified landlord
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 p-4">
        <p className="font-semibold leading-snug text-slate-900 transition-colors group-hover:text-blue-700">
          {p.name}
        </p>

        {(p.suburb || p.province) && (
          <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
            <IconMapPin className="h-3.5 w-3.5 shrink-0" />
            <span>
              {p.suburb}
              {p.province ? `, ${p.province}` : ""}
            </span>
          </div>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          {p.bedrooms != null && (
            <span className="flex items-center gap-1">
              <IconBed className="h-3.5 w-3.5" />
              {p.bedrooms === 0 ? "Studio" : `${p.bedrooms} bed`}
            </span>
          )}
          {p.property_type && (
            <span className="capitalize text-slate-400">{p.property_type}</span>
          )}
        </div>

        <div className="mt-3">
          {p.asking_rent ? (
            <span className="text-xl font-bold text-[#0f172a]">
              {fmtRand(p.asking_rent)}
              <span className="text-sm font-normal text-slate-400">/mo</span>
            </span>
          ) : (
            <span className="text-sm text-slate-400">Price on request</span>
          )}
        </div>

        {p.available_from && (
          <p className="mt-1 text-xs text-slate-400">
            Available {fmtDate(p.available_from)}
          </p>
        )}

        {isPersonalised && result?.match_reasons && result.match_reasons.length > 0 && (
          <ul className="mt-3 space-y-1">
            {result.match_reasons.slice(0, 3).map((r) => (
              <li key={r} className="flex items-start gap-1.5 text-[11px] leading-relaxed text-green-700">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                {r}
              </li>
            ))}
          </ul>
        )}
        {isPersonalised && result?.warnings && result.warnings.length > 0 && (
          <ul className="mt-2 space-y-1">
            {result.warnings.slice(0, 2).map((w) => (
              <li key={w} className="flex items-start gap-1.5 text-[11px] leading-relaxed text-amber-700">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                {w}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer buttons */}
      <div className="flex gap-2 border-t border-slate-100 p-4">
        <Link
          href={`/browse/${p.id}`}
          className={`rounded-lg border border-slate-200 py-2 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50 ${showApply ? "flex-1" : "w-full"}`}
        >
          View property
        </Link>
        {showApply && (
          <Link
            href={`/apply/${p.id}`}
            className="flex-1 rounded-lg bg-blue-700 py-2 text-center text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            Apply with profile
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BrowseListing({
  properties,
}: {
  properties: PropertyListing[];
}) {
  const supabase = createClient();

  const [authState, setAuthState] = useState<AuthState>("checking");
  const [tenantSummary, setTenantSummary] = useState<TenantSummary | null>(
    null,
  );
  const [scoreMap, setScoreMap] = useState<Record<string, ScoreResult>>({});
  const [scoresLoading, setScoresLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [filterProvince, setFilterProvince] = useState("");
  const [filterType, setFilterType] = useState("any");
  const [filterBedrooms, setFilterBedrooms] = useState("any");
  const [filterPriceMin, setFilterPriceMin] = useState("");
  const [filterPriceMax, setFilterPriceMax] = useState("");
  const [filterAvailable, setFilterAvailable] = useState("");
  const [filterPetFriendly, setFilterPetFriendly] = useState(false);
  const [sort, setSort] = useState<SortKey>("newest");
  const [page, setPage] = useState(1);

  // ── Auth detection on mount ──────────────────────────────────────────────
  useEffect(() => {
    async function detect() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setAuthState("guest");
        return;
      }

      const { data: tp } = await supabase
        .from("tenant_profiles")
        .select("looking_in_area, looking_in_province, budget_min, budget_max")
        .eq("user_id", user.id)
        .single();

      const isPersonalised = !!(tp?.budget_max && tp?.looking_in_area);

      if (!isPersonalised) {
        setAuthState("no_profile");
        return;
      }

      setTenantSummary(tp as TenantSummary);
      setAuthState("personalised");
      setSort("score");

      // Load personalised scores
      setScoresLoading(true);
      try {
        const res = await fetch("/api/scoring/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ property_ids: properties.map((p) => p.id) }),
        });
        const data = await res.json();
        const map: Record<string, ScoreResult> = {};
        for (const r of data.results ?? []) {
          if (r.property_id) map[r.property_id] = r;
        }
        setScoreMap(map);
      } finally {
        setScoresLoading(false);
      }
    }
    detect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isPersonalised = authState === "personalised";
  const isLoading =
    authState === "checking" || (isPersonalised && scoresLoading);

  const hasFilters =
    search ||
    filterProvince ||
    filterType !== "any" ||
    filterBedrooms !== "any" ||
    filterPriceMin ||
    filterPriceMax ||
    filterAvailable ||
    filterPetFriendly;

  function clearFilters() {
    setSearch("");
    setFilterProvince("");
    setFilterType("any");
    setFilterBedrooms("any");
    setFilterPriceMin("");
    setFilterPriceMax("");
    setFilterAvailable("");
    setFilterPetFriendly(false);
    setPage(1);
  }

  function onFilter(fn: () => void) {
    fn();
    setPage(1);
  }

  // Filter
  const filtered = useMemo(() => {
    return properties.filter((p) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !p.name.toLowerCase().includes(q) &&
          !p.suburb?.toLowerCase().includes(q) &&
          !p.address.toLowerCase().includes(q) &&
          !p.province?.toLowerCase().includes(q)
        )
          return false;
      }
      if (filterProvince && p.province !== filterProvince) return false;
      if (filterType !== "any" && p.property_type !== filterType) return false;
      if (filterBedrooms !== "any") {
        const beds = p.bedrooms ?? 0;
        if (filterBedrooms === "4") {
          if (beds < 4) return false;
        } else if (beds !== parseInt(filterBedrooms)) return false;
      }
      if (filterPriceMin && p.asking_rent != null) {
        if (p.asking_rent / 100 < parseInt(filterPriceMin)) return false;
      }
      if (filterPriceMax && p.asking_rent != null) {
        if (p.asking_rent / 100 > parseInt(filterPriceMax)) return false;
      }
      if (filterAvailable && p.available_from) {
        if (p.available_from > filterAvailable) return false;
      }
      if (filterPetFriendly && !p.pets_allowed) return false;
      return true;
    });
  }, [
    properties,
    search,
    filterProvince,
    filterType,
    filterBedrooms,
    filterPriceMin,
    filterPriceMax,
    filterAvailable,
    filterPetFriendly,
  ]);

  // Sort
  const sorted = useMemo(() => {
    const copy = [...filtered];
    switch (sort) {
      case "score":
        return copy.sort(
          (a, b) => (scoreMap[b.id]?.score ?? 0) - (scoreMap[a.id]?.score ?? 0),
        );
      case "price_asc":
        return copy.sort((a, b) => (a.asking_rent ?? 0) - (b.asking_rent ?? 0));
      case "price_desc":
        return copy.sort((a, b) => (b.asking_rent ?? 0) - (a.asking_rent ?? 0));
      case "newest":
        return copy.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
    }
  }, [filtered, sort, scoreMap]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
  const paginated = sorted.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  // Score quality detection
  const topScore =
    isPersonalised && !scoresLoading
      ? sorted.length > 0
        ? Math.max(0, ...sorted.map((p) => scoreMap[p.id]?.score ?? 0))
        : 0
      : 0;
  const hasStrongMatches = topScore >= 70;
  const hasWeakMatches =
    isPersonalised && !scoresLoading && topScore < 50 && sorted.length > 0;

  function goToPage(n: number) {
    setPage(Math.max(1, Math.min(n, totalPages)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />

      {/* Hero */}
      <section className="bg-[#0f172a] px-4 py-14 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            Find your next rental home
          </h1>
          <p className="mt-3 text-slate-400">
            Verified properties from trusted landlords across South Africa
          </p>
          <div className="mx-auto mt-6 flex max-w-xl gap-2">
            <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by suburb or city…"
                value={search}
                onChange={(e) => onFilter(() => setSearch(e.target.value))}
                className="w-full rounded-xl border-0 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 shadow placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => goToPage(1)}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Search
            </button>
          </div>
        </div>
      </section>

      {/* Filter bar */}
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-sm">
        <div className="mx-auto max-w-7xl overflow-x-auto px-4 py-3 sm:px-6">
          <div className="flex min-w-max items-center gap-2 sm:min-w-0 sm:flex-wrap">
            <select
              value={filterProvince}
              onChange={(e) =>
                onFilter(() => setFilterProvince(e.target.value))
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">All provinces</option>
              {PROVINCES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            <select
              value={filterType}
              onChange={(e) => onFilter(() => setFilterType(e.target.value))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {PROP_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>

            <select
              value={filterBedrooms}
              onChange={(e) =>
                onFilter(() => setFilterBedrooms(e.target.value))
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {BEDROOM_OPTS.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2">
              <span className="text-xs font-medium text-slate-400">R</span>
              <input
                type="number"
                placeholder="Min"
                value={filterPriceMin}
                onChange={(e) =>
                  onFilter(() => setFilterPriceMin(e.target.value))
                }
                className="w-20 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300"
              />
              <span className="text-slate-300">–</span>
              <input
                type="number"
                placeholder="Max"
                value={filterPriceMax}
                onChange={(e) =>
                  onFilter(() => setFilterPriceMax(e.target.value))
                }
                className="w-20 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300"
              />
            </div>

            <input
              type="date"
              value={filterAvailable}
              title="Available from"
              onChange={(e) =>
                onFilter(() => setFilterAvailable(e.target.value))
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />

            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300">
              <input
                type="checkbox"
                checked={filterPetFriendly}
                onChange={(e) =>
                  onFilter(() => setFilterPetFriendly(e.target.checked))
                }
                className="h-3.5 w-3.5 accent-blue-600"
              />
              Pet friendly
            </label>

            {hasFilters && (
              <button
                onClick={() => {
                  clearFilters();
                  setPage(1);
                }}
                className="text-sm text-slate-400 underline hover:text-slate-700"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* ── Auth state banners ─────────────────────────────────────────── */}

        {(authState === "guest" || authState === "no_profile") && (
          <div className="mb-6 flex flex-col items-start justify-between gap-4 rounded-xl border border-[#bfdbfe] bg-[#eff6ff] px-5 py-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                <IconHouse className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-sm text-blue-900">
                <span className="font-semibold">
                  {authState === "no_profile"
                    ? "Complete your profile to see matched properties"
                    : "Sign in to see properties matched to your budget, area and preferences"}
                </span>
                {authState === "guest" && (
                  <span className="mt-0.5 block text-xs text-blue-700">
                    Create a free tenant profile and PropTrust will rank every
                    listing by how well it fits your life.
                  </span>
                )}
                {authState === "no_profile" && (
                  <span className="mt-0.5 block text-xs text-blue-700">
                    Add your area, budget and preferences to unlock personalised
                    match scores.
                  </span>
                )}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              {authState === "guest" ? (
                <>
                  <Link
                    href="/login"
                    className="rounded-lg border border-blue-700 px-4 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-800"
                  >
                    Create free profile
                  </Link>
                </>
              ) : (
                <Link
                  href="/tenant/profile"
                  className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-800"
                >
                  Complete profile
                </Link>
              )}
            </div>
          </div>
        )}

        {isPersonalised && tenantSummary && !scoresLoading && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-5 py-3">
            <p className="text-sm text-green-900">
              <span className="font-semibold">
                {tenantSummary.looking_in_area}
                {tenantSummary.looking_in_province
                  ? `, ${tenantSummary.looking_in_province}`
                  : ""}
              </span>
              {tenantSummary.budget_max && (
                <span className="text-green-700">
                  {" "}
                  · Budget:{" "}
                  {tenantSummary.budget_min
                    ? fmtRand(tenantSummary.budget_min)
                    : "R 0"}
                  –{fmtRand(tenantSummary.budget_max)}/mo
                </span>
              )}
            </p>
            <Link
              href="/tenant/profile"
              className="shrink-0 text-xs font-medium text-green-700 hover:underline"
            >
              Edit preferences
            </Link>
          </div>
        )}

        {/* ── Sort + count ───────────────────────────────────────────────── */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            <span className="font-semibold text-slate-900">
              {filtered.length}
            </span>{" "}
            {filtered.length === 1 ? "property" : "properties"} found
            {isPersonalised &&
              !scoresLoading &&
              " — sorted by your match score"}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-400">Sort by</span>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as SortKey);
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Weak match notice ─────────────────────────────────────────── */}
        {hasWeakMatches && !hasFilters && (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
            <p className="text-sm font-semibold text-amber-900">
              No strong matches yet in your area
            </p>
            <p className="mt-0.5 text-xs text-amber-700">
              Showing all available properties. Update your preferences to
              improve your matches.
            </p>
            <Link
              href="/tenant/profile"
              className="mt-3 inline-block rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700"
            >
              Update preferences
            </Link>
          </div>
        )}

        {/* ── Strong matches header ─────────────────────────────────────── */}
        {isPersonalised && hasStrongMatches && !scoresLoading && (
          <p className="mb-4 text-base font-semibold text-slate-900">
            Strong matches for you
          </p>
        )}

        {/* ── Grid ──────────────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : properties.length === 0 ? (
          /* No properties at all */
          <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center">
            <IconHouse className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <p className="text-base font-semibold text-slate-700">
              No listings available yet
            </p>
            <p className="mt-2 text-sm text-slate-400">
              PropTrust is growing its verified property network. Check back
              soon.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                href="/area-match"
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
              >
                Find my area
              </Link>
              <Link
                href="/register"
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                I am a landlord — list a property
              </Link>
            </div>
          </div>
        ) : paginated.length === 0 ? (
          /* Filters too narrow */
          <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center">
            <IconSearch className="mx-auto mb-4 h-10 w-10 text-slate-300" />
            <p className="text-base font-semibold text-slate-700">
              {isPersonalised
                ? `No properties match your current filters`
                : "No properties found matching your search"}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              {isPersonalised
                ? `There ${properties.length === 1 ? "is" : "are"} ${properties.length} ${properties.length === 1 ? "property" : "properties"} in other areas.`
                : "Try adjusting your filters or search term."}
            </p>
            <div className="mt-5 flex justify-center gap-3">
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
                >
                  Clear filters
                </button>
              )}
              {isPersonalised && (
                <Link
                  href="/tenant/profile"
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Update my preferences
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {paginated.map((p) => (
              <PropertyCard
                key={p.id}
                property={p}
                result={scoreMap[p.id]}
                isPersonalised={isPersonalised}
              />
            ))}
          </div>
        )}

        {/* ── Pagination ────────────────────────────────────────────────── */}
        {!isLoading && totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-3">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page === 1}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-slate-500">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => goToPage(page + 1)}
              disabled={page === totalPages}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </main>

      <MarketingFooter />
    </div>
  );
}
