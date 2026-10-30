# Production release runbook

Nothing here has been run. Each step is a separate release decision for the user. LifeTracker is built and tested against local data only.

## What changes in production

Only additive SQL: `supabase/migrations/20261025120000_lifetracker_core.sql` (and later `lt_` migrations).
- Six new tables (`lt_records`, `lt_details`, `lt_events`, `lt_nights`, `lt_day_marks`, `lt_prefs`) with members-only RLS.
- `20261030120000_lifetracker_bucket.sql`: one more table, `lt_bucket` (the bucket list), same RLS. Until it is applied the app keeps bucket-list items on the device and in the outbox (sync skips a table the server doesn't have) and sends them once it exists.
- One nullable column, `todos.section`.
- No existing row, column, policy or function is changed. Curio Cabinet keeps working.

No data is copied: LifeTracker reads the existing Cabinet, Daily Log, sleep/screen time, to-do and Road to IOI rows as they are.

## 0. Before anything

- [ ] Check the AnyStop Supabase project's usage (Settings → Usage): database size, storage, egress, and that it is not paused. LifeTracker adds small rows (a few KB a day); the shared project also shares auth and capacity with Curio Cabinet.
- [ ] Freeze migrations in the AnyStop repository (no new files in `supabase/migrations` while both apps run).
- [ ] `npx supabase link --project-ref <ref>` from this repository, then `npx supabase migration list`: the nine AnyStop migrations must show as applied remotely and match the local file names exactly. Stop if they don't.

## 1. Backup

- [ ] Curio Cabinet → Back office → **Export** (zip with photos and the Daily Log). Keep it somewhere safe.
- [ ] Database dump (needs the database password; run locally, never commit the output):
      `npx supabase db dump --linked -f backup-schema.sql` and `npx supabase db dump --linked --data-only -f backup-data.sql`.
- [ ] Note the row counts below (step 3) **before** migrating.

## 2. Apply

- [ ] `npx supabase db push` (applies only the migrations not yet recorded remotely: the new `lt_` one).

## 3. Verify

Run in the SQL editor before and after; the AnyStop numbers must not change.

```sql
select 'items', count(*) from items where deleted_at is null union all
select 'rooms', count(*) from rooms where deleted_at is null union all
select 'connections', count(*) from connections where deleted_at is null union all
select 'log_topics', count(*) from log_topics where deleted_at is null union all
select 'log_entries', count(*) from log_entries where deleted_at is null union all
select 'log_metrics', count(*) from log_metrics where deleted_at is null union all
select 'todos', count(*) from todos where deleted_at is null;

select min(date), max(date), sum(minutes) from log_entries where deleted_at is null;
select relname, relrowsecurity from pg_class where relname like 'lt\_%' and relkind = 'r';  -- all true
```

- [ ] Open Curio Cabinet: cabinet, Daily Log, Road to IOI and To-do look the same; add and delete a test to-do.
- [ ] Open LifeTracker (production build, signed in): history appears in the sections mapped to your topics (Settings → Topics), totals match Curio Cabinet's Stats for the same week.

## 4. Deploy LifeTracker (separate step)

- [ ] New Vercel project from `TaskEbi/LifeTracker` (Hobby).
- [ ] Environment variables for **Production only**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (publishable key), `VITE_LT_ALLOW_SYNC=true`. Leave Preview and Development empty so previews run local-only.
- [x] DragonCode: add the LifeTracker origin to `ROAD_LINK_ORIGINS` so the Road to IOI summary can be read from it. (Done 25 Oct 2026: `https://lifetracker-five-inky.vercel.app`, Production; redeployed, and the CORS preflight now allows that origin.)
- [ ] Supabase Auth → URL configuration: add the LifeTracker domain if redirects are ever used (password sign-in doesn't need it).

## Rollback

The change is additive, so rolling back the app is enough: stop using LifeTracker; Curio Cabinet is unaffected. To remove the schema as well (loses LifeTracker-only data such as gym templates and calendar events; export first):

```sql
drop table if exists public.lt_records, public.lt_details, public.lt_events, public.lt_nights, public.lt_day_marks, public.lt_prefs, public.lt_bucket;
alter table public.todos drop column if exists section;
delete from supabase_migrations.schema_migrations where version in ('20261025120000', '20261030120000');
```

Restore from the step 1 dump only if AnyStop data was somehow damaged.
