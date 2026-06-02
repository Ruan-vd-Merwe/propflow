import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-white text-slate-900">

      {/* ─────────────────────────────────────────────────────────────────────
          NAVBAR
      ───────────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">

          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700">
              <svg className="h-4.5 w-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <span className="text-[17px] font-bold tracking-tight text-slate-900">PropTrust</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {[
              { label: 'Features',      href: '#features' },
              { label: 'For landlords', href: '#landlords' },
              { label: 'For tenants',   href: '#tenants' },
              { label: 'Pricing',       href: '#pricing' },
            ].map(({ label, href }) => (
              <a key={href} href={href}
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900">
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            <Link href="/login"
              className="hidden rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 sm:block">
              Sign in
            </Link>
            <Link href="/register"
              className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800">
              Get started free
            </Link>
          </div>
        </div>
      </header>


      {/* ─────────────────────────────────────────────────────────────────────
          HERO
      ───────────────────────────────────────────────────────────────────── */}
      <section className="overflow-hidden bg-white px-6 pb-16 pt-16 md:pb-24 md:pt-20">
        <div className="mx-auto grid max-w-6xl items-center gap-16 md:grid-cols-2">

          {/* Left — copy */}
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Built for South Africa
            </div>

            <h1 className="text-[2.6rem] font-extrabold leading-[1.12] tracking-tight text-slate-900 md:text-5xl">
              Property management{' '}
              <span className="text-blue-700">without the letting agent</span>
            </h1>

            <p className="mt-5 text-lg leading-relaxed text-slate-500">
              PropTrust gives South African landlords the tools to screen tenants, collect rent and manage maintenance —
              without paying an agent commission on every lease.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/register"
                className="rounded-xl bg-blue-700 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800">
                Start for free
              </Link>
              <a href="#how-it-works"
                className="rounded-xl border border-slate-300 px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50">
                See how it works
              </a>
            </div>

            <p className="mt-5 text-sm text-slate-400">
              No credit card required. No agent commission. No lock-in.
            </p>
          </div>

          {/* Right — product mockup */}
          <div className="flex justify-center">
            <div className="w-full max-w-[380px]">
              {/* Browser chrome */}
              <div className="rounded-t-xl border border-slate-200 bg-slate-100 px-4 py-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-slate-300" />
                  <span className="h-3 w-3 rounded-full bg-slate-300" />
                  <span className="h-3 w-3 rounded-full bg-slate-300" />
                  <span className="ml-3 flex-1 rounded-md bg-white px-3 py-1 text-xs text-slate-400">
                    proptrust.co.za/dashboard
                  </span>
                </div>
              </div>

              {/* Dashboard window */}
              <div className="rounded-b-xl border border-t-0 border-slate-200 bg-slate-50 p-4 shadow-xl">

                {/* Mini nav */}
                <div className="mb-3 flex items-center gap-1">
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-700">
                    <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <span className="ml-1 text-[11px] font-bold text-slate-700">PropTrust</span>
                  <div className="ml-auto flex gap-1">
                    {['Dashboard', 'Tenants', 'Payments'].map((t, i) => (
                      <span key={t} className={`rounded px-2 py-0.5 text-[10px] font-medium ${
                        i === 0 ? 'bg-blue-700 text-white' : 'text-slate-400'
                      }`}>{t}</span>
                    ))}
                  </div>
                </div>

                {/* Stats row */}
                <div className="mb-3 grid grid-cols-3 gap-2">
                  {[
                    { label: 'Properties', value: '4' },
                    { label: 'Tenants',    value: '7' },
                    { label: 'This month', value: 'R 68 400' },
                  ].map(s => (
                    <div key={s.label} className="rounded-lg border border-slate-200 bg-white p-2.5 text-center">
                      <p className="text-sm font-bold text-slate-900">{s.value}</p>
                      <p className="text-[10px] text-slate-400">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Property row */}
                <div className="mb-2 rounded-lg border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-900">12 Ocean View, Sea Point</p>
                      <p className="mt-0.5 text-[10px] text-slate-400">2 tenants · lease ends Aug 2026</p>
                    </div>
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                      Current
                    </span>
                  </div>

                  {/* Risk score */}
                  <div className="mt-2.5">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">Tenant risk score</span>
                      <span className="text-[10px] font-bold text-green-700">87 / 100 — Low risk</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="animate-score-bar h-full rounded-full bg-green-500" />
                    </div>
                  </div>
                </div>

                {/* Payment notification */}
                <div className="animate-paid mb-2 flex items-center gap-2.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-600">
                    <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-green-800">Rent received</p>
                    <p className="text-[10px] text-green-600">R 14 500 · June 2026 · via EFT</p>
                  </div>
                </div>

                {/* Tenant match */}
                <div className="animate-match flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2">
                  <div>
                    <p className="text-xs font-semibold text-blue-900">New applicant matched</p>
                    <p className="text-[10px] text-blue-600">Verified ID · Bank statement reviewed</p>
                  </div>
                  <span className="ml-3 shrink-0 rounded-full bg-blue-700 px-2.5 py-1 text-[10px] font-bold text-white">
                    94% match
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────
          CITIES / SOCIAL PROOF BAR
      ───────────────────────────────────────────────────────────────────── */}
      <div className="border-y border-slate-100 bg-slate-50 py-4">
        <div className="flex items-center overflow-hidden">
          <span className="shrink-0 pl-6 pr-6 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Active across
          </span>
          <div className="flex overflow-hidden">
            <div className="animate-marquee flex shrink-0 items-center gap-10 whitespace-nowrap pr-10">
              {[
                'Cape Town', 'Stellenbosch', 'Johannesburg', 'Durban',
                'Pretoria', 'Sandton', 'Paarl', 'George', 'Knysna', 'Hermanus',
                'Cape Town', 'Stellenbosch', 'Johannesburg', 'Durban',
                'Pretoria', 'Sandton', 'Paarl', 'George', 'Knysna', 'Hermanus',
              ].map((city, i) => (
                <span key={i} className="text-sm font-medium text-slate-500">{city}</span>
              ))}
            </div>
          </div>
        </div>
      </div>


      {/* ─────────────────────────────────────────────────────────────────────
          PROBLEM / VALUE STATEMENT
      ───────────────────────────────────────────────────────────────────── */}
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Managing a rental property should not require a middleman
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-500">
            South African letting agents typically charge 8 to 12 percent of monthly rent to do tasks
            that software handles in seconds. PropTrust puts those tools directly in your hands.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-4xl gap-6 sm:grid-cols-3">
          {PAIN_POINTS.map(p => (
            <div key={p.heading} className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600">
                {p.icon}
              </div>
              <h3 className="mb-1.5 font-semibold text-slate-900">{p.heading}</h3>
              <p className="text-sm leading-relaxed text-slate-500">{p.body}</p>
            </div>
          ))}
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────
          FEATURES
      ───────────────────────────────────────────────────────────────────── */}
      <section id="features" className="bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
              Every tool a South African landlord needs
            </h2>
            <p className="mt-4 text-base text-slate-500">
              From the first application to the final payment — all in one place.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title}
                className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-blue-200 hover:shadow-md">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 transition group-hover:bg-blue-700 group-hover:text-white">
                  {f.icon}
                </div>
                <h3 className="mb-2 text-[15px] font-bold text-slate-900">{f.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────
          HOW IT WORKS
      ───────────────────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-white px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
              Up and running in under ten minutes
            </h2>
            <p className="mt-4 text-base text-slate-500">
              No onboarding calls. No contracts. Just create an account and go.
            </p>
          </div>

          <div className="grid gap-10 md:grid-cols-3">
            {HOW_IT_WORKS.map((s, i) => (
              <div key={i} className="relative flex flex-col items-start">
                {/* Connector line on desktop */}
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="absolute left-[52px] top-6 hidden h-0.5 w-[calc(100%+40px)] bg-slate-100 md:block" />
                )}
                <div className="relative z-10 mb-5 flex h-12 w-12 items-center justify-center rounded-xl border-2 border-blue-700 bg-white text-lg font-extrabold text-blue-700">
                  {i + 1}
                </div>
                <h3 className="mb-2 font-bold text-slate-900">{s.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────
          FOR LANDLORDS
      ───────────────────────────────────────────────────────────────────── */}
      <section id="landlords" className="bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <span className="mb-4 inline-block rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                For landlords
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
                Stop paying 10 percent of your rent to someone else
              </h2>
              <p className="mt-5 text-base leading-relaxed text-slate-500">
                PropTrust replaces your letting agent for a fraction of the cost. Screen applicants properly,
                collect rent automatically and manage maintenance without a middleman.
              </p>
              <ul className="mt-7 space-y-3">
                {LANDLORD_BULLETS.map(b => (
                  <li key={b} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-700">
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span className="text-sm text-slate-600">{b}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register"
                className="mt-8 inline-block rounded-xl bg-blue-700 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-800">
                Create landlord account
              </Link>
            </div>

            {/* Feature list panel */}
            <div className="space-y-3">
              {LANDLORD_FEATURES.map(f => (
                <div key={f.title} className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                    {f.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{f.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{f.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────
          FOR TENANTS
      ───────────────────────────────────────────────────────────────────── */}
      <section id="tenants" className="bg-white px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 md:grid-cols-2">

            {/* Feature list panel */}
            <div className="space-y-3 md:order-first">
              {TENANT_FEATURES.map(f => (
                <div key={f.title} className="flex items-start gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-700">
                    {f.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{f.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{f.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <span className="mb-4 inline-block rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                For tenants
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
                Find a quality rental without paying an agent
              </h2>
              <p className="mt-5 text-base leading-relaxed text-slate-500">
                Build a verified rental profile once and let landlords come to you.
                PropTrust connects you directly with private landlords who manage their own properties.
              </p>
              <ul className="mt-7 space-y-3">
                {TENANT_BULLETS.map(b => (
                  <li key={b} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-600">
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span className="text-sm text-slate-600">{b}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register"
                className="mt-8 inline-block rounded-xl bg-green-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-green-700">
                Create tenant profile
              </Link>
            </div>
          </div>
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────
          PRICING
      ───────────────────────────────────────────────────────────────────── */}
      <section id="pricing" className="bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
              Straightforward pricing
            </h2>
            <p className="mt-4 text-base text-slate-500">
              Start free. Add more as your portfolio grows.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {PRICING_TIERS.map((tier, i) => (
              <div key={tier.name}
                className={`relative rounded-2xl border p-7 ${
                  i === 1
                    ? 'border-blue-700 bg-blue-700 text-white shadow-xl'
                    : 'border-slate-200 bg-white'
                }`}>
                {i === 1 && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-white px-3 py-1 text-xs font-bold text-blue-700 shadow-sm">
                    Most popular
                  </span>
                )}
                <p className={`text-xs font-semibold uppercase tracking-wider ${i === 1 ? 'text-blue-200' : 'text-slate-400'}`}>
                  {tier.name}
                </p>
                <div className="my-4 flex items-end gap-1">
                  <span className={`text-4xl font-extrabold ${i === 1 ? 'text-white' : 'text-slate-900'}`}>
                    {tier.price}
                  </span>
                  {tier.per && (
                    <span className={`mb-1 text-sm ${i === 1 ? 'text-blue-200' : 'text-slate-400'}`}>
                      {tier.per}
                    </span>
                  )}
                </div>
                <p className={`mb-6 text-sm leading-relaxed ${i === 1 ? 'text-blue-100' : 'text-slate-500'}`}>
                  {tier.desc}
                </p>
                <ul className="mb-7 space-y-2.5">
                  {tier.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5">
                      <svg className={`mt-0.5 h-4 w-4 shrink-0 ${i === 1 ? 'text-blue-200' : 'text-blue-700'}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={`text-sm ${i === 1 ? 'text-blue-50' : 'text-slate-600'}`}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/register"
                  className={`block w-full rounded-xl py-3 text-center text-sm font-bold transition ${
                    i === 1
                      ? 'bg-white text-blue-700 hover:bg-blue-50'
                      : 'bg-blue-700 text-white hover:bg-blue-800'
                  }`}>
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-slate-400">
            All plans include unlimited tenant profiles and introduction requests.
            Prices exclude VAT where applicable.
          </p>
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────
          TESTIMONIALS
      ───────────────────────────────────────────────────────────────────── */}
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
              What our early users say
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Feedback from landlords and tenants in our beta programme.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="flex flex-col rounded-2xl border border-slate-100 bg-slate-50 p-7">
                {/* Quote mark */}
                <svg className="mb-4 h-7 w-7 text-blue-200" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                <p className="flex-1 text-sm leading-relaxed text-slate-600">{t.quote}</p>
                <div className="mt-6 border-t border-slate-200 pt-5">
                  <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.role} · {t.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────
          FINAL CTA
      ───────────────────────────────────────────────────────────────────── */}
      <section className="bg-[#0f172a] px-6 py-24 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-extrabold text-white md:text-4xl">
            Ready to manage your properties yourself?
          </h2>
          <p className="mt-5 text-base leading-relaxed text-slate-400">
            Join South African landlords who have reduced their letting costs and taken back
            control of their rental portfolios.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/register"
              className="rounded-xl bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-lg transition hover:bg-blue-700">
              Get started free
            </Link>
            <a href="#features"
              className="rounded-xl border border-white/20 px-8 py-4 text-base font-semibold text-white transition hover:border-white/40 hover:bg-white/5">
              Learn more
            </a>
          </div>
          <p className="mt-6 text-sm text-slate-500">No credit card required. No lock-in contracts.</p>
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────
          FOOTER
      ───────────────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 bg-[#0f172a] px-6 py-14">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 md:grid-cols-4">

            {/* Brand */}
            <div className="md:col-span-1">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <span className="font-bold text-white">PropTrust</span>
              </div>
              <p className="text-sm text-slate-400">
                Property management software for South African landlords and tenants.
              </p>
            </div>

            {/* Product links */}
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Product</p>
              <ul className="space-y-2.5">
                {['Features', 'For landlords', 'For tenants', 'Pricing'].map(l => (
                  <li key={l}>
                    <a href={`#${l.toLowerCase().replace(' ', '-')}`}
                      className="text-sm text-slate-400 transition hover:text-white">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Account links */}
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Account</p>
              <ul className="space-y-2.5">
                {[
                  { label: 'Sign in',            href: '/login' },
                  { label: 'Create account',     href: '/register' },
                  { label: 'Landlord dashboard', href: '/dashboard' },
                  { label: 'Tenant profile',     href: '/tenant/profile' },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-sm text-slate-400 transition hover:text-white">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal / contact */}
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Company</p>
              <ul className="space-y-2.5">
                {['Privacy policy', 'Terms of service', 'Contact us'].map(l => (
                  <li key={l}>
                    <a href="#" className="text-sm text-slate-400 transition hover:text-white">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
            <p className="text-xs text-slate-500">
              &copy; 2026 PropTrust (Pty) Ltd. Registered in South Africa. proptrust.co.za
            </p>
            <p className="text-xs text-slate-600">
              Not a registered estate agent. PropTrust is a software platform only.
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}


// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────

const PAIN_POINTS = [
  {
    heading: 'Agent commissions add up fast',
    body:    'At 8 to 10 percent per month, a R12 000 rental costs you over R14 000 a year just in management fees.',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    heading: 'Problem tenants are expensive',
    body:    'Evictions, missed rent and property damage cost far more than a proper screening process upfront.',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  {
    heading: 'Manual rent collection is time-consuming',
    body:    'Chasing payments by phone, keeping spreadsheets and sending reminders manually eats hours every month.',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
]

const FEATURES = [
  {
    title: 'Tenant verification',
    desc:  'SA ID validation, credit check and bank statement analysis. Review the full picture before signing a lease.',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: 'Risk scoring',
    desc:  'A live risk score for every tenant, calculated from payment history, income regularity and financial behaviour.',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    title: 'Rent tracking and reminders',
    desc:  'Automated WhatsApp and email reminders before and after due date. Full payment history for each tenant.',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    title: 'Maintenance management',
    desc:  'Track component lifespans, receive contractor quotes and log jobs. Know what needs attention before it fails.',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: 'Body corporate intelligence',
    desc:  'Upload meeting minutes or paste text. PropTrust extracts action items, levies and flags in seconds.',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    title: 'Tenant marketplace',
    desc:  'Verified tenants matched to your property by budget, area, lease preference and financial profile.',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

const HOW_IT_WORKS = [
  {
    title: 'Create your account',
    desc:  'Sign up as a landlord, a tenant or both. Takes under two minutes. No documents required to get started.',
  },
  {
    title: 'Add your property or rental profile',
    desc:  'Landlords list properties with photos and asking rent. Tenants build a verified profile with budget and preferences.',
  },
  {
    title: 'Connect and manage directly',
    desc:  'Receive applications, run credit checks, collect rent and manage maintenance — all without a third party.',
  },
]

const LANDLORD_BULLETS = [
  'No agent commission on leases or renewals',
  'SA ID and credit verification on every applicant',
  'Automated WhatsApp reminders when rent is due',
  'Full maintenance job log with contractor quotes',
  'Body corporate document analysis with AI flagging',
]

const TENANT_BULLETS = [
  'One verified profile, visible to all PropTrust landlords',
  'Matched to properties by your actual budget and preferences',
  'No agent fee on applications or lease signing',
  'Tenant portal for maintenance requests and payments',
  'WhatsApp notifications for all updates',
]

const LANDLORD_FEATURES = [
  {
    title: 'Applications portal',
    detail: 'Share a link with applicants. Receive completed forms with ID number, income and bank statement.',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    title: 'Live payment dashboard',
    detail: 'See which tenants have paid, who is overdue and how much is outstanding — updated in real time.',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    title: 'Tenant portal access',
    detail: 'Each tenant gets a shareable portal link for payment history, maintenance requests and check-ins.',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
]

const TENANT_FEATURES = [
  {
    title: 'Verified rental profile',
    detail: 'Confirm your SA ID, employment status and budget once. Landlords see your profile without you reapplying each time.',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: 'Property matching',
    detail: 'Listed properties are scored against your budget, preferred area and move-in date so you see relevant listings first.',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    title: 'Maintenance requests',
    detail: 'Submit maintenance issues from your phone. Track the status from request through to completion.',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
]

const PRICING_TIERS = [
  {
    name:     'Starter',
    price:    'Free',
    per:      null,
    desc:     'For landlords managing one or two properties who want to get started without commitment.',
    features: [
      'Up to 2 properties',
      'Tenant applications portal',
      'Basic payment tracking',
      'Maintenance request log',
      'Tenant portal access',
    ],
    cta: 'Start for free',
  },
  {
    name:     'Portfolio',
    price:    'R299',
    per:      '/mo',
    desc:     'For active landlords who want automated reminders, risk scoring and the full feature set.',
    features: [
      'Unlimited properties',
      'SA ID and credit verification',
      'Risk scoring per tenant',
      'WhatsApp and email reminders',
      'Body corporate intelligence',
      'Component lifespan tracking',
      'Tenant marketplace access',
    ],
    cta: 'Start free trial',
  },
  {
    name:     'Professional',
    price:    'R799',
    per:      '/mo',
    desc:     'For property managers and large portfolios who need priority support and advanced reporting.',
    features: [
      'Everything in Portfolio',
      'Multiple user accounts',
      'Priority support',
      'Advanced payment reports',
      'Custom lease templates',
      'API access',
    ],
    cta: 'Contact us',
  },
]

const TESTIMONIALS = [
  {
    quote:    'I was sceptical at first, but the risk score flagged something in the bank statement that I would have missed. That alone made it worth it.',
    name:     'Sarah M.',
    role:     'Landlord, 3 properties',
    location: 'Sea Point, Cape Town',
  },
  {
    quote:    'The WhatsApp reminders mean I never have to chase rent manually anymore. My tenants actually appreciate the heads-up before it is due.',
    name:     'Johan V.',
    role:     'Landlord, 5 properties',
    location: 'Stellenbosch',
  },
  {
    quote:    'Finding a rental through PropTrust felt straightforward. The landlord had already seen my profile and credit check before we even spoke.',
    name:     'Nomsa D.',
    role:     'Tenant',
    location: 'Sandton, Johannesburg',
  },
]
