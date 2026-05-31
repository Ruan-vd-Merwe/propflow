-- Synthetic seed data for PropFlow
-- Safe to run multiple times — fully idempotent.
-- Paste into the Supabase SQL editor and run.

begin;

-- Enable Row Level Security
alter table public.profiles   enable row level security;
alter table public.properties enable row level security;
alter table public.tenants    enable row level security;
alter table public.payments   enable row level security;

-- ─── Step 1: Desired owner emails ────────────────────────────────────────────

create temp table seed_owner_emails as
select
  i,
  ('owner' || lpad(i::text,2,'0') || '@example.com') as email,
  json_build_object(
    'full_name', 'Owner ' || i,
    'user_type', 'landlord'
  )::jsonb as meta
from generate_series(1,20) as s(i);

-- ─── Step 2: Insert only users that don't already exist ───────────────────────

insert into auth.users (
  id, aud, role,
  email, encrypted_password,
  email_confirmed_at, confirmation_sent_at,
  raw_user_meta_data, raw_app_meta_data,
  is_super_admin, created_at, updated_at
)
select
  gen_random_uuid(),
  'authenticated', 'authenticated',
  e.email, '',
  now(), now(),
  e.meta,
  '{"provider":"email","providers":["email"]}'::jsonb,
  false, now(), now()
from seed_owner_emails e
where not exists (
  select 1 from auth.users u where u.email = e.email
);

-- ─── Step 3: Build seed_owners from actual IDs in auth.users ─────────────────

create temp table seed_owners as
select u.id, e.i
from seed_owner_emails e
join auth.users u on u.email = e.email;

-- Ensure profiles exist for all owners (trigger may already have run)
insert into public.profiles (id, full_name, email, user_type, created_at)
select
  u.id,
  (e.meta->>'full_name'),
  e.email,
  'landlord',
  now()
from seed_owner_emails e
join auth.users u on u.email = e.email
on conflict (id) do nothing;

-- ─── Step 4: Properties ───────────────────────────────────────────────────────

create temp table seed_properties as
select
  gen_random_uuid() as id,
  o.id as owner_id,
  case when s.ord <= 10
    then 'CT - ' || s.suburb || ' Complex ' || s.ord
    else 'STB - ' || s.suburb || ' House ' || (s.ord-10)
  end as name,
  case when s.ord <= 10
    then (s.ord || ' ' || s.suburb || ' Rd, Cape Town')
    else (s.ord || ' ' || s.suburb || ' Ave, Stellenbosch')
  end as address,
  now() as created_at
from unnest(array[
    'Sea Point','Observatory','Woodstock','Gardens','Green Point',
    'Claremont','Rondebosch','Newlands','Vredehoek','Bo-Kaap',
    'Central','Cloetesville','Idas Valley','Die Boord','Brandwacht',
    'Banghoek','Paradyskloof','Eikestad','Helshoogte','Koelenhof'
  ]) with ordinality as s(suburb, ord)
join seed_owners o on o.i = s.ord;

insert into public.properties (id, owner_id, name, address, created_at)
select id, owner_id, name, address, created_at
from seed_properties
on conflict do nothing;

-- Re-read actual property IDs (handles the case where they already existed)
create temp table seed_properties_actual as
select p.id, p.owner_id
from public.properties p
join seed_owners o on o.id = p.owner_id;

-- ─── Step 5: Tenants ──────────────────────────────────────────────────────────

