/**
 * Gym: templates (lt_records kind 'gym_template'), a session in progress (on this device only),
 * and finished sessions (a Daily Log entry + lt_details with every set and the check-in).
 * The starter templates are placeholders to show the sheet, not a training prescription.
 */
import type { LtRecord } from '../../data/types';
import type { SectionEntry } from '../../data/lt';

export interface PlanExercise {
  name: string;
  sets: number;
  reps: number;
  /** 's' for timed holds (reps are seconds). */
  unit?: 's';
  /** kg; 0 = bodyweight. */
  weight: number;
  rest: number;
  alts: string[];
}

export interface Template {
  id: string;
  name: string;
  focus: string;
  estimate: number;
  exercises: PlanExercise[];
  archived: boolean;
}

export interface SetLog {
  reps: number;
  weight: number;
  done: boolean;
}
export interface ExerciseLog {
  name: string;
  unit?: 's';
  rest: number;
  alts: string[];
  swappedFrom?: string | null;
  sets: SetLog[];
}
export interface GymDetail {
  name: string;
  template: string | null;
  exercises: ExerciseLog[];
  effort?: number | null;
  soreness?: number | null;
  pain?: boolean;
  painNote?: string;
}
export type GymSession = SectionEntry<GymDetail>;

export function isGymDetail(d: unknown): d is GymDetail {
  const g = d as GymDetail | null;
  return !!g && typeof g.name === 'string' && Array.isArray(g.exercises);
}

const num = (v: unknown, lo: number, hi: number, d: number) => (Number.isFinite(v) && (v as number) >= lo && (v as number) <= hi ? (v as number) : d);

export function templateOf(r: LtRecord): Template {
  const d = r.data as Partial<Template>;
  return {
    id: r.id,
    name: typeof d.name === 'string' && d.name ? d.name : 'Workout',
    focus: typeof d.focus === 'string' ? d.focus : '',
    estimate: num(d.estimate, 10, 240, 60),
    exercises: (Array.isArray(d.exercises) ? d.exercises : []).map((e: Partial<PlanExercise>) => ({
      name: typeof e.name === 'string' && e.name ? e.name : 'Exercise',
      sets: num(e.sets, 1, 12, 3),
      reps: num(e.reps, 1, 300, 8),
      unit: e.unit === 's' ? 's' : undefined,
      weight: num(e.weight, 0, 500, 0),
      rest: num(e.rest, 0, 600, 90),
      alts: Array.isArray(e.alts) ? e.alts.filter((a): a is string => typeof a === 'string') : [],
    })),
    archived: !!r.archived_at,
  };
}

