-- migration_rls_storage_hardening_pre_launch.sql
-- Pre-launch RLS + storage hardening pass.
-- Run in Supabase SQL editor (or via the Supabase MCP apply_migration tool),
-- consistent with every other migration_*.sql file in this project.
--
-- Fixes four issues found in a pre-launch security audit:
--   1. public.properties had an unrestricted "using (true)" SELECT policy
--      (properties_public_read, from migration_applications.sql) stacked
--      alongside a status-scoped one. Permissive RLS policies are OR'd
--      together, so the status scoping was dead weight — anon/authenticated
--      could read every property row regardless of listing status.
--   2. Even with row access scoped, anon still had column-level SELECT on
--      the owner's financial columns (bond, purchase price, valuation,
--      levy/rates/insurance) added across migration_finance.sql /
--      migration_portfolio_finance.sql. Nothing ever revoked those.
--   3. tenant-documents storage policies only checked auth.role() =
--      'authenticated' — any logged-in user could list/read any tenant's
--      uploaded documents directly via the storage API. The documents and
--      tenant-verification buckets already use per-user-folder scoping
--      ((storage.foldername(name))[1] = auth.uid()::text); tenant-documents
--      never got the same treatment.
--   4. property-photos DELETE policy only checked auth.role() =
--      'authenticated' — any logged-in user could delete any property's
--      photos. Upload path convention is `{propertyId}/...`
--      (src/app/api/upload/property-photo/route.ts), so ownership must be
--      checked against public.properties, not auth.uid() directly.
--
-- KNOWN BEHAVIOR CHANGE (accepted, discussed pre-apply):
--   /apply/[propertyId] does an anon lookup of (id, name, address) with no
--   status filter, so a landlord could previously share an apply link for
--   an off-market/reserved property. After dropping properties_public_read,
--   that lookup now falls through to "public can view listed properties"
--   (status in ('available','available_from')) and will 404 for any
--   property not in that status. Applications are only expected to be
--   open while a property is actively listed as available.

-- ── 1 & 2: properties ────────────────────────────────────────────────────
--
-- NOTE ON #2: a bare `revoke select (col, ...) ... from anon` does NOT work
-- here — Supabase grants table-wide `select` on all public tables to anon
-- by default, and a table-wide grant supersedes a column-level revoke
-- (verified live: has_table_privilege('anon', 'properties', 'select') was
-- still true after the column-level revoke alone). The only way to actually
-- restrict anon to a column subset is to revoke the table-wide grant and
-- grant back an explicit allowlist.

drop policy if exists "properties_public_read" on public.properties;

revoke select on public.properties from anon;

grant select (
  id, name, address, suburb, province, street_name, street_number,
  building_name, block_number, unit_number, floor_number,
  bedrooms, floor_size_m2, property_type, description,
  monthly_rent_cents, deposit_amount_cents, rental_due_day,
  asking_rent, available_from, is_listed, status,
  lease_start_date, lease_end_date,
  photos, area_tags, lifestyle_tags, property_tags,
  parking_available, pets_allowed, fibre_available,
  created_at, owner_id
) on public.properties to anon;

-- owner_id is a plain FK (not a financial column) — /browse/[id] needs it
-- to show "member since" + the owner's other listings count for anon
-- visitors. Excluded from the allowlist above are exactly the columns
-- from migration_finance.sql / migration_portfolio_finance.sql: bond_*,
-- purchase_price_cents, current_value_cents, purchase_date,
-- levy/rates/insurance_monthly_cents, management_fee_pct, and notes.
--
-- Application-side: src/app/browse/page.tsx and src/app/browse/[id]/page.tsx
-- previously did `.select("*")` on this anon-reachable table, which now
-- fails with 42501 (permission denied) since anon no longer has table-wide
-- select. Both were switched to the explicit PUBLIC_PROPERTY_COLUMNS list
-- in src/lib/types.ts. /apply/[propertyId] already selected only
-- (id, name, address) and needed no change.

-- ── 3: tenant-documents storage — lock to per-user folders ──────────────

drop policy if exists "Tenants can upload their own documents" on storage.objects;
drop policy if exists "Landlords can view tenant documents" on storage.objects;

create policy "tenant-documents owner upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'tenant-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "tenant-documents owner read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'tenant-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── 4: property-photos — fix delete ownership check ─────────────────────

drop policy if exists "Landlords can delete their property photos" on storage.objects;

create policy "Landlords can delete their property photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'property-photos'
    and exists (
      select 1 from public.properties p
      where p.id::text = (storage.foldername(name))[1]
        and p.owner_id = auth.uid()
    )
  );

notify pgrst, 'reload schema';
