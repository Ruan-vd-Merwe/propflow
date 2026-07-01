import Link from "next/link";
import { ScrollReveal } from "./ScrollReveal";

const LANDLORD_STEPS = [
  {
    n: "01",
    title: "List your property",
    desc: "Add photos, pricing, and details once. Your listing is visible to verified tenants immediately.",
  },
  {
    n: "02",
    title: "Receive better applications",
    desc: "Every applicant arrives with a complete rental profile, not a one-line enquiry.",
  },
  {
    n: "03",
    title: "Review tenant fit",
    desc: "See verified income summary, documents, and references before you commit to a viewing.",
  },
  {
    n: "04",
    title: "Lease and documents",
    desc: "Send a digital lease and keep every signed document organised by property.",
  },
  {
    n: "05",
    title: "Track rent",
    desc: "Log payments as they come in and see monthly cash flow across your properties.",
  },
  {
    n: "06",
    title: "Coordinate maintenance",
    desc: "Keep maintenance requests and their resolution in one place, per property.",
  },
];

const DASHBOARD_ROWS = [
  { label: "Tenant applications", status: "3 new" },
  { label: "Rent received this month", status: "2 of 3" },
  { label: "Open maintenance requests", status: "1 open" },
];

function LandlordDashboardPreview() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="mb-5 text-xs font-bold uppercase tracking-widest text-slate-400">
        Portfolio overview
      </p>
      <div className="space-y-3">
        {DASHBOARD_ROWS.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
          >
            <p className="text-sm text-slate-600">{row.label}</p>
            <span className="text-xs font-semibold text-slate-700">
              {row.status}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-xl bg-[#0f172a] px-4 py-3 text-center">
        <p className="text-xs font-bold text-white">
          Free to list · Pay per tool · No agent commission
        </p>
      </div>
    </div>
  );
}

export function LandlordJourney() {
  return (
    <section id="list" className="bg-white px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#1e40af]">
            For Landlords
          </p>
          <h2 className="mb-5 text-3xl font-extrabold tracking-tight text-[#0f172a] md:text-4xl">
            The tools you usually pay an agent for.
          </h2>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-500">
            Without losing control of your property, or paying commission for
            work you can do yourself. PropTrust does not replace everything an
            agent does. It replaces the parts that were only ever admin.
          </p>
        </div>

        <ScrollReveal className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div className="grid gap-5 sm:grid-cols-2">
            {LANDLORD_STEPS.map((step) => (
              <div
                key={step.n}
                className="reveal rounded-2xl bg-[#f8fafc] p-6 ring-1 ring-slate-100"
              >
                <p className="mb-3 text-2xl font-extrabold text-slate-200">
                  {step.n}
                </p>
                <h3 className="mb-1.5 text-sm font-bold text-[#0f172a]">
                  {step.title}
                </h3>
                <p className="text-xs leading-relaxed text-slate-500">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="reveal lg:sticky lg:top-24">
            <LandlordDashboardPreview />
            <div className="mt-6 text-center lg:text-left">
              <Link
                href="/register?role=owner"
                className="inline-block rounded-full bg-[#0f172a] px-7 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                List my property
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
