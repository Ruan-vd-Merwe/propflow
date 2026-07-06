"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { RiskBadge } from "@/components/RiskBadge";
import { ObligationStatusBadge } from "@/components/ObligationStatusBadge";
import { DocumentUploader } from "@/components/DocumentUploader";
import type { Payment, RentObligation, RiskScore } from "@/lib/types";

// A rent obligation plus which provider (if any) collected the successful
// payment — 'manual' means the landlord's own Mark paid, anything else
// (e.g. 'mock', later a real gateway) came through PropTrust.
type ObligationWithProvider = RentObligation & { paid_via_provider: string | null };

// ─── Types ────────────────────────────────────────────────────────────────────

type TenantDoc = {
  id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  notes: string | null;
  created_at: string;
};

type CommLog = {
  id: string;
  type: string;
  subject: string | null;
  status: string;
  sent_at: string;
};

type TenantInfo = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  monthly_rent: number;
  lease_start: string;
  lease_end: string | null;
};

type PropertyInfo = {
  id: string;
  name: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const DOC_TYPES = [
  { value: "id_document", label: "ID Document", colour: "bg-blue-100 text-blue-700" },
  { value: "bank_statement", label: "Bank Statement", colour: "bg-green-100 text-green-700" },
  { value: "lease_agreement", label: "Lease Agreement", colour: "bg-indigo-100 text-indigo-700" },
  { value: "proof_of_income", label: "Proof of Income", colour: "bg-amber-100 text-amber-700" },
  { value: "inspection_report", label: "Inspection Report", colour: "bg-purple-100 text-purple-700" },
  { value: "other", label: "Other", colour: "bg-slate-100 text-slate-600" },
] as const;

const WA_TEMPLATES = [
  { label: "Rent reminder", body: (t: TenantInfo) => `Hi ${t.full_name.split(" ")[0]}, this is a friendly reminder that your rent of R${(t.monthly_rent / 100).toLocaleString("en-ZA")} is due on the 1st. Please ensure payment is made on time.` },
  { label: "Payment overdue", body: (t: TenantInfo) => `Hi ${t.full_name.split(" ")[0]}, your rent payment of R${(t.monthly_rent / 100).toLocaleString("en-ZA")} is now overdue. Please make payment urgently to avoid further action.` },
  { label: "Lease renewal", body: (t: TenantInfo) => `Hi ${t.full_name.split(" ")[0]}, your lease is coming up for renewal. Please contact us to discuss renewal terms at your earliest convenience.` },
  { label: "Maintenance update", body: (t: TenantInfo) => `Hi ${t.full_name.split(" ")[0]}, we wanted to update you on your recent maintenance request. Please reply to discuss further.` },
  { label: "General notice", body: () => "" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRand(cents: number) {
  return `R ${(cents / 100).toLocaleString("en-ZA", { minimumFractionDigits: 0 })}`;
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPeriod(periodStart: string) {
  return new Date(periodStart).toLocaleDateString("en-ZA", {
    month: "long",
    year: "numeric",
  });
}

function formatSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function docTypeMeta(type: string) {
  return DOC_TYPES.find((d) => d.value === type) ?? DOC_TYPES[DOC_TYPES.length - 1];
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconWhatsApp({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

function IconX() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function FileTypeIcon({ mime }: { mime: string | null }) {
  if (mime?.includes("pdf")) return <div className="flex h-7 w-7 items-center justify-center rounded bg-red-100 text-xs font-bold text-red-600">PDF</div>;
  if (mime?.startsWith("image/")) return <div className="flex h-7 w-7 items-center justify-center rounded bg-blue-100 text-xs font-bold text-blue-600">IMG</div>;
  return <div className="flex h-7 w-7 items-center justify-center rounded bg-slate-100 text-xs font-bold text-slate-500">DOC</div>;
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function ScoreStat({ label, value, colour }: { label: string; value: number | string; colour: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3 text-center">
      <p className={`text-xl font-bold ${colour}`}>{value}</p>
      <p className="mt-0.5 text-xs text-slate-500">{label}</p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TenantPageClient({
  tenant,
  property,
  payments,
  risk,
  initialDocuments,
  initialCommsLog,
  initialObligations,
}: {
  tenant: TenantInfo;
  property: PropertyInfo;
  payments: Payment[];
  risk: RiskScore;
  initialDocuments: TenantDoc[];
  initialCommsLog: CommLog[];
  initialObligations: ObligationWithProvider[];
}) {
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<"payments" | "documents" | "messages">("payments");
  const [documents, setDocuments] = useState<TenantDoc[]>(initialDocuments);
  const [obligations, setObligations] = useState<ObligationWithProvider[]>(initialObligations);
  const [obligationActionId, setObligationActionId] = useState<string | null>(null);
  const [obligationError, setObligationError] = useState<string | null>(null);

  // WhatsApp panel
  const [waOpen, setWaOpen] = useState(false);
  const [waMessage, setWaMessage] = useState("");
  const [waSending, setWaSending] = useState(false);
  const [waSuccess, setWaSuccess] = useState<string | null>(null);
  const [waError, setWaError] = useState<string | null>(null);

  // Document upload modal
  const [docUploadOpen, setDocUploadOpen] = useState(false);
  const [docType, setDocType] = useState("id_document");
  const [docDeleting, setDocDeleting] = useState<string | null>(null);

  const paid = payments.filter((p) => p.status === "paid").length;
  const late = payments.filter((p) => p.status === "late").length;
  const missed = payments.filter((p) => p.status === "missed").length;

  async function sendWhatsApp() {
    if (!waMessage.trim()) return;
    setWaSending(true);
    setWaError(null);
    setWaSuccess(null);
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenant.id, message: waMessage }),
      });
      const json = await res.json();
      if (!res.ok) {
        setWaError(json.error ?? "Failed to send");
      } else {
        setWaSuccess(`WhatsApp sent to ${tenant.phone}`);
        setWaMessage("");
        setTimeout(() => setWaOpen(false), 2000);
      }
    } catch {
      setWaError("Network error. Please try again.");
    } finally {
      setWaSending(false);
    }
  }

  async function handleObligationAction(
    obligation: ObligationWithProvider,
    action: "mark_paid" | "waive",
  ) {
    setObligationActionId(obligation.id);
    setObligationError(null);
    try {
      const res = await fetch(`/api/rent/obligations/${obligation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok) {
        setObligationError(json.error ?? "Failed to update obligation");
        return;
      }
      setObligations((prev) =>
        prev.map((o) =>
          o.id === obligation.id
            ? { ...json.obligation, paid_via_provider: null } // manual action, not via a provider
            : o,
        ),
      );
    } catch {
      setObligationError("Network error. Please try again.");
    } finally {
      setObligationActionId(null);
    }
  }

  async function handleViewDoc(doc: TenantDoc) {
    const { data } = await supabase.storage
      .from("documents")
      .createSignedUrl(doc.file_url, 3600);
    window.open(data?.signedUrl ?? doc.file_url, "_blank");
  }

  async function handleDeleteDoc(doc: TenantDoc) {
    if (!confirm(`Delete "${doc.file_name}"?`)) return;
    setDocDeleting(doc.id);
    try {
      const res = await fetch(`/api/documents/${doc.id}`, { method: "DELETE" });
      if (res.ok) setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    } finally {
      setDocDeleting(null);
    }
  }

  return (
    <>
      {/* Tenant header card */}
      <div className="card mb-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-200 text-lg font-bold text-slate-600">
              {tenant.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{tenant.full_name}</h1>
              <p className="text-sm text-slate-500">{tenant.email}</p>
              {tenant.phone && <p className="text-sm text-slate-500">{tenant.phone}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {tenant.phone && (
              <button
                onClick={() => setWaOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-green-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-600"
              >
                <IconWhatsApp className="h-4 w-4" />
                Send WhatsApp
              </button>
            )}
            <RiskBadge risk={risk} size="lg" />
          </div>
        </div>

        {/* Details grid */}
        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-4">
          <Detail label="Monthly rent" value={formatRand(tenant.monthly_rent)} />
          <Detail label="Lease start" value={formatDate(tenant.lease_start)} />
          <Detail label="Lease end" value={formatDate(tenant.lease_end)} />
          <Detail label="Property" value={property.name} />
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1">
        {(["payments", "documents", "messages"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition ${
              activeTab === tab
                ? "bg-blue-600 text-white"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Payments tab */}
      {activeTab === "payments" && (
        <>
          {/* Risk breakdown */}
          <div className="card mb-6 p-6">
            <h2 className="mb-4 font-semibold text-slate-900">Risk Score Breakdown</h2>
            <div className="mb-4 flex items-end gap-3">
              <span className="text-5xl font-bold text-slate-900">{risk.score}</span>
              <span className="mb-1 text-lg text-slate-400">/ 100</span>
            </div>
            <div className="mb-5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all ${
                  risk.colour === "green" ? "bg-emerald-500" : risk.colour === "amber" ? "bg-amber-500" : "bg-red-500"
                }`}
                style={{ width: `${risk.score}%` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <ScoreStat label="On-time" value={paid} colour="text-emerald-600" />
              <ScoreStat label="Late" value={late} colour={late > 0 ? "text-amber-600" : "text-slate-400"} />
              <ScoreStat label="Missed" value={missed} colour={missed > 0 ? "text-red-600" : "text-slate-400"} />
              <ScoreStat label="Streak bonus" value={`+${risk.breakdown.streak * 10}`} colour={risk.breakdown.streak > 0 ? "text-emerald-600" : "text-slate-400"} />
            </div>
          </div>

          {/* Rent obligation timeline */}
          <div className="card overflow-hidden">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="font-semibold text-slate-900">
                Rent Ledger
                <span className="ml-2 text-sm font-normal text-slate-400">{obligations.length} periods</span>
              </h2>
            </div>
            {obligationError && (
              <p className="border-b border-red-100 bg-red-50 px-6 py-2 text-sm text-red-600">
                {obligationError}
              </p>
            )}
            {obligations.length === 0 ? (
              <div className="p-12 text-center text-slate-500">No rent obligations generated yet.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                <div className="grid grid-cols-[1fr_1fr_1fr_100px_180px] px-6 py-2 text-xs font-medium uppercase tracking-wider text-slate-400">
                  <span>Period</span>
                  <span>Due date</span>
                  <span>Amount due / paid</span>
                  <span>Status</span>
                  <span></span>
                </div>
                {obligations.map((o) => {
                  const actionable = o.status !== "paid" && o.status !== "waived";
                  const isLoading = obligationActionId === o.id;
                  return (
                    <div
                      key={o.id}
                      className="grid grid-cols-[1fr_1fr_1fr_100px_180px] items-center px-6 py-3.5"
                    >
                      <span className="text-sm text-slate-700">{formatPeriod(o.period_start)}</span>
                      <span className="text-sm text-slate-700">{formatDate(o.due_date)}</span>
                      <span className="text-sm font-medium text-slate-900">
                        {formatRand(o.amount_due_cents)}
                        {o.amount_paid_cents > 0 && o.amount_paid_cents !== o.amount_due_cents && (
                          <span className="ml-1 text-xs text-slate-400">
                            ({formatRand(o.amount_paid_cents)} paid)
                          </span>
                        )}
                      </span>
                      <div className="flex flex-col items-start gap-1">
                        <ObligationStatusBadge status={o.status} />
                        {o.paid_via_provider && o.paid_via_provider !== "manual" && (
                          <span className="inline-flex items-center rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                            ⚡ Paid through PropTrust
                          </span>
                        )}
                      </div>
                      <div className="flex justify-end gap-2">
                        {actionable && (
                          <>
                            <button
                              onClick={() => handleObligationAction(o, "mark_paid")}
                              disabled={isLoading}
                              className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                            >
                              {isLoading ? "…" : "Mark paid"}
                            </button>
                            <button
                              onClick={() => handleObligationAction(o, "waive")}
                              disabled={isLoading}
                              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                            >
                              Waive
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Documents tab */}
      {activeTab === "documents" && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h2 className="font-semibold text-slate-900">
              Documents
              <span className="ml-2 text-sm font-normal text-slate-400">{documents.length} files</span>
            </h2>
            <button
              onClick={() => setDocUploadOpen(true)}
              className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
            >
              Upload document
            </button>
          </div>

          {/* Upload modal inline */}
          {docUploadOpen && (
            <div className="border-b border-slate-100 bg-slate-50 p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">Upload for {tenant.full_name}</p>
                <button onClick={() => setDocUploadOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <IconX />
                </button>
              </div>
              <div className="mb-3">
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Document type</label>
                <select className="input-field" value={docType} onChange={(e) => setDocType(e.target.value)}>
                  {DOC_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <DocumentUploader
                documentType={docType}
                tenantId={tenant.id}
                propertyId={property.id}
                onUploadComplete={(doc) => {
                  setDocuments((prev) => [
                    {
                      ...doc,
                      document_type: docType,
                      file_size: null,
                      mime_type: null,
                      notes: null,
                      created_at: new Date().toISOString(),
                    },
                    ...prev,
                  ]);
                  setDocUploadOpen(false);
                }}
              />
            </div>
          )}

          {documents.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No documents yet.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {documents.map((doc) => {
                const meta = docTypeMeta(doc.document_type);
                return (
                  <div key={doc.id} className="flex items-center gap-3 px-6 py-3.5">
                    <FileTypeIcon mime={doc.mime_type} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">{doc.file_name}</p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta.colour}`}>{meta.label}</span>
                        <span className="text-xs text-slate-400">{formatSize(doc.file_size)}</span>
                        <span className="text-xs text-slate-400">{formatDate(doc.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleViewDoc(doc)} className="rounded-lg px-2 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50">View</button>
                      <button
                        onClick={() => handleDeleteDoc(doc)}
                        disabled={docDeleting === doc.id}
                        className="rounded-lg px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        {docDeleting === doc.id ? "…" : "Delete"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Messages tab */}
      {activeTab === "messages" && (
        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="font-semibold text-slate-900">
              Message History
              <span className="ml-2 text-sm font-normal text-slate-400">{initialCommsLog.length} messages</span>
            </h2>
          </div>
          {initialCommsLog.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No messages sent yet.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {initialCommsLog.map((log) => {
                const isWa = log.type.includes("whatsapp");
                return (
                  <div key={log.id} className="flex items-start gap-4 px-6 py-4">
                    <div
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        isWa ? "bg-green-100" : "bg-blue-100"
                      }`}
                    >
                      {isWa ? (
                        <IconWhatsApp className="h-4 w-4 text-green-600" />
                      ) : (
                        <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-slate-700">
                        {log.subject ?? log.type.replace(/_/g, " ")}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">{formatDateTime(log.sent_at)}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                        log.status === "sent" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* WhatsApp slide-over panel */}
      {waOpen && (
        <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/30">
          <div className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <IconWhatsApp className="h-5 w-5 text-green-500" />
                <h2 className="font-semibold text-slate-900">Send WhatsApp</h2>
              </div>
              <button onClick={() => { setWaOpen(false); setWaMessage(""); setWaSuccess(null); setWaError(null); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <IconX />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {/* Tenant info */}
              <div className="mb-4 rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-sm font-semibold text-slate-800">{tenant.full_name}</p>
                <p className="text-xs text-slate-500">{tenant.phone}</p>
              </div>

              {/* Template pills */}
              <p className="mb-2 text-xs font-medium text-slate-500">Quick templates</p>
              <div className="mb-4 flex flex-wrap gap-2">
                {WA_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.label}
                    onClick={() => setWaMessage(tpl.body(tenant))}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-green-400 hover:bg-green-50 hover:text-green-700"
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>

              {/* Textarea */}
              <textarea
                rows={6}
                value={waMessage}
                onChange={(e) => setWaMessage(e.target.value.slice(0, 1000))}
                placeholder="Type your message…"
                className="input-field w-full resize-none"
              />
              <div className="mt-1 text-right text-xs text-slate-400">{waMessage.length} / 1000</div>

              {waError && <p className="mt-2 text-sm text-red-600">{waError}</p>}
              {waSuccess && <p className="mt-2 text-sm text-green-600">{waSuccess}</p>}
            </div>

            <div className="border-t border-slate-100 px-6 py-4 flex gap-3">
              <button
                onClick={() => { setWaOpen(false); setWaMessage(""); setWaError(null); setWaSuccess(null); }}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={sendWhatsApp}
                disabled={waSending || !waMessage.trim()}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-green-500 py-2.5 text-sm font-semibold text-white transition hover:bg-green-600 disabled:opacity-50"
              >
                <IconWhatsApp className="h-4 w-4" />
                {waSending ? "Sending…" : "Send WhatsApp"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
