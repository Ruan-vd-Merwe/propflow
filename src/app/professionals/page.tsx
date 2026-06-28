"use client";

import { useState } from "react";
import Link from "next/link";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

// ── Types ─────────────────────────────────────────────────────────────────────

type CategoryId = "conveyancers" | "bond-originators" | "inspectors" | "valuers" | "photographers";

type Professional = {
  id: string;
  name: string;
  firm?: string;
  area: string;
  province: string;
  categories: CategoryId[];
  specialties: string[];
  rate: string;
  phone: string;
  email: string;
  initials: string;
  bg: string;
  verified: boolean;
};

// ── Data ──────────────────────────────────────────────────────────────────────

const CATEGORIES: { id: CategoryId; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    id: "conveyancers",
    label: "Conveyancers",
    desc: "Handle property transfers, OTP reviews and title deed registration at the Deeds Office.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: "bond-originators",
    label: "Bond Originators",
    desc: "Apply to multiple banks on your behalf to secure the best interest rate and bond approval.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    id: "inspectors",
    label: "Property Inspectors",
    desc: "Independent structural and defect inspections to protect buyers before signing an OTP.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    id: "valuers",
    label: "Valuers",
    desc: "Certified property valuations for sales, divorce, estate purposes or pre-listing pricing.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    id: "photographers",
    label: "Property Photographers",
    desc: "Professional photography and floor plans to maximise listing views and enquiries.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const PROFESSIONALS: Professional[] = [
  {
    id: "1",
    name: "Adv. Liesl Fourie",
    firm: "Fourie & Associates Incorporated",
    area: "Cape Town CBD, Atlantic Seaboard, Southern Suburbs",
    province: "Western Cape",
    categories: ["conveyancers"],
    specialties: ["Residential transfers", "Off-plan sectional title", "Estate transfers"],
    rate: "Regulated fee scale",
    phone: "021 461 0000",
    email: "liesl@fourieattorneys.co.za",
    initials: "LF",
    bg: "bg-blue-700",
    verified: true,
  },
  {
    id: "2",
    name: "Adv. Sipho Dlamini",
    firm: "Dlamini Conveyancers",
    area: "Sandton, Randburg, Midrand",
    province: "Gauteng",
    categories: ["conveyancers"],
    specialties: ["Commercial transfers", "Residential conveyancing", "Bond registrations"],
    rate: "Regulated fee scale",
    phone: "011 784 0000",
    email: "sipho@dlaminiconvey.co.za",
    initials: "SD",
    bg: "bg-indigo-700",
    verified: true,
  },
  {
    id: "3",
    name: "Priya Govender",
    firm: "SA Home Loans & Bond Originators",
    area: "Nationwide",
    province: "All provinces",
    categories: ["bond-originators"],
    specialties: ["First-time buyers", "Investment properties", "Competitive rate negotiation"],
    rate: "Free service — bank paid",
    phone: "072 000 0000",
    email: "priya@sahomebonds.co.za",
    initials: "PG",
    bg: "bg-green-700",
    verified: true,
  },
  {
    id: "4",
    name: "Ruan du Plessis",
    firm: "BetterBond Stellenbosch",
    area: "Stellenbosch, Somerset West, Paarl",
    province: "Western Cape",
    categories: ["bond-originators"],
    specialties: ["Western Cape residential", "Agricultural property bonds", "New builds"],
    rate: "Free service — bank paid",
    phone: "082 000 0000",
    email: "ruan@betterbond.co.za",
    initials: "RP",
    bg: "bg-teal-700",
    verified: true,
  },
  {
    id: "5",
    name: "Mark Hendricks",
    firm: "Cape Property Inspections",
    area: "Western Cape — all areas",
    province: "Western Cape",
    categories: ["inspectors"],
    specialties: ["Structural defect reports", "Roof and waterproofing", "Pre-purchase inspections"],
    rate: "R950 – R1,800 per inspection",
    phone: "083 000 0000",
    email: "mark@capepropertyinspect.co.za",
    initials: "MH",
    bg: "bg-orange-700",
    verified: true,
  },
  {
    id: "6",
    name: "Thandi Khumalo",
    firm: "Khumalo Property Valuers",
    area: "Johannesburg, Pretoria, Ekurhuleni",
    province: "Gauteng",
    categories: ["valuers"],
    specialties: ["Residential valuations", "Estate valuations", "Municipal valuation appeals"],
    rate: "From R3,500",
    phone: "010 000 0000",
    email: "thandi@khumalovaluers.co.za",
    initials: "TK",
    bg: "bg-purple-700",
    verified: true,
  },
  {
    id: "7",
    name: "Anri Steyn",
    firm: "Steyn Property Photography",
    area: "Cape Town, Stellenbosch, Paarl",
    province: "Western Cape",
    categories: ["photographers"],
    specialties: ["Interior and exterior photography", "Drone aerial photography", "Virtual tours and floor plans"],
    rate: "R850 – R2,500",
    phone: "076 000 0000",
    email: "anri@steynphoto.co.za",
    initials: "AS",
    bg: "bg-rose-700",
    verified: true,
  },
  {
    id: "8",
    name: "Neil Booysen",
    firm: "Booysen Property Inspectors",
    area: "Durban, Umhlanga, Ballito, Westville",
    province: "KwaZulu-Natal",
    categories: ["inspectors"],
    specialties: ["Damp and waterproofing surveys", "Electrical pre-compliance checks", "Pool and outbuilding inspections"],
    rate: "R1,100 – R1,900 per inspection",
    phone: "073 000 0000",
    email: "neil@booyseninspect.co.za",
    initials: "NB",
    bg: "bg-cyan-700",
    verified: false,
  },
];

