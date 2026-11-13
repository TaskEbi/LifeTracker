/**
 * Gym: a finished session is a Daily Log entry (the time) plus lt_details with the same id (the
 * muscle groups you hit and an optional check-in). There is no plan and no template: you pick the
 * groups, and the statistics are worked out from the sessions (nothing is stored for them).
 *
 * Older sessions, logged when the gym had templates, carry `exercises` with sets and weights and
 * no `muscles`. They stay in the history and the bar tools; they don't count toward the groups.
 * New sessions keep `exercises: []` so XP, quests and achievements (which look for that array)
 * treat them as gym sessions without any change.
 */
import type { SectionEntry } from '../../data/lt';
import { dayCount } from '../../domain/log/dates';

export const MUSCLES = [
  { id: 'chest', name: 'Chest' },
  { id: 'back', name: 'Back' },
  { id: 'shoulders', name: 'Shoulders' },
  { id: 'biceps', name: 'Biceps' },
  { id: 'triceps', name: 'Triceps' },
  { id: 'forearms', name: 'Forearms' },
  { id: 'core', name: 'Core' },
  { id: 'glutes', name: 'Glutes' },
  { id: 'quads', name: 'Quads' },
  { id: 'hamstrings', name: 'Hamstrings' },
  { id: 'calves', name: 'Calves' },
] as const;
export type MuscleId = (typeof MUSCLES)[number]['id'];

const IDS: ReadonlySet<string> = new Set(MUSCLES.map((m) => m.id));
export const muscleName = (id: string) => MUSCLES.find((m) => m.id === id)?.name ?? id;

/** Old sessions only. */
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
  /** Empty on new sessions. */
  exercises: ExerciseLog[];
  muscles?: MuscleId[];
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

/** The muscle groups a session recorded, in the order of MUSCLES, without junk or repeats. */
export function musclesOf(d: unknown): MuscleId[] {
  const raw = (d as { muscles?: unknown } | null)?.muscles;
  if (!Array.isArray(raw)) return [];
  const set = new Set(raw.filter((x): x is string => typeof x === 'string' && IDS.has(x)));
  return MUSCLES.filter((m) => set.has(m.id)).map((m) => m.id);
}

/** The groups as a title: "Chest · Triceps", or the first three and a count. "Gym" when none. */
export function sessionName(muscles: MuscleId[]): string {
  if (!muscles.length) return 'Gym';
  const names = muscles.map(muscleName);
  return names.length <= 3 ? names.join(' · ') : `${names.slice(0, 3).join(' · ')} +${names.length - 3}`;
}

/** The detail saved for a new or edited session; keeps whatever an older session had besides. */
export function detailFor(picked: MuscleId[], check: { effort: number | null; soreness: number | null; pain: boolean; painNote: string }, prev?: GymDetail | null): GymDetail {
  const muscles = musclesOf({ muscles: picked }); // the app's order, whatever order they were tapped in
  return {
    ...(prev ?? {}),
    name: muscles.length ? sessionName(muscles) : prev?.exercises.length ? prev.name : 'Gym',
    template: prev?.template ?? null,
    exercises: prev?.exercises ?? [],
    muscles,
    effort: check.effort,
    soreness: check.soreness,
    pain: check.pain,
    painNote: check.pain ? check.painNote.trim().slice(0, 200) : '',
  };
}

export const setsDone = (d: GymDetail) => d.exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0);

// ─── statistics ─────────────────────────────────────────────────────────────

export interface MuscleStat {
  id: MuscleId;
  name: string;
  /** Sessions that hit it: the last 7 days (today included), the last 28 days, and ever. */
  week: number;
  month: number;
  total: number;
  /** The most recent day it was hit, and how many days ago that was (0 = today). */
  last: string | null;
  daysAgo: number | null;
}
export interface GymStats {
  muscles: MuscleStat[];
  /** Sessions that recorded muscle groups, and those that predate it. */
  tagged: number;
  untagged: number;
}

/** Per-group counts from the sessions up to `today`. Pure; a session counts once per group however many it lists. */
export function gymStats(sessions: GymSession[], today: string): GymStats {
  const by = new Map<MuscleId, { week: number; month: number; total: number; last: string | null }>(MUSCLES.map((m) => [m.id, { week: 0, month: 0, total: 0, last: null }]));
  let tagged = 0;
  let untagged = 0;
  for (const s of sessions) {
    if (s.entry.date > today) continue;
    const ms = musclesOf(s.detail);
    if (!ms.length) {
      untagged++;
      continue;
    }
    tagged++;
    const ago = dayCount(s.entry.date, today) - 1;
    for (const id of ms) {
      const v = by.get(id)!;
      v.total++;
      if (ago < 7) v.week++;
      if (ago < 28) v.month++;
      if (!v.last || s.entry.date > v.last) v.last = s.entry.date;
    }
  }
  return {
    tagged,
    untagged,
    muscles: MUSCLES.map((m) => {
      const v = by.get(m.id)!;
      return { id: m.id, name: m.name, ...v, daysAgo: v.last ? dayCount(v.last, today) - 1 : null };
    }),
  };
}

/** Groups not hit for a week or more, or never, once there is any muscle data at all; longest-neglected first. */
export function overdue(stats: GymStats, days = 7): MuscleStat[] {
  if (!stats.tagged) return [];
  return stats.muscles
    .filter((m) => m.daysAgo === null || m.daysAgo >= days)
    .sort((a, b) => (b.daysAgo ?? 9999) - (a.daysAgo ?? 9999));
}
