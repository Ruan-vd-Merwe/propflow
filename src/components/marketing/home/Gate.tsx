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
  "Rent chased every month, again.",
  "A deposit dispute with no paper trail.",
  "Maintenance calls at 22:00 on a Sunday.",
  "Weekends lost to viewings that never happen.",
];

const PEEK_LINE = "It's not you. Either of you.";

// Position/rotation/size for each flow's floating fragments, keyed by index
// into that flow's `lines` array. All sit outside the headline's own box
// (left/right: 100%+gap), so vertical placement never risks a horizontal
// collision with the headline text itself.
const FRAGMENT_POSITIONS: Record<Flow, string[]> = {
  tenant: [
    "lg:-top-4 lg:right-[calc(100%+1.5rem)] lg:w-44 lg:-rotate-[2deg] lg:text-right lg:text-xl",
    "lg:left-[calc(100%+1.5rem)] lg:top-[42%] lg:-translate-y-1/2 lg:w-48 lg:rotate-[1.5deg] lg:text-2xl",
    "lg:right-[calc(100%+1.5rem)] lg:top-full lg:mt-6 lg:w-44 lg:-rotate-[1deg] lg:text-right lg:text-xl",
    "lg:left-[calc(100%+1.5rem)] lg:top-full lg:mt-10 lg:w-48 lg:rotate-[2deg] lg:text-2xl",
  ],
  landlord: [
    "lg:-top-6 lg:right-[calc(100%+1.5rem)] lg:w-44 lg:-rotate-[2deg] lg:text-right lg:text-xl",
    "lg:-top-6 lg:left-[calc(100%+1.5rem)] lg:w-48 lg:rotate-[2deg] lg:text-2xl",
    "lg:top-[74%] lg:right-[calc(100%+1.5rem)] lg:-translate-y-1/2 lg:w-48 lg:-rotate-[1deg] lg:text-right lg:text-2xl",
    "lg:left-[calc(100%+1.5rem)] lg:top-full lg:mt-10 lg:w-48 lg:rotate-[1.5deg] lg:text-2xl",
    "lg:right-[calc(100%+1.5rem)] lg:top-full lg:mt-6 lg:w-44 lg:-rotate-[1.5deg] lg:text-right lg:text-xl",
  ],
};

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

  return (
    <section
      id="gate"
      className={isLandlord ? "bg-[#D7EDF2]" : "bg-[#F7F7F5]"}
    >
      <div className="px-6 pt-6">
        <h1 className="sr-only">Rent privately, safely.</h1>

        {/* Looking / Listing segmented toggle: a primary control, sized up
            from the old utility-pill treatment. Both modes now sit on a
            light background, so the pill styling is shared. */}
        <div
          role="group"
          aria-label="Choose whether you are looking for a place or listing one"
          className="mt-6 inline-flex rounded-full border border-slate-200 bg-white p-1.5 lg:p-2"
        >
          {(["tenant", "landlord"] as Flow[]).map((flow) => {
            const active = flow === mode;
            return (
              <button
                key={flow}
                type="button"
                aria-pressed={active}
                onClick={() => setMode(flow)}
                className={`min-h-[48px] rounded-full px-7 text-base font-bold transition lg:min-h-[56px] lg:px-9 lg:text-lg ${
                  active ? "bg-[#111B29] text-white" : "text-slate-500"
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
              isLandlord ? "text-[#111B29]" : "text-[#2563EB]"
            }`}
          >
            {copy.eyebrow}
          </p>
          <div className="relative">
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-[#111B29] md:text-5xl lg:text-8xl">
              {copy.headline}
            </h2>

            {/* Desktop only: pain lines float around the headline as
                scattered fragments instead of a stacked list. Anchored to
                the headline's own box (top-0 / top-1/2 / top-full) rather
                than fixed pixel offsets, so placement holds regardless of
                how many lines the huge lg:text-8xl headline wraps to.
                Position/rotation/size per fragment comes from
                FRAGMENT_POSITIONS, keyed by flow and line index. */}
            {copy.lines.map((line, i) => (
              <p
                key={line}
                className={`hidden lg:absolute lg:block lg:leading-snug text-slate-500 ${FRAGMENT_POSITIONS[mode][i]}`}
              >
                {line}
              </p>
            ))}
          </div>

          {/* Mobile/tablet: stacked list, unchanged. Hidden at lg where the
              floating fragments above take over. */}
          <div className="mt-7 space-y-2.5 lg:hidden">
            {copy.lines.map((line) => (
              <p
                key={line}
                className="text-base leading-snug text-slate-500 md:text-lg md:leading-relaxed"
              >
                {line}
              </p>
            ))}
          </div>
          <button
            type="button"
            onClick={() => chooseFlow(mode)}
            className="mt-9 min-h-[44px] w-full rounded-full bg-[#2563EB] px-8 py-3.5 text-center text-base font-bold text-white shadow-lg transition hover:bg-blue-600 active:scale-95 sm:w-auto md:mx-auto md:block md:w-fit"
          >
            {copy.cta}
          </button>
        </div>
      </div>

      {/* Peek strip: nudge toward the other mode, tappable to switch. Stays
          dark navy regardless of hero background for contrast. */}
      <button
        type="button"
        onClick={() => setMode(other)}
        className="flex min-h-[44px] w-full items-center gap-3 bg-[#111B29] px-6 py-4 text-left transition hover:bg-[#16223a]"
      >
        <span className="shrink-0 text-xs font-bold uppercase tracking-widest text-[#3b82f6]">
          {TOGGLE_LABEL[other]}
        </span>
        <span className="flex-1 truncate text-sm font-semibold text-white">
          {PEEK_LINE}
        </span>
        <span aria-hidden="true" className="shrink-0 text-white">
          &rarr;
        </span>
      </button>
    </section>
  );
}
