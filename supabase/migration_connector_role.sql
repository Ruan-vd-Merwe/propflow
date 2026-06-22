-- migration_connector_role.sql
-- Adds missing is_connector column and widens the user_type CHECK constraint
-- to support the 3-role model (landlord / tenant / connector).
-- Safe to run multiple times.
--
-- Run after: migration_marketplace.sql (which added user_type, is_landlord, is_tenant)

-- 1. Add missing column
alter table public.profiles
  add column if not exists is_connector boolean not null default false;

-- 2. Widen user_type CHECK constraint to include 'connector'.
--    The old constraint (from migration_marketplace.sql) only allows ('landlord','tenant').
--    Postgres has no ALTER CONSTRAINT or IF EXISTS for drop, so use DO block.
do $$
begin
  alter table public.profiles drop constraint profiles_user_type_check;
exception
  when undefined_object then null; -- constraint doesn't exist, nothing to drop
end $$;

alter table public.profiles
  add constraint profiles_user_type_check
  check (user_type in ('landlord', 'tenant', 'connector'));

-- 3. Update the new-user trigger to include is_connector from signup metadata
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (
    id, full_name, email, user_type, phone, province, city,
    is_landlord, is_tenant, is_connector
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'user_type',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'province',
    new.raw_user_meta_data->>'city',
    coalesce((new.raw_user_meta_data->>'is_landlord')::boolean, false),
    coalesce((new.raw_user_meta_data->>'is_tenant')::boolean, false),
    coalesce((new.raw_user_meta_data->>'is_connector')::boolean, false)
  );
  return new;
end;
$$;

-- 4. Reload PostgREST schema cache so the new column is visible immediately
notify pgrst, 'reload schema';
