'use client'

import { useState } from 'react'
import type { TenantQuery, Payment, QueryCategory, QueryStatus } from '@/lib/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type TenantInfo = {
  id: string
  full_name: string
  email: string
  phone: string | null
  monthly_rent: number
  lease_start: string
  lease_end: string | null
  portal_token: string
}

type PropertyInfo = {
  id: string
  name: string
  address: string
  province: string | null
}

type LandlordInfo = {
  full_name: string
  email: string
  phone: string | null
}

type ServiceCategory = {
  id: string; name: string; icon: string | null; description: string | null
}

type ServiceProvider = {
  id: string; category_id: string; name: string; phone: string | null
  whatsapp: string | null; area: string | null; province: string | null
  rate_description: string | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'home',        label: 'Home',        icon: '🏠' },
  { id: 'payments',    label: 'Payments',    icon: '💳' },
  { id: 'maintenance', label: 'Maintenance', icon: '🔧' },
  { id: 'services',    label: 'Services',    icon: '⭐' },
  { id: 'queries',     label: 'Queries',     icon: '💬' },
] as const

type TabId = (typeof TABS)[number]['id']

const MAINTENANCE_CATEGORIES = [
  { value: 'plumbing',      label: '🚿 Plumbing' },
  { value: 'electrical',    label: '⚡ Electrical' },
  { value: 'appliances',    label: '🔌 Appliances' },
  { value: 'doors_windows', label: '🚪 Doors / Windows' },
  { value: 'garden',        label: '🌿 Garden' },
  { value: 'other',         label: '🔨 Other' },
]

