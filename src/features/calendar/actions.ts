/** Calendar changes. The recurrence maths is in domain/calendar; this commits the results. */
import { commit, data } from '../../data/store';
import type { EventKind, LtEvent, Repeat, SectionId } from '../../data/types';
import { toast } from '../../data/ui';
import { uuid } from '../../lib/random';
import { cancelFuture, cancelOne, changeFuture, changeOne, occurrences, restoreOne, type Change } from '../../domain/calendar/occurrences';
import { checkRepeat, nthOn } from '../../domain/calendar/repeat';
import { addDays } from '../../domain/log/dates';

const now = () => new Date().toISOString();
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export interface EventDraft {
  title: string;
  section: SectionId | null;
  kind: EventKind;
  date: string;
  start: string | null;
  end: string | null;
  repeat: Repeat | null;
  /** "Ends after n times": turned into `repeat.until` when saved. */
  count?: number | null;
  note: string;
  data: Record<string, unknown>;
}

/** The rule as stored: weekdays only for weekly rules, and "after n times" as a last day. */
function finalRepeat(r: Repeat | null, count: number | null | undefined, anchor: string): Repeat | null {
  if (!r) return null;
  const days = r.freq && r.freq !== 'weekly' ? [] : [...new Set(r.days)].sort();
  return { ...r, days, until: count ? nthOn(r, anchor, count) : r.until };
}

export function checkEvent(d: EventDraft): string | null {
  if (!d.title.trim()) return 'Give the event a title.';
  if (d.title.trim().length > 120) return 'Keep the title under 120 characters.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date)) return 'Pick a day.';
  if ((d.start && !TIME.test(d.start)) || (d.end && !TIME.test(d.end))) return 'Times are HH:MM.';
  if (d.start && d.end && d.end <= d.start) return 'It has to end after it starts.';
  if (d.count != null && (!Number.isInteger(d.count) || d.count < 1 || d.count > 500)) return 'It can end after 1 to 500 times.';
  return d.repeat ? checkRepeat(d.repeat, d.date) : null;
}

export function createEvent(d: EventDraft): LtEvent | { error: string } {
  const err = checkEvent(d);
  if (err) return { error: err };
  const t = now();
  const ev: LtEvent = {
    id: uuid(),
    title: d.title.trim(),
    section: d.section,
    kind: d.kind,
    date: d.date,
    start: d.start,
    end: d.start ? d.end : null,
    repeat: finalRepeat(d.repeat, d.count, d.date),
    exceptions: {},
    note: d.note.trim() || null,
    data: d.data,
    cancelled_at: null,
    created_at: t,
    updated_at: t,
    deleted_at: null,
  };
  commit('lt_events', [ev]);
  return ev;
}

/** Edit the event itself (title, section, kind, note, pieces); times and days go through reschedule. */
export function updateEventInfo(id: string, patch: Pick<EventDraft, 'title' | 'section' | 'kind' | 'note' | 'data'>): string | null {
  const ev = data.get().lt_events.get(id);
  if (!ev || ev.deleted_at) return 'That event has gone.';
  if (!patch.title.trim()) return 'Give the event a title.';
  commit('lt_events', [{ ...ev, title: patch.title.trim().slice(0, 120), section: patch.section, kind: patch.kind, note: patch.note.trim() || null, data: patch.data, updated_at: now() }]);
  return null;
}

export function reschedule(id: string, origDate: string, change: Change, scope: 'one' | 'future') {
  const ev = data.get().lt_events.get(id);
  if (!ev) return;
  if (scope === 'future' && ev.repeat) {
    const [ended, next] = changeFuture(ev, origDate, change, uuid());
    // Starting the series over from its first day: no need to keep an empty old series.
    commit('lt_events', ended.repeat!.until! < ev.date ? [{ ...ended, deleted_at: now() }, next] : [ended, next]);
  } else commit('lt_events', [changeOne(ev, origDate, change)]);
}

/**
 * Change how a one-off event or a series repeats. A series changes from `origDate` on (split there);
 * a one-off event starts repeating from its own day. `change` carries any new day and times too.
 */
