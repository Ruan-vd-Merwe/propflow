'use client'

import { useState } from 'react'
import type { TenantQuery, QueryCategory, QueryStatus } from '@/lib/types'

// ─── Config ───────────────────────────────────────────────────────────────────

const CATEGORIES: {
  value: QueryCategory
  label: string
  description: string
  icon: string
  colour: string
  bgColour: string
  borderColour: string
  subcategories: { value: string; label: string }[]
}[] = [
  {
    value:       'emergency',
    label:       'Emergency',
    description: 'Water, electricity, security, gas, structural damage',
    icon:        '🚨',
    colour:      'text-red-700',
    bgColour:    'bg-red-50',
    borderColour:'border-red-300',
    subcategories: [
      { value: 'water',      label: 'Water / flooding' },
      { value: 'electricity',label: 'Electricity / power' },
      { value: 'security',   label: 'Security / break-in' },
      { value: 'gas',        label: 'Gas / smell / leak' },
      { value: 'structural', label: 'Structural damage' },
    ],
  },
  {
    value:       'maintenance',
    label:       'Maintenance',
    description: 'Plumbing, appliances, doors, garden',
    icon:        '🔧',
    colour:      'text-amber-700',
    bgColour:    'bg-amber-50',
    borderColour:'border-amber-300',
    subcategories: [
      { value: 'plumbing',     label: 'Plumbing' },
      { value: 'electrical',   label: 'Electrical' },
      { value: 'appliances',   label: 'Appliances' },
      { value: 'doors_windows',label: 'Doors / windows' },
      { value: 'garden',       label: 'Garden / exterior' },
      { value: 'other',        label: 'Other maintenance' },
    ],
  },
  {
    value:       'general',
    label:       'General Query',
    description: 'Noise, contract questions, parking, other',
    icon:        '💬',
    colour:      'text-slate-700',
    bgColour:    'bg-slate-50',
    borderColour:'border-slate-200',
    subcategories: [
      { value: 'noise',    label: 'Noise complaint' },
      { value: 'contract', label: 'Lease / contract' },
      { value: 'parking',  label: 'Parking' },
      { value: 'other',    label: 'Other' },
    ],
  },
]

