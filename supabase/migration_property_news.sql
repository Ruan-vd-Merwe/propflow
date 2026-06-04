-- migration_property_news.sql
-- Property news digest system tables.
-- Run in Supabase SQL editor after schema.sql.

-- News sources
create table if not exists public.property_news_sources (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  source_type     text not null check (source_type in ('rss','url','api')),
  url             text,
  rss_url         text,
  is_active       boolean default true,
  category_hint   text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Articles
create table if not exists public.property_news_articles (
  id                      uuid primary key default gen_random_uuid(),
  source_id               uuid references public.property_news_sources,
  title                   text not null,
  url                     text not null unique,
  author                  text,
  published_at            timestamptz,
  fetched_at              timestamptz default now(),
  raw_excerpt             text,
  summary                 text,
  category                text,
  relevance_score         integer default 0,
  location_tags           text[] default '{}',
  suburb_tags             text[] default '{}',
  province_tags           text[] default '{}',
  why_it_matters          text,
  is_duplicate            boolean default false,
  duplicate_of_article_id uuid references public.property_news_articles,
  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);

-- Weekly digests
create table if not exists public.property_news_digests (
  id              uuid primary key default gen_random_uuid(),
  week_start_date date not null,
  week_end_date   date not null,
  subject         text,
  intro_text      text,
  html_content    text,
  text_content    text,
  status          text default 'draft' check (status in ('draft','approved','sent')),
  sent_at         timestamptz,
  articles_count  integer default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Digest to articles join
create table if not exists public.property_news_digest_articles (
  id            uuid primary key default gen_random_uuid(),
  digest_id     uuid references public.property_news_digests on delete cascade,
  article_id    uuid references public.property_news_articles on delete cascade,
  display_order integer default 0,
  section       text,
  created_at    timestamptz default now()
);

-- Newsletter subscribers
create table if not exists public.newsletter_subscribers (
  id                    uuid primary key default gen_random_uuid(),
  email                 text not null unique,
  first_name            text,
  user_type             text check (user_type in ('tenant','landlord','investor','buyer')),
  preferred_locations   text[] default '{}',
  preferred_categories  text[] default '{}',
  is_subscribed         boolean default true,
  unsubscribe_token     uuid default gen_random_uuid(),
  subscribed_at         timestamptz default now(),
  unsubscribed_at       timestamptz,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- Digest send log
create table if not exists public.property_news_send_log (
  id             uuid primary key default gen_random_uuid(),
  digest_id      uuid references public.property_news_digests,
  subscriber_id  uuid references public.newsletter_subscribers,
  sent_at        timestamptz default now(),
  status         text check (status in ('sent','failed')),
  error_message  text
);

-- RLS
alter table public.property_news_sources         enable row level security;
alter table public.property_news_articles        enable row level security;
alter table public.property_news_digests         enable row level security;
alter table public.property_news_digest_articles enable row level security;
alter table public.newsletter_subscribers        enable row level security;
alter table public.property_news_send_log        enable row level security;

-- Public read for articles and sent digests
create policy if not exists "public can read articles"
  on public.property_news_articles for select using (true);
create policy if not exists "public can read digests"
  on public.property_news_digests for select using (status = 'sent');

-- Subscribers manage own record
create policy if not exists "subscribers manage own record"
  on public.newsletter_subscribers for all using (true);

-- Seed default SA property news sources
insert into public.property_news_sources
  (name, source_type, rss_url, category_hint, is_active)
values
  ('Property24 News', 'rss',
   'https://www.property24.com/rss/property-news',
   'South African property news', true),
  ('Private Property News', 'rss',
   'https://www.privateproperty.co.za/advice/rss',
   'South African property news', true),
  ('BusinessTech Property', 'rss',
   'https://businesstech.co.za/news/category/property/feed/',
   'Investment insights', true),
  ('Moneyweb Property', 'rss',
   'https://www.moneyweb.co.za/category/property/feed/',
   'Investment insights', true),
  ('Google News SA Property', 'rss',
   'https://news.google.com/rss/search?q=south+africa+property+market&hl=en-ZA&gl=ZA&ceid=ZA:en',
   'South African property news', true),
  ('Google News Cape Town Property', 'rss',
   'https://news.google.com/rss/search?q=cape+town+property+rental&hl=en-ZA&gl=ZA&ceid=ZA:en',
   'Cape Town property news', true),
  ('Google News SA Interest Rates', 'rss',
   'https://news.google.com/rss/search?q=south+africa+interest+rates+property&hl=en-ZA&gl=ZA&ceid=ZA:en',
   'Interest rates', true)
on conflict do nothing;
