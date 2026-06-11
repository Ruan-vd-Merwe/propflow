// ─── Existing types ───────────────────────────────────────────────────────────

export type UserType = "landlord" | "tenant";

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  user_type: UserType | null;
  is_landlord: boolean;
  is_tenant: boolean;
  phone: string | null;
  province: string | null;
  city: string | null;
  created_at: string;
};

export type Property = {
  id: string;
  owner_id: string;
  name: string;
  address: string;
  created_at: string;
};

// Extended property with marketplace fields (all nullable for backward compat)
export type PropertyListing = Property & {
  property_type: "apartment" | "house" | "townhouse" | "room" | null;
  bedrooms: number | null;
  asking_rent: number | null; // cents
  available_from: string | null;
  suburb: string | null;
  province: string | null;
  description: string | null;
  is_listed: boolean;
  photos: string[];
  // tag columns added in migration_property_tags.sql
  floor_size_m2: number | null;
  pets_allowed: boolean | null;
  parking_available: boolean | null;
  fibre_available: boolean | null;
  property_tags: string[];
  area_tags: string[];
  lifestyle_tags: string[];
};

// ─── Marketplace ──────────────────────────────────────────────────────────────

export type TenantProfile = {
  id: string;
  user_id: string;
  sa_id_number: string | null;
  looking_in_area: string | null;
  looking_in_province: string | null;
  current_area: string | null;
  current_province: string | null;
  budget_min: number | null; // cents
  budget_max: number | null; // cents
  move_in_date: string | null; // YYYY-MM-DD
  lease_length_months: number | null;
  employment_status: "employed" | "self_employed" | "student" | "other" | null;
  monthly_income: number | null; // cents (net)
  is_visible: boolean;
  created_at: string;
  updated_at: string;
};

export type IntroductionRequest = {
  id: string;
  landlord_id: string;
  tenant_id: string;
  property_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
};

export type MatchScore = {
  total: number; // 0–100
  budget: number; // 0–30
  area: number; // 0–25
  income: number; // 0–25  (affordability proxy)
  date: number; // 0–20
};

export type TenantMatch = {
  profile: Pick<Profile, "id" | "full_name" | "email">;
  tenantProfile: TenantProfile;
  match: MatchScore;
};

export type Tenant = {
  id: string;
  property_id: string;
  full_name: string;
  email: string;
  phone: string;
  lease_start: string;
  lease_end: string;
  monthly_rent: number; // in cents
  access_token: string; // hex token (legacy portal lookup)
  portal_token: string; // UUID token — use in shareable /tenant/[token] links
  created_at: string;
};

export type Payment = {
  id: string;
  tenant_id: string;
  amount: number; // in cents
  due_date: string;
  paid_date: string | null;
  status: "paid" | "late" | "missed";
  created_at: string;
};

export type RiskScore = {
  score: number;
  colour: "green" | "amber" | "red";
  label: string;
  breakdown: {
    missed: number;
    late: number;
    veryLate: number;
    streak: number;
  };
};

export type TenantWithRisk = Tenant & {
  risk: RiskScore;
  payments: Payment[];
};

export type PropertyWithTenants = Property & {
  tenants: TenantWithRisk[];
};

// ─── Credit check & tenant verification ──────────────────────────────────────

export type ApplicationStatus = "pending" | "approved" | "rejected";
export type RatioFlag = "green" | "amber" | "red";
export type CitizenType = "citizen" | "permanent_resident";
export type Gender = "male" | "female";
export type ReferenceResponse =
  | "positive"
  | "neutral"
  | "negative"
  | "no_response";

/** Result of validating a SA 13-digit ID number */
export type IdVerification = {
  valid: boolean;
  checksumValid: boolean;
  dob: string | null; // YYYY-MM-DD
  gender: Gender | null;
  citizenType: CitizenType | null;
  ageInYears: number | null;
  errors: string[];
};

/** Single parsed bank transaction */
export type BankTransaction = {
  date: string;
  description: string;
  amount: number; // cents; positive = credit, negative = debit
  balance?: number; // cents
  type: "income" | "expense" | "bounced_do" | "gambling" | "rental" | "other";
  flags: string[];
};

/** Per-month summary derived from parsed transactions */
export type MonthlyBreakdown = {
  month: string; // YYYY-MM
  income: number; // cents total credits
  expenses: number; // cents total debits (positive)
  closingBalance: number; // cents
  hasSalary: boolean;
  bouncedDoCount: number;
  gamblingCount: number;
};

