"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type NavLink = { label: string; href: string; desc?: string };
type NavSection =
  | { type: "dropdown"; label: string; items: NavLink[] }
  | { type: "link"; label: string; href: string };

const NAV: NavSection[] = [
  {
    type: "dropdown",
    label: "For Tenants",
    items: [
      { label: "Find a place to live", href: "/browse", desc: "Browse verified rental properties" },
      { label: "Find my area", href: "/area-match", desc: "Match suburbs by budget, commute, and lifestyle" },
      { label: "Tenant profile", href: "/solutions/tenants", desc: "Create and manage your rental profile" },
    ],
  },
  {
    type: "dropdown",
    label: "For Landlords",
    items: [
      { label: "List my property", href: "/register?role=owner", desc: "Add your property to PropTrust" },
      { label: "Tenant screening", href: "/features#screening", desc: "Review verified tenant applications" },
      { label: "Portfolio finance", href: "/portfolio", desc: "Track yield, cash flow, and bond payments" },
    ],
  },
  { type: "link", label: "Area Match", href: "/area-match" },
  { type: "link", label: "Pricing", href: "/pricing" },
  {
    type: "dropdown",
    label: "Resources",
    items: [
      { label: "SA Rental Law Guide", href: "/resources/rental-law", desc: "Know your rights and obligations" },
      { label: "Tenant Screening Guide", href: "/resources/screening", desc: "How to screen tenants effectively" },
      { label: "FAQ", href: "/resources/faq", desc: "Common questions answered" },
      { label: "Trust and Security", href: "/trust", desc: "How we handle your data" },
      { label: "About", href: "/about", desc: "What PropTrust is and who it serves" },
      { label: "Blog", href: "/resources/blog", desc: "Property news and guides" },
    ],
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

export function NavLogo({ white = false, href = "/" }: { white?: boolean; href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
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
  const [logoHref, setLogoHref] = useState("/");
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setAuthed(true);
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_tenant, is_connector")
        .eq("id", user.id)
        .single();
      if (profile?.is_tenant) {
        setLogoHref("/tenant/dashboard");
      } else if (profile?.is_connector) {
        setLogoHref("/connector/tasks");
      } else {
        setLogoHref("/dashboard");
      }
    });
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  function closeMobile() {
    setMobileOpen(false);
  }

  return (
    <>
      <header
        className={`sticky top-0 z-50 border-b bg-white/95 backdrop-blur-sm transition-all duration-200 ${
          scrolled ? "border-[#e2e8f0] shadow-sm" : "border-transparent"
        }`}
      >
        {/* Top bar */}
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-6 lg:py-3.5">
          <NavLogo href={logoHref} />

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
          <div className="flex items-center gap-1.5 lg:gap-2">
            {authed ? (
              <Link
                href={logoHref}
                className="rounded-md bg-[#1e40af] px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-800 lg:rounded-lg lg:px-4 lg:py-2 lg:text-sm"
              >
                Open app
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="rounded-md bg-[#1e40af] px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-800 lg:rounded-lg lg:px-4 lg:py-2 lg:text-sm"
                >
                  Register
                </Link>
                <Link
                  href="/login"
                  className="rounded-md border-[1.5px] border-[#0f172a] px-2.5 py-1.5 text-xs font-semibold text-[#0f172a] transition hover:bg-slate-50 lg:rounded-lg lg:px-4 lg:py-2 lg:text-sm"
                >
                  Login
                </Link>
              </>
            )}
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="rounded-lg p-1.5 text-slate-600 transition hover:bg-slate-100 lg:hidden"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <IconClose /> : <IconMenu />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className="lg:hidden"
          style={{
            maxHeight: mobileOpen ? "100vh" : "0px",
            overflow: "hidden",
            transition: "max-height 0.3s ease-in-out",
          }}
        >
          <div className="border-t border-[#f1f5f9] bg-white">
            {/* Render each nav section */}
            {NAV.map((section) => {
              if (section.type === "link") {
                return (
                  <Link
                    key={section.label}
                    href={section.href}
                    onClick={closeMobile}
                    className="flex w-full items-center border-b border-[#f1f5f9] px-6 text-base font-medium text-slate-900 transition hover:bg-slate-50"
                    style={{ minHeight: 52 }}
                  >
                    {section.label}
                  </Link>
                );
              }

              return (
                <div key={section.label} className="border-b border-[#f1f5f9]">
                  <p className="px-6 pt-4 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                    {section.label}
                  </p>
                  {section.items.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={closeMobile}
                      className="flex flex-col px-6 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
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
              );
            })}

            {/* CTA buttons */}
            <div className="px-4 pb-8 pt-5" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {authed ? (
                <Link
                  href={logoHref}
                  onClick={closeMobile}
                  className="flex items-center justify-center rounded-xl font-bold text-white transition hover:bg-blue-800"
                  style={{ height: 48, background: "#1e40af", fontSize: 15 }}
                >
                  Open app
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    onClick={closeMobile}
                    className="flex items-center justify-center rounded-xl font-bold text-white transition hover:bg-blue-800"
                    style={{ height: 48, background: "#1e40af", fontSize: 15 }}
                  >
                    Get started
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
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={closeMobile}
        />
      )}
    </>
  );
}
