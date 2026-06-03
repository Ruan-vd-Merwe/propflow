'use client'

import Link from 'next/link'
import MarketingNav from '@/components/marketing/MarketingNav'
import MarketingFooter from '@/components/marketing/MarketingFooter'

// ── Hero dashboard card ───────────────────────────────────────────────────────

function DashboardCard() {
  return (
    <div className="hero-card w-full max-w-[340px] rounded-2xl bg-white p-5 shadow-2xl">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">PropTrust Dashboard</span>
        <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          Live
        </span>
      </div>

      <div className="mb-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-slate-900">12 Ocean View Drive, Sea Point</p>
          <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
            Rent up to date
          </span>
        </div>
        <p className="mt-0.5 text-[11px] text-slate-400">3 tenants · Rent up to date</p>
      </div>

      <div className="mb-2 px-1">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-700">Sarah D.</span>
          <span className="text-[11px] font-bold text-green-700">87 / 100</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="score-green h-full rounded-full bg-green-500" />
        </div>
      </div>

      <div className="mb-3 px-1">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-700">James F.</span>
          <span className="text-[11px] font-bold text-amber-600">52 / 100</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="score-amber h-full rounded-full bg-amber-400" />
        </div>
      </div>

      <div className="notify-pay mb-2 flex items-center gap-2.5 rounded-xl border border-green-200 bg-green-50 px-3 py-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-600">
          <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-bold text-green-800">R12,500 received</p>
          <p className="text-[10px] text-green-600">Unit 4B · June 2026</p>
        </div>
      </div>

      <div className="notify-match flex items-center justify-between rounded-xl bg-blue-50 px-3 py-2.5">
        <div>
          <p className="text-xs font-bold text-blue-900">New tenant match</p>
          <p className="text-[10px] text-blue-600">Sea Point · R12k budget</p>
        </div>
        <span className="ml-2 shrink-0 rounded-full bg-[#1e40af] px-2.5 py-1 text-[10px] font-bold text-white">
          Match
        </span>
      </div>

      <style>{`
        .hero-card  { animation: cardUp .75s .1s cubic-bezier(.22,.68,0,1.2) both; }
        @keyframes cardUp {
          from { opacity:0; transform:translateY(28px) rotate(-1deg); }
          to   { opacity:1; transform:translateY(0) rotate(-2deg); }
        }
        @media (min-width:1024px) {
          @keyframes cardUp {
            from { opacity:0; transform:translateY(28px) rotate(-1deg); }
            to   { opacity:1; transform:translateY(0) rotate(-2deg); }
          }
        }
        .score-green { animation: sg 1.4s .8s ease-out both; }
        .score-amber  { animation: sa 1.4s 1s  ease-out both; }
        @keyframes sg { from{width:0%} to{width:87%} }
        @keyframes sa { from{width:0%} to{width:52%} }
        .notify-pay   { animation: nf 5s 1.4s ease-in-out infinite; }
        .notify-match { animation: nf 5s 2.2s ease-in-out infinite; }
        @keyframes nf {
          0%,20%  { opacity:0; transform:translateY(5px) scale(.97); }
          30%,75% { opacity:1; transform:translateY(0) scale(1); }
          90%,100%{ opacity:0; }
        }
        @media (prefers-reduced-motion:reduce) {
          .hero-card,.score-green,.score-amber,.notify-pay,.notify-match { animation:none; opacity:1; }
          .score-green { width:87%; }
          .score-amber  { width:52%; }
        }
      `}</style>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 antialiased">
      <MarketingNav />

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0f172a] px-6 pb-20 pt-16 md:pb-28 md:pt-20">
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hgrid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hgrid)" />
        </svg>

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[3fr_2fr]">
          <div style={{ animation: 'heroIn .65s cubic-bezier(.22,.68,0,1.2) both' }}>
            <style>{`@keyframes heroIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>

            <span className="mb-5 inline-flex items-center rounded-full bg-[#dcfce7] px-3.5 py-1.5 text-xs font-bold text-[#166534]">
              Built for South African rentals
            </span>

            <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight text-white md:text-6xl">
              Manage your rental property<br />
              <span className="text-[#3b82f6]">without the admin headache</span>
            </h1>

            <p className="mt-5 max-w-lg text-lg leading-relaxed text-slate-300">
              PropTrust helps South African landlords screen tenants, track rent, manage maintenance
              and keep documents organised, all from one simple platform.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register"
                className="rounded-full bg-[#3b82f6] px-7 py-3.5 text-base font-bold text-white shadow-lg transition hover:bg-blue-500 active:scale-95">
                Start free trial
              </Link>
              <Link href="/register"
                className="rounded-full border-2 border-white/30 px-7 py-3.5 text-base font-bold text-white transition hover:border-white/60 hover:bg-white/5 active:scale-95">
                Book a demo
              </Link>
            </div>

            <p className="mt-4 text-xs text-slate-500">No credit card required. Cancel anytime.</p>
          </div>

          <div className="flex justify-center">
            <DashboardCard />
          </div>
        </div>
      </section>

      {/* ── CITY SCROLL ───────────────────────────────────────── */}
      <div className="border-y border-[#e2e8f0] bg-white py-4">
        <div className="flex items-center overflow-hidden">
          <span className="shrink-0 pl-6 pr-5 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Active across
          </span>
          <div className="relative flex-1 overflow-hidden">
            <div className="animate-marquee flex gap-10 whitespace-nowrap">
              {CITIES.concat(CITIES).map((city, i) => (
                <span key={i} className="text-sm font-medium text-slate-500">
                  {city}
                  <span className="ml-10 text-slate-200">·</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── STATS ─────────────────────────────────────────────── */}
      <section className="bg-[#1e40af] px-6 py-14">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-2 gap-y-10 text-center md:grid-cols-4">
            {STATS.map(s => (
              <div key={s.label}>
                <p className="text-4xl font-extrabold text-white">{s.value}</p>
                <p className="mt-1.5 text-sm text-blue-200">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-xs text-blue-300">
            Launch benchmarks and product targets. Final figures may vary by property, location and tenant demand.
          </p>
        </div>
      </section>

      {/* ── PRODUCT OVERVIEW ──────────────────────────────────── */}
      <section className="bg-[#f8fafc] px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-3 text-center text-3xl font-extrabold tracking-tight text-[#0f172a] md:text-4xl">
            One platform. Every role.
          </h2>
          <p className="mb-14 text-center text-base text-slate-500">
            PropTrust is built for everyone involved in the South African rental process.
          </p>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Landlord */}
            <div className="flex flex-col rounded-2xl bg-[#0f172a] p-8 text-white">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-700">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="mb-3 text-xl font-extrabold">For Landlords</h3>
              <p className="mb-4 flex-1 text-sm leading-relaxed text-slate-300">
                Screen tenants, track rent, manage property.
              </p>
              <p className="mb-6 text-2xl font-extrabold text-[#3b82f6]">From R99/month</p>
              <Link href="/solutions/landlords"
                className="rounded-xl bg-white py-3 text-center text-sm font-bold text-[#0f172a] transition hover:bg-slate-100">
                Learn more
              </Link>
            </div>

            {/* Tenant */}
            <div className="flex flex-col rounded-2xl border-2 border-[#e2e8f0] bg-white p-8">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-green-50">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="mb-3 text-xl font-extrabold text-[#0f172a]">For Tenants</h3>
              <p className="mb-4 flex-1 text-sm leading-relaxed text-slate-500">
                Build a verified profile. Find your home.
              </p>
              <p className="mb-6 text-2xl font-extrabold text-green-600">Free for tenants</p>
              <Link href="/solutions/tenants"
                className="rounded-xl bg-[#0f172a] py-3 text-center text-sm font-bold text-white transition hover:bg-slate-800">
                Learn more
              </Link>
            </div>

            {/* Managers */}
            <div className="flex flex-col rounded-2xl bg-[#1e40af] p-8 text-white">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-700">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="mb-3 text-xl font-extrabold">For Property Managers</h3>
              <p className="mb-4 flex-1 text-sm leading-relaxed text-blue-200">
                Manage portfolios with professional tools.
              </p>
              <p className="mb-6 text-2xl font-extrabold text-white">From R299/month</p>
              <Link href="/solutions/managers"
                className="rounded-xl bg-white py-3 text-center text-sm font-bold text-[#1e40af] transition hover:bg-blue-50">
                Learn more
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES OVERVIEW ─────────────────────────────────── */}
      <section className="bg-white px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 flex flex-col items-center text-center md:flex-row md:items-end md:justify-between md:text-left">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#1e40af]">Platform</p>
              <h2 className="text-3xl font-extrabold tracking-tight text-[#0f172a] md:text-4xl">
                What PropTrust does
              </h2>
            </div>
            <Link href="/features" className="mt-4 text-sm font-semibold text-[#1e40af] underline-offset-2 hover:underline md:mt-0">
              See all features
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURE_OVERVIEW.map(f => (
              <div key={f.title} className="flex items-start gap-4 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-6 transition-all hover:border-blue-200 hover:shadow-md">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1e40af]">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-bold text-[#0f172a]">{f.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LEGAL PROTECTION ──────────────────────────────────── */}
      <section className="bg-[#0f172a] px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            {/* Left column */}
            <div>
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-700">
                <svg className="h-9 w-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h2 className="mb-4 text-3xl font-extrabold leading-tight tracking-tight text-white md:text-4xl">
                Your lease. Your protection.
              </h2>
              <p className="mb-6 text-lg leading-relaxed text-slate-300">
                Every PropTrust lease comes with optional legal protection through our partnership
                with Xpello — South Africa&apos;s leading eviction management service.
              </p>
              <div className="mb-8 grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-red-900/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-red-400">Typical eviction cost</p>
                  <p className="mt-1 text-2xl font-extrabold text-white">R40,000+</p>
                </div>
                <div className="rounded-2xl bg-emerald-900/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">With Xpello protection</p>
                  <p className="mt-1 text-2xl font-extrabold text-white">R250/month</p>
                </div>
              </div>
              <Link
                href="/leases"
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-7 py-3.5 text-base font-bold text-white shadow-lg transition hover:bg-blue-500 active:scale-95"
              >
                Learn about legal protection
              </Link>
            </div>

            {/* Right column — 3 protection cards */}
            <div className="grid gap-4">
              {[
                {
                  icon: (
                    <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  ),
                  title: 'Lease Generator',
                  desc:  'Create a legally compliant SA residential lease agreement in minutes.',
                },
                {
                  icon: (
                    <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  ),
                  title: 'Xpello Protection',
                  desc:  'Enroll your lease for eviction management from R250/month.',
                },
                {
                  icon: (
                    <svg className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  ),
                  title: '25 Attorneys Nationwide',
                  desc:  'Access Xpello\'s panel of specialist attorneys when you need them.',
                },
              ].map((card) => (
                <div key={card.title} className="flex items-start gap-4 rounded-2xl bg-white/5 p-6 transition hover:bg-white/10">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
                    {card.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{card.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-400">{card.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEEDBACK ──────────────────────────────────────────── */}
      <section className="bg-[#f8fafc] px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-extrabold tracking-tight text-[#0f172a] md:text-4xl">
              Built with feedback from SA property owners
            </h2>
            <p className="mx-auto max-w-xl text-base text-slate-500">
              Examples of the problems PropTrust is designed to solve.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {FEEDBACK.map(t => (
              <div key={t.name} className="flex flex-col rounded-2xl border border-[#e2e8f0] bg-white p-8">
                <p className="flex-1 text-sm italic leading-relaxed text-slate-600">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-6">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${t.bg}`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#0f172a]">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-slate-400">
            PropTrust is being shaped around practical landlord, tenant and property-management workflows.
          </p>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────── */}
      <section className="bg-[#1e40af] px-6 py-24 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-4xl font-extrabold text-white">
            Ready to manage your rentals with more control?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-blue-100">
            Start with PropTrust and bring tenant screening, rent tracking, maintenance and documents into one simple platform.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/register"
              className="rounded-full bg-white px-9 py-4 text-base font-extrabold text-[#1e40af] shadow-lg transition hover:bg-blue-50 active:scale-95">
              Start free trial
            </Link>
            <Link href="/register"
              className="rounded-full border-2 border-white/40 px-9 py-4 text-base font-bold text-white transition hover:border-white hover:bg-white/10 active:scale-95">
              Book a demo
            </Link>
          </div>
          <p className="mt-6 text-sm text-blue-200">No credit card required. Cancel anytime. Built for South Africa.</p>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}