/** Full result of parsing and analysing a bank statement PDF */
export type BankStatementAnalysis = {
  bank: string | null;
  accountNumber: string | null;
  avgMonthlyIncome: number; // cents
  avgMonthlyExpenses: number; // cents
  avgMonthlyBalance: number; // cents
  salaryMonths: number; // how many months had a salary deposit
  totalMonthsAnalyzed: number;
  bouncedDos: BankTransaction[];
  gamblingTransactions: BankTransaction[];
  rentalPayments: BankTransaction[];
  largeCashDeposits: BankTransaction[];
  monthlyBreakdowns: MonthlyBreakdown[];
  parseWarnings: string[];
  rawTextLength: number;
};

/** Single reference check entry */
export type ReferenceCheck = {
  id: string;
  landlordName: string;
  contact: string;
  contacted: boolean;
  response: ReferenceResponse;
  notes: string;
  createdAt: string;
};

/** Breakdown of how the combined credit score was calculated */
export type CreditScoreBreakdown = {
  bankHealth: {
    score: number;
    max: 40;
    incomeRegularity: number;
    bouncedDoPenalty: number;
    gamblingPenalty: number;
  };
  ratio: {
    score: number;
    max: 25;
    flag: RatioFlag | null;
    percent: number | null;
  };
  idVerification: {
    score: number;
    max: 15;
    checksumPoints: number;
    fraudFlagPenalty: number;
  };
  referenceCheck: {
    score: number;
    max: 20;
    response: ReferenceResponse | null;
  };
};

/** Full tenant application record */
export type TenantApplication = {
  id: string;
  property_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  id_number: string | null;
  monthly_income_cents: number | null;
  requested_rent_cents: number | null;
  id_verification: IdVerification;
  bank_statement_filename: string | null;
  bank_statement_analysis: BankStatementAnalysis;
  ratio_flag: RatioFlag | null;
  ratio_percent: number | null;
  fraud_flags: string[];
  reference_checks: ReferenceCheck[];
  credit_score: number | null;
  credit_score_breakdown: CreditScoreBreakdown | null;
  status: ApplicationStatus;
  landlord_notes: string | null;
  created_at: string;
  updated_at: string;
};

// ─── Communications & tenant engagement ──────────────────────────────────────

export type CommunicationType =
  | "payment_before_3d"
  | "payment_due_today"
  | "payment_late_3d"
  | "payment_late_7d"
  | "payment_late_14d"
  | "monthly_checkin";

export type CommunicationLog = {
  id: string;
  tenant_id: string;
  type: CommunicationType;
  subject: string | null;
  to_email: string | null;
  resend_id: string | null;
  status: "sent" | "failed";
  metadata: Record<string, unknown>;
  sent_at: string;
};

export type QueryCategory = "emergency" | "maintenance" | "general";
export type QueryStatus = "open" | "in_progress" | "resolved";

