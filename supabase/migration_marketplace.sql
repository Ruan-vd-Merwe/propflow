-- PropFlow — Marketplace Migration
-- Run after: schema.sql, migration_applications.sql, migration_communications.sql, migration_intelligence.sql
--
-- Adds: user registration paths, property marketplace fields,
--       tenant profile table, introduction requests table

-- ─── Extend profiles ──────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists user_type  text check (user_type in ('landlord', 'tenant')),
  add column if not exists phone      text,
  add column if not exists province   text,
  add column if not exists city       text;

-- Update the new-user trigger to capture extended fields from signup metadata
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, user_type, phone, province, city)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'user_type',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'province',
    new.raw_user_meta_data->>'city'
  );
  return new;
end;
$$;

-- ─── Extend properties ────────────────────────────────────────────────────────
alter table public.properties
  add column if not exists property_type  text check (property_type in ('apartment', 'house', 'townhouse', 'room')),
  add column if not exists bedrooms       integer,
  add column if not exists asking_rent    integer,       -- cents
  add column if not exists available_from date,
  add column if not exists suburb         text,
  add column if not exists province       text,
  add column if not exists description    text,
  add column if not exists is_listed      boolean not null default false,
  add column if not exists photos         text[]  not null default '{}';

-- ─── tenant_profiles ──────────────────────────────────────────────────────────
create table if not exists public.tenant_profiles (
  id                  uuid        primary key default gen_random_uuid(),
  user_id             uuid        not null references public.profiles on delete cascade,
  sa_id_number        text,
  looking_in_area     text,
  looking_in_province text,
  current_area        text,
  current_province    text,
  budget_min          integer,    -- cents
  budget_max          integer,    -- cents
  move_in_date        date,
  lease_length_months integer,
  employment_status   text        check (employment_status in ('employed', 'self_employed', 'student', 'other')),
  monthly_income      integer,    -- cents (net)
  is_visible          boolean     not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create unique index if not exists tenant_profiles_user_id_idx
  on public.tenant_profiles (user_id);

create index if not exists tenant_profiles_visible_idx
  on public.tenant_profiles (is_visible)
  where is_visible = true;

-- ─── introduction_requests ─────────────────────────────────────────────────────
create table if not exists public.introduction_requests (
  id           uuid        primary key default gen_random_uuid(),
  landlord_id  uuid        not null references public.profiles  on delete cascade,
  tenant_id    uuid        not null references public.profiles  on delete cascade,
  property_id  uuid        not null references public.properties on delete cascade,
  status       text        not null default 'pending'
                           check (status in ('pending', 'accepted', 'declined')),
  created_at   timestamptz not null default now(),
  unique (landlord_id, tenant_id, property_id)
);

create index if not exists intro_requests_landlord_idx on public.introduction_requests (landlord_id);
create index if not exists intro_requests_tenant_idx   on public.introduction_requests (tenant_id);

-- ─── Row Level Security ────────────────────────────────────────────────────────
alter table public.tenant_profiles       enable row level security;
alter table public.introduction_requests enable row level security;

-- tenant_profiles: own full CRUD; anyone authenticated can read visible profiles
drop policy if exists "tenant_profiles_own"    on public.tenant_profiles;
drop policy if exists "tenant_profiles_browse" on public.tenant_profiles;

create policy "tenant_profiles_own" on public.tenant_profiles
  for all using (auth.uid() = user_id);

create policy "tenant_profiles_browse" on public.tenant_profiles
  for select using (is_visible = true and auth.uid() != user_id);

-- introduction_requests: landlord owns their requests; tenant can view + respond
drop policy if exists "introductions_landlord"      on public.introduction_requests;
drop policy if exists "introductions_tenant_select" on public.introduction_requests;
drop policy if exists "introductions_tenant_update" on public.introduction_requests;

create policy "introductions_landlord" on public.introduction_requests
  for all using (auth.uid() = landlord_id);

create policy "introductions_tenant_select" on public.introduction_requests
  for select using (auth.uid() = tenant_id);

create policy "introductions_tenant_update" on public.introduction_requests
  for update using (auth.uid() = tenant_id);

-- ─── Supabase Storage ─────────────────────────────────────────────────────────
-- Create the property-photos bucket manually in the Supabase Dashboard:
--   Storage → New bucket → Name: "property-photos" → Public: true
-- Or run the following in the SQL editor:

insert into storage.buckets (id, name, public)
values ('property-photos', 'property-photos', true)
on conflict (id) do nothing;

create policy "property_photos_upload" on storage.objects
  for insert with check (
    bucket_id = 'property-photos' and auth.role() = 'authenticated'
  );

create policy "property_photos_public_read" on storage.objects
  for select using (bucket_id = 'property-photos');
