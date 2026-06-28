import type {
  BankStatementAnalysis,
  IdVerification,
  ReferenceCheck,
  RatioFlag,
  CreditScoreBreakdown,
  ReferenceResponse,
} from "./types";

// ─── Salary-to-rent ratio ─────────────────────────────────────────────────────

/**
 * Calculate the rent-to-income ratio and return a traffic-light flag.
 * Rule: rent should not exceed 30% of net monthly income.
 *   Green  < 25%
 *   Amber  25–33%
 *   Red    > 33%
 */
export function calcRatioFlag(
  rentCents: number,
  incomeCents: number,
): { flag: RatioFlag; percent: number } {
  if (incomeCents <= 0) return { flag: "red", percent: 100 };
  const percent = (rentCents / incomeCents) * 100;
  const flag: RatioFlag =
    percent < 25 ? "green" : percent <= 33 ? "amber" : "red";
  return { flag, percent: Math.round(percent * 100) / 100 };
}

// ─── Fraud flag detection ─────────────────────────────────────────────────────

export interface FraudCheckInputs {
  idVerification: IdVerification;
  statedAgeInYears: number | null; // from form field (if collected separately)
  bankAnalysis: BankStatementAnalysis;
  duplicateIdFound: boolean; // caller must check DB
  bankFilename: string | null; // original upload filename
}

/**
 * Produce a list of fraud flag strings for a given application.
 */
export function detectFraudFlags(inputs: FraudCheckInputs): string[] {
  const flags: string[] = [];

  const {
    idVerification,
    statedAgeInYears,
    bankAnalysis,
    duplicateIdFound,
    bankFilename,
  } = inputs;

  // 1. ID date-of-birth doesn't match stated age (tolerance ±1 year)
  if (
    statedAgeInYears !== null &&
    idVerification.ageInYears !== null &&
    Math.abs(idVerification.ageInYears - statedAgeInYears) > 1
  ) {
    flags.push("DOB_MISMATCH");
  }

  // 2. Duplicate ID number already in the system
  if (duplicateIdFound) {
    flags.push("DUPLICATE_ID_IN_SYSTEM");
  }

  // 3. Bank statement filename doesn't match detected bank
  if (bankFilename && bankAnalysis.bank) {
    const fname = bankFilename.toLowerCase();
    const bankName = bankAnalysis.bank.toLowerCase();

    const bankFileHints: Record<string, string[]> = {
      fnb: ["fnb", "first national"],
      "standard bank": ["standard", "std bank", "stanbic"],
      nedbank: ["nedbank", "ned"],
      absa: ["absa"],
      capitec: ["capitec", "cap"],
    };
    const hints = bankFileHints[bankName] ?? [];
    const filenameMatchesBank = hints.some((h) => fname.includes(h));

    // Flag if none of the bank's hints appear in the filename AND filename
    // mentions a different known bank
    const otherBanksMentioned = Object.values(bankFileHints)
      .flat()
      .filter((h) => !hints.includes(h))
      .some((h) => fname.includes(h));

    if (!filenameMatchesBank && otherBanksMentioned) {
      flags.push("FILENAME_BANK_MISMATCH");
    }
  }

  // 4. Income deposits irregular (salary present in fewer than 10 of 12 months)
  if (
    bankAnalysis.totalMonthsAnalyzed >= 3 &&
    bankAnalysis.salaryMonths <
      Math.floor(bankAnalysis.totalMonthsAnalyzed * 0.83)
  ) {
    flags.push("IRREGULAR_INCOME");
  }

  // 5. Large unexplained cash deposits over R20,000
  if (bankAnalysis.largeCashDeposits.length > 0) {
    flags.push("LARGE_CASH_DEPOSIT");
  }

  return flags;
}

// ─── Combined credit score ────────────────────────────────────────────────────

export interface CreditScoreInputs {
  bankAnalysis: BankStatementAnalysis;
  rentCents: number;
  incomeCents: number;
  idVerification: IdVerification;
  fraudFlags: string[];
  referenceChecks: ReferenceCheck[];
}

/**
 * Calculate the combined credit score (0–100) and a full breakdown.
 *
 * Scoring weights:
 *   Bank statement health  40 pts
 *   Salary-to-rent ratio   25 pts
 *   ID verification        15 pts
 *   Reference check        20 pts
 */
