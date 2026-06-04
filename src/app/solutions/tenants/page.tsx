import Link from "next/link";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

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

const BENEFITS = [
  {
    title: "Always free for tenants",
    body: "Creating and maintaining your PropTrust tenant profile is free. You pay nothing to apply for properties or connect with landlords.",
    perks: ["No sign-up fee", "No agent commission", "No hidden charges"],
  },
  {
    title: "Direct landlord connections",
    body: "Connect directly with landlords who are looking for tenants like you. No middleman, no inflated fees, just a clear application process.",
    perks: ["No agent dependency", "Direct messaging", "Transparent process"],
  },
  {
    title: "Build your rental history",
    body: "Every tenancy adds to your rental profile. A positive track record makes it easier to secure quality rentals in the future.",
    perks: [
      "Payment history tracking",
      "References over time",
      "Portable rental record",
    ],
  },
  {
    title: "A verified profile that stands out",
    body: "Landlords receive many applications. A verified PropTrust profile, with confirmed ID, income and references, helps you stand out as a reliable applicant.",
    perks: ["SA ID verification", "Income confirmation", "Reference workflow"],
  },
];

const STEPS = [
  {
    title: "Create your profile",
    body: "Sign up for free and build a secure rental profile that helps landlords understand who you are.",
  },
  {
    title: "Complete verification",
    body: "Upload your SA ID and bank statements. Completing verification creates a stronger application.",
  },
  {
    title: "Connect directly",
    body: "Browse matched properties and connect with landlords directly, without unnecessary friction or agent fees.",
  },
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
              Find your next home
              <br />
              <span className="text-[#3b82f6]">and apply with confidence</span>
            </h1>
            <p className="mb-10 text-lg leading-relaxed text-slate-300">
              Build a verified rental profile, connect directly with landlords
              and make a stronger application, all for free.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/register"
                className="rounded-full bg-[#3b82f6] px-7 py-3.5 text-base font-bold text-white transition hover:bg-blue-500"
              >
                Create free profile
              </Link>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Free for tenants. Always.
            </p>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="bg-[#f8fafc] px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-[#0f172a] md:text-4xl">
              Why tenants use PropTrust
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {BENEFITS.map((b) => (
              <div
                key={b.title}
                className="rounded-2xl border border-[#e2e8f0] bg-white p-8"
              >
                <h3 className="mb-3 text-xl font-extrabold text-[#0f172a]">
                  {b.title}
                </h3>
                <p className="mb-5 text-sm leading-relaxed text-slate-500">
                  {b.body}
                </p>
                <ul className="space-y-2">
                  {b.perks.map((p) => (
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
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-white px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-14 text-center text-3xl font-extrabold tracking-tight text-[#0f172a] md:text-4xl">
            How it works for tenants
          </h2>

          <div className="grid gap-6 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <div
                key={i}
                className="relative rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-7"
              >
                {i < 2 && (
                  <div className="absolute right-[-13px] top-9 z-10 hidden h-px w-6 border-t-2 border-dashed border-slate-200 md:block" />
                )}
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-sm font-extrabold text-white">
                  {i + 1}
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

      {/* PRIVACY */}
      <section className="bg-[#f8fafc] px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100">
              <svg
                className="h-7 w-7 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>
          <h2 className="mb-4 text-2xl font-extrabold text-[#0f172a]">
            Your data, your control
          </h2>
          <p className="mb-6 text-base leading-relaxed text-slate-500">
            PropTrust is POPIA compliant. Your personal details are stored
            securely and are only shared with landlords when you actively choose
            to connect with them. You can update or remove your information at
            any time.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              "POPIA Compliant",
              "Encrypted storage",
              "You control sharing",
              "Delete anytime",
            ].map((label) => (
              <span
                key={label}
                className="rounded-full border border-green-200 bg-green-50 px-3.5 py-1.5 text-sm font-medium text-green-700"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1e40af] px-6 py-24 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="mb-5 text-3xl font-extrabold text-white">
            Create your free tenant profile
          </h2>
          <p className="mb-10 text-blue-100">
            Free for tenants. Always. Takes a few minutes to set up.
          </p>
          <Link
            href="/register"
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
