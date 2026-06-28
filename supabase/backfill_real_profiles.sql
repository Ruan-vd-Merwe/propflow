-- backfill_real_profiles.sql
-- ONE-TIME backfill: set role flags from user_type for all existing profiles
-- whose is_landlord/is_tenant are still false (never populated by upsert).
--
-- DO NOT RUN without reviewing — this updates every profile row.

-- Set is_landlord = true where user_type = 'landlord'
update public.profiles
set is_landlord = true
where user_type = 'landlord' and is_landlord = false;

-- Set is_tenant = true where user_type = 'tenant'
update public.profiles
set is_tenant = true
where user_type = 'tenant' and is_tenant = false;

-- Set email_confirmed = true for users whose auth.users.email_confirmed_at is set
update public.profiles p
set email_confirmed = true
where email_confirmed = false
  and exists (
    select 1 from auth.users u
    where u.id = p.id and u.email_confirmed_at is not null
  );

-- Verify: show all real (non-synthetic) users after backfill
-- select id, email, is_landlord, is_tenant, is_connector, user_type, email_confirmed
-- from public.profiles
-- where email not like '%@example.com'
-- order by created_at desc;
