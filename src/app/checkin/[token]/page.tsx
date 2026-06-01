import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import { CheckinForm } from './CheckinForm'

export const dynamic = 'force-dynamic'

export default async function CheckinPage({ params }: { params: { token: string } }) {
  const supabase = createServiceClient()

  const { data: checkin } = await supabase
    .from('checkin_responses')
    .select(`
      id, month, responded_at,
      tenants!inner (
        full_name,
        properties!inner ( name )
      )
    `)
    .eq('token', params.token)
    .single()

  if (!checkin) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tenant   = (checkin as any).tenants
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const property = tenant.properties as any

  const monthLabel = new Date(checkin.month + '-01').toLocaleDateString('en-ZA', {
    month: 'long', year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-lg items-center gap-2 px-6 py-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">PropTrust</span>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-6 py-10">
        <div className="mb-6">
          <p className="text-sm font-medium uppercase tracking-wider text-slate-400">
            Monthly Check-in · {monthLabel}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Hi {tenant.full_name.split(' ')[0]}!
          </h1>
          <p className="mt-1 text-sm text-slate-500">{property.name}</p>
        </div>

        {checkin.responded_at ? (
          <div className="card p-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900">Already Completed</h2>
            <p className="mt-2 text-sm text-slate-500">
              You already completed this month&apos;s check-in. Thank you!
            </p>
          </div>
        ) : (
          <CheckinForm token={params.token} />
        )}
      </main>
    </div>
  )
}
