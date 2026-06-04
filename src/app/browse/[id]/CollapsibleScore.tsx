'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ScoreBreakdown } from '@/components/ScoreBreakdown'
import type { ScoreResult } from '@/lib/scoring/interest-engine'

type ScoreResultLike = {
  score: number
  confidence: number
  match_reasons: string[]
  warnings: string[]
  insights: Record<string, { score: number; message: string }>
  status?: string
}

export function CollapsibleScore({
  scoreResult,
  user,
  hasTenantProfile,
}: {
  scoreResult: ScoreResultLike | null
  user: { id: string } | null
  hasTenantProfile: boolean
}) {
  const [open, setOpen] = useState(false)

  if (scoreResult) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <button
          onClick={() => setOpen(v => !v)}
          className="flex w-full items-center justify-between px-5 py-4 text-left"
        >
          <span className="text-sm font-semibold text-slate-900">
            How this matches your profile
          </span>
          <svg
            className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
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
              <Link href="/how-scoring-works" className="hover:text-slate-700 hover:underline">
                How scoring works
              </Link>
            </p>
          </div>
        )}
      </div>
    )
  }

  if (user && !hasTenantProfile) {
    return (
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <p className="text-sm font-semibold text-blue-900">Complete your tenant profile</p>
        <p className="mt-1 text-sm text-blue-700">
          Add your budget and preferences to see a personalised match score.
        </p>
        <Link
          href="/tenant/profile"
          className="mt-3 inline-block rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800"
        >
          Complete profile
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-sm font-semibold text-slate-900">See your personal match score</p>
      <p className="mt-1 text-sm text-slate-500">
        PropTrust analyses 8 dimensions including affordability, lifestyle and commute time.
      </p>
      <Link
        href="/login"
        className="mt-3 inline-block rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
      >
        Sign in
      </Link>
    </div>
  )
}

// Suppress unused import warning — ScoreResult is used as a type
void (undefined as unknown as ScoreResult)
