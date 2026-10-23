# Decision log

Short entries, newest last. Each says what was decided and why.

**2026-10-24 · Stack: React 19 + Vite + TypeScript PWA, like Curio Cabinet.** Curio Cabinet's code (data layer, cabinet views, Daily Log logic, Road to IOI) is reused directly instead of rewritten. Next.js would add server rendering this local-first, single-user app doesn't need.

**2026-10-24 · Share Curio Cabinet's tables instead of copying them.** LifeTracker reads and writes `log_entries`, `log_metrics`, `todos`, `items`… directly. One authoritative record per activity, no import step, no duplicates, and Curio Cabinet keeps working on the same data. LifeTracker-only structure goes in additive `lt_` tables keyed to those rows (`lt_details.id = log_entries.id`).

**2026-10-24 · XP, levels, streaks and achievements are derived, never stored.** Each award is an event keyed by the record (or week) that earned it. Syncing, re-importing or editing can't double-count, and history from Curio Cabinet earns XP automatically. Rules live in `src/domain/progress/engine.ts` and are illustrative.

**2026-10-24 · Same login and access model.** The single member (`public.is_member()`) and the shared owner id apply to the new tables too. Schema separation is not access control; `tests/db/schema.test.ts` proves the lt_ tables refuse anon and non-member users.

**2026-10-24 · LifeTracker owns migrations from now on.** The first nine migration files are AnyStop's, unchanged, so the history lines up. AnyStop must not add migrations while both apps run (see `AGENTS.md`).

**2026-10-24 · Sync needs an explicit switch.** `VITE_LT_ALLOW_SYNC=true` plus the Supabase variables; Vercel sets them for Production only. Previews and stray local `.env` files stay local-only.

**2026-10-24 · Settings writes are narrow.** LifeTracker only upserts the settings columns it edits (`road`, `log_timezone`, `museum_name`, `examples_seeded`), so it can't undo appearance changes made in Curio Cabinet.

**2026-10-24 · Cabinet keeps its views, wears the instrument palette.** Curio Cabinet's CSS is scoped to `.cabinet` and given an `instrument` palette mapped onto LifeTracker's tokens, with the gallery layout. Curio Cabinet's own palette/design settings are left alone.

**2026-10-24 · Chess.com is read live from its public API** (`api.chess.com/pub/player/gm_tasktaskpro`, CORS open). No key, no account access; Diamond membership isn't needed or assumed. Google Calendar and Strava need OAuth credentials and stay marked "not configured".
