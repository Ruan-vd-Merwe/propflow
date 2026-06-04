'use client'

import { useState } from 'react'
import Link from 'next/link'
import { NavBar } from '@/components/NavBar'
import type { PropertyListing } from '@/lib/types'
import type { ScoreResult } from '@/lib/scoring/interest-engine'

type SortKey = 'score' | 'price_asc' | 'price_desc' | 'newest'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'score',      label: 'Best match'          },
  { value: 'price_asc',  label: 'Price: low to high'  },
  { value: 'price_desc', label: 'Price: high to low'  },
  { value: 'newest',     label: 'Newest'              },
]

function fmtRand(cents: number) {
  return `R${(cents / 100).toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`
}

function scoreBadgeColor(score: number) {
  if (score >= 75) return 'bg-green-100 text-green-800'
  if (score >= 45) return 'bg-amber-100 text-amber-800'
  return 'bg-slate-100 text-slate-600'
}

function sortProperties(
  properties: PropertyListing[],
  scoreMap: Record<string, ScoreResult>,
  sort: SortKey,
): PropertyListing[] {
  const copy = [...properties]
  switch (sort) {
    case 'score':
      return copy.sort((a, b) => {
        const sa = scoreMap[a.id]?.score ?? 0
        const sb = scoreMap[b.id]?.score ?? 0
        return sb - sa
      })
    case 'price_asc':
      return copy.sort((a, b) => (a.asking_rent ?? 0) - (b.asking_rent ?? 0))
    case 'price_desc':
      return copy.sort((a, b) => (b.asking_rent ?? 0) - (a.asking_rent ?? 0))
    case 'newest':
      return copy.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
  }
}

export function BrowseListing({
  properties,
  scoreMap,
  isLoggedIn,
}: {
  properties: PropertyListing[]
  scoreMap: Record<string, ScoreResult>
  isLoggedIn: boolean
}) {
  const [sort, setSort] = useState<SortKey>('score')
  const sorted = sortProperties(properties, scoreMap, sort)

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Browse properties</h1>
            <p className="mt-1 text-sm text-slate-500">
              {properties.length} listed {properties.length === 1 ? 'property' : 'properties'}
              {isLoggedIn
                ? ' — sorted by your match score'
                : ' — sign in to see personalised match scores'}
            </p>
          </div>

          {/* Sort control */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Sort by</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
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

        {/* Sign-in nudge for guests */}
        {!isLoggedIn && (
          <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
            <p className="text-sm font-semibold text-blue-900">
              Sign in to see your personal match score
            </p>
            <p className="mt-1 text-xs text-blue-700">
              Create a tenant profile and PropTrust will rank these properties by how well
              they fit your budget, lifestyle and preferences.
            </p>
            <Link
              href="/login"
              className="mt-3 inline-block rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800"
            >
              Sign in
            </Link>
          </div>
        )}

        {/* Grid */}
        {sorted.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-base font-semibold text-slate-700">No properties listed yet</p>
            <p className="mt-2 text-sm text-slate-400">Check back soon as new listings are added.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {sorted.map((p) => {
              const result = scoreMap[p.id]
              return (
                <Link
                  key={p.id}
                  href={`/browse/${p.id}`}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                >
                  {/* Photo */}
                  {p.photos?.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.photos[0]}
                      alt={p.name}
                      className="h-44 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-44 items-center justify-center bg-slate-100">
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
                          d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                        />
                      </svg>
                    </div>
                  )}

                  <div className="p-4">
                    {/* Title + score badge */}
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold leading-snug text-slate-900 group-hover:text-blue-700">
                        {p.name}
                      </p>
                      {result && result.status === 'ranked' && (
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums ${scoreBadgeColor(result.score)}`}
                        >
                          {result.score}/100
                        </span>
                      )}
                    </div>

                    {/* Location */}
                    <p className="mt-1 text-xs text-slate-500">
                      {p.suburb}
                      {p.province ? `, ${p.province}` : ''}
                    </p>

                    {/* Rent + details */}
                    <div className="mt-3 flex items-center justify-between">
                      {p.asking_rent ? (
                        <span className="text-base font-bold text-slate-900">
                          {fmtRand(p.asking_rent)}
                          <span className="text-xs font-normal text-slate-400">/mo</span>
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">Price on request</span>
                      )}
                      <div className="flex gap-2 text-xs text-slate-500">
                        {p.bedrooms != null && (
                          <span>{p.bedrooms === 0 ? 'Studio' : `${p.bedrooms} bed`}</span>
                        )}
                        {p.property_type && (
                          <span className="capitalize">{p.property_type}</span>
                        )}
                      </div>
                    </div>

                    {/* Top match reason */}
                    {result?.match_reasons?.[0] && (
                      <p className="mt-2 line-clamp-1 text-[11px] text-green-700">
                        {result.match_reasons[0]}
                      </p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
