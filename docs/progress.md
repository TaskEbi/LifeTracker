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

## M4 · Tasks and calendar (done)
- Tasks: Curio Cabinet's to-dos with a section tag, priority, due day; filters (open / due today / 7 days / done, by section), grouped by overdue/today/week/later; edit, delete with undo, clear finished; shown in their section and on Home's Today panel. XP once per task; re-ticking doesn't celebrate again.
- Calendar: week timeline (06–22) with planned vs completed, logged activity and tasks due as marks; day agenda; section filters; events with weekly repeats, per-date cancel/move, "this and later" split, restore, delete with undo; clash warnings that never move anything; performances can carry violin pieces.
- Google Calendar and the school calendar are shown as not connected / reference only.
- Verified: domain tests for recurrence and conflicts; WebKit e2e for clash → cancel one date, and task add → home/section → complete once.

## M5 · Sleep and screen time (done)
- Sleep: log/edit/clear a night (bed + wake, or total only, plus optional score) into Curio's log_metrics with times in lt_nights; nights logged in Curio appear as "total only". Stats over 7 nights (average, bedtime spread, within window, average bedtime and score), 10-night timeline with planned windows, 14-night duration trend, schedule for school nights and weekends, wind-down time shown on Today (in-app only; no push notifications).
- Screen time: daily total (steppers or typed h/m) for today or yesterday, edit/clear with undo, 14-day bars against an optional target (target history kept), week-on-week average. Clearly manual: no claim of reading iPhone Screen Time.
- Verified: unit tests (midnight maths, joins with Curio rows, bedtime averages, wind-down), WebKit e2e for both.

## M6 · Gym (done)
- Templates (starter placeholders, labelled; editor for exercises/sets/reps/weight/rest/alternatives; archive), planning a session into the calendar, a week strip that shows sport alongside gym and a note when a legs-heavy day sits next to sport.
- Session in progress on the device (survives reloads): weight/reps steppers (weight carries to later sets), set LEDs, rest timer (+30s/skip), swap for today, add/remove sets and exercises, discard with confirmation.
- Finish: duration and an optional check-in (effort, soreness, pain + note) → one log entry (template as subcategory) + detail; reward shows set XP capped at the plan and a gentle pain note. History with edit/delete, progression of the heaviest completed set, weekly target with history.
- Verified: unit tests (template parsing, progression), WebKit e2e (sets, swap, reload mid-session, check-in, saved once).

## M7 · Sports, Study, Chess, Coding (done)
- Sports: running/cycling/swimming (distance → pace or speed worked out) and volleyball/tennis (training or match + score); bests from the records (fastest only over a minimum distance); weekly minutes; repeating practice schedule via calendar events; weekly target. Garmin/Strava marked not connected.
- Study: subjects (editable, default the four A-levels) as subcategories; session kind and topic; exams are calendar events (kind exam) with countdown; marks (lt_records `study_mark`, score validated against the total) with recent average and change; difficult topics (`study_topic`, lost/shaky/getting there, archive when sorted); homework via section tasks. The maths/physics app is marked as not built.
- Chess: live Chess.com public API (no login) for the saved username (default GM_TaskTaskPro): ratings by time control with best and W/L/D, puzzles and Puzzle Rush, rating trend over recent rated games, recent games with opening, minutes of live games per day from the PGN start/end. Errors show a message and no numbers. Chess.com games only count toward levels once logged ("Log today's N games", guarded against duplicates). Puzzle/study sessions are logged by hand.
- Coding: Road to IOI rebuilt in the Instrument style from AnyStop's rules (unchanged, shared tests): live countdown to the current stage (JOI first round 25 Oct 14:00 JST), stage ladder with stage sheet (date, target, why, cleared + memory), today's two tasks from DragonCode's upsolve queue, low-energy mode, 7-day strip, gates this season, a note from past self, side-path contests, my why, DragonCode link (read-only key) and Open DragonCode. Road settings are the same `settings.road` AnyStop uses. All coding entries count as Road training. "All coding" tab for kind/platform/solved and weekly minutes.
- Verified: unit tests (pace/bests, study marks/subjects, Chess.com parsing incl. draws/variants/duration/opening names), WebKit e2e for each channel (Chess.com mocked: live label, and a failed fetch shows no numbers). Live Chess.com fetch also checked by hand in the dev server.

