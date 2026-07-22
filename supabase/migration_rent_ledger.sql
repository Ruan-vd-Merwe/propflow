-- Rent ledger tables + RLS (Phase 1: manual-only, no payment provider)
-- Run in Supabase SQL editor after migration_leases.sql
-- Additive only — safe to re-run.

-- ─── rent_schedules ───────────────────────────────────────────────────────────
-- The "template" a lease's rent follows: amount, due day, and any scheduled
-- escalation. A new schedule row is created (status='active') whenever terms
-- change; the old one is marked 'superseded' rather than edited in place.
create table if not exists public.rent_schedules (
  id                uuid primary key default gen_random_uuid(),
  lease_id          uuid not null references public.lease_agreements on delete cascade,
  amount_cents      integer not null,
  due_day           integer not null default 1,
  start_date        date not null,
  end_date          date,
  escalation_date   date,
  escalation_pct    numeric(5,2),
  status            text not null default 'active'
                      check (status in ('active', 'superseded')),
  created_at        timestamptz not null default now()
);

create index if not exists rent_schedules_lease_id_idx on public.rent_schedules (lease_id);
create index if not exists rent_schedules_status_idx    on public.rent_schedules (status);


-- ─── rent_obligations ─────────────────────────────────────────────────────────
-- One row per billing period, generated from an active rent_schedule.
create table if not exists public.rent_obligations (
  id                  uuid primary key default gen_random_uuid(),
  schedule_id         uuid not null references public.rent_schedules on delete cascade,
  tenant_id           uuid not null references public.tenants on delete cascade,
  property_id         uuid not null references public.properties on delete cascade,
  landlord_id         uuid not null references public.profiles on delete cascade,
  period_start        date not null,
  due_date            date not null,
  amount_due_cents    integer not null,
  amount_paid_cents   integer not null default 0,
  status              text not null default 'pending'
                        check (status in ('pending', 'paid', 'partial', 'late', 'failed', 'waived')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists rent_obligations_schedule_id_idx on public.rent_obligations (schedule_id);
create index if not exists rent_obligations_tenant_id_idx   on public.rent_obligations (tenant_id);
create index if not exists rent_obligations_property_id_idx on public.rent_obligations (property_id);
create index if not exists rent_obligations_landlord_id_idx on public.rent_obligations (landlord_id);
create index if not exists rent_obligations_due_date_idx    on public.rent_obligations (due_date);
create index if not exists rent_obligations_status_idx      on public.rent_obligations (status);

-- One obligation per schedule per billing period
create unique index if not exists rent_obligations_schedule_period_idx
  on public.rent_obligations (schedule_id, period_start);


-- ─── payment_attempts ─────────────────────────────────────────────────────────
-- Manual-only in this phase: provider is always 'manual', recorded by the
-- landlord (or system, for waivers) against a specific obligation.
create table if not exists public.payment_attempts (
  id             uuid primary key default gen_random_uuid(),
  obligation_id  uuid not null references public.rent_obligations on delete cascade,
  provider       text not null default 'manual',
  provider_ref   text,
  amount_cents   integer not null,
  status         text not null default 'pending'
                   check (status in ('pending', 'succeeded', 'failed', 'refunded')),
  method         text,
  initiated_by   text not null check (initiated_by in ('tenant', 'landlord', 'system')),
  created_at     timestamptz not null default now(),
  confirmed_at   timestamptz
);

create index if not exists payment_attempts_obligation_id_idx on public.payment_attempts (obligation_id);


-- ─── Row Level Security ──────────────────────────────────────────────────────

alter table public.rent_schedules   enable row level security;
alter table public.rent_obligations enable row level security;
alter table public.payment_attempts enable row level security;

-- rent_schedules: landlord sees schedules for their own leases
create policy "landlord sees own rent schedules"
  on public.rent_schedules for all
  using (
    exists (
      select 1 from public.lease_agreements la
      where la.id = lease_id and la.landlord_id = auth.uid()
    )
  );

-- rent_obligations: landlord sees own obligations directly via landlord_id
create policy "landlord sees own rent obligations"
  on public.rent_obligations for all
  using (auth.uid() = landlord_id);

-- payment_attempts: landlord sees attempts for their own obligations
create policy "landlord sees own payment attempts"
  on public.payment_attempts for all
  using (
    exists (
      select 1 from public.rent_obligations ro
      where ro.id = obligation_id and ro.landlord_id = auth.uid()
    )
  );

-- Reload PostgREST schema cache
notify pgrst, 'reload schema';
