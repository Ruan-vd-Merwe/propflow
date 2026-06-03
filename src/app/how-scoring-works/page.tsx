import Link from 'next/link'
import MarketingNav from '@/components/marketing/MarketingNav'
import MarketingFooter from '@/components/marketing/MarketingFooter'

// ─── Data ─────────────────────────────────────────────────────────────────────

const TENANT_DIMENSIONS = [
  {
    name: 'Financial fit',
    weight: '20%',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    desc: 'Compares the monthly rent against your stated budget and income. A rent-to-income ratio below 30% scores highest — this is the single most important factor in your match score.',
  },
  {
    name: 'Deal value',
    weight: '14%',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
    desc: 'Measures how the listed rent compares to the suburb average. Properties priced below market average score higher, giving tenants a fair signal on relative pricing.',
  },
  {
    name: 'Safety',
    weight: '12%',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    desc: 'Combines local crime index, street lighting quality, pedestrian activity and visible security presence into a single neighbourhood safety score.',
  },
  {
    name: 'Lifestyle match',
    weight: '10%',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    desc: 'Matches your lifestyle preferences and tags against the area personality. Also considers proximity to coffee shops, gyms, parks and grocery stores.',
  },
  {
    name: 'Commute',
    weight: '10%',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    desc: 'Uses your saved work locations to calculate average commute time. Under 15 minutes scores highest; over 60 minutes receives the lowest score.',
  },
  {
    name: 'Timing',
    weight: '7%',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    desc: 'Considers your target move-in month relative to seasonal rental demand. Off-peak moves score higher as you face less competition and have more negotiating room.',
  },
  {
    name: 'Approval likelihood',
    weight: '9%',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
    desc: 'Estimates your chance of being approved based on income ratio, employment stability, credit profile and current application competition for the property.',
  },
  {
    name: 'Landlord quality',
    weight: '8%',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    desc: 'Aggregates landlord communication responsiveness, maintenance turnaround, deposit return history and tenant dispute records.',
  },
  {
    name: 'Market pressure',
    weight: '3%',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    desc: 'Tracks property views, days on market and competing applications to indicate how urgently you should act. High competition reduces opportunity score.',
  },
  {
    name: 'Area momentum',
    weight: '4%',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    desc: 'Considers rental price trends and development activity in the area. A rising market signals a desirable neighbourhood; stagnation may indicate future challenges.',
  },
  {
    name: 'Hidden cost risk',
    weight: '3%',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    ),
    desc: 'Adds estimated electricity, water, internet, parking and transport costs to the base rent and compares the total against your living budget.',
  },
]

const BUYER_STRATEGIES = [
  {
    name: 'Yield-focused',
    value: 'yield',
    color: 'bg-green-50 border-green-200',
    titleColor: 'text-green-800',
    top: ['Yield (40%)', 'Stability (20%)', 'Value (15%)'],
    desc: 'Maximises monthly rental income relative to purchase price. Best for investors who want cash-flow positive properties from day one.',
  },
  {
    name: 'Growth-focused',
    value: 'growth',
    color: 'bg-blue-50 border-blue-200',
    titleColor: 'text-blue-800',
    top: ['Capital growth (40%)', 'Liquidity (15%)', 'Value (15%)'],
    desc: 'Prioritises areas with strong price appreciation. Best for long-term wealth builders who can tolerate lower initial yields.',
  },
  {
    name: 'Stability-focused',
    value: 'stability',
    color: 'bg-purple-50 border-purple-200',
    titleColor: 'text-purple-800',
    top: ['Stability (35%)', 'Yield (20%)', 'Capital growth (15%)'],
    desc: 'Focuses on low vacancy, consistent tenant demand and family-friendly areas. Best for risk-averse investors seeking reliable income.',
  },
  {
    name: 'Balanced',
    value: 'balanced',
    color: 'bg-slate-50 border-slate-200',
    titleColor: 'text-slate-800',
    top: ['Yield (20%)', 'Growth (20%)', 'Stability (20%)', 'Value (20%)'],
    desc: 'Equal weight across all dimensions. Best for investors who want diversified exposure without over-optimising for any single factor.',
  },
]

const CONFIDENCE_FACTORS = [
  'Suburb name and location data',
  'Current asking rent or purchase price',
  'Crime index and safety data',
  'Landlord communication and maintenance scores',
  'Commute times to work locations',
  'Area lifestyle tags and personality',
  'Estimated utility and living costs',
  'Days on market and application data',
  'Annual price growth history',
  'Vacancy rate and tenant demand index',
]

// ─── Components ───────────────────────────────────────────────────────────────

