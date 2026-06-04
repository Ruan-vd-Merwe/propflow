import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NavBar } from '@/components/NavBar'
import { RiskBadge } from '@/components/RiskBadge'
import { calculateRiskScore } from '@/lib/risk'
import { calculateMatchScore, displayName } from '@/lib/matching'
import { IntroduceButton } from './IntroduceButton'
import { SharePortalButton } from './SharePortalButton'
import { PropertyPhotoUpload } from './PropertyPhotoUpload'
import type { Payment, Tenant, PropertyListing, TenantProfile, MatchScore } from '@/lib/types'

export const dynamic = 'force-dynamic'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtRand(cents: number) {
  return `R ${(cents / 100).toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** Badge colour using the spec thresholds: green 80–100, amber 50–79, red 0–49 */
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
  employed: 'Employed',
  self_employed: 'Self-employed',
  student: 'Student',
  other: 'Other',
}

// ─── Tenant match card (server component — IntroduceButton is a client island) ─

type TenantCardProps = {
  tenantId: string
  propertyId: string
  name: string
  match: MatchScore
  tp: TenantProfile
  alreadyRequested: boolean
}

function TenantMatchCard({
  tenantId,
  propertyId,
  name,
  match,
  tp,
  alreadyRequested,
}: TenantCardProps) {
  const badgeCls = matchBadgeCls(match.total)
  const barCls   = matchBarCls(match.total)

  return (
    <div className="card flex flex-col gap-4 p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-bold uppercase text-slate-600">
            {name[0]}
          </div>
          <div>
            <p className="font-semibold leading-tight text-slate-900">{name}</p>
            <p className="text-xs text-slate-400">
              {EMPLOYMENT_LABELS[tp.employment_status ?? ''] ?? '—'}
            </p>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ${badgeCls}`}>
          {match.total}
          <span className="font-normal opacity-60">/100</span>
        </span>
      </div>

      {/* Details */}
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <Chip label="Budget">
          {tp.budget_min ? fmtRand(tp.budget_min) : '—'}
          {' – '}
          {tp.budget_max ? fmtRand(tp.budget_max) : '—'}
        </Chip>
        <Chip label="Move-in">
          {tp.move_in_date ? fmtDate(tp.move_in_date) : '—'}
        </Chip>
        <Chip label="Lease">
          {tp.lease_length_months ? `${tp.lease_length_months} months` : '—'}
        </Chip>
        <Chip label="Looking in">
          {tp.looking_in_area ?? '—'}
        </Chip>
      </dl>

      {/* Score bar */}
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${barCls}`}
          style={{ width: `${match.total}%` }}
        />
      </div>

      {/* Score breakdown */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
        <span title="Budget match">Budget {match.budget}/30</span>
        <span title="Area match">Area {match.area}/25</span>
        <span title="Affordability">Income {match.income}/25</span>
        <span title="Move-in date match">Date {match.date}/20</span>
      </div>

      {/* CTA */}
      <IntroduceButton
        tenantId={tenantId}
        propertyId={propertyId}
        alreadyRequested={alreadyRequested}
      />
    </div>
  )
}

function Chip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold leading-snug text-slate-900">{children}</p>
    </div>
  )
}

// ─── Property incomplete notice ───────────────────────────────────────────────

function ListingIncompleteNotice({ missingFields }: { missingFields: string[] }) {
  if (missingFields.length === 0) return null
  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
      <p className="text-sm font-semibold text-amber-900">
        Improve match accuracy — complete your listing
      </p>
      <p className="mt-1 text-xs text-amber-700">
        Missing: {missingFields.join(', ')}. Matches using partial data may be less accurate.
      </p>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function PropertyPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { tab?: string }
}) {
  const tab = searchParams.tab === 'recommended' ? 'recommended' : 'tenants'

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: property } = await supabase
    .from('properties')
    .select('*')
    .eq('id', params.id)
    .eq('owner_id', user.id)
    .single()

  if (!property) notFound()

  // ── Tenants tab — always fetched ──────────────────────────────────────────
  const { data: tenants } = await supabase
    .from('tenants')
    .select('*, portal_token')
    .eq('property_id', property.id)
    .order('full_name')

  const tenantList: Tenant[] = tenants ?? []
  const tenantIds = tenantList.map((t) => t.id)

  const { data: payments } = tenantIds.length
    ? await supabase.from('payments').select('*').in('tenant_id', tenantIds)
    : { data: [] }

  const paymentList: Payment[] = payments ?? []
  const paymentsByTenant = new Map<string, Payment[]>()
  for (const p of paymentList) {
    if (!paymentsByTenant.has(p.tenant_id)) paymentsByTenant.set(p.tenant_id, [])
    paymentsByTenant.get(p.tenant_id)!.push(p)
  }

  const tenantsWithRisk = tenantList
    .map((t) => ({ ...t, risk: calculateRiskScore(paymentsByTenant.get(t.id) ?? []) }))
    .sort((a, b) => a.risk.score - b.risk.score)

  // ── Recommended tab — only fetched when active ────────────────────────────
  type MatchRow = {
    tenantId: string
    name: string
    match: MatchScore
    tp: TenantProfile
    alreadyRequested: boolean
  }

  let matchedTenants: MatchRow[] = []
  let missingFields: string[] = []

  if (tab === 'recommended') {
    // Identify missing listing fields that affect match quality
    const propAny = property as Record<string, unknown>
    missingFields = [
      !propAny.asking_rent    && 'Asking rent',
      !propAny.suburb         && 'Suburb',
      !propAny.province       && 'Province',
      !propAny.available_from && 'Available from',
    ].filter(Boolean) as string[]

    const service = createServiceClient()

    const [{ data: tps }, { data: introData }] = await Promise.all([
      service
        .from('tenant_profiles')
        .select('*')
        .eq('is_visible', true)
        .limit(200)
        .order('created_at', { ascending: false }),
      supabase
        .from('introduction_requests')
        .select('tenant_id')
        .eq('property_id', property.id)
        .eq('landlord_id', user.id),
    ])

    const existingIntros = new Set<string>(
      (introData ?? []).map((i: { tenant_id: string }) => i.tenant_id),
    )

    const tenantProfileList: TenantProfile[] = tps ?? []
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

    const propertyListing = property as unknown as PropertyListing

    matchedTenants = tenantProfileList
      .map((tp) => ({
        tenantId: tp.user_id,
        name: displayName(nameMap.get(tp.user_id) ?? 'Tenant'),
        match: calculateMatchScore(tp, propertyListing),
        tp,
        alreadyRequested: existingIntros.has(tp.user_id),
      }))
      .sort((a, b) => b.match.total - a.match.total)
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/dashboard" className="hover:text-slate-900">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-slate-900">{property.name}</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">{property.name}</h1>
          <p className="mt-1 text-sm text-slate-500">{property.address}</p>
        </div>

        {/* Photos */}
        <div className="mb-6 card p-5">
          <PropertyPhotoUpload
            propertyId={property.id}
            initialPhotos={(property as { photos?: string[] }).photos ?? []}
          />
        </div>

        {/* Quick links */}
        <div className="mb-6 flex flex-wrap gap-3">
          <Link
            href={`/properties/${params.id}/components`}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Maintenance Tracker
          </Link>
        </div>

        {/* Tab nav */}
        <div className="mb-6 flex w-fit items-center gap-1 rounded-xl bg-slate-100 p-1">
          <Link
            href={`/properties/${params.id}`}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === 'tenants'
                ? 'bg-white shadow-sm text-slate-900'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Tenants
            <span
              className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                tab === 'tenants' ? 'bg-slate-100 text-slate-700' : 'bg-slate-200 text-slate-500'
              }`}
            >
              {tenantsWithRisk.length}
            </span>
          </Link>
          <Link
            href={`/properties/${params.id}?tab=recommended`}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === 'recommended'
                ? 'bg-white shadow-sm text-slate-900'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Recommended Tenants
          </Link>
        </div>

        {/* ── Tab: Tenants ─────────────────────────────────────────────────── */}
        {tab === 'tenants' && (
          <div className="card overflow-hidden">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="font-semibold text-slate-900">
                Tenants
                <span className="ml-2 text-sm font-normal text-slate-400">
                  {tenantsWithRisk.length} total
                </span>
              </h2>
            </div>

            {tenantsWithRisk.length === 0 ? (
              <div className="p-12 text-center text-slate-500">No tenants in this property.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {tenantsWithRisk.map((tenant) => (
                  <div key={tenant.id} className="flex items-center justify-between px-6 py-4 transition hover:bg-slate-50">
                    <Link href={`/tenants/${tenant.id}`} className="flex flex-1 items-center gap-4 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-600">
                        {tenant.full_name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">{tenant.full_name}</p>
                        <p className="text-sm text-slate-500 truncate">{tenant.email}</p>
                      </div>
                    </Link>

                    <div className="flex items-center gap-3 text-right">
                      <div className="hidden sm:block">
                        <p className="text-sm font-medium text-slate-900">
                          {fmtRand(tenant.monthly_rent)}
                          <span className="font-normal text-slate-400">/mo</span>
                        </p>
                        <p className="text-xs text-slate-400">
                          Lease from {fmtDate(tenant.lease_start)}
                        </p>
                      </div>
                      <RiskBadge risk={tenant.risk} />
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {(tenant as any).portal_token && (
                        <SharePortalButton
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          portalToken={(tenant as any).portal_token}
                          tenantName={tenant.full_name}
                        />
                      )}
                      <Link href={`/tenants/${tenant.id}`}>
                        <svg className="h-4 w-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Recommended Tenants ─────────────────────────────────────── */}
        {tab === 'recommended' && (
          <div>
            <ListingIncompleteNotice missingFields={missingFields} />

            {/* Header row */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-500">
                {matchedTenants.length === 0
                  ? 'No active tenant profiles found.'
                  : `${matchedTenants.length} active tenant${matchedTenants.length !== 1 ? 's' : ''} scored against this property`}
              </p>
              <Link
                href="/tenants/browse"
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Browse all tenants →
              </Link>
            </div>

            {matchedTenants.length === 0 ? (
              <div className="card p-12 text-center text-slate-500">
                <p className="text-base font-semibold text-slate-700">No tenant profiles yet</p>
                <p className="mt-2 text-sm">
                  Tenants who register on PropTrust and mark themselves as actively looking will
                  appear here, ranked by match score.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {matchedTenants.map((row) => (
                  <TenantMatchCard
                    key={row.tenantId}
                    tenantId={row.tenantId}
                    propertyId={property.id}
                    name={row.name}
                    match={row.match}
                    tp={row.tp}
                    alreadyRequested={row.alreadyRequested}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
