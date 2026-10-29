/**
 * The gym plan: two upper-body days and one athletic day (plyos, reaction, runner prehab).
 * Lower-body load is kept small on purpose: the marathon build and court sports already load
 * the legs. Starting weights are modest guesses; the first session's weights carry forward.
 */
import type { PlanWorkoutId } from './types';

/** Same shape as a gym template (src/features/gym/model.ts) minus id/archived. */
export interface PlanWorkoutExercise {
  name: string;
  sets: number;
  reps: number;
  unit?: 's';
  weight: number;
  rest: number;
  alts: string[];
}
export interface PlanWorkout {
  id: PlanWorkoutId;
  /** Mon = 0 … Sun = 6. */
  day: number;
  name: string;
  focus: string;
  estimate: number;
  exercises: PlanWorkoutExercise[];
}

const ex = (name: string, sets: number, reps: number, weight: number, rest: number, alts: string[] = [], unit?: 's'): PlanWorkoutExercise => ({ name, sets, reps, weight, rest, alts, ...(unit ? { unit } : {}) });

export const PLAN_WORKOUTS: PlanWorkout[] = [
  {
    id: 'upper-a',
    day: 0,
    name: 'Upper A · Strength',
    focus: 'Push-led strength',
    estimate: 60,
    exercises: [
      ex('Bench press', 4, 5, 50, 150, ['Dumbbell bench press', 'Machine chest press']),
      ex('Weighted pull-up', 4, 5, 0, 150, ['Lat pulldown', 'Assisted pull-up']),
      ex('Seated dumbbell shoulder press', 3, 8, 14, 120, ['Machine shoulder press', 'Landmine press']),
      ex('Chest-supported dumbbell row', 3, 10, 18, 90, ['Seated cable row', 'One-arm dumbbell row']),
      ex('Dips', 3, 8, 0, 120, ['Close-grip bench press', 'Bench dip']),
      ex('Lateral raise', 3, 15, 6, 60, ['Cable lateral raise', 'Machine lateral raise']),
      ex('Hammer curl', 3, 12, 10, 60, ['Cable rope curl', 'Dumbbell curl']),
    ],
  },
  {
    id: 'athletic',
    day: 2,
    name: 'Athletic · Plyo & reaction',
    focus: 'Plyos, reaction, runner prehab',
    estimate: 35,
    exercises: [
      ex('Pogo hops', 3, 20, 0, 60, ['Jump rope', 'Ankle hops']),
      ex('Lateral bound (stick the landing)', 3, 6, 0, 75, ['Skater hop', 'Lateral line hop']),
      ex('Box jump', 4, 3, 0, 90, ['Squat jump', 'Step-up jump']),
      ex('Med-ball rotational throw', 3, 6, 4, 60, ['Cable woodchop', 'Band rotation']),
      ex('Split-step reaction sprint', 6, 5, 0, 45, ['Mirror drill', 'Ball-drop sprint'], 's'),
      ex('Reaction ball drop-and-catch', 3, 30, 0, 30, ['Tennis-ball wall catch', 'Partner ball drop'], 's'),
      ex('Single-leg calf raise', 3, 12, 0, 45, ['Seated calf raise', 'Double-leg calf raise']),
      ex('Copenhagen plank', 2, 20, 0, 45, ['Side plank', 'Adductor squeeze'], 's'),
      ex('Tibialis raise', 2, 15, 0, 45, ['Toe walks', 'Banded dorsiflexion']),
    ],
  },
  {
    id: 'upper-b',
    day: 3,
    name: 'Upper B · Volume',
    focus: 'Pull-led volume',
    estimate: 60,
    exercises: [
      ex('Incline dumbbell press', 4, 8, 18, 120, ['Machine incline press', 'Push-up']),
      ex('Lat pulldown', 4, 10, 45, 90, ['Assisted pull-up', 'Chin-up']),
      ex('Seated cable row', 3, 12, 40, 90, ['Chest-supported row', 'Inverted row']),
      ex('Cable fly', 3, 15, 10, 60, ['Pec deck', 'Dumbbell fly']),
      ex('Face pull', 3, 15, 15, 60, ['Band pull-apart', 'Reverse fly']),
      ex('EZ-bar curl', 3, 10, 20, 60, ['Dumbbell curl', 'Cable curl']),
      ex('Overhead cable triceps extension', 3, 12, 15, 60, ['Dumbbell overhead extension', 'Rope pushdown']),
      ex('Pallof press', 3, 10, 10, 45, ['Side plank', 'Suitcase carry']),
    ],
  },
];
export const planWorkout = (id: string) => PLAN_WORKOUTS.find((w) => w.id === id);

export const PROGRESSION_RULE = 'When every set hits its reps with 1–2 left in reserve, add 2.5 kg next time (1–2 kg for dumbbells). Bodyweight moves: add reps, then a small weight.';
export const STARTING_WEIGHTS_NOTE = 'Starting weights are guesses. Set your real weights in the first session — they carry forward.';

/** How a plan workout changes in the marathon taper (weeks 22–24). */
export interface GymAdjust {
  /** Sets per exercise are capped at this (upper days in race week). */
  maxSets?: number;
  /** Athletic halved: half the sets (at least 1), box jumps dropped. */
  half?: boolean;
  note: string;
}

/** The gym_template record value for a plan workout (same fields the template editor saves). */
export const templateValue = (w: PlanWorkout) => ({ name: w.name, focus: w.focus, estimate: w.estimate, exercises: w.exercises.map((e) => ({ ...e, alts: [...e.alts] })), plan: w.id });

/**
 * Which plan workouts still need a template: those with no stored id, or whose stored template
 * is gone (deleted). Archived ones are left alone (the user archived them on purpose).
 */
export function missingPlanWorkouts(stored: Record<string, string> | undefined, liveTemplateIds: Set<string>): PlanWorkout[] {
  return PLAN_WORKOUTS.filter((w) => !stored?.[w.id] || !liveTemplateIds.has(stored[w.id]));
}

/** A session's exercise list adjusted for the taper. Pure; the template itself is unchanged. */
export function adjustExercises<E extends { name: string; sets: number }>(exercises: E[], adj: GymAdjust | undefined): E[] {
  if (!adj) return exercises;
  let out = exercises;
  if (adj.half) out = out.filter((e) => !/box jump/i.test(e.name)).map((e) => ({ ...e, sets: Math.max(1, Math.ceil(e.sets / 2)) }));
  if (adj.maxSets) out = out.map((e) => ({ ...e, sets: Math.min(e.sets, adj.maxSets!) }));
  return out;
}

/**
 * Last used weights for a plan workout: the heaviest completed set of each exercise in the most
 * recent session made from that template. Exercises never done keep the template's weight.
 */
export function carriedWeights(
  exercises: PlanWorkoutExercise[],
  sessions: { date: string; template: string | null; exercises: { name: string; sets: { weight: number; done: boolean }[] }[] }[],
  templateId: string,
): PlanWorkoutExercise[] {
  const mine = sessions.filter((s) => s.template === templateId).sort((a, b) => b.date.localeCompare(a.date));
  return exercises.map((e) => {
    for (const s of mine) {
      const done = s.exercises.find((x) => x.name === e.name)?.sets.filter((x) => x.done) ?? [];
      if (done.length) return { ...e, weight: Math.max(...done.map((x) => x.weight)) };
    }
    return e;
  });
}