function DimensionCard({
  name,
  weight,
  icon,
  desc,
}: {
  name: string
  weight: string
  icon: React.ReactNode
  desc: string
}) {
  return (
    <div className="flex gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-700">
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold text-slate-900">{name}</h3>
          <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
            {weight}
          </span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-slate-500">{desc}</p>
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function HowScoringWorksPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 antialiased">
      <MarketingNav />

      {/* Hero */}
      <section className="bg-[#0f172a] px-6 pb-16 pt-14 text-center">
        <div className="mx-auto max-w-3xl">
          <span className="mb-4 inline-flex items-center rounded-full bg-blue-900/50 px-3.5 py-1.5 text-xs font-bold text-blue-300">
            Scoring engine
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">
            How PropTrust scoring works
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-400">
            Our matching engine analyses 11 dimensions to connect the right tenants with the
            right properties — and help investors identify the best opportunities.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        {/* ── Tenant scoring ───────────────────────────────────────── */}
        <section className="mb-16">
          <div className="mb-8">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-600">
              For tenants
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
              How we score properties
            </h2>
            <p className="mt-3 max-w-2xl text-base text-slate-500">
              When you view a property as a tenant, PropTrust scores it across 11 dimensions
              weighted by importance. The higher the score, the better the fit for your profile.
            </p>
          </div>

          {/* Weight visual */}
          <div className="mb-8 overflow-hidden rounded-2xl bg-slate-900 p-6">
            <p className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">
              Score composition
            </p>
            <div className="flex h-4 overflow-hidden rounded-full">
              {TENANT_DIMENSIONS.map((d) => {
                const w = parseFloat(d.weight)
                return (
                  <div
                    key={d.name}
                    style={{ width: `${w}%` }}
                    className="h-full border-r border-slate-800 bg-blue-600 first:rounded-l-full last:rounded-r-full last:border-0"
                    title={`${d.name}: ${d.weight}`}
                  />
                )
              })}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {TENANT_DIMENSIONS.map((d) => (
                <span key={d.name} className="text-xs text-slate-400">
                  {d.name} <span className="font-semibold text-slate-300">{d.weight}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Dimension cards */}
          <div className="space-y-3">
            {TENANT_DIMENSIONS.map((d) => (
              <DimensionCard key={d.name} {...d} />
            ))}
          </div>
        </section>

        {/* ── Buyer scoring ────────────────────────────────────────── */}
        <section className="mb-16">
          <div className="mb-8">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-green-600">
              For investors
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
              How we score properties for investment
            </h2>
            <p className="mt-3 max-w-2xl text-base text-slate-500">
              Investor scores are computed across 6 dimensions: yield, capital growth, stability,
              value, liquidity and risk. The relative weighting shifts based on your strategy.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {BUYER_STRATEGIES.map((s) => (
              <div
                key={s.value}
                className={`rounded-2xl border p-5 ${s.color}`}
              >
                <h3 className={`mb-1 font-extrabold ${s.titleColor}`}>{s.name}</h3>
                <p className="mb-3 text-sm text-slate-500">{s.desc}</p>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Top weighted dimensions
                  </p>
                  {s.top.map((t) => (
                    <p key={t} className="text-xs text-slate-600">
                      ● {t}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Confidence score ─────────────────────────────────────── */}
        <section className="mb-16">
          <h2 className="mb-3 text-2xl font-extrabold tracking-tight text-slate-900">
            Confidence score
          </h2>
          <p className="mb-6 text-base text-slate-500">
            Each score includes a data confidence indicator. When more data is available about a
            property or suburb, the engine can produce a more accurate and reliable score.
            Scores with low confidence (under 40%) should be treated as indicative only.
          </p>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
            <p className="mb-4 text-sm font-semibold text-slate-700">
              Data that improves confidence:
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {CONFIDENCE_FACTORS.map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm text-slate-600">
                  <svg
                    className="h-4 w-4 shrink-0 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Trust statement ──────────────────────────────────────── */}
        <section className="rounded-2xl bg-amber-50 p-6 text-sm text-amber-900">
          <p className="font-semibold">A note on how to use these scores</p>
          <p className="mt-2 leading-relaxed text-amber-800">
            PropTrust scoring is designed to help you make better-informed rental and investment
            decisions. It is <strong>not financial advice</strong> and should be used alongside
            your own judgement and due diligence. Scores are calculated from available data and
            reasonable assumptions — always verify key facts with the landlord, agent or a
            qualified professional before committing.
          </p>
        </section>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-8 py-3.5 text-sm font-bold text-white transition hover:bg-slate-700"
          >
            Get your free score
          </Link>
          <p className="mt-3 text-xs text-slate-400">
            Sign up free and start matching with properties or tenants today.
          </p>
        </div>
      </main>

      <MarketingFooter />
    </div>
  )
}
