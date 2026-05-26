'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { BodyCorpFlag } from '@/lib/types'

interface Property {
  id: string
  name: string
}

interface ParseResult {
  summary: string
  meetingDate: string | null
  flags: Array<Omit<BodyCorpFlag, 'id' | 'document_id' | 'property_id' | 'created_at'>>
}

interface Props {
  properties: Property[]
}

const SEVERITY_CONFIG = {
  red:   { label: 'Red',   badge: 'bg-red-100 text-red-700',           dot: 'bg-red-500'   },
  amber: { label: 'Amber', badge: 'bg-amber-100 text-amber-700',       dot: 'bg-amber-500' },
  green: { label: 'Green', badge: 'bg-emerald-100 text-emerald-700',   dot: 'bg-emerald-500' },
}

const CATEGORY_LABEL: Record<string, string> = {
  special_levy:     'Special Levy',
  maintenance:      'Maintenance',
  legal:            'Legal',
  financial:        'Financial',
  action_required:  'Action Required',
}

export function BodyCorporateForm({ properties }: Props) {
  const router = useRouter()

  const [inputMode,   setInputMode]   = useState<'pdf' | 'text'>('pdf')
  const [propertyId,  setPropertyId]  = useState(properties[0]?.id ?? '')
  const [title,       setTitle]       = useState('')
  const [pdfFile,     setPdfFile]     = useState<File | null>(null)
  const [pastedText,  setPastedText]  = useState('')

  const [parsing,     setParsing]     = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [parseError,  setParseError]  = useState('')
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)

  // ── Step 1: Send to Claude ────────────────────────────────────────────────
  async function handleParse() {
    setParseError('')
    setParseResult(null)
    setParsing(true)

    try {
      let res: Response

      if (inputMode === 'pdf') {
        if (!pdfFile) { setParseError('Please select a PDF file.'); setParsing(false); return }
        const fd = new FormData()
        fd.append('file', pdfFile)
        res = await fetch('/api/body-corporate/parse', { method: 'POST', body: fd })
      } else {
        if (!pastedText.trim()) { setParseError('Please paste some text.'); setParsing(false); return }
        res = await fetch('/api/body-corporate/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: pastedText }),
        })
      }

      const json = await res.json()
      if (!res.ok) {
        setParseError(json.error ?? 'Failed to parse')
        return
      }

      setParseResult(json.analysis)
      if (!title) setTitle(json.analysis.meetingDate
        ? `Meeting ${json.analysis.meetingDate}`
        : 'Body Corporate Minutes')
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setParsing(false)
    }
  }

  // ── Step 2: Save the parsed result ───────────────────────────────────────
  async function handleSave() {
    if (!parseResult || !propertyId || !title.trim()) return
    setSaving(true)

    try {
      const res = await fetch('/api/body-corporate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id:   propertyId,
          title:         title.trim(),
          source:        inputMode,
          filename:      pdfFile?.name ?? null,
          meeting_date:  parseResult.meetingDate,
          claude_summary: parseResult.summary,
          flags:         parseResult.flags,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        setParseError(json.error ?? 'Failed to save')
        return
      }

      router.push(`/body-corporate/${json.id}`)
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSaving(false)
    }
  }

  const sortedFlags = parseResult
    ? [...parseResult.flags].sort((a, b) => {
        const order = { red: 0, amber: 1, green: 2 }
        return order[a.severity] - order[b.severity]
      })
    : []

  const redCount   = sortedFlags.filter((f) => f.severity === 'red').length
  const amberCount = sortedFlags.filter((f) => f.severity === 'amber').length
  const greenCount = sortedFlags.filter((f) => f.severity === 'green').length

  return (
    <div className="space-y-5">

      {/* ── Step 1: Input ─────────────────────────────────────────────────── */}
      <div className="card p-6">
        <h2 className="mb-4 font-semibold text-slate-900">1. Upload minutes</h2>

        {/* Input mode toggle */}
        <div className="mb-4 flex rounded-lg border border-slate-200 p-1">
          {(['pdf', 'text'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setInputMode(mode)}
              className={`flex-1 rounded-md py-1.5 text-sm font-medium transition ${
                inputMode === mode
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {mode === 'pdf' ? '📄 PDF Upload' : '📝 Text Paste'}
            </button>
          ))}
        </div>

        {/* Property selector */}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-slate-700">Property</label>
          <select
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className="input-field"
          >
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {inputMode === 'pdf' ? (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">PDF File</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
            />
          </div>
        ) : (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Paste minutes text</label>
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              rows={10}
              placeholder="Paste the full text of the body corporate meeting minutes here…"
              className="input-field min-h-[160px] font-mono text-xs"
            />
          </div>
        )}

        {parseError && (
          <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{parseError}</p>
        )}

        <button
          onClick={handleParse}
          disabled={parsing}
          className="btn-primary mt-4 w-full disabled:opacity-60"
        >
          {parsing ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Analysing with Claude AI…
            </span>
          ) : '✨ Analyse with AI'}
        </button>
      </div>

      {/* ── Step 2: Results ───────────────────────────────────────────────── */}
      {parseResult && (
        <>
          {/* Summary */}
          <div className="card p-6">
            <h2 className="mb-3 font-semibold text-slate-900">2. AI Analysis</h2>

            {/* Flag counts */}
            <div className="mb-4 flex gap-3">
              {redCount > 0 && (
                <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
                  🔴 {redCount} Red
                </span>
              )}
              {amberCount > 0 && (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
                  🟡 {amberCount} Amber
                </span>
              )}
              {greenCount > 0 && (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
                  🟢 {greenCount} Green
                </span>
              )}
            </div>

            {/* Summary text */}
            <div className="mb-4 rounded-lg bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-700">Summary</p>
              <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap">{parseResult.summary}</p>
            </div>

            {/* Flags */}
            {sortedFlags.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-700">Flagged Items</p>
                {sortedFlags.map((flag, i) => {
                  const sev = SEVERITY_CONFIG[flag.severity]
                  return (
                    <div
                      key={i}
                      className={`rounded-lg border p-4 ${
                        flag.severity === 'red'
                          ? 'border-red-200 bg-red-50'
                          : flag.severity === 'amber'
                          ? 'border-amber-200 bg-amber-50'
                          : 'border-emerald-200 bg-emerald-50'
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${sev.badge}`}>
                          {sev.label}
                        </span>
                        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-600">
                          {CATEGORY_LABEL[flag.category] ?? flag.category}
                        </span>
                        {flag.requires_owner_action && (
                          <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs font-medium text-white">
                            Action Required
                          </span>
                        )}
                      </div>
                      <p className="mt-2 font-medium text-slate-900">{flag.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{flag.description}</p>
                      {flag.amount_zar != null && (
                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          Amount: R {flag.amount_zar.toLocaleString('en-ZA')}
                        </p>
                      )}
                      {flag.due_date && (
                        <p className="mt-0.5 text-xs text-slate-500">Due: {flag.due_date}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Save form */}
          <div className="card p-6">
            <h2 className="mb-4 font-semibold text-slate-900">3. Save document</h2>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-slate-700">Document title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
                placeholder="e.g. AGM Minutes – March 2025"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="btn-primary w-full disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save Document'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
