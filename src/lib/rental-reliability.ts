export type ConfidenceLevel = "Low" | "Medium" | "High";

export type BureauProvider = "TPN" | "TransUnion" | "Experian" | "XDS" | "Mock";

export type BureauItemType =
  | "minor_telecom"
  | "student_debt"
  | "old_default"
  | "recent_default"
  | "judgment"
  | "debt_review"
  | "fraud_flag"
  | "repeated_missed_payments";

export interface RentalPaymentEvidenceInput {
  month: string;
  status: "on_time" | "late" | "missed" | "partial" | "inconsistent";
  daysLate?: number;
  verified: boolean;
  source: "bank_statement" | "proof_of_payment" | "landlord_reference" | "tpn" | "mock";
}

export interface BureauRiskItem {
  type: BureauItemType;
  ageMonths: number;
  amountBand: "small" | "medium" | "large" | "unknown";
  disputed?: boolean;
  settled?: boolean;
}

export interface RentalReliabilityInput {
  tenantName: string;
  monthlyIncome: number;
  rentAmount: number;
  incomeVerified: boolean;
  incomeMonthsVerified: number;
  employmentStabilityMonths?: number;
  bureauConsentGranted: boolean;
  bureauProvider?: BureauProvider;
  bureauScoreBand?: "poor" | "fair" | "good" | "excellent" | "thin_file" | "no_hit";
  bureauItems?: BureauRiskItem[];
  rentalPayments: RentalPaymentEvidenceInput[];
  landlordReference?: {
    verified: boolean;
    wouldRentAgain?: boolean;
    paymentComment?: "positive" | "mixed" | "negative";
  };
  documents: Array<{
    type: "lease" | "income" | "bank_statement" | "proof_of_payment" | "id";
    verified: boolean;
    confidence: ConfidenceLevel;
  }>;
  profileCompleteness: number;
}

export interface ScoreComponent {
  key:
    | "rental_payment_history"
    | "affordability_income"
    | "bureau_credit_behaviour"
    | "adverse_events"
    | "document_confidence"
    | "landlord_reference"
    | "profile_completeness";
  label: string;
  weight: number;
  points: number;
  maxPoints: number;
  explanation: string;
}

export interface RentalReliabilityScore {
  score: number;
  confidence: ConfidenceLevel;
  band: "Limited" | "Moderate" | "High" | "Excellent";
  summary: string;
  components: ScoreComponent[];
  positiveFactors: string[];
  negativeFactors: string[];
  tenantActions: string[];
  landlordSummary: {
    paymentConfidence: ConfidenceLevel;
    affordabilityConfidence: ConfidenceLevel;
    verificationBadges: string[];
    warningFlags: string[];
    sensitiveDataHidden: true;
  };
}

const componentWeights = {
  rental_payment_history: 35,
  affordability_income: 20,
  bureau_credit_behaviour: 15,
  adverse_events: 10,
  document_confidence: 10,
  landlord_reference: 5,
  profile_completeness: 5,
} as const;

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function roundPoints(value: number) {
  return Math.round(value * 10) / 10;
}

function component(
  key: ScoreComponent["key"],
  normalized: number,
  explanation: string,
): ScoreComponent {
  const weight = componentWeights[key];
  const labels: Record<ScoreComponent["key"], string> = {
    rental_payment_history: "Verified rental payment history",
    affordability_income: "Affordability and income stability",
    bureau_credit_behaviour: "Bureau credit behaviour",
    adverse_events: "Adverse legal/default events",
    document_confidence: "Document confidence",
    landlord_reference: "Landlord/reference confidence",
    profile_completeness: "Profile completeness",
  };

  return {
    key,
    label: labels[key],
    weight,
    points: roundPoints(clamp(normalized, 0, 1) * weight),
    maxPoints: weight,
    explanation,
  };
}