const STATUS_CONFIG: Record<QueryStatus, { label: string; className: string }> = {
  open:        { label: 'Open',        className: 'bg-amber-100 text-amber-700' },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-700' },
  resolved:    { label: 'Resolved',    className: 'bg-emerald-100 text-emerald-700' },
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Draft {
  category:    QueryCategory | null
  subcategory: string
  title:       string
  description: string
}

export function TenantPortal({
  token,
  initialQueries,
}: {
  token: string
  initialQueries: TenantQuery[]
}) {
  const [queries,   setQueries]   = useState<TenantQuery[]>(initialQueries)
  const [view,      setView]      = useState<'home' | 'new' | 'list'>('home')
  const [draft,     setDraft]     = useState<Draft>({ category: null, subcategory: '', title: '', description: '' })
  const [step,      setStep]      = useState<1 | 2>(1)
  const [submitting,setSubmitting] = useState(false)
  const [submitted, setSubmitted]  = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const selectedCat = CATEGORIES.find((c) => c.value === draft.category)

  async function submitQuery() {
    if (!draft.category || !draft.title.trim() || !draft.description.trim()) return
    setSubmitting(true)
    setError(null)

    const res = await fetch('/api/queries', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        token,
        category:    draft.category,
        subcategory: draft.subcategory || undefined,
        title:       draft.title.trim(),
        description: draft.description.trim(),
      }),
    })

    const json = await res.json()
    setSubmitting(false)

    if (!res.ok) { setError(json.error ?? 'Failed to submit'); return }

    // Optimistically add to list
    setQueries((prev) => [{
      id:              json.query.id,
      tenant_id:       '',
      category:        draft.category!,
      subcategory:     draft.subcategory || null,
      title:           draft.title.trim(),
      description:     draft.description.trim(),
      status:          'open',
      landlord_notes:  null,
      created_at:      json.query.created_at,
      updated_at:      json.query.created_at,
    }, ...prev])

    setSubmitted(true)
    setDraft({ category: null, subcategory: '', title: '', description: '' })
    setStep(1)
  }

  function resetForm() {
    setSubmitted(false)
    setDraft({ category: null, subcategory: '', title: '', description: '' })
    setStep(1)
    setView('home')
  }

  // ── Submitted confirmation ──────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="card p-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <span className="text-2xl">✓</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">Query Submitted</h2>
        <p className="mt-2 text-sm text-slate-500">
          Your landlord has been notified. You can track the status below.
        </p>
        <button
          onClick={resetForm}
          className="mt-6 rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Back to Home
        </button>
      </div>
    )
  }

  // ── Home view ───────────────────────────────────────────────────────────────
  if (view === 'home') {
    const open = queries.filter((q) => q.status !== 'resolved').length

    return (
      <div className="space-y-4">
        {/* CTA buttons */}
        <div className="grid gap-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => { setDraft((d) => ({ ...d, category: cat.value })); setStep(1); setView('new') }}
              className={`card flex items-center gap-4 p-5 text-left transition hover:shadow-md ${
                cat.value === 'emergency' ? 'border-red-200 hover:border-red-300' : ''
              }`}
            >
              <span className="text-3xl">{cat.icon}</span>
              <div>
                <p className={`font-semibold ${cat.colour}`}>{cat.label}</p>
                <p className="text-sm text-slate-500">{cat.description}</p>
              </div>
              <svg className="ml-auto h-4 w-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>

        {/* Previous queries link */}
        {queries.length > 0 && (
          <button
            onClick={() => setView('list')}
            className="mt-2 flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-5 py-4 text-sm transition hover:bg-slate-50"
          >
            <span className="font-medium text-slate-700">My previous queries</span>
            <div className="flex items-center gap-2">
              {open > 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  {open} open
                </span>
              )}
              <svg className="h-4 w-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        )}
      </div>
    )
  }

  // ── Query list view ─────────────────────────────────────────────────────────
  if (view === 'list') {
    return (
      <div>
        <div className="mb-4 flex items-center gap-3">
          <button onClick={() => setView('home')} className="text-sm text-slate-500 hover:text-slate-900">
            ← Back
          </button>
          <h2 className="font-semibold text-slate-900">My Queries</h2>
        </div>

        {queries.length === 0 ? (
          <div className="card p-10 text-center text-slate-500">No queries submitted yet.</div>
        ) : (
          <div className="space-y-3">
            {queries.map((q) => {
              const cat    = CATEGORIES.find((c) => c.value === q.category)
              const status = STATUS_CONFIG[q.status]
              return (
                <div key={q.id} className="card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span>{cat?.icon}</span>
                        <p className="font-semibold text-slate-900">{q.title}</p>
                      </div>
                      <p className="mt-0.5 text-sm text-slate-500">{q.description}</p>
                      {q.landlord_notes && (
                        <div className="mt-2 rounded-lg bg-blue-50 p-2 text-sm text-blue-700">
                          <span className="font-medium">Landlord note:</span> {q.landlord_notes}
                        </div>
                      )}
                      <p className="mt-2 text-xs text-slate-400">{formatDate(q.created_at)}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}>
                      {status.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ── New query form ──────────────────────────────────────────────────────────
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => { setView('home'); setStep(1) }} className="text-sm text-slate-500 hover:text-slate-900">
          ← Back
        </button>
        <h2 className="font-semibold text-slate-900">
          {selectedCat?.icon} {selectedCat?.label}
        </h2>
      </div>

      <div className="card p-6">
        {step === 1 && (
          <div className="space-y-4">
            {/* Subcategory */}
            {selectedCat && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  What type of issue?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {selectedCat.subcategories.map((sub) => (
                    <button
                      key={sub.value}
                      onClick={() => setDraft((d) => ({ ...d, subcategory: sub.value }))}
                      className={`rounded-lg border px-3 py-2 text-sm text-left transition ${
                        draft.subcategory === sub.value
                          ? `${selectedCat.bgColour} ${selectedCat.borderColour} ${selectedCat.colour} font-medium`
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Brief summary <span className="text-red-500">*</span>
              </label>
              <input
                className="input-field"
                placeholder="e.g. Geyser leaking water in bathroom"
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              />
            </div>

            <button
              disabled={!draft.title.trim()}
              onClick={() => setStep(2)}
              className="btn-primary w-auto px-6"
            >
              Next →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-slate-700">{draft.title}</p>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Describe the issue in detail <span className="text-red-500">*</span>
              </label>
              <textarea
                className="input-field resize-none"
                rows={4}
                placeholder="Please describe when it started, how severe it is, and any other relevant details…"
                value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              />
            </div>

            {draft.category === 'emergency' && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                ⚠ For life-threatening emergencies (fire, gas leak, etc.), please call emergency services
                (10111 / 10177) first, then submit this form.
              </div>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                ← Back
              </button>
              <button
                disabled={submitting || !draft.description.trim()}
                onClick={submitQuery}
                className="btn-primary w-auto px-6"
              >
                {submitting ? 'Submitting…' : 'Submit Query'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
