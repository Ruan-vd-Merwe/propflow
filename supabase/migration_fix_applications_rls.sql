-- Fix: replace over-permissive anon INSERT policy on tenant_applications
-- The original applications_insert_public used WITH CHECK (true), allowing
-- anon to insert rows with any status or landlord_notes value.
-- Replace with a tight constraint: pending status, real property, no landlord fields.

drop policy if exists "applications_insert_public" on public.tenant_applications;

create policy "tenant_applications_insert_anon" on public.tenant_applications
  for insert
  to anon
  with check (
    status = 'pending'
    and property_id is not null
    and landlord_notes is null
  );
