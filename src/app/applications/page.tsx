import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { NavBar } from '@/components/NavBar'
import { ApplicationStatusBadge } from '@/components/ApplicationStatusBadge'
import { CreditScoreMeter } from '@/components/CreditScoreMeter'
import { creditScoreColour } from '@/lib/credit-score'
import type { TenantApplication, Property } from '@/lib/types'

export const dynamic = 'force-dynamic'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-ZA', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

function formatRand(cents: number | null) {
  if (!cents) return '—'
  return `R ${(cents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 0 })}`
}

export default async function ApplicationsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get this landlord's properties
  const { data: properties } = await supabase
    .from('properties')
    .select('id, name')
    .eq('owner_id', user.id)

  const propertyList: Pick<Property, 'id' | 'name'>[] = properties ?? []
  const propertyIds = propertyList.map((p) => p.id)
  const propertyMap = new Map(propertyList.map((p) => [p.id, p.name]))

  // Fetch all applications for these properties
  const { data: apps } = propertyIds.length
    ? await supabase
        .from('tenant_applications')
        .select('*')
        .in('property_id', propertyIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  const applications = (apps ?? []) as TenantApplication[]

  // Stats
  const pending  = applications.filter((a) => a.status === 'pending').length
  const approved = applications.filter((a) => a.status === 'approved').length
  const rejected = applications.filter((a) => a.status === 'rejected').length

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Tenant Applications</h1>
            <p className="mt-1 text-sm text-slate-500">Review and process rental applications</p>
          </div>

          {/* Application link hint */}
          {propertyList.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm">
              <p className="font-medium text-slate-700">Share apply link:</p>
              <p className="mt-0.5 font-mono text-xs text-violet-700">
                /apply/{propertyList[0].id}
              </p>
              {propertyList.length > 1 && (
                <p className="mt-0.5 text-xs text-slate-400">
                  or choose a property — each has its own link
                </p>
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{pending}</p>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Pending</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{approved}</p>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Approved</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{rejected}</p>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Rejected</p>
          </div>
        </div>

        {/* Applications table */}
        {applications.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-slate-500">No applications yet.</p>
            {propertyList.length > 0 && (
              <p className="mt-2 text-sm text-slate-400">
                Share a link like{' '}
                <span className="font-mono text-slate-600">
                  /apply/{propertyList[0].id}
                </span>{' '}
                with prospective tenants.
              </p>
            )}
          </div>
        ) : (
          <div className="card overflow-hidden">
            {/* Header */}
            <div className="hidden grid-cols-[1fr_1fr_120px_100px_80px_36px] gap-4 border-b border-slate-100 px-6 py-3 text-xs font-medium uppercase tracking-wider text-slate-400 sm:grid">
              <span>Applicant</span>
              <span>Property</span>
              <span>Credit score</span>
              <span>Rent / Income</span>
              <span>Status</span>
              <span />
            </div>

            <div className="divide-y divide-slate-100">
              {applications.map((app) => {
                const colour = app.credit_score != null
                  ? creditScoreColour(app.credit_score) : null

                return (
                  <Link
                    key={app.id}
                    href={`/applications/${app.id}`}
                    className="flex flex-col gap-3 px-6 py-4 transition hover:bg-slate-50 sm:grid sm:grid-cols-[1fr_1fr_120px_100px_80px_36px] sm:items-center sm:gap-4"
                  >
                    {/* Applicant */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                        {app.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{app.full_name}</p>
                        <p className="text-xs text-slate-500">{formatDate(app.created_at)}</p>
                      </div>
                    </div>

                    {/* Property */}
                    <p className="text-sm text-slate-600">
                      {propertyMap.get(app.property_id) ?? '—'}
                    </p>

                    {/* Credit score */}
                    <div>
                      {app.credit_score != null ? (
                        <CreditScoreMeter score={app.credit_score} size="sm" />
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </div>

                    {/* Rent / Income */}
                    <div className="text-sm">
                      <p className="font-medium text-slate-900">
                        {formatRand(app.requested_rent_cents)}
                      </p>
                      <p className="text-xs text-slate-400">
                        inc {formatRand(app.monthly_income_cents)}
                      </p>
                    </div>

                    {/* Status */}
                    <ApplicationStatusBadge status={app.status} size="sm" />

                    {/* Arrow */}
                    <svg className="hidden h-4 w-4 shrink-0 text-slate-300 sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>

                    {/* Fraud flags (mobile) */}
                    {colour === 'red' && (
                      <span className="w-fit rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 sm:hidden">
                        High risk
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
