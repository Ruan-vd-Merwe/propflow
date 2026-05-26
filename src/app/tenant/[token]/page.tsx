import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import { TenantPortal } from './TenantPortal'
import type { TenantQuery } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function TenantPortalPage({
  params,
}: {
  params: { token: string }
}) {
  const supabase = createServiceClient()

  // Look up tenant by access_token
  const { data: tenant } = await supabase
    .from('tenants')
    .select(`
      id, full_name, email, monthly_rent,
      properties!inner ( name, address,
        profiles!inner ( full_name, email )
      )
    `)
    .eq('access_token', params.token)
    .single()

  if (!tenant) notFound()

  // Fetch this tenant's queries
  const { data: queries } = await supabase
    .from('tenant_queries')
    .select('*')
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const property = (tenant as any).properties
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const landlord = property.profiles as any

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Minimal header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">PropFlow</span>
          </div>
          <span className="text-sm text-slate-500">Tenant Portal</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Hi, {tenant.full_name.split(' ')[0]} 👋</h1>
          <p className="mt-1 text-sm text-slate-500">
            {property.name} · {property.address}
          </p>
        </div>

        {/* Landlord contact card */}
        <div className="card mb-6 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Your landlord</p>
          <p className="mt-1 font-semibold text-slate-900">{landlord.full_name}</p>
          <a href={`mailto:${landlord.email}`} className="text-sm text-blue-600 hover:underline">
            {landlord.email}
          </a>
        </div>

        <TenantPortal
          token={params.token}
          initialQueries={(queries ?? []) as TenantQuery[]}
        />
      </main>
    </div>
  )
}
