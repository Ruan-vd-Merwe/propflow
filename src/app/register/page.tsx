'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// ─── SA Provinces ─────────────────────────────────────────────────────────────
const PROVINCES = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
  'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape',
]

const PROPERTY_COUNTS = ['1–5', '6–20', '20+']
const LEASE_LENGTHS  = [6, 12, 24]
const EMPLOYMENT_OPTIONS = [
  { value: 'employed',     label: 'Employed' },
  { value: 'self_employed', label: 'Self-employed' },
  { value: 'student',      label: 'Student' },
  { value: 'other',        label: 'Other' },
]

type UserPath = 'landlord' | 'tenant'
type Step = 0 | 1 | 2 | 3

function Logo() {
  return (
    <div className="mb-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900">
        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-slate-900">PropFlow</h1>
      <p className="mt-1 text-sm text-slate-500">Create your account</p>
    </div>
  )
}

function StepDots({ steps, current }: { steps: number; current: number }) {
  return (
    <div className="mb-6 flex items-center justify-center gap-2">
      {Array.from({ length: steps }).map((_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all ${
            i < current ? 'w-4 bg-slate-400' : i === current ? 'w-6 bg-slate-900' : 'w-2 bg-slate-200'
          }`}
        />
      ))}
    </div>
  )
}

export default function RegisterPage() {
  const router  = useRouter()
  const supabase = createClient()

  const [step,       setStep]       = useState<Step>(0)
  const [path,       setPath]       = useState<UserPath>('landlord')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  // ── Shared fields ──────────────────────────────────────────────────────────
  const [fullName,  setFullName]  = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [phone,     setPhone]     = useState('')

  // ── Landlord fields ────────────────────────────────────────────────────────
  const [province,      setProvince]      = useState('')
  const [city,          setCity]          = useState('')
  const [propertyCount, setPropertyCount] = useState('')

  // ── Tenant step 1 ──────────────────────────────────────────────────────────
  const [saId, setSaId] = useState('')

  // ── Tenant step 2 ──────────────────────────────────────────────────────────
  const [currentArea,       setCurrentArea]       = useState('')
  const [currentProvince,   setCurrentProvince]   = useState('')
  const [lookingArea,       setLookingArea]        = useState('')
  const [lookingProvince,   setLookingProvince]    = useState('')
  const [budgetMin,         setBudgetMin]          = useState(3000)   // Rands
  const [budgetMax,         setBudgetMax]          = useState(15000)  // Rands
  const [moveInDate,        setMoveInDate]         = useState('')
  const [leaseLength,       setLeaseLength]        = useState<number>(12)

  // ── Tenant step 3 ──────────────────────────────────────────────────────────
  const [employmentStatus, setEmploymentStatus] = useState('')
  const [monthlyIncome,    setMonthlyIncome]    = useState('')  // Rands
  const [whatsappOptIn,    setWhatsappOptIn]    = useState(true)

  // ── Helpers ────────────────────────────────────────────────────────────────
  const totalSteps = path === 'landlord' ? 2 : 4  // step 0 + steps

  async function handleSubmit() {
    setLoading(true)
    setError(null)

    const metadata: Record<string, string> = {
      full_name: fullName,
      user_type: path,
      phone,
    }

    if (path === 'landlord') {
      metadata.province = province
      metadata.city     = city
    }

    // Sign up with Supabase
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    const userId = signUpData.user?.id
    if (!userId) {
      setError('Registration failed. Please try again.')
      setLoading(false)
      return
    }

    // For tenants, create the tenant_profiles row
    if (path === 'tenant') {
      await supabase.from('tenant_profiles').insert({
        user_id:              userId,
        sa_id_number:         saId || null,
        current_area:         currentArea || null,
        current_province:     currentProvince || null,
        looking_in_area:      lookingArea || null,
        looking_in_province:  lookingProvince || null,
        budget_min:           budgetMin  * 100,   // to cents
        budget_max:           budgetMax  * 100,
        move_in_date:         moveInDate || null,
        lease_length_months:  leaseLength,
        employment_status:    employmentStatus || null,
        monthly_income:       monthlyIncome ? parseInt(monthlyIncome) * 100 : null,
        is_visible:           true,
        whatsapp_opted_in:    whatsappOptIn,
      })
    }

    router.push(path === 'landlord' ? '/onboarding?welcome=1' : '/tenant/profile?welcome=1')
    router.refresh()
  }

  // ── Step 0: Choose path ────────────────────────────────────────────────────
  if (step === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
        <div className="w-full max-w-lg">
          <Logo />
          <p className="mb-6 text-center text-base text-slate-600">Who are you signing up as?</p>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Landlord */}
            <button
              onClick={() => { setPath('landlord'); setStep(1) }}
              className="group flex flex-col items-center gap-4 rounded-2xl border-2 border-slate-200 bg-white p-8 text-center transition hover:border-slate-900 hover:shadow-md"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 transition group-hover:bg-slate-900 group-hover:text-white">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">I am a Landlord</p>
                <p className="mt-1 text-sm text-slate-500">
                  Manage properties, track tenants and find quality renters
                </p>
              </div>
              <span className="mt-auto text-xs font-semibold uppercase tracking-wide text-slate-400 transition group-hover:text-slate-900">
                Continue →
              </span>
            </button>

            {/* Tenant */}
            <button
              onClick={() => { setPath('tenant'); setStep(1) }}
              className="group flex flex-col items-center gap-4 rounded-2xl border-2 border-slate-200 bg-white p-8 text-center transition hover:border-blue-600 hover:shadow-md"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">I am a Tenant</p>
                <p className="mt-1 text-sm text-slate-500">
                  Find your next home and get matched with great landlords
                </p>
              </div>
              <span className="mt-auto text-xs font-semibold uppercase tracking-wide text-slate-400 transition group-hover:text-blue-600">
                Continue →
              </span>
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-slate-900 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    )
  }

  // ── Step 1: Personal info ──────────────────────────────────────────────────
  if (step === 1) {
    const isLandlord = path === 'landlord'

    const canContinue =
      fullName.trim() && email.trim() && password.length >= 8 && phone.trim() &&
      (isLandlord ? province && city : saId.trim())

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
        <div className="w-full max-w-md">
          <Logo />
          <StepDots steps={totalSteps - 1} current={0} />

          <div className="card p-6">
            <h2 className="mb-1 text-lg font-bold text-slate-900">Your details</h2>
            <p className="mb-5 text-sm text-slate-500">
              {isLandlord ? 'Tell us about yourself as a landlord' : 'Start with your personal information'}
            </p>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Full name</label>
                <input className="input-field" placeholder="e.g. Ruan van der Merwe" value={fullName}
                  onChange={e => setFullName(e.target.value)} />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Email address</label>
                <input type="email" className="input-field" placeholder="you@example.com" value={email}
                  onChange={e => setEmail(e.target.value)} />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Password <span className="text-slate-400">(min 8 characters)</span>
                </label>
                <input type="password" className="input-field" placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)} />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Phone number</label>
                <input type="tel" className="input-field" placeholder="e.g. 082 555 1234" value={phone}
                  onChange={e => setPhone(e.target.value)} />
              </div>

              {isLandlord ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">Province</label>
                      <select className="input-field" value={province} onChange={e => setProvince(e.target.value)}>
                        <option value="">Select…</option>
                        {PROVINCES.map(p => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">City</label>
                      <input className="input-field" placeholder="e.g. Cape Town" value={city}
                        onChange={e => setCity(e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      How many properties do you manage?
                    </label>
                    <div className="flex gap-2">
                      {PROPERTY_COUNTS.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setPropertyCount(c)}
                          className={`flex-1 rounded-lg border py-2 text-sm font-medium transition ${
                            propertyCount === c
                              ? 'border-slate-900 bg-slate-900 text-white'
                              : 'border-slate-200 text-slate-600 hover:border-slate-400'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    SA ID number
                    <span className="ml-1 text-slate-400">(13 digits)</span>
                  </label>
                  <input
                    className="input-field font-mono"
                    placeholder="0000000000000"
                    maxLength={13}
                    value={saId}
                    onChange={e => setSaId(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setStep(0)}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!canContinue}
                onClick={() => isLandlord ? handleSubmitLandlord() : setStep(2)}
                className="flex-[2] rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLandlord ? (loading ? 'Creating account…' : 'Create account') : 'Continue →'}
              </button>
            </div>
          </div>

          <p className="mt-4 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-slate-900 hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    )
  }

  // ── Step 2 (Tenant): Rental preferences ───────────────────────────────────
  if (step === 2 && path === 'tenant') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
        <div className="w-full max-w-md">
          <Logo />
          <StepDots steps={totalSteps - 1} current={1} />

          <div className="card p-6">
            <h2 className="mb-1 text-lg font-bold text-slate-900">Rental preferences</h2>
            <p className="mb-5 text-sm text-slate-500">Tell us what you are looking for</p>

            <div className="space-y-5">
              {/* Current location */}
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">Where do you currently live?</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Area / suburb</label>
                    <input className="input-field" placeholder="e.g. Sandton" value={currentArea}
                      onChange={e => setCurrentArea(e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Province</label>
                    <select className="input-field" value={currentProvince} onChange={e => setCurrentProvince(e.target.value)}>
                      <option value="">Select…</option>
                      {PROVINCES.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Looking in */}
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">Where are you looking to rent?</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Area / suburb</label>
                    <input className="input-field" placeholder="e.g. Sea Point" value={lookingArea}
                      onChange={e => setLookingArea(e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Province</label>
                    <select className="input-field" value={lookingProvince} onChange={e => setLookingProvince(e.target.value)}>
                      <option value="">Select…</option>
                      {PROVINCES.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Budget slider */}
              <div>
                <label className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">
                  Monthly budget
                  <span className="font-normal text-slate-500">
                    R{budgetMin.toLocaleString()} – R{budgetMax.toLocaleString()}
                  </span>
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="w-8 text-xs text-slate-400">Min</span>
                    <input
                      type="range" min={3000} max={50000} step={500}
                      value={budgetMin}
                      onChange={e => {
                        const v = parseInt(e.target.value)
                        setBudgetMin(Math.min(v, budgetMax - 500))
                      }}
                      className="flex-1 accent-slate-900"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-8 text-xs text-slate-400">Max</span>
                    <input
                      type="range" min={3000} max={50000} step={500}
                      value={budgetMax}
                      onChange={e => {
                        const v = parseInt(e.target.value)
                        setBudgetMax(Math.max(v, budgetMin + 500))
                      }}
                      className="flex-1 accent-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Move-in date */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">When do you need to move in?</label>
                <input type="date" className="input-field" value={moveInDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setMoveInDate(e.target.value)} />
              </div>

              {/* Lease length */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Ideal lease length</label>
                <div className="flex gap-2">
                  {LEASE_LENGTHS.map(l => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLeaseLength(l)}
                      className={`flex-1 rounded-lg border py-2 text-sm font-medium transition ${
                        leaseLength === l
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 text-slate-600 hover:border-slate-400'
                      }`}
                    >
                      {l} months
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setStep(1)}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
                Back
              </button>
              <button type="button" onClick={() => setStep(3)}
                className="flex-[2] rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
                Continue →
              </button>
            </div>
          </div>

          <p className="mt-4 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-slate-900 hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    )
  }

  // ── Step 3 (Tenant): Financial info ───────────────────────────────────────
  if (step === 3 && path === 'tenant') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
        <div className="w-full max-w-md">
          <Logo />
          <StepDots steps={totalSteps - 1} current={2} />

          <div className="card p-6">
            <h2 className="mb-1 text-lg font-bold text-slate-900">Financial details</h2>
            <p className="mb-5 text-sm text-slate-500">
              This helps landlords assess affordability. Your details are kept private.
            </p>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Employment status</label>
                <div className="grid grid-cols-2 gap-2">
                  {EMPLOYMENT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setEmploymentStatus(opt.value)}
                      className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                        employmentStatus === opt.value
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 text-slate-600 hover:border-slate-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Monthly net income
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">R</span>
                  <input
                    type="number"
                    className="input-field pl-7"
                    placeholder="e.g. 25000"
                    min={0}
                    value={monthlyIncome}
                    onChange={e => setMonthlyIncome(e.target.value)}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Your income after tax. This is never shared without your permission.
                </p>
              </div>

              {/* Affordability preview */}
              {monthlyIncome && parseInt(monthlyIncome) > 0 && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Affordability preview</p>
                  <p className="mt-1 text-sm text-slate-700">
                    Based on your income, you can comfortably afford rent up to{' '}
                    <strong className="text-slate-900">
                      R{Math.round(parseInt(monthlyIncome) / 3).toLocaleString()}
                    </strong>
                    {' '}per month <span className="text-slate-400">(30% rule)</span>
                  </p>
                </div>
              )}

              {/* WhatsApp opt-in */}
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
                <input
                  type="checkbox"
                  checked={whatsappOptIn}
                  onChange={e => setWhatsappOptIn(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-green-600"
                />
                <div>
                  <p className="text-sm font-semibold text-green-800">
                    💬 Receive WhatsApp notifications
                  </p>
                  <p className="mt-0.5 text-xs text-green-700">
                    Get instant updates for rent reminders, maintenance status, and introduction
                    requests on your phone number above. You can opt out anytime.
                  </p>
                </div>
              </label>
            </div>

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</div>
            )}

            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setStep(2)}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
                Back
              </button>
              <button
                type="button"
                disabled={loading || !employmentStatus}
                onClick={handleSubmit}
                className="flex-[2] rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </div>
          </div>

          <p className="mt-4 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-slate-900 hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    )
  }

  return null

  // ── Landlord submit (inline) ───────────────────────────────────────────────
  async function handleSubmitLandlord() {
    setLoading(true)
    setError(null)

    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          user_type: 'landlord',
          phone,
          province,
          city,
        },
      },
    })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    router.push('/onboarding?welcome=1')
    router.refresh()
  }
}
