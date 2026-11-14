# LifeTracker overview

A phone-first tracker for violin, competitive coding, sports, gym, school studies (with every past paper, the hardest AS Physics questions, and study notes for every AS and A2 topic in Physics, Maths, Further Maths and Computer Science, with flash cards, a formula sheet, a glossary and the examiners' tips made from them), chess, reading, maths contests, sleep and screen time, plus the Cabinet (Curio Cabinet's collection), a shared calendar, shared tasks, a bucket list, the Stage (performances, tests, matches, races, chess games and talks: getting ready, the result, and what to do next time), and the Hideout (weekly review, a day and revision planner, task tournaments, oaths, spaced recall, mock exams, a lab on your own data, forecasts, a time ledger, weighted decisions, an injury log, gear wear, breathing, predictions, time capsules, rituals, a five-year diary, an evening close-out, records, a year in review, and a Lighthouse for hard days: messages to yourself and words to keep going), the Album (a photo of your face and a few memories each day, and at the end of the year a reel), Motion (nine 3D scenes of your year and your sections), and the Hangar (currencies earned from everything you log, a shop, capsules, a workshop, seasonal festivals, an Arcade with weekly bingo, a sugoroku board and a fishing pond, and 44 collectible robot bodies with paints, hats, pets and auras). Progress is shown as one character (a robot, forty forms) with an overall level and rank, section levels, streaks, daily/weekly/monthly quests and achievements. Visual design: Home and the shared pages use the "Shōnen battle" look with a choice of colour themes; each section is its own designed space (`src/features/<section>/theme.css`), and the Cabinet keeps Curio Cabinet's own look.

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
src/integrations/ Chess.com, DragonCode, Open Library (book suggestions), Open-Meteo (run window), (Google Calendar, Strava: not configured)
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