function scoreRentalPayments(payments: RentalPaymentEvidenceInput[]) {
  const verified = payments.filter((payment) => payment.verified);
  const recent = verified.slice(-6);
  if (verified.length === 0) {
    return {
      normalized: 0.25,
      confidence: "Low" as ConfidenceLevel,
      explanation: "No verified rental payment history has been supplied yet.",
    };
  }

  let normalized = 0.45;
  const onTime = recent.filter((payment) => payment.status === "on_time").length;
  const late = recent.filter((payment) => payment.status === "late").length;
  const missed = recent.filter((payment) => payment.status === "missed").length;
  const partial = recent.filter((payment) => payment.status === "partial").length;
  const inconsistent = recent.filter((payment) => payment.status === "inconsistent").length;

  normalized += Math.min(0.38, verified.length * 0.095);
  normalized += onTime * 0.045;
  normalized -= late * 0.09;
  normalized -= partial * 0.16;
  normalized -= missed * 0.28;
  normalized -= inconsistent * 0.18;

  if (verified.length >= 3 && verified.slice(-3).every((payment) => payment.status === "on_time")) {
    normalized += 0.14;
  }

  const confidence: ConfidenceLevel =
    verified.length >= 3 && verified.every((payment) => payment.verified)
      ? "High"
      : verified.length >= 2
        ? "Medium"
        : "Low";

  return {
    normalized: clamp(normalized, 0, 1),
    confidence,
    explanation:
      verified.length >= 3
        ? `${verified.length} verified rental payments supplied; ${onTime} of the most recent ${recent.length} were on time.`
        : `${verified.length} verified rental payment${verified.length === 1 ? "" : "s"} supplied, so rental history confidence is still building.`,
  };
}

function scoreAffordability(input: RentalReliabilityInput) {
  if (!input.incomeVerified || input.monthlyIncome <= 0 || input.rentAmount <= 0) {
    return {
      normalized: 0.25,
      confidence: "Low" as ConfidenceLevel,
      explanation: "Affordability is low-confidence because verified income is missing.",
    };
  }

  const ratio = input.rentAmount / input.monthlyIncome;
  let normalized = ratio <= 0.3 ? 0.95 : ratio <= 0.35 ? 0.82 : ratio <= 0.4 ? 0.62 : ratio <= 0.45 ? 0.38 : 0.14;
  if (input.incomeMonthsVerified >= 3) normalized += 0.05;
  if ((input.employmentStabilityMonths ?? 0) >= 12) normalized += 0.04;

  return {
    normalized: clamp(normalized, 0, 1),
    confidence: input.incomeMonthsVerified >= 3 ? ("High" as ConfidenceLevel) : ("Medium" as ConfidenceLevel),
    explanation: `Rent is ${Math.round(ratio * 100)}% of verified monthly income.`,
  };
}

function scoreBureau(input: RentalReliabilityInput) {
  if (!input.bureauConsentGranted) {
    const hasStrongRent = input.rentalPayments.filter((payment) => payment.verified && payment.status === "on_time").length >= 3;
    return {
      normalized: hasStrongRent ? 0.72 : 0.5,
      explanation: hasStrongRent
        ? "No bureau check was run; verified rental payment proof reduces bureau dependency."
        : "No bureau check was run because tenant consent has not been captured.",
    };
  }

  if (input.bureauScoreBand === "thin_file" || input.bureauScoreBand === "no_hit") {
    return {
      normalized: 0.62,
      explanation: "Bureau file is thin or unavailable, so the model relies more on rental and income evidence.",
    };
  }

  const baseByBand = {
    poor: 0.42,
    fair: 0.62,
    good: 0.82,
    excellent: 0.94,
    thin_file: 0.62,
    no_hit: 0.62,
  };

  let normalized = baseByBand[input.bureauScoreBand ?? "fair"];
  for (const item of input.bureauItems ?? []) {
    if (item.disputed) {
      normalized -= 0.02;
      continue;
    }
    if (item.type === "minor_telecom" || item.type === "student_debt" || item.type === "old_default") {
      normalized -= item.ageMonths > 24 || item.settled ? 0.03 : 0.08;
    } else if (item.type === "recent_default" || item.type === "repeated_missed_payments") {
      normalized -= 0.18;
    } else {
      normalized -= 0.42;
    }
  }

  return {
    normalized: clamp(normalized, 0, 1),
    explanation: `Bureau result was ${input.bureauScoreBand ?? "available"} and interpreted as one component, not an automatic pass/fail.`,
  };
}

