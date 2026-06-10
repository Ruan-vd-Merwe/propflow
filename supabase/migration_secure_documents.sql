-- migration_secure_documents.sql
-- Additive only. Extends the existing document system with property-specific
-- secure document storage, access logging, and property location fields.

-- ─── Location columns on properties ──────────────────────────────────────────
alter table public.properties
  add column if not exists suburb            text,
  add column if not exists city              text,
  add column if not exists province          text,
  add column if not exists postal_code       text,
  add column if not exists latitude          numeric(10,7),
  add column if not exists longitude         numeric(10,7),
  add column if not exists area_news_enabled boolean not null default false;

-- ─── Property documents ───────────────────────────────────────────────────────
-- Richer document table keyed to a specific property. Sits alongside the
-- existing public.documents table which handles tenant-facing documents.

create table if not exists public.property_documents (
  id               uuid        primary key default gen_random_uuid(),
  owner_id         uuid        not null references auth.users(id) on delete cascade,
  property_id      uuid        not null references public.properties(id) on delete cascade,
  document_type    text        not null
                               check (document_type in (
                                 'lease_contract',
                                 'bank_statement',
                                 'inspection_report',
                                 'levy_statement',
                                 'bond_statement',
                                 'rates_account',
                                 'body_corporate_minutes',
                                 'maintenance_invoice',
                                 'insurance_policy',
                                 'other'
                               )),
  file_name        text        not null,
  storage_path     text        not null,
  storage_bucket   text        not null,
  file_size_bytes  bigint,
  mime_type        text,
  sha256_hex       text,       -- duplicate detection and tamper evidence only
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists property_documents_owner_id_idx    on public.property_documents (owner_id);
create index if not exists property_documents_property_id_idx on public.property_documents (property_id);
create index if not exists property_documents_type_idx        on public.property_documents (document_type);

alter table public.property_documents enable row level security;

create policy "owners can manage own property documents"
  on public.property_documents
  for all
  using  (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- ─── Document access log ─────────────────────────────────────────────────────
create table if not exists public.document_access_log (
  id           uuid        primary key default gen_random_uuid(),
  document_id  uuid        not null references public.property_documents(id) on delete cascade,
  accessed_by  uuid        not null references auth.users(id) on delete cascade,
  action       text        not null check (action in ('view', 'download', 'upload', 'delete')),
  ip_address   text,
  user_agent   text,
  accessed_at  timestamptz not null default now()
);

create index if not exists document_access_log_document_id_idx on public.document_access_log (document_id);
create index if not exists document_access_log_user_id_idx     on public.document_access_log (accessed_by);

alter table public.document_access_log enable row level security;

create policy "owners can view access logs for own documents"
  on public.document_access_log
  for select
  using (
    exists (
      select 1 from public.property_documents pd
      where pd.id = document_id and pd.owner_id = auth.uid()
    )
  );

create policy "authenticated users can log own accesses"
  on public.document_access_log
  for insert
  with check (accessed_by = auth.uid());

-- ─── Storage buckets (all private) ───────────────────────────────────────────
-- path convention: {owner_id}/{property_id}/{timestamp}_{safe_filename}

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('property-documents',  'property-documents',  false, 52428800,
   array[
     'application/pdf', 'image/jpeg', 'image/png', 'image/webp',
     'application/msword',
     'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
   ]),
  ('bank-statements',     'bank-statements',     false, 52428800,
   array['application/pdf', 'image/jpeg', 'image/png']),
  ('lease-contracts',     'lease-contracts',     false, 52428800,
   array[
     'application/pdf', 'application/msword',
     'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
   ]),
  ('body-corporate-docs', 'body-corporate-docs', false, 52428800,
   array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

-- Storage RLS — keyed to auth.uid() as first path segment

-- property-documents
create policy "property-documents owner upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'property-documents'
    and (storage.foldername(name))[1] = auth.uid()::text);

create policy "property-documents owner read"
  on storage.objects for select to authenticated
  using  (bucket_id = 'property-documents'
    and (storage.foldername(name))[1] = auth.uid()::text);

create policy "property-documents owner delete"
  on storage.objects for delete to authenticated
  using  (bucket_id = 'property-documents'
    and (storage.foldername(name))[1] = auth.uid()::text);

-- bank-statements
create policy "bank-statements owner upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'bank-statements'
    and (storage.foldername(name))[1] = auth.uid()::text);

create policy "bank-statements owner read"
  on storage.objects for select to authenticated
  using  (bucket_id = 'bank-statements'
    and (storage.foldername(name))[1] = auth.uid()::text);

create policy "bank-statements owner delete"
  on storage.objects for delete to authenticated
  using  (bucket_id = 'bank-statements'
    and (storage.foldername(name))[1] = auth.uid()::text);

-- lease-contracts
create policy "lease-contracts owner upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'lease-contracts'
    and (storage.foldername(name))[1] = auth.uid()::text);

create policy "lease-contracts owner read"
  on storage.objects for select to authenticated
  using  (bucket_id = 'lease-contracts'
    and (storage.foldername(name))[1] = auth.uid()::text);

create policy "lease-contracts owner delete"
  on storage.objects for delete to authenticated
  using  (bucket_id = 'lease-contracts'
    and (storage.foldername(name))[1] = auth.uid()::text);

-- body-corporate-docs
create policy "body-corporate-docs owner upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'body-corporate-docs'
    and (storage.foldername(name))[1] = auth.uid()::text);

create policy "body-corporate-docs owner read"
  on storage.objects for select to authenticated
  using  (bucket_id = 'body-corporate-docs'
    and (storage.foldername(name))[1] = auth.uid()::text);

create policy "body-corporate-docs owner delete"
  on storage.objects for delete to authenticated
  using  (bucket_id = 'body-corporate-docs'
    and (storage.foldername(name))[1] = auth.uid()::text);