// ── Data ──────────────────────────────────────────────────────────────────────

const CITIES = [
  'Cape Town','Stellenbosch','Johannesburg','Durban','Pretoria',
  'Sandton','Paarl','George','Knysna','Hermanus',
  'Bloemfontein','Gqeberha','East London','Kimberley',
]

const STATS = [
  { value: '60+',     label: 'Properties supported'         },
  { value: '100%',    label: 'Tenant verification workflow'  },
  { value: 'R0',      label: 'Agent commission required'    },
  { value: '14 days', label: 'Target let-time benchmark'    },
]

const FEATURE_OVERVIEW = [
  {
    title: 'Tenant Screening',
    desc:  'Review applicant details before signing a lease.',
    icon:  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  },
  {
    title: 'Rent Tracking',
    desc:  'See what has been paid, what is due and what needs follow-up.',
    icon:  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  },
  {
    title: 'Maintenance Requests',
    desc:  'Keep repair requests organised from request to resolution.',
    icon:  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
  {
    title: 'Document Storage',
    desc:  'Keep leases, IDs and property documents easy to find.',
    icon:  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  },
  {
    title: 'WhatsApp Notifications',
    desc:  'Send practical reminders through a channel people already use.',
    icon:  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
  },
  {
    title: 'Body Corporate Support',
    desc:  'Keep levies, notices and shared-property details organised.',
    icon:  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  },
]

const FEEDBACK = [
  {
    quote:    'Having tenant screening, rent tracking and documents in one place would make managing my units far less stressful.',
    name:     'Sarah M.',
    role:     'Landlord · Cape Town',
    initials: 'SM',
    bg:       'bg-blue-600',
  },
  {
    quote:    'The biggest value is knowing more about a tenant before signing. One bad tenant can cost months of time and money.',
    name:     'Johan V.',
    role:     'Landlord · Stellenbosch',
    initials: 'JV',
    bg:       'bg-green-600',
  },
  {
    quote:    'Maintenance requests need structure. WhatsApp alone becomes messy once you manage more than a few tenants.',
    name:     'Nomsa D.',
    role:     'Property Manager · Johannesburg',
    initials: 'ND',
    bg:       'bg-purple-600',
  },
]
