"use client";

import { useState } from "react";
import Link from "next/link";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

// ── Data ──────────────────────────────────────────────────────────────────────

type Tier = {
  name: string;
  monthly: number;
  annual: number;
  sub: string;
  featured?: boolean;
  includes: string[];
  excludes: string[];
  cta: string;
  ctaHref: string;
};

const TIERS: Tier[] = [
  {
    name: "Starter",
    monthly: 99,
    annual: 990,
    sub: "For landlords with up to 3 properties.",
    includes: [
      "Unlimited tenant records",
      "Tenant screening workflow",
      "Rent tracking",
      "Email reminders",
      "Tenant portal",
      "Document storage",
    ],
    excludes: [
      "WhatsApp notifications",
      "Body corporate tools",
      "Advanced maintenance management",
    ],
    cta: "Start free trial",
    ctaHref: "/register",
  },
  {
    name: "Professional",
    monthly: 299,
    annual: 2990,
    sub: "For landlords and managers with up to 15 properties.",
    featured: true,
    includes: [
      "Everything in Starter",
      "WhatsApp notifications",
      "Body corporate tools",
      "Maintenance management",
      "Bank statement review",
      "Tenant marketplace access",
      "Priority support",
    ],
    excludes: [],
    cta: "Start free trial",
    ctaHref: "/register",
  },
  {
    name: "Enterprise",
    monthly: 799,
    annual: 7990,
    sub: "For larger portfolios and property teams.",
    includes: [
      "Everything in Professional",
      "Unlimited properties",
      "Dedicated account support",
      "Custom integrations",
      "API access",
      "White-label options",
      "SA document templates",
    ],
    excludes: [],
    cta: "Contact us",
    ctaHref: "/contact",
  },
];

const ALL_FEATURES = [
  { label: "Tenant records", tiers: [true, true, true] },
  { label: "Tenant screening workflow", tiers: [true, true, true] },
  { label: "Rent tracking", tiers: [true, true, true] },
  { label: "Email reminders", tiers: [true, true, true] },
  { label: "Tenant portal", tiers: [true, true, true] },
  { label: "Document storage", tiers: [true, true, true] },
  { label: "WhatsApp notifications", tiers: [false, true, true] },
  { label: "Body corporate tools", tiers: [false, true, true] },
  { label: "Maintenance management", tiers: [false, true, true] },
  { label: "Bank statement review", tiers: [false, true, true] },
  { label: "Tenant marketplace", tiers: [false, true, true] },
  { label: "Priority support", tiers: [false, true, true] },
  { label: "Unlimited properties", tiers: [false, false, true] },
  { label: "Dedicated account support", tiers: [false, false, true] },
  { label: "API access", tiers: [false, false, true] },
  { label: "Custom integrations", tiers: [false, false, true] },
  { label: "White-label options", tiers: [false, false, true] },
];

