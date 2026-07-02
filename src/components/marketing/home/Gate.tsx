"use client";

import { useEffect } from "react";
import { chooseFlow } from "./flow";

const TENANT_PAINS = [
  "Three weeks of refreshing.",
  "Messages that never get answered.",
  "Your payslips in a stranger's inbox, again.",
  "The perfect place, gone before you could view it.",
];

const LANDLORD_PAINS = [
  "47 messages by lunch. Three with documents.",
  "Weekends lost to viewings that never happen.",
  "No way to tell who is real.",
  "And the agent wants a month's rent.",
];

export function Gate() {
  // JS present: opt the page into the click-to-reveal split. This is a
  // separate switch from HomeReveal's `.js` class (which HomeReveal skips
  // under prefers-reduced-motion for its fade-in animations). Hiding the
  // unchosen flow is a state change, not motion, so it applies regardless
  // of the user's motion preference.
  useEffect(() => {
    document.documentElement.classList.add("gate-js");
  }, []);

  return (
    <section id="gate" className="flex min-h-[90vh] flex-col">
      {/* Brand mark, top left */}
      <div className="bg-[#F7F7F5] px-6 pt-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#111B29]">
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
          <span className="text-[17px] font-bold tracking-tight text-[#111B29]">
            PropTrust
          </span>
        </div>
        <h1 className="sr-only">Rent privately, safely.</h1>
      </div>

      <div className="flex flex-1 flex-col md:flex-row">
        {/* Tenant side */}
        <div className="relative flex flex-1 flex-col justify-center bg-[#F7F7F5] px-6 py-16 md:px-12 lg:px-16">
          <div className="mx-auto w-full max-w-md">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[#2563EB]">
              I am looking for a place
            </p>
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-[#111B29] md:text-4xl">
              Tired of the silence?
            </h2>
            <div className="mt-7 space-y-2.5">
              {TENANT_PAINS.map((line) => (
                <p key={line} className="text-base leading-snug text-slate-500">
                  {line}
                </p>
              ))}
            </div>
            <button
              type="button"
              onClick={() => chooseFlow("tenant")}
              className="mt-9 min-h-[44px] w-full rounded-full bg-[#2563EB] px-8 py-3.5 text-center text-base font-bold text-white shadow-lg transition hover:bg-blue-600 active:scale-95 sm:w-auto"
            >
              This is me
            </button>
          </div>

          {/* Hinge emblem: straddles the seam between the two halves.
              Anchored to this panel's own edge (its right edge on desktop,
              its bottom edge on mobile) rather than the row's midpoint, so
              it lands exactly on the seam regardless of each side's actual
              content height. Decorative only: pointer-events-none keeps it
              out of the way of both "This is me" buttons. */}
          <div
            className="pointer-events-none absolute left-1/2 top-full z-20 flex -translate-x-1/2 -translate-y-[26px] flex-col items-center gap-2 md:left-full md:top-1/2 md:-translate-y-[32px]"
          >
            <div
              aria-hidden="true"
              className="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-[#E7E6E2] bg-white shadow-[0_8px_24px_rgba(17,27,41,0.12)] md:h-16 md:w-16"
            >
              <svg
                className="h-6 w-6 text-[#111B29]"
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
            <span className="whitespace-nowrap rounded-full bg-white px-3 py-1 text-[13px] font-semibold uppercase tracking-[.06em] text-[#111B29] shadow-sm">
              Two sides. One deal.
            </span>
          </div>
        </div>

        {/* Landlord side */}
        <div className="flex flex-1 flex-col justify-center bg-[#111B29] px-6 py-16 md:px-12 lg:px-16">
          <div className="mx-auto w-full max-w-md">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[#3b82f6]">
              I have a place to let
            </p>
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-white md:text-4xl">
              Drowning in enquiries?
            </h2>
            <div className="mt-7 space-y-2.5">
              {LANDLORD_PAINS.map((line) => (
                <p key={line} className="text-base leading-snug text-slate-400">
                  {line}
                </p>
              ))}
            </div>
            <button
              type="button"
              onClick={() => chooseFlow("landlord")}
              className="mt-9 min-h-[44px] w-full rounded-full bg-white px-8 py-3.5 text-center text-base font-bold text-[#111B29] shadow-lg transition hover:bg-slate-100 active:scale-95 sm:w-auto"
            >
              This is me
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
