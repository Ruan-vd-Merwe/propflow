-- Flatmate Finder: tenant-initiated replacement/co-occupant search.
-- Existing tenant(s) approve applicants, not the landlord. TrustScore
-- (tenant_profiles.verification_status) is the applicant gate.
-- Run in Supabase SQL editor after migration_rent_ledger.sql
-- Additive only, IF NOT EXISTS throughout. Does not touch payments,
-- rent_schedules, rent_obligations, payment_attempts, tenants, or
-- lease_agreements. Not yet applied to the live database, propose only.

-- ─── flatmate_listings ────────────────────────────────────────────────────────
-- One listing per property at a time in practice, but no unique constraint is
-- enforced here since a tenant may cancel and re-list. created_by_tenant_id
-- resolves ownership since tenants has no direct auth.uid() link (see RLS
-- below, which reuses the email bridge already used by the tenant dashboard).
create table if not exists public.flatmate_listings (
  id                    uuid primary key default gen_random_uuid(),
  property_id           uuid not null references public.properties on delete cascade,
  created_by_tenant_id  uuid not null references public.tenants on delete cascade,
  status                text not null default 'active'
                          check (status in ('active', 'filled', 'cancelled')),
  note                  text,
  rent_portion_cents    integer not null,
  move_in_date          date not null,
  share_token           uuid not null default gen_random_uuid(),
  created_at            timestamptz not null default now(),
  filled_at             timestamptz
);

create unique index if not exists flatmate_listings_share_token_idx
  on public.flatmate_listings (share_token);

create index if not exists flatmate_listings_property_id_idx
  on public.flatmate_listings (property_id);

create index if not exists flatmate_listings_created_by_tenant_id_idx
  on public.flatmate_listings (created_by_tenant_id);


-- ─── flatmate_applicants ──────────────────────────────────────────────────────
-- trust_status_snapshot mirrors tenant_profiles.verification_status captured
-- at apply time (text, not a number: this codebase has no numeric TrustScore
-- anywhere, only the verification_status enum unverified/pending/verified/
-- rejected). applicant_profile_id is nullable since an applicant may not yet
-- have gone through onboarding when they apply.
create table if not exists public.flatmate_applicants (
  id                    uuid primary key default gen_random_uuid(),
  listing_id            uuid not null references public.flatmate_listings on delete cascade,
  full_name             text not null,
  email                 text not null,
  phone                 text,
  applicant_profile_id  uuid references public.profiles on delete set null,
  trust_status_snapshot text,
  status                text not null default 'pending'
                          check (status in ('pending', 'approved', 'declined')),
  created_at            timestamptz not null default now()
);

create index if not exists flatmate_applicants_listing_id_idx
  on public.flatmate_applicants (listing_id);


-- ─── Row Level Security ──────────────────────────────────────────────────────
-- No public SELECT policy on either table by design. The public apply page
-- and apply route read/write via the service role key (same caution as other
-- token-based routes, e.g. /api/tenant/paid), never via an RLS-exposed path.

alter table public.flatmate_listings   enable row level security;
alter table public.flatmate_applicants enable row level security;

-- flatmate_listings: the creating tenant manages their own listing. tenants
-- has no auth.uid() column, so ownership is resolved through the same
-- email bridge the tenant dashboard already uses (profiles.email =
-- tenants.email, matched against the signed-in auth.uid()).
create policy "tenant manages own flatmate listing"
  on public.flatmate_listings for all
  using (
    exists (
      select 1
      from public.tenants t
      join public.profiles p on p.email = t.email
      where t.id = created_by_tenant_id
        and p.id = auth.uid()
    )
  );

-- flatmate_applicants: only the owning tenant (via the listing, via the same
-- email bridge) can read or update applicant rows. Inserts from applicants
-- (who are not that tenant) happen via the service role in the apply route,
-- which intentionally bypasses this policy.
create policy "tenant manages own listing applicants"
  on public.flatmate_applicants for all
  using (
    exists (
      select 1
      from public.flatmate_listings l
      join public.tenants t on t.id = l.created_by_tenant_id
      join public.profiles p on p.email = t.email
      where l.id = listing_id
        and p.id = auth.uid()
    )
  );

-- Reload PostgREST schema cache
notify pgrst, 'reload schema';
