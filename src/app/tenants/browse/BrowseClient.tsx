'use client'
import { useState, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FilterState {
  province: string
  budgetMin: number   // Rand (not cents)
  budgetMax: number
  moveInFrom: string  // YYYY-MM-DD
  moveInTo: string
  leaseMonths: number[]
  employment: string[]
  sort: string        // 'match' | 'income' | 'date'
  sortProperty: string // property_id for match sort
}

interface Props {
  initial: FilterState
  properties: Array<{ id: string; name: string }>
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SA_PROVINCES = [
  'Western Cape',
  'Eastern Cape',
  'Northern Cape',
  'KwaZulu-Natal',
  'Gauteng',
  'Mpumalanga',
  'Limpopo',
  'North West',
  'Free State',
]

const EMPLOYMENT_OPTIONS = [
  { value: 'employed',      label: 'Employed' },
  { value: 'self_employed', label: 'Self-employed' },
  { value: 'student',       label: 'Student' },
  { value: 'other',         label: 'Other' },
]

const LEASE_OPTIONS = [
  { value: 6,  label: '6 months' },
  { value: 12, label: '12 months' },
  { value: 24, label: '24 months' },
]

const SORT_OPTIONS = [
  { value: 'match',  label: 'Highest match score' },
  { value: 'income', label: 'Highest affordability' },
  { value: 'date',   label: 'Earliest move-in date' },
]

const BUDGET_MIN = 3_000
const BUDGET_MAX = 50_000

// ─── Budget slider ────────────────────────────────────────────────────────────

function BudgetSlider({
  min,
  max,
  onChange,
}: {
  min: number
  max: number
  onChange: (min: number, max: number) => void
}) {
  function fmtK(v: number) {
    return v >= 1000 ? `R${(v / 1000).toFixed(0)}k` : `R${v}`
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
          <span>Min budget</span>
          <span className="font-semibold text-slate-700">{fmtK(min)}</span>
        </div>
        <input
          type="range"
          min={BUDGET_MIN}
          max={BUDGET_MAX}
          step={500}
          value={min}
          onChange={(e) => {
            const v = Math.min(Number(e.target.value), max - 500)
            onChange(v, max)
          }}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-900"
        />
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
          <span>Max budget</span>
          <span className="font-semibold text-slate-700">
            {max >= BUDGET_MAX ? `R${(BUDGET_MAX / 1000).toFixed(0)}k+` : fmtK(max)}
          </span>
        </div>
        <input
          type="range"
          min={BUDGET_MIN}
          max={BUDGET_MAX}
          step={500}
          value={max}
          onChange={(e) => {
            const v = Math.max(Number(e.target.value), min + 500)
            onChange(min, v)
          }}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-900"
        />
      </div>
      {/* Track fill visualisation */}
      <div className="relative h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className="absolute h-full bg-slate-900"
          style={{
            left:  `${((min - BUDGET_MIN) / (BUDGET_MAX - BUDGET_MIN)) * 100}%`,
            right: `${100 - ((max - BUDGET_MIN) / (BUDGET_MAX - BUDGET_MIN)) * 100}%`,
          }}
        />
      </div>
    </div>
  )
}

// ─── Multi-select checkbox group ──────────────────────────────────────────────

function CheckGroup<T extends string | number>({
  options,
  selected,
  onChange,
}: {
  options: { value: T; label: string }[]
  selected: T[]
  onChange: (next: T[]) => void
}) {
  function toggle(v: T) {
    if (selected.includes(v)) onChange(selected.filter((x) => x !== v))
    else onChange([...selected, v])
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(({ value, label }) => {
        const active = selected.includes(value)
        return (
          <button
            key={String(value)}
            type="button"
            onClick={() => toggle(value)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              active
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Section label ────────────────────────────────────────────────────────────

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      {children}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BrowseFilters({ initial, properties }: Props) {
  const router      = useRouter()
  const pathname    = usePathname()
  const [, startT]  = useTransition()
  const [open, setOpen] = useState(false) // mobile panel toggle

  // Local state for smooth slider UX — synced to URL on change
  const [filters, setFilters] = useState<FilterState>(initial)

  function push(next: FilterState) {
    setFilters(next)
    const p = new URLSearchParams()
    if (next.province)                      p.set('province', next.province)
    if (next.budgetMin > BUDGET_MIN)        p.set('bmin', String(next.budgetMin))
    if (next.budgetMax < BUDGET_MAX)        p.set('bmax', String(next.budgetMax))
    if (next.moveInFrom)                    p.set('from', next.moveInFrom)
    if (next.moveInTo)                      p.set('to', next.moveInTo)
    if (next.leaseMonths.length)            p.set('lease', next.leaseMonths.join(','))
    if (next.employment.length)             p.set('emp', next.employment.join(','))
    if (next.sort && next.sort !== 'date')  p.set('sort', next.sort)
    if (next.sortProperty)                  p.set('sprop', next.sortProperty)
    startT(() => router.push(`${pathname}?${p.toString()}`))
  }

  function set<K extends keyof FilterState>(key: K, val: FilterState[K]) {
    push({ ...filters, [key]: val })
  }

  function reset() {
    push({
      province: '', budgetMin: BUDGET_MIN, budgetMax: BUDGET_MAX,
      moveInFrom: '', moveInTo: '', leaseMonths: [], employment: [],
      sort: 'date', sortProperty: '',
    })
  }

  const hasFilters =
    filters.province ||
    filters.budgetMin > BUDGET_MIN ||
    filters.budgetMax < BUDGET_MAX ||
    filters.moveInFrom ||
    filters.moveInTo ||
    filters.leaseMonths.length > 0 ||
    filters.employment.length > 0

  const sidebar = (
    <div className="space-y-6">
      {/* Sort */}
      <FilterSection label="Sort by">
        <div className="space-y-1">
          {SORT_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => set('sort', value)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                filters.sort === value
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  filters.sort === value ? 'bg-white' : 'bg-slate-300'
                }`}
              />
              {label}
            </button>
          ))}
        </div>

        {/* Property selector for match sort */}
        {filters.sort === 'match' && (
          <div className="mt-2">
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Score against property
            </label>
            <select
              value={filters.sortProperty}
              onChange={(e) => set('sortProperty', e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="">— Select a property —</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </FilterSection>

      <div className="border-t border-slate-100" />

      {/* Province */}
      <FilterSection label="Province">
        <select
          value={filters.province}
          onChange={(e) => set('province', e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
        >
          <option value="">All provinces</option>
          {SA_PROVINCES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </FilterSection>

      {/* Budget */}
      <FilterSection label="Budget range">
        <BudgetSlider
          min={filters.budgetMin}
          max={filters.budgetMax}
          onChange={(min, max) => push({ ...filters, budgetMin: min, budgetMax: max })}
        />
      </FilterSection>

      {/* Move-in dates */}
      <FilterSection label="Move-in window">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-xs text-slate-500">From</label>
            <input
              type="date"
              value={filters.moveInFrom}
              onChange={(e) => set('moveInFrom', e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">To</label>
            <input
              type="date"
              value={filters.moveInTo}
              onChange={(e) => set('moveInTo', e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>
      </FilterSection>

      {/* Lease length */}
      <FilterSection label="Lease length">
        <CheckGroup
          options={LEASE_OPTIONS}
          selected={filters.leaseMonths}
          onChange={(v) => set('leaseMonths', v as number[])}
        />
      </FilterSection>

      {/* Employment */}
      <FilterSection label="Employment status">
        <CheckGroup
          options={EMPLOYMENT_OPTIONS}
          selected={filters.employment}
          onChange={(v) => set('employment', v as string[])}
        />
      </FilterSection>

      {/* Reset */}
      {hasFilters && (
        <button
          type="button"
          onClick={reset}
          className="w-full rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
        >
          Clear all filters
        </button>
      )}
    </div>
  )

  return (
    <>
      {/* Mobile toggle button */}
      <div className="mb-4 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen((x) => !x)}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"
            />
          </svg>
          Filters
          {hasFilters && (
            <span className="rounded-full bg-slate-900 px-1.5 py-0.5 text-xs font-bold text-white">
              {[
                filters.province,
                filters.budgetMin > BUDGET_MIN || filters.budgetMax < BUDGET_MAX,
                filters.moveInFrom,
                filters.moveInTo,
                ...filters.leaseMonths,
                ...filters.employment,
              ].filter(Boolean).length}
            </span>
          )}
        </button>

        {open && (
          <div className="mt-3 rounded-xl border border-slate-200 bg-white p-5 shadow-lg">
            {sidebar}
          </div>
        )}
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          {sidebar}
        </div>
      </aside>
    </>
  )
}
