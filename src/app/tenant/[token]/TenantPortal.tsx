"use client";

import { useEffect, useState } from "react";
import { ObligationStatusBadge } from "@/components/ObligationStatusBadge";
import type {
  TenantQuery,
  RentObligation,
  PaymentAttempt,
  QueryCategory,
  QueryStatus,
} from "@/lib/types";

// A rent obligation plus its most recent payment attempt (if any) — the
// tenant-visible payment status comes from the attempt, not the obligation.
type ObligationWithAttempt = RentObligation & {
  latest_attempt: PaymentAttempt | null;
};

// ─── Types ────────────────────────────────────────────────────────────────────

type TenantInfo = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  monthly_rent: number;
  lease_start: string;
  lease_end: string | null;
  portal_token: string;
};

type PropertyInfo = {
  id: string;
  name: string;
  address: string;
  province: string | null;
};

type LandlordInfo = {
  full_name: string;
  email: string;
  phone: string | null;
};

type ServiceCategory = {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
};

type ServiceProvider = {
  id: string;
  category_id: string;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  area: string | null;
  province: string | null;
  rate_description: string | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = [
  { id: "home", label: "Home", icon: "🏠" },
  { id: "payments", label: "Payments", icon: "💳" },
  { id: "lease", label: "Lease", icon: "📄" },
  { id: "maintenance", label: "Maintenance", icon: "🔧" },
  { id: "documents", label: "Documents", icon: "📁" },
  { id: "services", label: "Services", icon: "⭐" },
  { id: "queries", label: "Queries", icon: "💬" },
] as const;

type TabId = (typeof TABS)[number]["id"];

type LeaseInfo = {
  id: string;
  lease_start: string;
  lease_end: string | null;
  monthly_rent: number;
  deposit_amount: number | null;
  payment_due_day: number;
  notice_period_days: number;
  pet_allowed: boolean;
  subletting_allowed: boolean;
  special_conditions: string | null;
  status: string;
  landlord_signed_at: string | null;
  tenant_signed_at: string | null;
};

const MAINTENANCE_CATEGORIES = [
  { value: "plumbing", label: "🚿 Plumbing" },
  { value: "electrical", label: "⚡ Electrical" },
  { value: "appliances", label: "🔌 Appliances" },
  { value: "doors_windows", label: "🚪 Doors / Windows" },
  { value: "garden", label: "🌿 Garden" },
  { value: "other", label: "🔨 Other" },
];

const QUERY_STATUS: Record<QueryStatus, { label: string; cls: string }> = {
  open: { label: "Open", cls: "bg-amber-100 text-amber-700" },
  in_progress: { label: "In Progress", cls: "bg-blue-100 text-blue-700" },
  resolved: { label: "Resolved", cls: "bg-emerald-100 text-emerald-700" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtRand(cents: number) {
  return `R${(cents / 100).toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtMonth(iso: string) {
  return new Date(iso).toLocaleDateString("en-ZA", {
    month: "short",
    year: "numeric",
  });
}

function daysUntil(iso: string) {
  const diff =
    new Date(iso).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
  return Math.round(diff / 86400000);
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TenantPortal({
  token,
  tenant,
  property,
  landlord,
  initialObligations,
  initialQueries,
  serviceCategories,
  serviceProviders,
  nextObligation,
  initialLease,
  devMode,
}: {
  token: string;
  tenant: TenantInfo;
  property: PropertyInfo;
  landlord: LandlordInfo;
  initialObligations: ObligationWithAttempt[];
  initialQueries: TenantQuery[];
  serviceCategories: ServiceCategory[];
  serviceProviders: ServiceProvider[];
  nextObligation: RentObligation | null;
  initialLease: LeaseInfo | null;
  devMode: boolean;
}) {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [queries, setQueries] = useState<TenantQuery[]>(initialQueries);
  const [lease, setLease] = useState<LeaseInfo | null>(initialLease);
  const [selectedServiceCat, setSelectedServiceCat] = useState<string | null>(
    null,
  );

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
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span className="text-base">{tab.icon}</span>
            <span className="hidden sm:block">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "home" && (
        <HomeTab
          tenant={tenant}
          property={property}
          landlord={landlord}
          nextObligation={nextObligation}
          onNavigate={setActiveTab}
        />
      )}
      {activeTab === "payments" && (
        <PaymentsTab
          obligations={initialObligations}
          token={token}
          devMode={devMode}
        />
      )}
      {activeTab === "lease" && (
        <LeaseTab
          lease={lease}
          token={token}
          tenantName={tenant.full_name}
          landlordName={landlord.full_name}
          propertyName={property.name}
          propertyAddress={property.address}
          onSigned={(updated) => setLease(updated)}
        />
      )}
      {activeTab === "maintenance" && (
        <MaintenanceTab
          queries={queries.filter((q) => q.category === "maintenance")}
          onSubmit={(q) => setQueries((prev) => [q, ...prev])}
          token={token}
        />
      )}
      {activeTab === "services" && (
        <ServicesTab
          categories={serviceCategories}
          providers={serviceProviders}
          tenantToken={token}
          propertyId={property.id}
          selectedCatId={selectedServiceCat}
          onSelectCat={setSelectedServiceCat}
        />
      )}
      {activeTab === "documents" && <DocumentsTab token={token} />}
      {activeTab === "queries" && (
        <QueriesTab
          queries={queries.filter((q) => q.category !== "maintenance")}
          onSubmit={(q) => setQueries((prev) => [q, ...prev])}
          token={token}
        />
      )}
    </div>
  );
}

// ─── HOME TAB ─────────────────────────────────────────────────────────────────

function HomeTab({
  tenant,
  property,
  landlord,
  nextObligation,
  onNavigate,
}: {
  tenant: TenantInfo;
  property: PropertyInfo;
  landlord: LandlordInfo;
  nextObligation: RentObligation | null;
  onNavigate: (tab: TabId) => void;
}) {
  const days = nextObligation ? daysUntil(nextObligation.due_date) : null;

  const paymentColour =
    days === null
      ? "bg-slate-50 border-slate-200"
      : days < 0
        ? "bg-red-50 border-red-200"
        : days <= 3
          ? "bg-amber-50 border-amber-200"
          : "bg-emerald-50 border-emerald-200";

  const paymentTextColour =
    days === null
      ? "text-slate-600"
      : days < 0
        ? "text-red-700"
        : days <= 3
          ? "text-amber-700"
          : "text-emerald-700";

  return (
    <div className="space-y-4">
      {/* Payment status card */}
      <Card className={`border ${paymentColour} p-5`}>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Next payment
        </p>
        {nextObligation ? (
          <>
            <p className={`text-2xl font-bold ${paymentTextColour}`}>
              {fmtRand(nextObligation.amount_due_cents - nextObligation.amount_paid_cents)}
            </p>
            <p className={`mt-0.5 text-sm font-medium ${paymentTextColour}`}>
              {days === 0
                ? "Due today"
                : days === 1
                  ? "Due tomorrow"
                  : days! < 0
                    ? `${Math.abs(days!)} days overdue`
                    : `Due in ${days} days (${fmtDate(nextObligation.due_date)})`}
            </p>
            <button
              onClick={() => onNavigate("payments")}
              className="mt-3 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 active:scale-95"
            >
              Pay rent →
            </button>
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
            <p className="mt-0.5 text-sm font-semibold text-slate-900 leading-tight">
              {property.name}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2.5">
            <p className="text-xs text-slate-400">Monthly rent</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-900">
              {fmtRand(tenant.monthly_rent)}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2.5">
            <p className="text-xs text-slate-400">Lease start</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-900">
              {fmtDate(tenant.lease_start)}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2.5">
            <p className="text-xs text-slate-400">Lease end</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-900">
              {tenant.lease_end ? fmtDate(tenant.lease_end) : "Month-to-month"}
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
          <a
            href={`mailto:${landlord.email}`}
            className="flex-1 rounded-xl bg-slate-100 py-2.5 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-200"
          >
            ✉️ Email
          </a>
          {landlord.phone && (
            <a
              href={`tel:${landlord.phone}`}
              className="flex-1 rounded-xl bg-slate-100 py-2.5 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-200"
            >
              📞 Call
            </a>
          )}
          {landlord.phone && (
            <a
              href={`https://wa.me/27${landlord.phone.replace(/^0/, "").replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 rounded-xl bg-green-100 py-2.5 text-center text-sm font-medium text-green-800 transition hover:bg-green-200"
            >
              💬 WhatsApp
            </a>
          )}
        </div>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onNavigate("maintenance")}
          className="rounded-2xl bg-amber-500 p-5 text-left transition active:scale-95"
        >
          <p className="text-2xl">🔧</p>
          <p className="mt-2 font-semibold text-white">Report Issue</p>
          <p className="text-xs text-amber-100">Maintenance request</p>
        </button>
        <button
          onClick={() => onNavigate("queries")}
          className="rounded-2xl bg-blue-600 p-5 text-left transition active:scale-95"
        >
          <p className="text-2xl">💬</p>
          <p className="mt-2 font-semibold text-white">Ask Landlord</p>
          <p className="text-xs text-blue-200">Send a query</p>
        </button>
        <button
          onClick={() => onNavigate("payments")}
          className="rounded-2xl bg-emerald-600 p-5 text-left transition active:scale-95"
        >
          <p className="text-2xl">💳</p>
          <p className="mt-2 font-semibold text-white">Payments</p>
          <p className="text-xs text-emerald-200">View history</p>
        </button>
        <button
          onClick={() => onNavigate("services")}
          className="rounded-2xl bg-violet-600 p-5 text-left transition active:scale-95"
        >
          <p className="text-2xl">⭐</p>
          <p className="mt-2 font-semibold text-white">Services</p>
          <p className="text-xs text-violet-200">Book local help</p>
        </button>
      </div>
    </div>
  );
}

