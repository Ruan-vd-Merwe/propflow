import Link from "next/link";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

const VALUES = [
  {
    title: "Transparency over complexity",
    body: "Rental management should not require a legal degree or a letting agent. We build tools that make the process clear for everyone involved.",
  },
  {
    title: "Built for South Africa",
    body: "We are not adapting a foreign product for the local market. PropTrust is designed around South African rental law, local communication habits and the realities of managing property in this country.",
  },
  {
    title: "Fair access for tenants",
    body: "Tenants carry significant risk in the rental process. PropTrust gives them a structured way to present themselves and build a reliable rental record, without paying for the privilege.",
  },
  {
    title: "Less admin, better decisions",
    body: "Every feature we build is measured against one question: does this reduce unnecessary admin or help someone make a better decision? If not, we do not build it.",
  },
];

const TIMELINE = [
  {
    year: "2023",
    title: "The problem became clear",
    body: "Our founders spent years dealing with the friction of the South African rental market, unreliable screening, fragmented communication, and a dependence on agents that added cost without adding clarity.",
  },
  {
    year: "2024",
    title: "PropTrust takes shape",
    body: "The first version of PropTrust was built to solve a single problem: giving landlords a structured way to screen tenants and track rent without an agent in the middle. Early feedback from landlords shaped the product significantly.",
  },
  {
    year: "2025",
    title: "Expanding the platform",
    body: "Maintenance management, document storage, WhatsApp notifications and the tenant marketplace were added based on direct feedback from landlords, tenants and property managers using the platform.",
  },
  {
    year: "2026",
    title: "Where we are now",
    body: "PropTrust is an active platform supporting landlords, tenants and property managers across South Africa. We are continuing to build based on real workflows and real feedback.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 antialiased">
      <MarketingNav />

      {/* HERO */}
      <section className="bg-[#0f172a] px-6 pb-24 pt-20 md:pt-28">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-blue-400">
              About PropTrust
            </p>
            <h1 className="mb-6 text-5xl font-extrabold leading-[1.1] tracking-tight text-white md:text-6xl">
              We are building a better way
              <br />
              <span className="text-[#3b82f6]">
                to manage South African rentals
              </span>
            </h1>
            <p className="text-lg leading-relaxed text-slate-300">
              PropTrust started with a straightforward frustration: the South
              African rental market is more complicated and more expensive than
              it needs to be. We are building the tools to change that.
            </p>
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section className="bg-white px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[#1e40af]">
                Our mission
              </p>
              <h2 className="mb-6 text-3xl font-extrabold tracking-tight text-[#0f172a] md:text-4xl">
                Reduce the cost and complexity of renting in South Africa
              </h2>
              <p className="mb-5 text-base leading-relaxed text-slate-500">
                For too long, the rental process has been built around
                intermediaries. Agents charge significant commissions for tasks
                that technology can handle reliably. Tenants have no easy way to
                build or share a verified rental record. Landlords have no
                structured place to manage everything.
              </p>
              <p className="text-base leading-relaxed text-slate-500">
                PropTrust puts the tools directly in the hands of landlords and
                tenants. Not to replace every professional relationship, but to
                give both sides more control, more clarity and a better record
                of what has happened.
              </p>
            </div>

            {/* Stats card */}
            <div className="rounded-3xl bg-[#f8fafc] p-10">
              <div className="grid grid-cols-2 gap-8">
                {[
                  { value: "60+", label: "Properties on the platform" },
                  { value: "R0", label: "Agent commission required" },
                  { value: "2023", label: "Year we started building" },
                  { value: "100%", label: "South African built" },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="text-3xl font-extrabold text-[#0f172a]">
                      {s.value}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">{s.label}</p>
                  </div>
                ))}
              </div>
              <p className="mt-8 border-t border-[#e2e8f0] pt-6 text-xs text-slate-400">
                Launch benchmarks and product targets. Final figures may vary.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="bg-[#f8fafc] px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[#1e40af]">
            How we got here
          </p>
          <h2 className="mb-14 text-3xl font-extrabold tracking-tight text-[#0f172a] md:text-4xl">
            The PropTrust story
          </h2>

          <div className="relative space-y-0">
            {/* Vertical line */}
            <div className="absolute left-[19px] top-0 h-full w-0.5 bg-[#e2e8f0] md:left-[39px]" />

            {TIMELINE.map((item, i) => (
              <div key={i} className="relative flex gap-8 pb-12 last:pb-0">
                {/* Year bubble */}
                <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[#e2e8f0] bg-white text-xs font-extrabold text-[#1e40af] md:h-20 md:w-20 md:text-sm">
                  <span className="hidden md:block">{item.year}</span>
                  <span className="block md:hidden">{item.year.slice(2)}</span>
                </div>
                <div className="pt-1.5">
                  <p className="mb-2 font-bold text-[#0f172a]">{item.title}</p>
                  <p className="text-sm leading-relaxed text-slate-500">
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="bg-white px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[#1e40af]">
            What we believe
          </p>
          <h2 className="mb-14 text-3xl font-extrabold tracking-tight text-[#0f172a] md:text-4xl">
            How we approach the work
          </h2>

          <div className="grid gap-8 md:grid-cols-2">
            {VALUES.map((v, i) => (
              <div key={i} className="flex gap-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[#e2e8f0] text-sm font-extrabold text-[#0f172a]">
                  {i + 1}
                </div>
                <div>
                  <h3 className="mb-2 font-bold text-[#0f172a]">{v.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-500">
                    {v.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT STRIP */}
      <section className="bg-[#f8fafc] px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-6 rounded-3xl border border-[#e2e8f0] bg-white p-10 md:grid-cols-3">
            <div className="md:col-span-2">
              <h2 className="mb-3 text-2xl font-extrabold text-[#0f172a]">
                Get in touch
              </h2>
              <p className="text-sm leading-relaxed text-slate-500">
                We are a small team and we read every message. If you have a
                question about PropTrust, want to give feedback or are
                interested in working with us, reach out.
              </p>
              <p className="mt-4 text-sm font-semibold text-[#0f172a]">
                hello@proptrust.co.za
              </p>
              <p className="text-sm text-slate-400">
                Cape Town, South Africa · Mon–Fri 8am–5pm SAST
              </p>
            </div>
            <div className="flex items-center md:justify-end">
              <Link
                href="/contact"
                className="rounded-xl bg-[#0f172a] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                Contact us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1e40af] px-6 py-24 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="mb-5 text-3xl font-extrabold text-white">
            Try PropTrust for free
          </h2>
          <p className="mb-10 text-blue-100">
            30-day free trial. No credit card required. Built for South Africa.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="rounded-full bg-white px-8 py-4 text-base font-extrabold text-[#1e40af] transition hover:bg-blue-50"
            >
              Start free trial
            </Link>
            <Link
              href="/features"
              className="rounded-full border-2 border-white/40 px-8 py-4 text-base font-bold text-white transition hover:border-white hover:bg-white/10"
            >
              Explore features
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
