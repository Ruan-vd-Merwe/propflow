import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { NavBar } from '@/components/NavBar'
import { ScoreBreakdown } from '@/components/ScoreBreakdown'
import { tenant_interest_match_model } from '@/lib/scoring/interest-engine'
import { mapTenantProfile, mapProperty } from '@/lib/scoring/mappers'
import type { PropertyListing } from '@/lib/types'

export const dynamic = 'force-dynamic'

function fmtRand(cents: number) {
  return `R ${(cents / 100).toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function BrowsePropertyPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: raw } = await supabase
    .from('properties')
    .select('*')
    .eq('id', params.id)
    .eq('is_listed', true)
    .single()

  if (!raw) notFound()
  const property = raw as PropertyListing

  // Compute score server-side if tenant profile exists
  let scoreResult = null
  let hasTenantProfile = false

  if (user) {
    const { data: tp } = await supabase
      .from('tenant_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (tp) {
      hasTenantProfile = true
      const profile = mapTenantProfile(tp as Record<string, unknown>)
      const propertyData = mapProperty(raw as Record<string, unknown>)
      scoreResult = tenant_interest_match_model(profile, propertyData)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/browse" className="hover:text-slate-900">
            Browse
          </Link>
          <span>/</span>
          <span className="text-slate-900">{property.name}</span>
        </nav>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Left: listing details */}
          <div className="space-y-5">
            {/* Photo */}
            {property.photos?.length > 0 ? (
              <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-200">
                <Image
                  src={property.photos[0]}
                  alt={property.name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-2xl bg-slate-200">
                <svg
                  className="h-12 w-12 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
            )}

            {/* Title + rent */}
            <div>
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-2xl font-bold text-slate-900">{property.name}</h1>
                {property.asking_rent && (
                  <p className="shrink-0 text-xl font-extrabold text-slate-900">
                    {fmtRand(property.asking_rent)}
                    <span className="text-sm font-normal text-slate-400">/mo</span>
                  </p>
                )}
              </div>
              {property.suburb && (
                <p className="mt-1 text-sm text-slate-500">
                  {property.suburb}
                  {property.province ? `, ${property.province}` : ''}
                </p>
              )}
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Type',      value: property.property_type ?? '—' },
                { label: 'Bedrooms',  value: property.bedrooms ? `${property.bedrooms} bed` : '—' },
                { label: 'Available', value: property.available_from ? fmtDate(property.available_from) : '—' },
                { label: 'Province',  value: property.province ?? '—' },
              ].map((d) => (
                <div key={d.label} className="rounded-xl bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs text-slate-400">{d.label}</p>
                  <p className="mt-0.5 font-semibold capitalize text-slate-900">{d.value}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            {property.description && (
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="mb-2 text-sm font-semibold text-slate-700">Description</h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
                  {property.description}
                </p>
              </div>
            )}

            {/* Score section — main placement for mobile / before apply */}
            <div className="lg:hidden">
              <ScoreSection
                scoreResult={scoreResult}
                user={user}
                hasTenantProfile={hasTenantProfile}
                propertyId={property.id}
              />
            </div>

            {/* Apply CTA */}
            <Link
              href={`/apply?property_id=${property.id}`}
              className="block w-full rounded-xl bg-slate-900 py-3.5 text-center text-sm font-bold text-white transition hover:bg-slate-700"
            >
              Apply for this property
            </Link>
          </div>

          {/* Right: score (desktop) */}
          <div className="hidden lg:block">
            <ScoreSection
              scoreResult={scoreResult}
              user={user}
              hasTenantProfile={hasTenantProfile}
              propertyId={property.id}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

// ─── Score section component ──────────────────────────────────────────────────

function ScoreSection({
  scoreResult,
  user,
  hasTenantProfile,
  propertyId,
}: {
  scoreResult: Awaited<ReturnType<typeof tenant_interest_match_model>> | null
  user: { id: string } | null
  hasTenantProfile: boolean
  propertyId: string
}) {
  void propertyId

  if (scoreResult) {
    return (
      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">
          How this property matches your profile
        </h2>
        <ScoreBreakdown
          score={scoreResult.score}
          confidence={scoreResult.confidence}
          match_reasons={scoreResult.match_reasons}
          warnings={scoreResult.warnings}
          insights={scoreResult.insights}
        />
        <p className="mt-2 text-right text-xs text-slate-400">
          <Link href="/how-scoring-works" className="hover:text-slate-700 hover:underline">
            How scoring works
          </Link>
        </p>
      </div>
    )
  }

  if (user && !hasTenantProfile) {
    return (
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <p className="text-sm font-semibold text-blue-900">Complete your tenant profile</p>
        <p className="mt-1 text-sm text-blue-700">
          Add your budget and preferences to see a personalised match score for this property.
        </p>
        <Link
          href="/tenant/profile"
          className="mt-3 inline-block rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800"
        >
          Complete profile
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-sm font-semibold text-slate-900">
        Sign in to see your personal match score
      </p>
      <p className="mt-1 text-sm text-slate-500">
        Sign in with your tenant profile to get a personalised fit score for this property.
      </p>
      <Link
        href="/login"
        className="mt-3 inline-block rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
      >
        Sign in
      </Link>
    </div>
  )
}
