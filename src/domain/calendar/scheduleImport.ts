/**
 * A "Schedule" app backup (schedule-backup-*.json, schemaVersion 1) → LifeTracker events and tasks.
 * Pure: the caller adds ids, timestamps and commits. Weekly-shaped repeats (daily, weekdays, weekly)
 * stay one repeating event; other repeats (every 2 weeks, monthly) become one event per occurrence.
 * Times move from the event's own time zone into the Daily Log time zone.
 */
import { addDays, addMonths, dayCount, weekdayIndex } from '../log/dates';
import type { EventException } from '../../data/types';

export interface ImportedEvent {
  /** Stable for re-imports: the Schedule id, plus `@date` for an expanded occurrence. */
  importId: string;
  title: string;
  date: string;
  start: string | null;
  end: string | null;
  repeat: { days: number[]; until: string | null } | null;
  exceptions: Record<string, EventException>;
  note: string | null;
  category: string | null;
}
export interface ImportedTask {
  importId: string;
  title: string;
  due: string | null;
  done_at: string | null;
}
export interface ScheduleImport {
  events: ImportedEvent[];
  tasks: ImportedTask[];
  /** Things that could not come across exactly, in words. */
  warnings: string[];
}

type Obj = Record<string, unknown>;
interface SEvent {
  id: string;
  title: string;
  category?: string;
  notes?: string;
  schedule: { kind: 'allDay'; date: string; endDate: string } | { kind: 'timed'; date: string; time: string; zone?: string; duration: number };
  recurrence?: { kind: 'daily' | 'weekdays' | 'weekly' | 'monthly'; interval?: number; weekdays?: number[]; until?: string };
}
interface SException {
  seriesId: string;
  key: string;
  cancelled?: boolean;
  replacement?: SEvent;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
/** How far ahead an "every N weeks" or monthly series is spelled out when it has no end. */
const EXPAND_DAYS = 400;
const EXPAND_MAX = 400;
const MOVE_SLACK = 31;

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown) => (typeof v === 'string' ? v : undefined);

/** Read the file's JSON; throws a readable error for anything that isn't a Schedule backup. */
export function parseScheduleBackup(text: string): { events: SEvent[]; exceptions: SException[]; tasks: Obj[] } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('That file is not JSON. Choose the schedule-backup-….json file from Schedule → Export backup.');
  }
  if (!isObj(raw) || !Array.isArray(raw.events) || !Array.isArray(raw.exceptions)) throw new Error('That is not a Schedule backup (no events in it).');
  if (raw.schemaVersion !== undefined && raw.schemaVersion !== 1) throw new Error('This Schedule backup is a newer version than LifeTracker can read.');
  const events = raw.events.filter(isEvent);
  const exceptions = raw.exceptions.filter((x): x is SException => isObj(x) && typeof x.seriesId === 'string' && typeof x.key === 'string');
  return { events, exceptions, tasks: Array.isArray(raw.tasks) ? raw.tasks.filter(isObj) : [] };
}

function isEvent(v: unknown): v is SEvent {
  if (!isObj(v) || typeof v.id !== 'string' || typeof v.title !== 'string' || !isObj(v.schedule)) return false;
  const s = v.schedule;
  if (typeof s.date !== 'string' || !DATE.test(s.date)) return false;
  if (s.kind === 'allDay') return typeof s.endDate === 'string' && DATE.test(s.endDate);
  return s.kind === 'timed' && typeof s.time === 'string' && TIME.test(s.time) && typeof s.duration === 'number' && s.duration > 0;
}

const pad = (n: number) => String(n).padStart(2, '0');
const toMin = (t: string) => +t.slice(0, 2) * 60 + +t.slice(3, 5);
const fromMin = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

