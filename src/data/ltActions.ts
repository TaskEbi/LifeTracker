/** LifeTracker actions that span sections: tasks with rewards and undo. Section-specific ones live with their feature. */
import { nextTaskDue } from '../domain/calendar/repeat';
import { relativeDay } from '../domain/log/dates';
import { ltToday, prefValue, setPref, withReward } from './lt';
import { commit, data, type DataState } from './store';
import { addTodo, deleteTodo, restoreTodo, setTodoDone } from './todoActions';
import type { Repeat, Todo } from './types';
import { toast } from './ui';

/** Tasks unticked on this device this session: ticking them again restores their XP without celebrating it twice. */
const unticked = new Set<string>();

// ─── repeating tasks ────────────────────────────────────────────────────────
// Curio Cabinet's to-dos have no repeat column, so a repeating task keeps its rule in lt_prefs under
// `task_repeat.<todo id>`. Ticking it adds the next copy (a new to-do, so its XP counts once too)
// and moves the rule there, remembering where it came from so unticking can take it back.

export type TaskRepeat = Repeat & { prev?: string };
const PREFIX = 'task_repeat.';
const repeatKey = (id: string) => `${PREFIX}${id}`;
/** lt_prefs ids are lowercase; a to-do id that doesn't fit can't carry a rule. */
const canRepeat = (id: string) => /^[a-z0-9-]{1,50}$/.test(id);

export function taskRepeat(st: DataState, id: string): TaskRepeat | null {
  const v = prefValue(st, repeatKey(id));
  return v && typeof v === 'object' && Array.isArray((v as Repeat).days) ? (v as TaskRepeat) : null;
}

function dropPref(key: string) {
  const row = data.get().lt_prefs.get(key);
  if (row && !row.deleted_at) commit('lt_prefs', [{ ...row, deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() }]);
}

/** Set or clear a task's repeat rule. */
export function setTaskRepeat(id: string, rule: Repeat | null): string | null {
  if (!rule) {
    dropPref(repeatKey(id));
    return null;
  }
  if (!canRepeat(id)) return 'This task can’t repeat (it was made somewhere that uses a different id).';
  const prev = taskRepeat(data.get(), id)?.prev;
  setPref(repeatKey(id), prev ? { ...rule, prev } : rule);
  return null;
}

/** Ticked: add the next copy and hand it the rule. */
function repeatOnward(t: Todo) {
  const rule = taskRepeat(data.get(), t.id);
  if (!rule) return;
  const today = ltToday();
  const due = nextTaskDue(rule, t.due ?? today, today);
  if (!due) return toast('That was the last one of this repeating task');
  const made = addTodo({ title: t.title, priority: t.priority, due, section: t.section ?? null });
  if ('error' in made) return;
  const { prev: _prev, ...r } = rule;
  setPref(repeatKey(made.id), { ...r, prev: t.id });
  dropPref(repeatKey(t.id));
  toast(`Next one added for ${relativeDay(due, today)}`);
}

/** Unticked: remove the copy it made (unless that one is already done) and take the rule back. */
function repeatBack(id: string) {
  const st = data.get();
  for (const p of st.lt_prefs.values()) {
    if (p.deleted_at || !p.id.startsWith(PREFIX) || (p.value as TaskRepeat | null)?.prev !== id) continue;
    const next = st.todos.get(p.id.slice(PREFIX.length));
    if (next && (next.done_at || next.deleted_at)) continue;
    if (next) deleteTodo(next.id);
    const { prev: _prev, ...r } = p.value as TaskRepeat;
    setPref(repeatKey(id), r);
    dropPref(p.id);
  }
}

/** Tick or untick a task. The XP is tied to the task, so it counts once however often it is ticked. */
export function toggleTask(id: string) {
  const t = data.get().todos.get(id);
  if (!t || t.deleted_at) return;
  if (t.done_at) {
    setTodoDone(id, false);
    repeatBack(id);
    unticked.add(id);
    toast('Marked not done');
    return;
  }
  if (unticked.has(id)) {
    setTodoDone(id, true);
    toast('Done again');
    repeatOnward(t);
    return;
  }
  withReward(() => {
    setTodoDone(id, true);
    repeatOnward(t);
  });
}

export function removeTask(id: string) {
  const at = deleteTodo(id);
  if (at) toast('Task deleted', { label: 'Undo', run: () => restoreTodo(id, at) });
}
