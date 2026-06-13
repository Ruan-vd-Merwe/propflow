create table if not exists public.email_confirmations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  token text not null unique,
  email text not null,
  confirmed boolean default false,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

alter table public.email_confirmations
  enable row level security;

create policy "users see own confirmations"
  on public.email_confirmations for all
  using (auth.uid() = user_id);
