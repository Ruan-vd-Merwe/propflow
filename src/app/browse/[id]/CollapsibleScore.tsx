"use client";

import { useState } from "react";
import Link from "next/link";
import { ScoreBreakdown } from "@/components/ScoreBreakdown";

type ScoreResultLike = {
  score: number;
  confidence: number;
  match_reasons: string[];
  warnings: string[];
  insights: Record<string, { score: number; message: string }>;
};

function scoreBadgeColor(score: number) {
  if (score >= 75) return "bg-green-100 text-green-800";
  if (score >= 45) return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-700";
}

// ─── Personalised: score + collapsible breakdown ──────────────────────────────

function PersonalisedScore({ scoreResult }: { scoreResult: ScoreResultLike }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Score summary */}
      <div className="p-5">
        <div className="mb-3 flex items-center gap-3">
          <span
            className={`rounded-full px-4 py-2 text-xl font-extrabold tabular-nums ${scoreBadgeColor(scoreResult.score)}`}
          >
            {scoreResult.score}%
          </span>
          <p className="text-sm font-semibold text-slate-900">
            This property is a {scoreResult.score}% match for you
          </p>
        </div>
        {scoreResult.match_reasons.length > 0 && (
          <ul className="space-y-1 text-xs text-green-700">
            {scoreResult.match_reasons.slice(0, 3).map((r, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                {r}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Collapsible breakdown */}
      <div className="border-t border-slate-100">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-3 text-left transition hover:bg-slate-50"
        >
          <span className="text-xs font-semibold text-slate-500">
            {open ? "Hide full score breakdown" : "Show full score breakdown"}
          </span>
          <svg
            className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        {open && (
          <div className="border-t border-slate-100 px-4 pb-4 pt-3">
            <ScoreBreakdown
              score={scoreResult.score}
              confidence={scoreResult.confidence}
              match_reasons={scoreResult.match_reasons}
              warnings={scoreResult.warnings}
              insights={scoreResult.insights}
            />
            <p className="mt-2 text-right text-xs text-slate-400">
              <Link
                href="/how-scoring-works"
                className="hover:text-slate-700 hover:underline"
              >
                How scoring works
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Guest teaser card ────────────────────────────────────────────────────────

function GuestTeaser() {
  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
      <p className="text-sm font-semibold text-blue-900">
        Get your personal match score
      </p>
      <p className="mt-1 text-sm text-blue-700">
        PropTrust analyses this property against your budget, lifestyle and
        commute preferences to give you a personalised match score.
      </p>
      <p className="mt-3 mb-1 text-xs font-semibold text-blue-800">
        What we analyse:
      </p>
      <ul className="space-y-1 text-xs text-blue-700">
        <li className="flex items-start gap-1.5">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
          Affordability against your income
        </li>
        <li className="flex items-start gap-1.5">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
          Area match against your preferences
        </li>
        <li className="flex items-start gap-1.5">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
          Lifestyle and walkability fit
        </li>
        <li className="flex items-start gap-1.5">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
          Estimated approval likelihood
        </li>
      </ul>
      <Link
        href="/login"
        className="mt-4 inline-block rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800"
      >
        Sign in to see your score
      </Link>
    </div>
  );
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export function CollapsibleScore({
  scoreResult,
  user,
  hasTenantProfile,
}: {
  scoreResult: ScoreResultLike | null;
  user: { id: string } | null;
  hasTenantProfile: boolean;
}) {
  if (scoreResult) {
    return <PersonalisedScore scoreResult={scoreResult} />;
  }

  if (user && !hasTenantProfile) {
    return (
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <p className="text-sm font-semibold text-blue-900">
          Complete your tenant profile
        </p>
        <p className="mt-1 text-sm text-blue-700">
          Add your budget and preferences to see a personalised match score for
          this property.
        </p>
        <Link
          href="/tenant/profile"
          className="mt-3 inline-block rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800"
        >
          Complete profile
        </Link>
      </div>
    );
  }

  return <GuestTeaser />;
}