function scoreAdverseEvents(input: RentalReliabilityInput) {
  let normalized = 1;
  const activeItems = (input.bureauItems ?? []).filter((item) => !item.disputed);
  for (const item of activeItems) {
    if (item.type === "judgment" || item.type === "fraud_flag" || item.type === "debt_review") {
      normalized -= item.ageMonths <= 12 ? 0.75 : 0.32;
    }
    if (item.type === "recent_default") normalized -= 0.22;
    if (item.type === "repeated_missed_payments") normalized -= 0.2;
  }

  const explanation =
    normalized >= 0.9
      ? "No serious unresolved adverse legal/default events are present in the mock data."
      : "Serious or recent adverse events require review even when other evidence is positive.";

  return { normalized: clamp(normalized, 0, 1), explanation };
}

function scoreDocuments(input: RentalReliabilityInput) {
  if (input.documents.length === 0) {
    return {
      normalized: 0.2,
      confidence: "Low" as ConfidenceLevel,
      explanation: "No verification documents have been supplied.",
    };
  }

  const values = input.documents.map((doc) => {
    if (!doc.verified) return 0.2;
    if (doc.confidence === "High") return 1;
    if (doc.confidence === "Medium") return 0.72;
    return 0.45;
  });
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  const highCount = input.documents.filter((doc) => doc.verified && doc.confidence === "High").length;

  return {
    normalized: average,
    confidence: highCount >= 3 ? ("High" as ConfidenceLevel) : highCount >= 1 ? ("Medium" as ConfidenceLevel) : ("Low" as ConfidenceLevel),
    explanation: `${input.documents.filter((doc) => doc.verified).length} of ${input.documents.length} submitted documents are verified.`,
  };
}

function scoreReference(input: RentalReliabilityInput) {
  const reference = input.landlordReference;
  if (!reference?.verified) {
    return {
      normalized: 0.45,
      confidence: "Low" as ConfidenceLevel,
      explanation: "No verified landlord or lease reference is available yet.",
    };
  }

  let normalized = 0.65;
  if (reference.wouldRentAgain) normalized += 0.25;
  if (reference.paymentComment === "positive") normalized += 0.1;
  if (reference.paymentComment === "mixed") normalized -= 0.1;
  if (reference.paymentComment === "negative" || reference.wouldRentAgain === false) normalized -= 0.35;

  return {
    normalized: clamp(normalized, 0, 1),
    confidence: "High" as ConfidenceLevel,
    explanation: "A verified landlord/reference response is included in the score.",
  };
}

function combineConfidence(levels: ConfidenceLevel[]): ConfidenceLevel {
  const value = levels.reduce((sum, level) => sum + (level === "High" ? 2 : level === "Medium" ? 1 : 0), 0) / levels.length;
  if (value >= 1.45) return "High";
  if (value >= 0.75) return "Medium";
  return "Low";
}

function bandFor(score: number): RentalReliabilityScore["band"] {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "High";
  if (score >= 55) return "Moderate";
  return "Limited";
}

