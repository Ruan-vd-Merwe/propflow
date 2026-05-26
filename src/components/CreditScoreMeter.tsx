import { creditScoreColour, creditScoreLabel } from '@/lib/credit-score'
import type { CreditScoreBreakdown } from '@/lib/types'

interface Props {
  score: number
  breakdown?: CreditScoreBreakdown | null
  size?: 'sm' | 'lg'
}

export function CreditScoreMeter({ score, breakdown, size = 'lg' }: Props) {
  const colour = creditScoreColour(score)
  const label  = creditScoreLabel(score)

  const barColour =
    colour === 'green' ? 'bg-emerald-500' :
    colour === 'amber' ? 'bg-amber-500'   : 'bg-red-500'

  const textColour =
    colour === 'green' ? 'text-emerald-600' :
    colour === 'amber' ? 'text-amber-600'   : 'text-red-600'

  if (size === 'sm') {
    return (
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
          <div className={`h-full rounded-full ${barColour}`} style={{ width: `${score}%` }} />
        </div>
        <span className={`text-sm font-bold ${textColour}`}>{score}</span>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-1 flex items-end gap-2">
        <span className={`text-4xl font-bold ${textColour}`}>{score}</span>
        <span className="mb-1 text-base text-slate-400">/ 100</span>
        <span className={`mb-1 text-sm font-semibold ${textColour}`}>— {label}</span>
      </div>

      <div className="mb-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${barColour}`}
          style={{ width: `${score}%` }}
        />
      </div>

      {breakdown && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ScoreSlice
            label="Bank health"
            score={breakdown.bankHealth.score}
            max={breakdown.bankHealth.max}
          />
          <ScoreSlice
            label="Rent ratio"
            score={breakdown.ratio.score}
            max={breakdown.ratio.max}
          />
          <ScoreSlice
            label="ID check"
            score={breakdown.idVerification.score}
            max={breakdown.idVerification.max}
          />
          <ScoreSlice
            label="References"
            score={breakdown.referenceCheck.score}
            max={breakdown.referenceCheck.max}
          />
        </div>
      )}
    </div>
  )
}

function ScoreSlice({ label, score, max }: { label: string; score: number; max: number }) {
  const pct = Math.round((score / max) * 100)
  const colour =
    pct >= 75 ? 'text-emerald-600' :
    pct >= 40 ? 'text-amber-600'   : 'text-red-600'

  return (
    <div className="rounded-lg bg-slate-50 p-3 text-center">
      <p className={`text-xl font-bold ${colour}`}>
        {score}<span className="text-xs font-normal text-slate-400">/{max}</span>
      </p>
      <p className="mt-0.5 text-xs text-slate-500">{label}</p>
    </div>
  )
}
