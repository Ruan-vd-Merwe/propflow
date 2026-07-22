"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { JOURNEYS, JOURNEY_ORDER, type JourneyId } from "./journeys";
import { JOURNEY_ICONS } from "./JourneyIcons";
import { JourneyIllustration } from "./JourneyIllustrations";
import { useInView } from "./useInView";

function Beat({
  children,
  onEnter,
}: {
  children: React.ReactNode;
  onEnter?: () => void;
}) {
  const { ref, inView } = useInView<HTMLDivElement>(0.35);

  useEffect(() => {
    if (inView) onEnter?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  return (
    <div
      ref={ref}
      className={`pt-beat mx-auto max-w-[640px] px-6 py-14 text-center ${
        inView ? "pt-in-view" : ""
      }`}
    >
      {children}
    </div>
  );
}

function JourneyCard({
  id,
  index,
  onSelect,
}: {
  id: JourneyId;
  index: number;
  onSelect: (id: JourneyId) => void;
}) {
  const journey = JOURNEYS[id];
  const Icon = JOURNEY_ICONS[id];
  const idx = String(index + 1).padStart(2, "0");
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className="group relative flex min-h-[44px] flex-col gap-3.5 overflow-hidden rounded-[10px] border border-[rgba(30,42,46,0.13)] bg-white p-[26px_22px] text-left transition-transform duration-200 ease-out hover:-translate-y-1 hover:border-[#B5613E] focus-visible:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A5462] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F1ECE1] active:translate-y-0 active:scale-[0.99]"
    >
      <span
        aria-hidden="true"
        className="absolute right-[22px] top-5 font-[family-name:var(--font-newsreader)] text-[13px] italic opacity-30"
        style={{ color: "#1E2A2E" }}
      >
        {idx}
      </span>
      <span className="block h-[34px] w-[34px]">
        <Icon />
      </span>
      <span
        className="font-[family-name:var(--font-ibm-plex-sans)] text-[1.02rem] font-semibold"
        style={{ color: "#1E2A2E" }}
      >
        {journey.label}
      </span>
      <span
        className="font-[family-name:var(--font-ibm-plex-sans)] text-[0.85rem] opacity-85"
        style={{ color: "#2A5462" }}
      >
        {journey.sub}
      </span>
    </button>
  );
}

function SideRail({ side, label }: { side: "left" | "right"; label: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-y-0 hidden w-px min-[1100px]:block ${
        side === "left" ? "left-16" : "right-16"
      }`}
      style={{
        background:
          "linear-gradient(to bottom, transparent, rgba(30,42,46,0.13) 15%, rgba(30,42,46,0.13) 85%, transparent)",
      }}
    >
      <span
        className="absolute left-1/2 top-[38%] -translate-x-1/2 -rotate-90 whitespace-nowrap font-[family-name:var(--font-ibm-plex-sans)] text-[11px] uppercase tracking-[0.14em] opacity-45"
        style={{ color: "#2A5462" }}
      >
        {label}
      </span>
    </div>
  );
}

function JourneyHero({ onSelect }: { onSelect: (id: JourneyId) => void }) {
  return (
    <section className="relative pb-16 pt-[76px]">
      <SideRail side="left" label={"Registry · Cape Town"} />
      <SideRail side="right" label={"Est. 2026 · proptrust.co.za"} />

      <div className="mx-auto max-w-[var(--pt-container-max)] px-6 sm:px-10">
        <div className="mx-auto max-w-[640px] text-center">
          <p
            className="mb-2 flex items-center justify-center gap-2 font-[family-name:var(--font-ibm-plex-sans)] text-[0.75rem] font-semibold uppercase tracking-[0.11em]"
            style={{ color: "#2A5462" }}
          >
            <span
              aria-hidden="true"
              className="h-[6px] w-[6px] rounded-full"
              style={{ background: "#B5613E" }}
            />
            Verified rental identity
          </p>
          <h1
            className="font-[family-name:var(--font-newsreader)] text-[clamp(2.1rem,5vw,3.1rem)] font-semibold leading-[1.08] tracking-tight"
            style={{ color: "#1E2A2E" }}
          >
            Renting, without starting from zero.
          </h1>
          <p className="mt-3.5 font-[family-name:var(--font-ibm-plex-sans)] text-[1.05rem]" style={{ color: "#2A5462" }}>
            One verified profile. Trusted everywhere you go.
          </p>
        </div>

        <div className="mx-auto mb-7 mt-10 max-w-[640px] text-center">
          <span className="font-[family-name:var(--font-newsreader)] text-[1.15rem] font-medium italic" style={{ color: "#1E2A2E" }}>
            Why are you here today?
          </span>
        </div>

        <div className="mx-auto grid max-w-[760px] grid-cols-1 gap-3 sm:grid-cols-2">
          {JOURNEY_ORDER.map((id, index) => (
            <JourneyCard key={id} id={id} index={index} onSelect={onSelect} />
          ))}
        </div>
      </div>
    </section>
  );
}

function JourneyStory({
  selected,
  onBack,
  onSelect,
}: {
  selected: JourneyId;
  onBack: () => void;
  onSelect: (id: JourneyId) => void;
}) {
  const journey = JOURNEYS[selected];
  const [visualInView, setVisualInView] = useState(false);

  return (
    <section
      className="pb-10"
      style={
        {
          "--pt-j-accent": journey.accent,
          "--pt-j-accent-soft": journey.accentSoft,
          "--pt-j-ink": "#132A3D",
          "--pt-j-line": "rgba(19,42,61,0.14)",
        } as React.CSSProperties
      }
    >
      <button
        type="button"
        onClick={onBack}
        className="mb-1 inline-flex min-h-[44px] items-center gap-1.5 px-6 text-[0.82rem] transition hover:opacity-100"
        style={{ color: "#5C6B76" }}
      >
        &larr; Choose differently
      </button>

      <Beat>
        <p
          className="mb-2 flex items-center justify-center gap-2 font-[family-name:var(--font-ibm-plex-mono)] text-[0.7rem] font-medium uppercase tracking-[0.14em]"
          style={{ color: journey.accent }}
        >
          <span aria-hidden="true" className="h-[7px] w-[7px] rounded-[1px]" style={{ background: journey.accent }} />
          The problem
        </p>
        <h2
          className="font-[family-name:var(--font-fraunces)] text-[clamp(1.5rem,3.4vw,2.05rem)] font-semibold leading-[1.18]"
          style={{ color: "#132A3D" }}
        >
          {journey.problemH}
        </h2>
        <p className="mx-auto mt-2.5 max-w-[38ch] font-[family-name:var(--font-ibm-plex-sans)]" style={{ color: "#5C6B76" }}>
          {journey.problemP}
        </p>
      </Beat>

      <Beat onEnter={() => setVisualInView(true)}>
        <div className="flex h-[230px] items-center justify-center">
          <JourneyIllustration id={selected} animate={visualInView} />
        </div>
      </Beat>

      <Beat>
        <p
          className="mb-2 flex items-center justify-center gap-2 font-[family-name:var(--font-ibm-plex-mono)] text-[0.7rem] font-medium uppercase tracking-[0.14em]"
          style={{ color: journey.accent }}
        >
          <span aria-hidden="true" className="h-[7px] w-[7px] rounded-[1px]" style={{ background: journey.accent }} />
          The shift
        </p>
        <h2
          className="font-[family-name:var(--font-fraunces)] text-[clamp(1.5rem,3.4vw,2.05rem)] font-semibold leading-[1.18]"
          style={{ color: "#132A3D" }}
        >
          {journey.solutionH}
        </h2>
        <p className="mx-auto mt-2.5 max-w-[38ch] font-[family-name:var(--font-ibm-plex-sans)]" style={{ color: "#5C6B76" }}>
          {journey.solutionP}
        </p>
      </Beat>

      <Beat>
        <Link
          href={journey.ctaHref}
          className="inline-block min-h-[44px] rounded-md px-7 py-[15px] font-[family-name:var(--font-ibm-plex-sans)] text-[0.95rem] font-semibold text-white transition hover:-translate-y-0.5"
          style={{ background: journey.accent }}
        >
          {journey.cta}
        </Link>
        <p className="mt-3 font-[family-name:var(--font-ibm-plex-sans)] text-[0.78rem]" style={{ color: "#5C6B76" }}>
          Free to start. Takes minutes.
        </p>
      </Beat>

      <div className="flex flex-wrap justify-center gap-2 px-6 pb-2 pt-5">
        {JOURNEY_ORDER.map((id) => {
          const active = id === selected;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              className="min-h-[44px] rounded-full border px-3.5 py-2 font-[family-name:var(--font-ibm-plex-sans)] text-[0.78rem] transition"
              style={
                active
                  ? { background: "#132A3D", borderColor: "#132A3D", color: "#EFECE3" }
                  : { borderColor: "rgba(19,42,61,0.14)", background: "#F7F5EE", color: "#5C6B76" }
              }
            >
              {JOURNEYS[id].label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

const JOURNEY_PARAM = "journey";

function isJourneyId(value: string | null): value is JourneyId {
  return value !== null && value in JOURNEYS;
}

function readJourneyFromLocation(): JourneyId | null {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get(JOURNEY_PARAM);
  return isJourneyId(value) ? value : null;
}

function pushJourneyState(id: JourneyId | null) {
  const url = id
    ? `${window.location.pathname}?${JOURNEY_PARAM}=${id}`
    : window.location.pathname;
  window.history.pushState({ journey: id }, "", url);
}

export function MarketingJourneys() {
  const [selected, setSelected] = useState<JourneyId | null>(null);

  // Sync from the URL after mount, so a direct link or refresh on ?journey=...
  // still lands on the right story. Done in an effect (not the useState
  // initializer) so the client's first render matches the server-rendered
  // hero exactly, avoiding a hydration mismatch.
  useEffect(() => {
    setSelected(readJourneyFromLocation());
  }, []);

  // The browser back/forward buttons don't re-run our click handlers, they
  // just change the URL, so this listener is what actually syncs the visible
  // story back to whatever state the URL now says, every time.
  useEffect(() => {
    function onPopState() {
      setSelected(readJourneyFromLocation());
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function select(id: JourneyId) {
    pushJourneyState(id);
    setSelected(id);
    window.scrollTo({ top: 0, behavior: prefersReducedMotionSafe() ? "auto" : "smooth" });
  }

  function back() {
    pushJourneyState(null);
    setSelected(null);
    window.scrollTo({ top: 0, behavior: prefersReducedMotionSafe() ? "auto" : "smooth" });
  }

  return (
    <div
      className="pt-journeys font-[family-name:var(--font-ibm-plex-sans)]"
      style={{ background: "#F1ECE1" }}
    >
      {selected === null ? (
        <JourneyHero onSelect={select} />
      ) : (
        <JourneyStory key={selected} selected={selected} onBack={back} onSelect={select} />
      )}
    </div>
  );
}

function prefersReducedMotionSafe() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
