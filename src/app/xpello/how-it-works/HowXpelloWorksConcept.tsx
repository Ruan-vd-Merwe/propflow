"use client";

import { useState } from "react";
import Link from "next/link";
import { XpelloDisclaimer } from "@/components/xpello/XpelloDisclaimer";

const LIFECYCLE_STEPS = [
  { label: "Membership", detail: "Your PropTrust plan already includes Xpello legal support." },
  { label: "Legal question or dispute", detail: "A tenant or landlord raises something they are unsure how to handle." },
  { label: "Xpello guides the matter", detail: "Xpello reviews what has happened and explains the options in plain language." },
  { label: "Most matters resolve before court", detail: "Most legal questions and disputes are resolved without needing to go to court." },
  { label: "Court, if necessary", detail: "If a matter has to go further, it continues to be handled under the membership terms." },
];

const FAQS: { question: string; answer: string }[] = [
  {
    question: "Why a monthly membership instead of paying per case?",
    answer:
      "A monthly membership means legal support is already in place before anything goes wrong, instead of having to find and pay for a lawyer at a stressful moment.",
  },
  {
    question: "What happens if my matter is complicated?",
    answer:
      "Xpello reviews the details and lets you know what is involved. Complicated matters take longer to resolve, but they stay handled under the same membership rather than becoming a separate, unplanned cost.",
  },
  {
    question: "Do I still need my own attorney?",
    answer:
      "Not for matters Xpello handles under the membership. If a situation falls outside what the membership covers, or there is a conflict of interest, Xpello will tell you and help you find independent representation.",
  },
  {
    question: "When should I contact Xpello?",
    answer:
      "As soon as a legal question or dispute comes up, rather than waiting until it becomes urgent. Early guidance is usually what keeps a matter from escalating.",
  },
  {
    question: "What is covered?",
    answer:
      "Fixed monthly legal support, with legal escalation handled under the membership terms. Exact scope and pricing are confirmed with Xpello directly and are not final in this prototype.",
  },
];

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card mb-6 p-6">
      <h2 className="mb-4 text-lg font-bold text-slate-900">{title}</h2>
      {children}
    </div>
  );
}

export function HowXpelloWorksConcept() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div>
      <div className="mb-8">
        <nav className="mb-4 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/dashboard" className="hover:text-slate-900">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-slate-900">How Xpello Works</span>
        </nav>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900">How Xpello Works</h1>
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
            Concept
          </span>
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
          Legal support that is already part of your PropTrust membership, so neither
          landlords nor tenants have to figure out a legal problem on their own.
        </p>
      </div>

      <SectionCard title="From membership to resolution">
        <div className="grid gap-4 sm:grid-cols-5">
          {LIFECYCLE_STEPS.map((step, i) => (
            <div key={step.label} className="rounded-xl border border-slate-100 p-4">
              <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-blue-700 text-xs font-bold text-white">
                {i + 1}
              </div>
              <p className="text-sm font-semibold text-slate-900">{step.label}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{step.detail}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Frequently asked questions">
        <div className="space-y-2">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={faq.question} className="rounded-xl border border-slate-100">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                >
                  <span className="text-sm font-semibold text-slate-900">{faq.question}</span>
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
                    <p className="text-sm leading-relaxed text-slate-600">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </SectionCard>

      <XpelloDisclaimer />
    </div>
  );
}
