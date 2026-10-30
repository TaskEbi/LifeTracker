-- LifeTracker: the bucket list.
--
-- Additive only: one new table, unknown to Curio Cabinet. Same single-member access as the other
-- lt_ tables (see 20261025120000_lifetracker_core). XP for crossing things off is derived on the
-- client from done_at and never stored.

create table public.lt_bucket (
  id         uuid primary key,
  owner_id   uuid not null default '00000000-0000-0000-0000-000000000000',
  title      text not null check (char_length(btrim(title)) between 1 and 200),
  note       text check (char_length(note) <= 2000),
  done_at    timestamptz,
  sort_order double precision not null default 0,
  -- extras such as a rarity, added later without another migration
  data       jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object' and pg_column_size(data) <= 8192),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index lt_bucket_updated_idx on public.lt_bucket (updated_at);

create trigger lt_bucket_touch before insert or update on public.lt_bucket for each row execute function public.touch_updated_at();
alter table public.lt_bucket enable row level security;
revoke all on public.lt_bucket from anon;
grant select, insert, update, delete on public.lt_bucket to authenticated;
create policy "members can read" on public.lt_bucket for select to authenticated using ((select public.is_member()));
create policy "members can insert" on public.lt_bucket for insert to authenticated
  with check ((select public.is_member()) and owner_id = '00000000-0000-0000-0000-000000000000');
create policy "members can update" on public.lt_bucket for update to authenticated
  using ((select public.is_member())) with check (owner_id = '00000000-0000-0000-0000-000000000000');
create policy "members can delete" on public.lt_bucket for delete to authenticated using ((select public.is_member()));

alter publication supabase_realtime add table public.lt_bucket;
