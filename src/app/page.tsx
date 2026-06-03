'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

function IconCheck({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}
function IconX() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
function IconChevron() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}
function IconMenu() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}
function IconClose() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

type DropdownItem = { label: string; sub?: string; href?: string }

function NavDropdown({ label, items }: { label: string; items: DropdownItem[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 rounded-lg px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
      >
        {label}
        <span className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          <IconChevron />
        </span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 min-w-[240px] rounded-xl border border-slate-100 bg-white shadow-xl">
          {items.map(item => (
            <a
              key={item.label}
              href={item.href ?? '#'}
              onClick={() => setOpen(false)}
              className="flex flex-col px-4 py-3 transition hover:bg-slate-50 first:rounded-t-xl last:rounded-b-xl"
            >
              <span className="text-sm font-medium text-slate-900">{item.label}</span>
              {item.sub && <span className="mt-0.5 text-xs text-slate-400">{item.sub}</span>}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

function Logo({ white = false }: { white?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${white ? 'bg-blue-500' : 'bg-[#0f172a]'}`}>
        <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </div>
      <span className={`text-[17px] font-bold tracking-tight ${white ? 'text-white' : 'text-[#0f172a]'}`}>
        PropTrust
      </span>
    </Link>
  )
}

export default function HomePage() {
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth'
    return () => { document.documentElement.style.scrollBehavior = '' }
  }, [])

  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const [mobileOpen, setMobileOpen] = useState(false)
  const [hwTab, setHwTab] = useState<'landlord' | 'tenant'>('landlord')

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 antialiased">

      {/* ── NAVBAR ──────────────────────────────────────────────── */}
      <header className={`sticky top-0 z-50 border-b border-[#e2e8f0] bg-white transition-shadow ${scrolled ? 'shadow-md' : 'shadow-none'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <Logo />

          <nav className="hidden items-center gap-1 lg:flex">
            <NavDropdown
              label="Solutions"
              items={[
                { label: 'For Landlords',        sub: 'Manage properties and tenants directly',  href: '#landlords' },
                { label: 'For Tenants',           sub: 'Build a verified rental profile',         href: '#tenants'   },
                { label: 'For Property Managers', sub: 'Tools for growing portfolios',            href: '#pricing'   },
                { label: 'Tenant Screening',      sub: 'Review applicants before you sign',       href: '#features'  },
              ]}
            />
            <NavDropdown
              label="Features"
              items={[
                { label: 'Tenant Screening',       href: '#features' },
                { label: 'Rent Tracking',           href: '#features' },
                { label: 'Maintenance Requests',    href: '#features' },
                { label: 'Property Dashboard',      href: '#features' },
                { label: 'Document Storage',        href: '#features' },
                { label: 'WhatsApp Notifications',  href: '#features' },
                { label: 'Tenant Marketplace',      href: '#features' },
                { label: 'Body Corporate Support',  href: '#features' },
              ]}
            />
            <a href="#pricing" className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900">
              Pricing
            </a>
            <NavDropdown
              label="Resources"
              items={[
                { label: 'SA Rental Law Guide',    sub: 'Know your rights and obligations'  },
                { label: 'Tenant Screening Guide', sub: 'How to review applicants properly' },
                { label: 'FAQ',                    sub: 'Common questions answered'         },
                { label: 'Blog',                   sub: 'Coming soon'                       },
              ]}
            />
            <a href="#contact" className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900">
              Contact
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link href="/login"
              className="hidden rounded-lg border border-[#0f172a] px-4 py-2 text-sm font-semibold text-[#0f172a] transition hover:bg-slate-50 lg:block">
              Login
            </Link>
            <Link href="/register"
              className="rounded-lg bg-[#1e40af] px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800">
              Get Started
            </Link>
            <button
              onClick={() => setMobileOpen(o => !o)}
              className="ml-1 rounded-lg p-2 text-slate-600 transition hover:bg-slate-50 lg:hidden"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <IconClose /> : <IconMenu />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="fixed inset-0 top-[57px] z-40 overflow-y-auto bg-white px-6 py-6 lg:hidden">
            <nav className="space-y-1">
              {[
                { label: 'For Landlords',  href: '#landlords'   },
                { label: 'For Tenants',    href: '#tenants'     },
                { label: 'Features',       href: '#features'    },
                { label: 'Pricing',        href: '#pricing'     },
                { label: 'How it works',   href: '#how-it-works'},
                { label: 'Contact',        href: '#contact'     },
              ].map(item => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-xl px-4 py-3.5 text-base font-semibold text-slate-800 transition hover:bg-slate-50"
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="mt-6 flex flex-col gap-3">
              <Link href="/login" onClick={() => setMobileOpen(false)}
                className="rounded-xl border-2 border-[#0f172a] px-4 py-3 text-center text-base font-bold text-[#0f172a]">
                Login
              </Link>
              <Link href="/register" onClick={() => setMobileOpen(false)}
                className="rounded-xl bg-[#1e40af] px-4 py-3 text-center text-base font-bold text-white">
                Get Started Free
              </Link>
            </div>
          </div>
        )}
      </header>


      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0f172a] px-6 pb-20 pt-16 md:pb-28 md:pt-20">
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="diag" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="20" stroke="white" strokeWidth="1.2" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#diag)" />
        </svg>

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[3fr_2fr]">

          <div className="hero-enter">
            <span className="mb-5 inline-flex items-center rounded-full bg-[#dcfce7] px-3.5 py-1.5 text-xs font-bold text-[#166534]">
              Built for South African rentals
            </span>

            <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight text-white md:text-6xl">
              Manage your rental property<br />
              <span className="text-[#3b82f6]">without the admin headache</span>
            </h1>

            <p className="mt-5 max-w-lg text-lg leading-relaxed text-slate-300">
              PropTrust helps South African landlords screen tenants, track rent, manage maintenance
              and keep documents organised — all from one simple platform.
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
            <p className="mt-1 text-xs text-slate-500">
              Designed for landlords, tenants and property managers in South Africa.
            </p>
          </div>

          <div className="flex justify-center">
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
                  <div className="score-bar-green h-full rounded-full bg-green-500" />
                </div>
              </div>

              <div className="mb-3 px-1">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-700">James F.</span>
                  <span className="text-[11px] font-bold text-amber-600">52 / 100</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="score-bar-amber h-full rounded-full bg-amber-400" />
                </div>
              </div>

              <div className="payment-notify mb-2 flex items-center gap-2.5 rounded-xl border border-green-200 bg-green-50 px-3 py-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-600 text-white">
                  <IconCheck className="h-3.5 w-3.5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-green-800">R12,500 received</p>
                  <p className="text-[10px] text-green-600">Unit 4B · June 2026</p>
                </div>
              </div>

              <div className="match-notify flex items-center justify-between rounded-xl bg-blue-50 px-3 py-2.5">
                <div>
                  <p className="text-xs font-bold text-blue-900">New tenant match</p>
                  <p className="text-[10px] text-blue-600">Sea Point · R12k budget</p>
                </div>
                <span className="ml-2 shrink-0 rounded-full bg-[#1e40af] px-2.5 py-1 text-[10px] font-bold text-white">
                  Match
                </span>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          .hero-enter { animation: heroSlideUp .65s cubic-bezier(.22,.68,0,1.2) both; }
          .hero-card  { animation: cardSlideUp .75s .15s cubic-bezier(.22,.68,0,1.2) both; }
          @keyframes heroSlideUp {
            from { opacity: 0; transform: translateY(24px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes cardSlideUp {
            from { opacity: 0; transform: translateY(32px) rotate(-1deg); }
            to   { opacity: 1; transform: translateY(0) rotate(-1deg); }
          }
          @media (min-width: 1024px) {
            @keyframes cardSlideUp {
              from { opacity: 0; transform: translateY(32px) rotate(-2deg); }
              to   { opacity: 1; transform: translateY(0) rotate(-2deg); }
            }
          }
          .score-bar-green { animation: scoreGreen 1.4s .5s ease-out both; }
          .score-bar-amber  { animation: scoreAmber 1.4s .7s ease-out both; }
          @keyframes scoreGreen { from { width: 0% } to { width: 87% } }
          @keyframes scoreAmber { from { width: 0% } to { width: 52% } }
          .payment-notify { animation: notifyFade 5s 1.2s ease-in-out infinite; }
          .match-notify   { animation: notifyFade 5s 2.4s ease-in-out infinite; }
          @keyframes notifyFade {
            0%,20%  { opacity: 0; transform: translateY(6px) scale(.97); }
            30%,75% { opacity: 1; transform: translateY(0) scale(1); }
            90%,100%{ opacity: 0; }
          }
          @media (prefers-reduced-motion: reduce) {
            .hero-enter, .hero-card { animation: none; opacity: 1; }
            .score-bar-green { animation: none; width: 87%; }
            .score-bar-amber  { animation: none; width: 52%; }
            .payment-notify, .match-notify { animation: none; opacity: 1; }
          }
        `}</style>
      </section>


      {/* ── LOCATION BAR ────────────────────────────────────────── */}
      <div className="border-y border-[#e2e8f0] bg-white py-4">
        <div className="flex items-center overflow-hidden">
          <span className="shrink-0 pl-6 pr-5 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Built for rental markets across South Africa
          </span>
          <div className="relative flex-1 overflow-hidden">
            <div className="animate-marquee flex gap-10 whitespace-nowrap">
              {CITIES.concat(CITIES).map((city, i) => (
                <span key={i} className="text-sm font-medium text-slate-600">
                  {city}
                  <span className="ml-10 text-slate-300">·</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>


      {/* ── STATS ───────────────────────────────────────────────── */}
      <section className="bg-[#1e40af] px-6 py-14">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-2 gap-y-10 text-center md:grid-cols-4">
            {STATS.map(s => (
              <div key={s.label}>
                <p className="text-4xl font-extrabold text-white">{s.value}</p>
                <p className="mt-1.5 text-sm font-medium text-blue-200">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-xs text-blue-300">
            Launch benchmarks and product targets. Final figures may vary by property, location and tenant demand.
          </p>
        </div>
      </section>


      {/* ── PRODUCT CARDS ───────────────────────────────────────── */}
      <section className="bg-[#f8fafc] px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-3 text-center text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Built for every side of the rental market
          </h2>
          <p className="mb-12 text-center text-base text-slate-500">
            Whether you own, rent or manage property, PropTrust gives you a more organised way to handle the rental process.
          </p>

          <div id="landlords" className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col rounded-2xl bg-[#0f172a] p-8 text-white shadow-xl">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-700">
                <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="mb-3 text-2xl font-extrabold">For Landlords</h3>
              <p className="mb-6 text-base leading-relaxed text-slate-300">
                Screen tenants, track rent, manage documents and handle maintenance without relying on a rental agent for every step.
              </p>
              <p className="mb-1 text-2xl font-extrabold text-[#3b82f6]">From R99/month</p>
              <p className="mb-8 text-sm text-slate-400">Simple tools for small and growing portfolios.</p>
              <div className="mt-auto flex flex-col gap-3">
                <Link href="/register"
                  className="rounded-xl bg-white py-3.5 text-center text-base font-bold text-[#0f172a] transition hover:bg-slate-100">
                  Start free trial
                </Link>
                <a href="#features"
                  className="text-center text-sm font-semibold text-[#3b82f6] transition hover:text-blue-400">
                  View landlord features
                </a>
              </div>
            </div>

            <div id="tenants" className="flex flex-col rounded-2xl border-2 border-[#e2e8f0] bg-white p-8 shadow-sm">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50">
                <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="mb-3 text-2xl font-extrabold text-slate-900">For Tenants</h3>
              <p className="mb-6 text-base leading-relaxed text-slate-600">
                Create a verified rental profile, share your details securely and connect with landlords who are looking for reliable tenants.
              </p>
              <p className="mb-1 text-2xl font-extrabold text-green-600">Free for tenants</p>
              <p className="mb-8 text-sm text-slate-400">Build trust before the viewing.</p>
              <div className="mt-auto flex flex-col gap-3">
                <Link href="/register"
                  className="rounded-xl bg-[#0f172a] py-3.5 text-center text-base font-bold text-white transition hover:bg-slate-800">
                  Create profile
                </Link>
                <a href="#features"
                  className="text-center text-sm font-semibold text-[#1e40af] transition hover:text-blue-700">
                  View tenant benefits
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ── FEATURES ────────────────────────────────────────────── */}
      <section id="features" className="bg-white px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-3 text-center text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Everything you need to manage rentals properly
          </h2>
          <p className="mb-14 text-center text-base text-slate-500">
            PropTrust brings screening, payments, maintenance and documents into one organised workspace.
          </p>

          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="hidden justify-center lg:flex">
              <FeatureWheel />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {FEATURE_LIST.map(f => (
                <div key={f.title} className="flex items-start gap-4 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4 transition hover:border-blue-200 hover:shadow-sm">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1e40af] text-white">
                    {f.icon}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{f.title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-slate-500">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* ── WHY PROPTRUST ───────────────────────────────────────── */}
      <section className="bg-[#0f172a] px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold text-white md:text-4xl">Why PropTrust?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300">
              We built PropTrust for the realities of the South African rental market: direct communication, better screening, lower admin and clearer records.
            </p>
          </div>

          <div className="grid items-center gap-14 lg:grid-cols-2">
            <div className="flex justify-center">
              <PhoneMockup />
            </div>

            <div className="space-y-7">
              {WHY_REASONS.map(r => (
                <div key={r.title} className="flex items-start gap-4">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-500">
                    <IconCheck className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-white">{r.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-400">{r.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* ── HOW IT WORKS ────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-[#f8fafc] px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-center text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Get started in minutes
          </h2>

          <div className="mb-12 flex justify-center">
            <div className="flex rounded-xl border border-[#e2e8f0] bg-white p-1 shadow-sm">
              {(['landlord', 'tenant'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setHwTab(tab)}
                  className={`rounded-lg px-6 py-2.5 text-sm font-bold transition ${
                    hwTab === tab
                      ? 'bg-[#0f172a] text-white shadow'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab === 'landlord' ? 'For Landlords' : 'For Tenants'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {HOW_IT_WORKS[hwTab].map((step, i) => (
              <div key={i} className="relative flex flex-col items-center text-center">
                {i < 2 && (
                  <div className="absolute left-[calc(50%+36px)] top-7 hidden h-0.5 w-[calc(100%-72px)] bg-slate-200 md:block" />
                )}
                <div className="relative z-10 mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[#1e40af] bg-white text-lg font-extrabold text-[#1e40af] shadow-sm">
                  {i + 1}
                </div>
                <h3 className="mb-2 font-bold text-slate-900">{step.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ── EARLY FEEDBACK ──────────────────────────────────────── */}
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-2 text-center text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Built with feedback from South African property owners
          </h2>
          <p className="mb-12 text-center text-base text-slate-500">
            Examples of the problems PropTrust is designed to solve.
          </p>

          <div className="grid gap-6 md:grid-cols-3">
            {FEEDBACK.map(t => (
              <div key={t.name} className="flex flex-col rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-7">
                <p className="flex-1 text-sm italic leading-relaxed text-slate-600">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-6 flex items-center gap-3 border-t border-slate-200 pt-5">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${t.avatarBg}`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-10 text-center text-sm text-slate-400">
            PropTrust is being shaped around practical landlord, tenant and property-management workflows.
          </p>
        </div>
      </section>


      {/* ── PRICING ─────────────────────────────────────────────── */}
      <section id="pricing" className="bg-[#f8fafc] px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-3 text-center text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Simple pricing for growing portfolios
          </h2>
          <p className="mb-14 text-center text-base text-slate-500">
            No agent commission. No confusing add-ons. Practical tools for managing rentals.
          </p>

          <div className="grid gap-6 md:grid-cols-3">
            {PRICING.map((tier, i) => (
              <div
                key={tier.name}
                className={`relative flex flex-col rounded-2xl p-8 ${
                  i === 1
                    ? 'bg-[#0f172a] text-white shadow-2xl ring-2 ring-[#1e40af]'
                    : 'border border-[#e2e8f0] bg-white'
                }`}
              >
                {i === 1 && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[#1e40af] px-4 py-1 text-xs font-bold text-white">
                    Most popular
                  </span>
                )}
                <p className={`text-xs font-bold uppercase tracking-wider ${i === 1 ? 'text-blue-300' : 'text-slate-400'}`}>
                  {tier.name}
                </p>
                <div className="my-4">
                  <span className={`text-4xl font-extrabold ${i === 1 ? 'text-white' : 'text-slate-900'}`}>
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span className={`ml-1 text-sm ${i === 1 ? 'text-blue-200' : 'text-slate-400'}`}>
                      {tier.period}
                    </span>
                  )}
                </div>
                <p className={`mb-6 text-sm ${i === 1 ? 'text-blue-200' : 'text-slate-500'}`}>
                  {tier.sub}
                </p>
                <ul className="mb-8 flex-1 space-y-3">
                  {tier.features.map(f => (
                    <li key={f.text} className="flex items-start gap-2.5">
                      {f.included ? (
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-green-500">
                          <IconCheck className="h-2.5 w-2.5 text-white" />
                        </span>
                      ) : (
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-200">
                          <IconX />
                        </span>
                      )}
                      <span className={`text-sm ${
                        f.included
                          ? (i === 1 ? 'text-blue-50' : 'text-slate-700')
                          : 'text-slate-400 line-through'
                      }`}>
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={tier.cta === 'Contact us' ? '#contact' : '/register'}
                  className={`block rounded-xl py-3.5 text-center text-sm font-bold transition ${
                    i === 1
                      ? 'bg-white text-[#0f172a] hover:bg-slate-100'
                      : 'border-2 border-[#1e40af] text-[#1e40af] hover:bg-blue-50'
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-slate-400">
            All plans include a 30-day free trial. No credit card required.
          </p>
        </div>
      </section>


      {/* ── FINAL CTA ───────────────────────────────────────────── */}
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
          <p className="mt-6 text-sm text-blue-200">
            No credit card required. Cancel anytime. Built for South Africa.
          </p>
        </div>
      </section>


      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer id="contact" className="bg-[#0f172a] px-6 pb-10 pt-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 md:grid-cols-4">

            <div>
              <Logo white />
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                South Africa&apos;s property management platform for landlords, tenants and property teams.
              </p>
              <p className="mt-3 text-sm text-slate-500">hello@proptrust.co.za</p>
              <p className="text-sm text-slate-500">Cape Town, South Africa</p>
              <div className="mt-4 flex gap-2.5">
                {[
                  { label: 'LinkedIn',  abbr: 'in' },
                  { label: 'Instagram', abbr: 'Ig' },
                  { label: 'X',         abbr: 'X'  },
                ].map(s => (
                  <a key={s.label} href="#" aria-label={s.label}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-xs font-bold text-slate-400 transition hover:border-white/30 hover:text-white">
                    {s.abbr}
                  </a>
                ))}
              </div>
            </div>

            {FOOTER_COLS.map(col => (
              <div key={col.title}>
                <p className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                  {col.title}
                </p>
                <ul className="space-y-2.5">
                  {col.links.map(link => (
                    <li key={link}>
                      <a href="#" className="text-sm text-slate-400 transition hover:text-white">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-8 sm:flex-row sm:items-center">
            <p className="text-xs text-slate-500">
              &copy; 2026 PropTrust (Pty) Ltd &middot; proptrust.co.za
            </p>
            <p className="text-xs text-slate-500">
              POPIA Compliant &middot; Made in South Africa
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}


// ── FEATURE WHEEL ────────────────────────────────────────────────────────────

const WHEEL_SEGMENTS = [
  { label: 'Tenant\nScreening',   color: '#1e3a8a' },
  { label: 'Rent\nTracking',      color: '#1e40af' },
  { label: 'Maintenance',         color: '#1d4ed8' },
  { label: 'Dashboard',           color: '#2563eb' },
  { label: 'Documents',           color: '#3b82f6' },
  { label: 'WhatsApp',            color: '#60a5fa' },
  { label: 'Marketplace',         color: '#93c5fd' },
  { label: 'Body\nCorporate',     color: '#bfdbfe' },
]

function FeatureWheel() {
  const [active, setActive] = useState<number | null>(null)
  const cx = 160, cy = 160, R = 130, r = 48
  const n = WHEEL_SEGMENTS.length

  function segmentPath(i: number) {
    const a0 = (i / n) * 2 * Math.PI - Math.PI / 2
    const a1 = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2
    const gap = 0.04
    const x0 = cx + R * Math.cos(a0 + gap), y0 = cy + R * Math.sin(a0 + gap)
    const x1 = cx + R * Math.cos(a1 - gap), y1 = cy + R * Math.sin(a1 - gap)
    const x2 = cx + r * Math.cos(a1 - gap), y2 = cy + r * Math.sin(a1 - gap)
    const x3 = cx + r * Math.cos(a0 + gap), y3 = cy + r * Math.sin(a0 + gap)
    return `M${x0} ${y0} A${R} ${R} 0 0 1 ${x1} ${y1} L${x2} ${y2} A${r} ${r} 0 0 0 ${x3} ${y3} Z`
  }

  function labelPos(i: number) {
    const a = ((i + 0.5) / n) * 2 * Math.PI - Math.PI / 2
    return { x: cx + ((R + r) / 2) * Math.cos(a), y: cy + ((R + r) / 2) * Math.sin(a) }
  }

  return (
    <svg viewBox="0 0 320 320" className="w-full max-w-xs select-none" aria-hidden="true">
      {WHEEL_SEGMENTS.map((seg, i) => {
        const pos = labelPos(i)
        const lines = seg.label.split('\n')
        return (
          <g key={i} onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)} style={{ cursor: 'pointer' }}>
            <path
              d={segmentPath(i)}
              fill={seg.color}
              opacity={active === null ? 1 : active === i ? 1 : 0.45}
              style={{ transition: 'opacity .2s' }}
            />
            {lines.map((line, li) => (
              <text
                key={li}
                x={pos.x}
                y={pos.y + (li - (lines.length - 1) / 2) * 9}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={i >= 6 ? '#1e3a8a' : 'white'}
                fontSize="7.5"
                fontWeight="600"
              >
                {line}
              </text>
            ))}
          </g>
        )
      })}
      <circle cx={cx} cy={cy} r={r - 4} fill="#0f172a" />
      <text x={cx} y={cy - 7} textAnchor="middle" fill="white" fontSize="13" fontWeight="800">PT</text>
      <text x={cx} y={cy + 9} textAnchor="middle" fill="#93c5fd" fontSize="7" fontWeight="600">PropTrust</text>
    </svg>
  )
}


// ── PHONE MOCKUP ─────────────────────────────────────────────────────────────

function PhoneMockup() {
  return (
    <div className="relative w-56">
      <div className="rounded-[2.5rem] border-4 border-slate-600 bg-slate-800 shadow-2xl">
        <div className="mx-auto mb-1 h-5 w-20 rounded-b-2xl bg-slate-700" />
        <div className="mx-1 mb-1 min-h-[380px] rounded-[1.8rem] bg-slate-900 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[9px] font-bold text-slate-300">PropTrust</span>
            <span className="text-[9px] text-green-400">Active</span>
          </div>
          {[
            { name: 'Unit 4B, Sea Point',  badge: 'Paid', badgeCls: 'text-green-400', score: 87 },
            { name: '3 Church St, Paarl',  badge: 'Due',  badgeCls: 'text-amber-400', score: 64 },
          ].map((p, i) => (
            <div key={i} className="mb-2 rounded-xl bg-slate-800 p-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-semibold text-white">{p.name}</span>
                <span className={`text-[9px] font-bold ${p.badgeCls}`}>{p.badge}</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
                <div
                  className={`h-full rounded-full ${p.score > 70 ? 'bg-green-500' : 'bg-amber-400'}`}
                  style={{ width: `${p.score}%` }}
                />
              </div>
              <span className="mt-0.5 block text-right text-[8px] text-slate-400">{p.score}/100</span>
            </div>
          ))}
          <div className="mb-2 rounded-xl border border-blue-800 bg-blue-900/40 p-2.5">
            <p className="text-[9px] font-bold text-blue-300">Payment due in 2 days</p>
            <p className="text-[8px] text-blue-400">Unit 4B · R14,500 · 1 Jul 2026</p>
          </div>
          <div className="rounded-xl border border-amber-800 bg-amber-900/40 p-2.5">
            <p className="text-[9px] font-bold text-amber-300">Maintenance request</p>
            <p className="text-[8px] text-amber-400">Sea Point · Geyser · Open</p>
          </div>
        </div>
        <div className="mx-auto mb-2 h-1 w-16 rounded-full bg-slate-600" />
      </div>
    </div>
  )
}


// ── DATA ─────────────────────────────────────────────────────────────────────

const CITIES = [
  'Cape Town', 'Stellenbosch', 'Johannesburg', 'Durban',
  'Pretoria', 'Sandton', 'Paarl', 'George', 'Knysna',
  'Hermanus', 'Bloemfontein', 'Gqeberha', 'East London', 'Kimberley',
]

const STATS = [
  { value: '60+',     label: 'Properties supported'         },
  { value: '100%',    label: 'Tenant verification workflow'  },
  { value: 'R0',      label: 'Agent commission required'     },
  { value: '14 days', label: 'Target let-time benchmark'     },
]

const FEATURE_LIST = [
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
    title: 'Property Dashboard',
    desc:  'Track each unit, tenant and task in one place.',
    icon:  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
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
    title: 'Tenant Marketplace',
    desc:  'Connect landlords and tenants directly.',
    icon:  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
  {
    title: 'Body Corporate Support',
    desc:  'Keep levies, notices, rules and shared-property details organised.',
    icon:  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  },
]

const WHY_REASONS = [
  {
    title: 'Reduce unnecessary agent dependency',
    body:  'Manage the core rental workflow yourself while keeping the process structured and professional.',
  },
  {
    title: 'Screen tenants before you commit',
    body:  'Use a clear verification flow to help reduce risk before signing a lease.',
  },
  {
    title: 'Designed around South African rentals',
    body:  'Support for rand-based rentals, local rental workflows, body corporate needs and practical communication channels.',
  },
  {
    title: 'Keep everything in one place',
    body:  'Tenant records, payments, maintenance, documents and communication can all live in one organised dashboard.',
  },
]

const HOW_IT_WORKS = {
  landlord: [
    { title: 'Create your account',            desc: 'Sign up and set up your landlord profile.' },
    { title: 'Add your property',              desc: 'Capture property details, rental amount, photos and lease information.' },
    { title: 'Manage tenants with confidence', desc: 'Screen applicants, track rent and keep maintenance requests organised.' },
  ],
  tenant: [
    { title: 'Create your profile',   desc: 'Build a secure rental profile that helps landlords understand who you are.' },
    { title: 'Complete verification', desc: 'Upload the required information and create a stronger rental application.' },
    { title: 'Connect directly',      desc: 'Find matched properties and communicate with landlords without unnecessary friction.' },
  ],
}

const FEEDBACK = [
  {
    quote:    'Having tenant screening, rent tracking and documents in one place would make managing my units far less stressful.',
    name:     'Sarah M.',
    role:     'Landlord · Cape Town',
    initials: 'SM',
    avatarBg: 'bg-blue-600',
  },
  {
    quote:    'The biggest value is knowing more about a tenant before signing. One bad tenant can cost months of time and money.',
    name:     'Johan V.',
    role:     'Landlord · Stellenbosch',
    initials: 'JV',
    avatarBg: 'bg-green-600',
  },
  {
    quote:    'Maintenance requests need structure. WhatsApp alone becomes messy once you manage more than a few tenants.',
    name:     'Nomsa D.',
    role:     'Property Manager · Johannesburg',
    initials: 'ND',
    avatarBg: 'bg-purple-600',
  },
]

type PricingFeature = { text: string; included: boolean }
type PricingTier    = { name: string; price: string; period?: string; sub: string; features: PricingFeature[]; cta: string }

const PRICING: PricingTier[] = [
  {
    name: 'Starter', price: 'R99', period: '/month',
    sub: 'For landlords with up to 3 properties.',
    cta: 'Start free trial',
    features: [
      { text: 'Unlimited tenant records',   included: true  },
      { text: 'Tenant screening workflow',  included: true  },
      { text: 'Rent tracking',              included: true  },
      { text: 'Email reminders',            included: true  },
      { text: 'Tenant portal',              included: true  },
      { text: 'Document storage',           included: true  },
      { text: 'WhatsApp notifications',     included: false },
      { text: 'Body corporate tools',       included: false },
      { text: 'Advanced maintenance mgmt',  included: false },
    ],
  },
  {
    name: 'Professional', price: 'R299', period: '/month',
    sub: 'For landlords and managers with up to 15 properties.',
    cta: 'Start free trial',
    features: [
      { text: 'Everything in Starter',      included: true },
      { text: 'WhatsApp notifications',     included: true },
      { text: 'Body corporate tools',       included: true },
      { text: 'Maintenance management',     included: true },
      { text: 'Bank statement review',      included: true },
      { text: 'Tenant marketplace access',  included: true },
      { text: 'Priority support',           included: true },
    ],
  },
  {
    name: 'Enterprise', price: 'R799', period: '/month',
    sub: 'For larger portfolios and property teams.',
    cta: 'Contact us',
    features: [
      { text: 'Everything in Professional', included: true },
      { text: 'Unlimited properties',       included: true },
      { text: 'Dedicated account support',  included: true },
      { text: 'Custom integrations',        included: true },
      { text: 'API access',                 included: true },
      { text: 'White-label options',        included: true },
      { text: 'SA document templates',      included: true },
    ],
  },
]

const FOOTER_COLS = [
  {
    title: 'Product',
    links: ['Features', 'Pricing', 'For Landlords', 'For Tenants', 'Mobile App', 'API'],
  },
  {
    title: 'Company',
    links: ['About us', 'Blog', 'Careers', 'Press', 'Contact', 'Privacy Policy', 'Terms of Service'],
  },
  {
    title: 'Resources',
    links: ['SA Rental Law Guide', 'FAQ', 'Tenant Screening Guide', 'Body Corporate Guide', 'Maintenance Checklist'],
  },
]
