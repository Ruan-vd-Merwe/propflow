"use client";

import React from "react";
import Link from "next/link";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

// ── Data ──────────────────────────────────────────────────────────────────────

const CITIES = [
  "Cape Town",
  "Stellenbosch",
  "Johannesburg",
  "Durban",
  "Pretoria",
  "Sandton",
  "Paarl",
  "George",
  "Knysna",
  "Hermanus",
  "Bloemfontein",
  "Gqeberha",
  "East London",
  "Kimberley",
];

const STRIP_ITEMS = [
  { label: "Area Match", desc: "Find the right suburb first" },
  { label: "Property Match", desc: "Ranked by fit, not newest first" },
  { label: "Rental Profile", desc: "One profile. Apply anywhere." },
  { label: "No agent fees", desc: "Free for tenants. Always." },
];

const STEPS = [
  {
    n: "01",
    title: "Tell us about your life",
    desc: "Budget, commute, lifestyle and where you need to be.",
  },
  {
    n: "02",
    title: "Get area recommendations",
    desc: "We compare suburbs by safety, commute time, social fit and rental value.",
  },
  {
    n: "03",
    title: "See properties that match you",
    desc: "Every listing is scored against your profile — not listed by upload date.",
  },
  {
    n: "04",
    title: "Apply with one profile",
    desc: "Upload your documents once. Reuse your profile for every application.",
  },
];

const SUBURB_SCORES = [
  { name: "Sea Point", score: 84, tag: "Coastal · Walkable" },
  { name: "Rondebosch", score: 76, tag: "Quiet · Good schools" },
  { name: "Gardens", score: 71, tag: "Central · Social" },
  { name: "Woodstock", score: 62, tag: "Creative · Affordable" },
];

const PROFILE_ROWS = [
  { label: "SA ID", status: "Verified" },
  { label: "Monthly income", status: "Confirmed" },
  { label: "Bank statements", status: "3 months" },
  { label: "References", status: "2 added" },
  { label: "Credit profile", status: "Good standing" },
];