const QUERY_STATUS: Record<QueryStatus, { label: string; cls: string }> = {
  open:        { label: 'Open',        cls: 'bg-amber-100 text-amber-700' },
  in_progress: { label: 'In Progress', cls: 'bg-blue-100 text-blue-700' },
  resolved:    { label: 'Resolved',    cls: 'bg-emerald-100 text-emerald-700' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtRand(cents: number) {
  return `R${(cents / 100).toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtMonth(iso: string) {
  return new Date(iso).toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })
}

function daysUntil(iso: string) {
  const diff = new Date(iso).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)
  return Math.round(diff / 86400000)
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-white shadow-sm ${className}`}>
      {children}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TenantPortal({
  token,
  tenant,
  property,
  landlord,
  initialPayments,
  initialQueries,
  serviceCategories,
  serviceProviders,
  nextPayment,
}: {
  token: string
  tenant: TenantInfo
  property: PropertyInfo
  landlord: LandlordInfo
  initialPayments: Payment[]
  initialQueries: TenantQuery[]
  serviceCategories: ServiceCategory[]
  serviceProviders: ServiceProvider[]
  nextPayment: Payment | null
}) {
  const [activeTab, setActiveTab] = useState<TabId>('home')
  const [queries,   setQueries]   = useState<TenantQuery[]>(initialQueries)
  const [selectedServiceCat, setSelectedServiceCat] = useState<string | null>(null)

  return (
    <div>
      {/* Tab bar */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-2xl bg-white/10 p-1.5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-2.5 text-xs font-medium transition ${
              activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="text-base">{tab.icon}</span>
            <span className="hidden sm:block">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'home' && (
        <HomeTab
          tenant={tenant}
          property={property}
          landlord={landlord}
          nextPayment={nextPayment}
          onNavigate={setActiveTab}
        />
      )}
      {activeTab === 'payments' && (
        <PaymentsTab
          payments={initialPayments}
          token={token}
        />
      )}
      {activeTab === 'maintenance' && (
        <MaintenanceTab
          queries={queries.filter((q) => q.category === 'maintenance')}
          onSubmit={(q) => setQueries((prev) => [q, ...prev])}
          token={token}
        />
      )}
      {activeTab === 'services' && (
        <ServicesTab
          categories={serviceCategories}
          providers={serviceProviders}
          tenantId={tenant.id}
          propertyId={property.id}
          selectedCatId={selectedServiceCat}
          onSelectCat={setSelectedServiceCat}
        />
      )}
      {activeTab === 'queries' && (
        <QueriesTab
          queries={queries.filter((q) => q.category !== 'maintenance')}
          onSubmit={(q) => setQueries((prev) => [q, ...prev])}
          token={token}
        />
      )}
    </div>
  )
}

// ─── HOME TAB ─────────────────────────────────────────────────────────────────

function HomeTab({
  tenant,
  property,
  landlord,
  nextPayment,
  onNavigate,
}: {
  tenant: TenantInfo
  property: PropertyInfo
  landlord: LandlordInfo
  nextPayment: Payment | null
  onNavigate: (tab: TabId) => void
}) {
  const days = nextPayment ? daysUntil(nextPayment.due_date) : null

  const paymentColour =
    days === null         ? 'bg-slate-50 border-slate-200' :
    days < 0              ? 'bg-red-50 border-red-200' :
    days <= 3             ? 'bg-amber-50 border-amber-200' :
                            'bg-emerald-50 border-emerald-200'

  const paymentTextColour =
    days === null         ? 'text-slate-600' :
    days < 0              ? 'text-red-700' :
    days <= 3             ? 'text-amber-700' :
                            'text-emerald-700'

  return (
    <div className="space-y-4">
      {/* Payment status card */}
      <Card className={`border ${paymentColour} p-5`}>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Next payment
        </p>
        {nextPayment ? (
          <>
            <p className={`text-2xl font-bold ${paymentTextColour}`}>
              {fmtRand(nextPayment.amount)}
            </p>
            <p className={`mt-0.5 text-sm font-medium ${paymentTextColour}`}>
              {days === 0  ? 'Due today'                        :
               days === 1  ? 'Due tomorrow'                     :
               days! < 0   ? `${Math.abs(days!)} days overdue`  :
                             `Due in ${days} days (${fmtDate(nextPayment.due_date)})`}
            </p>
          </>
        ) : (
          <p className="text-sm text-slate-500">No outstanding payments</p>
        )}
      </Card>

      {/* Lease card */}
      <Card className="border border-slate-100 p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Lease details
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-50 px-3 py-2.5">
            <p className="text-xs text-slate-400">Property</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-900 leading-tight">{property.name}</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2.5">
            <p className="text-xs text-slate-400">Monthly rent</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-900">{fmtRand(tenant.monthly_rent)}</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2.5">
            <p className="text-xs text-slate-400">Lease start</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-900">{fmtDate(tenant.lease_start)}</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2.5">
            <p className="text-xs text-slate-400">Lease end</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-900">
              {tenant.lease_end ? fmtDate(tenant.lease_end) : 'Month-to-month'}
            </p>
          </div>
        </div>
      </Card>

      {/* Landlord card */}
      <Card className="border border-slate-100 p-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Your landlord
        </p>
        <p className="font-semibold text-slate-900">{landlord.full_name}</p>
        <div className="mt-2 flex gap-2">
          <a href={`mailto:${landlord.email}`}
            className="flex-1 rounded-xl bg-slate-100 py-2.5 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-200">
            ✉️ Email
          </a>
          {landlord.phone && (
            <a href={`tel:${landlord.phone}`}
              className="flex-1 rounded-xl bg-slate-100 py-2.5 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-200">
              📞 Call
            </a>
          )}
          {landlord.phone && (
            <a href={`https://wa.me/27${landlord.phone.replace(/^0/, '').replace(/\D/g, '')}`}
              target="_blank" rel="noreferrer"
              className="flex-1 rounded-xl bg-green-100 py-2.5 text-center text-sm font-medium text-green-800 transition hover:bg-green-200">
              💬 WhatsApp
            </a>
          )}
        </div>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onNavigate('maintenance')}
          className="rounded-2xl bg-amber-500 p-5 text-left transition active:scale-95"
        >
          <p className="text-2xl">🔧</p>
          <p className="mt-2 font-semibold text-white">Report Issue</p>
          <p className="text-xs text-amber-100">Maintenance request</p>
        </button>
        <button
          onClick={() => onNavigate('queries')}
          className="rounded-2xl bg-blue-600 p-5 text-left transition active:scale-95"
        >
          <p className="text-2xl">💬</p>
          <p className="mt-2 font-semibold text-white">Ask Landlord</p>
          <p className="text-xs text-blue-200">Send a query</p>
        </button>
        <button
          onClick={() => onNavigate('payments')}
          className="rounded-2xl bg-emerald-600 p-5 text-left transition active:scale-95"
        >
          <p className="text-2xl">💳</p>
          <p className="mt-2 font-semibold text-white">Payments</p>
          <p className="text-xs text-emerald-200">View history</p>
        </button>
        <button
          onClick={() => onNavigate('services')}
          className="rounded-2xl bg-violet-600 p-5 text-left transition active:scale-95"
        >
          <p className="text-2xl">⭐</p>
          <p className="mt-2 font-semibold text-white">Services</p>
          <p className="text-xs text-violet-200">Book local help</p>
        </button>
      </div>
    </div>
  )
}

// ─── PAYMENTS TAB ─────────────────────────────────────────────────────────────

function PaymentsTab({
  payments,
  token,
}: {
  payments: Payment[]
  token: string
}) {
  const [notifiedId, setNotifiedId] = useState<string | null>(null)
  const [notifying,  setNotifying]  = useState<string | null>(null)

  async function notifyPaid(paymentId: string) {
    setNotifying(paymentId)
    try {
      await fetch('/api/tenant/paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, payment_id: paymentId }),
      })
      setNotifiedId(paymentId)
    } finally {
      setNotifying(null)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-white/70">Payment history</p>

      {payments.length === 0 && (
        <Card className="border border-slate-100 p-8 text-center">
          <p className="text-slate-500">No payment records yet.</p>
        </Card>
      )}

      {payments.map((pmt) => {
        const overdue = pmt.status !== 'paid' && pmt.due_date < today
        const notified = notifiedId === pmt.id

        return (
          <Card
            key={pmt.id}
            className={`border p-4 ${
              overdue ? 'border-red-200 bg-red-50' :
              pmt.status === 'paid' ? 'border-slate-100' :
              'border-amber-200 bg-amber-50'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{fmtMonth(pmt.due_date)}</p>
                <p className="mt-0.5 text-xs text-slate-500">Due {fmtDate(pmt.due_date)}</p>
                {pmt.paid_date && (
                  <p className="mt-0.5 text-xs text-emerald-600">Paid {fmtDate(pmt.paid_date)}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-base font-bold text-slate-900">{fmtRand(pmt.amount)}</p>
                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  pmt.status === 'paid'   ? 'bg-emerald-100 text-emerald-700' :
                  pmt.status === 'late'   ? 'bg-amber-100 text-amber-700' :
                                            'bg-red-100 text-red-700'
                }`}>
                  {pmt.status === 'paid' ? '✓ Paid' : overdue ? '⚠ Overdue' : '⏳ Unpaid'}
                </span>
              </div>
            </div>

            {/* "I paid" button for unpaid */}
            {pmt.status !== 'paid' && (
              <button
                disabled={notifying === pmt.id || notified}
                onClick={() => notifyPaid(pmt.id)}
                className={`mt-3 w-full rounded-xl py-2.5 text-sm font-semibold transition ${
                  notified
                    ? 'bg-emerald-100 text-emerald-700 cursor-default'
                    : 'bg-slate-900 text-white hover:bg-slate-700 active:scale-95'
                }`}
              >
                {notified          ? '✓ Landlord notified' :
                 notifying === pmt.id ? 'Notifying…' :
                                    '✓ I have paid — notify landlord'}
              </button>
            )}
          </Card>
        )
      })}
    </div>
  )
}

// ─── MAINTENANCE TAB ──────────────────────────────────────────────────────────

function MaintenanceTab({
  queries,
  onSubmit,
  token,
}: {
  queries: TenantQuery[]
  onSubmit: (q: TenantQuery) => void
  token: string
}) {
  const [view,        setView]        = useState<'list' | 'new'>('list')
  const [category,    setCategory]    = useState('')
  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [urgency,     setUrgency]     = useState<'low' | 'medium' | 'high'>('medium')
  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [success,     setSuccess]     = useState(false)

  async function submit() {
    if (!title.trim() || !description.trim()) return
    setSubmitting(true)
    setError(null)

    const res = await fetch('/api/queries', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        token,
        category:    'maintenance' as QueryCategory,
        subcategory: category || undefined,
        title:       title.trim(),
        description: `[${urgency.toUpperCase()} URGENCY] ${description.trim()}`,
      }),
    })

    const json = await res.json()
    setSubmitting(false)

    if (!res.ok) { setError(json.error ?? 'Failed to submit'); return }

    onSubmit({
      id: json.query.id, tenant_id: '', category: 'maintenance',
      subcategory: category || null, title: title.trim(),
      description: `[${urgency.toUpperCase()} URGENCY] ${description.trim()}`,
      status: 'open', landlord_notes: null,
      created_at: json.query.created_at, updated_at: json.query.created_at,
    })

    setSuccess(true)
    setTitle(''); setDescription(''); setCategory(''); setUrgency('medium')
    setView('list')
  }

  if (success && view === 'list') {
    return (
      <div className="space-y-3">
        <SuccessBanner message="Maintenance request submitted. Your landlord has been notified." onClose={() => setSuccess(false)} />
        <MaintenanceList queries={queries} onNew={() => setView('new')} />
      </div>
    )
  }

  if (view === 'new') {
    return (
      <div className="space-y-3">
        <button onClick={() => setView('list')} className="text-sm text-white/60 hover:text-white">← Back</button>

        <Card className="border border-slate-100 p-5">
          <p className="mb-4 font-semibold text-slate-900">Report a maintenance issue</p>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-600">Category</label>
              <div className="grid grid-cols-2 gap-2">
                {MAINTENANCE_CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setCategory(c.value)}
                    className={`rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                      category === c.value
                        ? 'border-amber-400 bg-amber-50 font-medium text-amber-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">
                Brief summary <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-amber-400 focus:outline-none"
                placeholder="e.g. Geyser leaking under basin"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-amber-400 focus:outline-none"
                rows={3}
                placeholder="When did it start? How bad is it?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-slate-600">Urgency</label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as const).map((u) => (
                  <button
                    key={u}
                    onClick={() => setUrgency(u)}
                    className={`flex-1 rounded-xl py-2.5 text-sm font-medium capitalize transition ${
                      urgency === u
                        ? u === 'high'   ? 'bg-red-600 text-white'
                          : u === 'medium' ? 'bg-amber-500 text-white'
                          :                  'bg-slate-600 text-white'
                        : 'border border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {u === 'high' ? '🔴' : u === 'medium' ? '🟡' : '🟢'} {u}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              disabled={submitting || !title.trim() || !description.trim()}
              onClick={submit}
              className="w-full rounded-xl bg-amber-500 py-3 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-50 active:scale-95"
            >
              {submitting ? 'Submitting…' : 'Submit Request'}
            </button>
          </div>
        </Card>
      </div>
    )
  }

  return <MaintenanceList queries={queries} onNew={() => setView('new')} />
}

function MaintenanceList({ queries, onNew }: { queries: TenantQuery[]; onNew: () => void }) {
  return (
    <div className="space-y-3">
      <button
        onClick={onNew}
        className="w-full rounded-2xl bg-amber-500 py-4 text-base font-semibold text-white transition hover:bg-amber-600 active:scale-95"
      >
        🔧 Report New Issue
      </button>

      {queries.length === 0 ? (
        <Card className="border border-slate-100 p-8 text-center">
          <p className="text-sm text-slate-500">No maintenance requests yet.</p>
        </Card>
      ) : (
        queries.map((q) => {
          const st = QUERY_STATUS[q.status]
          return (
            <Card key={q.id} className="border border-slate-100 p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-slate-900 leading-tight">{q.title}</p>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${st.cls}`}>
                  {st.label}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{fmtDate(q.created_at)}</p>
              {q.landlord_notes && (
                <div className="mt-2 rounded-xl bg-blue-50 px-3 py-2 text-xs text-blue-700">
                  <span className="font-semibold">Landlord: </span>{q.landlord_notes}
                </div>
              )}
            </Card>
          )
        })
      )}
    </div>
  )
}

// ─── SERVICES TAB ─────────────────────────────────────────────────────────────

function ServicesTab({
  categories,
  providers,
  tenantId,
  propertyId,
  selectedCatId,
  onSelectCat,
}: {
  categories: ServiceCategory[]
  providers: ServiceProvider[]
  tenantId: string
  propertyId: string
  selectedCatId: string | null
  onSelectCat: (id: string | null) => void
}) {
  const [bookingProviderId, setBookingProviderId] = useState<string | null>(null)
  const [bookedIds, setBookedIds] = useState<Set<string>>(new Set())
  const [bookingDate, setBookingDate] = useState('')
  const [bookingNotes, setBookingNotes] = useState('')
  const [booking, setBooking] = useState(false)
  const [bookError, setBookError] = useState<string | null>(null)

  const visibleProviders = selectedCatId
    ? providers.filter((p) => p.category_id === selectedCatId)
    : []

  async function submitBooking(providerId: string) {
    if (!bookingDate) { setBookError('Please select a date'); return }
    setBooking(true)
    setBookError(null)
    try {
      const res = await fetch('/api/service-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider_id:    providerId,
          property_id:    propertyId,
          tenant_id:      tenantId,
          scheduled_date: bookingDate,
          notes:          bookingNotes || undefined,
        }),
      })
      if (!res.ok) { const j = await res.json(); setBookError(j.error ?? 'Booking failed'); return }
      setBookedIds((s) => { const n = new Set(s); n.add(providerId); return n })
      setBookingProviderId(null)
      setBookingDate('')
      setBookingNotes('')
    } catch {
      setBookError('Network error. Please try again.')
    } finally {
      setBooking(false)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-white/70">Book local services</p>

      {/* Category selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelectCat(selectedCatId === cat.id ? null : cat.id)}
            className={`flex shrink-0 flex-col items-center gap-1 rounded-xl px-4 py-3 text-xs font-medium transition ${
              selectedCatId === cat.id
                ? 'bg-violet-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="text-xl">{cat.icon ?? '📦'}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Providers */}
      {selectedCatId && (
        <div className="space-y-3">
          {visibleProviders.length === 0 ? (
            <Card className="border border-slate-100 p-8 text-center">
              <p className="text-sm text-slate-500">No providers available in your area yet.</p>
            </Card>
          ) : (
            visibleProviders.map((prov) => {
              const isBooked = bookedIds.has(prov.id)
              const isBooking = bookingProviderId === prov.id

              return (
                <Card key={prov.id} className="border border-slate-100 overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{prov.name}</p>
                        <p className="text-xs text-slate-500">📍 {prov.area ?? prov.province ?? '—'}</p>
                        {prov.rate_description && (
                          <p className="mt-1 text-xs font-medium text-violet-700">{prov.rate_description}</p>
                        )}
                      </div>
                      {isBooked ? (
                        <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                          ✓ Requested
                        </span>
                      ) : (
                        <button
                          onClick={() => setBookingProviderId(isBooking ? null : prov.id)}
                          className="shrink-0 rounded-xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-violet-700"
                        >
                          📅 Book
                        </button>
                      )}
                    </div>

                    {prov.whatsapp && (
                      <a
                        href={`https://wa.me/27${prov.whatsapp.replace(/^0/, '').replace(/\D/g, '')}`}
                        target="_blank" rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-green-700 hover:underline"
                      >
                        💬 WhatsApp provider
                      </a>
                    )}
                  </div>

                  {/* Inline booking form */}
                  {isBooking && !isBooked && (
                    <div className="border-t border-slate-100 bg-slate-50 p-4 space-y-3">
                      <p className="text-xs font-semibold text-slate-700">Book {prov.name}</p>
                      <div>
                        <label className="mb-1 block text-xs text-slate-500">Preferred date</label>
                        <input
                          type="date"
                          min={new Date().toISOString().split('T')[0]}
                          value={bookingDate}
                          onChange={(e) => setBookingDate(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-slate-500">Notes (optional)</label>
                        <textarea
                          value={bookingNotes}
                          onChange={(e) => setBookingNotes(e.target.value)}
                          rows={2}
                          className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
                          placeholder="Any special requirements…"
                        />
                      </div>
                      {bookError && <p className="text-xs text-red-600">{bookError}</p>}
                      <button
                        disabled={booking || !bookingDate}
                        onClick={() => submitBooking(prov.id)}
                        className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
                      >
                        {booking ? 'Booking…' : 'Confirm Request'}
                      </button>
                    </div>
                  )}
                </Card>
              )
            })
          )}
        </div>
      )}

      {!selectedCatId && (
        <Card className="border border-slate-100 p-8 text-center">
          <p className="text-sm text-slate-500">Select a service category above to see providers.</p>
        </Card>
      )}
    </div>
  )
}

// ─── QUERIES TAB ─────────────────────────────────────────────────────────────

function QueriesTab({
  queries,
  onSubmit,
  token,
}: {
  queries: TenantQuery[]
  onSubmit: (q: TenantQuery) => void
  token: string
}) {
  const [view,        setView]        = useState<'list' | 'new'>('list')
  const [category,    setCategory]    = useState<'emergency' | 'general'>('general')
  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [success,     setSuccess]     = useState(false)

  async function submit() {
    if (!title.trim() || !description.trim()) return
    setSubmitting(true)
    setError(null)

    const res = await fetch('/api/queries', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ token, category, title: title.trim(), description: description.trim() }),
    })

    const json = await res.json()
    setSubmitting(false)

    if (!res.ok) { setError(json.error ?? 'Failed to submit'); return }

    onSubmit({
      id: json.query.id, tenant_id: '', category,
      subcategory: null, title: title.trim(), description: description.trim(),
      status: 'open', landlord_notes: null,
      created_at: json.query.created_at, updated_at: json.query.created_at,
    })

    setSuccess(true)
    setTitle(''); setDescription(''); setView('list')
  }

  if (view === 'new') {
    return (
      <div className="space-y-3">
        <button onClick={() => setView('list')} className="text-sm text-white/60 hover:text-white">← Back</button>

        <Card className="border border-slate-100 p-5">
          <p className="mb-4 font-semibold text-slate-900">Submit a query</p>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setCategory('emergency')}
                className={`rounded-xl border py-3 text-sm font-semibold transition ${
                  category === 'emergency'
                    ? 'border-red-400 bg-red-50 text-red-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                🚨 Emergency
              </button>
              <button
                onClick={() => setCategory('general')}
                className={`rounded-xl border py-3 text-sm font-semibold transition ${
                  category === 'general'
                    ? 'border-blue-400 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                💬 General
              </button>
            </div>

            {category === 'emergency' && (
              <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                ⚠ For life-threatening emergencies, call <strong>10111</strong> (police) or <strong>10177</strong> (ambulance) first.
              </div>
            )}

            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
              placeholder="Brief summary"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <textarea
              className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
              rows={3}
              placeholder="Describe your query in detail…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              disabled={submitting || !title.trim() || !description.trim()}
              onClick={submit}
              className={`w-full rounded-xl py-3 text-sm font-semibold text-white transition disabled:opacity-50 active:scale-95 ${
                category === 'emergency' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {submitting ? 'Submitting…' : 'Send Query'}
            </button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {success && (
        <SuccessBanner message="Query submitted — your landlord has been notified." onClose={() => setSuccess(false)} />
      )}

      <button
        onClick={() => setView('new')}
        className="w-full rounded-2xl bg-blue-600 py-4 text-base font-semibold text-white transition hover:bg-blue-700 active:scale-95"
      >
        💬 New Query
      </button>

      {queries.length === 0 ? (
        <Card className="border border-slate-100 p-8 text-center">
          <p className="text-sm text-slate-500">No queries yet.</p>
        </Card>
      ) : (
        queries.map((q) => {
          const st = QUERY_STATUS[q.status]
          const isEmergency = q.category === 'emergency'
          return (
            <Card
              key={q.id}
              className={`border p-4 ${isEmergency ? 'border-red-200 bg-red-50' : 'border-slate-100'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-900 leading-tight">
                    {isEmergency ? '🚨 ' : ''}{q.title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">{fmtDate(q.created_at)}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${st.cls}`}>
                  {st.label}
                </span>
              </div>
              {q.landlord_notes && (
                <div className="mt-2 rounded-xl bg-blue-50 px-3 py-2 text-xs text-blue-700">
                  <span className="font-semibold">Landlord: </span>{q.landlord_notes}
                </div>
              )}
            </Card>
          )
        })
      )}
    </div>
  )
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function SuccessBanner({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
      <p className="text-sm font-medium text-emerald-800">✓ {message}</p>
      <button onClick={onClose} className="shrink-0 text-emerald-500 hover:text-emerald-700">✕</button>
    </div>
  )
}
