-- Portfolio Finance Migration
-- Additive only — no existing columns, tables, or policies are modified.

-- ─── Financial columns on properties ─────────────────────────────────────────
alter table public.properties
  add column if not exists purchase_price_cents      bigint,
  add column if not exists current_value_cents       bigint,
  add column if not exists bond_bank                 text,
  add column if not exists bond_original_amount_cents bigint,
  add column if not exists bond_monthly_payment_cents bigint,
  add column if not exists bond_interest_rate_pct    numeric(5,2),
  add column if not exists bond_start_date           date,
  add column if not exists bond_term_years           integer,
  add column if not exists levy_monthly_cents        bigint,
  add column if not exists rates_monthly_cents       bigint,
  add column if not exists insurance_monthly_cents   bigint,
  add column if not exists management_fee_pct        numeric(4,2) default 0;

-- ─── Property expenses log ────────────────────────────────────────────────────
create table if not exists public.property_expenses (
  id              uuid primary key default gen_random_uuid(),
  property_id     uuid not null references public.properties(id) on delete cascade,
  owner_id        uuid not null references auth.users(id) on delete cascade,
  expense_type    text not null
                  check (expense_type in (
                    'bond','levy','rates','insurance','maintenance',
                    'management_fee','water','electricity','other'
                  )),
  description     text,
  amount_cents    bigint not null,
  is_recurring    boolean not null default true,
  frequency       text not null default 'monthly'
                  check (frequency in ('monthly','quarterly','annual','once')),
  period_month    integer check (period_month between 1 and 12),
  period_year     integer,
  status          text not null default 'pending'
                  check (status in ('pending','paid','overdue')),
  paid_at         date,
  reference       text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists property_expenses_property_id_idx on public.property_expenses (property_id);
create index if not exists property_expenses_owner_id_idx    on public.property_expenses (owner_id);

-- ─── Bank transactions ────────────────────────────────────────────────────────
create table if not exists public.bank_transactions (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid not null references auth.users(id) on delete cascade,
  property_id       uuid references public.properties(id) on delete set null,
  transaction_date  date not null,
  description       text not null,
  amount_cents      bigint not null,
  transaction_type  text not null check (transaction_type in ('credit','debit')),
  category          text not null default 'uncategorised'
                    check (category in (
                      'rental_income','bond_payment','levy_payment','rates_payment',
                      'maintenance','insurance','management_fee',
                      'other_income','other_expense','uncategorised'
                    )),
  bank_reference    text,
  is_reconciled     boolean not null default false,
  source            text not null default 'manual'
                    check (source in ('manual','statement','api')),
  created_at        timestamptz not null default now()
);

create index if not exists bank_transactions_owner_id_idx    on public.bank_transactions (owner_id);
create index if not exists bank_transactions_property_id_idx on public.bank_transactions (property_id);

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table public.property_expenses  enable row level security;
alter table public.bank_transactions  enable row level security;

create policy "landlord manages own expenses"
  on public.property_expenses for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "landlord manages own transactions"
  on public.bank_transactions for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);