const QUOTES = [
  {
    quote:
      "I spent two months searching before I found the right area. A tool like this would have saved weeks.",
    name: "Lerato M.",
    role: "Tenant · Johannesburg",
    initials: "LM",
    bg: "bg-blue-600",
  },
  {
    quote:
      "Getting a complete, verified application is rare. Most landlords see incomplete forms with no references attached.",
    name: "Johan V.",
    role: "Landlord · Stellenbosch",
    initials: "JV",
    bg: "bg-green-700",
  },
  {
    quote:
      "I want to know the suburb fits my life before I even look at the property. Budget is not the only filter.",
    name: "Aisha C.",
    role: "Tenant · Cape Town",
    initials: "AC",
    bg: "bg-purple-700",
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 antialiased">
      <MarketingNav />

      {/* ── 1. HERO ───────────────────────────────────────────────────────────── */}
      <section className="bg-[#0f172a] px-6 pb-24 pt-20 md:pb-32 md:pt-28">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-6 text-xs font-bold uppercase tracking-widest text-blue-400">
            South Africa
          </p>

          <h1 className="text-5xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-6xl md:text-7xl">
            Find a home that
            <br />
            fits your life.
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-slate-300 sm:text-xl">
            PropTrust helps you choose the right area, discover properties that
            match your lifestyle, and apply with one trusted rental profile.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              href="/area-match"
              className="rounded-full bg-[#3b82f6] px-8 py-4 text-base font-bold text-white shadow-lg transition hover:bg-blue-500 active:scale-95"
            >
              Find my best area
            </Link>
            <Link
              href="/solutions/landlords"
              className="rounded-full border-2 border-white/25 px-8 py-4 text-base font-bold text-white transition hover:border-white/50 hover:bg-white/5 active:scale-95"
            >
              List a property
            </Link>
          </div>

          <p className="mt-5 text-xs text-slate-500">Free for tenants. Always.</p>
        </div>
      </section>

      {/* ── 2. VALUE STRIP ────────────────────────────────────────────────────── */}
      <div className="border-y border-slate-200 bg-white px-6 py-8">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 md:grid-cols-4">
          {STRIP_ITEMS.map((item) => (
            <div key={item.label} className="text-center">
              <p className="text-sm font-bold text-[#0f172a]">{item.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── CITY SCROLL ───────────────────────────────────────────────────────── */}
      <div className="border-b border-slate-100 bg-white py-4">
        <div className="flex items-center overflow-hidden">
          <span className="shrink-0 pl-6 pr-5 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Properties across
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

      {/* ── 3. HOW IT WORKS ───────────────────────────────────────────────────── */}
      <section className="bg-[#f8fafc] px-6 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-[#0f172a] md:text-4xl">
              How it works
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <div
                key={step.n}
                className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-slate-100"
              >
                <p className="mb-4 text-3xl font-extrabold text-slate-100">
                  {step.n}
                </p>
                <h3 className="mb-2 text-base font-bold text-[#0f172a]">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-500">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. AREA MATCH ─────────────────────────────────────────────────────── */}
      <section className="bg-white px-6 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Copy */}
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[#1e40af]">
                Area Match
              </p>
              <h2 className="mb-5 text-3xl font-extrabold tracking-tight text-[#0f172a] md:text-4xl">
                Know the suburb before
                <br className="hidden sm:block" />
                you view a property.
              </h2>
              <p className="mb-8 text-base leading-relaxed text-slate-500">
                Where you live matters as much as what you live in. PropTrust
                compares suburbs by budget, commute time, safety, lifestyle
                amenities and social fit — so you narrow the right area first.
              </p>
              <ul className="mb-8 space-y-3">
                {[
                  "Budget and rental value per suburb",
                  "Commute time to your workplace",
                  "Safety and crime index",
                  "Proximity to restaurants, gyms and open space",
                  "Public transport access",
                  "Area personality and social fit",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 text-sm text-slate-700"
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#1e40af]" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/area-match"
                className="inline-block rounded-full bg-[#0f172a] px-7 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                Explore areas
              </Link>
            </div>

            {/* Visual: suburb comparison */}
            <div className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-6 lg:p-8">
              <p className="mb-5 text-xs font-bold uppercase tracking-widest text-slate-400">
                Suburb comparison
              </p>
              <div className="space-y-5">
                {SUBURB_SCORES.map((suburb) => (
                  <div key={suburb.name}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-bold text-[#0f172a]">
                          {suburb.name}
                        </span>
                        <span className="text-xs text-slate-400">
                          {suburb.tag}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-[#1e40af]">
                        {suburb.score}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-[#1e40af]"
                        style={{ width: `${suburb.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-xs text-slate-400">
                Scores are calculated from your budget, commute and lifestyle
                preferences.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. PROPERTY MATCH ─────────────────────────────────────────────────── */}
      <section className="bg-[#f8fafc] px-6 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Visual: property card mock */}
            <div className="order-2 lg:order-1">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[#0f172a]">
                      3-bed apartment, Sea Point
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      R14,500 per month · Available now
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-800">
                    82% match
                  </span>
                </div>
                <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-[82%] rounded-full bg-green-500" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Budget fit", value: "Good" },
                    { label: "Commute", value: "22 min" },
                    { label: "Area match", value: "Strong" },
                    { label: "Approval odds", value: "High" },
                  ].map((row) => (
                    <div key={row.label} className="rounded-xl bg-slate-50 px-3 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        {row.label}
                      </p>
                      <p className="mt-1 text-sm font-bold text-[#0f172a]">
                        {row.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-5 opacity-40">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[#0f172a]">
                      2-bed flat, Gardens
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      R12,000 per month · Available 1 Aug
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                    61% match
                  </span>
                </div>
              </div>
            </div>

            {/* Copy */}
            <div className="order-1 lg:order-2">
              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[#1e40af]">
                Property Match
              </p>
              <h2 className="mb-5 text-3xl font-extrabold tracking-tight text-[#0f172a] md:text-4xl">
                Ranked by fit,
                <br className="hidden sm:block" />
                not by newest listing.
              </h2>
              <p className="mb-6 text-base leading-relaxed text-slate-500">
                Other portals sort by newest listing. PropTrust ranks by fit —
                budget, commute, area and how likely you are to be approved.
              </p>
              <p className="mb-8 text-base leading-relaxed text-slate-500">
                Every ranking is built from your profile. As your preferences
                change, so does your list.
              </p>
              <Link
                href="/browse"
                className="inline-block rounded-full bg-[#0f172a] px-7 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                Browse properties
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. RENTAL PROFILE ─────────────────────────────────────────────────── */}
      <section className="bg-white px-6 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Copy */}
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[#1e40af]">
                Rental Profile
              </p>
              <h2 className="mb-5 text-3xl font-extrabold tracking-tight text-[#0f172a] md:text-4xl">
                Apply once.
                <br className="hidden sm:block" />
                Use everywhere.
              </h2>
              <p className="mb-8 text-base leading-relaxed text-slate-500">
                Upload your ID, income and bank statements once. Reuse your
                profile for every application — no repeated paperwork, no
                starting from scratch each time.
              </p>
              <div className="mb-8 space-y-5">
                {[
                  {
                    title: "SA ID verification",
                    desc: "Your identity confirmed once and stored securely.",
                  },
                  {
                    title: "Income and affordability",
                    desc: "Bank statements reviewed and summarised so landlords understand your position.",
                  },
                  {
                    title: "Portable references",
                    desc: "Past landlord references travel with your profile.",
                  },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#1e40af]" />
                    <div>
                      <p className="text-sm font-bold text-[#0f172a]">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-sm leading-relaxed text-slate-500">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/register"
                className="inline-block rounded-full bg-[#0f172a] px-7 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                Create free profile
              </Link>
              <p className="mt-3 text-xs text-slate-400">
                Free for tenants. Always.
              </p>
            </div>

            {/* Visual: profile card */}
            <div className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-6 lg:p-8">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1e40af] text-sm font-bold text-white">
                  AC
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#0f172a]">Aisha C.</p>
                  <p className="text-xs text-slate-400">Rental profile · Verified</p>
                </div>
                <span className="ml-auto shrink-0 rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-800">
                  Ready to apply
                </span>
              </div>
              <div className="space-y-2">
                {PROFILE_ROWS.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm"
                  >
                    <p className="text-sm text-slate-600">{row.label}</p>
                    <span className="text-xs font-bold text-green-700">
                      {row.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. LANDLORD STRIP ─────────────────────────────────────────────────── */}
      <section className="bg-[#0f172a] px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-blue-400">
                For landlords
              </p>
              <h2 className="text-2xl font-extrabold text-white md:text-3xl">
                Are you a landlord?
              </h2>
              <p className="mt-3 text-base leading-relaxed text-slate-400">
                PropTrust gives landlords the tools to screen tenants, track
                rent and manage properties — without relying on a rental agent.
                From R99/month.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <Link
                href="/solutions/landlords"
                className="rounded-full border-2 border-white/30 px-6 py-3 text-center text-sm font-bold text-white transition hover:border-white/60 hover:bg-white/5"
              >
                For landlords
              </Link>
              <Link
                href="/pricing"
                className="rounded-full bg-[#3b82f6] px-6 py-3 text-center text-sm font-bold text-white transition hover:bg-blue-500"
              >
                See pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ──────────────────────────────────────────────────────── */}
      <section className="bg-[#f8fafc] px-6 py-20 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-[#0f172a] md:text-4xl">
              From landlords and tenants
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {QUOTES.map((q) => (
              <div
                key={q.name}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-8"
              >
                <p className="flex-1 text-sm italic leading-relaxed text-slate-600">
                  &ldquo;{q.quote}&rdquo;
                </p>
                <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${q.bg}`}
                  >
                    {q.initials}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#0f172a]">{q.name}</p>
                    <p className="text-xs text-slate-400">{q.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. FINAL CTA ──────────────────────────────────────────────────────── */}
      <section className="bg-[#1e40af] px-6 py-24 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="text-4xl font-extrabold text-white md:text-5xl">
            Get rental-ready today.
          </h2>
          <p className="mx-auto mt-5 text-lg leading-relaxed text-blue-100">
            Start with your area. See what matches. Apply with one profile.
          </p>
          <div className="mt-10">
            <Link
              href="/area-match"
              className="inline-block rounded-full bg-white px-10 py-4 text-base font-extrabold text-[#1e40af] shadow-lg transition hover:bg-blue-50 active:scale-95"
            >
              Find my best area
            </Link>
          </div>
          <p className="mt-5 text-sm text-blue-200">Free for tenants. Always.</p>
        </div>
      </section>

      {/* ── NEWSLETTER ────────────────────────────────────────────────────────── */}
      <NewsletterSignup />

      <MarketingFooter />
    </div>
  );
}

// ── Newsletter signup ─────────────────────────────────────────────────────────

function NewsletterSignup() {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = React.useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMessage("You are subscribed. Check your inbox for a welcome email.");
      } else {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  return (
    <section className="bg-[#0f172a] px-6 py-16">
      <div className="mx-auto max-w-xl text-center">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">
          Stay informed on the SA property market
        </h2>
        <p className="mt-3 text-slate-400">
          Get weekly insights on rental trends, price movements and area
          developments delivered to your inbox.
        </p>

        {status === "success" ? (
          <div className="mt-8 rounded-xl border border-green-500/30 bg-green-500/10 px-6 py-4">
            <p className="text-sm font-medium text-green-400">{message}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex gap-2">
            <input
              type="email"
              required
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-w-0 flex-1 rounded-xl border-0 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="shrink-0 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {status === "loading" ? "Subscribing…" : "Subscribe free"}
            </button>
          </form>
        )}

        {status === "error" && (
          <p className="mt-3 text-xs text-red-400">{message}</p>
        )}

        <p className="mt-4 text-xs text-slate-500">
          No spam. Unsubscribe anytime. South African property news only.
        </p>
      </div>
    </section>
  );
}