export function calculateRentalReliabilityScore(input: RentalReliabilityInput): RentalReliabilityScore {
  const rental = scoreRentalPayments(input.rentalPayments);
  const affordability = scoreAffordability(input);
  const bureau = scoreBureau(input);
  const adverse = scoreAdverseEvents(input);
  const docs = scoreDocuments(input);
  const reference = scoreReference(input);

  const components = [
    component("rental_payment_history", rental.normalized, rental.explanation),
    component("affordability_income", affordability.normalized, affordability.explanation),
    component("bureau_credit_behaviour", bureau.normalized, bureau.explanation),
    component("adverse_events", adverse.normalized, adverse.explanation),
    component("document_confidence", docs.normalized, docs.explanation),
    component("landlord_reference", reference.normalized, reference.explanation),
    component("profile_completeness", input.profileCompleteness, `${Math.round(clamp(input.profileCompleteness, 0, 1) * 100)}% of profile fields are complete.`),
  ];

  const score = Math.round(components.reduce((sum, item) => sum + item.points, 0));
  const confidence = combineConfidence([rental.confidence, affordability.confidence, docs.confidence, reference.confidence]);
  const band = bandFor(score);
  const verifiedOnTime = input.rentalPayments.filter((payment) => payment.verified && payment.status === "on_time").length;
  const seriousItems = (input.bureauItems ?? []).filter((item) => ["judgment", "debt_review", "fraud_flag", "recent_default"].includes(item.type) && !item.disputed);
  const disputedItems = (input.bureauItems ?? []).filter((item) => item.disputed);

  const positiveFactors = [
    verifiedOnTime >= 3 ? `${verifiedOnTime} verified on-time rental payments strongly support reliability.` : "",
    affordability.normalized >= 0.75 ? affordability.explanation : "",
    docs.confidence === "High" ? "Core documents have high verification confidence." : "",
    reference.normalized >= 0.8 ? "Verified landlord reference is positive." : "",
  ].filter(Boolean);

  const negativeFactors = [
    rental.normalized < 0.55 ? rental.explanation : "",
    affordability.normalized < 0.5 ? affordability.explanation : "",
    seriousItems.length > 0 ? "Serious or recent adverse bureau indicators require human review." : "",
    disputedItems.length > 0 ? "One or more bureau items are disputed and should be reviewed with tenant context." : "",
    docs.normalized < 0.5 ? docs.explanation : "",
  ].filter(Boolean);

  const tenantActions = [
    verifiedOnTime < 3 ? "Upload at least three months of verifiable rent payment proof." : "",
    !input.bureauConsentGranted && verifiedOnTime < 3 ? "Give explicit consent for an optional bureau check or add more rental evidence." : "",
    affordability.confidence !== "High" ? "Add recent payslips or bank-statement extracts to improve affordability confidence." : "",
    reference.confidence !== "High" ? "Request a landlord or managing-agent reference." : "",
    disputedItems.length > 0 ? "Add an explanation or supporting documents for disputed bureau information." : "",
  ].filter(Boolean);

  return {
    score,
    confidence,
    band,
    summary: `Score: ${score}/100. ${band} rental reliability. ${positiveFactors[0] ?? "Evidence is still being built."}`,
    components,
    positiveFactors,
    negativeFactors,
    tenantActions,
    landlordSummary: {
      paymentConfidence: rental.confidence,
      affordabilityConfidence: affordability.confidence,
      verificationBadges: [
        input.bureauConsentGranted ? `Bureau consent captured${input.bureauProvider ? `: ${input.bureauProvider}` : ""}` : "",
        verifiedOnTime >= 3 ? "3+ verified on-time rent payments" : "",
        input.incomeVerified ? "Income evidence verified" : "",
        docs.confidence === "High" ? "High document confidence" : "",
      ].filter(Boolean),
      warningFlags: [
        seriousItems.length > 0 ? "Adverse event review recommended" : "",
        affordability.normalized < 0.5 ? "Affordability pressure indicated" : "",
        rental.normalized < 0.55 ? "Rental payment evidence incomplete or inconsistent" : "",
        disputedItems.length > 0 ? "Tenant dispute or explanation pending" : "",
      ].filter(Boolean),
      sensitiveDataHidden: true,
    },
  };
}