const FAQS = [
  {
    q: "Is there a free trial?",
    a: "Yes. All plans include a 30-day free trial. No credit card is required to start.",
  },
  {
    q: "Can I change plans later?",
    a: "Yes. You can upgrade or downgrade your plan at any time. Changes take effect at the start of the next billing cycle.",
  },
  {
    q: "What payment methods are accepted?",
    a: "PropTrust accepts major South African debit and credit cards. EFT payment options are available on Enterprise plans.",
  },
  {
    q: "What happens if I exceed my property limit?",
    a: "You will be prompted to upgrade before adding additional properties. Your existing data is never affected.",
  },
  {
    q: "Is there a setup fee?",
    a: "No setup fee on any plan. You pay only the monthly or annual subscription.",
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function Tick({ on, featured }: { on: boolean; featured?: boolean }) {
  if (on) {
    return (
      <div
        className={`mx-auto flex h-5 w-5 items-center justify-center rounded-full ${featured ? "bg-blue-500" : "bg-green-500"}`}
      >
        <svg
          className="h-3 w-3 text-white"
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
      </div>
    );
  }
  return (
    <div className="mx-auto flex h-5 w-5 items-center justify-center rounded-full bg-slate-100">
      <svg
        className="h-3 w-3 text-slate-300"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </div>
  );
}

function PlanCheck({
  included,
  featured,
}: {
  included: boolean;
  featured?: boolean;
}) {
  if (!included) {
    return (
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200">
        <svg
          className="h-3 w-3 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </div>
    );
  }
  return (
    <div
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${featured ? "bg-blue-500" : "bg-green-500"}`}
    >
      <svg
        className="h-3 w-3 text-white"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 antialiased">
      <MarketingNav />

      {/* HERO */}
      <section className="bg-[#0f172a] px-6 pb-20 pt-20 text-center md:pt-28">
        <div className="mx-auto max-w-2xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-blue-400">
            Pricing
          </p>
          <h1 className="mb-5 text-5xl font-extrabold leading-tight tracking-tight text-white md:text-6xl">
            Simple pricing for every portfolio size
          </h1>
          <p className="text-lg text-slate-300">
            No agent commission. No confusing add-ons. Practical tools at an
            honest price.
          </p>
        </div>
      </section>

      {/* PLANS */}
      <section className="bg-[#f8fafc] px-6 py-20">
        <div className="mx-auto max-w-6xl">
          {/* Monthly / Annual toggle */}
          <div className="mb-12 flex justify-center">
            <div className="flex items-center gap-4 rounded-xl border border-[#e2e8f0] bg-white p-1.5 shadow-sm">
              <button
                onClick={() => setAnnual(false)}
                className={`rounded-lg px-5 py-2.5 text-sm font-bold transition ${!annual ? "bg-[#0f172a] text-white shadow" : "text-slate-500 hover:text-slate-800"}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold transition ${annual ? "bg-[#0f172a] text-white shadow" : "text-slate-500 hover:text-slate-800"}`}
              >
                Annual
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${annual ? "bg-green-500 text-white" : "bg-green-100 text-green-700"}`}
                >
                  2 months free
                </span>
              </button>
            </div>
          </div>

          {/* Pricing cards */}
          <div className="grid gap-6 md:grid-cols-3">
            {TIERS.map((tier) => {
              const price = annual
                ? Math.round(tier.annual / 12)
                : tier.monthly;
              return (
                <div
                  key={tier.name}
                  className={`relative flex flex-col rounded-3xl p-8 ${
                    tier.featured
                      ? "bg-[#0f172a] text-white shadow-2xl ring-2 ring-[#1e40af]"
                      : "border border-[#e2e8f0] bg-white"
                  }`}
                >
                  {tier.featured && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[#1e40af] px-4 py-1 text-xs font-bold text-white">
                      Most popular
                    </span>
                  )}

                  <p
                    className={`mb-4 text-xs font-bold uppercase tracking-wider ${tier.featured ? "text-blue-300" : "text-slate-400"}`}
                  >
                    {tier.name}
                  </p>

                  <div className="mb-2 flex items-end gap-1">
                    <span
                      className={`text-4xl font-extrabold tabular-nums ${tier.featured ? "text-white" : "text-[#0f172a]"}`}
                    >
                      R{price}
                    </span>
                    <span
                      className={`mb-1 text-sm ${tier.featured ? "text-blue-300" : "text-slate-400"}`}
                    >
                      /month
                    </span>
                  </div>

                  {annual && (
                    <p
                      className={`mb-2 text-xs ${tier.featured ? "text-blue-300" : "text-green-600"}`}
                    >
                      Billed R{tier.annual}/year, 2 months free
                    </p>
                  )}

                  <p
                    className={`mb-8 text-sm ${tier.featured ? "text-blue-200" : "text-slate-500"}`}
                  >
                    {tier.sub}
                  </p>

                  <ul className="mb-8 flex-1 space-y-3">
                    {tier.includes.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <PlanCheck included featured={tier.featured} />
                        <span
                          className={`text-sm ${tier.featured ? "text-blue-50" : "text-slate-700"}`}
                        >
                          {f}
                        </span>
                      </li>
                    ))}
                    {tier.excludes.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <PlanCheck included={false} />
                        <span className="text-sm text-slate-400 line-through">
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={tier.ctaHref}
                    className={`block rounded-2xl py-3.5 text-center text-sm font-bold transition ${
                      tier.featured
                        ? "bg-white text-[#0f172a] hover:bg-slate-100"
                        : "border-2 border-[#1e40af] text-[#1e40af] hover:bg-blue-50"
                    }`}
                  >
                    {tier.cta}
                  </Link>
                </div>
              );
            })}
          </div>

          <p className="mt-8 text-center text-sm text-slate-400">
            All plans include a 30-day free trial. No credit card required.
          </p>
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-center text-2xl font-extrabold text-[#0f172a]">
            Feature comparison
          </h2>

          <div className="overflow-x-auto rounded-2xl border border-[#e2e8f0]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-500">
                    Feature
                  </th>
                  {TIERS.map((t) => (
                    <th
                      key={t.name}
                      className="px-6 py-4 text-center text-sm font-bold text-[#0f172a]"
                    >
                      {t.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {ALL_FEATURES.map((row) => (
                  <tr key={row.label} className="hover:bg-slate-50">
                    <td className="px-6 py-3.5 text-sm text-slate-700">
                      {row.label}
                    </td>
                    {row.tiers.map((has, i) => (
                      <td key={i} className="px-6 py-3.5 text-center">
                        <Tick on={has} featured={i === 1} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[#f8fafc] px-6 py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-10 text-center text-2xl font-extrabold text-[#0f172a]">
            Pricing questions
          </h2>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl border border-[#e2e8f0] bg-white"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left"
                >
                  <span className="font-semibold text-[#0f172a]">{faq.q}</span>
                  <svg
                    className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="border-t border-[#e2e8f0] px-6 py-4">
                    <p className="text-sm leading-relaxed text-slate-500">
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1e40af] px-6 py-24 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="mb-5 text-3xl font-extrabold text-white">
            Start your 30-day free trial
          </h2>
          <p className="mb-10 text-blue-100">
            No credit card required. Cancel anytime.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="rounded-full bg-white px-8 py-4 text-base font-extrabold text-[#1e40af] transition hover:bg-blue-50"
            >
              Get started free
            </Link>
            <Link
              href="/contact"
              className="rounded-full border-2 border-white/40 px-8 py-4 text-base font-bold text-white transition hover:border-white hover:bg-white/10"
            >
              Talk to us
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
