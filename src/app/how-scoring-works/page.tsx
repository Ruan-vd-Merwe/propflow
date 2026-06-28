import Link from "next/link";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

// ─── Data ─────────────────────────────────────────────────────────────────────

const DIMENSIONS = [
  {
    name: "Affordability",
    weight: "22%",
    desc: "Compares rent and total living costs against your income and budget. Flags properties that stretch your finances beyond the 30% rule.",
  },
  {
    name: "Property Fit",
    weight: "18%",
    desc: "Matches property features, size and bedroom count against your stated preferences. Includes security, parking and connectivity.",
  },
  {
    name: "Area Fit",
    weight: "17%",
    desc: "Scores how well the suburb matches your preferred areas and area interests such as schools, retail access and green space.",
  },
  {
    name: "Lifestyle Fit",
    weight: "15%",
    desc: "Matches the area personality and walkability against your lifestyle interests such as running routes, coffee shops and remote work.",
  },
  {
    name: "Commute",
    weight: "10%",
    desc: "Calculates estimated travel time from the property to your stated work locations. Scores drop as commute time increases.",
  },
  {
    name: "Deal Quality",
    weight: "8%",
    desc: "Compares the asking rent against the suburb average. Higher scores mean better value for the area.",
  },
  {
    name: "Safety",
    weight: "6%",
    desc: "Combines crime index, street lighting, security presence and pedestrian activity into a single safety score.",
  },
  {
    name: "Approval Likelihood",
    weight: "4%",
    desc: "Estimates your chance of being approved based on rent-to-income ratio and current competition for the property.",
  },
];

const CONFIDENCE_TABLE = [
  { data: "Rent amount", impact: "High" },
  { data: "Suburb", impact: "High" },
  { data: "Suburb average rent", impact: "High" },
  { data: "Property features", impact: "Medium" },
  { data: "Area crime data", impact: "Medium" },
  { data: "Commute data", impact: "Medium" },
  { data: "Application count", impact: "Low" },
];

function impactBadge(impact: string) {
  if (impact === "High") return "bg-green-100 text-green-700";
  if (impact === "Medium") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-500";
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function HowScoringWorksPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 antialiased">
      <MarketingNav />

      {/* Hero */}
      <section className="bg-[#0f172a] px-6 pb-16 pt-14 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">
            How PropTrust matching works
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-400">
            Our matching engine analyses 8 dimensions to connect the right
            tenants with the right properties.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        {/* Tenant matching */}
        <section className="mb-16">
          <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-slate-900">
            For tenants finding a home
          </h2>
          <p className="mb-8 text-base text-slate-500">
            Every listed property is scored across 8 dimensions. The overall
            match score is a weighted average — dimensions you care about most
            count more.
          </p>

          {/* Weight bar */}
          <div className="mb-8 overflow-hidden rounded-2xl bg-slate-900 p-5">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              Weight distribution
            </p>
            <div className="flex h-3 overflow-hidden rounded-full">
              {DIMENSIONS.map((d) => {
                const w = parseFloat(d.weight);
                return (
                  <div
                    key={d.name}
                    style={{ width: `${w}%` }}
                    className="h-full border-r border-slate-800 bg-blue-600 first:rounded-l-full last:rounded-r-full last:border-0"
                    title={`${d.name}: ${d.weight}`}
                  />
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
              {DIMENSIONS.map((d) => (
                <span key={d.name} className="text-xs text-slate-400">
                  {d.name}{" "}
                  <span className="font-semibold text-slate-200">
                    {d.weight}
                  </span>
                </span>
              ))}
            </div>
          </div>

          {/* Dimension cards — 2 column grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            {DIMENSIONS.map((d) => (
              <div
                key={d.name}
                className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="font-bold text-slate-900">{d.name}</h3>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                    {d.weight}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-slate-500">
                  {d.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Confidence */}
        <section className="mb-16">
          <h2 className="mb-3 text-2xl font-extrabold tracking-tight text-slate-900">
            What affects score accuracy
          </h2>
          <p className="mb-6 text-base text-slate-500">
            Each score has a confidence percentage. Scores based on more
            complete data are more reliable. A confidence below 40% means the
            score is indicative only.
          </p>

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Data point
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Impact on confidence
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {CONFIDENCE_TABLE.map((row) => (
                  <tr key={row.data} className="bg-white">
                    <td className="px-5 py-3 font-medium text-slate-700">
                      {row.data}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${impactBadge(row.impact)}`}
                      >
                        {row.impact}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Trust statement */}
        <section className="mb-12 rounded-2xl bg-[#0f172a] p-8 text-white">
          <p className="text-base font-semibold">
            A note on how to use these scores
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            PropTrust matching scores are designed to help you prioritise
            properties worth viewing. They are not a guarantee of approval or
            financial advice. Always do your own due diligence before signing a
            lease.
          </p>
        </section>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/register"
            className="inline-block rounded-full bg-slate-900 px-8 py-3.5 text-sm font-bold text-white transition hover:bg-slate-700"
          >
            Get started free
          </Link>
          <p className="mt-3 text-xs text-slate-400">
            Sign up and start matching with properties today.
          </p>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
