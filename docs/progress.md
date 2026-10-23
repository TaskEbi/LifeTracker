# Progress

Milestones, newest last. Each says what works, what was verified and what remains.

## M1 · Foundation (done)
- Repo layout, Vite/React/TS, Instrument design tokens and components (`src/styles`, `src/ui/i`).
- Shell: home console (drone, 8 channel keys, Cabinet bay, Today), channel strip, phone command bar, desktop rail, quick-log palette, path router with back gesture, light/dark/reduced motion.
- Data: Curio Cabinet's local-first store + sync, extended with six `lt_` tables; sync guarded by `VITE_LT_ALLOW_SYNC`; narrow settings writes.
- Sign-in with the existing Curio Cabinet member (no new logins).
- Domain: derived progression (XP events, levels, stages, streaks, achievements), calendar recurrence/exceptions/conflicts.
- Verified: `tests/db` (all migrations on PGlite; anon/non-member refused; additive-only; todos.section survives Curio saves), domain tests, WebKit iPhone screenshots.

## M2 · Cabinet (done)
- Curio Cabinet's shelves, collage, string map, mind map 3D, drawer, capture (paste, drop, share target, bookmarklet), filters, rooms, strings, jump-to and back office run as CH09, on the same records, in the instrument palette.
- Verified: typecheck, phone and desktop screenshots in WebKit.

## M3 · Violin (done, needs polish)
- Log flow (type → duration with optional timer → pieces/scales with optional split and note), backdating, edit, delete with undo, repertoire (add/edit/archive), weekly totals, 28-day matrix, per-piece stats (only where split), performances list (from calendar events), weekly target with history (raising it never removes past XP), related tasks.
- Each session = one log_entries row in the Violin topic (session type as subcategory, visible in Curio's Daily Log) + lt_details with the same id.
- Verified: unit tests (stats, checks, target history) and a WebKit iPhone e2e test (log, reward, edit, delete/undo, reload, XP unchanged).

## Next
- M4 Tasks + Calendar screens (event sheet is referenced by Violin's "+ Performance" but not built yet).
- M5 Sleep + Screen time, M6 Gym, M7 Sports / Study / Chess (Chess.com live) / Coding + Road to IOI, M8 import of a Curio export for local testing, settings (topic mapping, theme, sign out), polish.
