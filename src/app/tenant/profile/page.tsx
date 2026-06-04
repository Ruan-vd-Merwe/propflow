import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { calculateMatchScore, matchColour } from '@/lib/matching'
import { EditPreferencesPanel } from './EditPreferencesPanel'
import type { TenantProfile, PropertyListing, IntroductionRequest } from '@/lib/types'

export const dynamic = 'force-dynamic'

const EMPLOYMENT_LABELS: Record<string, string> = {
  employed: 'Employed',
  self_employed: 'Self-employed',
  student: 'Student',
  other: 'Other',
}

function fmt(cents: number) {
  return `R${(cents / 100).toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`
}

function MatchBadge({ score }: { score: number }) {
  const colour = matchColour(score)
  const cls =
    colour === 'green' ? 'bg-green-100 text-green-800' :
    colour === 'amber' ? 'bg-amber-100 text-amber-800' :
                         'bg-red-100 text-red-800'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${cls}`}>
      {score}% match
    </span>
  )
}

export default async function TenantProfilePage({
  searchParams,
}: {
  searchParams: { welcome?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const isWelcome = searchParams.welcome === '1'

  const [{ data: tp }, { data: profile }] = await Promise.all([
    supabase.from('tenant_profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('profiles').select('full_name, email, phone, is_landlord').eq('id', user.id).single(),
  ])

  const tenantProfile = tp as TenantProfile | null

  if (!tenantProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="card max-w-md p-8 text-center">
          <h1 className="text-xl font-bold text-slate-900">Profile not found</h1>
          <p className="mt-2 text-sm text-slate-500">
            Your tenant profile could not be loaded. Please contact support or try logging in again.
          </p>
        </div>
      </div>
    )
  }

  // ── Match listed properties ───────────────────────────────────────────────
  const { data: rawProps } = await supabase
    .from('properties')
    .select('*')
    .eq('is_listed', true)
    .order('created_at', { ascending: false })
    .limit(50)

  const scoredProperties = ((rawProps ?? []) as PropertyListing[])
    .map(p => ({ property: p, score: calculateMatchScore(tenantProfile, p) }))
    .filter(({ score }) => score.total > 0)
    .sort((a, b) => b.score.total - a.score.total)
    .slice(0, 12)

  // ── Introduction requests ─────────────────────────────────────────────────
  const { data: introRaw } = await supabase
    .from('introduction_requests')
    .select('*')
    .eq('tenant_id', user.id)
    .order('created_at', { ascending: false })

  const introductions = (introRaw ?? []) as IntroductionRequest[]
  const pendingCount  = introductions.filter(i => i.status === 'pending').length

  // ── Profile completeness check ────────────────────────────────────────────
  const isIncomplete = !tenantProfile.looking_in_area || !tenantProfile.budget_max || !tenantProfile.employment_status

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Minimal tenant nav */}
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-700">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <span className="text-lg font-bold text-slate-900">PropTrust</span>
          </div>
          <div className="flex items-center gap-3">
            {profile?.is_landlord && (
              <a href="/dashboard" className="text-sm font-medium text-slate-500 hover:text-slate-900">
                Landlord dashboard →
              </a>
            )}
            {pendingCount > 0 && (
              <a href="#introductions"
                className="flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                {pendingCount} introduction{pendingCount > 1 ? 's' : ''} pending
              </a>
            )}
            <VisibilityToggle userId={user.id} currentValue={tenantProfile.is_visible} />
          </div>
        </div>
      </nav>

      {isWelcome && (
        <div className="border-b border-green-500 bg-green-600 px-6 py-4 text-center text-white">
          <p className="font-semibold">Welcome to PropTrust!</p>
          <p className="mt-0.5 text-sm text-green-100">
            Your profile is set up. Landlords matching your preferences will be able to find and contact you.
          </p>
        </div>
      )}

      <div className="mx-auto max-w-4xl px-4 py-8">

        {/* ── Incomplete profile prompt ─────────────────────────────────── */}
        {isIncomplete && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-amber-900">Complete your profile to get matched with properties</p>
              <p className="mt-0.5 text-xs text-amber-700">
                Add your search area, budget and employment details so landlords can find you.
              </p>
            </div>
            {/* The EditPreferencesPanel button opens automatically — handled via CSS trick below */}
            <CompleteProfileButton tenantProfile={tenantProfile} userId={user.id} />
          </div>
        )}

        {/* ── Profile card ─────────────────────────────────────────────── */}
        <div className="card mb-6 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{profile?.full_name}</h1>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  tenantProfile.is_visible ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {tenantProfile.is_visible ? '● Actively looking' : '○ Not looking'}
                </span>
              </div>
              <p className="text-sm text-slate-500">{profile?.email}</p>
              {profile?.phone && <p className="text-sm text-slate-500">{profile.phone}</p>}
            </div>

            {/* Edit button — client component island */}
            <div className="shrink-0">
              <EditPreferencesPanel tenantProfile={tenantProfile} userId={user.id} />
            </div>
          </div>

          {/* Preferences summary */}
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {tenantProfile.looking_in_area ? (
              <Stat label="Looking in"
                value={`${tenantProfile.looking_in_area}${tenantProfile.looking_in_province ? ', ' + tenantProfile.looking_in_province : ''}`} />
            ) : (
              <StatEmpty label="Looking in" />
            )}
            {tenantProfile.budget_max ? (
              <Stat label="Budget"
                value={`${tenantProfile.budget_min ? fmt(tenantProfile.budget_min) : '–'} – ${fmt(tenantProfile.budget_max)}/mo`} />
            ) : (
              <StatEmpty label="Budget" />
            )}
            {tenantProfile.move_in_date ? (
              <Stat label="Move-in"
                value={new Date(tenantProfile.move_in_date).toLocaleDateString('en-ZA', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })} />
            ) : (
              <StatEmpty label="Move-in" />
            )}
            {tenantProfile.lease_length_months ? (
              <Stat label="Lease" value={`${tenantProfile.lease_length_months} months`} />
            ) : (
              <StatEmpty label="Lease" />
            )}
            {tenantProfile.employment_status && (
              <Stat label="Employment"
                value={EMPLOYMENT_LABELS[tenantProfile.employment_status] ?? tenantProfile.employment_status} />
            )}
            {tenantProfile.monthly_income && (
              <Stat label="Monthly income" value={`${fmt(tenantProfile.monthly_income)} net`} />
            )}
          </div>
        </div>

        {/* ── Matched properties ────────────────────────────────────────── */}
        <section className="mb-8">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900">
              Matched properties
              <span className="ml-2 text-sm font-normal text-slate-500">
                {scoredProperties.length} listing{scoredProperties.length !== 1 ? 's' : ''} match your search
              </span>
            </h2>
            <Link href="/how-scoring-works" className="shrink-0 text-xs text-slate-400 hover:text-slate-700 hover:underline">
              How scoring works
            </Link>
          </div>

          {scoredProperties.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-slate-500">No listed properties match your search yet.</p>
              <p className="mt-1 text-sm text-slate-400">
                {isIncomplete
                  ? 'Complete your profile above to improve matches.'
                  : 'Update your preferences or check back soon.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {scoredProperties.map(({ property: p, score }) => (
                <Link key={p.id} href={`/browse/${p.id}`} className="card overflow-hidden transition hover:shadow-md">
                  {p.photos?.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.photos[0]} alt={p.name} className="h-40 w-full object-cover" />
                  ) : (
                    <div className="flex h-40 items-center justify-center bg-slate-100">
                      <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                  )}
                  <div className="p-4">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <p className="font-semibold leading-snug text-slate-900">{p.name}</p>
                      <MatchBadge score={score.total} />
                    </div>
                    <p className="text-xs text-slate-500">
                      {p.suburb}{p.province ? `, ${p.province}` : ''}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      {p.asking_rent && (
                        <span className="text-base font-bold text-slate-900">
                          {fmt(p.asking_rent)}
                          <span className="text-xs font-normal text-slate-400">/mo</span>
                        </span>
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
                    <p className="mt-3 text-xs font-medium text-blue-600">View score breakdown →</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ── Introduction requests ──────────────────────────────────────── */}
        {introductions.length > 0 && (
          <section id="introductions" className="mb-8">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Introduction requests</h2>
            <div className="card divide-y divide-slate-100">
              {introductions.map(intro => (
                <IntroductionRow key={intro.id} intro={intro} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

// ── Server-side helpers ────────────────────────────────────────────────────────

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2.5">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  )
}

function StatEmpty({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2.5">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="mt-0.5 text-xs text-slate-300">Not set</p>
    </div>
  )
}

function IntroductionRow({ intro }: { intro: IntroductionRequest }) {
  const statusCls =
    intro.status === 'pending'  ? 'bg-amber-100 text-amber-700' :
    intro.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                   'bg-slate-100 text-slate-500'
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div>
        <p className="text-sm font-medium text-slate-900">Introduction request</p>
        <p className="text-xs text-slate-500">
          {new Date(intro.created_at).toLocaleDateString('en-ZA', {
            day: 'numeric', month: 'long', year: 'numeric',
          })}
        </p>
      </div>
      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusCls}`}>
        {intro.status}
      </span>
    </div>
  )
}

function VisibilityToggle({ userId, currentValue }: { userId: string; currentValue: boolean }) {
  void userId
  return (
    <form action="/api/tenant-profile/visibility" method="POST" className="inline">
      <input type="hidden" name="is_visible" value={String(!currentValue)} />
      <button type="submit"
        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
          currentValue
            ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
        }`}
      >
        {currentValue ? '● Actively looking' : '○ Hidden — turn on'}
      </button>
    </form>
  )
}

// Client island — "Complete your profile" button that opens the edit panel
// We reuse EditPreferencesPanel to avoid a separate auto-open mechanism
function CompleteProfileButton({ tenantProfile, userId }: { tenantProfile: TenantProfile; userId: string }) {
  return (
    <div className="shrink-0">
      <EditPreferencesPanel tenantProfile={tenantProfile} userId={userId} label="Complete profile →" />
    </div>
  )
}
