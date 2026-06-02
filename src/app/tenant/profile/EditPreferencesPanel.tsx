'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { TenantProfile } from '@/lib/types'

const PROVINCES = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
  'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape',
]
const LEASE_OPTS = [6, 12, 24]
const EMPLOYMENT_OPTS = [
  { value: 'employed',      label: 'Employed' },
  { value: 'self_employed', label: 'Self-employed' },
  { value: 'student',       label: 'Student' },
  { value: 'other',         label: 'Other' },
] as const

interface Props {
  tenantProfile: TenantProfile
  userId: string
  label?: string
}

export function EditPreferencesPanel({ tenantProfile, userId, label = 'Edit preferences' }: Props) {
  const router   = useRouter()
  const supabase = createClient()

  const [open,    setOpen]    = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [toast,   setToast]   = useState(false)

  // ── Form state — initialised from profile ─────────────────────────────────
  const [area,     setArea]     = useState(tenantProfile.looking_in_area     ?? '')
  const [province, setProvince] = useState(tenantProfile.looking_in_province ?? '')
  const [budgetMin, setBudgetMin] = useState(Math.round((tenantProfile.budget_min ?? 300000) / 100))
  const [budgetMax, setBudgetMax] = useState(Math.round((tenantProfile.budget_max ?? 1500000) / 100))
  const [moveIn,   setMoveIn]   = useState(tenantProfile.move_in_date        ?? '')
  const [lease,    setLease]    = useState(tenantProfile.lease_length_months ?? 12)
  const [empStatus, setEmpStatus] = useState(tenantProfile.employment_status ?? '')
  const [income,   setIncome]   = useState(
    tenantProfile.monthly_income ? String(Math.round(tenantProfile.monthly_income / 100)) : ''
  )
  const [visible,  setVisible]  = useState(tenantProfile.is_visible)

  function openPanel() {
    // Re-sync form with latest saved values each time we open
    setArea(tenantProfile.looking_in_area ?? '')
    setProvince(tenantProfile.looking_in_province ?? '')
    setBudgetMin(Math.round((tenantProfile.budget_min ?? 300000) / 100))
    setBudgetMax(Math.round((tenantProfile.budget_max ?? 1500000) / 100))
    setMoveIn(tenantProfile.move_in_date ?? '')
    setLease(tenantProfile.lease_length_months ?? 12)
    setEmpStatus(tenantProfile.employment_status ?? '')
    setIncome(tenantProfile.monthly_income ? String(Math.round(tenantProfile.monthly_income / 100)) : '')
    setVisible(tenantProfile.is_visible)
    setOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase
      .from('tenant_profiles')
      .update({
        looking_in_area:      area     || null,
        looking_in_province:  province || null,
        budget_min:           budgetMin * 100,
        budget_max:           budgetMax * 100,
        move_in_date:         moveIn   || null,
        lease_length_months:  lease,
        employment_status:    empStatus || null,
        monthly_income:       income ? parseInt(income) * 100 : null,
        is_visible:           visible,
        updated_at:           new Date().toISOString(),
      })
      .eq('user_id', userId)

    setSaving(false)
    if (error) { console.error(error); return }

    setOpen(false)
    setToast(true)
    setTimeout(() => setToast(false), 3000)
    router.refresh()
  }

  return (
    <>
      {/* ── Trigger button ─────────────────────────────────────────────────── */}
      <button
        onClick={openPanel}
        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-700"
      >
        {label}
      </button>

      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed inset-x-0 top-4 z-[60] flex justify-center px-4">
          <div className="rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-lg">
            ✓ Preferences updated
          </div>
        </div>
      )}

      {/* ── Backdrop ───────────────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Slide-over panel ───────────────────────────────────────────────── */}
      <div className={`fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-white shadow-2xl transition-transform duration-300 ease-out sm:max-w-md ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">Edit preferences</h2>
          <button
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable form body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="space-y-6">

            {/* 1. Where looking */}
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">Where are you looking to rent?</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Area / suburb</label>
                  <input
                    className="input-field"
                    placeholder="e.g. Sea Point"
                    value={area}
                    onChange={e => setArea(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Province</label>
                  <select className="input-field" value={province} onChange={e => setProvince(e.target.value)}>
                    <option value="">Select…</option>
                    {PROVINCES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Budget */}
            <div>
              <label className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">
                Monthly budget
                <span className="font-normal text-slate-500">
                  R{budgetMin.toLocaleString()} – R{budgetMax.toLocaleString()}/mo
                </span>
              </label>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="w-7 text-xs text-slate-400">Min</span>
                  <input
                    type="range" min={3000} max={50000} step={500}
                    value={budgetMin}
                    onChange={e => setBudgetMin(Math.min(parseInt(e.target.value), budgetMax - 500))}
                    className="flex-1 accent-blue-700"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-7 text-xs text-slate-400">Max</span>
                  <input
                    type="range" min={3000} max={50000} step={500}
                    value={budgetMax}
                    onChange={e => setBudgetMax(Math.max(parseInt(e.target.value), budgetMin + 500))}
                    className="flex-1 accent-blue-700"
                  />
                </div>
              </div>
            </div>

            {/* 3. Move-in date */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                When do you need to move in?
              </label>
              <input
                type="date"
                className="input-field"
                value={moveIn}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setMoveIn(e.target.value)}
              />
            </div>

            {/* 4. Lease length */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Ideal lease length</label>
              <div className="flex gap-2">
                {LEASE_OPTS.map(l => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLease(l)}
                    className={`flex-1 rounded-lg border py-2 text-sm font-medium transition ${
                      lease === l
                        ? 'border-blue-700 bg-blue-700 text-white'
                        : 'border-slate-200 text-slate-600 hover:border-slate-400'
                    }`}
                  >
                    {l} mo
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Employment status */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Employment status</label>
              <div className="grid grid-cols-2 gap-2">
                {EMPLOYMENT_OPTS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setEmpStatus(opt.value)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      empStatus === opt.value
                        ? 'border-blue-700 bg-blue-700 text-white'
                        : 'border-slate-200 text-slate-600 hover:border-slate-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 6. Monthly income */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Monthly net income
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">R</span>
                <input
                  type="number"
                  className="input-field pl-7"
                  placeholder="e.g. 25 000"
                  min={0}
                  value={income}
                  onChange={e => setIncome(e.target.value)}
                />
              </div>
              {income && parseInt(income) > 0 && (
                <p className="mt-1 text-xs text-slate-400">
                  Affordable rent: up to{' '}
                  <strong className="text-slate-600">
                    R{Math.round(parseInt(income) / 3).toLocaleString()}
                  </strong>
                  /mo (30% rule)
                </p>
              )}
            </div>

            {/* 7. Actively looking toggle */}
            <div>
              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-4 transition hover:border-slate-300">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Show my profile to landlords</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Landlords can see and contact you when actively looking
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={visible}
                  onClick={() => setVisible(v => !v)}
                  className={`relative ml-4 h-6 w-11 shrink-0 rounded-full transition-colors ${
                    visible ? 'bg-blue-700' : 'bg-slate-200'
                  }`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    visible ? 'translate-x-5' : 'translate-x-0.5'
                  }`} />
                </button>
              </label>
            </div>

          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t border-slate-100 px-5 py-4 flex gap-3">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="flex-[2] rounded-xl bg-blue-700 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save preferences'}
          </button>
        </div>
      </div>
    </>
  )
}
