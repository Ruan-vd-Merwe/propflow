'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const PROVINCES = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
  'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape',
]

const PROPERTY_TYPES = [
  { value: 'apartment',  label: 'Apartment', icon: '🏢' },
  { value: 'house',      label: 'House',     icon: '🏠' },
  { value: 'townhouse',  label: 'Townhouse', icon: '🏘️' },
  { value: 'room',       label: 'Room',      icon: '🛏️' },
]

type OnboardStep = 'property' | 'tenants' | 'done'

function OnboardingProgress({ step }: { step: OnboardStep }) {
  const steps = [
    { label: 'Create account', done: true },
    { label: 'Add your property', done: step !== 'property', current: step === 'property' },
    { label: 'Add your tenants', done: step === 'done', current: step === 'tenants' },
  ]
  return (
    <div className="mb-8 flex items-start justify-center gap-0">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center">
          {i > 0 && (
            <div className={`mx-1 mt-4 h-0.5 w-10 shrink-0 sm:w-16 ${s.done || (i === 1 && step !== 'property') ? 'bg-slate-900' : 'bg-slate-200'}`} />
          )}
          <div className="flex flex-col items-center gap-1.5">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
              s.done    ? 'bg-green-600 text-white' :
              s.current ? 'bg-slate-900 text-white' :
                          'bg-slate-200 text-slate-400'
            }`}>
              {s.done ? '✓' : i + 1}
            </div>
            <span className={`max-w-[80px] text-center text-xs leading-tight ${
              s.current ? 'font-semibold text-slate-900' : s.done ? 'text-slate-500' : 'text-slate-300'
            }`}>
              {s.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

interface TenantRow {
  full_name: string
  email: string
  phone: string
  monthly_rent: string
  lease_start: string
  lease_end: string
  payment_status: 'paid' | 'unpaid'
}

function emptyTenant(): TenantRow {
  return { full_name: '', email: '', phone: '', monthly_rent: '', lease_start: '', lease_end: '', payment_status: 'paid' }
}

export default function OnboardingPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [isWelcome, setIsWelcome] = useState(false)
  useEffect(() => {
    setIsWelcome(new URLSearchParams(window.location.search).get('welcome') === '1')
  }, [])

  const [step,    setStep]    = useState<OnboardStep>('property')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [propertyId, setPropertyId] = useState<string | null>(null)

  // ── Property fields ────────────────────────────────────────────────────────
  const [name,          setName]         = useState('')
  const [address,       setAddress]      = useState('')
  const [suburb,        setSuburb]       = useState('')
  const [province,      setProvince]     = useState('')
  const [propertyType,  setPropertyType] = useState('')
  const [bedrooms,      setBedrooms]     = useState('')
  const [askingRent,    setAskingRent]   = useState('')
  const [availableFrom, setAvailableFrom] = useState('')
  const [description,   setDescription] = useState('')
  const [isListed,      setIsListed]     = useState(false)
  const [photos,        setPhotos]       = useState<File[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  // ── Tenant rows ────────────────────────────────────────────────────────────
  const [tenantRows,    setTenantRows]   = useState<TenantRow[]>([emptyTenant()])
  const [addTenants,    setAddTenants]   = useState(false)

  // ── Photo helpers ──────────────────────────────────────────────────────────
  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    setPhotos(prev => [...prev, ...files].slice(0, 6))
  }
  function removePhoto(i: number) {
    setPhotos(prev => prev.filter((_, idx) => idx !== i))
  }

  async function uploadPhotos(propId: string): Promise<string[]> {
    const urls: string[] = []
    for (const file of photos) {
      const path = `${propId}/${Date.now()}-${file.name}`
      const { error: upErr } = await supabase.storage
        .from('property-photos')
        .upload(path, file, { upsert: true })
      if (!upErr) {
        const { data } = supabase.storage.from('property-photos').getPublicUrl(path)
        urls.push(data.publicUrl)
      }
    }
    return urls
  }

  // ── Submit property ────────────────────────────────────────────────────────
  async function handlePropertySubmit() {
    if (!name.trim() || !address.trim()) {
      setError('Property name and address are required.')
      return
    }

    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // Create property first to get an ID for photo paths
    const { data: prop, error: propError } = await supabase
      .from('properties')
      .insert({
        owner_id:     user.id,
        name:         name.trim(),
        address:      address.trim(),
        suburb:       suburb || null,
        province:     province || null,
        property_type: propertyType || null,
        bedrooms:     bedrooms ? parseInt(bedrooms) : null,
        asking_rent:  askingRent ? Math.round(parseFloat(askingRent) * 100) : null,
        available_from: availableFrom || null,
        description:  description || null,
        is_listed:    isListed,
        photos:       [],
      })
      .select()
      .single()

    if (propError || !prop) {
      setError(propError?.message ?? 'Failed to create property')
      setLoading(false)
      return
    }

    // Upload photos if any
    if (photos.length > 0) {
      const photoUrls = await uploadPhotos(prop.id)
      if (photoUrls.length > 0) {
        await supabase.from('properties').update({ photos: photoUrls }).eq('id', prop.id)
      }
    }

    setPropertyId(prop.id)
    setLoading(false)
    setStep('tenants')
  }

  // ── Submit tenants ─────────────────────────────────────────────────────────
  async function handleTenantsSubmit() {
    if (!propertyId) return
    setLoading(true)
    setError(null)

    const validRows = tenantRows.filter(r => r.full_name.trim() && r.email.trim() && r.lease_start && r.monthly_rent)

    if (validRows.length === 0) {
      setStep('done')
      setLoading(false)
      return
    }

    const today = new Date().toISOString().split('T')[0]

    const inserts = validRows.map(r => ({
      property_id:  propertyId,
      full_name:    r.full_name.trim(),
      email:        r.email.trim(),
      phone:        r.phone || null,
      monthly_rent: Math.round(parseFloat(r.monthly_rent) * 100),
      lease_start:  r.lease_start,
      lease_end:    r.lease_end || null,
    }))

    const { data: inserted, error: tErr } = await supabase
      .from('tenants')
      .insert(inserts)
      .select()

    if (tErr) {
      setError(tErr.message)
      setLoading(false)
      return
    }

    // Add a payment record for the current month based on status
    if (inserted && inserted.length > 0) {
      const paymentInserts = inserted.map((t, i) => ({
        tenant_id: t.id,
        amount:    inserts[i].monthly_rent,
        due_date:  today,
        paid_date: validRows[i].payment_status === 'paid' ? today : null,
        status:    validRows[i].payment_status === 'paid' ? 'paid' : 'missed',
      }))
      await supabase.from('payments').insert(paymentInserts)
    }

    setStep('done')
    setLoading(false)
  }

  // ── Step: Property form ────────────────────────────────────────────────────
  if (step === 'property') {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-xl">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            {isWelcome ? (
              <>
                <h1 className="text-2xl font-bold text-slate-900">Welcome to PropFlow!</h1>
                <p className="mt-2 text-slate-500">Account created. Now let&apos;s add your first property.</p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-slate-900">Add your first property</h1>
                <p className="mt-2 text-slate-500">Let&apos;s get your property set up</p>
              </>
            )}
          </div>

          <OnboardingProgress step="property" />

          <div className="card p-6">
            <div className="space-y-5">
              {/* Name + address */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Property name</label>
                <input className="input-field" placeholder='e.g. "Unit 4B, Kloof Street"'
                  value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Full address</label>
                <input className="input-field" placeholder="12 Kloof Street, Gardens, Cape Town, 8001"
                  value={address} onChange={e => setAddress(e.target.value)} />
              </div>

              {/* Location */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Suburb</label>
                  <input className="input-field" placeholder="e.g. Sea Point"
                    value={suburb} onChange={e => setSuburb(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Province</label>
                  <select className="input-field" value={province} onChange={e => setProvince(e.target.value)}>
                    <option value="">Select…</option>
                    {PROVINCES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              {/* Property type */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Property type</label>
                <div className="grid grid-cols-4 gap-2">
                  {PROPERTY_TYPES.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setPropertyType(t.value)}
                      className={`flex flex-col items-center gap-1 rounded-xl border py-3 text-xs font-medium transition ${
                        propertyType === t.value
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 text-slate-600 hover:border-slate-400'
                      }`}
                    >
                      <span className="text-xl">{t.icon}</span>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bedrooms + rent */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Bedrooms</label>
                  <select className="input-field" value={bedrooms} onChange={e => setBedrooms(e.target.value)}>
                    <option value="">Select…</option>
                    {[0, 1, 2, 3, 4, 5, 6].map(n => (
                      <option key={n} value={n}>{n === 0 ? 'Studio / bachelors' : `${n} bedroom${n > 1 ? 's' : ''}`}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Asking rent / month</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">R</span>
                    <input type="number" className="input-field pl-7" placeholder="12000" min={0}
                      value={askingRent} onChange={e => setAskingRent(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Available from */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Available from</label>
                <input type="date" className="input-field" value={availableFrom}
                  onChange={e => setAvailableFrom(e.target.value)} />
              </div>

              {/* Description */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Description <span className="text-slate-400">(optional)</span>
                </label>
                <textarea className="input-field min-h-[80px] resize-y" placeholder="Describe the property…"
                  value={description} onChange={e => setDescription(e.target.value)} />
              </div>

              {/* Photos */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Photos <span className="text-slate-400">(up to 6, optional)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {photos.map((f, i) => (
                    <div key={i} className="group relative h-20 w-20 overflow-hidden rounded-lg border border-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100"
                      >
                        <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  {photos.length < 6 && (
                    <button type="button" onClick={() => fileRef.current?.click()}
                      className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-200 text-xs text-slate-400 transition hover:border-slate-400 hover:text-slate-600">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                      </svg>
                      Add
                    </button>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
                  onChange={handlePhotoSelect} />
              </div>

              {/* List on marketplace */}
              <div className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
                <input
                  type="checkbox"
                  id="is_listed"
                  checked={isListed}
                  onChange={e => setIsListed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-slate-900"
                />
                <label htmlFor="is_listed">
                  <p className="text-sm font-medium text-slate-900">List on tenant marketplace</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Allow matched tenants to see this property and request introductions
                  </p>
                </label>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</div>
            )}

            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                disabled={loading || !name.trim() || !address.trim()}
                onClick={handlePropertySubmit}
                className="btn-primary"
              >
                {loading ? 'Saving property…' : 'Save property & continue →'}
              </button>
              <Link href="/dashboard"
                className="text-center text-sm font-medium text-slate-500 hover:text-slate-700">
                Skip for now — go to dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Step: Add existing tenants ─────────────────────────────────────────────
  if (step === 'tenants') {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-2xl">
          <OnboardingProgress step="tenants" />

          <div className="mb-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-green-600">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Property added!</h1>
            <p className="mt-2 text-slate-500">
              Do you already have tenants in this property? Add them now to start tracking payments.
            </p>
          </div>

          {!addTenants ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <button
                onClick={() => setAddTenants(true)}
                className="card flex flex-col items-center gap-3 p-6 text-center transition hover:border-slate-400 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                  <svg className="h-6 w-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Yes, add existing tenants</p>
                  <p className="mt-1 text-sm text-slate-500">Import your current tenants and payment history</p>
                </div>
              </button>

              <button
                onClick={() => router.push('/dashboard')}
                className="card flex flex-col items-center gap-3 p-6 text-center transition hover:border-slate-400 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                  <svg className="h-6 w-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">No, go to dashboard</p>
                  <p className="mt-1 text-sm text-slate-500">You can add tenants from the dashboard later</p>
                </div>
              </button>
            </div>
          ) : (
            <div className="card p-6">
              <h2 className="mb-1 text-lg font-bold text-slate-900">Add existing tenants</h2>
              <p className="mb-5 text-sm text-slate-500">Fill in details for each current tenant</p>

              <div className="space-y-6">
                {tenantRows.map((row, i) => (
                  <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-700">Tenant {i + 1}</p>
                      {i > 0 && (
                        <button type="button" onClick={() => setTenantRows(prev => prev.filter((_, idx) => idx !== i))}
                          className="text-xs text-slate-400 hover:text-red-600">Remove</button>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">Full name *</label>
                        <input className="input-field" placeholder="Jane Smith"
                          value={row.full_name}
                          onChange={e => setTenantRows(prev => prev.map((r, idx) => idx === i ? { ...r, full_name: e.target.value } : r))} />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">Email *</label>
                        <input type="email" className="input-field" placeholder="jane@example.com"
                          value={row.email}
                          onChange={e => setTenantRows(prev => prev.map((r, idx) => idx === i ? { ...r, email: e.target.value } : r))} />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">Phone</label>
                        <input type="tel" className="input-field" placeholder="082 555 1234"
                          value={row.phone}
                          onChange={e => setTenantRows(prev => prev.map((r, idx) => idx === i ? { ...r, phone: e.target.value } : r))} />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">Monthly rent (R) *</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">R</span>
                          <input type="number" className="input-field pl-6" placeholder="12000"
                            value={row.monthly_rent}
                            onChange={e => setTenantRows(prev => prev.map((r, idx) => idx === i ? { ...r, monthly_rent: e.target.value } : r))} />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">Lease start *</label>
                        <input type="date" className="input-field"
                          value={row.lease_start}
                          onChange={e => setTenantRows(prev => prev.map((r, idx) => idx === i ? { ...r, lease_start: e.target.value } : r))} />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">Lease end</label>
                        <input type="date" className="input-field"
                          value={row.lease_end}
                          onChange={e => setTenantRows(prev => prev.map((r, idx) => idx === i ? { ...r, lease_end: e.target.value } : r))} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs font-medium text-slate-600">Payment status this month</label>
                        <div className="flex gap-2">
                          {(['paid', 'unpaid'] as const).map(s => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setTenantRows(prev => prev.map((r, idx) => idx === i ? { ...r, payment_status: s } : r))}
                              className={`flex-1 rounded-lg border py-2 text-sm font-medium capitalize transition ${
                                row.payment_status === s
                                  ? s === 'paid' ? 'border-green-600 bg-green-600 text-white' : 'border-red-500 bg-red-500 text-white'
                                  : 'border-slate-200 text-slate-600 hover:border-slate-400'
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {tenantRows.length < 10 && (
                <button type="button" onClick={() => setTenantRows(prev => [...prev, emptyTenant()])}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm font-medium text-slate-500 transition hover:border-slate-400 hover:text-slate-700">
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
                  </svg>
                  Add another tenant
                </button>
              )}

              {error && (
                <div className="mt-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</div>
              )}

              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => setAddTenants(false)}
                  className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
                  Back
                </button>
                <button type="button" disabled={loading} onClick={handleTenantsSubmit}
                  className="flex-[2] rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">
                  {loading ? 'Saving…' : 'Save tenants & finish →'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Done ───────────────────────────────────────────────────────────────────
  return <DoneScreen />
}

function DoneScreen() {
  const router = useRouter()
  useEffect(() => {
    const t = setTimeout(() => router.push('/dashboard'), 3000)
    return () => clearTimeout(t)
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md text-center">
        <OnboardingProgress step="done" />
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">All set!</h1>
        <p className="mt-3 text-slate-500">Your property and tenants have been added. Taking you to the dashboard…</p>
        <button onClick={() => router.push('/dashboard')}
          className="btn-primary mt-8">
          Go to dashboard →
        </button>
      </div>
    </div>
  )
}
