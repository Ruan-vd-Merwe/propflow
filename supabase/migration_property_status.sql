-- migration_property_status.sql
-- Adds a status column to properties, replacing the boolean is_listed flag.
-- Run after migration_property_tags.sql and migration_schema_reload.sql.

-- 1. Add status column
alter table public.properties
  add column if not exists status text not null default 'available';

-- 2. CHECK constraint for allowed values
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'properties_status_check'
  ) then
    alter table public.properties
      add constraint properties_status_check
      check (status in ('draft', 'available', 'available_from', 'occupied', 'archived'));
  end if;
end $$;

-- 3. Backfill from is_listed
update public.properties
set status = case
  when is_listed = true then 'available'
  else 'draft'
end
where status = 'available'; -- only touch rows that still have the default

-- 4. Replace the old RLS browse policy with one based on status
drop policy if exists "public can view listed properties" on public.properties;

create policy "public can view listed properties"
  on public.properties for select
  using (status in ('available', 'available_from'));

-- 5. Reload PostgREST schema cache
notify pgrst, 'reload schema';
