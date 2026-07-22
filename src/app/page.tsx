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
      className="h-4 w-4 shrink-0 text-[#6E7F5C]"
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
    <div className="min-h-screen bg-[#F1ECE1] font-sans text-slate-900 antialiased">
      <MarketingNav />

      {/* ── JOURNEY-BASED HERO + STORY ────────────────────────────────────────── */}
      <MarketingJourneys />

      {/* ── TRUST STRIP ───────────────────────────────────────────────────────── */}
      <section className="border-t border-[rgba(30,42,46,0.13)] bg-white py-[26px] font-[family-name:var(--font-ibm-plex-sans)]">
        <div className="mx-auto flex max-w-[var(--pt-container-max)] flex-wrap items-center justify-center gap-x-9 gap-y-4 px-6 sm:px-10">
          {TRUST_CHIPS.map((chip) => (
            <div key={chip} className="flex items-center gap-2">
              <CheckIcon />
              <span className="text-sm font-semibold text-[#1E2A2E]/75">
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
