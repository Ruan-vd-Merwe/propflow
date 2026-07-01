import Link from "next/link";
import { ScrollReveal } from "./ScrollReveal";

const DOCUMENT_CHIPS = ["ID verified", "Proof of income", "Bank statement", "References"];

const AREA_PREVIEW = [
  { name: "Sea Point", fit: "Great fit" },
  { name: "Rondebosch", fit: "Good fit" },
  { name: "Gardens", fit: "Good fit" },
  { name: "Woodstock", fit: "Fair fit" },
];

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="reveal flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      {children}
    </div>
  );
}

function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[#1e40af]">
      {children}
    </p>
  );
}

// ── a. Rental profile card ───────────────────────────────────────────────────

function RentalProfileCard() {
  return (
    <CardShell>
      <CardLabel>Rental profile</CardLabel>
      <h3 className="mb-2 text-lg font-extrabold text-[#0f172a]">
        Rental readiness
      </h3>
      <span className="mb-4 inline-block w-fit rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
        Profile confidence: Strong
      </span>
      <p className="mb-5 flex-1 text-sm leading-relaxed text-slate-500">
        Verify once. Your TrustScore travels with every application, so you
        never have to explain yourself twice.
      </p>
      <div className="flex flex-wrap gap-2">
        {DOCUMENT_CHIPS.map((chip) => (
          <span
            key={chip}
            className="flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600"
          >
            <svg className="h-3 w-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {chip}
          </span>
        ))}
      </div>
    </CardShell>
  );
}

// ── b. Property match card ───────────────────────────────────────────────────

function PropertyMatchCard() {
  return (
    <CardShell>
      <CardLabel>Property match</CardLabel>
      <div className="mb-3 h-28 w-full rounded-xl bg-gradient-to-br from-slate-100 to-slate-200" />
      <p className="text-[26px] font-extrabold leading-none tracking-tight text-[#0f172a]">
        R14,700
        <span className="ml-1 text-sm font-medium text-slate-400">/mo</span>
      </p>
      <p className="mt-3 text-sm font-semibold text-slate-900">
        Sea Point Apartment
      </p>
      <p className="mt-1 text-xs text-slate-500">Sea Point, Cape Town</p>
      <p className="mt-4 flex-1 text-xs font-medium leading-relaxed text-green-700">
        Excellent fit. Well within budget.
      </p>
      <span className="mt-3 inline-block w-fit rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
        2 bed · Apartment
      </span>
    </CardShell>
  );
}

// ── c. Area Match preview ─────────────────────────────────────────────────────

function AreaMatchPreviewCard() {
  return (
    <CardShell>
      <CardLabel>Area Match</CardLabel>
      <h3 className="mb-4 text-lg font-extrabold text-[#0f172a]">
        Know the area first
      </h3>
      <div className="mb-5 flex-1 space-y-2">
        {AREA_PREVIEW.map((a) => (
          <div
            key={a.name}
            className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
          >
            <span className="text-sm font-semibold text-slate-900">
              {a.name}
            </span>
            <span className="text-xs font-semibold text-[#1e40af]">
              {a.fit}
            </span>
          </div>
        ))}
      </div>
      <Link
        href="/area-match"
        className="text-sm font-semibold text-[#1e40af] underline-offset-2 hover:underline"
      >
        Explore Area Match →
      </Link>
    </CardShell>
  );
}

// ── Section ─────────────────────────────────────────────────────────────────

export function ArtefactCards() {
  return (
    <section className="bg-[#f8fafc] px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-[#0f172a] md:text-4xl">
            What tenants actually see
          </h2>
        </div>
        <ScrollReveal className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <RentalProfileCard />
          <PropertyMatchCard />
          <AreaMatchPreviewCard />
        </ScrollReveal>
      </div>
    </section>
  );
}
