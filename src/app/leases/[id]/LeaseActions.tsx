'use client'

import { useState } from 'react'
import type { LeaseStatus } from '@/lib/types'

type Props = {
  leaseId:           string
  status:            LeaseStatus
  landlordName:      string
  tenantName:        string
  landlordSignedAt:  string | null
  tenantSignedAt:    string | null
  xpelloEnrolled:    boolean
  xpelloEnrolledAt:  string | null
  tenantPortalLink:  string
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function StatusBar({
  status,
  leaseId,
  onStatusChange,
}: {
  status: LeaseStatus
  leaseId: string
  onStatusChange: (s: LeaseStatus) => void
}) {
  const map: Record<LeaseStatus, { label: string; cls: string }> = {
    draft:   { label: 'Draft',  cls: 'bg-slate-100 text-slate-700 border-slate-200' },
    sent:    { label: 'Sent',   cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    signed:  { label: 'Signed', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    expired: { label: 'Expired',cls: 'bg-red-50 text-red-700 border-red-200' },
  }
  const { label, cls } = map[status]

  return (
    <div className={`mb-8 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 ${cls}`}>
      <div className="flex items-center gap-3">
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${cls}`}>{label}</span>
        <span className="text-sm font-medium">
          {status === 'draft'   && 'Ready to send to tenant for review'}
          {status === 'sent'    && 'Waiting for tenant signature'}
          {status === 'signed'  && 'Both parties have signed — lease is active'}
          {status === 'expired' && 'This lease has expired'}
        </span>
      </div>
      {status === 'draft' && (
        <SendToTenantButton leaseId={leaseId} onSent={() => onStatusChange('sent')} showStatusChange />
      )}
    </div>
  )
}

function SendToTenantButton({
  leaseId,
  onSent,
  showStatusChange,
}: {
  leaseId: string
  onSent?: () => void
  showStatusChange?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  async function send() {
    setLoading(true)
    try {
      const link = `${window.location.origin}/tenant-lease/${leaseId}`
      await navigator.clipboard.writeText(link)
      if (showStatusChange) {
        await fetch(`/api/leases/${leaseId}`, {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ action: 'send_to_tenant' }),
        })
      }
      setCopied(true)
      onSent?.()
      setTimeout(() => setCopied(false), 3000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      disabled={loading || copied}
      onClick={send}
      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
    >
      {copied ? 'Link copied!' : loading ? 'Copying…' : 'Copy tenant link'}
    </button>
  )
}

export function SignatureSection({
  leaseId,
  landlordName,
  tenantName,
  landlordSignedAt: initialLandlordSigned,
  tenantSignedAt:   initialTenantSigned,
  tenantPortalLink,
  onStatusChange,
}: Omit<Props, 'status'> & { onStatusChange: (s: LeaseStatus) => void }) {
  const [landlordSigned, setLandlordSigned] = useState(initialLandlordSigned)
  const [signing,        setSigning]        = useState(false)
  const [copied,         setCopied]         = useState(false)

  async function markLandlordSigned() {
    setSigning(true)
    try {
      const res = await fetch(`/api/leases/${leaseId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'sign_landlord' }),
      })
      const json = await res.json()
      if (res.ok) {
        setLandlordSigned(new Date().toISOString())
        if (json.lease.status === 'signed') onStatusChange('signed')
      }
    } finally {
      setSigning(false)
    }
  }

  async function copyTenantLink() {
    await navigator.clipboard.writeText(tenantPortalLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <div className="mt-10 grid gap-6 border-t border-slate-200 pt-8 sm:grid-cols-2">
      {/* Landlord column */}
      <div>
        <p className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">Landlord</p>
        <div className="rounded-xl border border-slate-200 p-5">
          <div className="mb-3 border-b border-dashed border-slate-300 pb-3">
            <p className="text-xs text-slate-400">Signed</p>
            <p className="mt-1 h-6 text-sm font-medium text-slate-900">
              {landlordSigned ? `✓ ${fmtDate(landlordSigned)}` : '________________'}
            </p>
          </div>
          <p className="text-sm text-slate-700"><span className="text-xs text-slate-400">Name: </span>{landlordName}</p>
          {!landlordSigned && (
            <button
              disabled={signing}
              onClick={markLandlordSigned}
              className="mt-4 w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white transition hover:bg-slate-700 disabled:opacity-50"
            >
              {signing ? 'Signing…' : 'Mark as signed'}
            </button>
          )}
        </div>
      </div>

      {/* Tenant column */}
      <div>
        <p className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">Tenant</p>
        <div className="rounded-xl border border-slate-200 p-5">
          <div className="mb-3 border-b border-dashed border-slate-300 pb-3">
            <p className="text-xs text-slate-400">Signed</p>
            <p className="mt-1 h-6 text-sm font-medium text-slate-900">
              {initialTenantSigned ? `✓ ${fmtDate(initialTenantSigned)}` : '________________'}
            </p>
          </div>
          <p className="text-sm text-slate-700"><span className="text-xs text-slate-400">Name: </span>{tenantName}</p>
          {!initialTenantSigned && (
            <button
              onClick={copyTenantLink}
              className="mt-4 w-full rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
            >
              {copied ? 'Portal link copied!' : 'Send to tenant'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function XpelloPanel({
  leaseId,
  enrolled: initialEnrolled,
  enrolledAt,
}: {
  leaseId:    string
  enrolled:   boolean
  enrolledAt: string | null
}) {
  const [enrolled,  setEnrolled]  = useState(initialEnrolled)
  const [enrolledDate, setEnrolledDate] = useState(enrolledAt)
  const [enrolling, setEnrolling] = useState(false)

  async function enroll() {
    setEnrolling(true)
    window.open('https://www.xpello.co.za', '_blank')
    try {
      const res = await fetch(`/api/leases/${leaseId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'enroll_xpello' }),
      })
      if (res.ok) {
        const now = new Date().toISOString()
        setEnrolled(true)
        setEnrolledDate(now)
      }
    } finally {
      setEnrolling(false)
    }
  }

  if (enrolled) {
    return (
      <div className="mt-8 rounded-2xl bg-emerald-700 p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-600">
            <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-lg font-bold">This lease is protected by Xpello</p>
            {enrolledDate && (
              <p className="mt-1 text-sm text-emerald-200">Enrolled {fmtDate(enrolledDate)}</p>
            )}
            <a
              href="https://www.xpello.co.za"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-block rounded-xl border border-emerald-500 bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-500"
            >
              Manage with Xpello →
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-8 rounded-2xl bg-[#0f172a] p-6 text-white">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-700">
          <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-lg font-bold">Protect this lease with Xpello</p>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
            Evictions in South Africa can cost landlords over R40,000 in legal fees and lost rent.
            Xpello manages the full eviction process for you at a fixed monthly rate.
          </p>

          <ul className="mt-4 space-y-2">
            {[
              'R250/month per lease — no large legal bills',
              '25 specialist attorneys nationwide',
              'Handles everything from letter of demand to court attendance',
              'No waiting period — protection starts immediately',
            ].map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm text-slate-200">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {b}
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              disabled={enrolling}
              onClick={enroll}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow transition hover:bg-blue-500 disabled:opacity-60"
            >
              {enrolling ? 'Opening Xpello…' : 'Enroll with Xpello — R250/month'}
            </button>
            <a
              href="https://www.xpello.co.za/services"
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-slate-600 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-400 hover:text-white"
            >
              Learn more about Xpello
            </a>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            PropTrust refers landlords to Xpello as a recommended legal partner. This is a referral
            only — PropTrust is not a legal services provider.
          </p>
        </div>
      </div>
    </div>
  )
}
