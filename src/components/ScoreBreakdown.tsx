"use client";

import { useState } from "react";

export interface ScoreBreakdownProps {
  score: number;
  confidence: number;
  match_reasons: string[];
  warnings: string[];
  insights: Record<
    string,
    {
      score: number;
      message: string;
    }
  >;
}

const DIMENSIONS = [
  { key: "affordability", label: "Affordability" },
  { key: "property_fit", label: "Property Fit" },
  { key: "area_fit", label: "Area Fit" },
  { key: "lifestyle_fit", label: "Lifestyle Fit" },
  { key: "commute", label: "Commute" },
  { key: "deal_quality", label: "Deal Quality" },
  { key: "safety", label: "Safety" },
  { key: "approval", label: "Approval" },
];

function scoreCircleColor(score: number): string {
  if (score >= 75) return "bg-[#16a34a]";
  if (score >= 45) return "bg-[#d97706]";
  return "bg-[#dc2626]";
}

function scoreLabelColor(score: number): string {
  if (score >= 75) return "text-[#16a34a]";
  if (score >= 45) return "text-[#d97706]";
  return "text-[#dc2626]";
}

function barColor(score: number): string {
  if (score >= 0.75) return "bg-[#16a34a]";
  if (score >= 0.45) return "bg-[#d97706]";
  return "bg-[#dc2626]";
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export function ScoreBreakdown({
  score,
  confidence,
  match_reasons,
  warnings,
  insights,
}: ScoreBreakdownProps) {
  const [expanded, setExpanded] = useState(false);

  const circleColor = scoreCircleColor(score);
  const labelColor = scoreLabelColor(score);
  const confidencePct = Math.round(confidence * 100);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Summary row */}
      <div className="flex items-start gap-5 p-5">
        {/* Score circle */}
        <div className="flex shrink-0 flex-col items-center gap-1">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-full ${circleColor} shadow`}
          >
            <div className="text-center leading-none text-white">
              <span className="block text-xl font-extrabold">{score}</span>
              <span className="block text-[10px] font-semibold opacity-80">
                /100
              </span>
            </div>
          </div>
          <span className={`text-xs font-semibold ${labelColor}`}>
            Match score
          </span>
        </div>

        {/* Confidence */}
        <div className="flex-1 pt-1">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Score confidence
            </span>
            <span className="text-xs font-semibold text-slate-700">
              {confidencePct}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-slate-400 transition-all"
              style={{ width: `${confidencePct}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            More property data improves accuracy
          </p>

          {/* Quick summary dots */}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
            {DIMENSIONS.slice(0, 4).map(({ key, label }) => {
              const ins = insights[key];
              if (!ins) return null;
              return (
                <div key={key} className="flex items-center gap-1.5">
                  <span
                    className={`h-2 w-2 rounded-full ${barColor(ins.score)}`}
                  />
                  <span className="text-xs text-slate-500">{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reasons */}
      {match_reasons.length > 0 && (
        <div className="border-t border-slate-100 px-5 py-4">
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Why this scores well
          </p>
          <ul className="space-y-1.5">
            {match_reasons.slice(0, 4).map((reason, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#16a34a]" />
                <span className="text-sm text-slate-700">{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="border-t border-slate-100 px-5 py-4">
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Things to consider
          </p>
          <ul className="space-y-1.5">
            {warnings.slice(0, 3).map((warning, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#d97706]" />
                <span className="text-sm text-slate-700">{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Expandable breakdown */}
      <div className="border-t border-slate-100">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-3 text-left transition hover:bg-slate-50"
        >
          <span className="text-xs font-semibold text-slate-500">
            {expanded ? "Hide breakdown" : "Show breakdown"}
          </span>
          <ChevronIcon open={expanded} />
        </button>

        {expanded && (
          <div className="border-t border-slate-100 px-5 pb-5 pt-3">
            <div className="space-y-4">
              {DIMENSIONS.map(({ key, label }) => {
                const ins = insights[key];
                const s = ins?.score ?? 0;
                const pct = Math.round(s * 100);
                return (
                  <div key={key}>
                    <div className="mb-1 flex items-center gap-3">
                      <span className="w-28 shrink-0 text-xs font-medium text-slate-600">
                        {label}
                      </span>
                      <div
                        className="flex-1 overflow-hidden rounded-full bg-slate-100"
                        style={{ height: 6 }}
                      >
                        <div
                          className={`h-full rounded-full ${barColor(s)} transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-8 shrink-0 text-right text-xs font-semibold text-slate-500">
                        {pct}%
                      </span>
                    </div>
                    {ins && (
                      <p className="ml-[7.5rem] text-[11px] leading-relaxed text-slate-400">
                        {ins.message}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
