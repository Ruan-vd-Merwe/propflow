'use client'

import type { InsightResult } from '@/lib/scoring/engine'

export interface PropertyScoreCardProps {
  score: number
  confidence: number
  insights: {
    financial?: InsightResult
    deal?: InsightResult
    safety?: InsightResult
    lifestyle?: InsightResult
    commute?: InsightResult
    approval?: InsightResult
    landlord?: InsightResult
  }
  top_reasons: string[]
  warnings: string[]
}

function scoreBadgeColor(score: number) {
  if (score >= 80) return 'bg-green-500'
  if (score >= 50) return 'bg-amber-500'
  return 'bg-red-500'
}

function scoreTextColor(score: number) {
  if (score >= 80) return 'text-green-700'
  if (score >= 50) return 'text-amber-600'
  return 'text-red-600'
}

function barColor(score: number) {
  if (score >= 0.7) return 'bg-green-500'
  if (score >= 0.4) return 'bg-amber-500'
  return 'bg-red-500'
}

const DIMENSIONS = [
  { key: 'financial' as const, label: 'Financial fit' },
  { key: 'deal' as const, label: 'Deal value' },
  { key: 'safety' as const, label: 'Safety' },
  { key: 'lifestyle' as const, label: 'Lifestyle match' },
  { key: 'approval' as const, label: 'Approval chance' },
  { key: 'landlord' as const, label: 'Landlord score' },
]

export function PropertyScoreCard({
  score,
  confidence,
  insights,
  top_reasons,
  warnings,
}: PropertyScoreCardProps) {
  const badgeColor = scoreBadgeColor(score)
  const textColor = scoreTextColor(score)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Property match score</h3>
          <p className="mt-0.5 text-sm text-slate-500">
            How well this property fits your profile
          </p>
        </div>

        {/* Score circle */}
        <div className="flex shrink-0 flex-col items-center">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-full ${badgeColor} text-white shadow-md`}
          >
            <div className="text-center">
              <span className="block text-xl font-extrabold leading-none">{score}</span>
              <span className="block text-[10px] font-semibold leading-none opacity-80">
                /100
              </span>
            </div>
          </div>
          <span className={`mt-1 text-xs font-semibold ${textColor}`}>Match</span>
        </div>
      </div>

      {/* Confidence bar */}
      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs text-slate-400">Data confidence</span>
          <span className="text-xs font-medium text-slate-600">
            {Math.round(confidence * 100)}%
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-slate-400"
            style={{ width: `${Math.round(confidence * 100)}%` }}
          />
        </div>
      </div>

      {/* Top reasons */}
      {top_reasons.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Why this property scores well
          </p>
          <ul className="space-y-1.5">
            {top_reasons.map((reason, i) => (
              <li key={i} className="flex items-start gap-2">
                <svg
                  className="mt-0.5 h-4 w-4 shrink-0 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-slate-700">{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Things to consider
          </p>
          <ul className="space-y-1.5">
            {warnings.map((warning, i) => (
              <li key={i} className="flex items-start gap-2">
                <svg
                  className="mt-0.5 h-4 w-4 shrink-0 text-amber-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                  />
                </svg>
                <span className="text-sm text-slate-700">{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Score breakdown */}
      <div className="mt-5 border-t border-slate-100 pt-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Score breakdown
        </p>
        <div className="space-y-3">
          {DIMENSIONS.map(({ key, label }) => {
            const insight = insights[key]
            if (!insight) return null
            const pct = Math.round(insight.score * 100)
            const color = barColor(insight.score)
            return (
              <div key={key}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700">{label}</span>
                  <span className="text-xs text-slate-400">{pct}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${color} transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-0.5 text-[11px] text-slate-400">{insight.message}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
