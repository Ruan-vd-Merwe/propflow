"use client";

import { useState } from "react";
import Link from "next/link";
import type { PropertyListing } from "@/lib/types";

type Match = {
  property: PropertyListing;
  score: number;
  match_reasons: string[];
};

function scoreBadgeClass(score: number) {
  if (score >= 75) return "bg-blue-100 text-blue-700";
  if (score >= 45) return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

function MatchCard({ property: p, score, match_reasons }: Match) {
  const [open, setOpen] = useState(false);

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-4 p-0">
        <div className="h-24 w-24 shrink-0 overflow-hidden sm:h-28 sm:w-32">
          {p.photos?.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.photos[0]} alt={p.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-100">
              <svg
                className="h-8 w-8 text-slate-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 py-3">
          <p className="truncate font-semibold text-slate-900">{p.name}</p>
          <p className="text-xs text-slate-400">
            {p.suburb}
            {p.province ? `, ${p.province}` : ""}
          </p>
          {p.asking_rent && (
            <p className="mt-1 text-sm font-bold text-slate-900">
              R{(p.asking_rent / 100).toLocaleString("en-ZA")}
              <span className="text-xs font-normal text-slate-400">/mo</span>
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2 pr-4">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ${scoreBadgeClass(score)}`}
          >
            {score}/100
          </span>
          <Link
            href={`/browse/${p.id}`}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            View
          </Link>
        </div>
      </div>

      {match_reasons.length > 0 && (
        <div className="border-t border-slate-100">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex min-h-[44px] w-full items-center justify-between px-5 py-2.5 text-left text-xs font-semibold text-blue-700"
          >
            Why this match
            <svg
              className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {open && (
            <ul className="space-y-1.5 px-5 pb-4">
              {match_reasons.map((r, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                  <span className="text-xs leading-snug text-slate-600">{r}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export function MatchesContent({ matches }: { matches: Match[] }) {
  return (
    <div className="space-y-3">
      {matches.map((m) => (
        <MatchCard key={m.property.id} {...m} />
      ))}

      <div className="pt-2 text-center">
        <Link href="/tenant/browse" className="text-sm font-medium text-blue-600 hover:underline">
          Browse all properties →
        </Link>
      </div>
    </div>
  );
}
