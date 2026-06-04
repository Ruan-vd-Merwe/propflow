'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const PROVINCES = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
  'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape',
]

const PROPERTY_TYPES = [
  { value: 'apartment',  label: 'Apartment', icon: 'APT' },
  { value: 'house',      label: 'House',     icon: 'HSE' },
  { value: 'townhouse',  label: 'Townhouse', icon: 'TWN' },
  { value: 'room',       label: 'Room',      icon: 'RM'  },
]

const BEDROOMS   = [0, 1, 2, 3, 4, 5]
const BATHROOMS  = ['1', '1.5', '2', '2.5', '3+']
const LEASE_OPTS = [
  { value: 'month-to-month', label: 'Month-to-month' },
  { value: '6',   label: '6 months' },
  { value: '12',  label: '12 months' },
  { value: '24',  label: '24 months' },
]

const FEATURE_TAGS = [
  { value: 'pool',               label: 'Pool'            },
  { value: 'garden',             label: 'Garden'          },
  { value: 'balcony',            label: 'Balcony'         },
  { value: 'braai_area',         label: 'Braai area'      },
  { value: 'solar',              label: 'Solar / backup'  },
  { value: 'storage',            label: 'Storage room'    },
  { value: 'building_security',  label: 'Building security'},
  { value: 'air_conditioning',   label: 'Air conditioning'},
  { value: 'dishwasher',         label: 'Dishwasher'      },
]

const AREA_TAGS = [
  { value: 'good_schools',       label: 'Good schools'    },
  { value: 'retail_access',      label: 'Close to shops'  },
  { value: 'public_transport',   label: 'Public transport'},
  { value: 'green_space',        label: 'Parks nearby'    },
  { value: 'nightlife',          label: 'Nightlife'       },
  { value: 'coffee_culture',     label: 'Coffee shops'    },
  { value: 'beach_access',       label: 'Near the beach'  },
  { value: 'quiet_suburb',       label: 'Quiet suburb'    },
  { value: 'walkable',           label: 'Walkable area'   },
]

const LIFESTYLE_TAGS = [
  { value: 'remote_work',        label: 'Remote work vibes'  },
  { value: 'outdoor_lifestyle',  label: 'Outdoor lifestyle'  },
  { value: 'social_life',        label: 'Active social scene'},
  { value: 'gym_access',         label: 'Gym nearby'         },
  { value: 'restaurants',        label: 'Restaurant scene'   },
  { value: 'dog_walking',        label: 'Dog walking routes' },
]

type Step = 1 | 2 | 3

