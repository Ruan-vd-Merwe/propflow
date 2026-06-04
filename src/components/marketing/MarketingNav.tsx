"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

type NavLink = { label: string; href: string; desc?: string };
type NavSection =
  | { type: "dropdown"; label: string; items: NavLink[] }
  | { type: "link"; label: string; href: string };

const NAV: NavSection[] = [
  {
    type: "dropdown",
    label: "Solutions",
    items: [
      {
        label: "For Landlords",
        href: "/solutions/landlords",
        desc: "Manage properties and tenants directly",
      },
      {
        label: "For Tenants",
        href: "/solutions/tenants",
        desc: "Build a verified rental profile",
      },
      {
        label: "For Property Managers",
        href: "/solutions/managers",
        desc: "Tools for growing portfolios",
      },
      {
        label: "Tenant Screening",
        href: "/features#screening-detail",
        desc: "Review applicants before you sign",
      },
    ],
  },
  {
    type: "dropdown",
    label: "Features",
    items: [
      { label: "All Features", href: "/features" },
      { label: "Tenant Screening", href: "/features#screening-detail" },
      { label: "Rent Tracking", href: "/features#rent-detail" },
      { label: "Maintenance", href: "/features#maintenance-detail" },
      { label: "Dashboard", href: "/features#dashboard-detail" },
      { label: "WhatsApp Alerts", href: "/features#whatsapp-detail" },
      { label: "Tenant Marketplace", href: "/features#marketplace-detail" },
      { label: "Body Corporate", href: "/features#bodycorp-detail" },
    ],
  },
  { type: "link", label: "Browse Properties", href: "/browse" },
  { type: "link", label: "Pricing", href: "/pricing" },
  {
    type: "dropdown",
    label: "Resources",
    items: [
      {
        label: "SA Rental Law Guide",
        href: "/resources/rental-law",
        desc: "Know your rights and obligations",
      },
      {
        label: "Tenant Screening Guide",
        href: "/resources/screening",
        desc: "How to review applicants properly",
      },
      {
        label: "FAQ",
        href: "/resources/faq",
        desc: "Common questions answered",
      },
      { label: "Blog", href: "/resources/blog", desc: "Coming soon" },
    ],
  },
  { type: "link", label: "Contact", href: "/contact" },
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
  // Close immediately on click so no timer fires mid-navigation
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

  // Lock body scroll when mobile menu is open
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

  function toggleSection(label: string) {
    setOpenSection((prev) => (prev === label ? null : label));
  }

  return (
    <header
      className={`sticky top-0 z-50 border-b bg-white/95 backdrop-blur-sm transition-all duration-200 ${
        scrolled ? "border-[#e2e8f0] shadow-sm" : "border-transparent"
      }`}
    >
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
        <div className="flex items-center gap-2.5">
          <Link
            href="/login"
            className="hidden rounded-lg border-[1.5px] border-[#0f172a] px-4 py-2 text-sm font-semibold text-[#0f172a] transition hover:bg-slate-50 lg:block"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-[#1e40af] px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            Get Started
          </Link>
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="ml-1 rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <IconClose /> : <IconMenu />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 top-16 z-50 flex flex-col overflow-y-auto bg-white lg:hidden">
          <div className="flex-1 px-6 py-4">
            {NAV.map((section) => (
              <div
                key={section.label}
                className="border-b border-slate-100 last:border-0"
              >
                {section.type === "link" ? (
                  <Link
                    href={section.href}
                    onClick={closeMobile}
                    className="flex w-full items-center py-4 text-base font-semibold text-slate-800"
                  >
                    {section.label}
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={() => toggleSection(section.label)}
                      className="flex w-full items-center justify-between py-4 text-base font-semibold text-slate-800"
                    >
                      {section.label}
                      <IconChevron open={openSection === section.label} />
                    </button>
                    {openSection === section.label && (
                      <div className="mb-4 space-y-1 pl-2">
                        {section.items.map((item) => (
                          <Link
                            key={item.label}
                            href={item.href}
                            onClick={closeMobile}
                            className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            {item.label}
                            {item.desc && (
                              <span className="mt-0.5 block text-xs text-slate-400">
                                {item.desc}
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 px-6 py-6">
            <div className="flex flex-col gap-3">
              <Link
                href="/login"
                onClick={closeMobile}
                className="rounded-xl border-2 border-[#0f172a] px-4 py-3 text-center text-base font-bold text-[#0f172a]"
              >
                Login
              </Link>
              <Link
                href="/register"
                onClick={closeMobile}
                className="rounded-xl bg-[#1e40af] px-4 py-3 text-center text-base font-bold text-white"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
