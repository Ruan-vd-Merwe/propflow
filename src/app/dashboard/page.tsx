import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { NavBar } from '@/components/NavBar'
import { RiskBadge } from '@/components/RiskBadge'
import { calculateRiskScore } from '@/lib/risk'
import type { Payment, Property, Tenant } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch properties owned by this landlord
  const { data: properties } = await supabase
    .from('properties')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  const propertyList: Property[] = properties ?? []
  const propertyIds = propertyList.map((p) => p.id)

  // Fetch all tenants for these properties
  const { data: tenants } = propertyIds.length
    ? await supabase.from('tenants').select('*').in('property_id', propertyIds)
    : { data: [] }

  const tenantList: Tenant[] = tenants ?? []
  const tenantIds = tenantList.map((t) => t.id)

  // Fetch all payments for these tenants
  const { data: payments } = tenantIds.length
    ? await supabase.from('payments').select('*').in('tenant_id', tenantIds)
    : { data: [] }

  const paymentList: Payment[] = payments ?? []

  // Compute per-tenant risk scores
  const paymentsByTenant = new Map<string, Payment[]>()
  for (const p of paymentList) {
    if (!paymentsByTenant.has(p.tenant_id)) paymentsByTenant.set(p.tenant_id, [])
    paymentsByTenant.get(p.tenant_id)!.push(p)
  }

  const tenantsByProperty = new Map<string, Tenant[]>()
  for (const t of tenantList) {
    if (!tenantsByProperty.has(t.property_id)) tenantsByProperty.set(t.property_id, [])
    tenantsByProperty.get(t.property_id)!.push(t)
  }

  // Summary stats
  const totalProperties = propertyList.length
  const totalTenants = tenantList.length
  const atRisk = tenantList.filter((t) => {
    const risk = calculateRiskScore(paymentsByTenant.get(t.id) ?? [])
    return risk.colour === 'red'
  }).length
  const totalRentCents = tenantList.reduce((sum, t) => sum + t.monthly_rent, 0)

  function formatRand(cents: number) {
    return `R ${(cents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 0 })}`
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Your properties at a glance</p>
        </div>

        {/* Stats row */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Properties" value={String(totalProperties)} />
          <StatCard label="Tenants" value={String(totalTenants)} />
          <StatCard
            label="High Risk"
            value={String(atRisk)}
            valueClass={atRisk > 0 ? 'text-red-600' : 'text-emerald-600'}
          />
          <StatCard label="Monthly Rent" value={formatRand(totalRentCents)} />
        </div>

        {/* Properties */}
        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
            Properties
          </h2>

          {propertyList.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-slate-500">No properties yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {propertyList.map((property) => {
                const propertyTenants = tenantsByProperty.get(property.id) ?? []

                return (
                  <Link
                    key={property.id}
                    href={`/properties/${property.id}`}
                    className="card block p-5 transition hover:border-slate-300 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900">{property.name}</h3>
                        <p className="mt-0.5 text-sm text-slate-500">{property.address}</p>
                      </div>
                      <span className="ml-4 shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {propertyTenants.length} tenant{propertyTenants.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Tenant risk preview */}
                    {propertyTenants.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {propertyTenants.map((t) => {
                          const risk = calculateRiskScore(paymentsByTenant.get(t.id) ?? [])
                          return (
                            <div
                              key={t.id}
                              className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5"
                            >
                              <span className="text-sm font-medium text-slate-700">
                                {t.full_name}
                              </span>
                              <RiskBadge risk={risk} size="sm" />
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function StatCard({
  label,
  value,
  valueClass = 'text-slate-900',
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="card p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${valueClass}`}>{value}</p>
    </div>
  )
}
