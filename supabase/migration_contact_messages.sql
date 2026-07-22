-- contact_messages: stores public inbound contact form submissions
-- Inserts are server-side only (service role key); no public read/write policies.

create table if not exists contact_messages (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  email      text        not null,
  subject    text        not null,
  message    text        not null,
  source     text        not null default 'homepage',
  status     text        not null default 'new',
  created_at timestamptz not null default now()
);

alter table contact_messages enable row level security;
