-- PropTrust: Document Storage Migration
-- Run in Supabase SQL editor after existing migrations

-- ─── documents table ──────────────────────────────────────────────────────────

create table if not exists public.documents (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid references auth.users on delete cascade,
  tenant_id       uuid references public.tenants,
  property_id     uuid references public.properties,
  document_type   text not null check (document_type in (
                  'id_document',
                  'bank_statement',
                  'lease_agreement',
                  'proof_of_income',
                  'inspection_report',
                  'other'
                  )),
  file_name       text not null,
  file_url        text not null,
  file_size       integer,
  mime_type       text,
  notes           text,
  uploaded_at     timestamptz default now(),
  created_at      timestamptz default now()
);

create index if not exists documents_owner_id_idx    on public.documents (owner_id);
create index if not exists documents_tenant_id_idx   on public.documents (tenant_id);
create index if not exists documents_property_id_idx on public.documents (property_id);

alter table public.documents enable row level security;

create policy "users can manage own documents"
  on public.documents for all
  using (auth.uid() = owner_id);

create policy "landlords can view tenant documents"
  on public.documents for select
  using (
    exists (
      select 1 from public.tenants t
      join public.properties p on p.id = t.property_id
      where t.id = tenant_id
      and p.owner_id = auth.uid()
    )
  );

-- ─── Storage bucket ───────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict do nothing;

create policy "users can upload own documents"
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users can view own documents"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users can delete own documents"
  on storage.objects for delete
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
