-- ─── Add portal_token to tenants ─────────────────────────────────────────────
-- UUID-based shareable token for the tenant portal link.
-- Safe to run multiple times (idempotent).

alter table public.tenants
  add column if not exists portal_token uuid default gen_random_uuid();

-- Back-fill any rows that somehow have NULL (shouldn't happen with the default)
update public.tenants
set portal_token = gen_random_uuid()
where portal_token is null;

-- Make it non-null going forward
alter table public.tenants
  alter column portal_token set not null;

-- Unique index so lookups are fast and tokens can't collide
create unique index if not exists tenants_portal_token_idx
  on public.tenants (portal_token);
