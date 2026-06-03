-- Lease agreements table + RLS
-- Run in Supabase SQL editor after schema.sql

create table if not exists public.lease_agreements (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties on delete cascade,
  tenant_id uuid references public.tenants on delete cascade,
  landlord_id uuid references public.profiles on delete cascade,
  lease_start date not null,
  lease_end date,
  monthly_rent integer not null,
  deposit_amount integer,
  payment_due_day integer default 1,
  notice_period_days integer default 30,
  pet_allowed boolean default false,
  subletting_allowed boolean default false,
  special_conditions text,
  status text default 'draft'
    check (status in ('draft','sent','signed','expired')),
  landlord_signed_at timestamptz,
  tenant_signed_at timestamptz,
  xpello_enrolled boolean default false,
  xpello_enrolled_at timestamptz,
  created_at timestamptz default now()
);

alter table public.lease_agreements
  enable row level security;

create policy "landlord sees own leases"
  on public.lease_agreements for all
  using (auth.uid() = landlord_id);
