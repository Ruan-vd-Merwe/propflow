-- migration_public_browse.sql
-- Allows anyone (including anonymous visitors) to read listed properties.
-- Run in Supabase SQL editor.

create policy if not exists "public can view listed properties"
  on public.properties for select
  using (is_listed = true);
