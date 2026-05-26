// ─── Existing types ───────────────────────────────────────────────────────────

export type Profile = {
  id: string
  full_name: string
  email: string
  created_at: string
}

export type Property = {
  id: string
  owner_id: string
  name: string
  address: string
  created_at: string
}

export type Tenant = {
  id: string
  property_id: string
  full_name: string
  email: string
  phone: string
  lease_start: string
  lease_end: string
  monthly_rent: number // in cents
  access_token: string // unique tenant portal token
  created_at: string
}

export type Payment = {
  id: string
  tenant_id: string
  amount: number // in cents
  due_date: string
  paid_date: string | null
  status: 'paid' | 'late' | 'missed'
  created_at: string
}

export type RiskScore = {
  score: number
  colour: 'green' | 'amber' | 'red'
  label: string
  breakdown: {
    missed: number
    late: number
    veryLate: number
    streak: number
  }
}

export type TenantWithRisk = Tenant & {
  risk: RiskScore
  payments: Payment[]
}

export type PropertyWithTenants = Property & {
  tenants: TenantWithRisk[]
}


// ─── Credit check & tenant verification ──────────────────────────────────────

export type ApplicationStatus = 'pending' | 'approved' | 'rejected'
export type RatioFlag = 'green' | 'amber' | 'red'
export type CitizenType = 'citizen' | 'permanent_resident'
export type Gender = 'male' | 'female'
export type ReferenceResponse = 'positive' | 'neutral' | 'negative' | 'no_response'

/** Result of validating a SA 13-digit ID number */
export type IdVerification = {
  valid: boolean
  checksumValid: boolean
  dob: string | null          // YYYY-MM-DD
  gender: Gender | null
  citizenType: CitizenType | null
  ageInYears: number | null
  errors: string[]
}

/** Single parsed bank transaction */
export type BankTransaction = {
  date: string
  description: string
  amount: number              // cents; positive = credit, negative = debit
  balance?: number            // cents
  type: 'income' | 'expense' | 'bounced_do' | 'gambling' | 'rental' | 'other'
  flags: string[]
}

/** Per-month summary derived from parsed transactions */
export type MonthlyBreakdown = {
  month: string               // YYYY-MM
  income: number              // cents total credits
  expenses: number            // cents total debits (positive)
  closingBalance: number      // cents
  hasSalary: boolean
  bouncedDoCount: number
  gamblingCount: number
}

/** Full result of parsing and analysing a bank statement PDF */
export type BankStatementAnalysis = {
  bank: string | null
  accountNumber: string | null
  avgMonthlyIncome: number    // cents
  avgMonthlyExpenses: number  // cents
  avgMonthlyBalance: number   // cents
  salaryMonths: number        // how many months had a salary deposit
  totalMonthsAnalyzed: number
  bouncedDos: BankTransaction[]
  gamblingTransactions: BankTransaction[]
  rentalPayments: BankTransaction[]
  largeCashDeposits: BankTransaction[]
  monthlyBreakdowns: MonthlyBreakdown[]
  parseWarnings: string[]
  rawTextLength: number
}

/** Single reference check entry */
export type ReferenceCheck = {
  id: string
  landlordName: string
  contact: string
  contacted: boolean
  response: ReferenceResponse
  notes: string
  createdAt: string
}

/** Breakdown of how the combined credit score was calculated */
export type CreditScoreBreakdown = {
  bankHealth: {
    score: number
    max: 40
    incomeRegularity: number
    bouncedDoPenalty: number
    gamblingPenalty: number
  }
  ratio: {
    score: number
    max: 25
    flag: RatioFlag | null
    percent: number | null
  }
  idVerification: {
    score: number
    max: 15
    checksumPoints: number
    fraudFlagPenalty: number
  }
  referenceCheck: {
    score: number
    max: 20
    response: ReferenceResponse | null
  }
}

