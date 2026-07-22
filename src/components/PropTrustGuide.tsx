"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type GuideRole = "tenant" | "landlord";
type GuideVariant = "contextual" | "compact" | "menu";

type GuideOption = {
  title: string;
  description: string;
  href: string;
  icon:
    | "home"
    | "search"
    | "profile"
    | "document"
    | "people"
    | "payments"
    | "maintenance"
    | "portfolio";
};

type PropTrustGuideProps = {
  role: GuideRole;
  variant?: GuideVariant;
  hasActiveLease?: boolean;
  firstPropertyId?: string;
  heading?: string;
  description?: string;
};

function GuideIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.75 3.75h4.5m-7.5 3h10.5a1.5 1.5 0 011.5 1.5v9a1.5 1.5 0 01-1.5 1.5H6.75a1.5 1.5 0 01-1.5-1.5v-9a1.5 1.5 0 011.5-1.5z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 11.25l2 2 4-4M9 16.25h6"
      />
    </svg>
  );
}

function OptionIcon({ name }: { name: GuideOption["icon"] }) {
  const paths: Record<GuideOption["icon"], React.ReactNode> = {
    home: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 11.5L12 4l9 7.5M5.5 10v9h13v-9M9.5 19v-5h5v5"
      />
    ),
    search: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.5 15.5L20 20m-2.5-9a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
      />
    ),
    profile: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 7.5a3 3 0 11-6 0 3 3 0 016 0zM5.5 20a6.5 6.5 0 0113 0"
      />
    ),
    document: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 3.5h7l4 4V20H7V3.5zM14 3.5V8h4M10 12h5m-5 3h5"
      />
    ),
    people: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19a5 5 0 00-10 0m5-8a3 3 0 100-6 3 3 0 000 6zm7 1a2.5 2.5 0 012.5 2.5V19m-4-13a2.5 2.5 0 010 5"
      />
    ),
    payments: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 7h16v11H4V7zm0 4h16m-5 4h2"
      />
    ),
    maintenance: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.5 6.5a4 4 0 01-5 5L4 17l3 3 5.5-5.5a4 4 0 005-5l-2.5 2.5-3-3 2.5-2.5z"
      />
    ),
    portfolio: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 20V9l8-5 8 5v11M8 20v-6h8v6M9 9h.01M12 9h.01M15 9h.01"
      />
    ),
  };

  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

function getOptions(
  role: GuideRole,
  hasActiveLease: boolean,
  firstPropertyId?: string,
): GuideOption[] {
  if (role === "tenant") {
    return [
      ...(hasActiveLease
        ? [
            {
              title: "Manage my current rental",
              description: "Review your lease details and rental admin.",
              href: "/tenant/lease",
              icon: "home" as const,
            },
          ]
        : []),
      {
        title: "Find a place to rent",
        description: "Browse available properties in PropTrust.",
        href: "/tenant/browse",
        icon: "search",
      },
      ...(hasActiveLease
        ? [
            {
              title: "Replace a flatmate",
              description: "Create a listing and review applicants.",
              href: "/tenant/flatmate",
              icon: "people" as const,
            },
          ]
        : []),
      {
        title: "Complete my rental profile",
        description:
          "Improve your rental readiness and application confidence.",
        href: "/tenant/profile",
        icon: "profile",
      },
      {
        title: hasActiveLease ? "Review my lease" : "Upload or review a lease",
        description:
          "Keep lease details together or review a lease before signing.",
        href: "/tenant/lease",
        icon: "document",
      },
    ];
  }

  return [
    {
      title: firstPropertyId ? "Add another property" : "Add my first property",
      description: "Set up a property in your PropTrust portfolio.",
      href: "/properties/new",
      icon: "home",
    },
    ...(firstPropertyId
      ? [
          {
            title: "Add an existing tenant",
            description: "Open a property and add the current tenant.",
            href: `/properties/${firstPropertyId}`,
            icon: "people" as const,
          },
        ]
      : []),
    {
      title: "Find a tenant",
      description: "Browse tenant profiles for your property.",
      href: "/tenants/browse",
      icon: "search",
    },
    ...(firstPropertyId
      ? [
          {
            title: "Track rent or payments",
            description: "Review rent tracking and payment activity.",
            href: "/dashboard#rent-tracking",
            icon: "payments" as const,
          },
          {
            title: "Manage a maintenance issue",
            description: "Open maintenance jobs for your properties.",
            href: "/maintenance-jobs",
            icon: "maintenance" as const,
          },
        ]
      : [
          {
            title: "Manage my property portfolio",
            description: "Review properties and portfolio setup.",
            href: "/portfolio",
            icon: "portfolio" as const,
          },
        ]),
    {
      title: "Upload or review a lease",
      description: "Create, review, and manage lease records.",
      href: "/leases",
      icon: "document",
    },
  ];
}

