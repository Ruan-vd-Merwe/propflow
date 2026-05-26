-- PropFlow: Communications, Queries & Check-ins Migration
-- Run AFTER migration_applications.sql in Supabase SQL editor

-- ─── Add access_token to tenants ────────────────────────────────────────────
-- Each tenant gets a unique secret URL token for their portal & check-in links.
alter table public.tenants
  add column if not exists access_token text unique;

-- Give existing tenants a token (pgcrypto must be enabled — it is by default in Supabase)
update public.tenants
set access_token = encode(gen_random_bytes(32), 'hex')
where access_token is null;

-- Future rows default to a fresh token
alter table public.tenants
  alter column access_token set default encode(gen_random_bytes(32), 'hex');


-- ─── communications_log ──────────────────────────────────────────────────────
-- Record of every email / notification sent by the system.
create table if not exists public.communications_log (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants on delete cascade,
  type        text not null,
  -- 'payment_before_3d' | 'payment_due_today' | 'payment_late_3d'
  -- 'payment_late_7d'   | 'payment_late_14d'  | 'monthly_checkin'
  subject     text,
  to_email    text,
  resend_id   text,                     -- message ID returned by Resend
  status      text not null default 'sent' check (status in ('sent', 'failed')),
  metadata    jsonb not null default '{}',
  -- e.g. { payment_id, due_date, days_late }
  sent_at     timestamptz not null default now()
);

create index if not exists comms_log_tenant_id_idx on public.communications_log (tenant_id);
create index if not exists comms_log_type_idx       on public.communications_log (type);


-- ─── tenant_queries ──────────────────────────────────────────────────────────
-- Emergency board: tenants submit issues/queries, landlords respond.
create table if not exists public.tenant_queries (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants on delete cascade,
  category        text not null check (category in ('emergency', 'maintenance', 'general')),
  subcategory     text,
  -- emergency:   water | electricity | security | gas | structural
  -- maintenance: plumbing | electrical | appliances | doors_windows | garden | other
  -- general:     noise | contract | parking | other
  title           text not null,
  description     text not null,
  status          text not null default 'open'
                    check (status in ('open', 'in_progress', 'resolved')),
  landlord_notes  text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists tenant_queries_tenant_id_idx on public.tenant_queries (tenant_id);
create index if not exists tenant_queries_status_idx    on public.tenant_queries (status);

drop trigger if exists touch_tenant_queries_updated_at on public.tenant_queries;
create trigger touch_tenant_queries_updated_at
  before update on public.tenant_queries
  for each row execute procedure public.touch_updated_at();


-- ─── checkin_responses ───────────────────────────────────────────────────────
-- Monthly automated check-in records.
create table if not exists public.checkin_responses (
  id                   uuid primary key default gen_random_uuid(),
  tenant_id            uuid not null references public.tenants on delete cascade,
  month                text not null,          -- YYYY-MM
  token                text not null unique,    -- secret link token
  -- Answers (null = not yet responded)
  unit_working         boolean,
  maintenance_needed   boolean,
  maintenance_details  text,
  flag_text            text,
  -- Timestamps
  sent_at              timestamptz not null default now(),
  responded_at         timestamptz
);

create index if not exists checkin_tenant_id_idx on public.checkin_responses (tenant_id);
create unique index if not exists checkin_tenant_month_idx
  on public.checkin_responses (tenant_id, month);


-- ─── Row Level Security ──────────────────────────────────────────────────────

alter table public.communications_log enable row level security;
alter table public.tenant_queries     enable row level security;
alter table public.checkin_responses  enable row level security;

-- communications_log: landlords see logs for their own tenants
create policy "comms_log_select_own" on public.communications_log
  for select using (
    exists (
      select 1 from public.tenants t
      join public.properties p on p.id = t.property_id
      where t.id = tenant_id and p.owner_id = auth.uid()
    )
  );

-- tenant_queries: anyone may insert (token verified in API route)
create policy "queries_insert_public" on public.tenant_queries
  for insert with check (true);

-- tenant_queries: landlords see/update queries for their tenants
create policy "queries_select_own" on public.tenant_queries
  for select using (
    exists (
      select 1 from public.tenants t
      join public.properties p on p.id = t.property_id
      where t.id = tenant_id and p.owner_id = auth.uid()
    )
  );

create policy "queries_update_own" on public.tenant_queries
  for update using (
    exists (
      select 1 from public.tenants t
      join public.properties p on p.id = t.property_id
      where t.id = tenant_id and p.owner_id = auth.uid()
    )
  );

-- checkin_responses: landlords can view their tenants' check-ins
create policy "checkin_select_own" on public.checkin_responses
  for select using (
    exists (
      select 1 from public.tenants t
      join public.properties p on p.id = t.property_id
      where t.id = tenant_id and p.owner_id = auth.uid()
    )
  );

-- checkin_responses: anyone may update (token verified in API route)
create policy "checkin_update_public" on public.checkin_responses
  for update with check (true);