function StepBar({ current }: { current: Step }) {
  const steps = ['Property details', 'Rental details', 'Photos']
  return (
    <div className="mb-8 flex items-center justify-center gap-0">
      {steps.map((label, i) => {
        const num = (i + 1) as Step
        const done = num < current
        const active = num === current
        return (
          <div key={i} className="flex items-center">
            {i > 0 && <div className={`mx-2 h-0.5 w-10 ${done ? 'bg-blue-700' : 'bg-slate-200'}`} />}
            <div className="flex flex-col items-center gap-1">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                done   ? 'bg-blue-700 text-white' :
                active ? 'bg-[#0f172a] text-white' :
                         'bg-slate-200 text-slate-400'
              }`}>
                {done ? '✓' : num}
              </div>
              <span className={`hidden text-xs sm:block ${active ? 'font-semibold text-slate-900' : 'text-slate-400'}`}>
                {label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function NewPropertyPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [step,    setStep]    = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [toast,   setToast]   = useState<string | null>(null)

  // Step 1
  const [name,         setName]         = useState('')
  const [propertyType, setPropertyType] = useState('')
  const [bedrooms,     setBedrooms]     = useState<number | null>(null)
  const [bathrooms,    setBathrooms]    = useState('')
  const [address,      setAddress]      = useState('')
  const [suburb,       setSuburb]       = useState('')
  const [province,     setProvince]     = useState('')
  const [postalCode,   setPostalCode]   = useState('')

  // Step 2
  const [rent,             setRent]             = useState('')
  const [availableFrom,    setAvailableFrom]    = useState('')
  const [leaseLength,      setLeaseLength]      = useState('')
  const [floorSize,        setFloorSize]        = useState('')
  const [petsAllowed,      setPetsAllowed]      = useState(false)
  const [parkingAvailable, setParkingAvailable] = useState(false)
  const [fibreAvailable,   setFibreAvailable]   = useState(false)
  const [propertyTags,     setPropertyTags]     = useState<string[]>([])
  const [areaTags,         setAreaTags]         = useState<string[]>([])
  const [lifestyleTags,    setLifestyleTags]    = useState<string[]>([])
  const [description,      setDescription]      = useState('')

  // Step 3
  const [photos,       setPhotos]       = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<number[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    setPhotos(prev => [...prev, ...files].slice(0, 6))
  }

  function removePhoto(i: number) {
    setPhotos(prev => prev.filter((_, idx) => idx !== i))
  }

  async function handleSubmit() {
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: prop, error: propErr } = await supabase
      .from('properties')
      .insert({
        owner_id:      user.id,
        name:          name.trim(),
        address:          `${address.trim()}${suburb ? ', ' + suburb : ''}${postalCode ? ', ' + postalCode : ''}`,
        suburb:           suburb || null,
        province:         province || null,
        property_type:    propertyType || null,
        bedrooms:         bedrooms ?? null,
        asking_rent:      rent ? Math.round(parseFloat(rent) * 100) : null,
        available_from:   availableFrom || null,
        description:      description || null,
        floor_size_m2:    floorSize ? parseInt(floorSize) : null,
        pets_allowed:     petsAllowed,
        parking_available: parkingAvailable,
        fibre_available:  fibreAvailable,
        property_tags:    propertyTags,
        area_tags:        areaTags,
        lifestyle_tags:   lifestyleTags,
        is_listed:        true,
        photos:           [],
      })
      .select()
      .single()

    if (propErr || !prop) {
      setError(propErr?.message ?? 'Failed to create property')
      setLoading(false)
      return
    }

    // Upload photos
    if (photos.length > 0) {
      const progArr = photos.map(() => 0)
      setUploadProgress(progArr)
      const urls: string[] = []

      for (let i = 0; i < photos.length; i++) {
        const fd = new FormData()
        fd.append('file', photos[i])
        fd.append('propertyId', prop.id)
        const res = await fetch('/api/upload/property-photo', { method: 'POST', body: fd })
        if (res.ok) {
          const { url } = await res.json()
          urls.push(url)
        }
        setUploadProgress(prev => prev.map((p, idx) => idx === i ? 100 : p))
      }

      if (urls.length > 0) {
        await supabase.from('properties').update({ photos: urls }).eq('id', prop.id)
      }
    }

    setLoading(false)
    setToast('Property listed successfully!')
    setTimeout(() => router.push(`/properties/${prop.id}`), 1200)
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      {toast && (
        <div className="fixed inset-x-0 top-4 z-50 flex justify-center">
          <div className="rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-lg">
            ✓ {toast}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-900">← Dashboard</Link>
          <span className="text-slate-300">/</span>
          <span className="text-sm font-medium text-slate-700">Add property</span>
        </div>

        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-700">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Add a property</h1>
          <p className="mt-1 text-sm text-slate-500">List your property on PropTrust in 3 steps</p>
        </div>

        <StepBar current={step} />

        {/* ── Step 1 ── */}
        {step === 1 && (
          <div className="card p-6">
            <h2 className="mb-5 text-lg font-bold text-slate-900">Property details</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Property name *</label>
                <input className="input-field" placeholder='e.g. "Unit 4B, Kloof Street"'
                  value={name} onChange={e => setName(e.target.value)} />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Property type</label>
                <div className="grid grid-cols-4 gap-2">
                  {PROPERTY_TYPES.map(t => (
                    <button key={t.value} type="button" onClick={() => setPropertyType(t.value)}
                      className={`flex flex-col items-center gap-1 rounded-xl border py-3 text-xs font-medium transition ${
                        propertyType === t.value
                          ? 'border-blue-700 bg-blue-700 text-white'
                          : 'border-slate-200 text-slate-600 hover:border-slate-400'
                      }`}>
                      <span className="text-xl">{t.icon}</span>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Bedrooms</label>
                <div className="flex flex-wrap gap-2">
                  {BEDROOMS.map(n => (
                    <button key={n} type="button" onClick={() => setBedrooms(n)}
                      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                        bedrooms === n
                          ? 'border-blue-700 bg-blue-700 text-white'
                          : 'border-slate-200 text-slate-600 hover:border-slate-400'
                      }`}>
                      {n === 0 ? 'Studio' : n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Bathrooms</label>
                <div className="flex flex-wrap gap-2">
                  {BATHROOMS.map(n => (
                    <button key={n} type="button" onClick={() => setBathrooms(n)}
                      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                        bathrooms === n
                          ? 'border-blue-700 bg-blue-700 text-white'
                          : 'border-slate-200 text-slate-600 hover:border-slate-400'
                      }`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Full street address *</label>
                <input className="input-field" placeholder="12 Kloof Street, Gardens"
                  value={address} onChange={e => setAddress(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Suburb</label>
                  <input className="input-field" placeholder="e.g. Sea Point"
                    value={suburb} onChange={e => setSuburb(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Postal code</label>
                  <input className="input-field" placeholder="8001"
                    value={postalCode} onChange={e => setPostalCode(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Province</label>
                <select className="input-field" value={province} onChange={e => setProvince(e.target.value)}>
                  <option value="">Select…</option>
                  {PROVINCES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <button
              type="button"
              disabled={!name.trim() || !address.trim()}
              onClick={() => setStep(2)}
              className="btn-primary mt-6 disabled:opacity-50">
              Continue →
            </button>
          </div>
        )}

        {/* ── Step 2 ── */}
        {step === 2 && (
          <div className="card p-6">
            <h2 className="mb-5 text-lg font-bold text-slate-900">Rental details</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Monthly rent</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">R</span>
                  <input type="number" className="input-field pl-7" placeholder="12 000" min={0}
                    value={rent} onChange={e => setRent(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Available from</label>
                <input type="date" className="input-field" value={availableFrom}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setAvailableFrom(e.target.value)} />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Lease length preference</label>
                <div className="grid grid-cols-2 gap-2">
                  {LEASE_OPTS.map(opt => (
                    <button key={opt.value} type="button" onClick={() => setLeaseLength(opt.value)}
                      className={`rounded-xl border py-2.5 text-sm font-medium transition ${
                        leaseLength === opt.value
                          ? 'border-blue-700 bg-blue-700 text-white'
                          : 'border-slate-200 text-slate-600 hover:border-slate-400'
                      }`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Floor size */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Floor size <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <div className="relative">
                  <input type="number" className="input-field pr-10" placeholder="e.g. 65" min={0}
                    value={floorSize} onChange={e => setFloorSize(e.target.value)} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">m²</span>
                </div>
              </div>

              {/* Key features */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Key features</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'pets', label: 'Pet friendly',   checked: petsAllowed,      set: setPetsAllowed      },
                    { value: 'park', label: 'Parking',        checked: parkingAvailable, set: setParkingAvailable },
                    { value: 'fibr', label: 'Fibre internet', checked: fibreAvailable,   set: setFibreAvailable   },
                  ].map(f => (
                    <label key={f.value} className={`flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                      f.checked ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                    }`}>
                      <input type="checkbox" className="sr-only" checked={f.checked} onChange={e => f.set(e.target.checked)} />
                      {f.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Additional property features */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Additional features <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {FEATURE_TAGS.map(t => {
                    const on = propertyTags.includes(t.value)
                    return (
                      <button key={t.value} type="button"
                        onClick={() => setPropertyTags(prev => on ? prev.filter(v => v !== t.value) : [...prev, t.value])}
                        className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                          on ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                        }`}>
                        {t.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Area tags */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Area highlights <span className="font-normal text-slate-400">(optional — helps matching)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {AREA_TAGS.map(t => {
                    const on = areaTags.includes(t.value)
                    return (
                      <button key={t.value} type="button"
                        onClick={() => setAreaTags(prev => on ? prev.filter(v => v !== t.value) : [...prev, t.value])}
                        className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                          on ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                        }`}>
                        {t.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Lifestyle tags */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Lifestyle vibe <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {LIFESTYLE_TAGS.map(t => {
                    const on = lifestyleTags.includes(t.value)
                    return (
                      <button key={t.value} type="button"
                        onClick={() => setLifestyleTags(prev => on ? prev.filter(v => v !== t.value) : [...prev, t.value])}
                        className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                          on ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                        }`}>
                        {t.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Description <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <textarea className="input-field min-h-[90px] resize-y"
                  placeholder="Describe what makes this property special..."
                  value={description} onChange={e => setDescription(e.target.value)} />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setStep(1)}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
                Back
              </button>
              <button type="button" onClick={() => setStep(3)}
                className="flex-[2] rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800">
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3 ── */}
        {step === 3 && (
          <div className="card p-6">
            <h2 className="mb-2 text-lg font-bold text-slate-900">Photos</h2>
            <p className="mb-5 text-sm text-slate-500">
              Up to 6 photos. The first photo becomes the cover image.
            </p>

            <div className="flex flex-wrap gap-3">
              {photos.map((f, i) => (
                <div key={i} className="group relative h-24 w-24 overflow-hidden rounded-xl border border-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 text-[9px] font-bold text-white">
                      Cover
                    </span>
                  )}
                  {uploadProgress[i] > 0 && uploadProgress[i] < 100 && (
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-slate-200">
                      <div className="h-full bg-blue-600 transition-all" style={{ width: `${uploadProgress[i]}%` }} />
                    </div>
                  )}
                  <button type="button" onClick={() => removePhoto(i)}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100">
                    <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}

              {photos.length < 6 && (
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 text-xs text-slate-400 transition hover:border-blue-400 hover:text-blue-600">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                  Add photo
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              multiple className="hidden" onChange={handlePhotoSelect} />

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</div>
            )}

            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setStep(2)}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
                Back
              </button>
              <button type="button" disabled={loading} onClick={handleSubmit}
                className="flex-[2] rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:opacity-50">
                {loading ? 'Saving…' : 'List property →'}
              </button>
            </div>

            {photos.length === 0 && (
              <button type="button" disabled={loading} onClick={handleSubmit}
                className="mt-2 w-full text-center text-xs text-slate-400 hover:text-slate-600 disabled:opacity-50">
                Skip for now — add photos later
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
