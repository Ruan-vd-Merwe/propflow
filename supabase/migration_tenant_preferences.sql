-- migration_tenant_preferences.sql
-- Adds rich preference columns to tenant_profiles for the interest-match engine.
-- Run after migration_marketplace.sql.

alter table public.tenant_profiles
  add column if not exists desired_bedrooms    integer,
  add column if not exists has_car             boolean   not null default true,
  add column if not exists has_pets            boolean   not null default false,
  add column if not exists lifestyle_interests text[]    not null default '{}',
  add column if not exists property_interests  text[]    not null default '{}',
  add column if not exists area_interests      text[]    not null default '{}',
  add column if not exists must_haves          text[]    not null default '{}',
  add column if not exists dealbreakers        text[]    not null default '{}',
  add column if not exists work_location       text,
  add column if not exists importance_weights  jsonb     not null default '{}';
