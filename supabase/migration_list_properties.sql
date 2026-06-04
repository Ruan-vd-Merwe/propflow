-- migration_list_properties.sql
-- Marks all existing properties as listed so they appear in browse.

update public.properties
set is_listed = true
where is_listed is null or is_listed = false;
