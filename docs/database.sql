create extension if not exists "pgcrypto";

create table if not exists marketing_feed_batches (
  id uuid primary key default gen_random_uuid(),
  batch_date date unique not null,
  generated_at timestamptz not null default now(),
  status text not null check (status in ('success', 'failed')),
  item_count integer not null default 0,
  source_counts jsonb not null default '{}'::jsonb,
  source_errors jsonb not null default '{}'::jsonb
);

create table if not exists marketing_feed_items (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references marketing_feed_batches(id) on delete cascade,
  item_id text not null,
  source text not null,
  source_url text not null,
  title text not null,
  summary text not null default '',
  author text,
  published_at timestamptz,
  collected_at timestamptz not null,
  native_category text,
  industry text not null default '其他',
  content_tags jsonb not null default '[]'::jsonb,
  rule_score integer not null default 0,
  selection_reason text not null default '',
  cover_url text,
  position integer not null,
  unique(batch_id, item_id),
  unique(batch_id, position)
);

create index if not exists marketing_feed_batches_date_idx on marketing_feed_batches(batch_date desc);
create index if not exists marketing_feed_items_item_idx on marketing_feed_items(item_id);
create index if not exists marketing_feed_items_batch_idx on marketing_feed_items(batch_id, position);

alter table marketing_feed_batches enable row level security;
alter table marketing_feed_items enable row level security;

drop policy if exists "Public can read successful marketing batches" on marketing_feed_batches;
create policy "Public can read successful marketing batches"
on marketing_feed_batches for select
using (status = 'success');

drop policy if exists "Public can read marketing feed items" on marketing_feed_items;
create policy "Public can read marketing feed items"
on marketing_feed_items for select
using (
  exists (
    select 1 from marketing_feed_batches
    where marketing_feed_batches.id = marketing_feed_items.batch_id
      and marketing_feed_batches.status = 'success'
  )
);
