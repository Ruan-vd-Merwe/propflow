-- Rent payments Phase 2: payment initiation + webhook-ready status updates
-- Run in Supabase SQL editor after migration_rent_ledger.sql
-- Additive only — widens existing status enums and adds nullable/defaulted
-- columns. Safe to re-run. Does not touch RLS (already scoped correctly by
-- landlord_id / obligation joins from Phase 1) and does not touch payments.

-- ─── Widen status enums ──────────────────────────────────────────────────────
-- rent_obligations gains 'processing' (a payment attempt is in flight).
alter table public.rent_obligations drop constraint if exists rent_obligations_status_check;
alter table public.rent_obligations add constraint rent_obligations_status_check
  check (status in ('pending', 'processing', 'paid', 'partial', 'late', 'failed', 'waived'));

-- payment_attempts gains 'processing' (provider is settling) and 'cancelled'
-- (tenant abandoned checkout) — both tenant-visible payment states.
alter table public.payment_attempts drop constraint if exists payment_attempts_status_check;
alter table public.payment_attempts add constraint payment_attempts_status_check
  check (status in ('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded'));


-- ─── New columns ──────────────────────────────────────────────────────────────
-- provider_ref (Phase 1) doubles as the provider's payment/session id.
alter table public.payment_attempts
  add column if not exists provider_checkout_url text,
  add column if not exists currency             text not null default 'ZAR',
  add column if not exists failure_reason        text,
  add column if not exists raw_provider_event     jsonb,
  add column if not exists updated_at             timestamptz not null default now();

alter table public.rent_obligations
  add column if not exists paid_at timestamptz;

-- Webhook lookups resolve provider_ref -> payment_attempt; scope the
-- uniqueness per-provider so different providers can't collide on id format.
create unique index if not exists payment_attempts_provider_ref_idx
  on public.payment_attempts (provider, provider_ref)
  where provider_ref is not null;

-- Reload PostgREST schema cache
notify pgrst, 'reload schema';