export function PropTrustGuide({
  role,
  variant = "compact",
  hasActiveLease = false,
  firstPropertyId,
  heading = "Not sure where to start?",
  description = "Tell us what you’re trying to do and we’ll point you in the right direction.",
}: PropTrustGuideProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const options = useMemo(
    () => getOptions(role, hasActiveLease, firstPropertyId),
    [role, hasActiveLease, firstPropertyId],
  );

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const triggerElement = triggerRef.current;
    document.body.style.overflow = "hidden";
    const firstChoice =
      dialogRef.current?.querySelector<HTMLElement>("a[href]");
    firstChoice?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      triggerElement?.focus();
    };
  }, [open]);

  const trigger =
    variant === "contextual" ? (
      <section
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-5 sm:p-5"
        aria-label="PropTrust Guide"
      >
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1e40af]">
            <GuideIcon />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {heading}
            </h2>
            <p className="mt-1 text-sm leading-5 text-slate-500">
              {description}
            </p>
          </div>
        </div>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className="mt-4 inline-flex min-h-[44px] w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-[#1e40af] px-4 py-2 text-sm font-semibold text-[#1e40af] hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-[#1e40af] focus:ring-offset-2 sm:mt-0 sm:w-auto"
        >
          Find my next step
        </button>
      </section>
    ) : (
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className={
          variant === "menu"
            ? "flex min-h-[48px] w-full items-center gap-4 px-6 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            : "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1e40af] focus:ring-offset-2"
        }
      >
        <GuideIcon
          className={
            variant === "menu"
              ? "h-5 w-5 shrink-0 text-slate-400"
              : "h-[18px] w-[18px]"
          }
        />
        Need guidance?
      </button>
    );

  return (
    <>
      {trigger}
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="proptrust-guide-title"
            aria-describedby="proptrust-guide-description"
            className="max-h-[min(82vh,680px)] w-full overflow-y-auto rounded-t-2xl bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 shadow-xl sm:max-w-lg sm:rounded-2xl sm:p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#1e40af]">
                  PropTrust Guide
                </p>
                <h2
                  id="proptrust-guide-title"
                  className="mt-1 text-xl font-bold text-slate-900"
                >
                  What are you trying to do?
                </h2>
                <p
                  id="proptrust-guide-description"
                  className="mt-1 text-sm text-slate-500"
                >
                  Choose the option that best describes what you need.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close PropTrust Guide"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <div className="mt-5 space-y-2">
              {options.map((option) => (
                <Link
                  key={`${option.title}-${option.href}`}
                  href={option.href}
                  onClick={() => setOpen(false)}
                  className="group flex min-h-[60px] items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-left hover:border-blue-200 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-[#1e40af] focus:ring-offset-1"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 group-hover:bg-white group-hover:text-[#1e40af]">
                    <OptionIcon name={option.icon} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-slate-900">
                      {option.title}
                    </span>
                    <span className="mt-0.5 block text-xs leading-4 text-slate-500">
                      {option.description}
                    </span>
                  </span>
                  <svg
                    className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-[#1e40af]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
