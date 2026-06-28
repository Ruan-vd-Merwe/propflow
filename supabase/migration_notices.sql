-- migration_notices.sql
-- Body-corporate notice ingestion pipeline: inbound email → PDF → LLM extraction.
-- Run after migration_intelligence.sql.

-- ─── notice_sender_allowlist ─────────────────────────────────────────────────
-- Per-property list of approved body-corporate sender domains/addresses.
-- Mail from senders not on this list is stored as 'unverified'.
create table if not exists public.notice_sender_allowlist (
  id            uuid primary key default gen_random_uuid(),
  property_id   uuid not null references public.properties on delete cascade,
  sender_pattern text not null,
  -- Can be a full email (treasurer@mybodyco.co.za) or a domain (@mybodyco.co.za).
  -- Matching is case-insensitive. Domain patterns start with '@'.
  created_at    timestamptz not null default now()
);

create index if not exists notice_allowlist_property_id_idx
  on public.notice_sender_allowlist (property_id);

-- One pattern per property (no duplicate entries)
create unique index if not exists notice_allowlist_unique_idx
  on public.notice_sender_allowlist (property_id, lower(sender_pattern));


-- ─── notices ─────────────────────────────────────────────────────────────────
create table if not exists public.notices (
  id                    uuid primary key default gen_random_uuid(),
  property_id           uuid not null references public.properties on delete cascade,

  -- Inbound email metadata
  source_message_id     text not null unique,
  sender_email          text not null,
  subject               text,
  verification_status   text not null default 'unverified'
                          check (verification_status in ('verified', 'unverified')),

  -- Storage paths (Supabase Storage, private bucket 'bc-notices')
  raw_email_path        text,          -- JSON blob of the full parsed email
  pdf_path              text,          -- path to the stored PDF attachment

  -- LLM-extracted fields (populated async after PDF text extraction)
  notice_type           text
                          check (notice_type is null or notice_type in (
                            'agm', 'special_levy', 'levy_statement',
                            'rules_change', 'maintenance', 'other'
                          )),
  title                 text,
  summary               text,
  key_dates             jsonb,         -- [{label, date}]
  amounts               jsonb,         -- [{label, amount, currency}]
  action_required       boolean,
  deadline              date,

  -- Pipeline status
  status                text not null default 'received'
                          check (status in ('received', 'extracted', 'failed')),
  extraction_error      text,          -- error message if status = 'failed'

  created_at            timestamptz not null default now()
);

create index if not exists notices_property_id_idx on public.notices (property_id);
create index if not exists notices_status_idx      on public.notices (status);


-- ─── owner_notifications ─────────────────────────────────────────────────────
-- In-app notification feed for property owners.
create table if not exists public.owner_notifications (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references public.profiles on delete cascade,
  property_id   uuid not null references public.properties on delete cascade,
  type          text not null,
  -- 'notice_received' | 'notice_extracted' | 'notice_unverified'
  title         text not null,
  body          text,
  link          text,              -- relative URL to the relevant page
  read          boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists owner_notif_owner_id_idx on public.owner_notifications (owner_id);
create index if not exists owner_notif_read_idx     on public.owner_notifications (owner_id, read);


-- ─── Row Level Security ──────────────────────────────────────────────────────

alter table public.notice_sender_allowlist enable row level security;
alter table public.notices                 enable row level security;
alter table public.owner_notifications     enable row level security;

-- Allowlist: owner manages their own properties' sender lists
create policy "allowlist_own" on public.notice_sender_allowlist
  for all using (
    exists (
      select 1 from public.properties p
      where p.id = property_id and p.owner_id = auth.uid()
    )
  );

-- Notices: owner sees only notices for their own properties
create policy "notices_own" on public.notices
  for select using (
    exists (
      select 1 from public.properties p
      where p.id = property_id and p.owner_id = auth.uid()
    )
  );

-- The webhook inserts via service_role, so no INSERT policy needed for anon/auth.
-- Owners should not be able to insert/update notices directly.

-- Owner notifications: owner sees only their own
create policy "owner_notif_select_own" on public.owner_notifications
  for select using (owner_id = auth.uid());

-- Allow owners to mark notifications as read
create policy "owner_notif_update_own" on public.owner_notifications
  for update using (owner_id = auth.uid())
  with check (owner_id = auth.uid());


-- ─── Storage bucket ─────────────────────────────────────────────────────────
-- Create a private bucket 'bc-notices' in Supabase Dashboard > Storage.
-- Policies (apply via Dashboard):
--
--   Policy: service_role_only_upload
--   Operation: INSERT
--   Definition: (auth.role() = 'service_role')
--
--   Policy: owner_can_read_own
--   Operation: SELECT
--   Definition: (auth.role() = 'service_role')
--   (Owners access PDFs via signed URLs generated by the API)


-- Reload PostgREST schema cache
notify pgrst, 'reload schema';
