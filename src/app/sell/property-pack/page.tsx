"use client";

import { useState } from "react";
import Link from "next/link";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

// ── Types ─────────────────────────────────────────────────────────────────────

type FieldStatus = "complete" | "partial" | "missing";

type PackField = {
  id: string;
  label: string;
  description: string;
  status: FieldStatus;
  value?: string;
  weight: number;
};

// ── Demo data ─────────────────────────────────────────────────────────────────

const INITIAL_FIELDS: PackField[] = [
  {
    id: "levy",
    label: "Levy Breakdown",
    description: "Monthly levy amount, arrears status and what is included.",
    status: "complete",
    value: "R2,150/month · No arrears · Includes building insurance and maintenance reserve",
    weight: 10,
  },
  {
    id: "rates",
    label: "Rates and Taxes",
    description: "Current municipal rates and taxes account and balance.",
    status: "complete",
    value: "R1,480/month · Account current · Cape Town municipality",
    weight: 10,
  },
  {
    id: "body_corp",
    label: "Body Corporate / HOA Documents",
    description: "Rules of conduct, meeting minutes and financials.",
    status: "partial",
    value: "Rules uploaded · AGM minutes pending",
    weight: 10,
  },
  {
    id: "property_age",
    label: "Property Age",
    description: "Year built and any major structural changes.",
    status: "complete",
    value: "Built 1994 · Major renovation 2018",
    weight: 5,
  },
  {
    id: "defects",
    label: "Known Defects",
    description: "Mandatory disclosure of known material defects (voetstoots waiver does not absolve fraudulent non-disclosure).",
    status: "complete",
    value: "Hairline crack in garage wall (cosmetic) · Geyser replaced 2023",
    weight: 15,
  },
  {
    id: "renovations",
    label: "Renovations and Improvements",
    description: "Work completed, permits obtained and cost of improvements.",
    status: "partial",
    value: "Kitchen remodel 2021 (R85k) · Permit for bathroom addition pending",
    weight: 8,
  },
  {
    id: "plans",
    label: "Approved Building Plans",
    description: "Approved plans on file with the municipality for all structures.",
    status: "missing",
    weight: 12,
  },
  {
    id: "occupancy",
    label: "Occupancy Status",
    description: "Currently occupied, vacant or tenanted with lease details.",
    status: "complete",
    value: "Vacant · Available immediately",
    weight: 8,
  },
  {
    id: "tenant_status",
    label: "Tenant Status",
    description: "If tenanted: lease end date, rental amount and notice given.",
    status: "missing",
    weight: 8,
  },
  {
    id: "attorney",
    label: "Transfer Attorney / Conveyancer",
    description: "Preferred conveyancer details and estimated transfer timeline.",
    status: "missing",
    weight: 7,
  },
  {
    id: "compliance",
    label: "Compliance Certificates",
    description: "Electrical, plumbing, gas, beetle and other certificates.",
    status: "partial",
    value: "Electrical COC valid (2024) · Gas pending",
    weight: 7,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeScore(fields: PackField[]): number {
  const totalWeight = fields.reduce((acc, f) => acc + f.weight, 0);
  const earnedWeight = fields.reduce((acc, f) => {
    if (f.status === "complete") return acc + f.weight;
    if (f.status === "partial") return acc + f.weight * 0.5;
    return acc;
  }, 0);
  return Math.round((earnedWeight / totalWeight) * 100);
}

function scoreColor(score: number) {
  if (score >= 80) return { bar: "bg-green-500", text: "text-green-700", bg: "bg-green-50", border: "border-green-200", label: "Strong" };
  if (score >= 55) return { bar: "bg-amber-400", text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", label: "Moderate" };
  return { bar: "bg-red-400", text: "text-red-700", bg: "bg-red-50", border: "border-red-200", label: "Incomplete" };
}

function StatusBadge({ status }: { status: FieldStatus }) {
  if (status === "complete")
    return <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">Complete</span>;
  if (status === "partial")
    return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">Partial</span>;
  return <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">Not added</span>;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PropertyPackPage() {
  const [fields, setFields] = useState<PackField[]>(INITIAL_FIELDS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const score = computeScore(fields);
  const colors = scoreColor(score);

  function startEdit(field: PackField) {
    setEditingId(field.id);
    setEditValue(field.value ?? "");
  }

  function saveEdit(id: string) {
    setFields((prev) =>
      prev.map((f) =>
        f.id === id
          ? { ...f, value: editValue, status: editValue.trim() ? "complete" : "missing" }
          : f,
      ),
    );
    setEditingId(null);
  }

  const complete = fields.filter((f) => f.status === "complete").length;
  const partial = fields.filter((f) => f.status === "partial").length;
  const missing = fields.filter((f) => f.status === "missing").length;

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 antialiased">
      <MarketingNav />

      {/* Hero */}
      <section className="bg-[#0f172a] px-6 pb-16 pt-16 md:pt-20">
        <div className="mx-auto max-w-4xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-blue-400">Private Sale</p>
          <h1 className="mb-4 text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl">
            Verified Property Pack
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-slate-300">
            Build a complete disclosure package for your listing. Buyers who receive full documentation make faster, more confident offers — and deals are less likely to fall through.
          </p>
        </div>
      </section>

      <section className="bg-[#f8fafc] px-6 py-10">
        <div className="mx-auto max-w-4xl">

          {/* Score card */}
          <div className={`rounded-2xl border ${colors.border} ${colors.bg} p-6 mb-8`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Listing Completeness Score</p>
                <div className="mt-1 flex items-baseline gap-3">
                  <span className={`text-5xl font-extrabold ${colors.text}`}>{score}</span>
                  <span className={`text-lg font-bold ${colors.text}`}>/ 100</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${colors.text} ${colors.border} border`}>{colors.label}</span>
                </div>
              </div>
              <div className="flex gap-6 text-center">
                <div>
                  <p className="text-2xl font-extrabold text-green-700">{complete}</p>
                  <p className="text-xs text-slate-500">Complete</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-amber-700">{partial}</p>
                  <p className="text-xs text-slate-500">Partial</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-slate-400">{missing}</p>
                  <p className="text-xs text-slate-500">Missing</p>
                </div>
              </div>
            </div>
            <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-white/60">
              <div
                className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
                style={{ width: `${score}%` }}
              />
            </div>
            {score < 80 && (
              <p className="mt-3 text-sm text-slate-600">
                Listings with a score above 80 receive 2-3x more serious enquiries.
                {missing > 0 && ` Add the ${missing} missing item${missing > 1 ? "s" : ""} below to improve your score.`}
              </p>
            )}
          </div>

          {/* Field list */}
          <div className="space-y-3">
            {fields.map((field) => (
              <div
                key={field.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="text-sm font-bold text-slate-900">{field.label}</p>
                      <StatusBadge status={field.status} />
                      <span className="text-xs text-slate-400">Weight: {field.weight}pts</span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-500">{field.description}</p>

                    {editingId === field.id ? (
                      <div className="mt-3">
                        <textarea
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          rows={2}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          placeholder={`Enter ${field.label.toLowerCase()} details…`}
                        />
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => saveEdit(field.id)}
                            className="rounded-lg bg-[#1e40af] px-4 py-1.5 text-xs font-bold text-white transition hover:bg-blue-800"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="rounded-lg border border-slate-200 px-4 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : field.value ? (
                      <p className="mt-2 text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2">{field.value}</p>
                    ) : null}
                  </div>

                  {editingId !== field.id && (
                    <button
                      onClick={() => startEdit(field)}
                      className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:border-slate-300"
                    >
                      {field.value ? "Edit" : "Add"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="flex-1 rounded-xl bg-[#1e40af] px-6 py-3.5 text-center text-sm font-bold text-white transition hover:bg-blue-800"
            >
              Save Property Pack
            </Link>
            <Link
              href="/sell/listing-assistant"
              className="flex-1 rounded-xl border border-slate-200 px-6 py-3.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Continue to Listing Assistant
            </Link>
          </div>

          {/* Info note */}
          <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-xs leading-relaxed text-blue-800">
              <strong>Note:</strong> Providing accurate and complete disclosure protects you as the seller. South African courts have consistently held that sellers cannot hide behind a voetstoots clause if they were aware of a defect and failed to disclose it. All information entered here forms part of your listing record.
            </p>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
