'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PropertyComponent, ComponentTypeKey } from '@/lib/types'
import { COMPONENT_TYPES, getComponentHealth, componentStatusClass, componentStatusDot } from '@/lib/maintenance'

interface Props {
  propertyId:         string
  initialComponents:  PropertyComponent[]
}

interface FormState {
  component_type:     ComponentTypeKey
  name:               string
  installed_date:     string
  lifespan_min_years: string
  lifespan_max_years: string
  brand:              string
  model_number:       string
  notes:              string
  last_serviced_date: string
}

const DEFAULT_FORM: FormState = {
  component_type:     'geyser',
  name:               '',
  installed_date:     '',
  lifespan_min_years: '',
  lifespan_max_years: '',
  brand:              '',
  model_number:       '',
  notes:              '',
  last_serviced_date: '',
}

export function ComponentsPanel({ propertyId, initialComponents }: Props) {
  const router = useRouter()

  const [components, setComponents] = useState<PropertyComponent[]>(initialComponents)
  const [showForm,   setShowForm]   = useState(false)
  const [editId,     setEditId]     = useState<string | null>(null)
  const [form,       setForm]       = useState<FormState>(DEFAULT_FORM)
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')
  const [creatingJob, setCreatingJob] = useState<string | null>(null)

  function openAdd() {
    setEditId(null)
    const def = COMPONENT_TYPES['geyser']
    setForm({
      ...DEFAULT_FORM,
      lifespan_min_years: String(def.minYears),
      lifespan_max_years: String(def.maxYears),
    })
    setShowForm(true)
    setError('')
  }

  function openEdit(c: PropertyComponent) {
    setEditId(c.id)
    setForm({
      component_type:     c.component_type,
      name:               c.name,
      installed_date:     c.installed_date,
      lifespan_min_years: String(c.lifespan_min_years),
      lifespan_max_years: String(c.lifespan_max_years),
      brand:              c.brand ?? '',
      model_number:       c.model_number ?? '',
      notes:              c.notes ?? '',
      last_serviced_date: c.last_serviced_date ?? '',
    })
    setShowForm(true)
    setError('')
  }

  function handleTypeChange(type: ComponentTypeKey) {
    const def = COMPONENT_TYPES[type]
    setForm((f) => ({
      ...f,
      component_type:     type,
      lifespan_min_years: String(def.minYears),
      lifespan_max_years: String(def.maxYears),
    }))
  }

  async function handleSave() {
    if (!form.name.trim() || !form.installed_date) {
      setError('Name and installed date are required.')
      return
    }
    setSaving(true)
    setError('')

    const body = {
      property_id:        propertyId,
      component_type:     form.component_type,
      name:               form.name.trim(),
      installed_date:     form.installed_date,
      lifespan_min_years: parseInt(form.lifespan_min_years) || COMPONENT_TYPES[form.component_type].minYears,
      lifespan_max_years: parseInt(form.lifespan_max_years) || COMPONENT_TYPES[form.component_type].maxYears,
      brand:              form.brand.trim()              || null,
      model_number:       form.model_number.trim()       || null,
      notes:              form.notes.trim()              || null,
      last_serviced_date: form.last_serviced_date        || null,
    }

    try {
      if (editId) {
        const res  = await fetch(`/api/property-components/${editId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const json = await res.json()
        if (!res.ok) { setError(json.error ?? 'Failed to update'); return }
        setComponents((prev) =>
          prev.map((c) => (c.id === editId ? json.component : c))
        )
      } else {
        const res  = await fetch('/api/property-components', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const json = await res.json()
        if (!res.ok) { setError(json.error ?? 'Failed to create'); return }
        setComponents((prev) => [...prev, json.component])
      }

      setShowForm(false)
      setEditId(null)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this component? This cannot be undone.')) return
    const res = await fetch(`/api/property-components/${id}`, { method: 'DELETE' })
    if (res.ok) setComponents((prev) => prev.filter((c) => c.id !== id))
  }

  async function handleCreateJob(component: PropertyComponent) {
    setCreatingJob(component.id)
    const health = getComponentHealth(component.installed_date, component.lifespan_max_years)
    const title  = `${component.name} — ${health.status === 'red' ? 'Overdue replacement' : 'Approaching end of lifespan'}`

    const res  = await fetch('/api/maintenance-jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        property_id:  propertyId,
        component_id: component.id,
        title,
        urgency: health.status === 'red' ? 'urgent' : 'normal',
      }),
    })
    const json = await res.json()
    setCreatingJob(null)
    if (res.ok) {
      router.push(`/maintenance-jobs/${json.id}`)
    }
  }

  // Group by status for summary
  const red   = components.filter((c) => getComponentHealth(c.installed_date, c.lifespan_max_years).status === 'red')
  const amber = components.filter((c) => getComponentHealth(c.installed_date, c.lifespan_max_years).status === 'amber')
  const green = components.filter((c) => getComponentHealth(c.installed_date, c.lifespan_max_years).status === 'green')

  return (
    <div className="space-y-5">
      {/* Stats */}
      {components.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{red.length}</p>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Overdue</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{amber.length}</p>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Due Soon</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{green.length}</p>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Healthy</p>
          </div>
        </div>
      )}

      {/* Component list */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="font-semibold text-slate-900">
            Components
            <span className="ml-2 text-sm font-normal text-slate-400">{components.length}</span>
          </h2>
          <button onClick={openAdd} className="btn-primary text-sm">
            + Add Component
          </button>
        </div>

        {components.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-2xl">🔧</p>
            <p className="mt-2 font-semibold text-slate-700">No components tracked yet</p>
            <p className="mt-1 text-sm text-slate-400">
              Add geysers, roof, electrics, and other items to track their lifespan.
            </p>
          </div>
        ) : (
          <div>
            {components.map((c) => {
              const health    = getComponentHealth(c.installed_date, c.lifespan_max_years)
              const badgeCls  = componentStatusClass(health.status)
              const dotCls    = componentStatusDot(health.status)
              const typeLabel = COMPONENT_TYPES[c.component_type]?.label ?? c.component_type

              return (
                <div
                  key={c.id}
                  className="flex items-start gap-4 border-b border-slate-100 px-6 py-4 last:border-0"
                >
                  {/* Status dot */}
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center">
                    <span className={`h-3 w-3 rounded-full ${dotCls}`} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">{c.name}</p>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                        {typeLabel}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeCls}`}>
                        {health.label}
                      </span>
                    </div>

                    <p className="mt-0.5 text-xs text-slate-400">
                      Installed {c.installed_date}
                      {' · '}Max lifespan {c.lifespan_max_years}y
                      {c.brand ? ` · ${c.brand}` : ''}
                      {c.last_serviced_date ? ` · Last serviced ${c.last_serviced_date}` : ''}
                    </p>

                    {c.notes && (
                      <p className="mt-1 text-xs text-slate-500 italic">{c.notes}</p>
                    )}
                  </div>

                  <div className="flex shrink-0 gap-2">
                    {health.status !== 'green' && (
                      <button
                        onClick={() => handleCreateJob(c)}
                        disabled={creatingJob === c.id}
                        className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
                      >
                        {creatingJob === c.id ? '…' : 'Create Job'}
                      </button>
                    )}
                    <button
                      onClick={() => openEdit(c)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add / Edit form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="font-semibold text-slate-900">
                {editId ? 'Edit Component' : 'Add Component'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-slate-900"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-6">
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Component type</label>
                  <select
                    value={form.component_type}
                    onChange={(e) => handleTypeChange(e.target.value as ComponentTypeKey)}
                    className="input-field"
                  >
                    {Object.entries(COMPONENT_TYPES).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Name / description *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Main geyser, Kitchen roof section"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Installed date *</label>
                  <input
                    type="date"
                    value={form.installed_date}
                    onChange={(e) => setForm((f) => ({ ...f, installed_date: e.target.value }))}
                    className="input-field"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Min lifespan (years)</label>
                    <input
                      type="number"
                      min="1"
                      value={form.lifespan_min_years}
                      onChange={(e) => setForm((f) => ({ ...f, lifespan_min_years: e.target.value }))}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Max lifespan (years)</label>
                    <input
                      type="number"
                      min="1"
                      value={form.lifespan_max_years}
                      onChange={(e) => setForm((f) => ({ ...f, lifespan_max_years: e.target.value }))}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Brand</label>
                    <input
                      type="text"
                      value={form.brand}
                      onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                      placeholder="e.g. Kwikot"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Model number</label>
                    <input
                      type="text"
                      value={form.model_number}
                      onChange={(e) => setForm((f) => ({ ...f, model_number: e.target.value }))}
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Last serviced date</label>
                  <input
                    type="date"
                    value={form.last_serviced_date}
                    onChange={(e) => setForm((f) => ({ ...f, last_serviced_date: e.target.value }))}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
                  <textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    className="input-field"
                    placeholder="Any additional notes…"
                  />
                </div>

                {error && (
                  <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary disabled:opacity-60"
              >
                {saving ? 'Saving…' : editId ? 'Save changes' : 'Add component'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
