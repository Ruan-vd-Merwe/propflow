-- Finance columns migration (v2)
-- Additive only — uses ADD COLUMN IF NOT EXISTS throughout.
-- Safe to run on top of migration_portfolio_finance.sql.
-- Apply in the Supabase SQL editor to resolve "column not found" schema cache errors.

alter table public.properties
  add column if not exists purchase_price_cents        bigint,
  add column if not exists current_value_cents         bigint,
  add column if not exists purchase_date               date,
  add column if not exists bond_bank                   text,
  add column if not exists bond_original_amount_cents  bigint,
  add column if not exists bond_monthly_payment_cents  bigint,
  add column if not exists bond_interest_rate_pct      numeric(5,2),
  add column if not exists bond_start_date             date,
  add column if not exists bond_term_years             integer,
  add column if not exists bond_remaining_months       integer,
  add column if not exists bond_account_number         text,
  add column if not exists levy_monthly_cents          bigint,
  add column if not exists rates_monthly_cents         bigint,
  add column if not exists insurance_monthly_cents     bigint,
  add column if not exists management_fee_pct          numeric(4,2) default 0,
  add column if not exists monthly_rent_cents          bigint,
  add column if not exists rental_due_day              integer default 1,
  add column if not exists deposit_amount_cents        bigint,
  add column if not exists lease_start_date            date,
  add column if not exists lease_end_date              date,
  add column if not exists notes                       text;
