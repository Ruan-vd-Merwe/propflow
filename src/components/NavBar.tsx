"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type UserRoles = { is_landlord: boolean; is_tenant: boolean; is_connector: boolean };

// ─── Icons ───────────────────────────────────────────────────────────────────

function IconHouse({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}


function IconPeople({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function IconDocument({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function IconChat({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function IconSearch({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function IconShoppingBag({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );
}

function IconBuilding({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

function IconWrench({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconShield({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}



function IconSignOut({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

function IconCog({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

// ─── Link data ────────────────────────────────────────────────────────────────

type NavLink = { href: string; label: string };
type MoreLink = NavLink & { Icon: React.FC<{ className?: string }> };

// Primary links shown in the desktop top bar (max 4)
const PRIMARY_LANDLORD: NavLink[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/tenants/browse", label: "Find Tenants" },
  { href: "/applications", label: "Applications" },
];

const PRIMARY_TENANT: NavLink[] = [
  { href: "/tenant/dashboard",    label: "Dashboard"       },
  { href: "/tenant/browse",       label: "Find Properties" },
  { href: "/tenant/applications", label: "Applications"    },
  { href: "/tenant/profile",      label: "My Profile"      },
  { href: "/contact",             label: "Contact"         },
];

const PRIMARY_CONNECTOR: NavLink[] = [
  { href: "/connector/tasks",       label: "My Tasks"    },
  { href: "/connector/inspections", label: "Inspections" },
  { href: "/connector/earnings",    label: "Earnings"    },
];

// "More" dropdown — Property Management section (landlord-only)
const MORE_PROPERTY_MGMT: MoreLink[] = [
  { href: "/documents",        label: "Documents",      Icon: IconDocument },
  { href: "/leases",           label: "Leases",         Icon: IconShield   },
  { href: "/queries",          label: "Queries",        Icon: IconChat     },
  { href: "/maintenance-jobs", label: "Maintenance",    Icon: IconWrench   },
  { href: "/body-corporate",   label: "Body Corporate", Icon: IconBuilding },
];

// "More" dropdown — Tenant rental search (items already in PRIMARY_TENANT excluded)
const MORE_TENANT_SEARCH: MoreLink[] = [
  { href: "/tenant/preferences", label: "My Rental Search", Icon: IconWrench },
  { href: "/tenant/areas",       label: "Find by Area",     Icon: IconHouse  },
];

// "More" dropdown — Connector tasks
const MORE_CONNECTOR_TASKS: MoreLink[] = [
  { href: "/connector/tasks",       label: "My Tasks",    Icon: IconShoppingBag },
  { href: "/connector/inspections", label: "Inspections", Icon: IconSearch      },
  { href: "/connector/earnings",    label: "Earnings",    Icon: IconDocument    },
  { href: "/connector/profile",     label: "My Profile",  Icon: IconPeople     },
];

// "More" dropdown — Account (shared)
const MORE_ACCOUNT: MoreLink[] = [
  { href: "/services",   label: "Services",   Icon: IconShoppingBag },
  { href: "/neighbour",  label: "Neighbour",  Icon: IconPeople      },
  { href: "/settings",   label: "Settings",   Icon: IconCog         },
];

// Pick primary links based on the page the user is currently on.
// Multi-role users see the nav that matches their current surface.
function getPrimaryLinks(roles: UserRoles, pathname: string): NavLink[] {
  if (pathname.startsWith("/connector") && roles.is_connector) return PRIMARY_CONNECTOR;
  if (pathname.startsWith("/tenant") && roles.is_tenant) return PRIMARY_TENANT;
  if (roles.is_landlord) return PRIMARY_LANDLORD;
  if (roles.is_connector) return PRIMARY_CONNECTOR;
  if (roles.is_tenant) return PRIMARY_TENANT;
  return PRIMARY_LANDLORD;
}

// Home route — matches the current surface for multi-role users
function getHomeHref(roles: UserRoles, pathname: string): string {
  if (pathname.startsWith("/connector") && roles.is_connector) return "/connector/tasks";
  if (pathname.startsWith("/tenant") && roles.is_tenant) return "/tenant/dashboard";
  if (roles.is_landlord) return "/dashboard";
  if (roles.is_connector) return "/connector/tasks";
  if (roles.is_tenant) return "/tenant/dashboard";
  return "/dashboard";
}

// All links that live inside the "More" dropdown (for active-state detection)
const MORE_HREFS = new Set([
  ...MORE_PROPERTY_MGMT.map((l) => l.href),
  ...MORE_TENANT_SEARCH.map((l) => l.href),
  ...MORE_CONNECTOR_TASKS.map((l) => l.href),
  ...MORE_ACCOUNT.map((l) => l.href),
]);

// ─── Surface switcher ───────────────────────────────────────────────────────
// Role flags (is_landlord, is_tenant, is_connector) determine which surfaces
// a user may access. The active surface is derived from the current pathname
// and controls which pill is highlighted. Clicking a pill navigates to that
// surface's home route.

type Surface = "landlord" | "tenant" | "connector";

const SURFACE_LINKS: { surface: Surface; label: string; href: string; roleKey: keyof UserRoles }[] = [
  { surface: "landlord",  label: "My Properties", href: "/dashboard",       roleKey: "is_landlord"  },
  { surface: "tenant",    label: "My Rentals",    href: "/tenant/dashboard", roleKey: "is_tenant"   },
  { surface: "connector", label: "My Connector",  href: "/connector/tasks", roleKey: "is_connector" },
];

function getActiveSurface(pathname: string): Surface {
  if (pathname.startsWith("/connector")) return "connector";
  if (pathname.startsWith("/tenant")) return "tenant";
  return "landlord";
}

// ─── NavBar ──────────────────────────────────────────────────────────────────

export function NavBar() {
  const router    = useRouter();
  const pathname  = usePathname();
  const supabase  = createClient();

  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [roles, setRoles] = useState<UserRoles>({
    is_landlord: !pathname.startsWith("/connector") && !pathname.startsWith("/tenant"),
    is_tenant: pathname.startsWith("/tenant"),
    is_connector: pathname.startsWith("/connector"),
  });

  const navRef         = useRef<HTMLElement>(null);
  const moreRef        = useRef<HTMLDivElement>(null);
  const menuOverlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("profiles")
        .select("is_landlord, is_tenant, is_connector")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data) setRoles(data as UserRoles);
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  // Lock body scroll while mobile menu is open
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  // Close mobile menu on outside pointer-down (only when target is outside nav + overlay)
  useEffect(() => {
    if (!menuOpen) return;
    function onOutside(e: PointerEvent) {
      const target = e.target as Node;
      if (
        navRef.current?.contains(target) ||
        menuOverlayRef.current?.contains(target)
      ) {
        return;
      }
      setMenuOpen(false);
    }
    document.addEventListener("pointerdown", onOutside);
    return () => {
      document.removeEventListener("pointerdown", onOutside);
    };
  }, [menuOpen]);

  // Close "More" dropdown on outside click
  useEffect(() => {
    if (!moreOpen) return;
    function onOutside(e: MouseEvent | TouchEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("touchstart", onOutside);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("touchstart", onOutside);
    };
  }, [moreOpen]);

  // Escape key closes More dropdown
  useEffect(() => {
    if (!moreOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMoreOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [moreOpen]);

  async function handleSignOut() {
    setMenuOpen(false);
    setMoreOpen(false);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  // Highlight "More" button if any sub-link is active
  const moreIsActive = Array.from(MORE_HREFS).some((href) => isActive(href));

  // Primary links depending on role + current page context
  const primaryLinks = getPrimaryLinks(roles, pathname);
  const homeHref = getHomeHref(roles, pathname);

  // Surface switcher — only shown when user has 2+ roles
  const activeSurface = getActiveSurface(pathname);
  const availableSurfaces = SURFACE_LINKS.filter((s) => roles[s.roleKey]);
  const showSwitcher = availableSurfaces.length >= 2;

  return (
    <nav ref={navRef} className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-3.5">

        {/* Logo */}
        <Link
          href={homeHref}
          className="flex shrink-0 items-center gap-2"
          onClick={() => { setMenuOpen(false); setMoreOpen(false); }}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">PropTrust</span>
        </Link>

        {/* ── Desktop nav ──────────────────────────────────────────────── */}
        <div className="hidden items-center gap-0.5 sm:flex">

          {/* Primary links */}
          {primaryLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                isActive(href)
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {label}
            </Link>
          ))}

          {/* "More" dropdown */}
          <div ref={moreRef} className="relative ml-0.5">
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                moreIsActive || moreOpen
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              More
              <IconChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-150 ${moreOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Dropdown panel */}
            {moreOpen && (
              <div className="absolute right-0 top-full z-50 mt-1.5 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                {/* Property Management — landlord only */}
                {roles.is_landlord && (
                  <DropdownSection label="Property Management">
                    {MORE_PROPERTY_MGMT.map(({ href, label, Icon }) => (
                      <DropdownLink
                        key={href}
                        href={href}
                        label={label}
                        Icon={Icon}
                        active={isActive(href)}
                        onClose={() => setMoreOpen(false)}
                      />
                    ))}
                  </DropdownSection>
                )}

                {/* Rental Search — tenant or dual-role */}
                {roles.is_tenant && (
                  <DropdownSection label="Rental Search">
                    {MORE_TENANT_SEARCH.map(({ href, label, Icon }) => (
                      <DropdownLink
                        key={href}
                        href={href}
                        label={label}
                        Icon={Icon}
                        active={isActive(href)}
                        onClose={() => setMoreOpen(false)}
                      />
                    ))}
                  </DropdownSection>
                )}

                {/* Connector — connector or multi-role */}
                {roles.is_connector && (
                  <DropdownSection label="Connector">
                    {MORE_CONNECTOR_TASKS.map(({ href, label, Icon }) => (
                      <DropdownLink
                        key={href}
                        href={href}
                        label={label}
                        Icon={Icon}
                        active={isActive(href)}
                        onClose={() => setMoreOpen(false)}
                      />
                    ))}
                  </DropdownSection>
                )}

                {/* Account */}
                <DropdownSection label="Account">
                  {MORE_ACCOUNT.map(({ href, label, Icon }) => (
                    <DropdownLink
                      key={href}
                      href={href}
                      label={label}
                      Icon={Icon}
                      active={isActive(href)}
                      onClose={() => setMoreOpen(false)}
                    />
                  ))}
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 transition hover:bg-red-50 hover:text-red-700"
                  >
                    <IconSignOut className="h-4 w-4 shrink-0 text-red-500" />
                    Sign out
                  </button>
                </DropdownSection>
              </div>
            )}
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleSignOut}
            className="hidden rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 sm:block"
          >
            Sign out
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 sm:hidden"
          >
            {menuOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── Surface switcher (desktop) — multi-role users only ────────── */}
      {showSwitcher && (
        <div className="hidden border-t border-slate-100 sm:block">
          <div className="mx-auto flex max-w-6xl gap-1 px-4 py-1.5 sm:px-6">
            {availableSurfaces.map(({ surface, label, href }) => (
              <Link
                key={surface}
                href={href}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  activeSurface === surface
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Mobile overlay — fixed so it never pushes page content ─────── */}
      {menuOpen && (
        <div
          ref={menuOverlayRef}
          className="fixed bottom-0 left-0 right-0 top-[61px] z-40 overflow-y-auto overscroll-contain border-t border-slate-100 bg-white pb-24 sm:hidden"
        >
          <ul className="divide-y divide-slate-100">
            {/* Surface switcher (mobile) */}
            {showSwitcher && (
              <li className="flex gap-1.5 px-6 py-3">
                {availableSurfaces.map(({ surface, label, href }) => (
                  <Link
                    key={surface}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      activeSurface === surface
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </li>
            )}

            {/* Primary links */}
            {primaryLinks.map(({ href, label }) => {
              const active = isActive(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex min-h-[48px] items-center px-6 py-3 text-sm font-medium transition ${
                      active ? "bg-slate-50 text-slate-900" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {label}
                    {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-slate-900" />}
                  </Link>
                </li>
              );
            })}

            {/* Property Management — landlord only */}
            {roles.is_landlord && (
              <>
                <li className="bg-slate-50 px-6 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Property Management
                  </p>
                </li>
                {MORE_PROPERTY_MGMT.map(({ href, label, Icon }) => {
                  const active = isActive(href);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={() => setMenuOpen(false)}
                        className={`flex min-h-[48px] items-center gap-4 px-6 py-3 text-sm font-medium transition ${
                          active ? "bg-slate-50 text-slate-900" : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <Icon className={`h-5 w-5 shrink-0 ${active ? "text-slate-900" : "text-slate-400"}`} />
                        <span>{label}</span>
                        {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-slate-900" />}
                      </Link>
                    </li>
                  );
                })}
              </>
            )}

            {/* Rental Search — tenant only */}
            {roles.is_tenant && (
              <>
                <li className="bg-blue-50 px-6 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                    Rental Search
                  </p>
                </li>
                {MORE_TENANT_SEARCH.map(({ href, label, Icon }) => {
                  const active = isActive(href);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={() => setMenuOpen(false)}
                        className={`flex min-h-[48px] items-center gap-4 px-6 py-3 text-sm font-medium transition ${
                          active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                        }`}
                      >
                        <Icon className={`h-5 w-5 shrink-0 ${active ? "text-blue-600" : "text-slate-400"}`} />
                        <span>{label}</span>
                      </Link>
                    </li>
                  );
                })}
              </>
            )}

            {/* Connector tasks — connector only */}
            {roles.is_connector && (
              <>
                <li className="bg-amber-50 px-6 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-500">
                    Connector
                  </p>
                </li>
                {MORE_CONNECTOR_TASKS.map(({ href, label, Icon }) => {
                  const active = isActive(href);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={() => setMenuOpen(false)}
                        className={`flex min-h-[48px] items-center gap-4 px-6 py-3 text-sm font-medium transition ${
                          active ? "bg-amber-50 text-amber-700" : "text-slate-600 hover:bg-amber-50 hover:text-amber-700"
                        }`}
                      >
                        <Icon className={`h-5 w-5 shrink-0 ${active ? "text-amber-600" : "text-slate-400"}`} />
                        <span>{label}</span>
                      </Link>
                    </li>
                  );
                })}
              </>
            )}

            {/* Account section */}
            <li className="bg-slate-50 px-6 py-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Account</p>
            </li>
            {MORE_ACCOUNT.map(({ href, label, Icon }) => {
              const active = isActive(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex min-h-[48px] items-center gap-4 px-6 py-3 text-sm font-medium transition ${
                      active ? "bg-slate-50 text-slate-900" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className={`h-5 w-5 shrink-0 ${active ? "text-slate-900" : "text-slate-400"}`} />
                    <span>{label}</span>
                  </Link>
                </li>
              );
            })}

            {/* Sign out */}
            <li>
              <button
                onClick={handleSignOut}
                className="flex min-h-[48px] w-full items-center gap-4 px-6 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                <IconSignOut className="h-5 w-5 shrink-0 text-red-500" />
                <span>Sign out</span>
              </button>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}

// ─── Dropdown helpers ─────────────────────────────────────────────────────────

function DropdownSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="border-t border-slate-100 px-4 pb-1 pt-2 first:border-t-0 first:pt-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </p>
      </div>
      {children}
    </div>
  );
}

function DropdownLink({
  href,
  label,
  Icon,
  active,
  onClose,
}: {
  href: string;
  label: string;
  Icon: React.FC<{ className?: string }>;
  active: boolean;
  onClose: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className={`flex items-center gap-3 px-4 py-2 text-sm transition ${
        active
          ? "bg-slate-50 font-medium text-slate-900"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      <Icon className={`h-4 w-4 shrink-0 ${active ? "text-slate-700" : "text-slate-400"}`} />
      {label}
    </Link>
  );
}
