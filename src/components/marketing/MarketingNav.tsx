"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

type NavLink = { label: string; href: string; desc?: string };
type NavSection =
  | { type: "dropdown"; label: string; items: NavLink[] }
  | { type: "link"; label: string; href: string };

const NAV: NavSection[] = [
  { type: "link", label: "Browse", href: "/browse" },
  { type: "link", label: "Area Match", href: "/area-match" },
  {
    type: "dropdown",
    label: "Sell / Rent Out",
    items: [
      {
        label: "Seller Listing Assistant",
        href: "/sell/listing-assistant",
        desc: "Pricing, photos, viewings and enquiries",
      },
      {
        label: "Verified Property Pack",
        href: "/sell/property-pack",
        desc: "Build a complete disclosure package",
      },
      {
        label: "Savings Calculator",
        href: "/sell/savings-calculator",
        desc: "See how much you save vs. an agent",
      },
      {
        label: "For Landlords",
        href: "/solutions/landlords",
        desc: "Manage properties without a rental agent",
      },
    ],
  },
  {
    type: "dropdown",
    label: "Buy / Rent",
    items: [
      {
        label: "Buyer Due Diligence",
        href: "/buy/due-diligence",
        desc: "Checklists, calculators and red flags",
      },
      {
        label: "Offer-to-Purchase Guide",
        href: "/buy/offer-to-purchase",
        desc: "Prepare your OTP for your conveyancer",
      },
      {
        label: "Communication Centre",
        href: "/enquiry",
        desc: "Ask questions, request docs, submit interest",
      },
      {
        label: "For Tenants",
        href: "/solutions/tenants",
        desc: "Find a home that fits your life",
      },
    ],
  },
  {
    type: "dropdown",
    label: "Solutions",
    items: [
      {
        label: "Professionals Marketplace",
        href: "/professionals",
        desc: "Conveyancers, inspectors, valuers and more",
      },
      {
        label: "How Scoring Works",
        href: "/how-scoring-works",
        desc: "How we match properties to tenants",
      },
      {
        label: "All Features",
        href: "/features",
        desc: "Every tool in one place",
      },
    ],
  },
  { type: "link", label: "Pricing", href: "/pricing" },
];

const MOBILE_NAV_LINKS = [
  { label: "Browse Properties", href: "/browse" },
  { label: "Area Match", href: "/area-match" },
  { label: "Seller Assistant", href: "/sell/listing-assistant" },
  { label: "Buyer Due Diligence", href: "/buy/due-diligence" },
  { label: "Professionals", href: "/professionals" },
  { label: "Savings Calculator", href: "/sell/savings-calculator" },
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Contact", href: "/contact" },
];

const SOLUTIONS_ITEMS: NavLink[] = [
  {
    label: "Seller Listing Assistant",
    href: "/sell/listing-assistant",
    desc: "Pricing, photos, viewings and enquiries",
  },
  {
    label: "Buyer Due Diligence",
    href: "/buy/due-diligence",
    desc: "Checklists, calculators and red flags",
  },
  {
    label: "Professionals Marketplace",
    href: "/professionals",
    desc: "Conveyancers, inspectors, valuers and more",
  },
  {
    label: "Savings Calculator",
    href: "/sell/savings-calculator",
    desc: "See how much you save vs. an agent",
  },
  {
    label: "For Tenants",
    href: "/solutions/tenants",
    desc: "Find a home that fits your life",
  },
  {
    label: "For Landlords",
    href: "/solutions/landlords",
    desc: "Manage properties without a rental agent",
  },
];

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconChevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function IconMenu() {
  return (
    <svg
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  );
}