## M8 · Progress, Settings, All activity, polish (done)
- /progress: the drone and its five forms (locked ones previewed), overall and per-section levels, streak with a planned rest day, all achievements with progress, a plain "How XP works" list built from the engine's RULES, recent XP by section.
- /settings: data mode and sync status (pending count, errors, Sync now), sign out (warns when changes haven't uploaded; tries to flush first), theme per device, section ↔ Daily Log topic mapping (one topic per section, never moves entries), time zone (read-only, shared with AnyStop), export backup (AnyStop format; says LifeTracker's own tables aren't in it), import offered only in local mode so test data can't reach the shared database, list of integrations that are not connected.
- /log (All activity): every live Daily Log entry incl. topics no section uses, filter by section or "Other topics", search, grouped by day, edit topic/subcategory/minutes/day/note, delete with Undo (section details are kept).
- LifeTracker's own icon set (favicon, PWA 192/512/maskable, apple-touch) replacing AnyStop's cabinet icon.
- Accessibility/layout sweep in e2e: every route has one h1, every visible control has an accessible name, no sideways scroll at iPhone width.
- Verified: 161 unit/DB tests, 14 WebKit e2e tests, typecheck, production build.

## M9 · Game layer, colour and navigation (done)
- Phone navigation: the bottom bar is Home · Calendar · Log · Tasks · Progress (shows your level and a badge with open daily quests). The channel strip at the top of every page also links Progress, All activity and Settings; Home has quick links to all four.
- Quests (`src/domain/progress/quests.ts`): three daily, three weekly and three monthly quests drawn by date from fixed pools (same on every device, nothing stored), progress from the records of that period, XP per quest (15/50/150) plus a bonus for clearing all three (20/60/200). Quest XP is a keyed event like every other award and only counts from 1 Oct 2026, so old Daily Log history doesn't flood the levels.
- Levels: smaller steps (overall 120 + 25n, sections 60 + 15n), overall ranks (Rookie → Legend at LV 100) and section ranks (Novice → Legend).
- Transformations: ten drone forms (Core, Ring, Rotor, Array, Halo, Prism, Nova, Aurora, Titan, Singularity at LV 1/3/6/10/15/22/30/40/55/75), each adding hardware and its own colours.
- Achievements: 39, in bronze/silver/gold/platinum tiers, adding streaks (7–365 days), levels and forms, quests and sweeps, per-section milestones; shown as a badge grid with progress.
- Progress page: Overview (character, stats, today's quests, forms strip, sections with ranks, recent XP, how XP works) · Quests · Achievements tabs (/progress/quests, /progress/achievements).
- Colour and cleanup: section-tinted keys, headers, meters and chips; stage-coloured drone scope and hero; gradient log button; softer page glows in light and dark; stepper buttons centred; setting hints in plain text; clearer violin target meter.
- Verified: 169 unit/DB tests (quests, achievements, levels), 15 WebKit e2e tests incl. the new progress/quests/achievements flow and the new routes in the accessibility sweep, typecheck; screenshots at iPhone and desktop size, light and dark.

## Next (needs your review or your input)
- Review the working app locally (`npm run dev`, local-only by default).
- Production migration (docs/migration.md): back up, apply `20261025120000_lifetracker_core.sql`, verify — a separate step after review.
- Deployment: a new Vercel project with Production-only env vars; add the LifeTracker origin to DragonCode's `ROAD_LINK_ORIGINS`.
- Later: LifeTracker tables in the backup export; Strava import (needs an app registration); maths/physics app link once it exists.
