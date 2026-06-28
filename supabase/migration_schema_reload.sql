-- migration_schema_reload.sql
-- The fibre_available column exists (added in migration_property_tags.sql)
-- but PostgREST's schema cache is stale. This reloads it.
-- Run after migration_property_tags.sql.

notify pgrst, 'reload schema';
