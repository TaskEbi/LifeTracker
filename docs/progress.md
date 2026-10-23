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
