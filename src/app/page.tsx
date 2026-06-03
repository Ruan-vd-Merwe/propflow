'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

// ── Icons ─────────────────────────────────────────────────────────────────────

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

// ── Nav Dropdown ──────────────────────────────────────────────────────────────

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
        className="flex items-center gap-1 rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
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

// ── Logo ──────────────────────────────────────────────────────────────────────

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

// ── Browser-frame dashboard mockup ────────────────────────────────────────────

function DashboardMockup() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/80">
      {/* Chrome bar */}
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
        </div>
        <div className="mx-3 flex flex-1 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5">
          <svg className="h-3 w-3 text-slate-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
          </svg>
          <span className="text-xs text-slate-400">app.proptrust.co.za/dashboard</span>
        </div>
      </div>

      {/* App shell */}
      <div className="flex h-[340px] overflow-hidden md:h-[420px]">

        {/* Sidebar */}
        <aside className="hidden w-44 shrink-0 flex-col border-r border-slate-100 bg-[#0f172a] md:flex">
          <div className="p-4 pt-5">
            <div className="mb-6 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-500">
                <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <span className="text-xs font-bold text-white">PropTrust</span>
            </div>
            {[
              { label: 'Dashboard',   active: true  },
              { label: 'Properties',  active: false },
              { label: 'Tenants',     active: false },
              { label: 'Payments',    active: false },
              { label: 'Maintenance', active: false },
              { label: 'Documents',   active: false },
            ].map(item => (
              <div
                key={item.label}
                className={`mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2 text-[11px] font-medium ${
                  item.active
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-70" />
                {item.label}
              </div>
            ))}
          </div>
        </aside>

        {/* Main panel */}
        <div className="flex-1 overflow-hidden bg-[#f8fafc] p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">Good morning, Johan</p>
              <p className="text-[11px] text-slate-400">3 properties · 8 tenants · June 2026</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] text-slate-500 md:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                All systems active
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1e40af] text-[11px] font-bold text-white">JV</div>
            </div>
          </div>

          {/* Stat row */}
          <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
            {[
              { label: 'Monthly income',  value: 'R42,500', color: 'text-green-700', border: 'border-green-100', bg: 'bg-green-50'  },
              { label: 'Outstanding',     value: 'R8,200',  color: 'text-amber-700', border: 'border-amber-100', bg: 'bg-amber-50'  },
              { label: 'Open requests',   value: '3',       color: 'text-blue-700',  border: 'border-blue-100',  bg: 'bg-blue-50'   },
              { label: 'Avg risk score',  value: '78/100',  color: 'text-slate-800', border: 'border-slate-200', bg: 'bg-white'     },
            ].map(s => (
              <div key={s.label} className={`rounded-xl border p-3 ${s.bg} ${s.border}`}>
                <p className={`text-sm font-extrabold tabular-nums ${s.color}`}>{s.value}</p>
                <p className="mt-0.5 text-[10px] text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Tenant table */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
              <p className="text-xs font-bold text-slate-900">Tenants</p>
              <span className="text-[10px] font-semibold text-[#1e40af]">View all</span>
            </div>
            {[
              { initials: 'SD', name: 'Sarah D.',  unit: 'Unit 4B · Sea Point',  score: 87, status: 'Paid',    sCls: 'text-green-700 bg-green-100' },
              { initials: 'JF', name: 'James F.',  unit: 'Unit 2A · Sea Point',  score: 52, status: 'Overdue', sCls: 'text-red-700 bg-red-100'     },
              { initials: 'TM', name: 'Thabo M.',  unit: '3 Church St · Paarl',  score: 91, status: 'Paid',    sCls: 'text-green-700 bg-green-100' },
            ].map(t => (
              <div key={t.name} className="flex items-center gap-3 border-b border-slate-50 px-4 py-2.5 last:border-0">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                  {t.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-slate-900">{t.name}</p>
                  <p className="truncate text-[10px] text-slate-400">{t.unit}</p>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-16">
                    <div className="h-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${t.score > 70 ? 'bg-green-500' : 'bg-amber-400'}`}
                        style={{ width: `${t.score}%` }}
                      />
                    </div>
                    <p className="mt-0.5 text-right text-[9px] text-slate-400">{t.score}/100</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${t.sCls}`}>
                    {t.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

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
      <header className={`sticky top-0 z-50 border-b bg-white/95 backdrop-blur-sm transition-all duration-200 ${
        scrolled ? 'border-[#e2e8f0] shadow-sm' : 'border-transparent'
      }`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <Logo />

          <nav className="hidden items-center gap-0.5 lg:flex">
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
                { label: 'Tenant Screening',      href: '#features' },
                { label: 'Rent Tracking',          href: '#features' },
                { label: 'Maintenance Requests',   href: '#features' },
                { label: 'Property Dashboard',     href: '#features' },
                { label: 'Document Storage',       href: '#features' },
                { label: 'WhatsApp Notifications', href: '#features' },
                { label: 'Tenant Marketplace',     href: '#features' },
                { label: 'Body Corporate Support', href: '#features' },
              ]}
            />
            <a href="#pricing" className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-900">
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
            <a href="#contact" className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-900">
              Contact
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link href="/login"
              className="hidden rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 transition hover:text-slate-900 lg:block">
              Login
            </Link>
            <Link href="/register"
              className="rounded-lg bg-[#0f172a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
              Get Started
            </Link>
            <button
              onClick={() => setMobileOpen(o => !o)}
              className="ml-1 rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
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
                { label: 'For Landlords',  href: '#landlords'    },
                { label: 'For Tenants',    href: '#tenants'      },
                { label: 'Features',       href: '#features'     },
                { label: 'Pricing',        href: '#pricing'      },
                { label: 'How it works',   href: '#how-it-works' },
                { label: 'Contact',        href: '#contact'      },
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
                className="rounded-xl border-2 border-slate-200 px-4 py-3 text-center text-base font-bold text-slate-800">
                Login
              </Link>
              <Link href="/register" onClick={() => setMobileOpen(false)}
                className="rounded-xl bg-[#0f172a] px-4 py-3 text-center text-base font-bold text-white">
                Get Started Free
              </Link>
            </div>
          </div>
        )}
      </header>


      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white px-6 pb-0 pt-20 md:pt-28">
        {/* Blue radial glow */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[500px]"
          style={{ background: 'radial-gradient(ellipse 80% 55% at 50% 0%, rgba(59,130,246,0.10), transparent)' }}
        />

        <div className="relative mx-auto max-w-3xl text-center">
          <span className="mb-6 inline-flex items-center rounded-full bg-blue-50 px-4 py-1.5 text-xs font-semibold text-[#1e40af] ring-1 ring-blue-100">
            Built for South African rentals
          </span>

          <h1 className="mb-5 text-[2.75rem] font-extrabold leading-[1.08] tracking-tight text-[#0f172a] md:text-6xl lg:text-7xl">
            Manage your rental<br className="hidden md:block" />
            {' '}property<br className="hidden md:block" />
            <span className="text-[#3b82f6]">without the admin headache</span>
          </h1>

          <p className="mx-auto mb-8 max-w-xl text-lg leading-relaxed text-slate-500">
            PropTrust helps South African landlords screen tenants, track rent, manage maintenance
            and keep documents organised — all from one simple platform.
          </p>

          <div className="mb-4 flex flex-wrap justify-center gap-3">
            <Link href="/register"
              className="rounded-full bg-[#1e40af] px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-800 active:scale-[0.98]">
              Start free trial
            </Link>
            <Link href="/register"
              className="rounded-full border-2 border-slate-200 px-8 py-3.5 text-base font-bold text-[#0f172a] transition hover:border-slate-400 active:scale-[0.98]">
              Book a demo
            </Link>
          </div>

          <p className="mb-16 text-sm text-slate-400">
            No credit card required. Cancel anytime.
          </p>
        </div>

        {/* Browser-frame mockup */}
        <div className="relative mx-auto max-w-5xl">
          <div className="hero-mockup">
            <DashboardMockup />
          </div>
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-32"
            style={{ background: 'linear-gradient(to top, white, transparent)' }}
          />
        </div>

        <style>{`
          .hero-mockup {
            animation: mockupRise .8s cubic-bezier(.22,.68,0,1.1) both;
          }
          @keyframes mockupRise {
            from { opacity: 0; transform: translateY(40px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @media (prefers-reduced-motion: reduce) {
            .hero-mockup { animation: none; opacity: 1; }
          }
        `}</style>
      </section>


      {/* ── LOCATION BAR ────────────────────────────────────────── */}
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


      {/* ── STATS ───────────────────────────────────────────────── */}
      <section className="border-b border-[#e2e8f0] bg-white px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-2 gap-y-10 md:grid-cols-4 md:divide-x md:divide-[#e2e8f0]">
            {STATS.map(s => (
              <div key={s.label} className="px-8 text-center first:pl-0 last:pr-0">
                <p className="text-4xl font-extrabold tabular-nums text-[#0f172a]">{s.value}</p>
                <p className="mt-1.5 text-sm text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-xs text-slate-400">
            Launch benchmarks and product targets. Final figures may vary by property, location and tenant demand.
          </p>
        </div>
      </section>


      {/* ── FEATURES ────────────────────────────────────────────── */}
      <section id="features" className="bg-[#f8fafc] px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 max-w-2xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#1e40af]">Platform</p>
            <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-[#0f172a] md:text-4xl">
              Everything you need to manage rentals properly
            </h2>
            <p className="text-base leading-relaxed text-slate-500">
              PropTrust brings screening, payments, maintenance and documents into one organised workspace.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURE_LIST.map(f => (
              <div
                key={f.title}
                className="group rounded-2xl border border-[#e2e8f0] bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#1e40af] transition-colors group-hover:bg-[#1e40af] group-hover:text-white">
                  {f.icon}
                </div>
                <h3 className="mb-1.5 font-bold text-[#0f172a]">{f.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ── PRODUCT CARDS ───────────────────────────────────────── */}
      <section className="bg-white px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#1e40af]">Who it&apos;s for</p>
            <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-[#0f172a] md:text-4xl">
              Built for every side of the rental market
            </h2>
            <p className="mx-auto max-w-xl text-base text-slate-500">
              Whether you own, rent or manage property, PropTrust gives you a more organised way to handle the rental process.
            </p>
          </div>

          <div id="landlords" className="grid gap-6 lg:grid-cols-2">

            {/* Landlord */}
            <div className="relative overflow-hidden rounded-3xl bg-[#0f172a] p-10">
              {/* Subtle dot grid */}
              <svg className="pointer-events-none absolute right-0 top-0 h-64 w-64 opacity-[0.04]" viewBox="0 0 200 200">
                <defs>
                  <pattern id="dots" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="1.5" fill="white" />
                  </pattern>
                </defs>
                <rect width="200" height="200" fill="url(#dots)" />
              </svg>

              <div className="relative">
                <span className="mb-6 inline-block rounded-full bg-blue-900 px-3 py-1 text-xs font-semibold text-blue-300">
                  Landlords
                </span>
                <h3 className="mb-4 text-3xl font-extrabold text-white">For Landlords</h3>
                <p className="mb-8 text-base leading-relaxed text-slate-300">
                  Screen tenants, track rent, manage documents and handle maintenance without relying on a rental agent for every step.
                </p>

                <div className="mb-8 space-y-3">
                  {['Tenant screening workflow', 'Rent tracking and reminders', 'Maintenance management', 'Document storage'].map(item => (
                    <div key={item} className="flex items-center gap-2.5">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600">
                        <IconCheck className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-sm text-slate-300">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-end gap-4 border-t border-white/10 pt-8">
                  <div>
                    <p className="text-3xl font-extrabold text-white">R99</p>
                    <p className="text-sm text-slate-400">/month · up to 3 properties</p>
                  </div>
                  <Link href="/register"
                    className="ml-auto rounded-xl bg-white px-6 py-3 text-sm font-bold text-[#0f172a] transition hover:bg-slate-100">
                    Start free trial
                  </Link>
                </div>
              </div>
            </div>

            {/* Tenant */}
            <div id="tenants" className="relative overflow-hidden rounded-3xl border-2 border-[#e2e8f0] bg-white p-10">
              <div className="relative">
                <span className="mb-6 inline-block rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                  Tenants
                </span>
                <h3 className="mb-4 text-3xl font-extrabold text-[#0f172a]">For Tenants</h3>
                <p className="mb-8 text-base leading-relaxed text-slate-500">
                  Create a verified rental profile, share your details securely and connect with landlords who are looking for reliable tenants.
                </p>

                <div className="mb-8 space-y-3">
                  {['Verified rental profile', 'Secure document sharing', 'Direct landlord connections', 'No agent fees'].map(item => (
                    <div key={item} className="flex items-center gap-2.5">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500">
                        <IconCheck className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-sm text-slate-600">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-end gap-4 border-t border-slate-100 pt-8">
                  <div>
                    <p className="text-3xl font-extrabold text-[#0f172a]">Free</p>
                    <p className="text-sm text-slate-400">Always free for tenants</p>
                  </div>
                  <Link href="/register"
                    className="ml-auto rounded-xl bg-[#0f172a] px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800">
                    Create profile
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ── WHY PROPTRUST ───────────────────────────────────────── */}
      <section className="bg-[#f8fafc] px-6 py-24">
        <div className="mx-auto max-w-7xl">

          <div className="grid gap-8 lg:grid-cols-[5fr_7fr] lg:gap-16">

            {/* Left: dark callout card */}
            <div className="flex flex-col justify-between rounded-3xl bg-[#0f172a] p-10">
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-blue-400">Why PropTrust</p>
                <h2 className="mb-6 text-3xl font-extrabold leading-tight text-white md:text-4xl">
                  Built for the realities of South African rentals
                </h2>
                <p className="text-base leading-relaxed text-slate-400">
                  Direct communication, better screening, lower admin and clearer records — designed around how rentals actually work in South Africa.
                </p>
              </div>

              <div className="mt-10 grid grid-cols-2 gap-4 border-t border-white/10 pt-8">
                {[
                  { value: 'R0',   label: 'Agent commission' },
                  { value: '100%', label: 'Verification workflow' },
                  { value: '14d',  label: 'Target let time' },
                  { value: '3',    label: 'Plan tiers' },
                ].map(s => (
                  <div key={s.label}>
                    <p className="text-2xl font-extrabold text-white">{s.value}</p>
                    <p className="text-xs text-slate-500">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: reasons */}
            <div className="flex flex-col justify-center space-y-8">
              {WHY_REASONS.map((r, i) => (
                <div key={r.title} className="flex gap-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[#e2e8f0] text-sm font-extrabold text-[#0f172a]">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="mb-1.5 font-bold text-[#0f172a]">{r.title}</h3>
                    <p className="text-sm leading-relaxed text-slate-500">{r.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* ── HOW IT WORKS ────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-white px-6 py-24">
        <div className="mx-auto max-w-5xl">

          <div className="mb-12 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#1e40af]">Process</p>
            <h2 className="text-3xl font-extrabold tracking-tight text-[#0f172a] md:text-4xl">
              Get started in minutes
            </h2>
          </div>

          <div className="mb-12 flex justify-center">
            <div className="flex rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-1">
              {(['landlord', 'tenant'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setHwTab(tab)}
                  className={`rounded-lg px-6 py-2.5 text-sm font-bold transition-all ${
                    hwTab === tab
                      ? 'bg-white text-[#0f172a] shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab === 'landlord' ? 'For Landlords' : 'For Tenants'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {HOW_IT_WORKS[hwTab].map((step, i) => (
              <div key={i} className="relative rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-7">
                {i < 2 && (
                  <div className="absolute right-[-13px] top-9 z-10 hidden h-px w-6 border-t-2 border-dashed border-slate-200 md:block" />
                )}
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-[#0f172a] text-sm font-extrabold text-white">
                  {i + 1}
                </div>
                <h3 className="mb-2 font-bold text-[#0f172a]">{step.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ── FEEDBACK ────────────────────────────────────────────── */}
      <section className="bg-[#f8fafc] px-6 py-24">
        <div className="mx-auto max-w-7xl">

          <div className="mb-12 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#1e40af]">Early feedback</p>
            <h2 className="mb-3 text-3xl font-extrabold tracking-tight text-[#0f172a] md:text-4xl">
              Built with feedback from South African property owners
            </h2>
            <p className="mx-auto max-w-xl text-base text-slate-500">
              Examples of the problems PropTrust is designed to solve.
            </p>
          </div>

          {/* Featured quote */}
          <div className="mb-8 rounded-3xl border border-[#e2e8f0] bg-white p-10 md:p-14">
            <svg className="mb-6 h-10 w-10 text-slate-200" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>
            <p className="mb-8 text-xl font-medium leading-relaxed text-slate-700 md:text-2xl md:leading-relaxed">
              Having tenant screening, rent tracking and documents in one place would make managing my units far less stressful.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">SM</div>
              <div>
                <p className="font-bold text-[#0f172a]">Sarah M.</p>
                <p className="text-sm text-slate-400">Landlord · Cape Town</p>
              </div>
            </div>
          </div>

          {/* Remaining cards */}
          <div className="grid gap-6 md:grid-cols-2">
            {FEEDBACK.slice(1).map(t => (
              <div key={t.name} className="rounded-2xl border border-[#e2e8f0] bg-white p-8">
                <p className="mb-6 text-base italic leading-relaxed text-slate-600">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 border-t border-slate-100 pt-6">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${t.avatarBg}`}>
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


      {/* ── PRICING ─────────────────────────────────────────────── */}
      <section id="pricing" className="bg-white px-6 py-24">
        <div className="mx-auto max-w-6xl">

          <div className="mb-14 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#1e40af]">Pricing</p>
            <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-[#0f172a] md:text-4xl">
              Simple pricing for growing portfolios
            </h2>
            <p className="mx-auto max-w-lg text-base text-slate-500">
              No agent commission. No confusing add-ons. Practical tools for managing rentals.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {PRICING.map((tier, i) => (
              <div
                key={tier.name}
                className={`relative flex flex-col rounded-3xl p-8 ${
                  i === 1
                    ? 'bg-[#0f172a] text-white shadow-2xl shadow-slate-200 ring-1 ring-slate-900/10'
                    : 'border border-[#e2e8f0] bg-[#f8fafc]'
                }`}
              >
                {i === 1 && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[#1e40af] px-4 py-1 text-xs font-bold text-white">
                    Most popular
                  </span>
                )}

                <p className={`mb-4 text-xs font-bold uppercase tracking-wider ${i === 1 ? 'text-blue-300' : 'text-slate-400'}`}>
                  {tier.name}
                </p>

                <div className="mb-2 flex items-end gap-1">
                  <span className={`text-4xl font-extrabold tabular-nums ${i === 1 ? 'text-white' : 'text-[#0f172a]'}`}>
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span className={`mb-1 text-sm ${i === 1 ? 'text-blue-300' : 'text-slate-400'}`}>
                      {tier.period}
                    </span>
                  )}
                </div>

                <p className={`mb-8 text-sm ${i === 1 ? 'text-blue-200' : 'text-slate-500'}`}>
                  {tier.sub}
                </p>

                <ul className="mb-8 flex-1 space-y-3">
                  {tier.features.map(f => (
                    <li key={f.text} className="flex items-start gap-2.5">
                      {f.included ? (
                        <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${i === 1 ? 'bg-blue-500' : 'bg-green-500'}`}>
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
                  className={`block rounded-2xl py-3.5 text-center text-sm font-bold transition ${
                    i === 1
                      ? 'bg-white text-[#0f172a] hover:bg-slate-100'
                      : 'bg-[#0f172a] text-white hover:bg-slate-800'
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
      <section className="relative overflow-hidden bg-[#0f172a] px-6 py-24">
        {/* Dot pattern */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.04]" viewBox="0 0 400 400">
          <defs>
            <pattern id="ctadots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="400" height="400" fill="url(#ctadots)" />
        </svg>

        <div className="relative mx-auto max-w-2xl text-center">
          <h2 className="mb-5 text-4xl font-extrabold text-white md:text-5xl">
            Ready to manage your rentals with more control?
          </h2>
          <p className="mx-auto mb-10 max-w-lg text-lg leading-relaxed text-slate-400">
            Start with PropTrust and bring tenant screening, rent tracking, maintenance and documents into one simple platform.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/register"
              className="rounded-full bg-white px-9 py-4 text-base font-extrabold text-[#0f172a] shadow-lg transition hover:bg-slate-100 active:scale-[0.98]">
              Start free trial
            </Link>
            <Link href="/register"
              className="rounded-full border-2 border-white/20 px-9 py-4 text-base font-bold text-white transition hover:border-white/40 hover:bg-white/5 active:scale-[0.98]">
              Book a demo
            </Link>
          </div>
          <p className="mt-6 text-sm text-slate-500">
            No credit card required. Cancel anytime. Built for South Africa.
          </p>
        </div>
      </section>


      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer id="contact" className="bg-[#0f172a] px-6 pb-10 pt-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 grid gap-10 border-b border-white/10 pb-12 md:grid-cols-4">

            <div>
              <Logo white />
              <p className="mt-4 text-sm leading-relaxed text-slate-400">
                South Africa&apos;s property management platform for landlords, tenants and property teams.
              </p>
              <p className="mt-4 text-sm text-slate-500">hello@proptrust.co.za</p>
              <p className="text-sm text-slate-500">Cape Town, South Africa</p>
              <div className="mt-5 flex gap-2.5">
                {[
                  { label: 'LinkedIn',  abbr: 'in' },
                  { label: 'Instagram', abbr: 'Ig' },
                  { label: 'X',         abbr: 'X'  },
                ].map(s => (
                  <a
                    key={s.label}
                    href="#"
                    aria-label={s.label}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-xs font-bold text-slate-500 transition hover:border-white/25 hover:text-slate-300"
                  >
                    {s.abbr}
                  </a>
                ))}
              </div>
            </div>

            {FOOTER_COLS.map(col => (
              <div key={col.title}>
                <p className="mb-5 text-xs font-bold uppercase tracking-wider text-slate-500">
                  {col.title}
                </p>
                <ul className="space-y-3">
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

          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <p className="text-xs text-slate-600">
              &copy; 2026 PropTrust (Pty) Ltd &middot; proptrust.co.za
            </p>
            <p className="text-xs text-slate-600">
              POPIA Compliant &middot; Made in South Africa
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}


// ── Data ──────────────────────────────────────────────────────────────────────

const CITIES = [
  'Cape Town', 'Stellenbosch', 'Johannesburg', 'Durban',
  'Pretoria', 'Sandton', 'Paarl', 'George', 'Knysna',
  'Hermanus', 'Bloemfontein', 'Gqeberha', 'East London', 'Kimberley',
]

const STATS = [
  { value: '60+',     label: 'Properties supported'        },
  { value: '100%',    label: 'Tenant verification workflow' },
  { value: 'R0',      label: 'Agent commission required'   },
  { value: '14 days', label: 'Target let-time benchmark'   },
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