/** Minutes the zone is ahead of UTC at that instant. */
function offsetMin(zone: string, ms: number): number {
  const p = new Intl.DateTimeFormat('en-US', { timeZone: zone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    .formatToParts(new Date(ms))
    .reduce<Obj>((o, x) => ((o[x.type] = x.value), o), {});
  const asUtc = Date.UTC(+(p.year as string), +(p.month as string) - 1, +(p.day as string), +(p.hour as string) % 24, +(p.minute as string));
  return Math.round((asUtc - ms) / 60000);
}

/** A wall-clock date and time in one zone, as the date and time in another. */
export function convertZone(date: string, time: string, from: string | undefined, to: string): { date: string; time: string } {
  if (!from || from === to) return { date, time };
  try {
    const wall = Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10), +time.slice(0, 2), +time.slice(3, 5));
    // Two passes find the instant even when the offset changes near it.
    let ms = wall - offsetMin(from, wall) * 60000;
    ms = wall - offsetMin(from, ms) * 60000;
    const local = ms + offsetMin(to, ms) * 60000;
    const d = new Date(local);
    return { date: d.toISOString().slice(0, 10), time: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}` };
  } catch {
    return { date, time };
  }
}

/** Where one Schedule slot lands in LifeTracker: a day, and a start and end on that day (or all day). */
interface Slot {
  date: string;
  start: string | null;
  end: string | null;
  /** All-day spans of more than one day. */
  days: number;
  /** A timed event that runs past midnight: it keeps its start only. */
  overnight: boolean;
}
function slotOf(s: SEvent['schedule'], date: string, zone: string): Slot {
  if (s.kind === 'allDay') return { date, start: null, end: null, days: Math.max(1, dayCount(s.date, s.endDate) - 1), overnight: false };
  const at = convertZone(date, s.time, s.zone, zone);
  const endMin = toMin(at.time) + s.duration;
  const overnight = endMin >= 24 * 60;
  return { date: at.date, start: at.time, end: overnight ? null : fromMin(endMin), days: 1, overnight };
}

/** Every date the series puts an occurrence on, from its first day through `until` or the expansion limit. */
function seriesDates(ev: SEvent, today: string): string[] {
  const r = ev.recurrence!;
  const first = ev.schedule.date;
  const last = r.until ?? addDays(today > first ? today : first, EXPAND_DAYS);
  const every = r.interval ?? 1;
  const out: string[] = [];
  if (r.kind === 'monthly') {
    const day = +first.slice(8, 10);
    for (let i = 0; out.length < EXPAND_MAX; i += every) {
      const m = addMonths(first, i);
      const len = dayCount(m, addDays(addMonths(m, 1), -1));
      const d = `${m.slice(0, 8)}${pad(Math.min(day, len))}`;
      if (d > last) break;
      out.push(d);
    }
    return out;
  }
  const n = dayCount(first, last);
  const firstMonday = addDays(first, -weekdayIndex(first));
  for (let i = 0; i < n && out.length < EXPAND_MAX; i++) {
    const d = addDays(first, i);
    const wd = weekdayIndex(d) + 1;
    const week = Math.floor((dayCount(firstMonday, d) - 1) / 7);
    if (r.kind === 'daily' ? i % every === 0 : r.kind === 'weekdays' ? wd <= 5 : week % every === 0 && (r.weekdays ?? []).includes(wd)) out.push(d);
  }
  return out;
}

/** Weekdays (0 = Monday) for a repeat LifeTracker can keep as one event, or null if it has to be spelled out. */
function weeklyDays(ev: SEvent): number[] | null {
  const r = ev.recurrence!;
  if ((r.interval ?? 1) !== 1) return null;
  if (r.kind === 'daily') return [0, 1, 2, 3, 4, 5, 6];
  if (r.kind === 'weekdays') return [0, 1, 2, 3, 4];
  if (r.kind === 'weekly' && r.weekdays?.length) return [...new Set(r.weekdays.map((d) => d - 1))].sort();
  return null;
}

const noteOf = (ev: SEvent, extra?: string) => [ev.notes?.trim(), extra].filter(Boolean).join('\n') || null;

export function fromSchedule(
  backup: ReturnType<typeof parseScheduleBackup>,
  opts: { zone: string; today: string },
): ScheduleImport {
  const events: ImportedEvent[] = [];
  const warnings = new Set<string>();
  const byId = new Map(backup.exceptions.map((x) => [`${x.seriesId}/${x.key}`, x]));
  const exceptionsOf = (id: string) => backup.exceptions.filter((x) => x.seriesId === id);

  const single = (ev: SEvent, importId: string, date: string): ImportedEvent => {
    const s = slotOf(ev.schedule, date, opts.zone);
    if (s.overnight) warnings.add('Events that run past midnight keep their start time only.');
    return {
      importId,
      title: ev.title.trim().slice(0, 120),
      date: s.date,
      start: s.start,
      end: s.end,
      // A multi-day all-day event becomes one event repeating every day through its last day.
      repeat: s.days > 1 ? { days: [0, 1, 2, 3, 4, 5, 6], until: addDays(s.date, s.days - 1) } : null,
      exceptions: {},
      note: noteOf(ev, s.overnight ? `Ends ${fromMin((toMin(s.start!) + (ev.schedule as { duration: number }).duration) % 1440)} the next day` : undefined),
      category: ev.category ?? null,
    };
  };

  for (const ev of backup.events) {
    if (!ev.recurrence) {
      events.push(single(ev, ev.id, ev.schedule.date));
      continue;
    }
    const key = (d: string) => (ev.schedule.kind === 'allDay' ? d : `${d}T${ev.schedule.time}`);
    const days = weeklyDays(ev);
    if (!days || (ev.schedule.kind === 'allDay' && dayCount(ev.schedule.date, ev.schedule.endDate) > 2)) {
      // Spell the series out: one event per occurrence, with its changes applied.
      warnings.add('Repeats LifeTracker has no rule for (every few weeks, monthly) came across as separate events.');
      for (const d of seriesDates(ev, opts.today)) {
        const x = byId.get(`${ev.id}/${key(d)}`);
        if (x?.cancelled) continue;
        const one = x?.replacement && isEvent(x.replacement) ? single({ ...x.replacement, recurrence: undefined }, `${ev.id}@${d}`, x.replacement.schedule.date) : single(ev, `${ev.id}@${d}`, d);
        events.push(one);
      }
      continue;
    }

    const base = single({ ...ev, recurrence: undefined }, ev.id, ev.schedule.date);
    // A time-zone change can move the series to the day before or after; its weekdays move with it.
    const shift = dayCount(ev.schedule.date, base.date) - 1;
    const series: ImportedEvent = {
      ...base,
      repeat: { days: [...new Set(days.map((d) => (d + shift + 7) % 7))].sort(), until: ev.recurrence.until ? addDays(ev.recurrence.until, shift) : null },
    };
    for (const x of exceptionsOf(ev.id)) {
      const orig = addDays(x.key.slice(0, 10), shift);
      if (!DATE.test(orig)) continue;
      if (x.cancelled) {
        series.exceptions[orig] = { cancelled: true };
        continue;
      }
      const r = x.replacement;
      if (!r || !isEvent(r)) continue;
      const moved = single({ ...r, recurrence: undefined }, `${ev.id}@${x.key.slice(0, 10)}`, r.schedule.date);
      const sameShape = moved.title === series.title && (moved.start === null) === (series.start === null) && Math.abs(dayCount(orig, moved.date) - 1) <= MOVE_SLACK && !moved.repeat;
      if (sameShape) {
        const ch: EventException = {};
        if (moved.date !== orig) ch.date = moved.date;
        if (moved.start && moved.start !== series.start) ch.start = moved.start;
        if (moved.end && moved.end !== series.end) ch.end = moved.end;
        if (Object.keys(ch).length) series.exceptions[orig] = ch;
      } else {
        // Renamed or turned into something else: cancel that day and add the changed one on its own.
        series.exceptions[orig] = { cancelled: true };
        events.push(moved);
      }
    }
    events.push(series);
  }

  const tasks: ImportedTask[] = [];
  for (const t of backup.tasks) {
    const title = str(t.title)?.trim().slice(0, 200);
    if (!title || typeof t.id !== 'string') continue;
    const due = str(t.dueDate);
    if (t.recurrence) warnings.add('Repeating tasks came across as their current copy only.');
    tasks.push({ importId: t.id, title, due: due && DATE.test(due) ? due : null, done_at: str(t.completedAt) ?? null });
  }
  return { events, tasks, warnings: [...warnings] };
}
