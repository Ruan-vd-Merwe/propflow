'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { NavBar } from '@/components/NavBar'
import { StatusBar, SignatureSection, XpelloPanel } from './LeaseActions'
import type { LeaseStatus } from '@/lib/types'

type LeaseData = {
  id: string
  status: LeaseStatus
  lease_start: string
  lease_end: string | null
  monthly_rent: number
  deposit_amount: number | null
  payment_due_day: number
  notice_period_days: number
  pet_allowed: boolean
  subletting_allowed: boolean
  special_conditions: string | null
  landlord_signed_at: string | null
  tenant_signed_at: string | null
  xpello_enrolled: boolean
  xpello_enrolled_at: string | null
  properties: {
    id: string
    name: string
    address: string
    property_type: string | null
    bedrooms: number | null
  } | null
  tenants: {
    id: string
    full_name: string
    email: string
    phone: string | null
    portal_token: string
  } | null
  profiles: {
    full_name: string
    email: string
    phone: string | null
  } | null
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtRand(cents: number) {
  return `R ${(cents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 0 })}`
}

function ordinal(n: number) {
  if (n === 1) return '1st'
  if (n === 2) return '2nd'
  if (n === 3) return '3rd'
  return `${n}th`
}

export default function LeasePage() {
  const { id } = useParams<{ id: string }>()
  const [lease,   setLease]   = useState<LeaseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [status,  setStatus]  = useState<LeaseStatus>('draft')

  useEffect(() => {
    fetch(`/api/leases/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) { setError(json.error); return }
        setLease(json.lease)
        setStatus(json.lease.status)
      })
      .catch(() => setError('Failed to load lease'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <NavBar />
        <main className="flex min-h-[60vh] items-center justify-center">
          <p className="text-slate-400">Loading lease…</p>
        </main>
      </div>
    )
  }

  if (error || !lease) {
    return (
      <div className="min-h-screen bg-slate-50">
        <NavBar />
        <main className="mx-auto max-w-4xl px-6 py-8">
          <p className="text-red-600">{error ?? 'Lease not found'}</p>
          <Link href="/leases" className="mt-2 inline-block text-sm text-blue-700 hover:underline">← Back to leases</Link>
        </main>
      </div>
    )
  }

  const ll = lease.profiles
  const tt = lease.tenants
  const pp = lease.properties
  const portalLink = tt ? `${window.location.origin}/tenant/${tt.portal_token}` : ''

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />
      <main className="mx-auto max-w-4xl px-6 py-8">
        {/* Top nav */}
        <div className="mb-6 flex items-center justify-between">
          <Link href="/leases" className="text-sm font-medium text-slate-500 hover:text-slate-900">
            ← Back to leases
          </Link>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print / PDF
          </button>
        </div>

        {/* Status bar */}
        <StatusBar status={status} leaseId={id} onStatusChange={setStatus} />

        {/* Lease document */}
        <div id="lease-document" className="card overflow-hidden bg-white px-8 py-10 print:shadow-none">

          {/* Header */}
          <div className="mb-10 border-b border-slate-200 pb-8 text-center">
            <h1 className="text-2xl font-bold uppercase tracking-widest text-slate-900">
              Residential Lease Agreement
            </h1>
            <p className="mt-2 text-sm text-slate-500">Entered into between:</p>
          </div>

          {/* Landlord details */}
          <section className="mb-8">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-500">Landlord Details</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailRow label="Full name" value={ll?.full_name ?? '—'} />
              <DetailRow label="Contact" value={[ll?.email, ll?.phone].filter(Boolean).join(' | ') || '—'} />
            </div>
          </section>

          {/* Tenant details */}
          <section className="mb-8">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-500">Tenant Details</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailRow label="Full name" value={tt?.full_name ?? '—'} />
              <DetailRow label="SA ID Number" value="—" />
              <DetailRow label="Contact" value={[tt?.email, tt?.phone].filter(Boolean).join(' | ') || '—'} />
            </div>
          </section>

          {/* Property */}
          <section className="mb-8">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-500">Property</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailRow label="Address" value={pp?.address ?? '—'} />
              <DetailRow
                label="Description"
                value={[pp?.property_type, pp?.bedrooms ? `${pp.bedrooms} bed` : null].filter(Boolean).join(', ') || '—'}
              />
            </div>
          </section>

          {/* Lease terms */}
          <section className="mb-8">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-500">Lease Terms</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailRow label="Commencement date" value={fmtDate(lease.lease_start)} />
              <DetailRow label="Termination date" value={lease.lease_end ? fmtDate(lease.lease_end) : 'Month-to-month'} />
              <DetailRow label="Monthly rental" value={fmtRand(lease.monthly_rent)} />
              <DetailRow label="Deposit" value={lease.deposit_amount ? fmtRand(lease.deposit_amount) : '—'} />
              <DetailRow label="Payment due" value={`${ordinal(lease.payment_due_day)} of each month`} />
              <DetailRow label="Notice period" value={`${lease.notice_period_days} days`} />
              <DetailRow label="Pets permitted" value={lease.pet_allowed ? 'Yes' : 'No'} />
              <DetailRow label="Subletting permitted" value={lease.subletting_allowed ? 'Yes' : 'No'} />
            </div>
          </section>

          {/* Tenant obligations */}
          <section className="mb-8">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-500">Tenant Obligations</h2>
            <ol className="space-y-2 text-sm leading-relaxed text-slate-700">
              <li><span className="font-semibold">1.</span> The tenant shall pay rent on or before the due date each month.</li>
              <li><span className="font-semibold">2.</span> The tenant shall maintain the property in good and clean condition.</li>
              <li><span className="font-semibold">3.</span> The tenant shall not make alterations without written consent from the landlord.</li>
              <li><span className="font-semibold">4.</span> The tenant shall not sublet without written consent from the landlord.</li>
              <li><span className="font-semibold">5.</span> The tenant shall comply with all body corporate rules where applicable.</li>
              <li><span className="font-semibold">6.</span> The tenant shall give {lease.notice_period_days} days written notice of intention to vacate.</li>
            </ol>
          </section>

          {/* Landlord obligations */}
          <section className="mb-8">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-500">Landlord Obligations</h2>
            <ol className="space-y-2 text-sm leading-relaxed text-slate-700">
              <li><span className="font-semibold">1.</span> The landlord shall maintain the property in a habitable condition.</li>
              <li><span className="font-semibold">2.</span> The landlord shall not enter the property without reasonable notice except in emergency.</li>
              <li><span className="font-semibold">3.</span> The landlord shall return the deposit within 21 days of vacating subject to inspection.</li>
            </ol>
          </section>

          {/* Special conditions */}
          <section className="mb-8">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-500">Special Conditions</h2>
            <p className="text-sm leading-relaxed text-slate-700">
              {lease.special_conditions ?? 'None'}
            </p>
          </section>

          {/* Signatures */}
          <SignatureSection
            leaseId={id}
            landlordName={ll?.full_name ?? ''}
            tenantName={tt?.full_name ?? ''}
            landlordSignedAt={lease.landlord_signed_at}
            tenantSignedAt={lease.tenant_signed_at}
            xpelloEnrolled={lease.xpello_enrolled}
            xpelloEnrolledAt={lease.xpello_enrolled_at}
            tenantPortalLink={portalLink}
            onStatusChange={setStatus}
          />
        </div>

        {/* Xpello panel — signed leases only */}
        {status === 'signed' && (
          <XpelloPanel
            leaseId={id}
            enrolled={lease.xpello_enrolled}
            enrolledAt={lease.xpello_enrolled_at}
          />
        )}
      </main>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-900">{value}</p>
    </div>
  )
}
