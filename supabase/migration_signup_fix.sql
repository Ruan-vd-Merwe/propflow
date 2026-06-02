-- Fix: ensure all signup-related columns exist (idempotent)

alter table public.tenant_profiles
  add column if not exists sa_id_number      text,
  add column if not exists current_area      text,
  add column if not exists current_province  text,
  add column if not exists whatsapp_opted_in boolean default true;

alter table public.profiles
  add column if not exists whatsapp_opted_in boolean default true;