export function setRepeat(id: string, origDate: string, change: Change, repeat: Repeat | null, count: number | null): string | null {
  const ev = data.get().lt_events.get(id);
  if (!ev || ev.deleted_at) return 'That event has gone.';
  const err = (count != null && (count < 1 || count > 500) ? 'It can end after 1 to 500 times.' : null) ?? (repeat ? checkRepeat(repeat, change.date) : null);
  if (err) return err;
  const rule = finalRepeat(repeat, count, change.date);
  if (!ev.repeat) {
    commit('lt_events', [{ ...ev, date: change.date, start: change.start, end: change.end, repeat: rule, exceptions: {}, updated_at: now() }]);
    return null;
  }
  const [ended, next] = changeFuture(ev, origDate, change, uuid());
  // A new rule: later cancellations no longer line up with it.
  const fresh = { ...next, repeat: rule, exceptions: {} };
  commit('lt_events', ended.repeat!.until! < ev.date ? [{ ...ended, deleted_at: now() }, fresh] : [ended, fresh]);
  return null;
}

export function cancel(id: string, origDate: string, scope: 'one' | 'future') {
  const ev = data.get().lt_events.get(id);
  if (!ev) return;
  const next = scope === 'future' ? cancelFuture(ev, origDate) : cancelOne(ev, origDate);
  commit('lt_events', [next]);
  toast(scope === 'future' && ev.repeat ? 'Series ended' : 'Cancelled', { label: 'Undo', run: () => commit('lt_events', [{ ...ev, updated_at: now() }]) });
}

export function restore(id: string, origDate: string) {
  const ev = data.get().lt_events.get(id);
  if (ev) commit('lt_events', [restoreOne(ev, origDate)]);
}

export function deleteEvent(id: string) {
  const ev = data.get().lt_events.get(id);
  if (!ev || ev.deleted_at) return;
  const at = now();
  commit('lt_events', [{ ...ev, deleted_at: at, updated_at: at }]);
  toast(ev.repeat ? 'Whole series deleted' : 'Event deleted', {
    label: 'Undo',
    run: () => {
      const back = data.get().lt_events.get(id);
      if (back?.deleted_at === at) commit('lt_events', [{ ...back, deleted_at: null, updated_at: now() }]);
    },
  });
}

/** One-off events in the week from `monday` that copying would bring forward (repeats already repeat). */
export function weekOneOffs(monday: string): LtEvent[] {
  return occurrences(data.get().lt_events.values(), monday, addDays(monday, 6))
    .filter((o) => !o.recurring && !o.cancelled)
    .map((o) => o.event);
}

/**
 * Copy the week's one-off events into each of the next `weeks` weeks, same weekday and times.
 * Skips a copy when that week already has an event with the same title, day and start.
 */
export function copyWeek(monday: string, weeks: number): number {
  const all = [...data.get().lt_events.values()].filter((e) => !e.deleted_at);
  const has = new Set(all.map((e) => `${e.title}|${e.date}|${e.start ?? ''}`));
  const t = now();
  const made: LtEvent[] = [];
  for (const ev of weekOneOffs(monday)) {
    for (let w = 1; w <= weeks; w++) {
      const date = addDays(ev.date, 7 * w);
      const k = `${ev.title}|${date}|${ev.start ?? ''}`;
      if (has.has(k)) continue;
      has.add(k);
      made.push({ ...ev, id: uuid(), date, exceptions: {}, cancelled_at: null, created_at: t, updated_at: t, deleted_at: null });
    }
  }
  if (!made.length) return 0;
  commit('lt_events', made);
  toast(`Copied ${made.length} event${made.length === 1 ? '' : 's'}`, {
    label: 'Undo',
    run: () => {
      const at = now();
      commit('lt_events', made.flatMap((e) => {
        const cur = data.get().lt_events.get(e.id);
        return cur && !cur.deleted_at ? [{ ...cur, deleted_at: at, updated_at: at }] : [];
      }));
    },
  });
  return made.length;
}
