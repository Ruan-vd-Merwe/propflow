-- PropFlow: Storage buckets for property photos and tenant documents
-- Run this in Supabase SQL editor

-- ─── Property Photos bucket ─────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('property-photos', 'property-photos', true)
on conflict (id) do nothing;

create policy "Anyone can view property photos"
  on storage.objects for select
  using (bucket_id = 'property-photos');

create policy "Landlords can upload property photos"
  on storage.objects for insert
  with check (
    bucket_id = 'property-photos'
    and auth.role() = 'authenticated'
  );

create policy "Landlords can delete their property photos"
  on storage.objects for delete
  using (
    bucket_id = 'property-photos'
    and auth.role() = 'authenticated'
  );

-- ─── Tenant Documents bucket ─────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('tenant-documents', 'tenant-documents', false)
on conflict (id) do nothing;

create policy "Tenants can upload their own documents"
  on storage.objects for insert
  with check (
    bucket_id = 'tenant-documents'
    and auth.role() = 'authenticated'
  );

create policy "Landlords can view tenant documents"
  on storage.objects for select
  using (
    bucket_id = 'tenant-documents'
    and auth.role() = 'authenticated'
  );

-- ─── Add bank_statement_url to tenant_applications ───────────────────────────
alter table public.tenant_applications
  add column if not exists bank_statement_url text;
