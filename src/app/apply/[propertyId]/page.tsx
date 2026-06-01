import { notFound } from 'next/navigation'
import { createAnonClient } from '@/lib/supabase/anon'
import { ApplicationForm } from './ApplicationForm'

export const dynamic = 'force-dynamic'

export default async function ApplyPage({
  params,
}: {
  params: { propertyId: string }
}) {
  const supabase = createAnonClient()

  const { data: property } = await supabase
    .from('properties')
    .select('id, name, address')
    .eq('id', params.propertyId)
    .single()

  if (!property) notFound()

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Minimal header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-6 py-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">PropTrust</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">
        {/* Property context */}
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-wider text-slate-400">
            Rental Application
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{property.name}</h1>
          <p className="mt-0.5 text-sm text-slate-500">{property.address}</p>
        </div>

        <ApplicationForm propertyId={property.id} />
      </main>
    </div>
  )
}
