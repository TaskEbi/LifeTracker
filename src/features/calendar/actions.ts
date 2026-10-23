/** Calendar changes. The recurrence maths is in domain/calendar; this commits the results. */
import { commit, data } from '../../data/store';
import type { EventKind, LtEvent, SectionId } from '../../data/types';
import { toast } from '../../data/ui';
import { uuid } from '../../lib/random';
import { cancelFuture, cancelOne, changeFuture, changeOne, restoreOne, type Change } from '../../domain/calendar/occurrences';

const now = () => new Date().toISOString();
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export interface EventDraft {
  title: string;
  section: SectionId | null;
  kind: EventKind;
  date: string;
  start: string | null;
  end: string | null;
  repeat: { days: number[]; until: string | null } | null;
  note: string;
  data: Record<string, unknown>;
}

export function checkEvent(d: EventDraft): string | null {
  if (!d.title.trim()) return 'Give the event a title.';
  if (d.title.trim().length > 120) return 'Keep the title under 120 characters.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date)) return 'Pick a day.';
  if ((d.start && !TIME.test(d.start)) || (d.end && !TIME.test(d.end))) return 'Times are HH:MM.';
  if (d.start && d.end && d.end <= d.start) return 'It has to end after it starts.';
  if (d.repeat && !d.repeat.days.length) return 'Pick at least one day for it to repeat on.';
  if (d.repeat?.until && d.repeat.until < d.date) return 'The repeat ends before it starts.';
  return null;
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
    repeat: d.repeat,
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
