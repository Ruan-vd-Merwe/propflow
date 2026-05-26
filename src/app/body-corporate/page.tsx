import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { NavBar } from '@/components/NavBar'
import type { BodyCorpDocument } from '@/lib/types'

export const dynamic = 'force-dynamic'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-ZA', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

function FlagDot({ count, colour }: { count: number; colour: string }) {
  if (count === 0) return null
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${colour}`}>
      {count}
    </span>
  )
}

export default async function BodyCorporatePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get all properties for this user
  const { data: properties } = await supabase
    .from('properties')
    .select('id, name')
    .eq('owner_id', user.id)

  const propIds  = (properties ?? []).map((p) => p.id)
  const propMap  = new Map((properties ?? []).map((p) => [p.id, p.name]))

  const { data: docs } = propIds.length
    ? await supabase
        .from('body_corporate_documents')
        .select('*')
        .in('property_id', propIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  const docList = (docs ?? []) as BodyCorpDocument[]

  // Stats
  const totalRed   = docList.reduce((s, d) => s + (d.flag_count?.red   ?? 0), 0)
  const totalAmber = docList.reduce((s, d) => s + (d.flag_count?.amber ?? 0), 0)
  const totalGreen = docList.reduce((s, d) => s + (d.flag_count?.green ?? 0), 0)
  const actionRequired = docList.reduce((s) => s, 0)
  void actionRequired

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Body Corporate</h1>
            <p className="mt-1 text-sm text-slate-500">Parsed meeting minutes with AI-flagged action items</p>
          </div>
          <Link href="/body-corporate/new" className="btn-primary">
            + Parse Minutes
          </Link>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{totalRed}</p>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Red Flags</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{totalAmber}</p>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Amber Flags</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{totalGreen}</p>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Green Items</p>
          </div>
        </div>

        {/* Document list */}
        {docList.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="mb-2 text-4xl">📄</p>
            <p className="font-semibold text-slate-700">No documents yet</p>
            <p className="mt-1 text-sm text-slate-400">
              Upload a PDF or paste body corporate meeting minutes to get started.
            </p>
            <Link href="/body-corporate/new" className="btn-primary mt-4 inline-block">
              Parse Meeting Minutes
            </Link>
          </div>
        ) : (
          <div className="card overflow-hidden">
            {docList.map((doc) => {
              const flags = doc.flag_count ?? { red: 0, amber: 0, green: 0 }
              const hasUrgent = flags.red > 0

              return (
                <Link
                  key={doc.id}
                  href={`/body-corporate/${doc.id}`}
                  className="flex items-start gap-4 border-b border-slate-100 px-6 py-4 transition hover:bg-slate-50 last:border-0"
                >
                  {/* Icon */}
                  <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base ${
                    hasUrgent ? 'bg-red-100' : 'bg-slate-100'
                  }`}>
                    {hasUrgent ? '🚨' : '📋'}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">{doc.title}</p>
                      {doc.source === 'pdf' && (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">PDF</span>
                      )}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <FlagDot count={flags.red}   colour="bg-red-100 text-red-700"       />
                      <FlagDot count={flags.amber} colour="bg-amber-100 text-amber-700"   />
                      <FlagDot count={flags.green} colour="bg-emerald-100 text-emerald-700" />
                      {flags.red === 0 && flags.amber === 0 && flags.green === 0 && (
                        <span className="text-xs text-slate-400">No flags</span>
                      )}
                    </div>

                    <p className="mt-0.5 text-xs text-slate-400">
                      {propMap.get(doc.property_id) ?? '—'}
                      {doc.meeting_date ? ` · Meeting: ${formatDate(doc.meeting_date)}` : ''}
                      {' · '}Parsed {formatDate(doc.created_at)}
                    </p>
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
