import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { NavBar } from '@/components/NavBar'
import { JobDetail } from './JobDetail'
import type { MaintenanceJob, PropertyComponent } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function MaintenanceJobPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: job } = await supabase
    .from('maintenance_jobs')
    .select(`
      *,
      properties!inner(id, name, address, owner_id,
        profiles!inner(full_name, email)
      ),
      property_components(name, component_type, installed_date, lifespan_max_years)
    `)
    .eq('id', params.id)
    .single()

  if (!job) notFound()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((job.properties as any).owner_id !== user.id) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const property = job.properties as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const component = job.property_components as PropertyComponent | null

  // Fetch other components for the same property (to create new jobs from)
  const { data: allComponents } = await supabase
    .from('property_components')
    .select('*')
    .eq('property_id', property.id)
    .order('name')

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />

      <main className="mx-auto max-w-4xl px-6 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/dashboard"          className="hover:text-slate-900">Dashboard</Link>
          <span>/</span>
          <Link href="/maintenance-jobs"   className="hover:text-slate-900">Maintenance</Link>
          <span>/</span>
          <span className="text-slate-900 truncate max-w-xs">{job.title}</span>
        </nav>

        <JobDetail
          job={job as MaintenanceJob}
          property={{
            id:      property.id,
            name:    property.name,
            address: property.address,
          }}
          component={component}
          allComponents={(allComponents ?? []) as PropertyComponent[]}
        />
      </main>
    </div>
  )
}