export type TenantQuery = {
  id: string;
  tenant_id: string;
  category: QueryCategory;
  subcategory: string | null;
  title: string;
  description: string;
  status: QueryStatus;
  landlord_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CheckinResponse = {
  id: string;
  tenant_id: string;
  month: string; // YYYY-MM
  token: string;
  unit_working: boolean | null;
  maintenance_needed: boolean | null;
  maintenance_details: string | null;
  flag_text: string | null;
  sent_at: string;
  responded_at: string | null;
};

// ─── Leases ──────────────────────────────────────────────────────────────────

export type LeaseStatus = "draft" | "sent" | "signed" | "expired";

export type LeaseAgreement = {
  id: string;
  property_id: string;
  tenant_id: string;
  landlord_id: string;
  lease_start: string; // YYYY-MM-DD
  lease_end: string | null; // YYYY-MM-DD or null for month-to-month
  monthly_rent: number; // cents
  deposit_amount: number | null; // cents
  payment_due_day: number;
  notice_period_days: number;
  pet_allowed: boolean;
  subletting_allowed: boolean;
  special_conditions: string | null;
  status: LeaseStatus;
  landlord_signed_at: string | null;
  tenant_signed_at: string | null;
  xpello_enrolled: boolean;
  xpello_enrolled_at: string | null;
  created_at: string;
};

// ─── Intelligence features ────────────────────────────────────────────────────

export type ComponentTypeKey =
  | "geyser"
  | "roof"
  | "paint_interior"
  | "paint_exterior"
  | "plumbing"
  | "electrical"
  | "carpets"
  | "appliance"
  | "hvac"
  | "windows_doors"
  | "driveway"
  | "other";

export type PropertyComponent = {
  id: string;
  property_id: string;
  component_type: ComponentTypeKey;
  name: string;
  installed_date: string; // YYYY-MM-DD
  lifespan_min_years: number;
  lifespan_max_years: number;
  brand: string | null;
  model_number: string | null;
  notes: string | null;
  last_serviced_date: string | null;
  created_at: string;
  updated_at: string;
};

export type JobStatus =
  | "draft"
  | "sent"
  | "quote_received"
  | "approved"
  | "declined"
  | "completed";
export type JobUrgency = "urgent" | "normal" | "planned";

export type MaintenanceJob = {
  id: string;
  property_id: string;
  component_id: string | null;
  tenant_query_id: string | null;
  title: string;
  generated_description: string | null;
  final_description: string | null;
  urgency: JobUrgency;
  contractor_name: string | null;
  contractor_email: string | null;
  contractor_phone: string | null;
  quote_text: string | null;
  quote_amount_cents: number | null;
  quote_summary: string | null;
  quote_received_at: string | null;
  status: JobStatus;
  landlord_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type BodyCorpFlagCategory =
  | "special_levy"
  | "maintenance"
  | "legal"
  | "financial"
  | "action_required";

export type BodyCorpDocument = {
  id: string;
  property_id: string;
  title: string;
  source: "pdf" | "text_paste";
  filename: string | null;
  raw_text: string | null;
  meeting_date: string | null;
  claude_summary: string | null;
  flag_count: { red: number; amber: number; green: number };
  created_at: string;
};

export type BodyCorpFlag = {
  id: string;
  document_id: string;
  property_id: string;
  category: BodyCorpFlagCategory;
  severity: "red" | "amber" | "green";
  title: string;
  description: string;
  amount_zar: number | null;
  due_date: string | null;
  requires_owner_action: boolean;
  resolved: boolean;
  created_at: string;
};

// ─── Portfolio finance ────────────────────────────────────────────────────────

export type PropertyWithFinance = Property & {
  purchase_price_cents: number | null;
  purchase_date: string | null;
  current_value_cents: number | null;
  bond_bank: string | null;
  bond_original_amount_cents: number | null;
  bond_monthly_payment_cents: number | null;
  bond_interest_rate_pct: number | null;
  bond_start_date: string | null;
  bond_term_years: number | null;
  bond_remaining_months: number | null;
  bond_account_number: string | null;
  levy_monthly_cents: number | null;
  rates_monthly_cents: number | null;
  insurance_monthly_cents: number | null;
  management_fee_pct: number | null;
  monthly_rent_cents: number | null;
  rental_due_day: number | null;
  deposit_amount_cents: number | null;
  lease_start_date: string | null;
  lease_end_date: string | null;
  // Location fields added in migration_secure_documents.sql
  suburb: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  area_news_enabled: boolean;
};

export type PropertyExpense = {
  id: string;
  property_id: string;
  owner_id: string;
  expense_type:
    | "bond"
    | "levy"
    | "rates"
    | "insurance"
    | "maintenance"
    | "management_fee"
    | "water"
    | "electricity"
    | "other";
  description: string | null;
  amount_cents: number;
  is_recurring: boolean;
  frequency: "monthly" | "quarterly" | "annual" | "once";
  period_month: number | null;
  period_year: number | null;
  status: "pending" | "paid" | "overdue";
  paid_at: string | null;
  reference: string | null;
  created_at: string;
  updated_at: string;
};

export type BankTransactionRecord = {
  id: string;
  owner_id: string;
  property_id: string | null;
  transaction_date: string;
  description: string;
  amount_cents: number;
  transaction_type: "credit" | "debit";
  category:
    | "rental_income"
    | "bond_payment"
    | "levy_payment"
    | "rates_payment"
    | "maintenance"
    | "insurance"
    | "management_fee"
    | "other_income"
    | "other_expense"
    | "uncategorised";
  bank_reference: string | null;
  is_reconciled: boolean;
  source: "manual" | "statement" | "api";
  created_at: string;
};
