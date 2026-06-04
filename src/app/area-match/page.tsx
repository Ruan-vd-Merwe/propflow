"use client";

import { useState } from "react";
import Link from "next/link";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import {
  scoreAreas,
  fmtRent,
  scoreColour,
  LIFESTYLE_LABELS,
  TRANSPORT_LABELS,
  type AreaMatchInputs,
  type AreaRecommendation,
  type TransportMode,
  type MoveInTiming,
  type LifestylePriority,
} from "./data";

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 4;

const LIFESTYLE_PRIORITIES: LifestylePriority[] = [
  "beach",
  "safety",
  "running_routes",
  "restaurants",
  "coffee_shops",
  "social_life",
  "quiet_streets",
  "schools",
  "short_commute",
  "value_for_money",
  "remote_work",
  "gym",
  "parks_mountain",
];

const TRANSPORT_OPTIONS: { value: TransportMode; label: string }[] = [
  { value: "walk", label: "Walk" },
  { value: "drive", label: "Drive" },
  { value: "public", label: "MyCiTi / train" },
  { value: "uber", label: "Uber / taxi" },
  { value: "cycle", label: "Cycle" },
];

const BEDROOM_OPTIONS = [
  { value: 0, label: "Studio" },
  { value: 1, label: "1 bed" },
  { value: 2, label: "2 bed" },
  { value: 3, label: "3 bed+" },
];

const MOVEIN_OPTIONS: { value: MoveInTiming; label: string }[] = [
  { value: "asap", label: "As soon as possible" },
  { value: "1month", label: "Within 1 month" },
  { value: "2to3months", label: "2–3 months" },
  { value: "flexible", label: "Flexible" },
];

const BUDGET_PRESETS = [5000, 8000, 10000, 12000, 15000, 18000, 22000];

const DEFAULTS: AreaMatchInputs = {
  budget: 12000,
  workLocation: "",
  hasСar: false,
  transport: "drive",
  lifestyle: [],
  bedrooms: 1,
  moveIn: "2to3months",
};

// ─── Small reusable pieces ────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="mb-8">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-400">
          Step {step} of {TOTAL_STEPS}
        </p>
        <p className="text-xs text-slate-400">
          {Math.round((step / TOTAL_STEPS) * 100)}% complete
        </p>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[#1e40af] transition-all duration-500"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>
    </div>
  );
}

function StepHeading({
  label,
  heading,
}: {
  label: string;
  heading: string;
}) {
  return (
    <div className="mb-8">
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#1e40af]">
        {label}
      </p>
      <h2 className="text-2xl font-extrabold tracking-tight text-[#0f172a] sm:text-3xl">
        {heading}
      </h2>
    </div>
  );
}

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition active:scale-95 ${
        selected
          ? "border-[#1e40af] bg-[#1e40af] text-white"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
      }`}
    >
      {label}
    </button>
  );
}

function NavButtons({
  onBack,
  onNext,
  nextLabel = "Next",
  nextDisabled = false,
}: {
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
}) {
  return (
    <div className="mt-10 flex items-center justify-between gap-4">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border-2 border-slate-200 px-6 py-3 text-sm font-bold text-slate-600 transition hover:border-slate-400"
        >
          Back
        </button>
      ) : (
        <span />
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className="rounded-full bg-[#1e40af] px-8 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {nextLabel}
      </button>
    </div>
  );
}

// ─── Form steps ───────────────────────────────────────────────────────────────

function StepBudget({
  inputs,
  onChange,
  onNext,
}: {
  inputs: AreaMatchInputs;
  onChange: (patch: Partial<AreaMatchInputs>) => void;
  onNext: () => void;
}) {
  return (
    <div>
      <StepHeading label="Step 1 of 4" heading="What is your monthly rental budget?" />

      {/* Slider */}
      <div className="mb-6">
        <div className="mb-3 flex items-end justify-between">
          <label className="text-sm font-medium text-slate-600">
            Monthly budget
          </label>
          <span className="text-2xl font-extrabold text-[#0f172a]">
            {fmtRent(inputs.budget)}
          </span>
        </div>
        <input
          type="range"
          min={3000}
          max={30000}
          step={500}
          value={inputs.budget}
          onChange={(e) => onChange({ budget: Number(e.target.value) })}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-[#1e40af]"
        />
        <div className="mt-1.5 flex justify-between text-xs text-slate-400">
          <span>R3,000</span>
          <span>R30,000</span>
        </div>
      </div>

      {/* Preset chips */}
      <div>
        <p className="mb-3 text-xs font-semibold text-slate-400">
          Common budgets
        </p>
        <div className="flex flex-wrap gap-2">
          {BUDGET_PRESETS.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => onChange({ budget: amount })}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                inputs.budget === amount
                  ? "border-[#1e40af] bg-[#1e40af] text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
              }`}
            >
              {fmtRent(amount)}
            </button>
          ))}
        </div>
      </div>

      <NavButtons onNext={onNext} />
    </div>
  );
}

