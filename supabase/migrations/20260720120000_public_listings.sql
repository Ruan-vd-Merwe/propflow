-- migration_public_listings.sql
-- FILE ONLY. Not executed against any database by this run. Review and run
-- manually (Supabase SQL editor or `supabase db push`) when ready.
--
-- Adds the public listing page feature: a landlord opt-in "is_published"
-- flag on properties, a strictly narrow anon-readable view over it, and the
-- two small additions tenant_applications needs to support an apply flow
-- reached from that public page (an optional message, and duplicate
-- prevention for a signed-in tenant applying twice to the same property).
--
-- Context for reviewers (see docs/overnight/diagnosis-properties.md section 2-3
-- for the full trail): properties already grants anon a column-allowlisted
-- SELECT directly on the table (migration_rls_storage_hardening_pre_launch.sql),
-- and that allowlist includes owner_id. This migration does not touch that
-- grant. The new public_listings view below is intentionally narrower (no
-- owner_id, no financial columns) and is the only thing the new /listings/[id]
-- page reads from, so it never depends on or widens the existing table-level
-- anon access.

-- ── 1. Publish flag ──────────────────────────────────────────────────────
-- Independent of the existing is_listed/status pair, which govern the
-- separate /browse marketplace-matching surface. is_published is a landlord
-- opt-in specifically for the single shareable /listings/[id] URL.

alter table public.properties
  add column if not exists is_published boolean not null default false;

-- ── 2. public_listings view ──────────────────────────────────────────────
-- Contains ONLY: id, title, description, price, suburb, bedrooms, features,
-- image refs, published flag. No bathrooms column exists anywhere in this
-- schema (confirmed in diagnosis-properties.md section 1) so it is omitted
-- rather than fabricated. No owner_id, no address, no financial columns,
-- no landlord-identifying data of any kind.
--
-- Security model: this view is created without security_invoker, so it runs
-- with the privileges of the role that creates it (the migration-running
-- role), not the querying role's privileges. That means anon can be granted
-- SELECT on the view alone, without ever needing any grant on the
-- underlying properties table. This is the standard safe-exposure pattern
-- and is why a view is used instead of widening the existing table policy.

create or replace view public.public_listings as
select
  p.id,
  p.name as title,
  p.description,
  coalesce(p.monthly_rent_cents, (p.asking_rent * 100)::bigint) as price_cents,
  p.suburb,
  p.bedrooms,
  (
    coalesce(p.property_tags, '{}'::text[])
    || coalesce(p.lifestyle_tags, '{}'::text[])
    || array_remove(
         array[
           case when p.pets_allowed then 'pet_friendly' end,
           case when p.parking_available then 'parking' end,
           case when p.fibre_available then 'fibre' end
         ],
         null
       )
  ) as features,
  p.photos as image_refs,
  p.is_published as published
from public.properties p
where p.is_published = true;

comment on view public.public_listings is
  'Anon-safe subset of properties for the public /listings/[id] page. Never add owner_id, address, or any migration_finance.sql / migration_portfolio_finance.sql column to this view.';

-- Revoke any default grant first so the exact allowlist below is the only
-- access anon has (mirrors the defensive pattern already used for the
-- properties table itself in migration_rls_storage_hardening_pre_launch.sql).
-- Both anon (signed-out visitors browsing a shared link) and authenticated
-- (a signed-in tenant on the apply page, which reads the same view for
-- display) need SELECT on this view.
revoke all on public.public_listings from anon, authenticated;
grant select on public.public_listings to anon, authenticated;

-- ── 3. tenant_applications additions ─────────────────────────────────────
-- Reusing tenant_applications rather than creating a new applications table
-- (see docs/overnight/diagnosis-applications.md section 5): it is already
-- property-scoped, already has a working anon-insert policy and a working
-- landlord review UI at /applications and /applications/[id]. A second
-- table would orphan that UI.

alter table public.tenant_applications
  add column if not exists message text;

comment on column public.tenant_applications.message is
  'Optional free-text note from the applicant, collected at the /listings/[id] apply step.';

-- Duplicate-application prevention for signed-in tenants. Anonymous
-- submissions (user_id is null) are intentionally not constrained here,
-- consistent with how tenant_applications_select_own already treats null
-- user_id rows as unattributed (migration_applications_authorship.sql).
create unique index if not exists tenant_applications_property_user_unique
  on public.tenant_applications (property_id, user_id)
  where user_id is not null;

-- No RLS policy changes needed for tenant_applications: the existing
-- tenant_applications_insert_anon policy (status='pending', property_id
-- required, landlord_notes null) already covers this insert shape, and all
-- application inserts already go through the anon client regardless of
-- caller session (see diagnosis-applications.md section 3). TrustScore
-- gating for the new apply flow happens in the API route before the insert
-- is attempted, the same pattern already used by
-- src/app/api/flatmate/[token]/apply/route.ts, because the anon client does
-- not forward the caller's JWT so auth.uid() is not available to a DB-level
-- policy on this insert path.

notify pgrst, 'reload schema';