create temp table seed_tenants as
select
  gen_random_uuid() as id,
  p.id as property_id,
  case when slot = 1 then 'student'
       when slot = 2 then 'professional'
       else 'family' end as profile,
  (
    (array['Sipho','Thabo','Lerato','Zanele','Sizwe','Jaco','Pieter',
           'Samantha','James','Anele','Nkosi','Mbali','Dumisani','Riana',
           'Kyle','Morne','Lindiwe','Ayanda','Kabelo','Thandi']
    )[ (floor(random()*20)+1)::int ]
    || ' ' ||
    (array['van der Merwe','Naidoo','Moyo','Mbeki','Smith','Botha','Nkosi',
           'Dlamini','Khumalo','Adams','Muller','Petersen','Hendricks',
           'Schoeman','Baloyi','Malan','Grobler','Zulu','Mabena','Ngcobo']
    )[ (floor(random()*20)+1)::int ]
  ) as full_name,
  lower(replace((
    (array['sipho','thabo','lerato','zanele','sizwe','jaco','pieter',
           'samantha','james','anele','nkosi','mbali','dumisani','riana',
           'kyle','morne','lindiwe','ayanda','kabelo','thandi']
    )[ (floor(random()*20)+1)::int ]
    || '.'  ||
    (array['merwe','naidoo','moyo','mbeki','smith','botha','nkosi',
           'dlamini','khumalo','adams','muller','petersen','hendricks',
           'schoeman','baloyi','malan','grobler','zulu','mabena','ngcobo']
    )[ (floor(random()*20)+1)::int ]
  ), ' ', ''))
  || (floor(random()*9000)::int + 1000)::text
  || '@tenant.example.com' as email,
  (array['072','073','082','083','084'])[ (floor(random()*5)+1)::int ]
    || lpad((floor(random()*10000000)::int)::text,7,'0') as phone,
  ( current_date
    - ((floor(random()*24)::int) || ' months')::interval
    - ((floor(random()*28)::int) || ' days')::interval
  )::date as lease_start,
  case when random() < 0.15 then null
       else (current_date + ((floor(random()*24)::int) || ' months')::interval)::date
  end as lease_end,
  case
    when slot = 1 then (floor(random()*(9000-5000+1))::int + 5000)
    when slot = 2 then (floor(random()*(18000-9000+1))::int + 9000)
    else               (floor(random()*(25000-12000+1))::int + 12000)
  end as monthly_rent_rands,
  now() as created_at
from seed_properties_actual p
cross join lateral (
  select 1 as slot union all select 2 union all select 3
) s(slot);

insert into public.tenants
  (id, property_id, full_name, email, phone, lease_start, lease_end, monthly_rent, created_at)
select
  id, property_id, full_name, email, phone, lease_start, lease_end,
  (monthly_rent_rands * 100)::int,
  created_at
from seed_tenants
on conflict do nothing;

-- ─── Step 6: Payments (18 months, risk distribution) ────────────────────────

create temp table seed_tenants_ordered as
select t.*, row_number() over (order by property_id, id) as t_idx
from public.tenants t
-- Limit to only the tenants we just (re-)confirmed exist
where exists (
  select 1 from seed_tenants st where st.id = t.id
);

insert into public.payments (id, tenant_id, amount, due_date, paid_date, status, created_at)
select
  gen_random_uuid(),
  st.id,
  st.monthly_rent,
  ( date_trunc('month', current_date)
    - interval '17 months'
    + (m * interval '1 month')
  )::date as due_date,
  case bucket
    when 'green' then
      ( date_trunc('month', current_date) - interval '17 months'
        + (m * interval '1 month')
        + ((floor(random()*3))::int || ' days')::interval
      )::date
    when 'amber' then
      case when (m % 6) = 0
        then ( date_trunc('month', current_date) - interval '17 months'
               + (m * interval '1 month')
               + ((floor(random()*10)+3)::int || ' days')::interval
             )::date
        else ( date_trunc('month', current_date) - interval '17 months'
               + (m * interval '1 month')
               + ((floor(random()*3))::int || ' days')::interval
             )::date
      end
    else -- red
      case when (m % 5) = 0 then null
        else ( date_trunc('month', current_date) - interval '17 months'
               + (m * interval '1 month')
               + ((floor(random()*25)+5)::int || ' days')::interval
             )::date
      end
  end as paid_date,
  case bucket
    when 'green' then 'paid'
    when 'amber' then case when (m % 6) = 0 then 'late' else 'paid' end
    else              case when (m % 5) = 0 then 'missed' else 'late' end
  end as status,
  now() as created_at
from (
  select sto.*,
    case
      when t_idx <= 24 then 'green'
      when t_idx <= 45 then 'amber'
      else 'red'
    end as bucket
  from seed_tenants_ordered sto
) st,
generate_series(0,17) as m
-- Skip months whose payment already exists for this tenant
where not exists (
  select 1 from public.payments px
  where px.tenant_id = st.id
    and px.due_date = (
      date_trunc('month', current_date) - interval '17 months'
      + (m * interval '1 month')
    )::date
);

commit;

-- Done.
-- Creates / skips: 20 owners, 20 properties, 60 tenants, ~1 080 payments.
-- Safe to run again — all inserts are idempotent.
