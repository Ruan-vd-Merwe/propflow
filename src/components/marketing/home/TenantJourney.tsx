import Link from "next/link";
import { ScrollReveal } from "./ScrollReveal";

const TENANT_STEPS = [
  {
    n: "01",
    title: "Choose your area",
    desc: "Match suburbs by budget, commute, safety, and lifestyle before browsing listings.",
  },
  {
    n: "02",
    title: "Build your profile",
    desc: "Upload your documents once and reuse your rental profile for every application.",
  },
  {
    n: "03",
    title: "Apply directly",
    desc: "Contact landlords without going through an agent.",
  },
  {
    n: "04",
    title: "Track your deal",
    desc: "Track applications and keep documents in one place.",
  },
];

export function TenantJourney() {
  return (
    <section id="rent" className="bg-white px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#1e40af]">
            For Tenants
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-[#0f172a] md:text-4xl">
            Find the right place,
            <br className="hidden sm:block" />
            not just the first available listing.
          </h2>
        </div>

        <ScrollReveal className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TENANT_STEPS.map((step) => (
            <div
              key={step.n}
              className="reveal rounded-2xl bg-white p-7 shadow-sm ring-1 ring-slate-100"
            >
              <p className="mb-4 text-3xl font-extrabold text-slate-100">
                {step.n}
              </p>
              <h3 className="mb-2 text-base font-bold text-[#0f172a]">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-slate-500">
                {step.desc}
              </p>
            </div>
          ))}
        </ScrollReveal>

        <div className="mt-10 text-center">
          <Link
            href="/area-match"
            className="inline-block rounded-full bg-[#0f172a] px-7 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            Find my area
          </Link>
        </div>
      </div>
    </section>
  );
}
