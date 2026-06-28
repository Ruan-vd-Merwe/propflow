-- migration_address_granularity.sql
-- Adds structured, building-level address fields to the properties table.
-- SA rentals are dominated by sectional-title units, so building name, block,
-- unit, and floor are critical for deduplication and future building-level
-- features. All columns are intentionally nullable for backward compatibility
-- with existing rows; the legacy free-text `address` column is left untouched.
--
-- NOTE: `postal_code` already exists on this table (added in
-- migration_secure_documents.sql) and is therefore excluded here to avoid
-- a redundant ADD COLUMN.
--
-- Run after: migration_secure_documents.sql

alter table public.properties
  add column if not exists street_number  text,   -- e.g. "12"
  add column if not exists street_name    text,   -- e.g. "Beach Road"
  add column if not exists building_name  text,   -- complex / scheme / building name
  add column if not exists block_number   text,   -- section or block within a complex
  add column if not exists unit_number    text,   -- flat / unit number
  add column if not exists floor_number   text;   -- floor within building
