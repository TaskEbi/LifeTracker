# Working rules

LifeTracker is a personal tracker (React 19 + Vite + TypeScript PWA) that shares Curio Cabinet's Supabase database. Read `docs/overview.md` first, then `docs/progress.md`.

## Data safety
- Never write to the production database from development. Sync is off unless `VITE_LT_ALLOW_SYNC=true` **and** the Supabase variables are set; only Production builds get them.
- Schema changes are additive migrations in `supabase/migrations/` (new `lt_` tables or nullable columns). Never drop, rename or tighten anything Curio Cabinet uses.
- Migration ownership: from `20261025120000_lifetracker_core.sql` on, **this repository owns the schema**. The AnyStop repository must not add migrations while both apps run. The first nine files are copies of AnyStop's, byte for byte, so `supabase db push` sees them as already applied.
- Production migration, replacing Curio Cabinet and deploying are separate release steps that need the user's review. Follow `docs/migration.md`.
- Keep secrets out of the repo and the bundle: only the publishable (anon) key may appear in `VITE_` variables.

## One record per activity
- Time spent → `log_entries` (the Daily Log row). Section detail goes in `lt_details` with the **same id**.
- Sleep / screen time → `log_metrics` (one row per metric per day, id from `metricId`). Bed/wake → `lt_nights`.
- Tasks → `todos` (+ `section`). Cabinet → `items` / `rooms` / `connections`.
- XP, levels, streaks and achievements are **derived** (`src/domain/progress`). Never store XP.

## Code
- Feature modules live in `src/features/<name>/` and own their screens, sheets and actions. Shared pieces: `src/data` (records, sync), `src/domain` (pure logic, tested), `src/ui/i` (instrument components), `src/app` (shell, router).
- Curio Cabinet code under `src/features/cabinet`, `src/ui` and `src/data` keeps its own conventions; LifeTracker CSS classes are prefixed `i-` and tokens avoid Cabinet's names.
- Label sample or simulated data on screen. Never show a save or connection as successful unless it was.
- `npm test` (domain + PGlite database tests) and `npm run typecheck` must pass before committing.
