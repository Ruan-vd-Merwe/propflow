-- PropFlow: Intelligence Features Migration
-- Run AFTER migration_communications.sql

-- ─── property_components ────────────────────────────────────────────────────
-- Tracks physical components of a property for maintenance prediction.
create table if not exists public.property_components (
  id                  uuid primary key default gen_random_uuid(),
  property_id         uuid not null references public.properties on delete cascade,
  component_type      text not null,
  -- geyser | roof | paint_interior | paint_exterior | plumbing | electrical
  -- carpets | appliance | hvac | windows_doors | driveway | other
  name                text not null,          -- e.g. "Main geyser", "Bedroom 1 carpet"
  installed_date      date not null,
  lifespan_min_years  integer not null,
  lifespan_max_years  integer not null,
  brand               text,
  model_number        text,
  notes               text,
  last_serviced_date  date,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists components_property_id_idx on public.property_components (property_id);

drop trigger if exists touch_property_components_updated_at on public.property_components;
create trigger touch_property_components_updated_at
  before update on public.property_components
  for each row execute procedure public.touch_updated_at();


-- ─── maintenance_jobs ────────────────────────────────────────────────────────
-- Tracks contractor communications for a maintenance task.
create table if not exists public.maintenance_jobs (
  id                   uuid primary key default gen_random_uuid(),
  property_id          uuid not null references public.properties on delete cascade,
  component_id         uuid references public.property_components on delete set null,
  tenant_query_id      uuid references public.tenant_queries on delete set null,

  title                text not null,
  generated_description text,               -- Claude-generated job spec
  final_description    text,                -- Landlord-edited version
  urgency              text not null default 'normal'
                         check (urgency in ('urgent', 'normal', 'planned')),

  -- Contractor
  contractor_name      text,
  contractor_email     text,
  contractor_phone     text,

  -- Quote tracking
  quote_text           text,               -- Raw quote pasted by landlord
  quote_amount_cents   integer,            -- Quote amount in cents
  quote_summary        text,               -- Claude summary of quote(s)
  quote_received_at    timestamptz,

  status               text not null default 'draft'
                         check (status in ('draft','sent','quote_received','approved','declined','completed')),

  landlord_notes       text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists maint_jobs_property_id_idx  on public.maintenance_jobs (property_id);
create index if not exists maint_jobs_status_idx       on public.maintenance_jobs (status);

drop trigger if exists touch_maintenance_jobs_updated_at on public.maintenance_jobs;
create trigger touch_maintenance_jobs_updated_at
  before update on public.maintenance_jobs
  for each row execute procedure public.touch_updated_at();


-- ─── body_corporate_documents ────────────────────────────────────────────────
-- Stores parsed body corporate meeting minutes.
create table if not exists public.body_corporate_documents (
  id              uuid primary key default gen_random_uuid(),
  property_id     uuid not null references public.properties on delete cascade,
  title           text not null,           -- e.g. "AGM Minutes – March 2025"
  source          text not null check (source in ('pdf', 'text_paste')),
  filename        text,                    -- original PDF filename if applicable
  raw_text        text,                    -- extracted/pasted text
  meeting_date    date,                    -- extracted by Claude
  claude_summary  text,                    -- 2-3 sentence executive summary
  flag_count      jsonb not null default '{"red":0,"amber":0,"green":0}',
  created_at      timestamptz not null default now()
);

create index if not exists bodycorp_property_id_idx on public.body_corporate_documents (property_id);


-- ─── body_corporate_flags ────────────────────────────────────────────────────
-- Individual action items extracted from meeting minutes by Claude.
create table if not exists public.body_corporate_flags (
  id               uuid primary key default gen_random_uuid(),
  document_id      uuid not null references public.body_corporate_documents on delete cascade,
  property_id      uuid not null references public.properties on delete cascade,
  category         text not null
                     check (category in ('special_levy','maintenance','legal','financial','action_required')),
  severity         text not null check (severity in ('red','amber','green')),
  title            text not null,
  description      text not null,
  amount_zar       numeric(12,2),          -- for levies / financial items
  due_date         date,
  requires_owner_action boolean not null default false,
  resolved         boolean not null default false,
  created_at       timestamptz not null default now()
);

create index if not exists bodycorp_flags_doc_id_idx      on public.body_corporate_flags (document_id);
create index if not exists bodycorp_flags_property_id_idx on public.body_corporate_flags (property_id);


-- ─── Row Level Security ──────────────────────────────────────────────────────

alter table public.property_components     enable row level security;
alter table public.maintenance_jobs        enable row level security;
alter table public.body_corporate_documents enable row level security;
alter table public.body_corporate_flags    enable row level security;

-- Helper macro: landlord owns the property
create policy "components_own" on public.property_components
  for all using (
    exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid())
  );

create policy "maint_jobs_own" on public.maintenance_jobs
  for all using (
    exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid())
  );

create policy "bodycorp_docs_own" on public.body_corporate_documents
  for all using (
    exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid())
  );

create policy "bodycorp_flags_own" on public.body_corporate_flags
  for all using (
    exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid())
  );
