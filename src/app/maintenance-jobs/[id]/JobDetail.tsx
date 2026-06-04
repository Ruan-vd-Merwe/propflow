"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { MaintenanceJob, PropertyComponent, JobStatus } from "@/lib/types";
import { getComponentHealth, componentStatusClass } from "@/lib/maintenance";

interface Props {
  job: MaintenanceJob;
  property: { id: string; name: string; address: string };
  component: PropertyComponent | null;
  allComponents: PropertyComponent[];
}

const STATUS_CONFIG: Record<JobStatus, { label: string; badge: string }> = {
  draft: { label: "Draft", badge: "bg-slate-100 text-slate-600" },
  sent: { label: "Sent", badge: "bg-blue-100 text-blue-700" },
  quote_received: {
    label: "Quote Received",
    badge: "bg-amber-100 text-amber-700",
  },
  approved: { label: "Approved", badge: "bg-emerald-100 text-emerald-700" },
  declined: { label: "Declined", badge: "bg-red-100 text-red-700" },
  completed: { label: "Completed", badge: "bg-slate-100 text-slate-500" },
};

const URGENCY_LABEL = {
  urgent: "🔴 Urgent",
  normal: "🟡 Normal",
  planned: "🟢 Planned",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
function formatRand(cents: number | null) {
  if (cents == null) return "—";
  return `R ${(cents / 100).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`;
}

export function JobDetail({
  job: initialJob,
  property,
  component,
  allComponents,
}: Props) {
  const router = useRouter();
  const [job, setJob] = useState(initialJob);
  const [busy, setBusy] = useState<string | null>(null); // which action is loading
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ── Contractor email form ────────────────────────────────────────────────
  const [contractorName, setContractorName] = useState(
    job.contractor_name ?? "",
  );
  const [contractorEmail, setContractorEmail] = useState(
    job.contractor_email ?? "",
  );
  const [finalDesc, setFinalDesc] = useState(job.final_description ?? "");

  // ── Quote form ──────────────────────────────────────────────────────────
  const [quoteText, setQuoteText] = useState(job.quote_text ?? "");
  const [quoteAmount, setQuoteAmount] = useState(
    job.quote_amount_cents != null ? String(job.quote_amount_cents / 100) : "",
  );

  // ── Generic update ───────────────────────────────────────────────────────
  async function patch(body: Record<string, unknown>, successMsg = "") {
    setError("");
    const res = await fetch(`/api/maintenance-jobs/${job.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Something went wrong");
      return null;
    }
    if (successMsg) setSuccess(successMsg);
    return json;
  }

  // ── AI: Generate description ─────────────────────────────────────────────
  async function handleGenerate() {
    setBusy("generate");
    setSuccess("");
    setError("");
    const json = await patch(
      { action: "generate_description" },
      "Description generated!",
    );
    if (json?.description) {
      setFinalDesc(json.description);
      setJob((j) => ({
        ...j,
        generated_description: json.description,
        final_description: json.description,
      }));
    }
    setBusy(null);
  }

  // ── Send email to contractor ─────────────────────────────────────────────
  async function handleSendEmail() {
    if (!contractorEmail.trim() || !finalDesc.trim()) {
      setError("Contractor email and description are required.");
      return;
    }
    setBusy("send_email");
    setSuccess("");
    setError("");
    const json = await patch(
      {
        action: "send_email",
        contractor_name: contractorName.trim() || null,
        contractor_email: contractorEmail.trim(),
        final_description: finalDesc.trim(),
      },
      "Email sent to contractor!",
    );
    if (json) {
      setJob((j) => ({
        ...j,
        contractor_name: contractorName.trim() || null,
        contractor_email: contractorEmail.trim(),
        final_description: finalDesc.trim(),
        status: "sent",
      }));
    }
    setBusy(null);
  }

  // ── AI: Summarise quote ─────────────────────────────────────────────────
  async function handleSummariseQuote() {
    if (!quoteText.trim()) {
      setError("Please paste the quote text.");
      return;
    }
    setBusy("summarise");
    setSuccess("");
    setError("");
    const cents = quoteAmount
      ? Math.round(parseFloat(quoteAmount) * 100)
      : null;
    const json = await patch(
      {
        action: "summarise_quote",
        quote_text: quoteText.trim(),
        ...(cents != null ? { quote_amount_cents: cents } : {}),
      },
      "Quote summarised!",
    );
    if (json?.summary) {
      setJob((j) => ({
        ...j,
        quote_text: quoteText.trim(),
        quote_summary: json.summary,
        quote_received_at: new Date().toISOString(),
        status: "quote_received",
        ...(cents != null ? { quote_amount_cents: cents } : {}),
      }));
    }
    setBusy(null);
  }

  // ── Approve / decline / complete ─────────────────────────────────────────
  async function handleStatus(status: JobStatus) {
    setBusy(status);
    setSuccess("");
    const json = await patch({ status });
    if (json) {
      setJob((j) => ({ ...j, status }));
      setSuccess(`Job marked as ${status}.`);
      router.refresh();
    }
    setBusy(null);
  }

  const statusCfg = STATUS_CONFIG[job.status];

  return (
    <div className="space-y-5">
      {/* ── Header card ────────────────────────────────────────────────────── */}
      <div className="card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{job.title}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {property.name} · {property.address}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              Created {formatDate(job.created_at)} · Updated{" "}
              {formatDate(job.updated_at)}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${statusCfg.badge}`}
            >
              {statusCfg.label}
            </span>
            <span className="text-xs text-slate-400">
              {URGENCY_LABEL[job.urgency]}
            </span>
          </div>
        </div>

        {/* Component info */}
        {component && (
          <div className="mt-4 rounded-lg bg-slate-50 p-3">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-slate-700">
                Component: {component.name}
              </p>
              {(() => {
                const h = getComponentHealth(
                  component.installed_date,
                  component.lifespan_max_years,
                );
                return (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${componentStatusClass(h.status)}`}
                  >
                    {h.label}
                  </span>
                );
              })()}
            </div>
            <p className="mt-0.5 text-xs text-slate-400">
              Installed {component.installed_date} · Max lifespan{" "}
              {component.lifespan_max_years}y
            </p>
          </div>
        )}

        {/* Feedback */}
        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        {success && (
          <p className="mt-3 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
            ✓ {success}
          </p>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Left: Contractor communication */}
        <div className="space-y-5">
          {/* ── Step 1: Generate description ─────────────────────────────── */}
          <div className="card p-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">
                1. Job Description
              </h2>
              <button
                onClick={handleGenerate}
                disabled={busy === "generate"}
                className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-violet-700 disabled:opacity-50"
              >
                {busy === "generate" ? (
                  <span className="flex items-center gap-1.5">
                    <svg
                      className="h-3 w-3 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      />
                    </svg>
                    Generating…
                  </span>
                ) : (
                  "✨ Generate with AI"
                )}
              </button>
            </div>

            <textarea
              value={finalDesc}
              onChange={(e) => setFinalDesc(e.target.value)}
              rows={8}
              className="input-field font-mono text-xs"
              placeholder="AI-generated job description will appear here. You can edit it before sending."
            />
          </div>

          {/* ── Step 2: Send to contractor ────────────────────────────────── */}
          <div className="card p-6">
            <h2 className="mb-4 font-semibold text-slate-900">
              2. Send to Contractor
            </h2>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Contractor name
                </label>
                <input
                  type="text"
                  value={contractorName}
                  onChange={(e) => setContractorName(e.target.value)}
                  className="input-field"
                  placeholder="e.g. ABC Plumbers"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Contractor email *
                </label>
                <input
                  type="email"
                  value={contractorEmail}
                  onChange={(e) => setContractorEmail(e.target.value)}
                  className="input-field"
                  placeholder="contractor@example.com"
                />
              </div>
            </div>

            <button
              onClick={handleSendEmail}
              disabled={
                busy === "send_email" ||
                !contractorEmail.trim() ||
                !finalDesc.trim()
              }
              className="btn-primary mt-4 w-full disabled:opacity-50"
            >
              {busy === "send_email" ? "Sending…" : "📧 Send Job Description"}
            </button>

            {job.contractor_email && (
              <p className="mt-2 text-xs text-slate-400">
                Last sent to {job.contractor_email}
              </p>
            )}
          </div>
        </div>

        {/* Right: Quote & decision */}
        <div className="space-y-5">
          {/* ── Step 3: Paste quote ───────────────────────────────────────── */}
          <div className="card p-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">
                3. Contractor Quote
              </h2>
              <button
                onClick={handleSummariseQuote}
                disabled={busy === "summarise" || !quoteText.trim()}
                className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-violet-700 disabled:opacity-50"
              >
                {busy === "summarise" ? (
                  <span className="flex items-center gap-1.5">
                    <svg
                      className="h-3 w-3 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      />
                    </svg>
                    Summarising…
                  </span>
                ) : (
                  "✨ Summarise with AI"
                )}
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Amount (R)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={quoteAmount}
                  onChange={(e) => setQuoteAmount(e.target.value)}
                  className="input-field"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Quote text (paste contractor reply)
                </label>
                <textarea
                  rows={6}
                  value={quoteText}
                  onChange={(e) => setQuoteText(e.target.value)}
                  className="input-field font-mono text-xs"
                  placeholder="Paste the contractor's quote or email reply here…"
                />
              </div>
            </div>

            {/* AI Quote Summary */}
            {job.quote_summary && (
              <div className="mt-4 rounded-lg bg-slate-50 p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  AI Quote Summary
                </p>
                <p className="text-sm text-slate-700">{job.quote_summary}</p>
                {job.quote_amount_cents != null && (
                  <p className="mt-2 text-base font-bold text-slate-900">
                    {formatRand(job.quote_amount_cents)}
                  </p>
                )}
                {job.quote_received_at && (
                  <p className="mt-1 text-xs text-slate-400">
                    Received {formatDate(job.quote_received_at)}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── Step 4: Decision ─────────────────────────────────────────── */}
          <div className="card p-6">
            <h2 className="mb-4 font-semibold text-slate-900">4. Decision</h2>

            <div className="mb-3 flex items-center gap-2">
              <span className="text-sm text-slate-500">Current status:</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusCfg.badge}`}
              >
                {statusCfg.label}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {job.status === "quote_received" && (
                <>
                  <button
                    onClick={() => handleStatus("approved")}
                    disabled={busy === "approved"}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {busy === "approved" ? "…" : "✓ Approve Quote"}
                  </button>
                  <button
                    onClick={() => handleStatus("declined")}
                    disabled={busy === "declined"}
                    className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    {busy === "declined" ? "…" : "✗ Decline Quote"}
                  </button>
                </>
              )}
              {job.status === "approved" && (
                <button
                  onClick={() => handleStatus("completed")}
                  disabled={busy === "completed"}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
                >
                  {busy === "completed" ? "…" : "✓ Mark Completed"}
                </button>
              )}
              {["draft", "sent", "declined", "completed"].includes(
                job.status,
              ) && (
                <button
                  onClick={() => handleStatus("draft")}
                  disabled={busy === "draft" || job.status === "draft"}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Reset to Draft
                </button>
              )}
            </div>

            {/* Landlord notes */}
            <LandlordNotesForm
              jobId={job.id}
              initialNotes={job.landlord_notes ?? ""}
            />
          </div>
        </div>
      </div>

      {/* ── Other jobs from same property ─────────────────────────────────── */}
      {allComponents.length > 0 && (
        <div className="card p-6">
          <h2 className="mb-4 font-semibold text-slate-900">
            Other components at {property.name}
          </h2>
          <Link
            href={`/properties/${property.id}/components`}
            className="text-sm font-medium text-violet-600 hover:underline"
          >
            View full maintenance tracker →
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Inline notes sub-component ────────────────────────────────────────────────

function LandlordNotesForm({
  jobId,
  initialNotes,
}: {
  jobId: string;
  initialNotes: string;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    await fetch(`/api/maintenance-jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ landlord_notes: notes }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      <label className="mb-1 block text-sm font-medium text-slate-700">
        Internal notes
      </label>
      <textarea
        rows={3}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="input-field text-sm"
        placeholder="Notes for your records…"
      />
      <button
        onClick={save}
        disabled={saving}
        className="mt-2 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
      >
        {saving ? "Saving…" : saved ? "✓ Saved" : "Save notes"}
      </button>
    </div>
  );
}
