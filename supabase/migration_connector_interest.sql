-- migration_connector_interest.sql
-- Stores expression-of-interest leads for the Connector programme.
-- Run after schema.sql and migration_connector_role.sql.

create table if not exists connector_interest (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  area        text not null,
  province    text not null,
  motivation  text not null,
  categories  text[] not null default '{}',
  created_at  timestamptz not null default now()
);

create unique index if not exists connector_interest_email_idx
  on connector_interest (email);

-- RLS: only service role can insert/read (API route uses service client).
alter table connector_interest enable row level security;

-- No public policies — all access is via the service-role client in the API route.
