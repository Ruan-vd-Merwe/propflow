-- Synthetic seed data for PropFlow
-- Paste this whole file into the Supabase SQL editor and run.
begin;

-- Enable Row Level Security (schema policies exist in supabase/schema.sql)
ALTER TABLE public.profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments   ENABLE ROW LEVEL SECURITY;

-- 1) Create 20 owner accounts (will trigger profile creation via existing trigger)
create temp table if not exists seed_owners as
select gen_random_uuid() as id,
       ('owner' || lpad(i::text,2,'0') || '@example.com') as email,
       json_build_object('full_name', 'Owner ' || i) as raw_user_meta_data,
       i
from generate_series(1,20) as s(i);

insert into auth.users (id, email, raw_user_meta_data, created_at)
select id, email, raw_user_meta_data, now() from seed_owners;

-- 2) Insert 20 properties across Cape Town and Stellenbosch
create temp table if not exists seed_properties as
select gen_random_uuid() as id,
       o.id as owner_id,
       case when s.ord <= 10 then 'CT - ' || s.suburb || ' Complex ' || s.ord
            else 'STB - ' || s.suburb || ' House ' || (s.ord-10)
       end as name,
       case when s.ord <= 10 then (s.ord || ' ' || s.suburb || ' Rd, Cape Town')
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
select id, owner_id, name, address, created_at from seed_properties;

-- 3) Generate 60 tenants (3 per property): 1 student, 1 professional, 1 family
create temp table if not exists seed_tenants as
select gen_random_uuid() as id,
       p.id as property_id,
       -- role by slot: 1=student,2=professional,3=family
       case when slot = 1 then 'student' when slot = 2 then 'professional' else 'family' end as profile,
       -- realistic SA names from mixed lists
       (
         (array['Sipho','Thabo','Lerato','Zanele','Sizwe','Jaco','Pieter','Samantha','James','Anele','Nkosi','Mbali','Dumisani','Riana','Kyle','Morne','Lindiwe','Ayanda','Kabelo','Thandi'])[ (floor(random()*20)+1)::int ]
         || ' ' ||
         (array['van der Merwe','Naidoo','Moyo','Mbeki','Smith','Botha','Nkosi','Dlamini','Khumalo','Adams','Muller','Petersen','Hendricks','Schoeman','Baloyi','Malan','Grobler','Zulu','Mabena','Ngcobo'])[ (floor(random()*20)+1)::int ]
       ) as full_name,
       lower(replace((
         (array['Sipho','Thabo','Lerato','Zanele','Sizwe','Jaco','Pieter','Samantha','James','Anele','Nkosi','Mbali','Dumisani','Riana','Kyle','Morne','Lindiwe','Ayanda','Kabelo','Thandi'])[ (floor(random()*20)+1)::int ]
         || '.' ||
         (array['van der Merwe','Naidoo','Moyo','Mbeki','Smith','Botha','Nkosi','Dlamini','Khumalo','Adams','Muller','Petersen','Hendricks','Schoeman','Baloyi','Malan','Grobler','Zulu','Mabena','Ngcobo'])[ (floor(random()*20)+1)::int ]
       ), ' ', '')) || (floor(random()*900)::int + 100)::text || '@example.com' as email,
       -- phone
       (array['072','073','082','083','084'])[ (floor(random()*5)+1)::int ]
         || lpad((floor(random()*10000000)::int)::text,7,'0') as phone,
       -- lease_start in last 24 months
       (current_date - ((floor(random()*24)::int) || ' months')::interval - ((floor(random()*28)::int) || ' days')::interval)::date as lease_start,
       -- lease_end approx 6-18 months after start (some null)
       case when random() < 0.15 then null else (current_date + ((floor(random()*24)::int) || ' months')::interval)::date end as lease_end,
       -- monthly_rent in Rands (we'll store in cents below when inserting)
       case
         when slot = 1 then (floor(random()*(9000-5000+1))::int + 5000)
         when slot = 2 then (floor(random()*(18000-9000+1))::int + 9000)
         else (floor(random()*(25000-12000+1))::int + 12000)
       end as monthly_rent_rands,
       now() as created_at
from public.properties p
cross join lateral (
  select 1 as slot union all select 2 union all select 3
) s(slot);

-- Insert tenants into public.tenants (monthly_rent stored in cents)
insert into public.tenants (id, property_id, full_name, email, phone, lease_start, lease_end, monthly_rent, created_at)
select id, property_id, full_name, email, phone, lease_start, lease_end, (monthly_rent_rands * 100)::int, created_at
from seed_tenants;

-- 4) Generate 18 months of payments per tenant with risk distribution
-- Determine risk buckets: first 24 tenants = green(perfect), next 21 = amber(occasional late), last 15 = red(chronic)
create temp table seed_tenants_ordered as
select t.*, row_number() over (order by property_id, id) as t_idx
from public.tenants t
order by property_id, id;

insert into public.payments (id, tenant_id, amount, due_date, paid_date, status, created_at)
select gen_random_uuid(), st.id,
       st.monthly_rent,
       (date_trunc('month', current_date) - interval '17 months')::date + (m * interval '1 month') as due_date,
       case
         when bucket = 'green' then ((date_trunc('month', current_date) - interval '17 months')::date + (m * interval '1 month') + ((floor(random()*3))::int || ' days')::interval)::date
         when bucket = 'amber' then
           case when (m % 6) = 0 then ((date_trunc('month', current_date) - interval '17 months')::date + (m * interval '1 month') + ( (floor(random()*10)+3)::int || ' days')::interval)::date
                else ((date_trunc('month', current_date) - interval '17 months')::date + (m * interval '1 month') + ((floor(random()*3))::int || ' days')::interval)::date end
         else -- red
           case when (m % 5) = 0 then null
                else ((date_trunc('month', current_date) - interval '17 months')::date + (m * interval '1 month') + ((floor(random()*25)+5)::int || ' days')::interval)::date end
       end as paid_date,
       case
         when bucket = 'green' then 'paid'
         when bucket = 'amber' then case when (m % 6) = 0 then 'late' else 'paid' end
         else case when (m % 5) = 0 then 'missed' else 'late' end
       end as status,
       now() as created_at
from (
  select st.*, 
    case when t_idx <= 24 then 'green' when t_idx <= 45 then 'amber' else 'red' end as bucket
  from seed_tenants_ordered st
) st,
generate_series(0,17) as m
;

commit;

-- Done. The script creates owners (auth.users), properties, tenants and 18 months of payments per tenant.
