"use client";

import React from "react";
import Link from "next/link";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import ContactForm from "@/components/ContactForm";

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
  { label: "Free for tenants", desc: "No cost, no subscription" },
  { label: "Pay only when it helps", desc: "Once-off fees or monthly, your choice" },
  { label: "No agent commission", desc: "Direct connection only" },
  { label: "South Africa", desc: "Built for the local market" },
];

const TENANT_POINTS = [
  {
    n: "01",
    title: "Choose your area",
    desc: "Match suburbs by budget, commute, safety, and lifestyle before browsing listings.",
  },
  {
    n: "02",
    title: "Build your profile",
    desc: "Upload your documents once and reuse your rental profile for every application.",
  },
  {
    n: "03",
    title: "Apply directly",
    desc: "Contact landlords without going through an agent.",
  },
  {
    n: "04",
    title: "Track your deal",
    desc: "Track applications and keep documents in one place.",
  },
];

const SUBURB_SCORES = [
  { name: "Sea Point", score: 84, tag: "Coastal · Walkable" },
  { name: "Rondebosch", score: 76, tag: "Quiet · Good schools" },
  { name: "Gardens", score: 71, tag: "Central · Social" },
  { name: "Woodstock", score: 62, tag: "Creative · Affordable" },
];

const LANDLORD_POINTS = [
  {
    title: "Screen tenants properly",
    desc: "Review verified rental profiles including income summary, documents, and references before signing.",
  },
  {
    title: "Manage leases and documents",
    desc: "Store signed leases, inspection reports, and tenant documents organised by property.",
  },
  {
    title: "Track rent and finances",
    desc: "Log rent payments, track bond payments, levies, rates, and see monthly cash flow per property.",
  },
  {
    title: "Reduce agent dependency",
    desc: "Handle applications, leases, rent tracking, and maintenance without 8 to 10 percent monthly commission.",
  },
];

