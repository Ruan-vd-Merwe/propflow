'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const PROVINCES = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
  'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape',
]

type Profile = {
  id: string
  full_name: string
  email: string
  is_landlord: boolean
  is_tenant: boolean
  phone: string | null
  province: string | null
  city: string | null
}

export default function SettingsPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [profile,  setProfile]  = useState<Profile | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [toast,    setToast]    = useState<string | null>(null)
  const [error,    setError]    = useState<string | null>(null)

  // Add-landlord mini form
  const [showLandlordForm, setShowLandlordForm] = useState(false)
  const [province,         setProvince]         = useState('')
  const [city,             setCity]             = useState('')

  // Add-tenant redirect
  const [addingTenant, setAddingTenant] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data as Profile)
      setLoading(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function addLandlordRole() {
    if (!profile) return
    setSaving(true)
    setError(null)
    const { error: err } = await supabase
      .from('profiles')
      .update({ is_landlord: true, user_type: 'landlord', province: province || null, city: city || null })
      .eq('id', profile.id)
    if (err) { setError(err.message); setSaving(false); return }
    setProfile(p => p ? { ...p, is_landlord: true } : p)
    setShowLandlordForm(false)
    setSaving(false)
    showToast('Landlord role added! Head to the dashboard to add your first property.')
  }

  async function addTenantRole() {
    if (!profile) return
    setAddingTenant(true)
    setError(null)
    // Create a minimal tenant_profiles row if not exists
    const { data: existing } = await supabase
      .from('tenant_profiles').select('id').eq('user_id', profile.id).single()
    if (!existing) {
      await supabase.from('tenant_profiles').insert({
        user_id:    profile.id,
        is_visible: true,
        budget_min: 300000, // R3 000 in cents
        budget_max: 1500000,
      })
    }
    await supabase.from('profiles').update({ is_tenant: true }).eq('id', profile.id)
    setAddingTenant(false)
    router.push('/tenant/profile')
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-700 border-t-transparent" />
      </div>
    )
  }

  if (!profile) return null

  const hasBoth   = profile.is_landlord && profile.is_tenant
  const roleLabel = hasBoth ? 'Landlord & Tenant' : profile.is_landlord ? 'Landlord' : 'Tenant'

  return (
    <div className="min-h-screen bg-slate-50">
      {toast && (
        <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
          <div className="rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-lg">
            ✓ {toast}
          </div>
        </div>
      )}

      {/* Minimal nav */}
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-900">← Dashboard</Link>
            <span className="text-slate-300">/</span>
            <span className="text-sm font-semibold text-slate-700">Settings</span>
          </div>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-700">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Account settings</h1>
          <p className="mt-1 text-sm text-slate-500">{profile.email}</p>
        </div>

        {/* Current roles card */}
        <div className="card p-6">
          <h2 className="mb-4 text-base font-bold text-slate-900">Your roles</h2>
          <div className="flex flex-wrap gap-3">
            {profile.is_landlord && (
              <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                <span className="text-xl">🏠</span>
                <div>
                  <p className="text-sm font-bold text-blue-900">Landlord</p>
                  <p className="text-xs text-blue-600">Manage properties &amp; tenants</p>
                </div>
              </div>
            )}
            {profile.is_tenant && (
              <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                <span className="text-xl">🔍</span>
                <div>
                  <p className="text-sm font-bold text-green-900">Tenant</p>
                  <p className="text-xs text-green-600">Find &amp; rent properties</p>
                </div>
              </div>
            )}
          </div>

          {hasBoth && (
            <p className="mt-4 text-sm text-slate-500">
              You have both roles active. Switch between them using the tab switcher on the{' '}
              <Link href="/dashboard" className="font-semibold text-blue-700 hover:underline">dashboard</Link>.
            </p>
          )}
        </div>

        {/* Add landlord role */}
        {!profile.is_landlord && (
          <div className="card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Add landlord role</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Manage properties, screen tenants and track payments — no agent needed.
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">Free</span>
            </div>

            {!showLandlordForm ? (
              <button onClick={() => setShowLandlordForm(true)}
                className="mt-4 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800">
                Add landlord role →
              </button>
            ) : (
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Province</label>
                    <select className="input-field" value={province} onChange={e => setProvince(e.target.value)}>
                      <option value="">Select…</option>
                      {PROVINCES.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">City</label>
                    <input className="input-field" placeholder="e.g. Cape Town"
                      value={city} onChange={e => setCity(e.target.value)} />
                  </div>
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex gap-2">
                  <button onClick={() => setShowLandlordForm(false)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
                    Cancel
                  </button>
                  <button onClick={addLandlordRole} disabled={saving}
                    className="rounded-xl bg-blue-700 px-5 py-2 text-sm font-bold text-white transition hover:bg-blue-800 disabled:opacity-50">
                    {saving ? 'Saving…' : 'Activate landlord role'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add tenant role */}
        {!profile.is_tenant && (
          <div className="card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Add tenant profile</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Get matched with verified properties and connect directly with landlords.
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">Always free</span>
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <button onClick={addTenantRole} disabled={addingTenant}
              className="mt-4 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-green-700 disabled:opacity-50">
              {addingTenant ? 'Setting up…' : 'Add tenant profile →'}
            </button>
          </div>
        )}

        {/* Profile info */}
        <div className="card p-6">
          <h2 className="mb-3 text-base font-bold text-slate-900">Account info</h2>
          <dl className="grid gap-3 sm:grid-cols-2">
            {[
              { label: 'Name',   value: profile.full_name },
              { label: 'Email',  value: profile.email },
              { label: 'Phone',  value: profile.phone ?? '—' },
              { label: 'Roles',  value: roleLabel },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg bg-slate-50 px-3 py-2.5">
                <p className="text-xs font-medium text-slate-400">{label}</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">{value}</p>
              </div>
            ))}
          </dl>
        </div>
      </main>
    </div>
  )
}
