import Link from "next/link";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import { HomeReveal } from "@/components/marketing/home/HomeReveal";
import { TheScene } from "@/components/marketing/home/TheScene";
import { ThreeDoors } from "@/components/marketing/home/ThreeDoors";
import { LandlordStrip } from "@/components/marketing/home/LandlordStrip";

// ── Data ──────────────────────────────────────────────────────────────────────

const TRUST_CHIPS = [
  "POPIA aligned approach",
  "Encrypted at rest",
  "Tenant controlled sharing",
  "Free for tenants",
];

function CheckIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-[#2563EB]"
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

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F7F7F5] font-sans text-slate-900 antialiased">
      <HomeReveal />
      <MarketingNav />

      {/* ── 1. HERO ───────────────────────────────────────────────────────────── */}
      <section className="bg-[#F7F7F5] px-6 pb-20 pt-20 md:pb-28 md:pt-28">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-6 text-xs font-bold uppercase tracking-widest text-[#2563EB]">
            South Africa
          </p>

          <h1 className="text-5xl font-extrabold leading-[1.08] tracking-tight text-[#111B29] sm:text-6xl md:text-7xl">
            Rent privately, safely.
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl">
            Property24 finds them the listing. PropTrust is where the deal
            happens: applications, screening, lease, and everything after.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold text-slate-500">
            No agents. No WhatsApp threads. No lost paperwork.
          </p>

          <div className="mt-10 flex flex-col items-center gap-3">
            <Link
              href="/browse"
              className="w-full max-w-sm rounded-full bg-[#2563EB] px-8 py-4 text-center text-base font-bold text-white shadow-lg transition hover:bg-blue-600 active:scale-95 sm:w-auto sm:min-w-[280px]"
            >
              Find a place to live
            </Link>
            <Link
              href="/register?role=owner"
              className="rounded-full border-2 border-[#111B29]/20 px-7 py-3.5 text-center text-sm font-bold text-[#111B29] transition hover:border-[#111B29]/40 hover:bg-black/5 active:scale-95"
            >
              List my property
            </Link>
          </div>
        </div>
      </section>

      {/* ── 2. THE SCENE ──────────────────────────────────────────────────────── */}
      <TheScene />

      {/* ── 3. THE TURN: THREE DOORS ──────────────────────────────────────────── */}
      <ThreeDoors />

      {/* ── 4. LANDLORD STRIP ─────────────────────────────────────────────────── */}
      <LandlordStrip />

      {/* ── 5. TRUST STRIP ────────────────────────────────────────────────────── */}
      <section className="bg-[#F7F7F5] px-6 py-14">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {TRUST_CHIPS.map((chip) => (
            <div key={chip} className="flex items-center gap-2">
              <CheckIcon />
              <span className="text-sm font-semibold text-[#111B29]">
                {chip}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. FINAL CTA ──────────────────────────────────────────────────────── */}
      <section className="bg-[#2563EB] px-6 py-24 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="text-4xl font-extrabold text-white md:text-5xl">
            The listing is out there. The deal starts here.
          </h2>
          <p className="mt-4 text-base text-blue-100">
            Free for tenants. Free to list. No commission.
          </p>
          <div className="mt-10 flex flex-col items-center gap-3">
            <Link
              href="/browse"
              className="w-full max-w-sm rounded-full bg-white px-8 py-4 text-center text-base font-extrabold text-[#2563EB] shadow-lg transition hover:bg-blue-50 active:scale-95 sm:w-auto sm:min-w-[280px]"
            >
              Find a place to live
            </Link>
            <Link
              href="/register?role=owner"
              className="rounded-full border-2 border-white/40 px-7 py-3.5 text-center text-sm font-bold text-white transition hover:border-white hover:bg-white/10 active:scale-95"
            >
              List my property
            </Link>
            <Link
              href="/investment-scores"
              className="mt-1 text-sm text-blue-200/80 underline-offset-2 hover:text-blue-100 hover:underline"
            >
              Investing in property? Explore investor tools
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
