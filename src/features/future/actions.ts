/**
 * Future changes. Records go through `saveRecord` (local-first, synced). After every save, the
 * record's calendar events and reminder tasks are brought in line with `linksFor`: events carry
 * `data.future = '<record id>:<key>'`, tasks are remembered on the record (`data.tasks`), so
 * changing a date moves them and deleting the record takes them away. A ticked task is left alone.
 */
import { ltToday, setPref, withReward } from '../../data/lt';
import { deleteRecord, saveRecord } from '../../data/records';
import { commit, data } from '../../data/store';
import { addTodo } from '../../data/todoActions';
import type { LtEvent, LtRecord, Todo } from '../../data/types';
import { toast } from '../../data/ui';
import { uuid } from '../../lib/random';
import { linksFor } from '../../domain/future/plan';
import { defaultChecklist, presetDate, UNI_PRESETS, type UniPreset } from '../../domain/future/presets';
import { stampStatus, type FutureKind, type FutureProfile } from '../../domain/future/model';

const now = () => new Date().toISOString();

export const futureRecords = (kind?: FutureKind) =>
  [...data.get().lt_records.values()].filter((r) => r.section === 'future' && !r.deleted_at && (!kind || r.kind === kind)).sort((a, b) => a.sort_order - b.sort_order);

/** Bring a record's linked events and tasks in line with what it should have. */
export function syncLinks(id: string) {
  const st = data.get();
  const r = st.lt_records.get(id);
  if (!r) return;
  const today = ltToday();
  const want = r.deleted_at ? { events: [], tasks: [] } : linksFor(r, today);
  const t = now();

  // events
  const mine = [...st.lt_events.values()].filter((e) => !e.deleted_at && typeof e.data.future === 'string' && (e.data.future as string).startsWith(`${id}:`));
  const evRows: LtEvent[] = [];
  for (const w of want.events) {
    const tag = `${id}:${w.key}`;
    const hit = mine.find((e) => e.data.future === tag);
    if (hit) {
      if (hit.title !== w.title || hit.date !== w.date || hit.kind !== w.kind) evRows.push({ ...hit, title: w.title.slice(0, 120), date: w.date, kind: w.kind, updated_at: t });
    } else {
      evRows.push({ id: uuid(), title: w.title.slice(0, 120), section: 'future', kind: w.kind, date: w.date, start: null, end: null, repeat: null, exceptions: {}, note: null, data: { future: tag }, cancelled_at: null, created_at: t, updated_at: t, deleted_at: null });
    }
  }
  for (const e of mine) if (!want.events.some((w) => e.data.future === `${id}:${w.key}`)) evRows.push({ ...e, deleted_at: t, updated_at: t });
  if (evRows.length) commit('lt_events', evRows);

  // reminder tasks
  const known = (r.data.tasks && typeof r.data.tasks === 'object' ? r.data.tasks : {}) as Record<string, string>;
  const next: Record<string, string> = {};
  const todoRows: Todo[] = [];
  for (const w of want.tasks) {
    const todo = known[w.key] ? data.get().todos.get(known[w.key]) : undefined;
    if (todo && !todo.deleted_at) {
      next[w.key] = todo.id;
      if (!todo.done_at && (todo.title !== w.title || todo.due !== w.due)) todoRows.push({ ...todo, title: w.title, due: w.due, updated_at: t });
    } else if (!todo) {
      const made = addTodo({ title: w.title, priority: 'normal', due: w.due, section: 'future' });
      if (!('error' in made)) next[w.key] = made.id;
    }
  }
  for (const [key, todoId] of Object.entries(known)) {
    if (next[key]) continue;
    const todo = data.get().todos.get(todoId);
    // no longer needed: open reminders go; ticked ones stay as a record of it
    if (todo && !todo.deleted_at && !todo.done_at) todoRows.push({ ...todo, deleted_at: t, updated_at: t });
  }
  if (todoRows.length) commit('todos', todoRows);
  if (JSON.stringify(next) !== JSON.stringify(known)) {
    const cur = data.get().lt_records.get(id)!;
    commit('lt_records', [{ ...cur, data: { ...cur.data, tasks: next }, updated_at: now() }]);
  }
}

/** Bring every Future record's links up to date (reminders come into range as the days pass). Once a day per device session. */
let syncedOn = '';
export function syncAllLinks() {
  const today = ltToday();
  if (syncedOn === today) return;
  syncedOn = today;
  for (const r of futureRecords()) syncLinks(r.id);
}

/**
 * Save a Future record: stamps the day a status was first reached, keeps the linked tasks map,
 * syncs links, and shows the reward when a milestone is crossed.
 */
export function saveFuture(kind: FutureKind, value: Record<string, unknown>, id?: string | null): LtRecord {
  const prev = id ? data.get().lt_records.get(id) : undefined;
  const today = ltToday();
  const statusAt = (prev?.data.statusAt as Record<string, string> | undefined) ?? {};
  const v: Record<string, unknown> = { ...value };
  if (typeof v.status === 'string') v.statusAt = stampStatus(statusAt, v.status, today);
  if (prev?.data.tasks) v.tasks = prev.data.tasks;
  let saved!: LtRecord;
  withReward(() => {
    saved = saveRecord('future', kind, v, prev?.id);
  });
  syncLinks(saved.id);
  return saved;
}

export function removeFuture(id: string, label: string) {
  deleteRecord(id, label);
  syncLinks(id);
}

/** Add universities from the presets, with their usual dates for this entry year, unconfirmed. */
export function addUniPresets(list: UniPreset[], entry: number): number {
  const have = new Set(futureRecords('uni').map((r) => String(r.data.name).toLowerCase()));
  let n = 0;
  for (const p of list) {
    if (have.has(p.name.toLowerCase())) continue;
    const r = saveRecord('future', 'uni', {
      name: p.name,
      country: p.country,
      course: p.course,
      plan: p.plan,
      deadline: presetDate(p.deadline, entry),
      ...(p.interview ? { interview: presetDate(p.interview, entry) } : {}),
      tests: p.tests,
      music: p.music,
      status: 'researching',
      checklist: defaultChecklist(p.country, p.tests),
      checked: false,
    });
    syncLinks(r.id);
    n++;
  }
  return n;
}

/**
 * The starting plan from the setup questions: entry year, the A-level subjects as grades, SAT and
 * TMUA with targets, and (if chosen) the universities. Skips anything already there.
 */
export function setUpPlan(opts: { entry: number; unis: boolean; subjects: string[] }) {
  setPref('future_profile', { ...((data.get().lt_prefs.get('future_profile')?.value as object) ?? {}), entryYear: opts.entry } satisfies Partial<FutureProfile>);
  const grades = new Set(futureRecords('grade').map((r) => String(r.data.subject)));
  for (const s of opts.subjects) if (!grades.has(s)) saveRecord('future', 'grade', { subject: s, target: 'A*', predicted: '', achieved: '' });
  const tests = new Set(futureRecords('test').map((r) => String(r.data.name)));
  if (!tests.has('SAT')) saveRecord('future', 'test', { name: 'SAT', target: 1580, sittings: [], scores: [] });
  if (!tests.has('TMUA')) saveRecord('future', 'test', { name: 'TMUA', target: null, sittings: [], scores: [] });
  const n = opts.unis ? addUniPresets(UNI_PRESETS, opts.entry) : 0;
  toast(n ? `Set up · ${n} universities added (dates to check)` : 'Set up');
}