export function calcCreditScore(inputs: CreditScoreInputs): {
  score: number;
  breakdown: CreditScoreBreakdown;
} {
  const {
    bankAnalysis,
    rentCents,
    incomeCents,
    idVerification,
    fraudFlags,
    referenceChecks,
  } = inputs;

  // ── 1. Bank statement health (40 pts) ────────────────────────────────────────
  //    Income regularity  → up to 20 pts
  const totalMonths = bankAnalysis.totalMonthsAnalyzed || 1;
  const salaryRatio = bankAnalysis.salaryMonths / totalMonths;
  const incomePoints = Math.round(
    salaryRatio >= 1
      ? 20
      : salaryRatio >= 0.83
        ? 15
        : salaryRatio >= 0.67
          ? 10
          : salaryRatio >= 0.5
            ? 5
            : 0,
  );

  //    Bounced debit orders → up to 10 pts
  const bouncedCount = bankAnalysis.bouncedDos.length;
  const bouncedPoints = Math.max(0, 10 - bouncedCount * 3);

  //    Gambling → up to 10 pts
  const gamblingCount = bankAnalysis.gamblingTransactions.length;
  const gamblingPoints = Math.max(0, 10 - gamblingCount * 2);

  const bankHealthScore = Math.min(
    40,
    incomePoints + bouncedPoints + gamblingPoints,
  );

  // ── 2. Salary-to-rent ratio (25 pts) ────────────────────────────────────────
  let ratioScore = 12; // neutral if no data
  let ratioFlag: RatioFlag | null = null;
  let ratioPercent: number | null = null;

  if (rentCents > 0 && incomeCents > 0) {
    const result = calcRatioFlag(rentCents, incomeCents);
    ratioFlag = result.flag;
    ratioPercent = result.percent;
    ratioScore =
      result.flag === "green" ? 25 : result.flag === "amber" ? 15 : 5;
  }

  // ── 3. ID verification (15 pts) ─────────────────────────────────────────────
  const checksumPoints = idVerification.checksumValid ? 8 : 0;
  const idFraudFlags = fraudFlags.filter(
    (f) => f === "DOB_MISMATCH" || f === "DUPLICATE_ID_IN_SYSTEM",
  );
  const fraudFlagPenalty = Math.min(7, idFraudFlags.length * 4);
  const idScore = Math.max(0, checksumPoints + 7 - fraudFlagPenalty);

  // ── 4. Reference check (20 pts) ─────────────────────────────────────────────
  // Use the most impactful response across all references
  const responseRank: Record<ReferenceResponse, number> = {
    positive: 3,
    neutral: 2,
    no_response: 1,
    negative: 0,
  };

  let bestResponse: ReferenceResponse | null = null;
  let refScore = 10; // no references yet = neutral

  if (referenceChecks.length > 0) {
    const contacted = referenceChecks.filter((r) => r.contacted);
    if (contacted.length > 0) {
      bestResponse = contacted.reduce<ReferenceResponse>(
        (best, r) =>
          responseRank[r.response] > responseRank[best] ? r.response : best,
        contacted[0].response,
      );
      refScore =
        bestResponse === "positive"
          ? 20
          : bestResponse === "neutral"
            ? 12
            : bestResponse === "no_response"
              ? 10
              : 0;
    }
  }

  // ── Total ────────────────────────────────────────────────────────────────────
  const total = Math.max(
    0,
    Math.min(100, bankHealthScore + ratioScore + idScore + refScore),
  );

  const breakdown: CreditScoreBreakdown = {
    bankHealth: {
      score: bankHealthScore,
      max: 40,
      incomeRegularity: incomePoints,
      bouncedDoPenalty: 10 - bouncedPoints,
      gamblingPenalty: 10 - gamblingPoints,
    },
    ratio: {
      score: ratioScore,
      max: 25,
      flag: ratioFlag,
      percent: ratioPercent,
    },
    idVerification: {
      score: idScore,
      max: 15,
      checksumPoints,
      fraudFlagPenalty,
    },
    referenceCheck: {
      score: refScore,
      max: 20,
      response: bestResponse,
    },
  };

  return { score: total, breakdown };
}

/** Map a credit score to a colour label */
export function creditScoreColour(score: number): "green" | "amber" | "red" {
  return score >= 75 ? "green" : score >= 50 ? "amber" : "red";
}

/** Human-readable label */
export function creditScoreLabel(score: number): string {
  return score >= 75 ? "Strong" : score >= 50 ? "Moderate" : "Weak";
}
