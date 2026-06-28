"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { PropertyListing } from "@/lib/types";
import type { ScoreResult } from "@/lib/scoring/interest-engine";

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

type AuthState = "checking" | "no_profile" | "personalised";

type TenantSummary = {
  looking_in_area: string | null;
  looking_in_province: string | null;
  budget_min: number | null;
  budget_max: number | null;
};

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

function IconSearch({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function IconMapPin({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconBed({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function IconHome({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

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
            <IconHome className="h-12 w-12 text-slate-300" />
          </div>
        )}
        {isPersonalised && score != null && (
          <span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums shadow-sm ${scoreBadgeColor(score)}`}>
            {score}% match
          </span>
        )}
      </div>

      <div className="flex-1 p-4">
        <p className="font-semibold leading-snug text-slate-900 transition-colors group-hover:text-blue-700">
          {p.name}
        </p>
        {(p.suburb || p.province) && (
          <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
            <IconMapPin className="h-3.5 w-3.5 shrink-0" />
            <span>{p.suburb}{p.province ? `, ${p.province}` : ""}</span>
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
            <span className="text-xl font-bold text-slate-900">
              {fmtRand(p.asking_rent)}
              <span className="text-sm font-normal text-slate-400">/mo</span>
            </span>
          ) : (
            <span className="text-sm text-slate-400">Price on request</span>
          )}
        </div>
        {p.available_from && (
          <p className="mt-1 text-xs text-slate-400">Available {fmtDate(p.available_from)}</p>
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

export function TenantBrowseContent({
  properties,
}: {
  properties: PropertyListing[];
}) {
  const supabase = createClient();

  const [authState, setAuthState] = useState<AuthState>("checking");
  const [tenantSummary, setTenantSummary] = useState<TenantSummary | null>(null);
  const [scoreMap, setScoreMap] = useState<Record<string, ScoreResult>>({});
  const [scoresLoading, setScoresLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [filterProvince, setFilterProvince] = useState("");
  const [filterType, setFilterType] = useState("any");
  const [filterBedrooms, setFilterBedrooms] = useState("any");
  const [sort, setSort] = useState<SortKey>("newest");
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function detect() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setAuthState("no_profile"); return; }

      const { data: tp } = await supabase
        .from("tenant_profiles")
        .select("looking_in_area, looking_in_province, budget_min, budget_max")
        .eq("user_id", user.id)
        .single();

      const canPersonalise = !!(tp?.budget_max && tp?.looking_in_area);
      if (!canPersonalise) { setAuthState("no_profile"); return; }

      setTenantSummary(tp as TenantSummary);
      setAuthState("personalised");
      setSort("score");

      setScoresLoading(true);
      try {
        const res = await fetch("/api/scoring/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ property_ids: properties.map((p) => p.id) }),
        });
        const data = (await res.json()) as { results?: { property_id: string }[] };
        const map: Record<string, ScoreResult> = {};
        for (const r of data.results ?? []) {
          if (r.property_id) map[r.property_id] = r as ScoreResult;
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

  function onFilter(fn: () => void) { fn(); setPage(1); }

  const filtered = useMemo(() => {
    return properties.filter((p) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !p.name.toLowerCase().includes(q) &&
          !p.suburb?.toLowerCase().includes(q) &&
          !p.address.toLowerCase().includes(q) &&
          !p.province?.toLowerCase().includes(q)
        ) return false;
      }
      if (filterProvince && p.province !== filterProvince) return false;
      if (filterType !== "any" && p.property_type !== filterType) return false;
      if (filterBedrooms !== "any") {
        const beds = p.bedrooms ?? 0;
        if (filterBedrooms === "4") { if (beds < 4) return false; }
        else if (beds !== parseInt(filterBedrooms, 10)) return false;
      }
      return true;
    });
  }, [properties, search, filterProvince, filterType, filterBedrooms]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    switch (sort) {
      case "score":
        return copy.sort((a, b) => (scoreMap[b.id]?.score ?? 0) - (scoreMap[a.id]?.score ?? 0));
      case "price_asc":
        return copy.sort((a, b) => (a.asking_rent ?? 0) - (b.asking_rent ?? 0));
      case "price_desc":
        return copy.sort((a, b) => (b.asking_rent ?? 0) - (a.asking_rent ?? 0));
      case "newest":
        return copy.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }, [filtered, sort, scoreMap]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
  const paginated = sorted.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  function goToPage(n: number) {
    setPage(Math.max(1, Math.min(n, totalPages)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Browse Properties</h1>
        <p className="mt-1 text-sm text-slate-500">
          Verified properties from trusted landlords across South Africa
        </p>
      </div>

      {/* Profile prompt */}
      {authState === "no_profile" && (
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
          <p className="text-sm font-semibold text-blue-900">Set up your tenant profile for personalised matches</p>
          <p className="mt-0.5 text-xs text-blue-700">
            Tell us your budget, area, and preferences to see how well each property matches you.
          </p>
          <Link
            href="/tenant/profile"
            className="mt-3 inline-block rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800"
          >
            Set up profile
          </Link>
        </div>
      )}

      {/* Active profile banner */}
      {isPersonalised && tenantSummary && !scoresLoading && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-green-200 bg-green-50 px-5 py-3">
          <p className="text-sm text-green-900">
            <span className="font-semibold">
              {tenantSummary.looking_in_area}
              {tenantSummary.looking_in_province ? `, ${tenantSummary.looking_in_province}` : ""}
            </span>
            {tenantSummary.budget_max && (
              <span className="text-green-700">
                {" "}· Budget:{" "}
                {tenantSummary.budget_min ? fmtRand(tenantSummary.budget_min) : "R 0"}
                –{fmtRand(tenantSummary.budget_max)}/mo
              </span>
            )}
          </p>
          <Link href="/tenant/profile" className="shrink-0 text-xs font-medium text-green-700 hover:underline">
            Edit preferences
          </Link>
        </div>
      )}

      {/* Search + filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by suburb, city…"
            value={search}
            onChange={(e) => onFilter(() => setSearch(e.target.value))}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterProvince}
          onChange={(e) => onFilter(() => setFilterProvince(e.target.value))}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All provinces</option>
          {PROVINCES.map((p) => <option key={p}>{p}</option>)}
        </select>
        <select
          value={filterType}
          onChange={(e) => onFilter(() => setFilterType(e.target.value))}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {PROP_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select
          value={filterBedrooms}
          onChange={(e) => onFilter(() => setFilterBedrooms(e.target.value))}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {BEDROOM_OPTS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
        </select>
      </div>

      {/* Count + sort */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          <span className="font-semibold text-slate-900">{filtered.length}</span>{" "}
          {filtered.length === 1 ? "property" : "properties"} found
          {isPersonalised && !scoresLoading && " — sorted by your match score"}
          {isPersonalised && scoresLoading && " — loading match scores…"}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-400">Sort by</span>
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value as SortKey); setPage(1); }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Grid */}
      {paginated.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-sm text-slate-500">No properties match your current filters.</p>
          <button
            onClick={() => { setSearch(""); setFilterProvince(""); setFilterType("any"); setFilterBedrooms("any"); setPage(1); }}
            className="mt-3 text-sm font-medium text-blue-700 hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {paginated.map((p) => (
            <PropertyCard
              key={p.id}
              property={p}
              result={scoreMap[p.id]}
              isPersonalised={isPersonalised && !scoresLoading}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page === 1}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-40 hover:bg-slate-50"
          >
            Previous
          </button>
          <span className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => goToPage(page + 1)}
            disabled={page === totalPages}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-40 hover:bg-slate-50"
          >
            Next
          </button>
        </div>
      )}
    </main>
  );
}
