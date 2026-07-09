import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import { MarketingJourneys } from "@/components/marketing/home/MarketingJourneys";

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
      <MarketingNav />

      {/* ── JOURNEY-BASED HERO + STORY ────────────────────────────────────────── */}
      <MarketingJourneys />

      {/* ── TRUST STRIP ───────────────────────────────────────────────────────── */}
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

      <MarketingFooter />
    </div>
  );
}
