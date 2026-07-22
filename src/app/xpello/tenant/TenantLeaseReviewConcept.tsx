"use client";

import { useState } from "react";
import Link from "next/link";
import { XpelloDisclaimer } from "@/components/xpello/XpelloDisclaimer";

type ClauseStatus = "standard" | "attention" | "review";

const STATUS_META: Record<ClauseStatus, { label: string; cls: string }> = {
  standard: { label: "Looks standard", cls: "bg-emerald-100 text-emerald-700" },
  attention: { label: "Needs attention", cls: "bg-amber-100 text-amber-700" },
  review: { label: "Ask for review", cls: "bg-red-100 text-red-700" },
};

const LEGAL_HEALTH_META: Record<
  "healthy" | "check" | "closer_look",
  { label: string; cls: string }
> = {
  healthy: { label: "Looks healthy", cls: "bg-blue-100 text-blue-700" },
  check: { label: "Mostly solid, a few things to check", cls: "bg-amber-100 text-amber-700" },
  closer_look: { label: "Needs a closer look", cls: "bg-rose-100 text-rose-700" },
};

type RightsTopic = { key: string; question: string; answer: string };

const RIGHTS_TOPICS: RightsTopic[] = [
  {
    key: "lockout",
    question: "Can I be locked out of my home?",
    answer:
      "A landlord generally cannot lock you out or remove your belongings without following the proper legal process, even if the lease says otherwise. If this happens, contact Xpello for guidance on what to do next.",
  },
  {
    key: "deposit",
    question: "What happens to my deposit when I move out?",
    answer:
      "Your deposit is usually held until a move-out inspection confirms the condition of the property, then refunded within the timeframe set out in the lease, minus any agreed deductions. Ask for an itemised list if deductions are made.",
  },
  {
    key: "utilities",
    question: "Can utilities be cut off if there is a dispute?",
    answer:
      "A landlord is generally not allowed to cut off water or electricity to force a resolution to a dispute, even during a disagreement about rent or other issues. If this happens, contact Xpello for guidance.",
  },
  {
    key: "eviction",
    question: "Can I be evicted without notice?",
    answer:
      "Evictions in South Africa generally require a court process and proper notice; a landlord cannot remove a tenant on their own without following that process. If you receive an eviction notice, contact Xpello before responding.",
  },
];

const CLAUSES: { title: string; status: ClauseStatus; note: string }[] = [
  {
    title: "Rent and escalation",
    status: "attention",
    note: "8% annual escalation is on the higher end. Confirm the increase date.",
  },
  {
    title: "Deposit and refund terms",
    status: "standard",
    note: "Standard two-month deposit with a documented refund process.",
  },
  {
    title: "Notice period",
    status: "standard",
    note: "Two calendar months, in line with standard residential leases.",
  },
  {
    title: "Maintenance obligations",
    status: "attention",
    note: "Check exactly what counts as minor day-to-day care versus structural.",
  },
  {
    title: "Early cancellation",
    status: "review",
    note: "Cancellation penalty terms are not clearly defined. Ask for review.",
  },
  {
    title: "Inspection requirements",
    status: "standard",
    note: "Move-in and move-out inspection process is documented.",
  },
  {
    title: "Penalties or admin fees",
    status: "review",
    note: "Late payment admin fee is higher than typical. Ask for review.",
  },
  {
    title: "Renewal terms",
    status: "standard",
    note: "Automatic month-to-month continuation after the fixed term.",
  },
];

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card mb-6 p-6">
      <h2 className="mb-4 text-lg font-bold text-slate-900">{title}</h2>
      {children}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-900">{value}</span>
    </div>
  );
}

