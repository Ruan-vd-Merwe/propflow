import Link from "next/link";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

export const metadata = {
  title: "Manage rental properties without agent commission | PropTrust",
  description:
    "Screen tenants, manage leases, track rent and portfolio finances without paying agent commission.",
};

function FeatureIcon({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#1e40af]">
      {children}
    </div>
  );
}

const FEATURES = [
  {
    title: "Screen tenants",
    desc: "Review verified rental profiles including income summary, bank statement affordability, ID, and references before signing.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: "Manage leases and documents",
    desc: "Store signed leases, inspection reports, body corporate rules, and tenant documents organised per property.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    title: "Track rent",
    desc: "Log payments, flag arrears, and send WhatsApp reminders.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    title: "Portfolio finances",
    desc: "Track bond payments, levies, rates, insurance, and net cash flow per property. See gross and net yield.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    title: "Maintenance",
    desc: "Log repair requests, assign contractors, and keep a record of work done.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: "Body corporate",
    desc: "Upload meeting minutes, track levies, and manage sectional title admin in one place.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
];

const PRICING_TIERS = [
  { name: "Starter", price: "R99", note: "Up to 3 properties" },
  { name: "Professional", price: "R299", note: "Multiple properties", featured: true },
  { name: "Enterprise", price: "R799", note: "Unlimited properties" },
];

export default function LandlordsPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 antialiased">
      <MarketingNav />

      {/* HERO */}
      <section className="bg-[#0f172a] px-6 pb-20 pt-20 md:pt-28">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-blue-400">
              For Landlords
            </p>
            <h1 className="mb-5 text-5xl font-extrabold leading-tight tracking-tight text-white md:text-6xl">
              Manage your rental properties without
              <br />
              <span className="text-[#3b82f6]">paying away your margin.</span>
            </h1>
            <p className="mb-10 text-lg leading-relaxed text-slate-300">
              PropTrust gives landlords the tools to screen tenants, store
              leases, track rent, manage maintenance, and understand portfolio
              finances without relying on a rental agent.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/register?type=landlord"
                className="rounded-full bg-[#3b82f6] px-7 py-3.5 text-base font-bold text-white transition hover:bg-blue-500"
              >
                Set up my portfolio
              </Link>
              <Link
                href="/pricing"
                className="rounded-full border-2 border-white/30 px-7 py-3.5 text-base font-bold text-white transition hover:border-white/60 hover:bg-white/5"
              >
                View pricing
              </Link>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              No credit card required. 30-day free trial.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="bg-[#f8fafc] px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-[#0f172a] md:text-4xl">
              What PropTrust does for landlords
            </h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-[#e2e8f0] bg-white p-8"
              >
                <FeatureIcon>{f.icon}</FeatureIcon>
                <h3 className="mb-2 mt-5 font-bold text-[#0f172a]">{f.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING SUMMARY */}
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-3xl rounded-3xl border border-[#e2e8f0] bg-[#f8fafc] p-10 text-center">
          <h2 className="mb-4 text-2xl font-extrabold text-[#0f172a]">
            Landlord pricing
          </h2>
          <p className="mb-8 text-slate-500">
            Flat monthly subscription. No agent commission. No setup fee.
          </p>
          <div className="flex flex-col items-center justify-center gap-5 sm:flex-row">
            {PRICING_TIERS.map((p) => (
              <div
                key={p.name}
                className={`flex-1 rounded-2xl p-6 ${p.featured ? "bg-[#0f172a] text-white" : "border border-[#e2e8f0] bg-white"}`}
              >
                <p
                  className={`mb-1 text-xs font-bold uppercase tracking-wider ${p.featured ? "text-blue-300" : "text-slate-400"}`}
                >
                  {p.name}
                </p>
                <p
                  className={`text-2xl font-extrabold ${p.featured ? "text-white" : "text-[#0f172a]"}`}
                >
                  {p.price}
                  <span className={`text-sm font-normal ${p.featured ? "text-blue-300" : "text-slate-400"}`}>
                    /mo
                  </span>
                </p>
                <p
                  className={`mt-1 text-xs ${p.featured ? "text-blue-200" : "text-slate-400"}`}
                >
                  {p.note}
                </p>
              </div>
            ))}
          </div>
          <Link
            href="/pricing"
            className="mt-8 inline-block text-sm font-semibold text-[#1e40af] underline-offset-2 hover:underline"
          >
            See full pricing
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1e40af] px-6 py-24 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="mb-5 text-3xl font-extrabold text-white">
            Set up your portfolio
          </h2>
          <p className="mb-10 text-blue-100">
            30-day free trial. No credit card required.
          </p>
          <Link
            href="/register?type=landlord"
            className="rounded-full bg-white px-8 py-4 text-base font-extrabold text-[#1e40af] transition hover:bg-blue-50"
          >
            Get started free
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
