"use client";

import { useState } from "react";
import Link from "next/link";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

// ── Feature data ──────────────────────────────────────────────────────────────

const FEATURES = [
  {
    id: "screening",
    title: "Tenant Screening",
    short: "Review applicant details before signing a lease.",
    body: "PropTrust guides tenants through a structured submission flow, ID, bank statements, income details and references. As a landlord, you receive a clear summary without needing to chase documents manually. Review the information, ask follow-up questions and make a more informed decision before any lease is signed.",
    perks: [
      "SA ID validation",
      "Bank statement review",
      "Structured reference workflow",
      "Clear applicant summary",
    ],
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
  },
  {
    id: "rent",
    title: "Rent Tracking",
    short: "See what has been paid, what is due and what needs follow-up.",
    body: "Keep a clear payment record for every tenant. Mark payments received, view outstanding amounts and trigger reminders, all from one place. PropTrust tracks payment history so you have a reliable record available at any time, without relying on a spreadsheet or separate banking app.",
    perks: [
      "Per-tenant payment history",
      "Due date tracking",
      "Automated email reminders",
      "WhatsApp reminders (Professional+)",
    ],
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
        />
      </svg>
    ),
  },
  {
    id: "maintenance",
    title: "Maintenance Requests",
    short: "Keep repair requests organised from request to resolution.",
    body: "Tenants submit maintenance requests through their portal with a description and optional photos. You track each request through open, in-progress and resolved stages. No more hunting through WhatsApp threads to find out what was reported or what was fixed.",
    perks: [
      "Tenant portal submission",
      "Status tracking",
      "Photo uploads",
      "Resolution history",
    ],
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
  {
    id: "dashboard",
    title: "Property Dashboard",
    short: "Track each unit, tenant and task in one place.",
    body: "The PropTrust dashboard gives you a single view of all your properties, tenants and outstanding tasks. See rent status, open maintenance requests, upcoming lease renewals and recent activity at a glance. Designed to reduce the mental overhead of managing multiple units.",
    perks: [
      "Multi-property overview",
      "Tenant status at a glance",
      "Outstanding task list",
      "Lease expiry tracking",
    ],
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
  {
    id: "documents",
    title: "Document Storage",
    short: "Keep leases, IDs and property documents easy to find.",
    body: "Upload and organise leases, inspection reports, tenant IDs, body corporate notices and any other property documents. Documents are stored per property and per tenant so you can find what you need quickly, from any device.",
    perks: [
      "Per-tenant document folders",
      "Per-property storage",
      "Secure access",
      "Any file type",
    ],
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
  {
    id: "whatsapp",
    title: "WhatsApp Notifications",
    short: "Send practical reminders through a channel people already use.",
    body: "In South Africa, WhatsApp is the default communication channel. PropTrust uses WhatsApp to send rent reminders, maintenance updates and important notices directly to your tenants, so the message actually gets read.",
    perks: [
      "Rent due reminders",
      "Late payment follow-ups",
      "Maintenance status updates",
      "Available on Professional+ plans",
    ],
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    ),
  },
  {
    id: "marketplace",
    title: "Tenant Marketplace",
    short: "Connect landlords and tenants directly.",
    body: "Verified tenants can list their profile in the PropTrust marketplace, making it easier for landlords to find suitable applicants without going through an agent. Listings show verified information so landlords can assess fit before reaching out.",
    perks: [
      "Verified tenant profiles",
      "Budget and area filters",
      "Direct contact without agents",
      "Available on Professional+ plans",
    ],
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
  {
    id: "bodycorp",
    title: "Body Corporate Support",
    short: "Keep levies, notices and shared-property details organised.",
    body: "For landlords in sectional title schemes, PropTrust helps you track levy payments, store body corporate notices and rules, and manage the administrative side of shared-property ownership. Available on Professional and Enterprise plans.",
    perks: [
      "Levy tracking",
      "Meeting minute storage",
      "Notice management",
      "Available on Professional+ plans",
    ],
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </svg>
    ),
  },
];

// ── Feature Wheel ─────────────────────────────────────────────────────────────

const WHEEL_COLORS = [
  "#1e3a8a",
  "#1e40af",
  "#1d4ed8",
  "#2563eb",
  "#3b82f6",
  "#60a5fa",
  "#93c5fd",
  "#bfdbfe",
];

function FeatureWheel({
  active,
  setActive,
}: {
  active: number | null;
  setActive: (i: number | null) => void;
}) {
  const cx = 160,
    cy = 160,
    R = 128,
    r = 46;
  const n = FEATURES.length;

  function segPath(i: number) {
    const a0 = (i / n) * 2 * Math.PI - Math.PI / 2;
    const a1 = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2;
    const g = 0.045;
    const x0 = cx + R * Math.cos(a0 + g),
      y0 = cy + R * Math.sin(a0 + g);
    const x1 = cx + R * Math.cos(a1 - g),
      y1 = cy + R * Math.sin(a1 - g);
    const x2 = cx + r * Math.cos(a1 - g),
      y2 = cy + r * Math.sin(a1 - g);
    const x3 = cx + r * Math.cos(a0 + g),
      y3 = cy + r * Math.sin(a0 + g);
    return `M${x0} ${y0} A${R} ${R} 0 0 1 ${x1} ${y1} L${x2} ${y2} A${r} ${r} 0 0 0 ${x3} ${y3} Z`;
  }

  function labelPos(i: number) {
    const a = ((i + 0.5) / n) * 2 * Math.PI - Math.PI / 2;
    return {
      x: cx + ((R + r) / 2) * Math.cos(a),
      y: cy + ((R + r) / 2) * Math.sin(a),
    };
  }

  return (
    <svg
      viewBox="0 0 320 320"
      className="w-full max-w-[300px] select-none"
      aria-hidden="true"
    >
      {FEATURES.map((f, i) => {
        const pos = labelPos(i);
        const words = f.title.split(" ");
        const line1 = words.slice(0, Math.ceil(words.length / 2)).join(" ");
        const line2 = words.slice(Math.ceil(words.length / 2)).join(" ");
        const isActive = active === i;
        const isDimmed = active !== null && !isActive;
        return (
          <g
            key={f.id}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            onClick={() => setActive(isActive ? null : i)}
            style={{ cursor: "pointer" }}
          >
            <path
              d={segPath(i)}
              fill={WHEEL_COLORS[i]}
              opacity={isDimmed ? 0.35 : isActive ? 1 : 0.85}
              style={{
                transition: "opacity .15s, transform .15s",
                transformOrigin: `${cx}px ${cy}px`,
                transform: isActive ? "scale(1.04)" : "scale(1)",
              }}
            />
            <text
              x={pos.x}
              y={pos.y - 5}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={i >= 6 ? "#1e3a8a" : "white"}
              fontSize="7"
              fontWeight="600"
            >
              {line1}
            </text>
            {line2 && (
              <text
                x={pos.x}
                y={pos.y + 7}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={i >= 6 ? "#1e3a8a" : "white"}
                fontSize="7"
                fontWeight="600"
              >
                {line2}
              </text>
            )}
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={r - 5} fill="#0f172a" />
      <text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        fill="white"
        fontSize="14"
        fontWeight="800"
      >
        PT
      </text>
      <text
        x={cx}
        y={cy + 9}
        textAnchor="middle"
        fill="#93c5fd"
        fontSize="7"
        fontWeight="600"
      >
        PropTrust
      </text>
    </svg>
  );
}

// ── Check icon ────────────────────────────────────────────────────────────────

function Check() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-green-600"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FeaturesPage() {
  const [activeFeature, setActiveFeature] = useState<number | null>(null);
  const highlighted = activeFeature !== null ? activeFeature : 0;

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 antialiased">
      <MarketingNav />

      {/* HERO */}
      <section className="bg-[#0f172a] px-6 pb-20 pt-20 text-center md:pt-28">
        <div className="mx-auto max-w-3xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-blue-400">
            Platform features
          </p>
          <h1 className="mb-5 text-5xl font-extrabold leading-tight tracking-tight text-white md:text-6xl">
            Every feature you need
            <br />
            <span className="text-[#3b82f6]">to manage rentals properly</span>
          </h1>
          <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-slate-300">
            PropTrust brings screening, payments, maintenance and documents into
            one organised workspace.
          </p>
          <Link
            href="/register"
            className="inline-flex rounded-full bg-[#3b82f6] px-8 py-3.5 text-base font-bold text-white shadow-lg transition hover:bg-blue-500"
          >
            Start free trial
          </Link>
        </div>
      </section>

      {/* INTERACTIVE FEATURE SECTION */}
      <section className="bg-white px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-start gap-16 lg:grid-cols-2">
            {/* Wheel, desktop only */}
            <div className="hidden justify-center lg:flex">
              <FeatureWheel
                active={activeFeature}
                setActive={setActiveFeature}
              />
            </div>

            {/* Feature list */}
            <div className="space-y-3">
              {FEATURES.map((f, i) => (
                <div
                  key={f.id}
                  id={f.id}
                  onMouseEnter={() => setActiveFeature(i)}
                  onMouseLeave={() => setActiveFeature(null)}
                  className={`cursor-default rounded-xl border p-5 transition-all ${
                    i === highlighted
                      ? "border-blue-200 bg-blue-50 shadow-sm"
                      : "border-[#e2e8f0] bg-[#f8fafc] hover:border-blue-100"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                        i === highlighted
                          ? "bg-[#1e40af] text-white"
                          : "bg-white text-[#1e40af]"
                      }`}
                    >
                      {f.icon}
                    </div>
                    <div>
                      <p className="font-bold text-[#0f172a]">{f.title}</p>
                      <p className="mt-0.5 text-sm text-slate-500">{f.short}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE DEEP-DIVES */}
      <section className="bg-[#f8fafc] px-6 py-24">
        <div className="mx-auto max-w-7xl space-y-24">
          {FEATURES.filter((_, i) => i < 4).map((f, i) => (
            <div
              key={f.id}
              id={f.id + "-detail"}
              className={`grid items-center gap-12 lg:grid-cols-2 ${i % 2 === 1 ? "lg:grid-flow-dense" : ""}`}
            >
              {/* Text */}
              <div className={i % 2 === 1 ? "lg:col-start-2" : ""}>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#1e40af]">
                  {f.icon}
                </div>
                <h2 className="mb-4 text-2xl font-extrabold tracking-tight text-[#0f172a] md:text-3xl">
                  {f.title}
                </h2>
                <p className="mb-6 text-base leading-relaxed text-slate-500">
                  {f.body}
                </p>
                <ul className="space-y-3">
                  {f.perks.map((p) => (
                    <li
                      key={p}
                      className="flex items-center gap-2.5 text-sm text-slate-700"
                    >
                      <Check />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Visual mockup */}
              <div
                className={i % 2 === 1 ? "lg:col-start-1 lg:row-start-1" : ""}
              >
                <div className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-xs font-semibold text-slate-400">
                      {f.title}
                    </span>
                  </div>
                  {/* Generic feature illustration: numbered progress steps */}
                  <div className="space-y-2.5">
                    {f.perks.map((p, pi) => (
                      <div
                        key={p}
                        className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3"
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1e40af] text-[10px] font-bold text-white">
                          {pi + 1}
                        </span>
                        <span className="text-xs font-medium text-slate-700">
                          {p}
                        </span>
                        <span className="ml-auto text-xs font-semibold text-green-600">
                          Active
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MOBILE GRID */}
      <section className="bg-white px-6 py-24 lg:hidden">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-10 text-center text-2xl font-extrabold text-[#0f172a]">
            All features
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div
                key={f.id}
                className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-5"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#1e40af]">
                  {f.icon}
                </div>
                <p className="font-bold text-[#0f172a]">{f.title}</p>
                <p className="mt-1 text-sm text-slate-500">{f.short}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1e40af] px-6 py-24 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="mb-5 text-3xl font-extrabold text-white">
            Start managing rentals properly
          </h2>
          <p className="mb-10 text-blue-100">
            All features available free for 30 days. No credit card required.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="rounded-full bg-white px-8 py-4 text-base font-extrabold text-[#1e40af] transition hover:bg-blue-50"
            >
              Start free trial
            </Link>
            <Link
              href="/register"
              className="rounded-full border-2 border-white/40 px-8 py-4 text-base font-bold text-white transition hover:border-white hover:bg-white/10"
            >
              Book a demo
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
