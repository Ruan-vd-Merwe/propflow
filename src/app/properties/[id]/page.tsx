import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { NavBar } from '@/components/NavBar'
import { RiskBadge } from '@/components/RiskBadge'
import { calculateRiskScore } from '@/lib/risk'
import type { Payment, Tenant } from '@/lib/types'

export const dynamic = 'force-dynamic'

function formatRand(cents: number) {
  return `R ${(cents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 0 })}`
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default async function PropertyPage({ params }: { params: { id: string } }) {
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

  const { data: tenants } = await supabase
    .from('tenants')
    .select('*')
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

  // Sort tenants by risk score ascending (highest risk first)
  const tenantsWithRisk = tenantList.map((t) => ({
    ...t,
    risk: calculateRiskScore(paymentsByTenant.get(t.id) ?? []),
  }))
  tenantsWithRisk.sort((a, b) => a.risk.score - b.risk.score)

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

        {/* Quick links */}
        <div className="mb-6 flex flex-wrap gap-3">
          <Link
            href={`/properties/${params.id}/components`}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            🔧 Maintenance Tracker
          </Link>
        </div>

        {/* Tenant table */}
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
                <Link
                  key={tenant.id}
                  href={`/tenants/${tenant.id}`}
                  className="flex items-center justify-between px-6 py-4 transition hover:bg-slate-50"
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-600">
                      {tenant.full_name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{tenant.full_name}</p>
                      <p className="text-sm text-slate-500">{tenant.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-right">
                    <div className="hidden sm:block">
                      <p className="text-sm font-medium text-slate-900">
                        {formatRand(tenant.monthly_rent)}
                        <span className="font-normal text-slate-400">/mo</span>
                      </p>
                      <p className="text-xs text-slate-400">
                        Lease from {formatDate(tenant.lease_start)}
                      </p>
                    </div>
                    <RiskBadge risk={tenant.risk} />
                    <svg
                      className="h-4 w-4 text-slate-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
