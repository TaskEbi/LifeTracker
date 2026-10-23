# LifeTracker overview

A phone-first tracker for violin, competitive coding, sports, gym, school studies, chess, sleep and screen time, plus the Cabinet (Curio Cabinet's collection), a shared calendar and shared tasks. Progress is shown as one character (a drone) with an overall level, section levels, streaks and achievements. Visual design: the "Instrument" prototype (`prototypes/instrument.html`).

## How it fits with the other apps

| | |
|---|---|
| **Curio Cabinet** (`TaskEbi/AnyStop`) | LifeTracker incorporates it. Same Supabase project, same tables, same single-member login. Cabinet, Daily Log, sleep/screen time, to-dos and Road to IOI all read and write the existing rows, so there is no copy and nothing to deduplicate. Curio Cabinet keeps working during the transition. |
| **DragonCode** | Stays separate (own Supabase). LifeTracker reads its read-only `/api/road` summary with the link key, as Curio Cabinet does. |

## Architecture

```
src/app/          shell, router (/violin, /calendar…), sheets, sign-in, theme
src/data/         records in memory + IndexedDB + outbox sync (from Curio Cabinet), LifeTracker prefs/progress bridge (lt.ts)
src/domain/       pure logic with tests: dates, Daily Log stats, progression (XP/levels/streaks/achievements), calendar recurrence
src/features/     one folder per channel (home, violin, … cabinet) and shared utilities (calendar, tasks, progress)
src/integrations/ Chess.com, DragonCode, (Google Calendar, Strava: not configured)
src/ui/i/         instrument components (Sheet, charts, Drone, gauges)
supabase/         migrations (AnyStop's nine + LifeTracker's additive ones), edge functions
tests/db/         migrations and row-level security on PGlite
```

- **Local-first.** Every save goes to memory, IndexedDB and an outbox; the sync loop pushes upserts and pulls by `updated_at`. Deletes are soft. Without Supabase configured the app runs entirely in the browser.
- **Records.** See `AGENTS.md` → "One record per activity". Each timed section maps to a Daily Log topic (`lt_prefs.section_topics`, matched by name on first run).
- **Progression is derived.** `computeProgress()` turns records into keyed XP events (`entry:<id>:time`, `week:violin:<monday>`…), so nothing can be awarded twice and edits recompute rather than add.

## Hosting (planned, not done)

Vercel Hobby, separate project. Production gets `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` and `VITE_LT_ALLOW_SYNC=true`; previews get none, so they run local-only and can't write to production. See `docs/migration.md`.

## Commands

```bash
npm install
npm run dev        # http://localhost:5173 (local-only unless .env.local enables sync)
npm test           # domain + database tests
npm run build      # typecheck + production build
```