/** Full tenant application record */
export type TenantApplication = {
  id: string
  property_id: string
  full_name: string
  email: string
  phone: string | null
  id_number: string | null
  monthly_income_cents: number | null
  requested_rent_cents: number | null
  id_verification: IdVerification
  bank_statement_filename: string | null
  bank_statement_analysis: BankStatementAnalysis
  ratio_flag: RatioFlag | null
  ratio_percent: number | null
  fraud_flags: string[]
  reference_checks: ReferenceCheck[]
  credit_score: number | null
  credit_score_breakdown: CreditScoreBreakdown | null
  status: ApplicationStatus
  landlord_notes: string | null
  created_at: string
  updated_at: string
}


// ─── Communications & tenant engagement ──────────────────────────────────────

export type CommunicationType =
  | 'payment_before_3d'
  | 'payment_due_today'
  | 'payment_late_3d'
  | 'payment_late_7d'
  | 'payment_late_14d'
  | 'monthly_checkin'

export type CommunicationLog = {
  id: string
  tenant_id: string
  type: CommunicationType
  subject: string | null
  to_email: string | null
  resend_id: string | null
  status: 'sent' | 'failed'
  metadata: Record<string, unknown>
  sent_at: string
}

export type QueryCategory  = 'emergency' | 'maintenance' | 'general'
export type QueryStatus    = 'open' | 'in_progress' | 'resolved'

export type TenantQuery = {
  id: string
  tenant_id: string
  category: QueryCategory
  subcategory: string | null
  title: string
  description: string
  status: QueryStatus
  landlord_notes: string | null
  created_at: string
  updated_at: string
}

export type CheckinResponse = {
  id: string
  tenant_id: string
  month: string          // YYYY-MM
  token: string
  unit_working: boolean | null
  maintenance_needed: boolean | null
  maintenance_details: string | null
  flag_text: string | null
  sent_at: string
  responded_at: string | null
}


// ─── Intelligence features ────────────────────────────────────────────────────

export type ComponentTypeKey =
  | 'geyser' | 'roof' | 'paint_interior' | 'paint_exterior'
  | 'plumbing' | 'electrical' | 'carpets' | 'appliance'
  | 'hvac' | 'windows_doors' | 'driveway' | 'other'

export type PropertyComponent = {
  id:                 string
  property_id:        string
  component_type:     ComponentTypeKey
  name:               string
  installed_date:     string   // YYYY-MM-DD
  lifespan_min_years: number
  lifespan_max_years: number
  brand:              string | null
  model_number:       string | null
  notes:              string | null
  last_serviced_date: string | null
  created_at:         string
  updated_at:         string
}

export type JobStatus = 'draft' | 'sent' | 'quote_received' | 'approved' | 'declined' | 'completed'
export type JobUrgency = 'urgent' | 'normal' | 'planned'

export type MaintenanceJob = {
  id:                    string
  property_id:           string
  component_id:          string | null
  tenant_query_id:       string | null
  title:                 string
  generated_description: string | null
  final_description:     string | null
  urgency:               JobUrgency
  contractor_name:       string | null
  contractor_email:      string | null
  contractor_phone:      string | null
  quote_text:            string | null
  quote_amount_cents:    number | null
  quote_summary:         string | null
  quote_received_at:     string | null
  status:                JobStatus
  landlord_notes:        string | null
  created_at:            string
  updated_at:            string
}

export type BodyCorpFlagCategory =
  | 'special_levy' | 'maintenance' | 'legal' | 'financial' | 'action_required'

export type BodyCorpDocument = {
  id:            string
  property_id:   string
  title:         string
  source:        'pdf' | 'text_paste'
  filename:      string | null
  raw_text:      string | null
  meeting_date:  string | null
  claude_summary: string | null
  flag_count:    { red: number; amber: number; green: number }
  created_at:    string
}

export type BodyCorpFlag = {
  id:                   string
  document_id:          string
  property_id:          string
  category:             BodyCorpFlagCategory
  severity:             'red' | 'amber' | 'green'
  title:                string
  description:          string
  amount_zar:           number | null
  due_date:             string | null
  requires_owner_action: boolean
  resolved:             boolean
  created_at:           string
}
