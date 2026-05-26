'use client'

import { useState, useRef, ChangeEvent } from 'react'
import { validateSAId } from '@/lib/id-validator'
import { calcRatioFlag } from '@/lib/credit-score'
import type { BankStatementAnalysis, IdVerification } from '@/lib/types'

type Step = 1 | 2 | 3

interface FormState {
  full_name: string
  email: string
  phone: string
  id_number: string
  monthly_income: string      // rand string
  // Step 2
  bankFile: File | null
  bankFilename: string
  bankAnalysis: BankStatementAnalysis | null
  bankParseError: string | null
  bankParsing: boolean
}

const EMPTY: FormState = {
  full_name: '',
  email: '',
  phone: '',
  id_number: '',
  monthly_income: '',
  bankFile: null,
  bankFilename: '',
  bankAnalysis: null,
  bankParseError: null,
  bankParsing: false,
}

function formatRand(cents: number) {
  return `R ${(cents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 0 })}`
}

export function ApplicationForm({ propertyId }: { propertyId: string }) {
  const [step, setStep]         = useState<Step>(1)
  const [form, setForm]         = useState<FormState>(EMPTY)
  const [submitting, setSubmit] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [requestedRent, setRequestedRent] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // ── Live ID validation ──────────────────────────────────────────────────────
  const idResult: IdVerification | null =
    form.id_number.replace(/\s/g, '').length === 13
      ? validateSAId(form.id_number)
      : null

  // ── Ratio calculation ───────────────────────────────────────────────────────
  const rentCents   = Math.round(parseFloat(requestedRent || '0') * 100)
  const incomeCents = Math.round(parseFloat(form.monthly_income || '0') * 100)
  const ratioResult =
    rentCents > 0 && incomeCents > 0 ? calcRatioFlag(rentCents, incomeCents) : null

  // ── Field helper ────────────────────────────────────────────────────────────
  function set(key: keyof FormState) {
    return (e: ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }))
  }

  // ── PDF upload & parse ──────────────────────────────────────────────────────
  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setForm((prev) => ({
      ...prev,
      bankFile:       file,
      bankFilename:   file.name,
      bankAnalysis:   null,
      bankParseError: null,
      bankParsing:    true,
    }))

    try {
      const fd = new FormData()
      fd.append('file', file)

      const res  = await fetch('/api/parse-bank-statement', { method: 'POST', body: fd })
      const json = await res.json()

      if (!res.ok || json.error) {
        setForm((prev) => ({
          ...prev,
          bankParsing:    false,
          bankParseError: json.error ?? 'Failed to parse statement',
        }))
        return
      }

      setForm((prev) => ({
        ...prev,
        bankParsing:  false,
        bankAnalysis: json.analysis as BankStatementAnalysis,
      }))
    } catch {
      setForm((prev) => ({
        ...prev,
        bankParsing:    false,
        bankParseError: 'Network error — please try again',
      }))
    }
  }

  // ── Step validation ─────────────────────────────────────────────────────────
  const step1Valid =
    form.full_name.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)

  const step2Valid =
    parseFloat(form.monthly_income || '0') > 0

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    setSubmit(true)
    setSubmitError(null)

    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id:               propertyId,
          full_name:                 form.full_name.trim(),
          email:                     form.email.trim(),
          phone:                     form.phone.trim() || undefined,
          id_number:                 form.id_number.trim() || undefined,
          monthly_income_cents:      Math.round(parseFloat(form.monthly_income) * 100),
          requested_rent_cents:      rentCents > 0 ? rentCents : undefined,
          bank_statement_filename:   form.bankFilename || undefined,
          bank_statement_analysis:   form.bankAnalysis ?? undefined,
        }),
      })

      const json = await res.json()

      if (!res.ok || json.error) {
        setSubmitError(json.error ?? 'Something went wrong')
        setSubmit(false)
        return
      }

      setSubmitted(true)
    } catch {
      setSubmitError('Network error — please try again')
      setSubmit(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="card p-10 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900">Application Submitted!</h2>
        <p className="mt-2 text-sm text-slate-500">
          Thank you, {form.full_name.split(' ')[0]}. The landlord will review your application
          and get in touch via {form.email}.
        </p>
      </div>
    )
  }

  // ── Step indicator ──────────────────────────────────────────────────────────
  const steps = ['Personal details', 'Financials', 'Review & submit']

  return (
    <div>
      {/* Progress */}
      <div className="mb-8 flex items-center gap-2">
        {steps.map((label, i) => {
          const n = (i + 1) as Step
          const active   = n === step
          const complete = n < step
          return (
            <div key={n} className="flex items-center gap-2">
              {i > 0 && <div className={`h-px w-8 ${complete ? 'bg-slate-900' : 'bg-slate-200'}`} />}
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold
                    ${active   ? 'bg-slate-900 text-white' :
                      complete ? 'bg-emerald-100 text-emerald-700' :
                                 'bg-slate-100 text-slate-400'}`}
                >
                  {complete ? '✓' : n}
                </div>
                <span className={`hidden text-sm sm:block ${active ? 'font-semibold text-slate-900' : 'text-slate-400'}`}>
                  {label}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Step 1: Personal details ──────────────────────────────────────── */}
      {step === 1 && (
        <div className="card p-6">
          <h2 className="mb-5 text-lg font-semibold text-slate-900">Personal Details</h2>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Full name <span className="text-red-500">*</span>
              </label>
              <input className="input-field" placeholder="Jane Dlamini"
                value={form.full_name} onChange={set('full_name')} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Email address <span className="text-red-500">*</span>
                </label>
                <input className="input-field" type="email" placeholder="jane@email.com"
                  value={form.email} onChange={set('email')} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
                <input className="input-field" type="tel" placeholder="071 234 5678"
                  value={form.phone} onChange={set('phone')} />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                SA ID Number
                <span className="ml-1 text-xs font-normal text-slate-400">(13 digits)</span>
              </label>
              <input
                className={`input-field ${
                  idResult
                    ? idResult.valid
                      ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500'
                      : 'border-red-400 focus:border-red-500 focus:ring-red-500'
                    : ''
                }`}
                placeholder="9001015009087"
                maxLength={13}
                value={form.id_number}
                onChange={set('id_number')}
              />

              {idResult && (
                <div className={`mt-2 rounded-lg p-3 text-sm ${idResult.valid ? 'bg-emerald-50' : 'bg-red-50'}`}>
                  {idResult.valid ? (
                    <div className="space-y-0.5 text-emerald-700">
                      <p className="font-medium">✓ Valid ID number</p>
                      <p>DOB: {idResult.dob} · Age: {idResult.ageInYears} · {idResult.gender} · {
                        idResult.citizenType === 'citizen' ? 'SA Citizen' : 'Permanent Resident'
                      }</p>
                    </div>
                  ) : (
                    <div className="text-red-700">
                      <p className="font-medium">ID issues:</p>
                      <ul className="mt-1 list-inside list-disc space-y-0.5">
                        {idResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              className="btn-primary w-auto px-6"
              disabled={!step1Valid}
              onClick={() => setStep(2)}
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Financials ────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="card p-6">
          <h2 className="mb-5 text-lg font-semibold text-slate-900">Financial Details</h2>

          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Net monthly income (R) <span className="text-red-500">*</span>
                </label>
                <input className="input-field" type="number" min="0" step="100"
                  placeholder="15000"
                  value={form.monthly_income} onChange={set('monthly_income')} />
                <p className="mt-1 text-xs text-slate-400">After tax and deductions</p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Requested monthly rent (R)
                </label>
                <input className="input-field" type="number" min="0" step="100"
                  placeholder="6000"
                  value={requestedRent}
                  onChange={(e) => setRequestedRent(e.target.value)} />
              </div>
            </div>

            {/* Ratio indicator */}
            {ratioResult && (
              <div className={`rounded-lg border p-3 ${
                ratioResult.flag === 'green' ? 'border-emerald-200 bg-emerald-50' :
                ratioResult.flag === 'amber' ? 'border-amber-200 bg-amber-50' :
                                               'border-red-200 bg-red-50'
              }`}>
                <p className={`text-sm font-semibold ${
                  ratioResult.flag === 'green' ? 'text-emerald-700' :
                  ratioResult.flag === 'amber' ? 'text-amber-700' : 'text-red-700'
                }`}>
                  Rent-to-income: {ratioResult.percent.toFixed(1)}%
                  {ratioResult.flag === 'green' && ' ✓ Good'}
                  {ratioResult.flag === 'amber' && ' ⚠ Borderline'}
                  {ratioResult.flag === 'red'   && ' ✗ Exceeds 33%'}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Guideline: rent should not exceed 30% of net monthly income
                </p>
              </div>
            )}

            {/* Bank statement upload */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Bank Statement (PDF)
                <span className="ml-1 text-xs font-normal text-slate-400">
                  — FNB, Standard Bank, Nedbank, ABSA or Capitec, last 3–6 months
                </span>
              </label>

              <div
                className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition hover:border-slate-400"
                onClick={() => fileRef.current?.click()}
              >
                <svg className="mb-2 h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm font-medium text-slate-700">
                  {form.bankFilename || 'Click to upload PDF'}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">Max 10 MB · Digital statements only</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {/* Parsing spinner */}
              {form.bankParsing && (
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                  Analysing statement…
                </div>
              )}

              {/* Parse error */}
              {form.bankParseError && (
                <p className="mt-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {form.bankParseError}
                </p>
              )}

              {/* Parsed summary */}
              {form.bankAnalysis && <BankSummaryCard analysis={form.bankAnalysis} />}
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            <button
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
              onClick={() => setStep(1)}
            >
              ← Back
            </button>
            <button
              className="btn-primary w-auto px-6"
              disabled={!step2Valid}
              onClick={() => setStep(3)}
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Review & submit ───────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="card p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Review Your Application</h2>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <ReviewRow label="Name"       value={form.full_name} />
              <ReviewRow label="Email"      value={form.email} />
              {form.phone && <ReviewRow label="Phone" value={form.phone} />}
              {form.id_number && (
                <ReviewRow
                  label="ID Number"
                  value={`${form.id_number} ${idResult?.valid ? '✓' : '⚠'}`}
                />
              )}
              <ReviewRow
                label="Monthly income"
                value={formatRand(Math.round(parseFloat(form.monthly_income || '0') * 100))}
              />
              {requestedRent && (
                <ReviewRow
                  label="Requested rent"
                  value={formatRand(rentCents)}
                />
              )}
              {ratioResult && (
                <ReviewRow
                  label="Rent-to-income"
                  value={`${ratioResult.percent.toFixed(1)}% (${ratioResult.flag})`}
                />
              )}
              {form.bankFilename && (
                <ReviewRow label="Bank statement" value={form.bankFilename} />
              )}
              {form.bankAnalysis?.bank && (
                <ReviewRow label="Detected bank" value={form.bankAnalysis.bank} />
              )}
            </dl>
          </div>

          {submitError && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{submitError}</div>
          )}

          <div className="flex justify-between">
            <button
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
              onClick={() => setStep(2)}
            >
              ← Back
            </button>
            <button
              className="btn-primary w-auto px-8"
              disabled={submitting}
              onClick={handleSubmit}
            >
              {submitting ? 'Submitting…' : 'Submit Application'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="font-medium text-slate-500">{label}</dt>
      <dd className="text-slate-900">{value}</dd>
    </>
  )
}

function BankSummaryCard({ analysis }: { analysis: BankStatementAnalysis }) {
  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">
          {analysis.bank ? `${analysis.bank} Statement Parsed` : 'Statement Parsed'}
        </p>
        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
          ✓ Analysed
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <Stat label="Avg income/mo"  value={analysis.avgMonthlyIncome   > 0 ? formatRand(analysis.avgMonthlyIncome)   : '—'} />
        <Stat label="Avg expenses/mo" value={analysis.avgMonthlyExpenses > 0 ? formatRand(analysis.avgMonthlyExpenses) : '—'} />
        <Stat label="Avg balance"    value={analysis.avgMonthlyBalance   > 0 ? formatRand(analysis.avgMonthlyBalance)  : '—'} />
        <Stat label="Salary months"  value={`${analysis.salaryMonths} / ${analysis.totalMonthsAnalyzed}`} />
      </div>

      {(analysis.bouncedDos.length > 0 || analysis.gamblingTransactions.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {analysis.bouncedDos.length > 0 && (
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
              {analysis.bouncedDos.length} bounced debit order{analysis.bouncedDos.length > 1 ? 's' : ''}
            </span>
          )}
          {analysis.gamblingTransactions.length > 0 && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
              {analysis.gamblingTransactions.length} gambling transaction{analysis.gamblingTransactions.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {analysis.parseWarnings.length > 0 && (
        <p className="mt-2 text-xs text-amber-600">
          ⚠ {analysis.parseWarnings[0]}
        </p>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="font-semibold text-slate-800">{value}</p>
    </div>
  )
}
