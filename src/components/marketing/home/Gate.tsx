"use client";

import { useEffect, useState } from "react";
import { chooseFlow, type Flow } from "./flow";

const TENANT_LINES = [
  "An agent between every question.",
  "A leak that takes three phone calls to fix.",
  "Fifty people competing for the same place.",
  "Rent, deposit, refund, tracked by no one.",
];

const LANDLORD_PAINS = [
  "47 messages by lunch. Three with documents.",
  "Weekends lost to viewings that never happen.",
  "No way to tell who is real.",
  "And the agent wants a month's rent.",
];

const HERO_COPY: Record<
  Flow,
  { eyebrow: string; headline: string; lines: string[]; cta: string }
> = {
  tenant: {
    eyebrow: "I am looking for a place",
    headline: "Your payslip. Everyone's inbox.",
    lines: TENANT_LINES,
    cta: "This is me",
  },
  landlord: {
    eyebrow: "I have a place to let",
    headline: "Drowning in enquiries?",
    lines: LANDLORD_PAINS,
    cta: "This is me",
  },
};

const TOGGLE_LABEL: Record<Flow, string> = {
  tenant: "Looking",
  landlord: "Listing",
};

function otherFlow(flow: Flow): Flow {
  return flow === "tenant" ? "landlord" : "tenant";
}

export function Gate() {
  const [mode, setMode] = useState<Flow>("tenant");

  // JS present: opt the page into the click-to-reveal split. This is a
  // separate switch from HomeReveal's `.js` class (which HomeReveal skips
  // under prefers-reduced-motion for its fade-in animations). Hiding the
  // unchosen flow is a state change, not motion, so it applies regardless
  // of the user's motion preference.
  useEffect(() => {
    document.documentElement.classList.add("gate-js");
  }, []);

  const isLandlord = mode === "landlord";
  const copy = HERO_COPY[mode];
  const other = otherFlow(mode);
  const otherCopy = HERO_COPY[other];

  return (
    <section
      id="gate"
      className={isLandlord ? "bg-[#111B29]" : "bg-[#F7F7F5]"}
    >
      <div className="px-6 pt-6">
        <h1 className="sr-only">Rent privately, safely.</h1>

        {/* Looking / Listing segmented toggle */}
        <div
          role="group"
          aria-label="Choose whether you are looking for a place or listing one"
          className={`mt-6 inline-flex rounded-full border p-1 ${
            isLandlord
              ? "border-white/20 bg-white/10"
              : "border-slate-200 bg-white"
          }`}
        >
          {(["tenant", "landlord"] as Flow[]).map((flow) => {
            const active = flow === mode;
            return (
              <button
                key={flow}
                type="button"
                aria-pressed={active}
                onClick={() => setMode(flow)}
                className={`min-h-[44px] rounded-full px-6 text-sm font-bold transition ${
                  active
                    ? isLandlord
                      ? "bg-white text-[#111B29]"
                      : "bg-[#111B29] text-white"
                    : isLandlord
                      ? "text-slate-300"
                      : "text-slate-500"
                }`}
              >
                {TOGGLE_LABEL[flow]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hero content */}
      <div className="flex min-h-[60vh] flex-col justify-center px-6 py-16 md:min-h-0 md:px-12 md:py-12 lg:px-16">
        <div className="mx-auto w-full max-w-md md:max-w-3xl">
          <p
            className={`mb-4 text-xs font-bold uppercase tracking-widest ${
              isLandlord ? "text-[#3b82f6]" : "text-[#2563EB]"
            }`}
          >
            {copy.eyebrow}
          </p>
          <div className="relative">
            <h2
              className={`text-3xl font-extrabold leading-tight tracking-tight md:text-5xl lg:text-8xl ${
                isLandlord ? "text-white" : "text-[#111B29]"
              }`}
            >
              {copy.headline}
            </h2>

            {/* Desktop only: pain lines float around the headline as
                scattered fragments instead of a stacked list. Anchored to
                the headline's own box (top-0 / top-1/2 / top-full) rather
                than fixed pixel offsets, so placement holds regardless of
                how many lines the huge lg:text-8xl headline wraps to. */}
            <p
              className={`hidden lg:absolute lg:-top-4 lg:right-[calc(100%+1.5rem)] lg:block lg:w-44 lg:-rotate-[2deg] lg:text-right lg:text-base lg:leading-snug ${
                isLandlord ? "text-slate-400" : "text-slate-500"
              }`}
            >
              {copy.lines[0]}
            </p>
            <p
              className={`hidden lg:absolute lg:left-[calc(100%+1.5rem)] lg:top-[42%] lg:block lg:w-48 lg:-translate-y-1/2 lg:rotate-[1.5deg] lg:text-lg lg:leading-snug ${
                isLandlord ? "text-slate-400" : "text-slate-500"
              }`}
            >
              {copy.lines[1]}
            </p>
            <p
              className={`hidden lg:absolute lg:right-[calc(100%+1.5rem)] lg:top-full lg:mt-6 lg:block lg:w-44 lg:-rotate-[1deg] lg:text-right lg:text-base lg:leading-snug ${
                isLandlord ? "text-slate-400" : "text-slate-500"
              }`}
            >
              {copy.lines[2]}
            </p>
            <p
              className={`hidden lg:absolute lg:left-[calc(100%+1.5rem)] lg:top-full lg:mt-10 lg:block lg:w-48 lg:rotate-[2deg] lg:text-lg lg:leading-snug ${
                isLandlord ? "text-slate-400" : "text-slate-500"
              }`}
            >
              {copy.lines[3]}
            </p>
          </div>

          {/* Mobile/tablet: stacked list, unchanged. Hidden at lg where the
              floating fragments above take over. */}
          <div className="mt-7 space-y-2.5 lg:hidden">
            {copy.lines.map((line) => (
              <p
                key={line}
                className={`text-base leading-snug md:text-lg md:leading-relaxed ${
                  isLandlord ? "text-slate-400" : "text-slate-500"
                }`}
              >
                {line}
              </p>
            ))}
          </div>
          <button
            type="button"
            onClick={() => chooseFlow(mode)}
            className={`mt-9 min-h-[44px] w-full rounded-full px-8 py-3.5 text-center text-base font-bold shadow-lg transition active:scale-95 sm:w-auto md:mx-auto md:block md:w-fit ${
              isLandlord
                ? "bg-white text-[#111B29] hover:bg-slate-100"
                : "bg-[#2563EB] text-white hover:bg-blue-600"
            }`}
          >
            {copy.cta}
          </button>
        </div>
      </div>

      {/* Peek strip: preview of the other mode, tappable to switch */}
      <button
        type="button"
        onClick={() => setMode(other)}
        className={`flex min-h-[44px] w-full items-center gap-3 bg-[#111B29] px-6 py-4 text-left transition hover:bg-[#16223a] ${
          isLandlord ? "border-t border-white/10" : ""
        }`}
      >
        <span className="shrink-0 text-xs font-bold uppercase tracking-widest text-[#3b82f6]">
          {TOGGLE_LABEL[other]}
        </span>
        <span className="flex-1 truncate text-sm font-semibold text-white">
          {otherCopy.headline}
        </span>
        <span aria-hidden="true" className="shrink-0 text-white">
          &rarr;
        </span>
      </button>
    </section>
  );
}
