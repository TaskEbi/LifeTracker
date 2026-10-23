/**
 * The workout in progress. It lives on this device (and survives a reload) until it is finished,
 * which saves one session; discarding leaves no record.
 */
import { ltToday, withReward } from '../../data/lt';
import { saveSession } from '../../data/sessions';
import { createStore } from '../../lib/createStore';
import { startFrom, type GymDetail, type Template } from './model';

export interface Active {
  detail: GymDetail;
  startedAt: number;
  date: string;
}

const KEY = 'lifetracker-gym-active';
function load(): Active | null {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Active | null;
    return v && v.detail && Array.isArray(v.detail.exercises) ? v : null;
  } catch {
    return null;
  }
}

export const active = createStore<{ a: Active | null; rest: { end: number; total: number } | null }>({ a: load(), rest: null });
active.subscribe(() => {
  try {
    const a = active.get().a;
    if (a) localStorage.setItem(KEY, JSON.stringify(a));
    else localStorage.removeItem(KEY);
  } catch {
    /* private mode: the session still works until the page closes */
  }
});

const edit = (fn: (d: GymDetail) => void) => {
  const a = active.get().a;
  if (!a) return;
  const detail = structuredClone(a.detail);
  fn(detail);
  active.set({ a: { ...a, detail } });
};

export const startWorkout = (t: Template) => active.set({ a: { detail: startFrom(t), startedAt: Date.now(), date: ltToday() }, rest: null });
export const discardWorkout = () => active.set({ a: null, rest: null });

export function toggleSet(ei: number, si: number) {
  let done = false;
  edit((d) => {
    const s = d.exercises[ei].sets[si];
    s.done = !s.done;
    done = s.done;
  });
  const rest = active.get().a!.detail.exercises[ei].rest;
  active.set({ rest: done && rest > 0 ? { end: Date.now() + rest * 1000, total: rest } : null });
}

/** Change weight (±2.5 kg) or reps; a weight change carries forward to the sets not yet done. */
export function bump(ei: number, si: number, field: 'weight' | 'reps', delta: number) {
  edit((d) => {
    const sets = d.exercises[ei].sets;
    const v = Math.max(0, Math.round((sets[si][field] + delta) * 10) / 10);
    sets[si][field] = v;
    if (field === 'weight') sets.forEach((s, i) => i > si && !s.done && (s.weight = v));
  });
}

export function swapExercise(ei: number, name: string) {
  edit((d) => {
    const e = d.exercises[ei];
    const was = e.name;
    e.alts = [...e.alts.filter((x) => x !== name), was];
    e.swappedFrom = e.swappedFrom === name ? null : e.swappedFrom ?? was;
    e.name = name;
  });
}

export const addSet = (ei: number) =>
  edit((d) => {
    const sets = d.exercises[ei].sets;
    const last = sets[sets.length - 1] ?? { reps: 8, weight: 0 };
    sets.push({ reps: last.reps, weight: last.weight, done: false });
  });
export const removeSet = (ei: number) => edit((d) => d.exercises[ei].sets.length > 1 && void d.exercises[ei].sets.pop());
export const removeExercise = (ei: number) => edit((d) => void d.exercises.splice(ei, 1));
export const addExercise = (name: string) => edit((d) => void d.exercises.push({ name, rest: 90, alts: [], sets: [{ reps: 10, weight: 0, done: false }] }));

export const elapsedMinutes = (a: Active) => Math.max(1, Math.round((Date.now() - a.startedAt) / 60000));

/** Save the workout as one session (with the check-in) and show what it earned. */
export function finishWorkout(check: { minutes: number; effort: number | null; soreness: number | null; pain: boolean; painNote: string; note: string }): string | null {
  const a = active.get().a;
  if (!a) return 'No workout in progress.';
  let error: string | null = null;
  const ok = withReward(
    () => {
      const r = saveSession({
        section: 'gym',
        date: a.date,
        minutes: check.minutes,
        note: check.note,
        subcategory: a.detail.name,
        detail: { ...a.detail, effort: check.effort, soreness: check.soreness, pain: check.pain, painNote: check.pain ? check.painNote.trim() : '' },
      });
      if ('error' in r) error = r.error;
      return !('error' in r);
    },
    { pain: check.pain },
  );
  if (ok) discardWorkout();
  return error;
}
