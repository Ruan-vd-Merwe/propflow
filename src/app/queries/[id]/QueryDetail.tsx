'use client'

import { useState } from 'react'
import type { QueryStatus } from '@/lib/types'

const STATUS_OPTS: { value: QueryStatus; label: string; icon: string; colour: string }[] = [
  { value: 'open',        label: 'Open',        icon: '–', colour: 'border-amber-400 bg-amber-50 text-amber-800' },
  { value: 'in_progress', label: 'In Progress',  icon: '›', colour: 'border-blue-400 bg-blue-50 text-blue-800' },
  { value: 'resolved',    label: 'Resolved',     icon: 'v', colour: 'border-emerald-400 bg-emerald-50 text-emerald-800' },
]

export function QueryDetail({
  queryId,
  currentStatus,
  currentNotes,
}: {
  queryId: string
  currentStatus: string
  currentNotes: string
}) {
  const [status, setStatus] = useState<QueryStatus>(currentStatus as QueryStatus)
  const [notes,  setNotes]  = useState(currentNotes)
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  async function save() {
    setSaving(true)
    setSaved(false)
    setError(null)

    const res = await fetch(`/api/queries/${queryId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status, landlord_notes: notes }),
    })

    setSaving(false)

    if (!res.ok) {
      const json = await res.json()
      setError(json.error ?? 'Failed to save')
      return
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="card p-6">
      <h2 className="mb-4 font-semibold text-slate-900">Update Status</h2>

      {/* Status selector */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        {STATUS_OPTS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatus(opt.value)}
            className={`rounded-lg border px-4 py-3 text-sm font-medium transition ${
              status === opt.value
                ? opt.colour
                : 'border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
          >
            <span className="block text-xl">{opt.icon}</span>
            <span className="mt-1 block text-xs">{opt.label}</span>
          </button>
        ))}
      </div>

      {/* Notes */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Notes for tenant
          <span className="ml-1 text-xs font-normal text-slate-400">(shown in tenant portal)</span>
        </label>
        <textarea
          className="input-field resize-none"
          rows={3}
          placeholder="e.g. Plumber booked for Thursday 14:00. Please ensure access."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {error && (
        <p className="mb-3 rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</p>
      )}

      <div className="flex items-center justify-between">
        <span className={`text-sm text-emerald-600 transition-opacity ${saved ? 'opacity-100' : 'opacity-0'}`}>
          Saved ✓
        </span>
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}
