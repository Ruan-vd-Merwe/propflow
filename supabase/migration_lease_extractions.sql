-- Lease upload and AI extraction pipeline.
-- Run in Supabase SQL editor after migration_rent_ledger.sql
-- Additive only, IF NOT EXISTS throughout. Does not touch rent_schedules,
-- rent_obligations, payment_attempts, lease_agreements, tenants, the
-- flatmate finder tables, or any Xpello-related column (lease_agreements.
-- xpello_enrolled / xpello_enrolled_at are untouched by this migration).
-- Not yet applied to the live database, propose only.

-- Reuses the existing private "lease-contracts" storage bucket created in
-- migration_secure_documents.sql (owner-scoped via
-- (storage.foldername(name))[1] = auth.uid()::text). No new bucket needed.

-- ─── lease_extractions ────────────────────────────────────────────────────────
-- uploaded_by_profile_id is the authenticated uploader (landlord or tenant),
-- always set: both entry points require a Supabase session. property_id is
-- only set for landlord-side uploads (the property the lease belongs to).
-- tenant_id is only set once a landlord-side extraction is confirmed and
-- linked to a tenants row; tenant-side self-uploads never populate it, since
-- there is no guaranteed landlord counterpart on the platform.
create table if not exists public.lease_extractions (
  id                     uuid primary key default gen_random_uuid(),
  uploaded_by_role       text not null check (uploaded_by_role in ('landlord', 'tenant')),
  uploaded_by_profile_id uuid not null references public.profiles on delete cascade,
  property_id            uuid references public.properties on delete cascade,
  tenant_id               uuid references public.tenants on delete cascade,
  storage_path            text not null,
  original_filename       text not null,
  status                  text not null default 'pending'
                            check (status in ('pending', 'extracted', 'failed')),
  extracted_fields        jsonb,
  manual_fields           jsonb,
  confirmed               boolean not null default false,
  confirmed_at            timestamptz,
  created_at              timestamptz not null default now()
);

create index if not exists lease_extractions_property_id_idx
  on public.lease_extractions (property_id);

create index if not exists lease_extractions_uploaded_by_profile_id_idx
  on public.lease_extractions (uploaded_by_profile_id);

create index if not exists lease_extractions_status_idx
  on public.lease_extractions (status);


-- ─── Row Level Security ──────────────────────────────────────────────────────
-- No public SELECT policy. All reads go through authenticated routes scoped
-- to the owning landlord or tenant, enforced here by RLS as a backstop.

alter table public.lease_extractions enable row level security;

-- Landlord: sees extraction rows for properties they own. Uses property
-- ownership directly rather than the tenants-email bridge, since a
-- landlord-side upload always has a known property_id and an authenticated
-- landlord session (auth.uid() = properties.owner_id).
create policy "landlord sees own property lease extractions"
  on public.lease_extractions for all
  using (
    uploaded_by_role = 'landlord'
    and property_id is not null
    and exists (
      select 1 from public.properties p
      where p.id = property_id and p.owner_id = auth.uid()
    )
  );

-- Tenant: sees their own uploads. Tenant-side uploads happen from the
-- authenticated tenant dashboard (not the tokenized portal), so auth.uid()
-- is directly available here; no email bridge through public.tenants is
-- needed or correct, since a tenant-side upload may have no tenants row at
-- all (no guaranteed landlord counterpart).
create policy "tenant sees own lease extractions"
  on public.lease_extractions for all
  using (
    uploaded_by_role = 'tenant'
    and uploaded_by_profile_id = auth.uid()
  );

-- Reload PostgREST schema cache
notify pgrst, 'reload schema';
