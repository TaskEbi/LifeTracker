/** Bring a Schedule app backup into the calendar. Already-imported events and tasks are skipped, so it can run twice. */
import { logToday } from '../../data/logActions';
import { commit, data } from '../../data/store';
import type { EventKind, LtEvent, SectionId, Todo } from '../../data/types';
import { fromSchedule, parseScheduleBackup, type ScheduleImport } from '../../domain/calendar/scheduleImport';
import { uuid } from '../../lib/random';

export const SCHEDULE_SOURCE = 'schedule';

/** A section when the title makes it plain; anything else stays unsectioned to set by hand. */
const SECTION_WORDS: [RegExp, SectionId][] = [
  [/violin|philharmoni|orchestra|concerto|recital/i, 'violin'],
  [/\b(joi|ioi|coding|programming|hackathon)\b/i, 'coding'],
  [/volleyball|football|soccer|tennis|marathon|\brun\b|swim|basketball|badminton/i, 'sports'],
  [/\bgym\b/i, 'gym'],
  [/\bchess\b/i, 'chess'],
];
export const guessSection = (title: string): SectionId | null => SECTION_WORDS.find(([re]) => re.test(title))?.[1] ?? null;
const guessKind = (title: string): EventKind => (/^school$/i.test(title.trim()) ? 'school' : 'other');

export interface SchedulePlan extends ScheduleImport {
  /** Already in LifeTracker from an earlier import. */
  already: number;
}

/** Read the file and work out what would be added, without saving anything. */
export async function planScheduleImport(file: File): Promise<SchedulePlan> {
  if (file.size > 20 * 1024 * 1024) throw new Error('That file is over 20 MB; a Schedule backup is much smaller.');
  const st = data.get();
  const parsed = fromSchedule(parseScheduleBackup(await file.text()), { zone: st.settings.log_timezone, today: logToday() });
  const seen = new Set([...st.lt_events.values()].filter((e) => !e.deleted_at && e.data?.import_source === SCHEDULE_SOURCE).map((e) => e.data.import_id as string));
  const tasksSeen = new Set([...st.todos.values()].filter((t) => !t.deleted_at).map((t) => `${t.title.toLowerCase()}|${t.due ?? ''}`));
  // Also skip ones added here by hand: same title and start, on the same day or the same weekdays.
  const live = [...st.lt_events.values()].filter((e) => !e.deleted_at && !e.cancelled_at);
  const handMade = (e: SchedulePlan['events'][number]) =>
    live.some((x) => x.title.trim().toLowerCase() === e.title.toLowerCase() && x.start === e.start && (e.repeat && x.repeat ? e.repeat.days.some((d) => x.repeat!.days.includes(d)) : x.date === e.date));
  const events = parsed.events.filter((e) => !seen.has(e.importId) && !handMade(e));
  const tasks = parsed.tasks.filter((t) => !tasksSeen.has(`${t.title.toLowerCase()}|${t.due ?? ''}`));
  return { ...parsed, events, tasks, already: parsed.events.length - events.length + parsed.tasks.length - tasks.length };
}

export function applyScheduleImport(plan: SchedulePlan, withTasks: boolean): { events: number; tasks: number } {
  const t = new Date().toISOString();
  const events: LtEvent[] = plan.events.map((e) => ({
    id: uuid(),
    title: e.title,
    section: guessSection(e.title),
    kind: guessKind(e.title),
    date: e.date,
    start: e.start,
    end: e.end,
    repeat: e.repeat,
    exceptions: e.exceptions,
    note: e.note,
    data: { import_source: SCHEDULE_SOURCE, import_id: e.importId, ...(e.category ? { category: e.category } : {}) },
    cancelled_at: null,
    created_at: t,
    updated_at: t,
    deleted_at: null,
  }));
  const tasks: Todo[] = withTasks
    ? plan.tasks.map((x) => ({ id: uuid(), title: x.title, priority: 'normal', section: null, due: x.due, done_at: x.done_at, created_at: t, updated_at: t, deleted_at: null }))
    : [];
  if (events.length) commit('lt_events', events);
  if (tasks.length) commit('todos', tasks);
  return { events: events.length, tasks: tasks.length };
}
