import { notFound } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { NavBar } from '@/components/NavBar'
import { PropertyScoreCard } from '@/components/PropertyScoreCard'
import { score_tenant_property } from '@/lib/scoring/engine'
import type { PropertyListing, TenantProfile } from '@/lib/types'
import Link from 'next/link'

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

  // Load tenant profile if logged in
  let scoreResult = null
  let tenantProfile: TenantProfile | null = null

  if (user) {
    const { data: tp } = await supabase
      .from('tenant_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    tenantProfile = (tp as TenantProfile | null) ?? null

    if (tenantProfile) {
      const profile = {
        monthly_income: (tenantProfile.monthly_income || 0) / 100,
        rental_budget: (tenantProfile.budget_max || 0) / 100,
        total_living_budget: ((tenantProfile.budget_max || 0) / 100) * 1.4,
        preferred_suburbs: tenantProfile.looking_in_area
          ? [tenantProfile.looking_in_area]
          : [],
        desired_bedrooms: 1,
        move_in_month: tenantProfile.move_in_date
          ? new Date(tenantProfile.move_in_date).getMonth() + 1
          : 6,
        employment_type: tenantProfile.employment_status ?? undefined,
        has_car: true,
        has_pets: false,
        lifestyle_tags: [],
        must_haves: [],
        dealbreakers: [],
        work_locations: [],
      }

      const propertyData = {
        property_id: property.id,
        suburb: property.suburb ?? undefined,
        rent: (property.asking_rent || 0) / 100,
        bedrooms: property.bedrooms ?? undefined,
        pets_allowed: false,
        suburb_avg_rent: (property.asking_rent || 0) / 100,
        area_tags: property.suburb ? [property.suburb.toLowerCase()] : [],
        property_tags: [property.property_type || 'apartment'],
      }

      scoreResult = score_tenant_property(profile, propertyData)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/tenant/profile" className="hover:text-slate-900">
            My profile
          </Link>
          <span>/</span>
          <span className="text-slate-900">Property</span>
        </nav>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Left: listing details */}
          <div className="space-y-5">
            {/* Photos placeholder */}
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

            {/* Title */}
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
                { label: 'Type', value: property.property_type ?? '—' },
                { label: 'Bedrooms', value: property.bedrooms ? `${property.bedrooms} bed` : '—' },
                {
                  label: 'Available',
                  value: property.available_from ? fmtDate(property.available_from) : '—',
                },
                { label: 'Province', value: property.province ?? '—' },
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

            {/* Apply CTA */}
            <Link
              href={`/apply?property_id=${property.id}`}
              className="block w-full rounded-xl bg-slate-900 py-3.5 text-center text-sm font-bold text-white transition hover:bg-slate-700"
            >
              Apply for this property
            </Link>
          </div>

          {/* Right: score card */}
          <div>
            {scoreResult ? (
              <PropertyScoreCard
                score={scoreResult.score}
                confidence={scoreResult.confidence}
                insights={scoreResult.insights}
                top_reasons={scoreResult.top_reasons}
                warnings={scoreResult.warnings}
              />
            ) : user && !tenantProfile ? (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-800">
                <p className="font-semibold">Complete your tenant profile</p>
                <p className="mt-1 text-blue-700">
                  Add your budget and preferences to see a personalised match score for
                  this property.
                </p>
                <Link
                  href="/tenant/profile"
                  className="mt-3 inline-block rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800"
                >
                  Complete profile
                </Link>
              </div>
            ) : !user ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700">
                <p className="font-semibold">See your match score</p>
                <p className="mt-1 text-slate-500">
                  Sign in with your tenant profile to get a personalised fit score for
                  this property.
                </p>
                <Link
                  href="/login"
                  className="mt-3 inline-block rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
                >
                  Sign in
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  )
}