function StepCommute({
  inputs,
  onChange,
  onBack,
  onNext,
}: {
  inputs: AreaMatchInputs;
  onChange: (patch: Partial<AreaMatchInputs>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div>
      <StepHeading label="Step 2 of 4" heading="How do you get around?" />

      {/* Work location */}
      <div className="mb-8">
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Where do you work or study?
        </label>
        <input
          type="text"
          placeholder="e.g. Cape Town CBD, Stellenbosch, Remote"
          value={inputs.workLocation}
          onChange={(e) => onChange({ workLocation: e.target.value })}
          className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1e40af] focus:outline-none focus:ring-2 focus:ring-[#1e40af]/20"
        />
        <p className="mt-1.5 text-xs text-slate-400">
          Used to estimate commute times. Leave blank if fully remote.
        </p>
      </div>

      {/* Transport preference */}
      <div className="mb-8">
        <label className="mb-3 block text-sm font-semibold text-slate-700">
          How do you prefer to commute?
        </label>
        <div className="flex flex-wrap gap-2">
          {TRANSPORT_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              label={opt.label}
              selected={inputs.transport === opt.value}
              onClick={() => onChange({ transport: opt.value })}
            />
          ))}
        </div>
      </div>

      {/* Car toggle */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-[#0f172a]">I have a car</p>
          <p className="text-xs text-slate-500">
            Affects how we score parking and drive-friendly areas
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={inputs.hasСar}
          onClick={() => onChange({ hasСar: !inputs.hasСar })}
          className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
            inputs.hasСar ? "bg-[#1e40af]" : "bg-slate-300"
          }`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
              inputs.hasСar ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      <NavButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}

function StepLifestyle({
  inputs,
  onChange,
  onBack,
  onNext,
}: {
  inputs: AreaMatchInputs;
  onChange: (patch: Partial<AreaMatchInputs>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  function toggle(p: LifestylePriority) {
    const current = inputs.lifestyle;
    const next = current.includes(p)
      ? current.filter((x) => x !== p)
      : [...current, p];
    onChange({ lifestyle: next });
  }

  return (
    <div>
      <StepHeading
        label="Step 3 of 4"
        heading="What matters most where you live?"
      />
      <p className="mb-6 text-sm text-slate-500">
        Select everything that applies. You can choose as many as you like.
      </p>

      <div className="flex flex-wrap gap-2.5">
        {LIFESTYLE_PRIORITIES.map((p) => (
          <Chip
            key={p}
            label={LIFESTYLE_LABELS[p]}
            selected={inputs.lifestyle.includes(p)}
            onClick={() => toggle(p)}
          />
        ))}
      </div>

      {inputs.lifestyle.length > 0 && (
        <p className="mt-4 text-xs text-slate-400">
          {inputs.lifestyle.length} selected
        </p>
      )}

      <NavButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}

function StepTiming({
  inputs,
  onChange,
  onBack,
  onNext,
}: {
  inputs: AreaMatchInputs;
  onChange: (patch: Partial<AreaMatchInputs>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div>
      <StepHeading label="Step 4 of 4" heading="Bedrooms and timing." />

      {/* Bedrooms */}
      <div className="mb-8">
        <label className="mb-3 block text-sm font-semibold text-slate-700">
          How many bedrooms do you need?
        </label>
        <div className="flex flex-wrap gap-2">
          {BEDROOM_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              label={opt.label}
              selected={inputs.bedrooms === opt.value}
              onClick={() => onChange({ bedrooms: opt.value })}
            />
          ))}
        </div>
      </div>

      {/* Move-in timing */}
      <div className="mb-8">
        <label className="mb-3 block text-sm font-semibold text-slate-700">
          When do you want to move?
        </label>
        <div className="flex flex-col gap-2 sm:flex-wrap sm:flex-row">
          {MOVEIN_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              label={opt.label}
              selected={inputs.moveIn === opt.value}
              onClick={() => onChange({ moveIn: opt.value })}
            />
          ))}
        </div>
      </div>

      <NavButtons
        onBack={onBack}
        onNext={onNext}
        nextLabel="See my areas"
      />
    </div>
  );
}

// ─── Results ──────────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${scoreColour(score)}`}
    >
      {score}% match
    </span>
  );
}

