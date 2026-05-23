-- PropFlow Database Schema
-- Run this in your Supabase SQL editor

-- ─── profiles ───────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  full_name   text not null,
  email       text not null,
  created_at  timestamptz not null default now()
);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ─── properties ─────────────────────────────────────────────────────────────
create table if not exists public.properties (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.profiles on delete cascade,
  name        text not null,
  address     text not null,
  created_at  timestamptz not null default now()
);

create index if not exists properties_owner_id_idx on public.properties (owner_id);


-- ─── tenants ─────────────────────────────────────────────────────────────────
create table if not exists public.tenants (
  id            uuid primary key default gen_random_uuid(),
  property_id   uuid not null references public.properties on delete cascade,
  full_name     text not null,
  email         text not null,
  phone         text,
  lease_start   date not null,
  lease_end     date,
  monthly_rent  integer not null,  -- in cents
  created_at    timestamptz not null default now()
);

create index if not exists tenants_property_id_idx on public.tenants (property_id);


-- ─── payments ─────────────────────────────────────────────────────────────────
create table if not exists public.payments (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants on delete cascade,
  amount      integer not null,  -- in cents
  due_date    date not null,
  paid_date   date,
  status      text not null check (status in ('paid', 'late', 'missed')),
  created_at  timestamptz not null default now()
);

create index if not exists payments_tenant_id_idx on public.payments (tenant_id);


-- ─── Row Level Security ──────────────────────────────────────────────────────
alter table public.profiles   enable row level security;
alter table public.properties enable row level security;
alter table public.tenants    enable row level security;
alter table public.payments   enable row level security;

-- profiles: users can only see/edit their own profile
create policy "profiles_own" on public.profiles
  for all using (auth.uid() = id);

-- properties: landlord sees only their properties
create policy "properties_own" on public.properties
  for all using (auth.uid() = owner_id);

-- tenants: landlord sees tenants in their properties
create policy "tenants_own" on public.tenants
  for all using (
    exists (
      select 1 from public.properties p
      where p.id = property_id and p.owner_id = auth.uid()
    )
  );

-- payments: landlord sees payments for their tenants
create policy "payments_own" on public.payments
  for all using (
    exists (
      select 1 from public.tenants t
      join public.properties p on p.id = t.property_id
      where t.id = tenant_id and p.owner_id = auth.uid()
    )
  );
