import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-white">

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#0f172a] shadow-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-white">PropTrust</span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <a href="#features"    className="text-sm text-slate-300 transition hover:text-white">Features</a>
            <a href="#how-it-works" className="text-sm text-slate-300 transition hover:text-white">How it works</a>
            <a href="#pricing"     className="text-sm text-slate-300 transition hover:text-white">Pricing</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login"
              className="rounded-lg border border-white/30 px-4 py-2 text-sm font-medium text-white transition hover:border-white hover:bg-white/10">
              Login
            </Link>
            <Link href="/register"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="overflow-hidden bg-white px-6 py-20 md:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">

          {/* Left */}
          <div className="animate-fade-in">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              🇿🇦 Built for South Africa
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
              South Africa&apos;s most trusted{' '}
              <span className="text-blue-700">property platform</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-500">
              Find tenants. Manage rentals. Eliminate agents.
              PropTrust connects landlords and tenants directly
              with full verification, payments and community.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register"
                className="rounded-xl bg-blue-700 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-blue-800">
                Get started free
              </Link>
              <a href="#how-it-works"
                className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50">
                See how it works
              </a>
            </div>
            <p className="mt-5 text-xs text-slate-400">
              Trusted by landlords across Cape Town, Stellenbosch and Johannesburg
            </p>
          </div>

          {/* Right — animated dashboard mockup */}
          <div className="flex justify-center">
            <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
              {/* Card header */}
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400">Active listing</p>
                  <p className="font-semibold text-slate-900">12 Ocean View, Sea Point</p>
                </div>
                <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
                  Listed
                </span>
              </div>

              {/* Risk score bar */}
              <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-500">Tenant risk score</p>
                  <span className="animate-pulse-green rounded-full bg-green-600 px-2.5 py-1 text-xs font-bold text-white">
                    87 / 100
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div className="animate-score-bar h-full rounded-full bg-green-500" style={{ width: '0%' }} />
                </div>
                <p className="mt-1.5 text-xs text-slate-400">Low risk · Income verified</p>
              </div>

              {/* Payment status */}
              <div className="animate-paid mb-3 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-600 text-white">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-green-800">Rent paid ✓</p>
                  <p className="text-xs text-green-600">June 2026 · R 12 500</p>
                </div>
              </div>

              {/* Tenant match badge */}
              <div className="animate-match flex items-center justify-between rounded-xl bg-blue-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-700 text-xs font-bold text-white">
                    TM
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-blue-900">New tenant match</p>
                    <p className="text-xs text-blue-600">Verified · Budget aligned</p>
                  </div>
                </div>
                <span className="rounded-full bg-blue-700 px-2.5 py-1 text-xs font-bold text-white">
                  94% match
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Scrolling cities bar ─────────────────────────────────────────────── */}
      <div className="overflow-hidden bg-slate-100 py-4">
        <div className="flex items-center gap-4 text-sm text-slate-500">
          <span className="shrink-0 pl-6 font-semibold text-slate-600">Active across:</span>
          <div className="flex overflow-hidden">
            <div className="animate-marquee flex shrink-0 items-center gap-8 whitespace-nowrap">
              {['Cape Town', 'Stellenbosch', 'Johannesburg', 'Durban', 'Pretoria', 'Sandton', 'Paarl', 'George',
                'Cape Town', 'Stellenbosch', 'Johannesburg', 'Durban', 'Pretoria', 'Sandton', 'Paarl', 'George'].map((city, i) => (
                <span key={i} className="font-medium text-slate-600">
                  {city} <span className="text-slate-300">·</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats bar ────────────────────────────────────────────────────────── */}
      <section className="bg-[#0f172a] py-10">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 px-6 text-center md:grid-cols-4">
          {[
            { value: '60+',    label: 'Properties' },
            { value: '100%',   label: 'Verified' },
            { value: 'R0',     label: 'Agent fees' },
            { value: '14 day', label: 'Avg let time' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl font-extrabold text-white">{stat.value}</p>
              <p className="mt-1 text-sm text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────────── */}
      <section id="features" className="bg-white px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-3 text-center text-3xl font-extrabold text-slate-900 md:text-4xl">
            Everything you need. Nothing you don&apos;t.
          </h2>
          <p className="mb-12 text-center text-base text-slate-500">
            Purpose-built for South African landlords and tenants.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-slate-100 bg-slate-50 p-6 transition hover:border-blue-200 hover:shadow-md">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-700 text-white">
                  {f.icon}
                </div>
                <h3 className="mb-2 font-bold text-slate-900">{f.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-extrabold text-slate-900 md:text-4xl">
            Get started in 3 steps
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-700 text-2xl font-extrabold text-white shadow-lg">
                  {i + 1}
                </div>
                <h3 className="mb-2 text-lg font-bold text-slate-900">{s.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Two product cards ────────────────────────────────────────────────── */}
      <section className="bg-white px-6 py-20">
        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-md transition hover:shadow-lg">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-700">
              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="mb-3 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              Free to start
            </span>
            <h3 className="mb-3 text-xl font-bold text-slate-900">Landlord Portal</h3>
            <p className="mb-6 text-sm leading-relaxed text-slate-500">
              Manage all your properties, screen tenants, track payments and cut out your rental agent completely.
            </p>
            <Link href="/register"
              className="block w-full rounded-xl bg-blue-700 py-3 text-center text-sm font-bold text-white transition hover:bg-blue-800">
              Get started
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-md transition hover:shadow-lg">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-600">
              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="mb-3 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
              Always free
            </span>
            <h3 className="mb-3 text-xl font-bold text-slate-900">Tenant Profile</h3>
            <p className="mb-6 text-sm leading-relaxed text-slate-500">
              Build your verified rental profile, find your next home and connect directly with landlords.
            </p>
            <Link href="/register"
              className="block w-full rounded-xl bg-green-600 py-3 text-center text-sm font-bold text-white transition hover:bg-green-700">
              Create profile
            </Link>
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────────── */}
      <section className="bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-extrabold text-slate-900 md:text-4xl">
            What South African landlords say
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="mb-5 text-sm leading-relaxed text-slate-600 italic">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="text-sm font-bold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────────── */}
      <section className="bg-[#0f172a] px-6 py-20 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-4 text-3xl font-extrabold text-white md:text-4xl">
            Ready to eliminate your rental agent?
          </h2>
          <p className="mb-8 text-base text-slate-400">
            Join South African landlords managing their properties on PropTrust.
          </p>
          <Link href="/register"
            className="inline-block rounded-2xl bg-white px-8 py-4 text-base font-bold text-slate-900 shadow-lg transition hover:bg-slate-100">
            Start for free today
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="bg-[#0f172a] border-t border-white/10 px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <span className="font-bold text-white">PropTrust</span>
              </div>
              <p className="text-sm text-slate-400">South Africa&apos;s trusted property platform</p>
            </div>

            <div className="flex flex-wrap items-center gap-6 md:justify-center">
              <a href="#features"    className="text-sm text-slate-400 transition hover:text-white">Features</a>
              <a href="#how-it-works" className="text-sm text-slate-400 transition hover:text-white">How it works</a>
              <Link href="/login"    className="text-sm text-slate-400 transition hover:text-white">Login</Link>
              <Link href="/register" className="text-sm text-slate-400 transition hover:text-white">Register</Link>
            </div>

            <div className="flex items-center gap-4 md:justify-end">
              {['LinkedIn', 'Instagram', 'Twitter'].map((s) => (
                <a key={s} href="#" aria-label={s}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 text-slate-400 transition hover:border-white/40 hover:text-white">
                  <span className="text-xs font-bold">{s[0]}</span>
                </a>
              ))}
            </div>
          </div>

          <div className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-slate-500">
            © 2026 PropTrust · proptrust.co.za
          </div>
        </div>
      </footer>

    </div>
  )
}

// ── Data ──────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    title: 'Tenant Verification',
    desc:  'Full credit check, SA ID validation and bank statement analysis before you sign.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: 'Risk Scoring',
    desc:  'Every tenant gets a live risk score based on payment history and financial behaviour.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    title: 'Payment Tracking',
    desc:  'Automated WhatsApp and email reminders. Full payment records for every tenant.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    title: 'Body Corporate',
    desc:  'Upload meeting minutes and get an instant AI summary of action items and flags.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    title: 'Maintenance',
    desc:  'Track component lifespans, predict failures and manage contractors in one place.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: 'Tenant Marketplace',
    desc:  'Get matched with verified tenants by budget, area, risk score and move-in date.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

const STEPS = [
  {
    title: 'Create your account',
    desc:  'Free signup in under 2 minutes as a landlord or tenant.',
  },
  {
    title: 'Add your property or profile',
    desc:  'Landlords list properties. Tenants build a verified rental profile.',
  },
  {
    title: 'Connect directly',
    desc:  'No agents. No commission. Just you and your next tenant or home.',
  },
]

const TESTIMONIALS = [
  {
    quote:    "Finally a platform that does the credit check AND manages my payments. Haven't used an agent in 6 months.",
    name:     'Sarah M.',
    location: 'Sea Point, Cape Town',
  },
  {
    quote:    "The risk score alone saved me from a problem tenant. Worth every cent.",
    name:     'Johan V.',
    location: 'Stellenbosch',
  },
  {
    quote:    "My tenants love the portal. They submit maintenance requests from their phones.",
    name:     'Nomsa D.',
    location: 'Johannesburg',
  },
]
