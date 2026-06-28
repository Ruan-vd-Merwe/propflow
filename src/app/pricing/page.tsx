"use client";

import { useState } from "react";
import Link from "next/link";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

// ── Data ──────────────────────────────────────────────────────────────────────

const OWNER_ITEMS: { label: string; cost: string; type: "free" | "once" | "monthly" }[] = [
  { label: "Property listing", cost: "Free", type: "free" },
  { label: "Tenant screening", cost: "Once-off fee", type: "once" },
  { label: "Digital lease", cost: "Once-off fee", type: "once" },
  { label: "Inspection or viewing help", cost: "Once-off fee", type: "once" },
  { label: "Deposit support", cost: "Once-off/admin fee", type: "once" },
  { label: "Rent collection", cost: "Small monthly or transaction fee", type: "monthly" },
  { label: "Full property management", cost: "Monthly subscription", type: "monthly" },
];

const CONNECTOR_TASKS = [
  "Viewing a property for someone",
  "Meeting a tenant or owner",
  "Helping with move-in admin",
  "Checking on a property",
  "Walking a dog",
  "Helping an elderly person with a local errand",
  "Being a trusted person in the area",
];

const FAQS = [
  {
    q: "Do tenants ever pay?",
    a: "No. Tenants use PropTrust for free. Creating a profile, matching areas, applying to properties, and tracking applications costs nothing.",
  },
  {
    q: "When does a property owner start paying?",
    a: "Listing a property is free. You only pay when you use a specific tool like tenant screening or digital leases. If you want PropTrust to help manage the rental month to month, that becomes a subscription.",
  },
  {
    q: "Are there contracts or lock-in periods?",
    a: "No. Once-off tools are paid when you use them. Monthly services can be cancelled at any time.",
  },
  {
    q: "How do Local Connectors get paid?",
    a: "Connectors earn per completed task. Payment is handled through PropTrust after the task is confirmed as done.",
  },
  {
    q: "What is a Local Connector?",
    a: "A verified person in your area who can help with property viewings, tenant check-ins, move-in support, and other local tasks. Not a sales agent — a helpful person nearby.",
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PricingPage() {
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
          <h1 className="mb-5 text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl">
            How payment works
          </h1>
          <p className="text-lg text-slate-300">
            Free to start. Pay when real work gets done.
          </p>
        </div>
      </section>

      {/* THREE ROLES */}
      <section className="bg-[#f8fafc] px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Tenant */}
            <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="mb-5 text-xs font-bold uppercase tracking-wider text-[#1e40af]">
                Tenant
              </p>
              <div className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-700">
                <span>Find Place</span>
                <span className="text-slate-300">&rarr;</span>
                <span>Apply Once</span>
                <span className="text-slate-300">&rarr;</span>
                <span>Move In</span>
              </div>
              <p className="mb-2 text-3xl font-extrabold text-[#0f172a]">
                Free
              </p>
              <p className="mb-8 flex-1 text-sm leading-relaxed text-slate-500">
                Create one rental profile and use it when you apply. No monthly
                fee.
              </p>
              <ul className="mb-8 space-y-2.5 text-sm text-slate-600">
                {[
                  "Rental profile",
                  "Area Match",
                  "Property applications",
                  "Document storage",
                  "Application tracking",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <span className="text-green-600">&#10003;</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/register?role=tenant"
                className="block rounded-xl border-2 border-[#0f172a] py-3.5 text-center text-sm font-bold text-[#0f172a] transition hover:bg-slate-50"
              >
                Create profile
              </Link>
            </div>

            {/* Property Owner */}
            <div className="flex flex-col rounded-2xl border border-[#1e40af]/30 bg-white p-8 shadow-sm ring-1 ring-[#1e40af]/10">
              <p className="mb-5 text-xs font-bold uppercase tracking-wider text-[#1e40af]">
                Property Owner
              </p>
              <div className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-700">
                <span>List Property</span>
                <span className="text-slate-300">&rarr;</span>
                <span>Choose Tenant</span>
                <span className="text-slate-300">&rarr;</span>
                <span>Manage Rental</span>
              </div>
              <div className="mb-4 space-y-1.5">
                <p className="text-sm text-slate-700">
                  <span className="font-bold">Free</span> to list
                </p>
                <p className="text-sm text-slate-700">
                  <span className="font-bold">Once-off fees</span> for specific
                  tools
                </p>
                <p className="text-sm text-slate-700">
                  <span className="font-bold">Monthly fee</span> only for
                  ongoing management
                </p>
              </div>
              <p className="mb-8 flex-1 text-sm leading-relaxed text-slate-500">
                Pay for the parts you use. If PropTrust helps manage the rental
                every month, that becomes a subscription.
              </p>
              <Link
                href="/register?role=owner"
                className="block rounded-xl bg-[#1e40af] py-3.5 text-center text-sm font-bold text-white transition hover:bg-blue-700"
              >
                List property
              </Link>
            </div>

            {/* Local Connector */}
            <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="mb-5 text-xs font-bold uppercase tracking-wider text-green-700">
                Local Connector
              </p>
              <div className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-700">
                <span>Meet People</span>
                <span className="text-slate-300">&rarr;</span>
                <span>Help Nearby</span>
                <span className="text-slate-300">&rarr;</span>
                <span>Earn Per Job</span>
              </div>
              <p className="mb-2 text-3xl font-extrabold text-[#0f172a]">
                Free to join
              </p>
              <p className="mb-8 flex-1 text-sm leading-relaxed text-slate-500">
                Local people can help with viewings, check-ins, errands, and
                real human support.
              </p>
              <p className="mb-8 text-xs text-slate-400">
                Connectors are verified before taking paid tasks.
              </p>
              <Link
                href="/register?role=connector"
                className="block rounded-xl border-2 border-green-700 py-3.5 text-center text-sm font-bold text-green-700 transition hover:bg-green-50"
              >
                Become a connector
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* DETAILED BREAKDOWN */}
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-2xl font-extrabold text-[#0f172a]">
            What might cost money?
          </h2>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Tenant breakdown */}
            <div className="rounded-2xl bg-[#f8fafc] p-7">
              <p className="mb-5 text-sm font-bold text-[#0f172a]">Tenant</p>
              <ul className="space-y-3 text-sm text-slate-600">
                {[
                  "Free profile",
                  "Free applications",
                  "Free property matching",
                  "No monthly tenant fee",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <span className="text-green-600">&#10003;</span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm leading-relaxed text-slate-500">
                Tenants are the core user group. Everything a tenant needs to
                find, apply, and move in is free.
              </p>
            </div>

            {/* Property Owner breakdown */}
            <div className="rounded-2xl bg-[#f8fafc] p-7">
              <p className="mb-5 text-sm font-bold text-[#0f172a]">
                Property Owner
              </p>
              <ul className="space-y-3 text-sm text-slate-600">
                {OWNER_ITEMS.map((item) => (
                  <li key={item.label} className="flex items-start gap-2.5">
                    <span
                      className={`mt-0.5 ${
                        item.type === "free"
                          ? "text-green-600"
                          : item.type === "monthly"
                            ? "text-[#1e40af]"
                            : "text-slate-400"
                      }`}
                    >
                      {item.type === "free" ? "✓" : item.type === "monthly" ? "•" : "·"}
                    </span>
                    <span>
                      {item.label}{" "}
                      <span className="text-slate-400">
                        &mdash; {item.cost}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 rounded-lg border border-slate-200 bg-white px-4 py-3">
                <div className="mb-2 flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="text-green-600">&#10003;</span> Free
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-slate-400">&middot;</span> Once-off
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-[#1e40af]">&bull;</span> Monthly
                  </span>
                </div>
              </div>
            </div>

            {/* Local Connector breakdown */}
            <div className="rounded-2xl bg-[#f8fafc] p-7">
              <p className="mb-5 text-sm font-bold text-[#0f172a]">
                Local Connector
              </p>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-center gap-2.5">
                  <span className="text-green-600">&#10003;</span>
                  Free to join
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-slate-400">&middot;</span>
                  Paid per completed task
                </li>
              </ul>

              <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Tasks could include
              </p>
              <ul className="space-y-1.5 text-sm text-slate-500">
                {CONNECTOR_TASKS.map((task) => (
                  <li key={task}>{task}</li>
                ))}
              </ul>

              <p className="mt-6 text-sm italic text-slate-500">
                &ldquo;Sometimes people do not need another salesperson. They
                need a helpful person nearby.&rdquo;
              </p>
              <p className="mt-3 text-xs text-slate-400">
                Connectors are verified before taking paid tasks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WHO ARE CONNECTORS */}
      <section className="bg-[#f8fafc] px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-xl font-extrabold text-[#0f172a]">
            Who are Local Connectors?
          </h2>
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-slate-500">
            Psychology students, semi-retired people, community-minded locals,
            or anyone looking for flexible work in their area. Not sales agents
            — helpful people who keep a real person in the loop.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-10 text-center text-2xl font-extrabold text-[#0f172a]">
            Questions
          </h2>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200 bg-white"
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
                  <div className="border-t border-slate-200 px-6 py-4">
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
      <section className="bg-[#0f172a] px-6 py-20 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="mb-4 text-3xl font-extrabold text-white">
            Ready to get started?
          </h2>
          <p className="mb-10 text-slate-400">
            No credit card needed. No setup fee. Start free.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="rounded-full bg-white px-8 py-4 text-base font-extrabold text-[#0f172a] transition hover:bg-slate-100"
            >
              Create free profile
            </Link>
            <Link
              href="/contact"
              className="rounded-full border-2 border-white/30 px-8 py-4 text-base font-bold text-white transition hover:border-white/60 hover:bg-white/5"
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