// ─── PAYMENTS TAB ─────────────────────────────────────────────────────────────

function PaymentsTab({
  obligations: initialObligations,
  token,
  devMode,
}: {
  obligations: ObligationWithAttempt[];
  token: string;
  devMode: boolean;
}) {
  const [obligations, setObligations] =
    useState<ObligationWithAttempt[]>(initialObligations);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [simulatingId, setSimulatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePay(obligationId: string) {
    setPayingId(obligationId);
    setError(null);
    try {
      const res = await fetch(`/api/rent/obligations/${obligationId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to start payment");
        return;
      }
      setObligations((prev) =>
        prev.map((o) =>
          o.id === obligationId
            ? { ...o, status: "processing", latest_attempt: json.payment_attempt }
            : o,
        ),
      );
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setPayingId(null);
    }
  }

  async function handleSimulate(
    obligationId: string,
    attemptId: string,
    outcome: "succeeded" | "failed" | "cancelled",
  ) {
    setSimulatingId(attemptId);
    setError(null);
    try {
      const res = await fetch(
        `/api/rent/payment-attempts/${attemptId}/simulate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ outcome, token }),
        },
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Simulation failed");
        return;
      }
      setObligations((prev) =>
        prev.map((o) =>
          o.id === obligationId
            ? { ...o, ...json.obligation, latest_attempt: json.payment_attempt }
            : o,
        ),
      );
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSimulatingId(null);
    }
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-white/70">Rent payments</p>

      {error && (
        <Card className="border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </Card>
      )}

      {obligations.length === 0 && (
        <Card className="border border-slate-100 p-8 text-center">
          <p className="text-slate-500">No rent obligations yet.</p>
        </Card>
      )}

      {obligations.map((o) => {
        const overdue =
          o.status !== "paid" && o.status !== "waived" && o.due_date < today;
        const attempt = o.latest_attempt;
        const attemptInFlight =
          !!attempt && (attempt.status === "pending" || attempt.status === "processing");
        const outstanding = o.amount_due_cents - o.amount_paid_cents;
        const isPaying = payingId === o.id;
        const isRetry = attempt?.status === "failed" || attempt?.status === "cancelled";

        return (
          <Card
            key={o.id}
            className={`border p-4 ${
              overdue
                ? "border-red-200 bg-red-50"
                : o.status === "paid" || o.status === "waived"
                  ? "border-slate-100"
                  : "border-amber-200 bg-amber-50"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">
                  {fmtMonth(o.period_start)}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Due {fmtDate(o.due_date)}
                </p>
                {o.paid_at && (
                  <p className="mt-0.5 text-xs text-emerald-600">
                    Paid {fmtDate(o.paid_at)}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-base font-bold text-slate-900">
                  {fmtRand(o.amount_due_cents)}
                </p>
                <div className="mt-1 flex justify-end">
                  <ObligationStatusBadge status={o.status} />
                </div>
              </div>
            </div>

            {/* Action area */}
            {o.status === "paid" && (
              <button
                disabled
                className="mt-3 w-full cursor-not-allowed rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-400"
              >
                📄 Receipt (coming soon)
              </button>
            )}

            {o.status === "waived" && (
              <p className="mt-3 text-center text-xs text-slate-400">
                Waived by your landlord — nothing due.
              </p>
            )}

            {o.status !== "paid" && o.status !== "waived" && !attemptInFlight && (
              <button
                disabled={isPaying}
                onClick={() => handlePay(o.id)}
                className="mt-3 w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50 active:scale-95"
              >
                {isPaying
                  ? "Starting…"
                  : isRetry
                    ? `↻ Retry — pay ${fmtRand(outstanding)}`
                    : `Pay rent — ${fmtRand(outstanding)}`}
              </button>
            )}

            {attemptInFlight && (
              <div className="mt-3 rounded-xl bg-indigo-50 px-3 py-2.5 text-center text-sm font-medium text-indigo-700">
                ⏳{" "}
                {attempt!.status === "processing"
                  ? "Processing payment…"
                  : "Waiting for payment to complete…"}
              </div>
            )}

            {/* Dev-only: stands in for a provider's sandbox checkout */}
            {devMode && attemptInFlight && attempt && (
              <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Dev checkout — simulate provider response
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={simulatingId === attempt.id}
                    onClick={() => handleSimulate(o.id, attempt.id, "succeeded")}
                    className="flex-1 rounded-lg bg-emerald-600 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Succeed
                  </button>
                  <button
                    disabled={simulatingId === attempt.id}
                    onClick={() => handleSimulate(o.id, attempt.id, "failed")}
                    className="flex-1 rounded-lg bg-red-600 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                  >
                    Fail
                  </button>
                  <button
                    disabled={simulatingId === attempt.id}
                    onClick={() => handleSimulate(o.id, attempt.id, "cancelled")}
                    className="flex-1 rounded-lg border border-slate-300 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

// ─── MAINTENANCE TAB ──────────────────────────────────────────────────────────

function MaintenanceTab({
  queries,
  onSubmit,
  token,
}: {
  queries: TenantQuery[];
  onSubmit: (q: TenantQuery) => void;
  token: string;
}) {
  const [view, setView] = useState<"list" | "new">("list");
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState<"low" | "medium" | "high">("medium");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit() {
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/queries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        category: "maintenance" as QueryCategory,
        subcategory: category || undefined,
        title: title.trim(),
        description: `[${urgency.toUpperCase()} URGENCY] ${description.trim()}`,
      }),
    });

    const json = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(json.error ?? "Failed to submit");
      return;
    }

    onSubmit({
      id: json.query.id,
      tenant_id: "",
      category: "maintenance",
      subcategory: category || null,
      title: title.trim(),
      description: `[${urgency.toUpperCase()} URGENCY] ${description.trim()}`,
      status: "open",
      landlord_notes: null,
      created_at: json.query.created_at,
      updated_at: json.query.created_at,
    });

    setSuccess(true);
    setTitle("");
    setDescription("");
    setCategory("");
    setUrgency("medium");
    setView("list");
  }

  if (success && view === "list") {
    return (
      <div className="space-y-3">
        <SuccessBanner
          message="Maintenance request submitted. Your landlord has been notified."
          onClose={() => setSuccess(false)}
        />
        <MaintenanceList queries={queries} onNew={() => setView("new")} />
      </div>
    );
  }

  if (view === "new") {
    return (
      <div className="space-y-3">
        <button
          onClick={() => setView("list")}
          className="text-sm text-white/60 hover:text-white"
        >
          ← Back
        </button>

        <Card className="border border-slate-100 p-5">
          <p className="mb-4 font-semibold text-slate-900">
            Report a maintenance issue
          </p>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-600">
                Category
              </label>
              <div className="grid grid-cols-2 gap-2">
                {MAINTENANCE_CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setCategory(c.value)}
                    className={`rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                      category === c.value
                        ? "border-amber-400 bg-amber-50 font-medium text-amber-700"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
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
              <label className="mb-2 block text-xs font-medium text-slate-600">
                Urgency
              </label>
              <div className="flex gap-2">
                {(["low", "medium", "high"] as const).map((u) => (
                  <button
                    key={u}
                    onClick={() => setUrgency(u)}
                    className={`flex-1 rounded-xl py-2.5 text-sm font-medium capitalize transition ${
                      urgency === u
                        ? u === "high"
                          ? "bg-red-600 text-white"
                          : u === "medium"
                            ? "bg-amber-500 text-white"
                            : "bg-slate-600 text-white"
                        : "border border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {u === "high" ? "🔴" : u === "medium" ? "🟡" : "🟢"} {u}
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
              {submitting ? "Submitting…" : "Submit Request"}
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return <MaintenanceList queries={queries} onNew={() => setView("new")} />;
}

function MaintenanceList({
  queries,
  onNew,
}: {
  queries: TenantQuery[];
  onNew: () => void;
}) {
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
          const st = QUERY_STATUS[q.status];
          return (
            <Card key={q.id} className="border border-slate-100 p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-slate-900 leading-tight">
                  {q.title}
                </p>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${st.cls}`}
                >
                  {st.label}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {fmtDate(q.created_at)}
              </p>
              {q.landlord_notes && (
                <div className="mt-2 rounded-xl bg-blue-50 px-3 py-2 text-xs text-blue-700">
                  <span className="font-semibold">Landlord: </span>
                  {q.landlord_notes}
                </div>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}

// ─── SERVICES TAB ─────────────────────────────────────────────────────────────

function ServicesTab({
  categories,
  providers,
  tenantToken,
  propertyId,
  selectedCatId,
  onSelectCat,
}: {
  categories: ServiceCategory[];
  providers: ServiceProvider[];
  tenantToken: string;
  propertyId: string;
  selectedCatId: string | null;
  onSelectCat: (id: string | null) => void;
}) {
  const [bookingProviderId, setBookingProviderId] = useState<string | null>(
    null,
  );
  const [bookedIds, setBookedIds] = useState<Set<string>>(new Set());
  const [bookingDate, setBookingDate] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState<string | null>(null);

  const visibleProviders = selectedCatId
    ? providers.filter((p) => p.category_id === selectedCatId)
    : [];

  async function submitBooking(providerId: string) {
    if (!bookingDate) {
      setBookError("Please select a date");
      return;
    }
    setBooking(true);
    setBookError(null);
    try {
      const res = await fetch("/api/service-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_id: providerId,
          property_id: propertyId,
          tenant_token: tenantToken,
          scheduled_date: bookingDate,
          notes: bookingNotes || undefined,
        }),
      });
      if (!res.ok) {
        const j = await res.json();
        setBookError(j.error ?? "Booking failed");
        return;
      }
      setBookedIds((s) => {
        const n = new Set(s);
        n.add(providerId);
        return n;
      });
      setBookingProviderId(null);
      setBookingDate("");
      setBookingNotes("");
    } catch {
      setBookError("Network error. Please try again.");
    } finally {
      setBooking(false);
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
            onClick={() =>
              onSelectCat(selectedCatId === cat.id ? null : cat.id)
            }
            className={`flex shrink-0 flex-col items-center gap-1 rounded-xl px-4 py-3 text-xs font-medium transition ${
              selectedCatId === cat.id
                ? "bg-violet-600 text-white"
                : "bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <span className="text-xl">{cat.icon ?? "📦"}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Providers */}
      {selectedCatId && (
        <div className="space-y-3">
          {visibleProviders.length === 0 ? (
            <Card className="border border-slate-100 p-8 text-center">
              <p className="text-sm text-slate-500">
                No providers available in your area yet.
              </p>
            </Card>
          ) : (
            visibleProviders.map((prov) => {
              const isBooked = bookedIds.has(prov.id);
              const isBooking = bookingProviderId === prov.id;

              return (
                <Card
                  key={prov.id}
                  className="border border-slate-100 overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {prov.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          📍 {prov.area ?? prov.province ?? "—"}
                        </p>
                        {prov.rate_description && (
                          <p className="mt-1 text-xs font-medium text-violet-700">
                            {prov.rate_description}
                          </p>
                        )}
                      </div>
                      {isBooked ? (
                        <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                          ✓ Requested
                        </span>
                      ) : (
                        <button
                          onClick={() =>
                            setBookingProviderId(isBooking ? null : prov.id)
                          }
                          className="shrink-0 rounded-xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-violet-700"
                        >
                          📅 Book
                        </button>
                      )}
                    </div>

                    {prov.whatsapp && (
                      <a
                        href={`https://wa.me/27${prov.whatsapp.replace(/^0/, "").replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-green-700 hover:underline"
                      >
                        💬 WhatsApp provider
                      </a>
                    )}
                  </div>

                  {/* Inline booking form */}
                  {isBooking && !isBooked && (
                    <div className="border-t border-slate-100 bg-slate-50 p-4 space-y-3">
                      <p className="text-xs font-semibold text-slate-700">
                        Book {prov.name}
                      </p>
                      <div>
                        <label className="mb-1 block text-xs text-slate-500">
                          Preferred date
                        </label>
                        <input
                          type="date"
                          min={new Date().toISOString().split("T")[0]}
                          value={bookingDate}
                          onChange={(e) => setBookingDate(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-slate-500">
                          Notes (optional)
                        </label>
                        <textarea
                          value={bookingNotes}
                          onChange={(e) => setBookingNotes(e.target.value)}
                          rows={2}
                          className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
                          placeholder="Any special requirements…"
                        />
                      </div>
                      {bookError && (
                        <p className="text-xs text-red-600">{bookError}</p>
                      )}
                      <button
                        disabled={booking || !bookingDate}
                        onClick={() => submitBooking(prov.id)}
                        className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
                      >
                        {booking ? "Booking…" : "Confirm Request"}
                      </button>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      )}

      {!selectedCatId && (
        <Card className="border border-slate-100 p-8 text-center">
          <p className="text-sm text-slate-500">
            Select a service category above to see providers.
          </p>
        </Card>
      )}
    </div>
  );
}

// ─── QUERIES TAB ─────────────────────────────────────────────────────────────

function QueriesTab({
  queries,
  onSubmit,
  token,
}: {
  queries: TenantQuery[];
  onSubmit: (q: TenantQuery) => void;
  token: string;
}) {
  const [view, setView] = useState<"list" | "new">("list");
  const [category, setCategory] = useState<"emergency" | "general">("general");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit() {
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/queries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        category,
        title: title.trim(),
        description: description.trim(),
      }),
    });

    const json = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(json.error ?? "Failed to submit");
      return;
    }

    onSubmit({
      id: json.query.id,
      tenant_id: "",
      category,
      subcategory: null,
      title: title.trim(),
      description: description.trim(),
      status: "open",
      landlord_notes: null,
      created_at: json.query.created_at,
      updated_at: json.query.created_at,
    });

    setSuccess(true);
    setTitle("");
    setDescription("");
    setView("list");
  }

  if (view === "new") {
    return (
      <div className="space-y-3">
        <button
          onClick={() => setView("list")}
          className="text-sm text-white/60 hover:text-white"
        >
          ← Back
        </button>

        <Card className="border border-slate-100 p-5">
          <p className="mb-4 font-semibold text-slate-900">Submit a query</p>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setCategory("emergency")}
                className={`rounded-xl border py-3 text-sm font-semibold transition ${
                  category === "emergency"
                    ? "border-red-400 bg-red-50 text-red-700"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                🚨 Emergency
              </button>
              <button
                onClick={() => setCategory("general")}
                className={`rounded-xl border py-3 text-sm font-semibold transition ${
                  category === "general"
                    ? "border-blue-400 bg-blue-50 text-blue-700"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                💬 General
              </button>
            </div>

            {category === "emergency" && (
              <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                ⚠ For life-threatening emergencies, call <strong>10111</strong>{" "}
                (police) or <strong>10177</strong> (ambulance) first.
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
                category === "emergency"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {submitting ? "Submitting…" : "Send Query"}
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {success && (
        <SuccessBanner
          message="Query submitted — your landlord has been notified."
          onClose={() => setSuccess(false)}
        />
      )}

      <button
        onClick={() => setView("new")}
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
          const st = QUERY_STATUS[q.status];
          const isEmergency = q.category === "emergency";
          return (
            <Card
              key={q.id}
              className={`border p-4 ${isEmergency ? "border-red-200 bg-red-50" : "border-slate-100"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-900 leading-tight">
                    {isEmergency ? "🚨 " : ""}
                    {q.title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {fmtDate(q.created_at)}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${st.cls}`}
                >
                  {st.label}
                </span>
              </div>
              {q.landlord_notes && (
                <div className="mt-2 rounded-xl bg-blue-50 px-3 py-2 text-xs text-blue-700">
                  <span className="font-semibold">Landlord: </span>
                  {q.landlord_notes}
                </div>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}

// ─── LEASE TAB ────────────────────────────────────────────────────────────────

function LeaseTab({
  lease,
  token,
  tenantName,
  landlordName,
  propertyName,
  propertyAddress,
  onSigned,
}: {
  lease: LeaseInfo | null;
  token: string;
  tenantName: string;
  landlordName: string;
  propertyName: string;
  propertyAddress: string;
  onSigned: (l: LeaseInfo) => void;
}) {
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(!!lease?.tenant_signed_at);
  const [signErr, setSignErr] = useState<string | null>(null);

  if (!lease) {
    return (
      <Card className="border border-slate-100 p-8 text-center">
        <p className="text-2xl">📄</p>
        <p className="mt-3 font-semibold text-slate-700">
          No lease document available
        </p>
        <p className="mt-1 text-sm text-slate-400">
          Your landlord hasn&apos;t generated a lease yet.
        </p>
      </Card>
    );
  }

  async function signLease() {
    if (!lease) return;
    setSigning(true);
    setSignErr(null);
    try {
      const res = await fetch("/api/tenant/sign-lease", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, lease_id: lease.id }),
      });
      const json = await res.json();
      if (!res.ok) {
        setSignErr(json.error ?? "Failed to sign");
        return;
      }
      setSigned(true);
      onSigned(json.lease as LeaseInfo);
    } finally {
      setSigning(false);
    }
  }

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  function fmtRand(cents: number) {
    return `R${(cents / 100).toLocaleString("en-ZA", { minimumFractionDigits: 0 })}`;
  }
  function ordinal(n: number) {
    if (n === 1) return "1st";
    if (n === 2) return "2nd";
    if (n === 3) return "3rd";
    return `${n}th`;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-white/70">Lease agreement</p>
        <button
          onClick={() => window.print()}
          className="rounded-xl bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 transition hover:bg-white/20"
        >
          Print / PDF
        </button>
      </div>

      <Card className="border border-slate-100 p-5">
        <div className="border-b border-slate-100 pb-4 text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-slate-800">
            Residential Lease Agreement
          </p>
          <p className="mt-1 text-xs text-slate-400">Entered into between:</p>
        </div>

        <div className="mt-4 space-y-4 text-sm">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              Landlord
            </p>
            <p className="font-medium text-slate-900">{landlordName}</p>
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              Tenant
            </p>
            <p className="font-medium text-slate-900">{tenantName}</p>
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              Property
            </p>
            <p className="font-medium text-slate-900">{propertyName}</p>
            <p className="text-slate-500">{propertyAddress}</p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              Lease Terms
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-slate-400">Start date</p>
                <p className="font-medium text-slate-900">
                  {fmtDate(lease.lease_start)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">End date</p>
                <p className="font-medium text-slate-900">
                  {lease.lease_end
                    ? fmtDate(lease.lease_end)
                    : "Month-to-month"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Monthly rent</p>
                <p className="font-medium text-slate-900">
                  {fmtRand(lease.monthly_rent)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Deposit</p>
                <p className="font-medium text-slate-900">
                  {lease.deposit_amount ? fmtRand(lease.deposit_amount) : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Payment due</p>
                <p className="font-medium text-slate-900">
                  {ordinal(lease.payment_due_day)} of month
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Notice period</p>
                <p className="font-medium text-slate-900">
                  {lease.notice_period_days} days
                </p>
              </div>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              Tenant Obligations
            </p>
            <ol className="space-y-1 text-xs leading-relaxed text-slate-600">
              <li>1. Pay rent on or before the due date each month.</li>
              <li>2. Maintain the property in good and clean condition.</li>
              <li>3. Not make alterations without written landlord consent.</li>
              <li>4. Not sublet without written landlord consent.</li>
              <li>5. Comply with all body corporate rules where applicable.</li>
              <li>
                6. Give {lease.notice_period_days} days written notice of
                intention to vacate.
              </li>
            </ol>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              Landlord Obligations
            </p>
            <ol className="space-y-1 text-xs leading-relaxed text-slate-600">
              <li>1. Maintain the property in a habitable condition.</li>
              <li>
                2. Not enter without reasonable notice except in emergency.
              </li>
              <li>
                3. Return the deposit within 21 days of vacating subject to
                inspection.
              </li>
            </ol>
          </div>

          {lease.special_conditions && (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                Special Conditions
              </p>
              <p className="text-xs text-slate-600">
                {lease.special_conditions}
              </p>
            </div>
          )}
        </div>

        {/* Acceptance */}
        <div className="mt-6 border-t border-slate-100 pt-4">
          {signed || lease.tenant_signed_at ? (
            <div className="rounded-xl bg-emerald-50 px-4 py-3 text-center">
              <p className="text-sm font-semibold text-emerald-700">
                ✓ You accepted this lease on{" "}
                {fmtDate(lease.tenant_signed_at ?? new Date().toISOString())}
              </p>
            </div>
          ) : (
            <>
              {signErr && (
                <p className="mb-2 text-xs text-red-600">{signErr}</p>
              )}
              <button
                disabled={signing}
                onClick={signLease}
                className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50 active:scale-95"
              >
                {signing ? "Signing…" : "I have read and accept this lease"}
              </button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

// ─── DOCUMENTS TAB ───────────────────────────────────────────────────────────

type PortalDoc = {
  id: string;
  document_type: string;
  file_name: string;
  created_at: string;
  signed_url: string | null;
};

const PORTAL_DOC_TYPES = [
  { value: "id_document", label: "ID Document", description: "South African ID or passport" },
  { value: "bank_statement", label: "Bank Statement", description: "Last 3 months of statements" },
  { value: "proof_of_income", label: "Proof of Income", description: "Payslip or employment letter" },
] as const;

function DocumentsTab({ token }: { token: string }) {
  const [docs, setDocs] = useState<PortalDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function loadDocs() {
    setLoading(true);
    try {
      const res = await fetch(`/api/tenant/documents?token=${encodeURIComponent(token)}`);
      if (res.ok) {
        const json = await res.json();
        setDocs(json.documents ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleUpload(docType: string, file: File) {
    setUploading(docType);
    setUploadError(null);
    try {
      const form = new FormData();
      form.append("token", token);
      form.append("file", file);
      form.append("document_type", docType);
      const res = await fetch("/api/tenant/documents/upload", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) {
        setUploadError(json.error ?? "Upload failed");
        return;
      }
      await loadDocs();
    } catch {
      setUploadError("Network error. Please try again.");
    } finally {
      setUploading(null);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-white/70">Your documents</p>
      {loading ? (
        <Card className="border border-slate-100 p-8 flex justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
        </Card>
      ) : (
        <>
          {uploadError && (
            <Card className="border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">{uploadError}</p>
            </Card>
          )}
          {PORTAL_DOC_TYPES.map((dt) => {
            const existing = docs.find((d) => d.document_type === dt.value);
            const isUploading = uploading === dt.value;
            return (
              <Card key={dt.value} className="border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{dt.label}</p>
                    <p className="text-xs text-slate-500">{dt.description}</p>
                    {existing && (
                      <p className="mt-1 text-xs text-emerald-600">
                        Uploaded {new Date(existing.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      existing
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {existing ? "Uploaded" : "Not uploaded"}
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
                  {existing?.signed_url && (
                    <a
                      href={existing.signed_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 rounded-xl border border-slate-200 py-2.5 text-center text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      View
                    </a>
                  )}
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      className="hidden"
                      disabled={isUploading}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUpload(dt.value, f);
                        e.target.value = "";
                      }}
                    />
                    <span
                      className={`block w-full rounded-xl py-2.5 text-center text-xs font-semibold transition ${
                        isUploading
                          ? "cursor-not-allowed bg-slate-100 text-slate-400"
                          : existing
                            ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {isUploading ? "Uploading…" : existing ? "Re-upload" : "Upload"}
                    </span>
                  </label>
                </div>
              </Card>
            );
          })}
        </>
      )}
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function SuccessBanner({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
      <p className="text-sm font-medium text-emerald-800">✓ {message}</p>
      <button
        onClick={onClose}
        className="shrink-0 text-emerald-500 hover:text-emerald-700"
      >
        ✕
      </button>
    </div>
  );
}