const PROVINCES = ["All provinces", "Western Cape", "Gauteng", "KwaZulu-Natal", "Eastern Cape", "Free State", "Limpopo", "Mpumalanga", "Northern Cape", "North West"];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProfessionalsPage() {
  const [activeCategory, setActiveCategory] = useState<CategoryId | null>(null);
  const [province, setProvince] = useState("All provinces");

  const filtered = PROFESSIONALS.filter((p) => {
    if (activeCategory && !p.categories.includes(activeCategory)) return false;
    if (province !== "All provinces" && p.province !== province && p.province !== "All provinces") return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 antialiased">
      <MarketingNav />

      {/* Hero */}
      <section className="bg-[#0f172a] px-6 pb-16 pt-16 md:pt-20">
        <div className="mx-auto max-w-5xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-blue-400">Professional Services</p>
          <h1 className="mb-4 text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl">
            Trusted Professionals
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-slate-300">
            Sell or buy privately with confidence. Connect directly with conveyancers, bond originators, inspectors, valuers and photographers who work with private transactions.
          </p>
        </div>
      </section>

      <section className="bg-[#f8fafc] px-6 py-10">
        <div className="mx-auto max-w-5xl">

          {/* Category cards */}
          <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {CATEGORIES.map((cat) => (
              <button key={cat.id} onClick={() => setActiveCategory((prev) => prev === cat.id ? null : cat.id)}
                className={`rounded-xl border p-4 text-left transition ${
                  activeCategory === cat.id
                    ? "border-[#1e40af] bg-[#1e40af] text-white shadow-md"
                    : "border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50"
                }`}>
                <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-lg ${
                  activeCategory === cat.id ? "bg-white/20" : "bg-slate-100"
                }`}>
                  <span className={activeCategory === cat.id ? "text-white" : "text-[#1e40af]"}>{cat.icon}</span>
                </div>
                <p className={`text-xs font-bold ${activeCategory === cat.id ? "text-white" : "text-slate-900"}`}>{cat.label}</p>
              </button>
            ))}
          </div>

          {/* Active category description */}
          {activeCategory && (
            <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
              <p className="text-sm text-blue-800">{CATEGORIES.find((c) => c.id === activeCategory)?.desc}</p>
            </div>
          )}

          {/* Province filter */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <label className="text-xs font-semibold text-slate-500">Province:</label>
            <div className="flex flex-wrap gap-2">
              {PROVINCES.slice(0, 5).map((p) => (
                <button key={p} onClick={() => setProvince(p)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    province === p ? "bg-[#0f172a] text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}>
                  {p}
                </button>
              ))}
              <select value={province} onChange={(e) => setProvince(e.target.value)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 focus:outline-none">
                {PROVINCES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Results count */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {filtered.length} professional{filtered.length !== 1 ? "s" : ""} found
              {activeCategory ? ` · ${CATEGORIES.find((c) => c.id === activeCategory)?.label}` : ""}
              {province !== "All provinces" ? ` · ${province}` : ""}
            </p>
            {(activeCategory || province !== "All provinces") && (
              <button onClick={() => { setActiveCategory(null); setProvince("All provinces"); }}
                className="text-xs font-semibold text-blue-600 hover:underline">
                Clear filters
              </button>
            )}
          </div>

          {/* Professional cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((pro) => (
              <div key={pro.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white ${pro.bg}`}>
                    {pro.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{pro.name}</p>
                        {pro.firm && <p className="text-xs text-slate-500">{pro.firm}</p>}
                      </div>
                      {pro.verified && (
                        <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-800">Verified</span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {pro.categories.map((cat) => (
                        <span key={cat} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          {CATEGORIES.find((c) => c.id === cat)?.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mb-4 space-y-1.5">
                  <div className="flex items-start gap-2">
                    <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-xs text-slate-600">{pro.area}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-slate-600">{pro.rate}</p>
                  </div>
                </div>

                <div className="mb-4 flex flex-wrap gap-1.5">
                  {pro.specialties.map((s) => (
                    <span key={s} className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600">{s}</span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <a href={`tel:${pro.phone}`}
                    className="flex-1 rounded-xl border border-slate-200 py-2 text-center text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
                    {pro.phone}
                  </a>
                  <a href={`mailto:${pro.email}`}
                    className="flex-1 rounded-xl bg-[#1e40af] py-2 text-center text-xs font-bold text-white transition hover:bg-blue-800">
                    Email
                  </a>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <p className="text-slate-500">No professionals found for this filter combination.</p>
              <button onClick={() => { setActiveCategory(null); setProvince("All provinces"); }}
                className="mt-2 text-sm font-semibold text-blue-600 hover:underline">
                Clear filters
              </button>
            </div>
          )}

          {/* Join CTA */}
          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-bold text-slate-900">Are you a property professional?</p>
                <p className="mt-1 text-sm text-slate-500">Join the PropTrust marketplace and connect with private buyers and sellers who need your services. No monthly fees — pay only per verified lead.</p>
              </div>
              <Link href="/contact"
                className="shrink-0 rounded-xl bg-[#0f172a] px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800">
                Apply to join
              </Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
