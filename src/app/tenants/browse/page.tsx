import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NavBar } from '@/components/NavBar'
import { calculateMatchScore, displayName } from '@/lib/matching'
import { BrowseFilters } from './BrowseClient'
import type { TenantProfile, PropertyListing, MatchScore } from '@/lib/types'

export const dynamic = 'force-dynamic'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtRand(cents: number) {
  return `R${(cents / 100).toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function matchBadgeCls(score: number) {
  if (score >= 80) return 'bg-green-100 text-green-800'
  if (score >= 50) return 'bg-amber-100 text-amber-800'
  return 'bg-red-100 text-red-800'
}

function matchBarCls(score: number) {
  if (score >= 80) return 'bg-green-500'
  if (score >= 50) return 'bg-amber-500'
  return 'bg-red-500'
}

const EMPLOYMENT_LABELS: Record<string, string> = {
  employed:      'Employed',
  self_employed: 'Self-employed',
  student:       'Student',
  other:         'Other',
}

const BUDGET_MIN = 3_000
const BUDGET_MAX = 50_000

// ─── Tenant card ──────────────────────────────────────────────────────────────

function TenantCard({
  name,
  tp,
  score,
  propertyId,
}: {
  name: string
  tp: TenantProfile
  score: MatchScore | null
  propertyId: string | null
}) {
  const badgeCls = score ? matchBadgeCls(score.total) : 'bg-slate-100 text-slate-600'
  const barCls   = score ? matchBarCls(score.total)   : 'bg-slate-300'

  return (
    <div className="card flex flex-col gap-4 p-5 transition hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-sm font-bold uppercase text-white">
            {name[0]}
          </div>
          <div>
            <p className="font-semibold leading-tight text-slate-900">{name}</p>
            <p className="text-xs text-slate-400">
              {EMPLOYMENT_LABELS[tp.employment_status ?? ''] ?? 'Unknown status'}
            </p>
          </div>
        </div>

        {/* Match / status badge */}
        {score !== null ? (
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ${badgeCls}`}>
            {score.total}<span className="font-normal opacity-60">/100</span>
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
            Looking
          </span>
        )}
      </div>

      {/* Details grid */}
      <dl className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <dt className="text-xs text-slate-400">Budget</dt>
          <dd className="mt-0.5 text-sm font-semibold text-slate-900">
            {tp.budget_min ? fmtRand(tp.budget_min) : '—'}
            {tp.budget_max ? ` – ${fmtRand(tp.budget_max)}` : ''}
          </dd>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <dt className="text-xs text-slate-400">Move-in</dt>
          <dd className="mt-0.5 text-sm font-semibold text-slate-900">
            {tp.move_in_date ? fmtDate(tp.move_in_date) : '—'}
          </dd>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <dt className="text-xs text-slate-400">Lease</dt>
          <dd className="mt-0.5 text-sm font-semibold text-slate-900">
            {tp.lease_length_months ? `${tp.lease_length_months} months` : '—'}
          </dd>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <dt className="text-xs text-slate-400">Province</dt>
          <dd className="mt-0.5 truncate text-sm font-semibold text-slate-900">
            {tp.looking_in_province ?? '—'}
          </dd>
        </div>
      </dl>

      {/* Match bar (only when property selected) */}
      {score !== null && (
        <>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className={`h-full rounded-full ${barCls}`} style={{ width: `${score.total}%` }} />
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
            <span title="Budget">💰 {score.budget}/30</span>
            <span title="Area">📍 {score.area}/25</span>
            <span title="Affordability">📊 {score.income}/25</span>
            <span title="Move-in">📅 {score.date}/20</span>
          </div>
        </>
      )}

      {/* CTA — links to property page with pre-selected tenant */}
      {propertyId ? (
        <Link
          href={`/properties/${propertyId}?tab=recommended`}
          className="mt-auto rounded-lg bg-slate-900 py-2 text-center text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Request Introduction
        </Link>
      ) : (
        <p className="mt-auto text-center text-xs text-slate-400">
          Select a property above to request an introduction
        </p>
      )}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: {
    province?: string
    bmin?: string
    bmax?: string
    from?: string
    to?: string
    lease?: string
    emp?: string
    sort?: string
    sprop?: string
  }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Parse search params
  const province    = searchParams.province ?? ''
  const budgetMin   = searchParams.bmin ? Number(searchParams.bmin) : BUDGET_MIN
  const budgetMax   = searchParams.bmax ? Number(searchParams.bmax) : BUDGET_MAX
  const moveInFrom  = searchParams.from ?? ''
  const moveInTo    = searchParams.to ?? ''
  const leaseMonths = searchParams.lease
    ? searchParams.lease.split(',').map(Number).filter(Boolean)
    : []
  const employment  = searchParams.emp
    ? searchParams.emp.split(',').filter(Boolean)
    : []
  const sort        = searchParams.sort ?? 'date'
  const sortProperty = searchParams.sprop ?? ''

  // ── Fetch landlord's properties for sort dropdown ─────────────────────────
  const { data: ownProperties } = await supabase
    .from('properties')
    .select('id, name')
    .eq('owner_id', user.id)
    .order('name')

  const properties = ownProperties ?? []

  // ── Fetch visible tenant profiles (service client for names join) ─────────
  const service = createServiceClient()

  let tpQuery = service
    .from('tenant_profiles')
    .select('*')
    .eq('is_visible', true)

  if (province)       tpQuery = tpQuery.eq('looking_in_province', province)
  if (budgetMin > BUDGET_MIN) tpQuery = tpQuery.gte('budget_max', budgetMin * 100)
  if (budgetMax < BUDGET_MAX) tpQuery = tpQuery.lte('budget_min', budgetMax * 100)
  if (moveInFrom)     tpQuery = tpQuery.gte('move_in_date', moveInFrom)
  if (moveInTo)       tpQuery = tpQuery.lte('move_in_date', moveInTo)
  if (leaseMonths.length > 0) tpQuery = tpQuery.in('lease_length_months', leaseMonths)
  if (employment.length > 0)  tpQuery = tpQuery.in('employment_status', employment)

  const { data: rawTps } = await tpQuery.limit(300)
  const tenantProfileList: TenantProfile[] = rawTps ?? []

  // ── Fetch names ───────────────────────────────────────────────────────────
  const userIds = tenantProfileList.map((tp) => tp.user_id)
  let nameMap = new Map<string, string>()
  if (userIds.length > 0) {
    const { data: profilesData } = await service
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds)
    nameMap = new Map(
      (profilesData ?? []).map((p: { id: string; full_name: string }) => [p.id, p.full_name]),
    )
  }

  // ── Load sort property if needed ──────────────────────────────────────────
  let sortPropertyListing: PropertyListing | null = null
  if (sort === 'match' && sortProperty) {
    const { data: sp } = await supabase
      .from('properties')
      .select('*')
      .eq('id', sortProperty)
      .eq('owner_id', user.id)
      .single()
    if (sp) sortPropertyListing = sp as unknown as PropertyListing
  }

  // ── Score and sort ────────────────────────────────────────────────────────
  type Row = {
    tp: TenantProfile
    name: string
    score: MatchScore | null
  }

  let rows: Row[] = tenantProfileList.map((tp) => ({
    tp,
    name: displayName(nameMap.get(tp.user_id) ?? 'Tenant'),
    score: sortPropertyListing ? calculateMatchScore(tp, sortPropertyListing) : null,
  }))

  if (sort === 'match' && sortPropertyListing) {
    rows.sort((a, b) => (b.score?.total ?? 0) - (a.score?.total ?? 0))
  } else if (sort === 'income') {
    rows.sort((a, b) => (b.tp.monthly_income ?? 0) - (a.tp.monthly_income ?? 0))
  } else {
    // Default: earliest move-in date
    rows.sort((a, b) => {
      const da = a.tp.move_in_date ?? '9999-12-31'
      const db = b.tp.move_in_date ?? '9999-12-31'
      return da < db ? -1 : da > db ? 1 : 0
    })
  }

  // ── Filter state for client component ────────────────────────────────────
  const initialFilters = {
    province,
    budgetMin,
    budgetMax,
    moveInFrom,
    moveInTo,
    leaseMonths,
    employment,
    sort,
    sortProperty,
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <nav className="mb-4 flex items-center gap-2 text-sm text-slate-500">
            <Link href="/dashboard" className="hover:text-slate-900">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-slate-900">Find Tenants</span>
          </nav>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Find Tenants</h1>
              <p className="mt-1 text-sm text-slate-500">
                Browse active tenant profiles. Names and contact details are hidden until an
                introduction is accepted.
              </p>
            </div>
            {rows.length > 0 && (
              <span className="shrink-0 rounded-full bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white">
                {rows.length} result{rows.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Layout: sidebar + grid */}
        <div className="flex items-start gap-6">
          {/* Filter sidebar (client component) */}
          <BrowseFilters initial={initialFilters} properties={properties} />

          {/* Tenant grid */}
          <div className="min-w-0 flex-1">
            {rows.length === 0 ? (
              <div className="card p-12 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                  <svg className="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <p className="text-base font-semibold text-slate-700">No tenant profiles match</p>
                <p className="mt-2 text-sm text-slate-500">
                  Try adjusting your filters, or check back soon as more tenants register.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {rows.map(({ tp, name, score }) => (
                  <TenantCard
                    key={tp.id}
                    name={name}
                    tp={tp}
                    score={score}
                    propertyId={sortProperty || (properties.length === 1 ? properties[0].id : null)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
