"use client";

import { useState } from "react";
import Link from "next/link";
import { XpelloDisclaimer } from "@/components/xpello/XpelloDisclaimer";

const READINESS_ITEMS = [
  { label: "Signed lease uploaded", done: true },
  { label: "Tenant details captured", done: true },
  { label: "Deposit amount recorded", done: true },
  { label: "Inspection documents stored", done: true },
  { label: "Payment history available", done: true },
  { label: "Communication timeline available", done: false },
  { label: "Breach notes added", done: false },
  { label: "Supporting evidence attached", done: false },
];

const TIMELINE = [
  { date: "01 July", event: "Rent due" },
  { date: "04 July", event: "Payment reminder sent" },
  { date: "08 July", event: "Landlord logged non-payment" },
  { date: "10 July", event: "Supporting documents added" },
  { date: "12 July", event: "Ready for Xpello review" },
];

const ESCALATION_PACK_ITEMS = [
  "Property details",
  "Tenant details",
  "Lease agreement",
  "Payment history",
  "Breach timeline",
  "Communication record",
  "Inspection documents",
  "Uploaded evidence",
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

export function XpelloLandlordConcept({
  propertyName,
}: {
  propertyName?: string;
}) {
  const [casePackPrepared, setCasePackPrepared] = useState(false);
  const [reviewRequested, setReviewRequested] = useState(false);

  const displayProperty = propertyName || "2 Bedroom Apartment, Cape Town";

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <nav className="mb-4 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/dashboard" className="hover:text-slate-900">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-slate-900">Legal Protection</span>
        </nav>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900">
            Legal Protection powered by Xpello
          </h1>
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
            Concept
          </span>
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
          PropTrust keeps your rental file organised. Xpello helps with
          breach management and eviction support when things go wrong.
        </p>
      </div>

      {/* A. Protection overview */}
      <SectionCard title="Protection overview">
        <div className="mb-5 rounded-2xl bg-[#0f172a] p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Concept pricing
          </p>
          <p className="mt-1 text-2xl font-bold">
            PropTrust Protected
            <span className="ml-2 text-base font-normal text-slate-300">
              from R349/property/month
            </span>
          </p>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {[
            "Xpello legal protection partner",
            "PropTrust document and tenant file",
            "Breach timeline builder",
            "Payment issue tracking",
            "Escalation-ready case pack",
          ].map((item) => (
            <li
              key={item}
              className="flex items-start gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700"
            >
              <span className="mt-0.5 text-blue-600">&#10003;</span>
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-slate-400">
          Pricing shown for concept purposes. Final pricing to be agreed with
          Xpello.
        </p>
      </SectionCard>

      {/* B. How it works */}
      <SectionCard title="How it works">
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            "Add property and lease",
            "Link tenant and payment records",
            "Track breach, arrears or disputes",
            "Escalate to Xpello with a ready case file",
          ].map((step, i) => (
            <div key={step} className="rounded-xl border border-slate-100 p-4">
              <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-blue-700 text-xs font-bold text-white">
                {i + 1}
              </div>
              <p className="text-sm font-medium text-slate-700">{step}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* C. Legal readiness checklist */}
      <SectionCard title="Legal readiness checklist">
        <div className="mb-4">
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-900">
              Legal readiness: 68% complete
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-[68%] rounded-full bg-blue-600" />
          </div>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {READINESS_ITEMS.map((item) => (
            <li
              key={item.label}
              className="flex items-center gap-2.5 rounded-lg border border-slate-100 px-3 py-2 text-sm"
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                  item.done
                    ? "border-emerald-300 bg-emerald-50 text-emerald-600"
                    : "border-slate-200 text-slate-300"
                }`}
              >
                {item.done && (
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </span>
              <span className={item.done ? "text-slate-700" : "text-slate-500"}>
                {item.label}
              </span>
            </li>
          ))}
        </ul>
      </SectionCard>

      {/* D. Breach timeline mock-up */}
      <SectionCard title="Breach timeline mock-up">
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-xs text-slate-400">Property</p>
            <p className="text-sm font-semibold text-slate-900">
              {displayProperty}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-xs text-slate-400">Tenant</p>
            <p className="text-sm font-semibold text-slate-900">
              Rachel Jacobs
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-xs text-slate-400">Issue</p>
            <p className="text-sm font-semibold text-slate-900">
              Rental payment overdue
            </p>
          </div>
        </div>

        <ol className="mb-5 space-y-3 border-l-2 border-slate-100 pl-4">
          {TIMELINE.map((t) => (
            <li key={t.date} className="relative">
              <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-blue-600" />
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {t.date}
              </p>
              <p className="text-sm text-slate-700">{t.event}</p>
            </li>
          ))}
        </ol>

        <button
          onClick={() => setCasePackPrepared(true)}
          className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
        >
          Prepare Xpello case pack
        </button>
        {casePackPrepared && (
          <p className="mt-3 text-sm font-medium text-emerald-700">
            Case pack prepared below. Scroll down to review and request an
            Xpello review.
          </p>
        )}
      </SectionCard>

      {/* E. Xpello escalation pack */}
      <SectionCard title="Xpello escalation pack">
        <p className="mb-4 text-sm text-slate-500">
          What PropTrust would send to Xpello:
        </p>
        <ul className="mb-5 grid gap-2 sm:grid-cols-2">
          {ESCALATION_PACK_ITEMS.map((item) => (
            <li
              key={item}
              className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            >
              <span className="text-blue-600">&#10003;</span>
              {item}
            </li>
          ))}
        </ul>

        {!reviewRequested ? (
          <button
            onClick={() => setReviewRequested(true)}
            className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            Request Xpello review
          </button>
        ) : (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-800">
              Request prepared.
            </p>
            <p className="mt-1 text-sm text-emerald-700">
              In a live version, this would be sent to Xpello or their
              appointed legal team after landlord confirmation.
            </p>
          </div>
        )}
      </SectionCard>

      {/* F. Partnership concept */}
      <SectionCard title="Partnership concept">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-100 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Landlord pays
            </p>
            <p className="mt-1.5 text-sm font-medium text-slate-900">
              PropTrust Protected, from R349/property/month
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Xpello role
            </p>
            <p className="mt-1.5 text-sm font-medium text-slate-900">
              Legal protection, breach management and eviction support
              partner
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              PropTrust role
            </p>
            <p className="mt-1.5 text-sm font-medium text-slate-900">
              Platform, onboarding, document readiness, tenant file, breach
              timeline and landlord workflow
            </p>
          </div>
        </div>
      </SectionCard>

      <XpelloDisclaimer />
    </div>
  );
}
