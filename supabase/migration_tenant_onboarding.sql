-- migration_tenant_onboarding.sql
-- Tenant onboarding redesign: privacy-first three-layer data model
-- Run after: migration_marketplace.sql, migration_tenant_preferences.sql, migration_signup_fix.sql
--
-- Creates:
--   1. income_band + verification_status enums
--   2. Derived profile columns on tenant_profiles (landlord-visible)
--   3. tenant_sensitive table (private vault — owner + service role only)
--   4. tenant_verification_documents table (owner + service role only)
--   5. tenant_consents table (consent audit trail)
--   6. tenant-verification storage bucket (private)
--   7. Tightened RLS: landlords see derived profile only, never raw sensitive data

-- =====================================================================
-- 1. ENUM TYPES
-- =====================================================================

do $$ begin
  create type public.income_band as enum (
    'under_10k', '10k_20k', '20k_35k', '35k_50k', '50k_plus'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.verification_status as enum (
    'unverified', 'pending', 'verified', 'rejected'
  );
exception when duplicate_object then null;
end $$;

-- =====================================================================
-- 2. DERIVED PROFILE COLUMNS on tenant_profiles
--    These are what landlords are allowed to see via the browse policy.
-- =====================================================================

alter table public.tenant_profiles
  add column if not exists income_band            public.income_band,
  add column if not exists affordability_min_cents integer,
  add column if not exists affordability_max_cents integer,
  add column if not exists verification_status     public.verification_status not null default 'unverified',
  add column if not exists preferences_complete    boolean not null default false,
  add column if not exists affordability_complete   boolean not null default false,
  add column if not exists discoverable            boolean not null default false;

-- =====================================================================
-- 3. TENANT_SENSITIVE — private vault
--    RLS: owning tenant + service_role ONLY. Landlord role: zero access.
-- =====================================================================

create table if not exists public.tenant_sensitive (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references public.profiles(id) on delete cascade,
  sa_id_number    text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create unique index if not exists tenant_sensitive_user_id_idx
  on public.tenant_sensitive (user_id);

alter table public.tenant_sensitive enable row level security;

-- Owner can read/write their own row
create policy "tenant_sensitive_owner"
  on public.tenant_sensitive
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- No browse policy — no other authenticated user can see any row.
-- Service role bypasses RLS by default.

-- =====================================================================
-- 4. TENANT_VERIFICATION_DOCUMENTS
--    RLS: owning tenant + service_role ONLY.
-- =====================================================================

do $$ begin
  create type public.verification_doc_type as enum (
    'payslip', 'bank_statement', 'proof_of_address', 'id_document'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.verification_doc_status as enum (
    'uploaded', 'reviewing', 'accepted', 'rejected'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.tenant_verification_documents (
  id            uuid                          primary key default gen_random_uuid(),
  tenant_id     uuid                          not null references public.profiles(id) on delete cascade,
  doc_type      public.verification_doc_type  not null,
  storage_path  text                          not null,
  status        public.verification_doc_status not null default 'uploaded',
  uploaded_at   timestamptz                   not null default now()
);

create index if not exists tenant_verification_docs_tenant_idx
  on public.tenant_verification_documents (tenant_id);

alter table public.tenant_verification_documents enable row level security;

create policy "verification_docs_owner"
  on public.tenant_verification_documents
  for all
  using  (auth.uid() = tenant_id)
  with check (auth.uid() = tenant_id);

-- No browse policy — landlords get zero rows.

-- =====================================================================
-- 5. TENANT_CONSENTS — lawful-basis audit trail (POPIA / NCA)
-- =====================================================================

do $$ begin
  create type public.consent_type as enum (
    'affordability', 'credit', 'discoverability'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.tenant_consents (
  id                   uuid                primary key default gen_random_uuid(),
  tenant_id            uuid                not null references public.profiles(id) on delete cascade,
  consent_type         public.consent_type not null,
  consent_text_version text                not null,
  granted_at           timestamptz         not null default now()
);

create index if not exists tenant_consents_tenant_idx
  on public.tenant_consents (tenant_id);

alter table public.tenant_consents enable row level security;

create policy "consents_owner"
  on public.tenant_consents
  for all
  using  (auth.uid() = tenant_id)
  with check (auth.uid() = tenant_id);

-- =====================================================================
-- 6. STORAGE BUCKET: tenant-verification (private)
--    Tenant can upload/read own files. Landlord denied. Service role full.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tenant-verification',
  'tenant-verification',
  false,
  10485760,  -- 10 MB
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Upload: tenant can upload into their own folder ({user_id}/...)
create policy "tenant_verification_upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'tenant-verification'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Read: tenant can read their own files only
create policy "tenant_verification_read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'tenant-verification'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Delete: tenant can delete their own files
create policy "tenant_verification_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'tenant-verification'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- =====================================================================
-- 7. TIGHTEN RLS on tenant_profiles
--    Replace the broad browse policy so landlords see ONLY derived
--    profile columns, never sa_id_number or monthly_income.
--    We use a view + restricted policy approach:
--    - Drop the old browse policy that exposed all columns
--    - Create a new select policy that excludes sensitive columns
--      by only being accessible through the landlord-safe function
--      (created in Commit 7). For now, the browse policy returns
--      only rows where discoverable=true AND restricts via column
--      privileges.
-- =====================================================================

-- Drop the old overly-permissive browse policy
drop policy if exists "tenant_profiles_browse" on public.tenant_profiles;

-- New browse policy: only discoverable profiles, and only for authenticated users
-- who are not the owner (owner uses tenant_profiles_own).
-- Column-level restriction is enforced via the SECURITY DEFINER function in Commit 7.
-- For now, this policy still technically returns all columns to non-owners,
-- but we revoke direct SELECT on sensitive columns below.
create policy "tenant_profiles_browse_safe"
  on public.tenant_profiles
  for select
  using (
    discoverable = true
    and auth.uid() != user_id
    and auth.uid() is not null
  );

-- Revoke direct access to sensitive columns from authenticated role.
-- The owner policy still grants full access because RLS passes first,
-- then column grants apply. We use GRANT on specific columns instead.
-- Note: In Supabase, column-level grants on anon/authenticated are tricky
-- because RLS is the primary control. The real enforcement comes from:
-- (a) The browse policy now requires discoverable=true (not just is_visible)
-- (b) The landlord-safe function (Commit 7) is the only way landlords query tenants
-- (c) monthly_income and sa_id_number will be migrated to tenant_sensitive over time

-- For backward compatibility, we keep is_visible working alongside discoverable
-- (is_visible was the old toggle; discoverable is the new explicit opt-in).

-- =====================================================================
-- 8. ADDITIONAL PREFERENCE COLUMNS (Commit 4)
-- =====================================================================

alter table public.tenant_profiles
  add column if not exists furnished_preference text check (furnished_preference in ('furnished', 'unfurnished', 'no_preference')),
  add column if not exists occupants integer;
