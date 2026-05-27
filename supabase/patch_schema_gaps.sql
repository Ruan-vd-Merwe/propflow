-- ─── Patch: fill gaps left by partial migration runs ────────────────────────
-- Safe to run multiple times (all operations are idempotent).

-- 1. access_token on tenants (missing from migration_communications.sql)
alter table public.tenants
  add column if not exists access_token text unique;

update public.tenants
set access_token = encode(gen_random_bytes(32), 'hex')
where access_token is null;

alter table public.tenants
  alter column access_token set default encode(gen_random_bytes(32), 'hex');

-- 2. checkin_responses: add columns that the old schema didn't have
alter table public.checkin_responses
  add column if not exists month        text,
  add column if not exists token        text,
  add column if not exists unit_working boolean,
  add column if not exists flag_text    text,
  add column if not exists sent_at      timestamptz not null default now(),
  add column if not exists responded_at timestamptz;

-- Back-fill token for any existing rows that don't have one
update public.checkin_responses
set token = encode(gen_random_bytes(32), 'hex')
where token is null;

-- Add unique constraint on token (ignore if already exists)
do $$
begin
  if not exists (
    select 1 from pg_indexes
    where tablename = 'checkin_responses' and indexname = 'checkin_responses_token_key'
  ) then
    create unique index checkin_responses_token_key on public.checkin_responses (token)
      where token is not null;
  end if;
end $$;

-- Unique index on (tenant_id, month)
create unique index if not exists checkin_tenant_month_idx
  on public.checkin_responses (tenant_id, month)
  where month is not null;

-- Rename old columns to the names the app code expects (if old names exist)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'checkin_responses'
      and column_name  = 'everything_working'
  ) then
    alter table public.checkin_responses
      rename column everything_working to unit_working_legacy;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'checkin_responses'
      and column_name  = 'other_notes'
  ) then
    alter table public.checkin_responses
      rename column other_notes to flag_text_legacy;
  end if;
end $$;

-- 3. RLS policies for comms tables (drop-and-recreate to match latest spec)
alter table public.communications_log enable row level security;
alter table public.tenant_queries     enable row level security;
alter table public.checkin_responses  enable row level security;

-- communications_log
drop policy if exists "comms_log_select_own" on public.communications_log;
create policy "comms_log_select_own" on public.communications_log
  for select using (
    exists (
      select 1 from public.tenants t
      join public.properties p on p.id = t.property_id
      where t.id = tenant_id and p.owner_id = auth.uid()
    )
  );

-- tenant_queries
drop policy if exists "queries_insert_public" on public.tenant_queries;
create policy "queries_insert_public" on public.tenant_queries
  for insert with check (true);

drop policy if exists "queries_select_own" on public.tenant_queries;
create policy "queries_select_own" on public.tenant_queries
  for select using (
    exists (
      select 1 from public.tenants t
      join public.properties p on p.id = t.property_id
      where t.id = tenant_id and p.owner_id = auth.uid()
    )
  );

drop policy if exists "queries_update_own" on public.tenant_queries;
create policy "queries_update_own" on public.tenant_queries
  for update using (
    exists (
      select 1 from public.tenants t
      join public.properties p on p.id = t.property_id
      where t.id = tenant_id and p.owner_id = auth.uid()
    )
  );

-- checkin_responses
drop policy if exists "checkin_select_own" on public.checkin_responses;
create policy "checkin_select_own" on public.checkin_responses
  for select using (
    exists (
      select 1 from public.tenants t
      join public.properties p on p.id = t.property_id
      where t.id = tenant_id and p.owner_id = auth.uid()
    )
  );

drop policy if exists "checkin_update_public" on public.checkin_responses;
create policy "checkin_update_public" on public.checkin_responses
  for update with check (true);

-- 4. intelligence migration: touch_updated_at trigger (may be missing)
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_tenant_queries_updated_at on public.tenant_queries;
create trigger touch_tenant_queries_updated_at
  before update on public.tenant_queries
  for each row execute procedure public.touch_updated_at();

-- 5. Marketplace: ensure storage bucket for property photos exists
insert into storage.buckets (id, name, public)
values ('property-photos', 'property-photos', true)
on conflict (id) do nothing;
