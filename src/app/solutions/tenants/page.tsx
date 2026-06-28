import Link from "next/link";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

export const metadata = {
  title: "Find a rental that fits your life | PropTrust",
  description:
    "Create one verified rental profile, match suburbs by lifestyle and budget, and apply directly to landlords without agent fees.",
};

function Check() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-green-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

const HOW_IT_WORKS = [
  {
    n: 1,
    title: "Find your area",
    body: "Use Area Match to shortlist suburbs by budget, commute, lifestyle, and safety.",
  },
  {
    n: 2,
    title: "Build your rental profile",
    body: "Upload your ID and documents once. Reuse your verified profile for every application.",
  },
  {
    n: 3,
    title: "Apply directly",
    body: "Send your profile to landlords directly. No agent handling your application.",
  },
];

const TENANT_FEATURES = [
  "Area Match",
  "Verified rental profile",
  "Document storage",
  "Application tracking",
  "Direct landlord contact",
  "Always free",
];

export default function TenantsPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 antialiased">
      <MarketingNav />

      {/* HERO */}
      <section className="bg-[#0f172a] px-6 pb-20 pt-20 md:pt-28">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-green-400">
              For Tenants
            </p>
            <h1 className="mb-5 text-5xl font-extrabold leading-tight tracking-tight text-white md:text-6xl">
              Find a rental that fits your life,
              <br />
              <span className="text-[#3b82f6]">not just your budget.</span>
            </h1>
            <p className="mb-10 text-lg leading-relaxed text-slate-300">
              Create one verified rental profile, match the right suburb, and
              apply directly to landlords across South Africa.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/area-match"
                className="rounded-full bg-[#3b82f6] px-7 py-3.5 text-base font-bold text-white transition hover:bg-blue-500"
              >
                Find my area
              </Link>
              <Link
                href="/register"
                className="rounded-full border-2 border-white/30 px-7 py-3.5 text-base font-bold text-white transition hover:border-white/60 hover:bg-white/5"
              >
                Create rental profile
              </Link>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Free for tenants. Always.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-white px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-14 text-center text-3xl font-extrabold tracking-tight text-[#0f172a] md:text-4xl">
            How it works
          </h2>

          <div className="grid gap-6 md:grid-cols-3">
            {HOW_IT_WORKS.map((step, i) => (
              <div
                key={i}
                className="relative rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-7"
              >
                {i < 2 && (
                  <div className="absolute right-[-13px] top-9 z-10 hidden h-px w-6 border-t-2 border-dashed border-slate-200 md:block" />
                )}
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-sm font-extrabold text-white">
                  {step.n}
                </div>
                <h3 className="mb-2 font-bold text-[#0f172a]">{step.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT TENANTS GET */}
      <section className="bg-[#f8fafc] px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-10 text-center text-2xl font-extrabold text-[#0f172a]">
            What you get with PropTrust
          </h2>
          <div className="rounded-2xl border border-[#e2e8f0] bg-white p-8">
            <ul className="space-y-4">
              {TENANT_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-slate-700">
                  <Check />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* PRIVACY NOTE */}
      <section className="bg-white px-6 py-16">
        <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-[#f8fafc] p-8 text-center">
          <p className="mb-2 text-sm font-bold text-[#0f172a]">Your data, your control</p>
          <p className="text-sm leading-relaxed text-slate-500">
            You control what you share. Documents are only sent to landlords you
            apply to.
          </p>
          <Link
            href="/trust"
            className="mt-4 inline-block text-xs font-semibold text-[#1e40af] underline-offset-2 hover:underline"
          >
            Read our Trust and Security page
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1e40af] px-6 py-24 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="mb-5 text-3xl font-extrabold text-white">
            Start with your area
          </h2>
          <p className="mb-10 text-blue-100">
            Free for tenants. Always. Takes a few minutes to set up.
          </p>
          <Link
            href="/area-match"
            className="rounded-full bg-white px-8 py-4 text-base font-extrabold text-[#1e40af] transition hover:bg-blue-50"
          >
            Find my area
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
