'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import MarketingNav from '@/components/marketing/MarketingNav'
import MarketingFooter from '@/components/marketing/MarketingFooter'
import type { PropertyListing } from '@/lib/types'
import type { ScoreResult } from '@/lib/scoring/interest-engine'

// ─── Constants ────────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 12

const PROVINCES = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
  'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape',
]

const PROP_TYPES: { value: string; label: string }[] = [
  { value: 'any',        label: 'Any type'   },
  { value: 'apartment',  label: 'Apartment'  },
  { value: 'house',      label: 'House'      },
  { value: 'townhouse',  label: 'Townhouse'  },
  { value: 'room',       label: 'Room'       },
]

const BEDROOM_OPTS: { value: string; label: string }[] = [
  { value: 'any', label: 'Any beds' },
  { value: '0',   label: 'Studio'   },
  { value: '1',   label: '1 bed'    },
  { value: '2',   label: '2 beds'   },
  { value: '3',   label: '3 beds'   },
  { value: '4',   label: '4+ beds'  },
]

type SortKey = 'score' | 'price_asc' | 'price_desc' | 'newest'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'score',      label: 'Best match'       },
  { value: 'price_asc',  label: 'Price: low–high'  },
  { value: 'price_desc', label: 'Price: high–low'  },
  { value: 'newest',     label: 'Newest'           },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtRand(cents: number) {
  return `R ${(cents / 100).toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
}

function scoreBadgeColor(score: number) {
  if (score >= 75) return 'bg-green-100 text-green-800'
  if (score >= 45) return 'bg-amber-100 text-amber-800'
  return 'bg-red-100 text-red-700'
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function IconSearch({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

function IconMapPin({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function IconHouse({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function IconBed({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10M3 12h18m0-5v10M6 12v-1a2 2 0 012-2h8a2 2 0 012 2v1" />
    </svg>
  )
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="h-48 bg-slate-200" />
      <div className="p-4">
        <div className="mb-2 h-4 w-3/4 rounded bg-slate-200" />
        <div className="mb-3 h-3 w-1/2 rounded bg-slate-200" />
        <div className="h-5 w-1/3 rounded bg-slate-200" />
      </div>
      <div className="border-t border-slate-100 p-4">
        <div className="h-9 rounded-lg bg-slate-200" />
      </div>
    </div>
  )
}

// ─── Property card ────────────────────────────────────────────────────────────

function PropertyCard({
  property: p,
  result,
  isLoggedIn,
  isTenant,
  hasTenantProfile,
}: {
  property: PropertyListing
  result: ScoreResult | undefined
  isLoggedIn: boolean
  isTenant: boolean
  hasTenantProfile: boolean
}) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      {/* Photo + badges */}
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

        {/* Score badge — top right */}
        {isLoggedIn && hasTenantProfile && result?.status === 'ranked' && (
          <span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums shadow-sm ${scoreBadgeColor(result.score)}`}>
            {result.score}/100 match
          </span>
        )}
        {!isLoggedIn && (
          <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-slate-600 shadow-sm">
            Sign in for match score
          </span>
        )}

        {/* Verified badge — bottom left */}
        <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold text-green-700 shadow-sm">
          <IconCheck className="h-3 w-3" />
          Verified landlord
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 p-4">
        <p className="font-semibold leading-snug text-slate-900 group-hover:text-blue-700 transition-colors">
          {p.name}
        </p>

        {(p.suburb || p.province) && (
          <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
            <IconMapPin className="h-3.5 w-3.5 shrink-0" />
            <span>{p.suburb}{p.province ? `, ${p.province}` : ''}</span>
          </div>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          {p.bedrooms != null && (
            <span className="flex items-center gap-1">
              <IconBed className="h-3.5 w-3.5" />
              {p.bedrooms === 0 ? 'Studio' : `${p.bedrooms} bed`}
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

        {result?.match_reasons?.[0] && (
          <p className="mt-2 line-clamp-1 text-[11px] text-green-700">
            {result.match_reasons[0]}
          </p>
        )}
      </div>

      {/* Footer buttons */}
      <div className="flex gap-2 border-t border-slate-100 p-4">
        <Link
          href={`/browse/${p.id}`}
          className="flex-1 rounded-lg border border-slate-200 py-2 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          View property
        </Link>
        {isTenant && hasTenantProfile ? (
          <Link
            href={`/apply?property_id=${p.id}`}
            className="flex-1 rounded-lg bg-blue-700 py-2 text-center text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            Apply now
          </Link>
        ) : !isLoggedIn ? (
          <Link
            href="/login"
            className="flex-1 rounded-lg bg-slate-900 py-2 text-center text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Sign in to apply
          </Link>
        ) : null}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BrowseListing({
  properties,
  scoreMap,
  isLoggedIn,
  isTenant,
  hasTenantProfile,
}: {
  properties: PropertyListing[]
  scoreMap: Record<string, ScoreResult>
  isLoggedIn: boolean
  isTenant: boolean
  hasTenantProfile: boolean
}) {
  const [search,           setSearch]           = useState('')
  const [filterProvince,   setFilterProvince]   = useState('')
  const [filterType,       setFilterType]       = useState('any')
  const [filterBedrooms,   setFilterBedrooms]   = useState('any')
  const [filterPriceMin,   setFilterPriceMin]   = useState('')
  const [filterPriceMax,   setFilterPriceMax]   = useState('')
  const [filterAvailable,  setFilterAvailable]  = useState('')
  const [filterPetFriendly,setFilterPetFriendly]= useState(false)
  const [sort,             setSort]             = useState<SortKey>('score')
  const [page,             setPage]             = useState(1)

  const hasFilters =
    search || filterProvince || filterType !== 'any' || filterBedrooms !== 'any' ||
    filterPriceMin || filterPriceMax || filterAvailable || filterPetFriendly

  function clearFilters() {
    setSearch('')
    setFilterProvince('')
    setFilterType('any')
    setFilterBedrooms('any')
    setFilterPriceMin('')
    setFilterPriceMax('')
    setFilterAvailable('')
    setFilterPetFriendly(false)
    setPage(1)
  }

  // Filter
  const filtered = useMemo(() => {
    return properties.filter(p => {
      if (search) {
        const q = search.toLowerCase()
        const match =
          p.name.toLowerCase().includes(q) ||
          p.suburb?.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q) ||
          p.province?.toLowerCase().includes(q)
        if (!match) return false
      }
      if (filterProvince && p.province !== filterProvince) return false
      if (filterType !== 'any' && p.property_type !== filterType) return false
      if (filterBedrooms !== 'any') {
        const beds = p.bedrooms ?? 0
        if (filterBedrooms === '4') { if (beds < 4) return false }
        else if (beds !== parseInt(filterBedrooms)) return false
      }
      if (filterPriceMin && p.asking_rent != null) {
        if (p.asking_rent / 100 < parseInt(filterPriceMin)) return false
      }
      if (filterPriceMax && p.asking_rent != null) {
        if (p.asking_rent / 100 > parseInt(filterPriceMax)) return false
      }
      if (filterAvailable && p.available_from) {
        if (p.available_from > filterAvailable) return false
      }
      if (filterPetFriendly && !p.pets_allowed) return false
      return true
    })
  }, [properties, search, filterProvince, filterType, filterBedrooms, filterPriceMin, filterPriceMax, filterAvailable, filterPetFriendly])

  // Sort
  const sorted = useMemo(() => {
    const copy = [...filtered]
    switch (sort) {
      case 'score':
        return copy.sort((a, b) => (scoreMap[b.id]?.score ?? 0) - (scoreMap[a.id]?.score ?? 0))
      case 'price_asc':
        return copy.sort((a, b) => (a.asking_rent ?? 0) - (b.asking_rent ?? 0))
      case 'price_desc':
        return copy.sort((a, b) => (b.asking_rent ?? 0) - (a.asking_rent ?? 0))
      case 'newest':
        return copy.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }
  }, [filtered, sort, scoreMap])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE))
  const paginated  = sorted.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  function goToPage(n: number) {
    setPage(Math.max(1, Math.min(n, totalPages)))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Reset page on filter/sort change
  function onFilter(fn: () => void) {
    fn()
    setPage(1)
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
                onChange={e => onFilter(() => setSearch(e.target.value))}
                className="w-full rounded-xl border-0 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 shadow placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              onClick={() => goToPage(1)}
            >
              Search
            </button>
          </div>
        </div>
      </section>

      {/* Filter bar */}
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="mx-auto max-w-7xl overflow-x-auto px-4 py-3 sm:px-6">
          <div className="flex min-w-max items-center gap-2 sm:flex-wrap sm:min-w-0">

            {/* Province */}
            <select
              value={filterProvince}
              onChange={e => onFilter(() => setFilterProvince(e.target.value))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">All provinces</option>
              {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            {/* Type */}
            <select
              value={filterType}
              onChange={e => onFilter(() => setFilterType(e.target.value))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {PROP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>

            {/* Bedrooms */}
            <select
              value={filterBedrooms}
              onChange={e => onFilter(() => setFilterBedrooms(e.target.value))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {BEDROOM_OPTS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>

            {/* Price min */}
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2">
              <span className="text-xs font-medium text-slate-400">R</span>
              <input
                type="number"
                placeholder="Min"
                value={filterPriceMin}
                onChange={e => onFilter(() => setFilterPriceMin(e.target.value))}
                className="w-20 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300"
              />
              <span className="text-slate-300">–</span>
              <input
                type="number"
                placeholder="Max"
                value={filterPriceMax}
                onChange={e => onFilter(() => setFilterPriceMax(e.target.value))}
                className="w-20 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300"
              />
            </div>

            {/* Available from */}
            <input
              type="date"
              value={filterAvailable}
              onChange={e => onFilter(() => setFilterAvailable(e.target.value))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              title="Available from"
            />

            {/* Pet friendly toggle */}
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300">
              <input
                type="checkbox"
                checked={filterPetFriendly}
                onChange={e => onFilter(() => setFilterPetFriendly(e.target.checked))}
                className="h-3.5 w-3.5 accent-blue-600"
              />
              Pet friendly
            </label>

            {/* Clear */}
            {hasFilters && (
              <button
                onClick={() => { clearFilters(); setPage(1) }}
                className="text-sm text-slate-400 underline hover:text-slate-700"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">

        {/* Sort + count row */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            <span className="font-semibold text-slate-900">{filtered.length}</span>{' '}
            {filtered.length === 1 ? 'property' : 'properties'} found
            {isLoggedIn && hasTenantProfile && ' — sorted by your match score'}
            {!isLoggedIn && ' — sign in to see personalised match scores'}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-400">Sort by</span>
            <select
              value={sort}
              onChange={e => { setSort(e.target.value as SortKey); setPage(1) }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Sign-in nudge */}
        {!isLoggedIn && (
          <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
            <p className="text-sm font-semibold text-blue-900">Sign in to see your personal match score</p>
            <p className="mt-1 text-xs text-blue-700">
              Create a tenant profile and PropTrust ranks every listing by how well it fits your budget, lifestyle and preferences.
            </p>
            <Link href="/login" className="mt-3 inline-block rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800">
              Sign in
            </Link>
          </div>
        )}

        {/* Grid or empty state */}
        {paginated.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center">
            <IconHouse className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <p className="text-base font-semibold text-slate-700">No properties found matching your search</p>
            <p className="mt-2 text-sm text-slate-400">Try adjusting your filters or search term.</p>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="mt-5 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {paginated.map(p => (
              <PropertyCard
                key={p.id}
                property={p}
                result={scoreMap[p.id]}
                isLoggedIn={isLoggedIn}
                isTenant={isTenant}
                hasTenantProfile={hasTenantProfile}
              />
            ))}
            {/* Skeleton fillers during sort transitions — not needed but good for alignment */}
            {paginated.length % 3 !== 0 && Array.from({ length: 3 - (paginated.length % 3) }).map((_, i) => (
              <div key={`filler-${i}`} className="hidden xl:block" />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
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
  )
}

export { SkeletonCard }
