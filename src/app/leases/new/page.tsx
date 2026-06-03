import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NavBar } from '@/components/NavBar'
import { LeaseWizard } from './LeaseWizard'

export const dynamic = 'force-dynamic'

export default async function NewLeasePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profileRow }, { data: propertiesRaw }] = await Promise.all([
    supabase.from('profiles').select('full_name, email, phone').eq('id', user.id).single(),
    supabase.from('properties').select('id, name, address').eq('owner_id', user.id).order('name'),
  ])

  const propertyIds = (propertiesRaw ?? []).map((p) => p.id)

  const { data: tenantsRaw } = propertyIds.length
    ? await supabase
        .from('tenants')
        .select('id, property_id, full_name, email, monthly_rent')
        .in('property_id', propertyIds)
        .order('full_name')
    : { data: [] }

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />
      <main className="mx-auto max-w-2xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Create lease agreement</h1>
          <p className="mt-1 text-sm text-slate-500">Generate a legally compliant SA residential lease in minutes.</p>
        </div>

        <LeaseWizard
          properties={(propertiesRaw ?? []) as { id: string; name: string; address: string }[]}
          tenants={(tenantsRaw ?? []) as { id: string; property_id: string; full_name: string; email: string; monthly_rent: number }[]}
          landlord={{
            full_name: profileRow?.full_name ?? '',
            email:     user.email ?? '',
            phone:     profileRow?.phone ?? null,
          }}
        />
      </main>
    </div>
  )
}
