'use client'

import { useState } from 'react'
import type { ReferenceCheck, ReferenceResponse } from '@/lib/types'

// ─── Reference Check Panel ────────────────────────────────────────────────────

export function ReferenceCheckPanel({
  applicationId,
  initialChecks,
}: {
  applicationId: string
  initialChecks: ReferenceCheck[]
}) {
  const [checks, setChecks]   = useState<ReferenceCheck[]>(initialChecks)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [adding,  setAdding]  = useState(false)

  // Draft for new reference
  const [draft, setDraft] = useState<Omit<ReferenceCheck, 'id' | 'createdAt'>>({
    landlordName: '',
    contact:      '',
    contacted:    false,
    response:     'no_response',
    notes:        '',
  })

  function addCheck() {
    if (!draft.landlordName.trim()) return
    const newCheck: ReferenceCheck = {
      ...draft,
      id:        crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    setChecks((prev) => [...prev, newCheck])
    setDraft({ landlordName: '', contact: '', contacted: false, response: 'no_response', notes: '' })
    setAdding(false)
  }

  function removeCheck(id: string) {
    setChecks((prev) => prev.filter((c) => c.id !== id))
  }

  function updateCheck(id: string, field: keyof ReferenceCheck, value: unknown) {
    setChecks((prev) => prev.map((c) => c.id === id ? { ...c, [field]: value } : c))
  }

  async function saveChecks() {
    setSaving(true)
    setSaved(false)
    try {
      await fetch(`/api/applications/${applicationId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ reference_checks: checks }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  const RESPONSES: { value: ReferenceResponse; label: string; colour: string }[] = [
    { value: 'positive',    label: '✓ Positive',    colour: 'text-emerald-700' },
    { value: 'neutral',     label: '◐ Neutral',     colour: 'text-slate-600'   },
    { value: 'negative',    label: '✗ Negative',    colour: 'text-red-700'     },
    { value: 'no_response', label: '— No response', colour: 'text-slate-400'   },
  ]

  return (
    <div className="card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">
          Reference Check Tracker
          <span className="ml-2 text-sm font-normal text-slate-400">
            {checks.length} reference{checks.length !== 1 ? 's' : ''}
          </span>
        </h2>

        <div className="flex items-center gap-2">
          {saved && <span className="text-xs text-emerald-600">Saved ✓</span>}
          <button
            onClick={saveChecks}
            disabled={saving}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {/* Reference list */}
      {checks.length === 0 && !adding && (
        <p className="mb-4 text-sm text-slate-400">No references added yet.</p>
      )}

      <div className="space-y-4">
        {checks.map((check) => (
          <div key={check.id} className="rounded-lg border border-slate-200 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Previous Landlord Name
                </label>
                <input
                  className="input-field text-sm"
                  value={check.landlordName}
                  onChange={(e) => updateCheck(check.id, 'landlordName', e.target.value)}
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Contact Number / Email
                </label>
                <input
                  className="input-field text-sm"
                  value={check.contact}
                  onChange={(e) => updateCheck(check.id, 'contact', e.target.value)}
                  placeholder="012 345 6789"
                />
              </div>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {/* Contacted toggle */}
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Contacted</label>
                <div className="flex gap-2">
                  {[true, false].map((v) => (
                    <button
                      key={String(v)}
                      onClick={() => updateCheck(check.id, 'contacted', v)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        check.contacted === v
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {v ? 'Yes' : 'No'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Response */}
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Response</label>
                <select
                  className="input-field text-sm"
                  value={check.response}
                  onChange={(e) => updateCheck(check.id, 'response', e.target.value as ReferenceResponse)}
                  disabled={!check.contacted}
                >
                  {RESPONSES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              {/* Response badge */}
              <div className="flex items-end pb-0.5">
                {check.contacted && (
                  <span className={`text-sm font-semibold ${
                    RESPONSES.find((r) => r.value === check.response)?.colour ?? ''
                  }`}>
                    {RESPONSES.find((r) => r.value === check.response)?.label}
                  </span>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="mt-3">
              <label className="mb-1 block text-xs font-medium text-slate-500">Notes</label>
              <input
                className="input-field text-sm"
                value={check.notes}
                onChange={(e) => updateCheck(check.id, 'notes', e.target.value)}
                placeholder="e.g. Always paid on time, kept the property clean"
              />
            </div>

            <div className="mt-3 flex justify-end">
              <button
                onClick={() => removeCheck(check.id)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add reference form */}
      {adding ? (
        <div className="mt-4 rounded-lg border border-dashed border-slate-300 p-4">
          <p className="mb-3 text-sm font-medium text-slate-700">New Reference</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Landlord Name *</label>
              <input
                className="input-field text-sm"
                value={draft.landlordName}
                onChange={(e) => setDraft((d) => ({ ...d, landlordName: e.target.value }))}
                placeholder="John Smith"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Contact</label>
              <input
                className="input-field text-sm"
                value={draft.contact}
                onChange={(e) => setDraft((d) => ({ ...d, contact: e.target.value }))}
                placeholder="012 345 6789"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={addCheck}
              disabled={!draft.landlordName.trim()}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
            >
              Add
            </button>
            <button
              onClick={() => setAdding(false)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-4 flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <span className="text-lg leading-none">+</span>
          Add reference
        </button>
      )}
    </div>
  )
}

// ─── Status Form (exported for use in the detail page) ────────────────────────

export function StatusForm({
  applicationId,
  currentStatus,
}: {
  applicationId: string
  currentStatus: string
}) {
  const [status,  setStatus]  = useState(currentStatus)
  const [notes,   setNotes]   = useState('')
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)

  async function save() {
    setSaving(true)
    const body: Record<string, string> = { status }
    if (notes) body.landlord_notes = notes

    await fetch(`/api/applications/${applicationId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const opts: { value: string; label: string; colour: string }[] = [
    { value: 'pending',  label: 'Pending',  colour: 'border-amber-400 bg-amber-50 text-amber-700' },
    { value: 'approved', label: 'Approve',  colour: 'border-emerald-400 bg-emerald-50 text-emerald-700' },
    { value: 'rejected', label: 'Reject',   colour: 'border-red-400 bg-red-50 text-red-700' },
  ]

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {opts.map((o) => (
          <button
            key={o.value}
            onClick={() => setStatus(o.value)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              status === o.value ? o.colour : 'border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      <textarea
        className="input-field resize-none text-sm"
        rows={2}
        placeholder="Internal notes (optional)…"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <button
        onClick={save}
        disabled={saving || status === currentStatus}
        className="w-full rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-40"
      >
        {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Update Status'}
      </button>
    </div>
  )
}
