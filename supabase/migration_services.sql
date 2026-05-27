-- ─── Services Marketplace ────────────────────────────────────────────────────
-- Safe to run multiple times (idempotent).

-- WhatsApp opt-in on tenant_profiles
alter table public.tenant_profiles
  add column if not exists whatsapp_opted_in boolean not null default true;

-- Service categories
create table if not exists public.service_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  icon        text,
  description text,
  sort_order  integer default 0
);

-- Service providers
create table if not exists public.service_providers (
  id               uuid primary key default gen_random_uuid(),
  category_id      uuid references public.service_categories on delete cascade,
  name             text not null,
  phone            text,
  whatsapp         text,
  area             text,
  province         text,
  rate_description text,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now()
);

-- Service bookings
create table if not exists public.service_bookings (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid references public.tenants on delete cascade,
  provider_id    uuid references public.service_providers on delete set null,
  property_id    uuid references public.properties on delete cascade,
  scheduled_date date,
  notes          text,
  status         text not null default 'requested',
  created_at     timestamptz not null default now()
);

create index if not exists service_bookings_tenant_idx   on public.service_bookings (tenant_id);
create index if not exists service_bookings_property_idx on public.service_bookings (property_id);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

alter table public.service_categories enable row level security;
alter table public.service_providers   enable row level security;
alter table public.service_bookings    enable row level security;

-- Categories and providers are publicly readable
create policy "svc_cat_read"  on public.service_categories for select using (true);
create policy "svc_prov_read" on public.service_providers  for select using (is_active = true);

-- Bookings: anyone can insert (token-authenticated portal); landlords can read their own
drop policy if exists "svc_booking_insert" on public.service_bookings;
create policy "svc_booking_insert" on public.service_bookings
  for insert with check (true);

drop policy if exists "svc_booking_select" on public.service_bookings;
create policy "svc_booking_select" on public.service_bookings
  for select using (
    exists (
      select 1 from public.tenants t
      join public.properties p on p.id = t.property_id
      where t.id = tenant_id and p.owner_id = auth.uid()
    )
  );

-- ─── Seed categories ─────────────────────────────────────────────────────────

insert into public.service_categories (name, icon, description, sort_order) values
  ('Garden Service',   '🌿', 'Weekly or monthly garden maintenance, lawn mowing, trimming',  1),
  ('Car Wash',         '🚗', 'Standard exterior wash or full valet at your property',         2),
  ('Pet Grooming',     '🐾', 'Mobile dog and cat grooming — bath, trim, nails',               3),
  ('Laundry Service',  '👕', 'Pickup, wash, dry and fold — charged per kg',                   4),
  ('Security Escort',  '🛡️', 'Safe walk-home service for evenings and late nights',           5),
  ('Handyman',         '🔨', 'General repairs, installations and odd jobs — hourly rate',     6)
on conflict do nothing;

-- ─── Sample providers (Cape Town & Johannesburg) ─────────────────────────────

do $$
declare
  cat_garden   uuid;
  cat_carwash  uuid;
  cat_grooming uuid;
  cat_laundry  uuid;
  cat_security uuid;
  cat_handyman uuid;
begin
  select id into cat_garden   from public.service_categories where name = 'Garden Service'  limit 1;
  select id into cat_carwash  from public.service_categories where name = 'Car Wash'         limit 1;
  select id into cat_grooming from public.service_categories where name = 'Pet Grooming'     limit 1;
  select id into cat_laundry  from public.service_categories where name = 'Laundry Service'  limit 1;
  select id into cat_security from public.service_categories where name = 'Security Escort'  limit 1;
  select id into cat_handyman from public.service_categories where name = 'Handyman'         limit 1;

  insert into public.service_providers
    (category_id, name, phone, whatsapp, area, province, rate_description) values
    (cat_garden,   'Green Thumb Gardens', '0721234001', '0721234001', 'Sea Point / Atlantic Seaboard', 'Western Cape', 'From R350 per visit'),
    (cat_garden,   'Mow & Grow',          '0831234002', '0831234002', 'Sandton / Rosebank',            'Gauteng',       'From R400 per visit'),
    (cat_carwash,  'Sparkle Mobile Wash', '0711234003', '0711234003', 'Cape Town CBD & surrounds',     'Western Cape', 'R120 standard / R280 full valet'),
    (cat_carwash,  'CleanRide Joburg',    '0741234004', '0741234004', 'Johannesburg North',            'Gauteng',       'R130 standard / R300 full valet'),
    (cat_grooming, 'Paws & Claws Mobile', '0761234005', '0761234005', 'Cape Town & surrounds',         'Western Cape', 'From R280 per dog, R220 per cat'),
    (cat_grooming, 'Furry Friends SA',    '0791234006', '0791234006', 'Pretoria / Centurion',          'Gauteng',       'From R260 per dog'),
    (cat_laundry,  'Fresh Fold',          '0821234007', '0821234007', 'Cape Town & surrounds',         'Western Cape', 'R35/kg — free pickup & delivery'),
    (cat_laundry,  'LaundryExpress JHB',  '0851234008', '0851234008', 'Johannesburg',                  'Gauteng',       'R30/kg — same-day available'),
    (cat_security, 'SafeWalk CT',         '0861234009', '0861234009', 'Cape Town',                     'Western Cape', 'R80 per escort'),
    (cat_handyman, 'FixIt Pro',           '0871234010', '0871234010', 'Cape Town',                     'Western Cape', 'R280/hour, first hour min'),
    (cat_handyman, 'Handy Harry JHB',     '0881234011', '0881234011', 'Johannesburg & surrounds',      'Gauteng',       'R250/hour, first hour min')
  on conflict do nothing;
end $$;
