-- LifeTracker joins Curio Cabinet's database.
--
-- Additive only: no existing table, column, policy or row is changed except one new nullable
-- column on todos. Curio Cabinet keeps working unchanged; it never reads the lt_ tables.
--
-- Records stay authoritative where they already are:
--   time spent        → log_entries   (lt_details adds a section's structure to an entry, same id)
--   sleep / screen    → log_metrics   (lt_nights adds bed and wake times to a night)
--   tasks             → todos         (todos.section tags a task with a LifeTracker section)
-- XP, levels, streaks and achievements are derived from these rows on the client and never stored,
-- so an activity can't earn XP twice.
--
-- Access: the same single-member model as every other table (see 20261015120000_login_and_daily_log):
-- rows belong to the shared owner and only public.is_member() may read or change them.

-- ─── section things: repertoire, gym templates, marks, study notes ──────────

create table public.lt_records (
  id          uuid primary key,
  owner_id    uuid not null default '00000000-0000-0000-0000-000000000000',
  section     text not null check (section in ('violin', 'coding', 'sports', 'gym', 'study', 'chess', 'sleep', 'screen', 'cabinet')),
  kind        text not null check (kind ~ '^[a-z][a-z_]{1,29}$'),
  data        jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object' and pg_column_size(data) <= 32768),
  sort_order  double precision not null default 0,
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

-- ─── per-entry detail (same id as the log_entries row it describes) ─────────
-- No foreign key, like the Daily Log tables: a detail may sync before its entry. A detail
-- whose entry is missing or deleted is ignored by the client.

create table public.lt_details (
  id         uuid primary key,
  owner_id   uuid not null default '00000000-0000-0000-0000-000000000000',
  section    text not null check (section in ('violin', 'coding', 'sports', 'gym', 'study', 'chess')),
  data       jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object' and pg_column_size(data) <= 32768),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ─── calendar ───────────────────────────────────────────────────────────────

create table public.lt_events (
  id           uuid primary key,
  owner_id     uuid not null default '00000000-0000-0000-0000-000000000000',
  title        text not null check (char_length(btrim(title)) between 1 and 120),
  section      text check (section in ('violin', 'coding', 'sports', 'gym', 'study', 'chess', 'sleep', 'screen', 'cabinet')),
  kind         text not null default 'session' check (kind in ('session', 'exam', 'performance', 'competition', 'school', 'other')),
  date         date not null,
  start        text check (start ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  "end"        text check ("end" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  -- {"days": [0..6, Monday = 0], "until": "YYYY-MM-DD" | null}
  repeat       jsonb check (repeat is null or jsonb_typeof(repeat) = 'object'),
  -- {"YYYY-MM-DD": {"cancelled": true} | {"date": …, "start": …, "end": …}}
  exceptions   jsonb not null default '{}'::jsonb check (jsonb_typeof(exceptions) = 'object'),
  note         text check (char_length(note) <= 2000),
  data         jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object'),
  cancelled_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

-- ─── sleep: bed and wake times (duration stays in log_metrics) ──────────────

create table public.lt_nights (
  id         uuid primary key,
  owner_id   uuid not null default '00000000-0000-0000-0000-000000000000',
  date       date not null,
  bed        text check (bed ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  wake       text check (wake ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (date)
);

-- ─── marked days (planned rest days keep the streak) ────────────────────────

create table public.lt_day_marks (
  id         uuid primary key,
  owner_id   uuid not null default '00000000-0000-0000-0000-000000000000',
  date       date not null,
  kind       text not null check (kind in ('rest')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (kind, date)
);

-- ─── synced preferences, one row per key ────────────────────────────────────

create table public.lt_prefs (
  id         text primary key check (id ~ '^[a-z][a-z0-9_.-]{1,63}$'),
  owner_id   uuid not null default '00000000-0000-0000-0000-000000000000',
  value      jsonb check (pg_column_size(value) <= 32768),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ─── tasks: an optional section tag ─────────────────────────────────────────
-- Nullable and unknown to Curio Cabinet. Its client stores whole rows, so an edit there sends the
-- tag back unchanged instead of clearing it.

alter table public.todos
  add column if not exists section text
    check (section is null or section in ('violin', 'coding', 'sports', 'gym', 'study', 'chess', 'sleep', 'screen', 'cabinet'));

-- ─── indexes, triggers, realtime ────────────────────────────────────────────

create index lt_records_updated_idx   on public.lt_records (updated_at);
create index lt_details_updated_idx   on public.lt_details (updated_at);
create index lt_events_updated_idx    on public.lt_events (updated_at);
create index lt_events_date_idx       on public.lt_events (date);
create index lt_nights_updated_idx    on public.lt_nights (updated_at);
create index lt_day_marks_updated_idx on public.lt_day_marks (updated_at);
create index lt_prefs_updated_idx     on public.lt_prefs (updated_at);

do $$
declare
  t text;
begin
  foreach t in array array['lt_records', 'lt_details', 'lt_events', 'lt_nights', 'lt_day_marks', 'lt_prefs'] loop
    execute format('create trigger %I before insert or update on public.%I for each row execute function public.touch_updated_at()', t || '_touch', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format(
      'create policy "members can read" on public.%I for select to authenticated using ((select public.is_member()))', t);
    execute format(
      'create policy "members can insert" on public.%I for insert to authenticated
         with check ((select public.is_member()) and owner_id = ''00000000-0000-0000-0000-000000000000'')', t);
    execute format(
      'create policy "members can update" on public.%I for update to authenticated
         using ((select public.is_member())) with check (owner_id = ''00000000-0000-0000-0000-000000000000'')', t);
    execute format(
      'create policy "members can delete" on public.%I for delete to authenticated using ((select public.is_member()))', t);
  end loop;
end;
$$;

alter publication supabase_realtime add table
  public.lt_records, public.lt_details, public.lt_events, public.lt_nights, public.lt_day_marks, public.lt_prefs;
