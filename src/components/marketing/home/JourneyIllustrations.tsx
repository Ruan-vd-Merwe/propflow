"use client";

import { useEffect, useRef, useState } from "react";
import type { JourneyId } from "./journeys";

const SCORE_TARGET = 742;

function CheckMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" width="9" height="9" fill="none" className={className}>
      <path
        d="M4 10 L8 14 L16 6"
        stroke="#fff"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function SearchIllustration({ animate }: { animate: boolean }) {
  return (
    <div className={`pt-illus-search ${animate ? "pt-animate" : ""}`}>
      <svg viewBox="0 0 100 100" fill="none" className="h-[190px] w-[190px] overflow-visible">
        <rect x="24" y="40" width="52" height="38" rx="3" stroke="var(--pt-j-ink)" strokeWidth={1.6} />
        <path
          d="M18 42 L50 18 L82 42"
          stroke="var(--pt-j-ink)"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="44" y="56" width="12" height="22" stroke="var(--pt-j-ink)" strokeWidth={1.4} />
        <g className="pt-glass">
          <circle cx="66" cy="32" r="11" stroke="var(--pt-j-accent)" strokeWidth={2.4} />
          <line x1="74" y1="40" x2="82" y2="48" stroke="var(--pt-j-accent)" strokeWidth={2.6} strokeLinecap="round" />
        </g>
        <g className="pt-check">
          <circle cx="66" cy="46" r="10" fill="var(--pt-j-accent)" />
          <path
            d="M61 46 L65 50 L72 42"
            stroke="#fff"
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>
    </div>
  );
}

function RenterIllustration({ animate }: { animate: boolean }) {
  const [score, setScore] = useState(0);
  const raf = useRef<number>();

  useEffect(() => {
    if (!animate) {
      setScore(0);
      return;
    }
    if (prefersReducedMotion()) {
      setScore(SCORE_TARGET);
      return;
    }
    const start = performance.now();
    const dur = 900;
    const delay = 550;
    const timer = setTimeout(() => {
      function step(now: number) {
        const p = Math.min(1, (now - start) / dur);
        setScore(Math.round(p * SCORE_TARGET));
        if (p < 1) raf.current = requestAnimationFrame(step);
      }
      raf.current = requestAnimationFrame(step);
    }, delay);
    return () => {
      clearTimeout(timer);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [animate]);

  return (
    <div className={`pt-illus-renter ${animate ? "pt-animate" : ""} text-center`}>
      <div
        className="pt-stamp mx-auto flex h-[150px] w-[150px] flex-col items-center justify-center rounded-full"
        style={{
          border: "3px solid var(--pt-j-accent)",
          background:
            "repeating-conic-gradient(from 0deg, var(--pt-j-accent) 0deg 2deg, transparent 2deg 9deg)",
          WebkitMask: "radial-gradient(circle, transparent 62px, black 63px)",
          mask: "radial-gradient(circle, transparent 62px, black 63px)",
        }}
      >
        <span
          className="relative top-[-2px] font-[family-name:var(--font-ibm-plex-mono)] text-[1.6rem] font-semibold"
          style={{ color: "var(--pt-j-ink)" }}
        >
          {score}
        </span>
        <span
          className="mt-0.5 font-[family-name:var(--font-ibm-plex-mono)] text-[0.55rem] tracking-[0.1em]"
          style={{ color: "var(--pt-j-accent)" }}
        >
          VERIFIED
        </span>
      </div>
    </div>
  );
}

function FlatmateIllustration({ animate }: { animate: boolean }) {
  return (
    <div className={`pt-illus-flatmate ${animate ? "pt-animate" : ""} relative h-full w-full`}>
      <div className="pt-fcard-left absolute left-[calc(50%-110px)] top-1/2 flex h-24 w-[76px] flex-col items-center justify-center gap-1.5 rounded-lg border bg-[#F7F5EE]" style={{ borderColor: "var(--pt-j-line)" }}>
        <div className="h-[26px] w-[26px] rounded-full border" style={{ background: "var(--pt-j-accent-soft)", borderColor: "var(--pt-j-accent)" }} />
        <div className="h-[5px] w-11 rounded" style={{ background: "var(--pt-j-line)" }} />
        <div className="h-[5px] w-7 rounded" style={{ background: "var(--pt-j-line)" }} />
      </div>

      <div className="pt-link-line absolute left-[calc(50%-34px)] top-1/2 h-px w-[68px]" style={{ background: "var(--pt-j-line)" }} />

      <div
        className="pt-link-badge absolute left-1/2 top-1/2 flex h-[30px] w-[30px] items-center justify-center rounded-full"
        style={{ background: "var(--pt-j-accent)" }}
      >
        <CheckMark className="h-3 w-3" />
      </div>

      <div className="pt-fcard-right absolute right-[calc(50%-110px)] top-1/2 flex h-24 w-[76px] flex-col items-center justify-center gap-1.5 rounded-lg border bg-[#F7F5EE]" style={{ borderColor: "var(--pt-j-line)" }}>
        <div className="h-[26px] w-[26px] rounded-full border" style={{ background: "var(--pt-j-accent-soft)", borderColor: "var(--pt-j-accent)" }} />
        <div className="h-[5px] w-11 rounded" style={{ background: "var(--pt-j-line)" }} />
        <div className="h-[5px] w-7 rounded" style={{ background: "var(--pt-j-line)" }} />
      </div>
    </div>
  );
}

function LandlordIllustration({ animate }: { animate: boolean }) {
  return (
    <div className={`pt-illus-landlord ${animate ? "pt-animate" : ""} w-full max-w-[280px]`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="pt-arow mb-2 flex items-center gap-2.5 rounded-lg border bg-[#F7F5EE] px-3 py-2.5"
          style={{ borderColor: "var(--pt-j-line)" }}
        >
          <div className="h-5 w-5 shrink-0 rounded-full" style={{ background: "var(--pt-j-accent-soft)" }} />
          <div className="h-1.5 flex-1 rounded" style={{ background: "var(--pt-j-line)" }} />
          <div className="pt-acheck flex h-4 w-4 shrink-0 items-center justify-center rounded-full" style={{ background: "var(--pt-j-accent)" }}>
            <CheckMark />
          </div>
        </div>
      ))}
    </div>
  );
}

export function JourneyIllustration({
  id,
  animate,
}: {
  id: JourneyId;
  animate: boolean;
}) {
  switch (id) {
    case "search":
      return <SearchIllustration animate={animate} />;
    case "renter":
      return <RenterIllustration animate={animate} />;
    case "flatmate":
      return <FlatmateIllustration animate={animate} />;
    case "landlord":
      return <LandlordIllustration animate={animate} />;
  }
}
