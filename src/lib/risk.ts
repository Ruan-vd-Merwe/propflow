import type { Payment, RiskScore } from './types'

/**
 * Calculate risk score for a tenant based on their payment history.
 *
 * Rules:
 * - Start at 100
 * - Each missed payment: -20
 * - Each late payment: -8
 * - Each payment >14 days late: additional -5
 * - 3+ consecutive on-time payments: +10 (once per streak, applied each time streak hits 3+)
 * - Floor: 0, Ceiling: 100
 */
export function calculateRiskScore(payments: Payment[]): RiskScore {
  let score = 100

  let missed = 0
  let late = 0
  let veryLate = 0

  // Sort by due date ascending to process streak correctly
  const sorted = [...payments].sort(
    (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  )

  let currentStreak = 0
  let streakBonuses = 0

  for (const p of sorted) {
    if (p.status === 'missed') {
      score -= 20
      missed++
      currentStreak = 0
    } else if (p.status === 'late' || p.status === 'paid') {
      // Determine if it was actually late
      const isLate =
        p.status === 'late' ||
        (p.paid_date !== null &&
          new Date(p.paid_date) > new Date(p.due_date))

      if (isLate) {
        score -= 8
        late++
        currentStreak = 0

        // Extra penalty if >14 days late
        if (p.paid_date) {
          const daysLate = Math.floor(
            (new Date(p.paid_date).getTime() - new Date(p.due_date).getTime()) /
              (1000 * 60 * 60 * 24)
          )
          if (daysLate > 14) {
            score -= 5
            veryLate++
          }
        }
      } else {
        // On time
        currentStreak++
        if (currentStreak >= 3 && currentStreak % 3 === 0) {
          score += 10
          streakBonuses++
        }
      }
    }
  }

  score = Math.max(0, Math.min(100, score))

  let colour: RiskScore['colour']
  let label: string
  if (score >= 80) {
    colour = 'green'
    label = 'Low Risk'
  } else if (score >= 50) {
    colour = 'amber'
    label = 'Medium Risk'
  } else {
    colour = 'red'
    label = 'High Risk'
  }

  return {
    score,
    colour,
    label,
    breakdown: { missed, late, veryLate, streak: streakBonuses },
  }
}
