import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { NavBar } from '@/components/NavBar'
import type { MaintenanceJob, JobStatus, JobUrgency } from '@/lib/types'

export const dynamic = 'force-dynamic'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-ZA', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

const STATUS_CONFIG: Record<JobStatus, { label: string; badge: string }> = {
  draft:          { label: 'Draft',          badge: 'bg-slate-100 text-slate-600'         },
  sent:           { label: 'Sent',           badge: 'bg-blue-100 text-blue-700'           },
  quote_received: { label: 'Quote Received', badge: 'bg-amber-100 text-amber-700'         },
  approved:       { label: 'Approved',       badge: 'bg-emerald-100 text-emerald-700'     },
  declined:       { label: 'Declined',       badge: 'bg-red-100 text-red-700'             },
  completed:      { label: 'Completed',      badge: 'bg-slate-100 text-slate-500'         },
}

const URGENCY_CONFIG: Record<JobUrgency, { label: string; icon: string }> = {
  urgent:  { label: 'Urgent',  icon: '🔴' },
  normal:  { label: 'Normal',  icon: '🟡' },
  planned: { label: 'Planned', icon: '🟢' },
}

const STATUS_ORDER: Record<JobStatus, number> = {
  quote_received: 0,
  sent:           1,
  draft:          2,
  approved:       3,
  declined:       4,
  completed:      5,
}

export default async function MaintenanceJobsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: properties } = await supabase
    .from('properties')
    .select('id, name')
    .eq('owner_id', user.id)

  const propIds = (properties ?? []).map((p) => p.id)
  const propMap = new Map((properties ?? []).map((p) => [p.id, p.name]))

  const { data: jobs } = propIds.length
    ? await supabase
        .from('maintenance_jobs')
        .select(`*, property_components(name, component_type), properties(name)`)
        .in('property_id', propIds)
        .order('updated_at', { ascending: false })
    : { data: [] }

  const jobList = (jobs ?? []) as (MaintenanceJob & {
    property_components: { name: string; component_type: string } | null
    properties:          { name: string } | null
  })[]

  // Stats
  const active      = jobList.filter((j) => !['completed', 'declined'].includes(j.status)).length
  const quotePending = jobList.filter((j) => j.status === 'quote_received').length
  const urgent      = jobList.filter((j) => j.urgency === 'urgent' && j.status !== 'completed').length

  // Sort: urgent first, then by status priority, then by date
  const sorted = [...jobList].sort((a, b) => {
    if (a.urgency === 'urgent' && b.urgency !== 'urgent') return -1
    if (b.urgency === 'urgent' && a.urgency !== 'urgent') return 1
    const sdiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    if (sdiff !== 0) return sdiff
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  })

  void propMap

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Maintenance Jobs</h1>
          <p className="mt-1 text-sm text-slate-500">Contractor communication and job tracking</p>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-slate-800">{active}</p>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Active Jobs</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{quotePending}</p>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Quotes to Review</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{urgent}</p>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Urgent</p>
          </div>
        </div>

        {/* Job list */}
        {jobList.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="mb-2 text-4xl">🔧</p>
            <p className="font-semibold text-slate-700">No maintenance jobs yet</p>
            <p className="mt-1 text-sm text-slate-400">
              Jobs are created from the property maintenance tracker when a component needs attention.
            </p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            {sorted.map((job) => {
              const status  = STATUS_CONFIG[job.status]
              const urgency = URGENCY_CONFIG[job.urgency]
              const propName = job.properties?.name ?? '—'

              return (
                <Link
                  key={job.id}
                  href={`/maintenance-jobs/${job.id}`}
                  className="flex items-start gap-4 border-b border-slate-100 px-6 py-4 transition hover:bg-slate-50 last:border-0"
                >
                  <span className="mt-0.5 text-lg">{urgency.icon}</span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">{job.title}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.badge}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {propName}
                      {job.property_components ? ` · ${job.property_components.name}` : ''}
                      {job.contractor_name ? ` · ${job.contractor_name}` : ''}
                      {' · '}Updated {formatDate(job.updated_at)}
                    </p>
                    {job.quote_summary && (
                      <p className="mt-1 truncate text-sm text-slate-500">{job.quote_summary}</p>
                    )}
                  </div>

                  <svg className="mt-1 h-4 w-4 shrink-0 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