const TRUST_POINTS = [
  {
    title: "Documents stay private",
    desc: "Tenants control what they share. Landlords only see documents submitted as part of an application.",
  },
  {
    title: "POPIA-aligned approach",
    desc: "PropTrust is designed to handle personal and financial information responsibly, in line with South African privacy expectations.",
  },
  {
    title: "No unnecessary middlemen",
    desc: "Landlords and tenants connect directly. No agent handling your documents or data.",
  },
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
            Rent privately, safely.
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-slate-300 sm:text-xl">
            Property24 finds them the listing. PropTrust is where the deal
            happens — applications, screening, lease, and everything after.
            No agents. No WhatsApp threads. No lost paperwork.
          </p>

          <div className="mt-10 flex flex-col items-center gap-3">
            <Link
              href="/browse"
              className="w-full max-w-sm rounded-full bg-[#3b82f6] px-8 py-4 text-center text-base font-bold text-white shadow-lg transition hover:bg-blue-500 active:scale-95 sm:w-auto sm:min-w-[280px]"
            >
              Find a place to live
            </Link>
            <Link
              href="/register?role=owner"
              className="rounded-full border-2 border-white/25 px-7 py-3.5 text-center text-sm font-bold text-white transition hover:border-white/50 hover:bg-white/5 active:scale-95"
            >
              List my property
            </Link>
          </div>
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

      {/* ── ROLE CARDS ────────────────────────────────────────────────────────── */}
      <section className="bg-white px-6 py-14 md:py-20">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-5 sm:grid-cols-2">
            {/* Tenant */}
            <div className="flex flex-col rounded-2xl bg-[#f8fafc] p-7 ring-1 ring-slate-100">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#1e40af]">
                For Tenants
              </p>
              <h3 className="mb-3 text-xl font-extrabold text-[#0f172a]">
                Find a place to live
              </h3>
              <p className="mb-6 flex-1 text-sm leading-relaxed text-slate-500">
                Find a place to live. Apply with one trusted profile.
                Track your deal from first application to signed lease.
              </p>
              <Link
                href="/browse"
                className="inline-block rounded-full bg-[#0f172a] px-6 py-3 text-center text-sm font-bold text-white transition hover:bg-slate-800"
              >
                Browse properties
              </Link>
            </div>
            {/* Landlord */}
            <div className="flex flex-col rounded-2xl bg-[#f8fafc] p-7 ring-1 ring-slate-100">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#1e40af]">
                For Landlords
              </p>
              <h3 className="mb-3 text-xl font-extrabold text-[#0f172a]">
                List and manage your property
              </h3>
              <p className="mb-6 flex-1 text-sm leading-relaxed text-slate-500">
                List, screen, lease, and manage — without paying
                agent commission.
              </p>
              <Link
                href="/register?role=owner"
                className="inline-block rounded-full bg-[#0f172a] px-6 py-3 text-center text-sm font-bold text-white transition hover:bg-slate-800"
              >
                List my property
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. FOR TENANTS ────────────────────────────────────────────────────── */}
      <section className="bg-[#f8fafc] px-6 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#1e40af]">
              For Tenants
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight text-[#0f172a] md:text-4xl">
              Find the right place,
              <br className="hidden sm:block" />
              not just the first available listing.
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {TENANT_POINTS.map((step) => (
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

          <div className="mt-10 text-center">
            <Link
              href="/area-match"
              className="inline-block rounded-full bg-[#0f172a] px-7 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              Find my area
            </Link>
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
                Find the right area first.
              </h2>
              <p className="mb-8 text-base leading-relaxed text-slate-500">
                Most people start by searching for a property. PropTrust
                suggests starting with the suburb. Area Match helps you
                understand which areas fit your budget, commute, lifestyle, and
                priorities before you start applying.
              </p>
              <ul className="mb-8 space-y-3">
                {[
                  "Budget and rent ranges",
                  "Commute estimates",
                  "Safety signals",
                  "Amenities, transport, and green space",
                  "Lifestyle fit",
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
                Try Area Match
              </Link>
              <p className="mt-5 text-xs leading-relaxed text-slate-400">
                Area Match is a guide, not a guarantee. Scores are based on
                available data and your preferences. Always visit an area before
                committing.
              </p>
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

      {/* ── 5. FOR LANDLORDS ──────────────────────────────────────────────────── */}
      <section className="bg-[#f8fafc] px-6 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Visual: landlord summary */}
            <div className="order-2 lg:order-1">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="mb-5 text-xs font-bold uppercase tracking-widest text-slate-400">
                  Portfolio overview
                </p>
                <div className="space-y-3">
                  {[
                    { label: "Tenant screening", status: "3 applications" },
                    { label: "Rent received this month", status: "2 of 3" },
                    { label: "Open maintenance requests", status: "1 open" },
                    { label: "Documents stored", status: "12 files" },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
                    >
                      <p className="text-sm text-slate-600">{row.label}</p>
                      <span className="text-xs font-semibold text-slate-700">
                        {row.status}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-xl bg-[#0f172a] px-4 py-3 text-center">
                  <p className="text-xs font-bold text-white">
                    Free to list · Pay per tool · No agent commission
                  </p>
                </div>
              </div>
            </div>

            {/* Copy */}
            <div className="order-1 lg:order-2">
              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[#1e40af]">
                For Landlords
              </p>
              <h2 className="mb-5 text-3xl font-extrabold tracking-tight text-[#0f172a] md:text-4xl">
                Manage rentals without paying
                <br className="hidden sm:block" />
                away your margin.
              </h2>
              <div className="mb-8 space-y-5">
                {LANDLORD_POINTS.map((point) => (
                  <div key={point.title} className="flex items-start gap-4">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#1e40af]" />
                    <div>
                      <p className="text-sm font-bold text-[#0f172a]">
                        {point.title}
                      </p>
                      <p className="mt-0.5 text-sm leading-relaxed text-slate-500">
                        {point.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/register?role=owner"
                className="inline-block rounded-full bg-[#0f172a] px-7 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                List my property
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. TRUST ──────────────────────────────────────────────────────────── */}
      <section className="bg-white px-6 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Copy */}
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[#1e40af]">
                Trust and Privacy
              </p>
              <h2 className="mb-5 text-3xl font-extrabold tracking-tight text-[#0f172a] md:text-4xl">
                Built around privacy
                <br className="hidden sm:block" />
                and direct access.
              </h2>
              <div className="mb-8 space-y-6">
                {TRUST_POINTS.map((point) => (
                  <div key={point.title} className="flex items-start gap-4">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#1e40af]" />
                    <div>
                      <p className="text-sm font-bold text-[#0f172a]">
                        {point.title}
                      </p>
                      <p className="mt-0.5 text-sm leading-relaxed text-slate-500">
                        {point.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/trust"
                className="text-sm font-semibold text-[#1e40af] underline-offset-2 hover:underline"
              >
                Read our Trust and Security page
              </Link>
            </div>

            {/* Visual: trust attributes */}
            <div className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-6 lg:p-8">
              <p className="mb-6 text-xs font-bold uppercase tracking-widest text-slate-400">
                How data is handled
              </p>
              <div className="space-y-4">
                {[
                  {
                    label: "Document sharing",
                    value: "Tenant-controlled",
                    color: "text-green-700",
                  },
                  {
                    label: "Storage",
                    value: "Encrypted at rest",
                    color: "text-green-700",
                  },
                  {
                    label: "Agent access",
                    value: "None",
                    color: "text-green-700",
                  },
                  {
                    label: "POPIA approach",
                    value: "Aligned",
                    color: "text-green-700",
                  },
                  {
                    label: "Data deletion",
                    value: "On request",
                    color: "text-slate-600",
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm"
                  >
                    <p className="text-sm text-slate-600">{row.label}</p>
                    <span className={`text-xs font-bold ${row.color}`}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 14. HOW PAYMENT WORKS ────────────────────────────────────────────── */}
      <PricingSection />

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

      {/* ── CONTACT ───────────────────────────────────────────────────────────── */}
      <section className="bg-white px-6 py-20 md:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#1e40af]">
              Contact
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight text-[#0f172a] md:text-4xl">
              Get in touch
            </h2>
            <p className="mt-4 text-base text-slate-500">
              Questions about PropTrust, pricing, or partnerships? We&apos;re happy
              to help.
            </p>
          </div>

          <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
            {/* Left: quick contact options */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-6">
                <p className="mb-4 text-sm font-bold text-[#0f172a]">
                  Other ways to reach us
                </p>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Email
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      hello@proptrust.co.za
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Office hours
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      Mon–Fri · 8am – 5pm SAST
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Location
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      Cape Town, South Africa
                    </p>
                  </div>
                </div>
              </div>

              {/* WhatsApp CTA */}
              <a
                href="https://wa.me/27746020084?text=Hi%20PropTrust%2C%20I%20have%20a%20question"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-6 py-4 transition hover:bg-green-100"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.523 5.847L.057 23.882a.5.5 0 00.611.611l6.109-1.48A11.938 11.938 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.795 9.795 0 01-5.002-1.369l-.357-.213-3.705.897.913-3.618-.233-.372A9.775 9.775 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-bold text-[#0f172a]">
                    Chat on WhatsApp
                  </p>
                  <p className="text-xs text-slate-500">
                    Prefer a quick message? Start a chat.
                  </p>
                </div>
              </a>
            </div>

            {/* Right: contact form */}
            <ContactForm source="homepage" />
          </div>
        </div>
      </section>

      {/* ── 8. FINAL CTA ──────────────────────────────────────────────────────── */}
      <section className="bg-[#1e40af] px-6 py-24 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="text-4xl font-extrabold text-white md:text-5xl">
            Ready to get started?
          </h2>
          <div className="mt-10 flex flex-col items-center gap-3">
            <Link
              href="/browse"
              className="w-full max-w-sm rounded-full bg-white px-8 py-4 text-center text-base font-extrabold text-[#1e40af] shadow-lg transition hover:bg-blue-50 active:scale-95 sm:w-auto sm:min-w-[280px]"
            >
              Find a place to live
            </Link>
            <Link
              href="/register?role=owner"
              className="rounded-full border-2 border-white/40 px-7 py-3.5 text-center text-sm font-bold text-white transition hover:border-white hover:bg-white/10 active:scale-95"
            >
              List my property
            </Link>
            <Link
              href="/investment-scores"
              className="mt-1 text-sm text-blue-200/80 underline-offset-2 hover:text-blue-100 hover:underline"
            >
              Investing in property? Explore investor tools →
            </Link>
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER ────────────────────────────────────────────────────────── */}
      <NewsletterSignup />

      <MarketingFooter />
    </div>
  );
}

// ── How payment works ────────────────────────────────────────────────────────

function PricingSection() {
  const [costOpen, setCostOpen] = React.useState(false);

  return (
    <section className="bg-white px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-[#0f172a] md:text-4xl">
            How payment works
          </h2>
          <p className="mt-4 text-base text-slate-500">
            Free to start. Pay when real work gets done.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Tenant */}
          <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
            <p className="mb-5 text-xs font-bold uppercase tracking-wider text-[#1e40af]">
              Tenant
            </p>
            <div className="mb-5 flex items-center gap-2 text-sm font-medium text-slate-700">
              <span>Find Place</span>
              <span className="text-slate-300">&rarr;</span>
              <span>Apply Once</span>
              <span className="text-slate-300">&rarr;</span>
              <span>Move In</span>
            </div>
            <p className="mb-2 text-2xl font-extrabold text-[#0f172a]">Free</p>
            <p className="mb-6 flex-1 text-sm leading-relaxed text-slate-500">
              Create one rental profile and use it when you apply. No monthly
              fee.
            </p>
            <Link
              href="/register?role=tenant"
              className="block rounded-xl border-2 border-[#0f172a] py-3 text-center text-sm font-bold text-[#0f172a] transition hover:bg-slate-50"
            >
              Create profile
            </Link>
          </div>

          {/* Property Owner */}
          <div className="flex flex-col rounded-2xl border border-[#1e40af]/30 bg-[#f8fafc] p-7 shadow-sm">
            <p className="mb-5 text-xs font-bold uppercase tracking-wider text-[#1e40af]">
              Property Owner
            </p>
            <div className="mb-5 flex items-center gap-2 text-sm font-medium text-slate-700">
              <span>List Property</span>
              <span className="text-slate-300">&rarr;</span>
              <span>Choose Tenant</span>
              <span className="text-slate-300">&rarr;</span>
              <span>Manage Rental</span>
            </div>
            <div className="mb-4 space-y-1.5">
              <p className="text-sm text-slate-700">
                <span className="font-bold">Free</span> to list
              </p>
              <p className="text-sm text-slate-700">
                <span className="font-bold">Once-off fees</span> for specific
                tools
              </p>
              <p className="text-sm text-slate-700">
                <span className="font-bold">Monthly fee</span> only for ongoing
                management
              </p>
            </div>
            <p className="mb-6 flex-1 text-sm leading-relaxed text-slate-500">
              Pay for the parts you use. If PropTrust helps manage the rental
              every month, that becomes a subscription.
            </p>
            <Link
              href="/register?role=owner"
              className="block rounded-xl bg-[#1e40af] py-3 text-center text-sm font-bold text-white transition hover:bg-blue-700"
            >
              List property
            </Link>
          </div>

        </div>

        {/* Expandable: What might cost money? */}
        <div className="mt-12 text-center">
          <button
            onClick={() => setCostOpen(!costOpen)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-[#0f172a] shadow-sm transition hover:bg-slate-50"
          >
            What might cost money?
            <svg
              className={`h-4 w-4 text-slate-400 transition-transform ${costOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {costOpen && (
            <div className="mt-8 grid gap-6 text-left md:grid-cols-2">
              {/* Tenant breakdown */}
              <div className="rounded-xl bg-[#f8fafc] p-6">
                <p className="mb-4 text-sm font-bold text-[#0f172a]">Tenant</p>
                <ul className="space-y-2.5 text-sm text-slate-600">
                  {[
                    "Free profile",
                    "Free applications",
                    "Free property matching",
                    "No monthly tenant fee",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2.5">
                      <span className="text-green-600">&#10003;</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Property Owner breakdown */}
              <div className="rounded-xl bg-[#f8fafc] p-6">
                <p className="mb-4 text-sm font-bold text-[#0f172a]">
                  Property Owner
                </p>
                <ul className="space-y-2.5 text-sm text-slate-600">
                  <li className="flex items-center gap-2.5">
                    <span className="text-green-600">&#10003;</span>
                    Free property listing
                  </li>
                  {[
                    ["Tenant screening", "once-off fee"],
                    ["Digital lease", "once-off fee"],
                    ["Inspection or viewing help", "once-off fee"],
                    ["Deposit support", "once-off/admin fee"],
                    ["Rent collection", "small monthly or transaction fee"],
                  ].map(([label, cost]) => (
                    <li key={label} className="flex items-start gap-2.5">
                      <span className="mt-0.5 text-slate-300">&middot;</span>
                      <span>
                        {label}{" "}
                        <span className="text-slate-400">&mdash; {cost}</span>
                      </span>
                    </li>
                  ))}
                  <li className="flex items-start gap-2.5">
                    <span className="mt-0.5 text-[#1e40af]">&bull;</span>
                    <span>
                      Full property management{" "}
                      <span className="text-slate-400">
                        &mdash; monthly subscription
                      </span>
                    </span>
                  </li>
                </ul>
              </div>

            </div>
          )}
        </div>
      </div>
    </section>
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