/** Placeholder templates for an intermediate lifter, to adjust freely. Not a personalised plan. */
export const STARTER_TEMPLATES: Omit<Template, 'id' | 'archived'>[] = [
  {
    name: 'Upper A', focus: 'Push and pull', estimate: 70, exercises: [
      { name: 'Bench press', sets: 4, reps: 6, weight: 50, rest: 120, alts: ['Dumbbell bench press', 'Machine chest press', 'Weighted push-up'] },
      { name: 'One-arm dumbbell row', sets: 3, reps: 10, weight: 22, rest: 90, alts: ['Seated cable row', 'Chest-supported row'] },
      { name: 'Overhead press', sets: 3, reps: 8, weight: 30, rest: 90, alts: ['Seated dumbbell press', 'Landmine press'] },
      { name: 'Lat pulldown', sets: 3, reps: 10, weight: 45, rest: 75, alts: ['Assisted pull-up', 'Chin-up'] },
      { name: 'Face pull', sets: 3, reps: 15, weight: 15, rest: 60, alts: ['Band pull-apart', 'Reverse fly'] },
      { name: 'Plank', sets: 3, reps: 40, unit: 's', weight: 0, rest: 45, alts: ['Dead bug', 'Side plank'] },
    ],
  },
  {
    name: 'Lower A', focus: 'Legs and trunk', estimate: 65, exercises: [
      { name: 'Goblet squat', sets: 3, reps: 8, weight: 24, rest: 120, alts: ['Leg press', 'Box squat'] },
      { name: 'Romanian deadlift', sets: 3, reps: 8, weight: 50, rest: 120, alts: ['Single-leg RDL', 'Cable pull-through'] },
      { name: 'Bulgarian split squat', sets: 3, reps: 10, weight: 12, rest: 90, alts: ['Reverse lunge', 'Step-up'] },
      { name: 'Hip thrust', sets: 3, reps: 10, weight: 60, rest: 90, alts: ['Glute bridge', 'Back extension'] },
      { name: 'Tibialis raise', sets: 2, reps: 15, weight: 0, rest: 45, alts: ['Toe walks', 'Banded dorsiflexion'] },
      { name: 'Dead bug', sets: 3, reps: 10, weight: 0, rest: 45, alts: ['Bird dog', 'Hollow hold'] },
    ],
  },
  {
    name: 'Full body', focus: 'Strength mix', estimate: 75, exercises: [
      { name: 'Trap-bar deadlift', sets: 3, reps: 5, weight: 80, rest: 150, alts: ['Romanian deadlift', 'Kettlebell deadlift'] },
      { name: 'Incline dumbbell press', sets: 3, reps: 10, weight: 18, rest: 90, alts: ['Push-up', 'Machine incline press'] },
      { name: 'Chin-up', sets: 3, reps: 6, weight: 0, rest: 120, alts: ['Lat pulldown', 'Inverted row'] },
      { name: 'Split squat', sets: 3, reps: 8, weight: 10, rest: 90, alts: ['Goblet squat', 'Step-up'] },
      { name: 'Pallof press', sets: 3, reps: 12, weight: 10, rest: 45, alts: ['Side plank', 'Suitcase carry'] },
    ],
  },
];

/** A fresh session from a template, every set not yet done. */
export function startFrom(t: Template): GymDetail {
  return {
    name: t.name,
    template: t.id,
    exercises: t.exercises.map((e) => ({ name: e.name, unit: e.unit, rest: e.rest, alts: [...e.alts], swappedFrom: null, sets: Array.from({ length: e.sets }, () => ({ reps: e.reps, weight: e.weight, done: false })) })),
  };
}

export const setsDone = (d: GymDetail) => d.exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0);
export const setsTotal = (d: GymDetail) => d.exercises.reduce((n, e) => n + e.sets.length, 0);

/** Heaviest completed set per session for one exercise, oldest first (only sessions that did it). */
export function progression(sessions: GymSession[], exercise: string): { date: string; weight: number }[] {
  const out: { date: string; weight: number }[] = [];
  for (const s of sessions) {
    if (!isGymDetail(s.detail)) continue;
    const ex = s.detail.exercises.find((e) => e.name === exercise);
    const done = ex?.sets.filter((x) => x.done) ?? [];
    if (done.length) out.push({ date: s.entry.date, weight: Math.max(...done.map((x) => x.weight)) });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

/** Exercises with at least two weighted sessions, most recent first: the ones a trend makes sense for. */
export function trackedExercises(sessions: GymSession[]): string[] {
  const seen = new Map<string, { n: number; last: string }>();
  for (const s of sessions) {
    if (!isGymDetail(s.detail)) continue;
    for (const e of s.detail.exercises) {
      if (!e.sets.some((x) => x.done && x.weight > 0)) continue;
      const v = seen.get(e.name) ?? { n: 0, last: '' };
      seen.set(e.name, { n: v.n + 1, last: s.entry.date > v.last ? s.entry.date : v.last });
    }
  }
  return [...seen].filter(([, v]) => v.n >= 2).sort((a, b) => b[1].last.localeCompare(a[1].last)).map(([k]) => k);
}

/** A lower-body day the day before (or of) a court or running session: worth a second look. */
export const legsHeavy = (t: Template) => /leg|lower|squat|full/i.test(`${t.name} ${t.focus}`);
