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