export function TenantLeaseReviewConcept() {
  const [showExample, setShowExample] = useState(false);
  const [reviewRequested, setReviewRequested] = useState(false);
  const [openRightsTopic, setOpenRightsTopic] = useState<string | null>(null);

  const reviewCount = CLAUSES.filter((c) => c.status === "review").length;
  const attentionCount = CLAUSES.filter((c) => c.status === "attention").length;
  const standardCount = CLAUSES.filter((c) => c.status === "standard").length;
  const legalHealth =
    reviewCount > 0 ? "closer_look" : attentionCount > 0 ? "check" : "healthy";
  const legalHealthMeta = LEGAL_HEALTH_META[legalHealth];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <nav className="mb-4 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/tenant/dashboard" className="hover:text-slate-900">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-slate-900">Lease Review</span>
        </nav>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900">
            Lease Review &amp; Rental Rights Help
          </h1>
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
            Concept
          </span>
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
          Upload or review a lease, understand key terms, and request a
          human review before you sign.
        </p>
        <Link
          href="/xpello/how-it-works"
          className="mt-3 inline-block text-sm font-semibold text-blue-700 hover:underline"
        >
          How Xpello works &rarr;
        </Link>
      </div>

      {/* A. Lease review overview */}
      <SectionCard title="Get started">
        <div className="flex flex-wrap gap-3">
          <Link
            href="/tenant/applications"
            className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            Upload lease for review
          </Link>
          <button
            onClick={() => setShowExample((v) => !v)}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            {showExample ? "Hide example lease summary" : "View example lease summary"}
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Uploading a lease uses PropTrust&apos;s document reader on your
          Applications tab. This page focuses on understanding and
          reviewing what is in it.
        </p>
      </SectionCard>

      {/* B. Example lease summary */}
      {showExample && (
        <SectionCard title="Example lease summary">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">
              12-month residential lease
            </p>
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
              Needs review
            </span>
          </div>
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 px-4">
            <SummaryRow label="Property" value="Cape Town apartment" />
            <SummaryRow label="Monthly rent" value="R14,500" />
            <SummaryRow label="Deposit" value="R29,000" />
            <SummaryRow label="Notice period" value="2 calendar months" />
            <SummaryRow label="Annual escalation" value="8%" />
            <SummaryRow
              label="Maintenance"
              value="Tenant: minor day-to-day care. Landlord: structural repairs."
            />
          </div>
        </SectionCard>
      )}

      {/* C. Clause cards */}
      <SectionCard title="Clause by clause">
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
          <span className="text-sm font-bold text-slate-900">Legal Health:</span>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${legalHealthMeta.cls}`}
          >
            {legalHealthMeta.label}
          </span>
          <span className="text-xs text-slate-500">
            {standardCount} standard, {attentionCount} need attention, {reviewCount} flagged for review
          </span>
          <p className="w-full text-xs text-slate-400">
            Reviewed against common South African residential leasing patterns. Not a legal
            certification.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {CLAUSES.map((clause) => {
            const meta = STATUS_META[clause.status];
            return (
              <div
                key={clause.title}
                className="rounded-xl border border-slate-100 p-4"
              >
                <div className="mb-1.5 flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    {clause.title}
                  </p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${meta.cls}`}
                  >
                    {meta.label}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-slate-500">
                  {clause.note}
                </p>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* C2. Legal Confidence: know your rights */}
      <SectionCard title="Legal Confidence: know your rights">
        <p className="mb-4 text-sm leading-relaxed text-slate-600">
          Even if a lease clause sounds harsh, a landlord still has to operate within South
          African law. Here is what generally applies to common situations.
        </p>
        <div className="space-y-2">
          {RIGHTS_TOPICS.map((topic) => {
            const isOpen = openRightsTopic === topic.key;
            return (
              <div key={topic.key} className="rounded-xl border border-slate-100">
                <button
                  type="button"
                  onClick={() => setOpenRightsTopic(isOpen ? null : topic.key)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                >
                  <span className="text-sm font-semibold text-slate-900">{topic.question}</span>
                  <svg
                    className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isOpen && (
                  <div className="border-t border-slate-100 px-4 py-3">
                    <p className="text-sm leading-relaxed text-slate-600">{topic.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Still unsure about something?</p>
            <p className="mt-0.5 text-xs text-slate-500">
              You never have to figure a legal question out on your own.
            </p>
          </div>
          <Link
            href="/contact?subject=I%20have%20a%20legal%20question%20about%20my%20lease"
            className="shrink-0 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            Ask Xpello a question
          </Link>
        </div>
      </SectionCard>

      {/* D. Human review card */}
      <SectionCard title="Need a human review?">
        <p className="mb-4 text-sm leading-relaxed text-slate-600">
          Request a fixed-fee lease review from Xpello or an appointed legal
          partner, subject to conflict checks.
        </p>
        <div className="mb-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-100 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Standard lease review
            </p>
            <p className="mt-1 text-lg font-bold text-slate-900">from R499</p>
          </div>
          <div className="rounded-xl border border-slate-100 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Urgent review
            </p>
            <p className="mt-1 text-lg font-bold text-slate-900">from R899</p>
          </div>
        </div>

        {!reviewRequested ? (
          <button
            onClick={() => setReviewRequested(true)}
            className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            Request human review
          </button>
        ) : (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-800">
              Review request prepared.
            </p>
            <p className="mt-1 text-sm text-emerald-700">
              In a live version, this would be sent to Xpello or an
              appointed legal partner after a conflict check and tenant
              confirmation.
            </p>
          </div>
        )}
      </SectionCard>

      {/* E. Conflict check explanation */}
      <SectionCard title="Conflict check">
        <p className="text-sm leading-relaxed text-slate-600">
          If Xpello or an appointed legal partner already acts for the
          landlord in the same matter, the tenant may need to be routed to a
          separate independent legal partner.
        </p>
      </SectionCard>

      <XpelloDisclaimer />
    </div>
  );
}