function IconClose() {
  return (
    <svg
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

// ── Logo ──────────────────────────────────────────────────────────────────────

export function NavLogo({ white = false }: { white?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-lg ${white ? "bg-blue-500" : "bg-[#0f172a]"}`}
      >
        <svg
          className="h-4 w-4 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      </div>
      <span
        className={`text-[17px] font-bold tracking-tight ${white ? "text-white" : "text-[#0f172a]"}`}
      >
        PropTrust
      </span>
    </Link>
  );
}

// ── Desktop dropdown ──────────────────────────────────────────────────────────

function DesktopDropdown({
  label,
  items,
}: {
  label: string;
  items: NavLink[];
}) {
  const [open, setOpen] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout>>();

  function onEnter() {
    clearTimeout(leaveTimer.current);
    setOpen(true);
  }
  function onLeave() {
    leaveTimer.current = setTimeout(() => setOpen(false), 80);
  }
  function onItemClick() {
    clearTimeout(leaveTimer.current);
    setOpen(false);
  }

  return (
    <div className="relative" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <button className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-900">
        {label}
        <IconChevron open={open} />
      </button>

      {open && (
        <div className="nav-dropdown absolute left-0 top-full z-50 mt-1 min-w-[240px] rounded-xl border border-slate-100 bg-white shadow-xl">
          {items.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={onItemClick}
              className="flex flex-col px-4 py-3 transition hover:bg-slate-50 first:rounded-t-xl last:rounded-b-xl"
            >
              <span className="text-sm font-semibold text-slate-900">
                {item.label}
              </span>
              {item.desc && (
                <span className="mt-0.5 text-xs text-slate-400">
                  {item.desc}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}

      <style>{`
        .nav-dropdown {
          animation: navDrop .14s ease-out both;
        }
        @keyframes navDrop {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ── Main nav ──────────────────────────────────────────────────────────────────

export default function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  function closeMobile() {
    setMobileOpen(false);
    setOpenSection(null);
  }

  return (
    <>
      <header
        className={`sticky top-0 z-50 border-b bg-white/95 backdrop-blur-sm transition-all duration-200 ${
          scrolled ? "border-[#e2e8f0] shadow-sm" : "border-transparent"
        }`}
      >
        {/* Top bar */}
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <NavLogo />

          {/* Desktop nav */}
          <nav className="hidden items-center gap-0.5 lg:flex">
            {NAV.map((section) =>
              section.type === "link" ? (
                <Link
                  key={section.label}
                  href={section.href}
                  className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
                >
                  {section.label}
                </Link>
              ) : (
                <DesktopDropdown
                  key={section.label}
                  label={section.label}
                  items={section.items}
                />
              ),
            )}
          </nav>

          {/* Right buttons */}
          <div className="flex items-center gap-2">
            {/* Login — always visible; compact on mobile */}
            <Link
              href="/login"
              className="rounded-lg border-[1.5px] border-[#0f172a] px-3 py-1.5 text-sm font-semibold text-[#0f172a] transition hover:bg-slate-50 lg:px-4 lg:py-2"
            >
              Login
            </Link>
            {/* Find my area — desktop only */}
            <Link
              href="/area-match"
              className="hidden rounded-lg bg-[#1e40af] px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 lg:block"
            >
              Find my area
            </Link>
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <IconClose /> : <IconMenu />}
            </button>
          </div>
        </div>

        {/* Mobile menu — always in DOM, animated via inline max-height */}
        <div
          className="lg:hidden"
          style={{
            maxHeight: mobileOpen ? "100vh" : "0px",
            overflow: "hidden",
            transition: "max-height 0.3s ease-in-out",
          }}
        >
          <div className="border-t border-[#f1f5f9] bg-white">
            {/* Solutions expandable row */}
            <div className="border-b border-[#f1f5f9]">
              <button
                onClick={() =>
                  setOpenSection((p) => (p === "Solutions" ? null : "Solutions"))
                }
                className="flex w-full items-center justify-between px-6 text-base font-medium text-slate-900 transition hover:bg-slate-50"
                style={{ minHeight: 52 }}
              >
                Solutions
                <IconChevron open={openSection === "Solutions"} />
              </button>
              {openSection === "Solutions" && (
                <div className="bg-slate-50 pb-2 pt-1">
                  {SOLUTIONS_ITEMS.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={closeMobile}
                      className="flex flex-col px-8 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      {item.label}
                      {item.desc && (
                        <span className="mt-0.5 text-xs text-slate-400">
                          {item.desc}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Flat nav links */}
            {MOBILE_NAV_LINKS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={closeMobile}
                className="flex w-full items-center border-b border-[#f1f5f9] px-6 text-base font-medium text-slate-900 transition hover:bg-slate-50"
                style={{ minHeight: 52 }}
              >
                {item.label}
              </Link>
            ))}

            {/* CTA buttons */}
            <div className="px-4 pb-8 pt-5" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Link
                href="/register"
                onClick={closeMobile}
                className="flex items-center justify-center rounded-xl font-bold text-white transition hover:bg-blue-800"
                style={{ height: 48, background: "#1e40af", fontSize: 15 }}
              >
                Get Started
              </Link>
              <Link
                href="/login"
                onClick={closeMobile}
                className="flex items-center justify-center rounded-xl font-bold transition hover:bg-slate-50"
                style={{
                  height: 48,
                  border: "2px solid #0f172a",
                  color: "#0f172a",
                  fontSize: 15,
                }}
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Backdrop — closes menu when tapping outside */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={closeMobile}
        />
      )}
    </>
  );
}
