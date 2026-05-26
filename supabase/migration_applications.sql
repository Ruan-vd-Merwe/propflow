-- PropFlow: Tenant Applications Migration
-- Run AFTER schema.sql in Supabase SQL editor

-- ─── tenant_applications ────────────────────────────────────────────────────
create table if not exists public.tenant_applications (
  id                       uuid primary key default gen_random_uuid(),
  property_id              uuid references public.properties on delete cascade,

  -- Applicant info
  full_name                text not null,
  email                    text not null,
  phone                    text,
  id_number                text,                        -- SA 13-digit ID

  -- Financial inputs
  monthly_income_cents     integer,                     -- stated gross monthly income in cents
  requested_rent_cents     integer,                     -- rent amount for this property in cents

  -- ID verification (output from id-validator)
  id_verification          jsonb not null default '{}',
  -- { valid, checksumValid, dob, gender, citizenType, ageInYears, errors[] }

  -- Bank statement analysis (output from bank-statement-parser)
  bank_statement_filename  text,
  bank_statement_analysis  jsonb not null default '{}',
  -- { bank, accountNumber, avgMonthlyIncome, avgMonthlyExpenses, avgMonthlyBalance,
  --   salaryMonths, totalMonthsAnalyzed, bouncedDos[], gamblingTransactions[],
  --   rentalPayments[], largeCashDeposits[], monthlyBreakdowns[], parseWarnings[] }

  -- Ratio check
  ratio_flag               text check (ratio_flag in ('green', 'amber', 'red')),
  ratio_percent            numeric(5, 2),

  -- Fraud flags (combined from all sources)
  fraud_flags              jsonb not null default '[]',
  -- e.g. ["DOB_MISMATCH", "DUPLICATE_ID", "IRREGULAR_INCOME", "LARGE_CASH_DEPOSIT"]

  -- Reference checks (array of reference objects)
  reference_checks         jsonb not null default '[]',
  -- [{ id, landlordName, contact, contacted, response, notes, createdAt }]

  -- Combined credit score
  credit_score             integer check (credit_score >= 0 and credit_score <= 100),
  credit_score_breakdown   jsonb not null default '{}',
  -- { bankHealth:{score,max,details}, ratio:{score,max}, idVerification:{score,max}, referenceCheck:{score,max} }

  -- Status and notes
  status                   text not null default 'pending'
                             check (status in ('pending', 'approved', 'rejected')),
  landlord_notes           text,

  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists tenant_applications_property_id_idx
  on public.tenant_applications (property_id);

create index if not exists tenant_applications_status_idx
  on public.tenant_applications (status);

-- Auto-update updated_at
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists touch_tenant_applications_updated_at on public.tenant_applications;
create trigger touch_tenant_applications_updated_at
  before update on public.tenant_applications
  for each row execute procedure public.touch_updated_at();


-- ─── Row Level Security ──────────────────────────────────────────────────────
alter table public.tenant_applications enable row level security;

-- Anyone (including anonymous visitors) may submit a new application
create policy "applications_insert_public" on public.tenant_applications
  for insert with check (true);

-- Landlords may view applications for their own properties
create policy "applications_select_own" on public.tenant_applications
  for select using (
    exists (
      select 1 from public.properties p
      where p.id = property_id and p.owner_id = auth.uid()
    )
  );

-- Landlords may update applications for their own properties
create policy "applications_update_own" on public.tenant_applications
  for update using (
    exists (
      select 1 from public.properties p
      where p.id = property_id and p.owner_id = auth.uid()
    )
  );


-- ─── Public property view for apply form ─────────────────────────────────────
-- Tenants need to see the property name/address when filling out the form.
-- The landlord already shares the property link publicly, so this is safe.
create policy "properties_public_read" on public.properties
  for select using (true);
