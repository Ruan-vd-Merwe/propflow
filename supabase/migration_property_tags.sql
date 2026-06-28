-- migration_property_tags.sql
-- Adds feature and area tag columns to properties for the interest-match engine.
-- Run after migration_marketplace.sql.

alter table public.properties
  add column if not exists floor_size_m2       integer,
  add column if not exists pets_allowed        boolean  not null default false,
  add column if not exists parking_available   boolean  not null default false,
  add column if not exists fibre_available     boolean  not null default false,
  add column if not exists property_tags       text[]   not null default '{}',
  add column if not exists area_tags           text[]   not null default '{}',
  add column if not exists lifestyle_tags      text[]   not null default '{}';