export const mockRentalReliabilityProfiles: RentalReliabilityInput[] = [
  {
    tenantName: "Lerato Mokoena",
    monthlyIncome: 36000,
    rentAmount: 9800,
    incomeVerified: true,
    incomeMonthsVerified: 3,
    employmentStabilityMonths: 18,
    bureauConsentGranted: true,
    bureauProvider: "TPN",
    bureauScoreBand: "poor",
    bureauItems: [{ type: "minor_telecom", ageMonths: 30, amountBand: "small", settled: true }],
    rentalPayments: [
      { month: "2026-04", status: "on_time", verified: true, source: "proof_of_payment" },
      { month: "2026-05", status: "on_time", verified: true, source: "proof_of_payment" },
      { month: "2026-06", status: "on_time", verified: true, source: "proof_of_payment" },
    ],
    landlordReference: { verified: true, wouldRentAgain: true, paymentComment: "positive" },
    documents: [
      { type: "lease", verified: true, confidence: "High" },
      { type: "income", verified: true, confidence: "High" },
      { type: "proof_of_payment", verified: true, confidence: "High" },
      { type: "id", verified: true, confidence: "Medium" },
    ],
    profileCompleteness: 0.92,
  },
  {
    tenantName: "Aiden Naidoo",
    monthlyIncome: 42000,
    rentAmount: 11800,
    incomeVerified: true,
    incomeMonthsVerified: 3,
    employmentStabilityMonths: 9,
    bureauConsentGranted: true,
    bureauProvider: "TransUnion",
    bureauScoreBand: "thin_file",
    rentalPayments: [
      { month: "2026-04", status: "on_time", verified: true, source: "bank_statement" },
      { month: "2026-05", status: "on_time", verified: true, source: "bank_statement" },
      { month: "2026-06", status: "on_time", verified: true, source: "bank_statement" },
    ],
    landlordReference: { verified: false },
    documents: [
      { type: "lease", verified: true, confidence: "Medium" },
      { type: "income", verified: true, confidence: "High" },
      { type: "bank_statement", verified: true, confidence: "High" },
    ],
    profileCompleteness: 0.86,
  },
  {
    tenantName: "Maya Petersen",
    monthlyIncome: 22000,
    rentAmount: 12500,
    incomeVerified: true,
    incomeMonthsVerified: 1,
    bureauConsentGranted: true,
    bureauProvider: "Experian",
    bureauScoreBand: "excellent",
    rentalPayments: [],
    documents: [{ type: "id", verified: true, confidence: "Medium" }],
    profileCompleteness: 0.58,
  },
  {
    tenantName: "Thabo Dlamini",
    monthlyIncome: 51000,
    rentAmount: 13500,
    incomeVerified: true,
    incomeMonthsVerified: 3,
    employmentStabilityMonths: 24,
    bureauConsentGranted: true,
    bureauProvider: "XDS",
    bureauScoreBand: "fair",
    bureauItems: [{ type: "judgment", ageMonths: 5, amountBand: "large" }],
    rentalPayments: [
      { month: "2026-04", status: "on_time", verified: true, source: "proof_of_payment" },
      { month: "2026-05", status: "on_time", verified: true, source: "proof_of_payment" },
      { month: "2026-06", status: "on_time", verified: true, source: "proof_of_payment" },
    ],
    documents: [
      { type: "lease", verified: true, confidence: "High" },
      { type: "income", verified: true, confidence: "High" },
      { type: "proof_of_payment", verified: true, confidence: "High" },
    ],
    profileCompleteness: 0.9,
  },
  {
    tenantName: "Nandi Jacobs",
    monthlyIncome: 33000,
    rentAmount: 10000,
    incomeVerified: false,
    incomeMonthsVerified: 0,
    bureauConsentGranted: false,
    rentalPayments: [
      { month: "2026-04", status: "on_time", verified: true, source: "proof_of_payment" },
      { month: "2026-05", status: "inconsistent", verified: true, source: "proof_of_payment" },
    ],
    documents: [{ type: "proof_of_payment", verified: false, confidence: "Low" }],
    profileCompleteness: 0.42,
  },
];