function BreakdownBar({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-xs text-slate-500">{label}</span>
      <div className="flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-1.5 rounded-full transition-all ${value >= 70 ? "bg-green-500" : value >= 45 ? "bg-amber-400" : "bg-slate-400"}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs font-bold text-slate-600">
        {value}
      </span>
    </div>
  );
}

function AreaCard({
  rec,
  rank,
}: {
  rec: AreaRecommendation;
  rank: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const { area, rentRange, commuteMinutes } = rec;

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      {/* Card header */}
      <div className="border-b border-slate-100 px-6 py-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">#{rank}</span>
              <h3 className="text-lg font-extrabold text-[#0f172a]">
                {area.name}
              </h3>
            </div>
            <p className="mt-0.5 text-xs text-slate-400">
              {area.city} · {area.province}
            </p>
          </div>
          <ScoreBadge score={rec.score} />
        </div>

        {/* Key stats */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Est. rent
            </p>
            <p className="mt-0.5 text-sm font-bold text-[#0f172a]">
              {fmtRent(rentRange[0])}–{fmtRent(rentRange[1])}
              <span className="text-xs font-normal text-slate-400"> /mo</span>
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Commute est.
            </p>
            <p className="mt-0.5 text-sm font-bold text-[#0f172a]">
              {commuteMinutes >= 999
                ? "Not practical"
                : `~${commuteMinutes} min`}
              {commuteMinutes < 999 && (
                <span className="text-xs font-normal text-slate-400">
                  {" "}
                  to CBD
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 px-6 py-5">
        {/* Reasons */}
        {rec.matchReasons.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              Best for you
            </p>
            <ul className="space-y-1.5">
              {rec.matchReasons.map((r) => (
                <li key={r} className="flex items-center gap-2 text-sm text-slate-700">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Concerns */}
        {rec.concerns.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              Watch out
            </p>
            <ul className="space-y-1.5">
              {rec.concerns.map((c) => (
                <li key={c} className="flex items-center gap-2 text-sm text-slate-500">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Expandable detail */}
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mb-4 text-xs font-semibold text-[#1e40af] hover:underline"
        >
          {expanded ? "Less detail" : "More detail"}
        </button>

        {expanded && (
          <div className="mb-5 space-y-4 rounded-xl bg-slate-50 p-4">
            <div>
              <p className="mb-1 text-xs font-bold text-slate-500">
                Lifestyle
              </p>
              <p className="text-sm leading-relaxed text-slate-700">
                {area.lifestyle_highlights}
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs font-bold text-slate-500">
                Public transport
              </p>
              <p className="text-sm leading-relaxed text-slate-700">
                {area.public_transport_note}
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs font-bold text-slate-500">Safety</p>
              <p className="text-sm leading-relaxed text-slate-700">
                {area.safety_note}
              </p>
            </div>
            <div className="space-y-2 border-t border-slate-200 pt-3">
              <BreakdownBar label="Budget" value={rec.breakdown.budget} />
              <BreakdownBar label="Lifestyle" value={rec.breakdown.lifestyle} />
              <BreakdownBar label="Transport" value={rec.breakdown.transport} />
              <BreakdownBar label="Safety" value={rec.breakdown.safety} />
              <BreakdownBar label="Commute" value={rec.breakdown.commute} />
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="border-t border-slate-100 px-6 py-4">
        <Link
          href={`/browse?search=${encodeURIComponent(area.name)}`}
          className="block w-full rounded-xl bg-[#0f172a] py-3 text-center text-sm font-bold text-white transition hover:bg-slate-800"
        >
          View matching properties
        </Link>
      </div>
    </div>
  );
}

function Results({
  results,
  inputs,
  onReset,
}: {
  results: AreaRecommendation[];
  inputs: AreaMatchInputs;
  onReset: () => void;
}) {
  return (
    <div>
      {/* Summary bar */}
      <div className="mb-8 rounded-2xl border border-slate-200 bg-white px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Your search
            </p>
            <p className="mt-1 text-sm font-semibold text-[#0f172a]">
              {fmtRent(inputs.budget)}/month ·{" "}
              {BEDROOM_OPTIONS.find((b) => b.value === inputs.bedrooms)?.label}{" "}
              · {TRANSPORT_LABELS[inputs.transport]}
              {inputs.workLocation ? ` · ${inputs.workLocation}` : ""}
            </p>
            {inputs.lifestyle.length > 0 && (
              <p className="mt-0.5 text-xs text-slate-400">
                Priorities:{" "}
                {inputs.lifestyle
                  .slice(0, 4)
                  .map((l) => LIFESTYLE_LABELS[l])
                  .join(", ")}
                {inputs.lifestyle.length > 4
                  ? ` +${inputs.lifestyle.length - 4} more`
                  : ""}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onReset}
            className="shrink-0 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-400"
          >
            Start over
          </button>
        </div>
      </div>

      {/* Results grid */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {results.map((rec, i) => (
          <AreaCard key={rec.area.id} rec={rec} rank={i + 1} />
        ))}
      </div>

      {/* Disclaimer */}
      <p className="mt-8 text-center text-xs leading-relaxed text-slate-400">
        Area recommendations are based on your preferences and estimated data.
        Rent ranges are indicative. PropTrust does not guarantee availability or
        exact rental prices.
      </p>

      {/* Soft login nudge */}
      <div className="mx-auto mt-10 max-w-lg rounded-2xl border border-blue-100 bg-blue-50 px-6 py-6 text-center">
        <p className="text-sm font-semibold text-[#0f172a]">
          Want to see properties ranked for you?
        </p>
        <p className="mt-1.5 text-sm text-slate-500">
          Create a free PropTrust profile and we will match every listing to
          your budget, lifestyle and preferred areas.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link
            href="/register"
            className="rounded-full bg-[#1e40af] px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-800"
          >
            Create free profile
          </Link>
          <Link
            href="/browse"
            className="rounded-full border border-slate-300 px-6 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-500"
          >
            Browse all properties
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AreaMatchPage() {
  const [step, setStep] = useState(1); // 1-4 = input steps, 5 = results
  const [inputs, setInputs] = useState<AreaMatchInputs>(DEFAULTS);
  const [results, setResults] = useState<AreaRecommendation[]>([]);

  function patch(updates: Partial<AreaMatchInputs>) {
    setInputs((prev) => ({ ...prev, ...updates }));
  }

  function next() {
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
    } else {
      // Final step — compute results
      const ranked = scoreAreas(inputs);
      setResults(ranked);
      setStep(TOTAL_STEPS + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function back() {
    setStep((s) => Math.max(1, s - 1));
  }

  function reset() {
    setInputs(DEFAULTS);
    setResults([]);
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const isResultsPage = step === TOTAL_STEPS + 1;

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 antialiased">
      <MarketingNav />

      {/* Page header */}
      <div className="border-b border-slate-200 bg-[#0f172a] px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-blue-400">
            Area Match
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {isResultsPage ? "Your area recommendations" : "Where should you live?"}
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-slate-400">
            {isResultsPage
              ? "Ranked by how well each area fits your budget, commute and lifestyle."
              : "Answer four quick questions and PropTrust will rank Cape Town areas by how well they fit your life."}
          </p>
        </div>
      </div>

      {/* Main content — narrow for form steps, wide for results grid */}
      <main
        className={`px-5 py-10 sm:px-6 sm:py-14 ${
          isResultsPage ? "mx-auto max-w-5xl" : "mx-auto max-w-2xl"
        }`}
      >
        {!isResultsPage && <ProgressBar step={step} />}

        {step === 1 && (
          <StepBudget inputs={inputs} onChange={patch} onNext={next} />
        )}
        {step === 2 && (
          <StepCommute
            inputs={inputs}
            onChange={patch}
            onBack={back}
            onNext={next}
          />
        )}
        {step === 3 && (
          <StepLifestyle
            inputs={inputs}
            onChange={patch}
            onBack={back}
            onNext={next}
          />
        )}
        {step === 4 && (
          <StepTiming
            inputs={inputs}
            onChange={patch}
            onBack={back}
            onNext={next}
          />
        )}

        {isResultsPage && (
          <Results results={results} inputs={inputs} onReset={reset} />
        )}
      </main>

      <MarketingFooter />
    </div>
  );
}
