/**
 * Calendar events → the occurrences shown on given days. Weekly repeats, per-occurrence changes
 * (cancel, move, retime) and "this and later" splits. Pure: callers commit the events returned.
 * Dates are calendar days; times are HH:MM in the Daily Log time zone.
 */
import { addDays, dayCount, weekdayIndex } from '../log/dates';
import type { EventException, LtEvent } from '../../data/types';

export interface Occurrence {
  /** `${eventId}@${origDate}`: stable for an occurrence even after it moves. */
  key: string;
  event: LtEvent;
  /** The date the series put it on (the exception key). */
  origDate: string;
  date: string;
  start: string | null;
  end: string | null;
  recurring: boolean;
  cancelled: boolean;
  /** Moved or retimed from the series. */
  changed: boolean;
}

const toMin = (t: string) => +t.slice(0, 2) * 60 + +t.slice(3, 5);

/** How far an exception may move an occurrence; occurrences this far outside the range are checked too. */
const MOVE_SLACK = 31;

/** Every occurrence whose (possibly moved) date falls in from…to, sorted by day and time. */
export function occurrences(events: Iterable<LtEvent>, from: string, to: string): Occurrence[] {
  const out: Occurrence[] = [];
  const scanFrom = addDays(from, -MOVE_SLACK);
  const scanTo = addDays(to, MOVE_SLACK);
  for (const ev of events) {
    if (ev.deleted_at) continue;
    const add = (orig: string) => {
      const ex: EventException = ev.exceptions?.[orig] ?? {};
      const date = ex.date ?? orig;
      if (date < from || date > to) return;
      out.push({
        key: `${ev.id}@${orig}`,
        event: ev,
        origDate: orig,
        date,
        start: ex.start ?? ev.start,
        end: ex.end ?? ev.end,
        recurring: !!ev.repeat,
        cancelled: !!ev.cancelled_at || !!ex.cancelled,
        changed: !!(ex.date || ex.start || ex.end),
      });
    };
    if (!ev.repeat) {
      add(ev.date);
      continue;
    }
    const start = ev.date > scanFrom ? ev.date : scanFrom;
    const end = ev.repeat.until && ev.repeat.until < scanTo ? ev.repeat.until : scanTo;
    if (start > end) continue;
    for (let i = 0, n = dayCount(start, end); i < n; i++) {
      const d = addDays(start, i);
      if (ev.repeat.days.includes(weekdayIndex(d))) add(d);
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date) || (a.start ?? '').localeCompare(b.start ?? '') || a.event.title.localeCompare(b.event.title));
}

/** Timed, not cancelled occurrences that overlap another on the same day: key → the other titles. */
export function conflicts(occ: Occurrence[]): Map<string, string[]> {
  const out = new Map<string, string[]>();
  const timed = occ.filter((o) => o.start && o.end && !o.cancelled);
  for (let i = 0; i < timed.length; i++) {
    for (let j = i + 1; j < timed.length; j++) {
      const a = timed[i];
      const b = timed[j];
      if (a.date !== b.date) continue;
      if (toMin(a.start!) < toMin(b.end!) && toMin(b.start!) < toMin(a.end!)) {
        out.set(a.key, [...(out.get(a.key) ?? []), b.event.title]);
        out.set(b.key, [...(out.get(b.key) ?? []), a.event.title]);
      }
    }
  }
  return out;
}

export interface Change {
  date: string;
  start: string | null;
  end: string | null;
}

const now = () => new Date().toISOString();

/** Change one occurrence of a series (or a one-off event itself). */
export function changeOne(ev: LtEvent, origDate: string, change: Change): LtEvent {
  if (!ev.repeat) return { ...ev, date: change.date, start: change.start, end: change.end, updated_at: now() };
  const ex: EventException = {};
  if (change.date !== origDate) ex.date = change.date;
  if (change.start !== ev.start) ex.start = change.start ?? undefined;
  if (change.end !== ev.end) ex.end = change.end ?? undefined;
  const exceptions = { ...ev.exceptions };
  if (Object.keys(ex).length) exceptions[origDate] = ex;
  else delete exceptions[origDate];
  return { ...ev, exceptions, updated_at: now() };
}

/**
 * Change this occurrence and every later one: the series ends the day before, and a new series
 * starts here with the new day of the week and times. Exceptions after the split move to the new
 * series only if they were cancellations (a moved day no longer lines up).
 */
export function changeFuture(ev: LtEvent, origDate: string, change: Change, newId: string): [LtEvent, LtEvent] {
  if (!ev.repeat) return [changeOne(ev, origDate, change), ev];
  const shift = weekdayIndex(change.date) - weekdayIndex(origDate);
  const t = now();
  const before: Record<string, EventException> = {};
  const after: Record<string, EventException> = {};
  for (const [d, ex] of Object.entries(ev.exceptions ?? {})) {
    if (d < origDate) before[d] = ex;
    else if (d > origDate && ex.cancelled) after[addDays(d, dayCount(origDate, change.date) - 1)] = { cancelled: true };
  }
  const ended: LtEvent = { ...ev, exceptions: before, repeat: { ...ev.repeat, until: addDays(origDate, -1) }, updated_at: t };
  const next: LtEvent = {
    ...ev,
    id: newId,
    date: change.date,
    start: change.start,
    end: change.end,
    repeat: { days: [...new Set(ev.repeat.days.map((d) => (d + shift + 7) % 7))].sort(), until: ev.repeat.until },
    exceptions: after,
    created_at: t,
    updated_at: t,
  };
  return [ended, next];
}

export function cancelOne(ev: LtEvent, origDate: string): LtEvent {
  if (!ev.repeat) return { ...ev, cancelled_at: now(), updated_at: now() };
  return { ...ev, exceptions: { ...ev.exceptions, [origDate]: { ...(ev.exceptions?.[origDate] ?? {}), cancelled: true } }, updated_at: now() };
}

/** Stop the series from this occurrence on (earlier ones stay as they were). */
export function cancelFuture(ev: LtEvent, origDate: string): LtEvent {
  if (!ev.repeat) return cancelOne(ev, origDate);
  return { ...ev, repeat: { ...ev.repeat, until: addDays(origDate, -1) }, updated_at: now() };
}

export function restoreOne(ev: LtEvent, origDate: string): LtEvent {
  if (!ev.repeat) return { ...ev, cancelled_at: null, updated_at: now() };
  const exceptions = { ...ev.exceptions };
  delete exceptions[origDate];
  return { ...ev, exceptions, updated_at: now() };
}

/** Planned vs done: a past session counts as done when an activity was logged in its section that day. */
export function matchDone(occ: Occurrence[], loggedSectionsByDay: Map<string, Set<string>>, today: string): Map<string, 'done' | 'unlogged' | 'planned'> {
  const out = new Map<string, 'done' | 'unlogged' | 'planned'>();
  for (const o of occ) {
    if (o.event.kind !== 'session' || o.cancelled) continue;
    if (o.date > today) out.set(o.key, 'planned');
    else if (o.event.section && loggedSectionsByDay.get(o.date)?.has(o.event.section)) out.set(o.key, 'done');
    else out.set(o.key, o.date < today ? 'unlogged' : 'planned');
  }
  return out;
}
