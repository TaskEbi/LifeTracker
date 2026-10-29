/**
 * Training plans: the user's marathon build and gym split. Plan content is fixed in code
 * (src/domain/plans); what's stored is only the choice and dates, in lt_prefs 'plans'.
 */
import { isDate, weekStart } from '../log/dates';

export interface MarathonPlanPref {
  /** Monday of week 1. */
  start: string;
  /** Goal finish, h:mm:ss. */
  goal: string;
  /** A recent half-marathon time (h:mm:ss), for the prediction shown next to the goal. */
  half: string | null;
}
export interface GymPlanPref {
  /** Stored gym_template ids made from the plan, by plan workout id. */
  templates: Record<string, string>;
  /** Monday of the week the plan was taken up (numbers its weeks when there's no marathon plan). */
  since: string | null;
}
export interface PlansState {
  marathon: MarathonPlanPref | null;
  gym: GymPlanPref | null;
}
export const DEFAULT_PLANS: PlansState = { marathon: null, gym: null };

export const DEFAULT_START = '2026-11-02';
export const DEFAULT_GOAL = '4:10:00';
export const DEFAULT_HALF = '1:56:00';
/** Goal times the plan's paces make sense for. */
export const GOAL_MIN = 2 * 3600 + 45 * 60;
export const GOAL_MAX = 6 * 3600;
export const PLAN_WORKOUT_IDS = ['upper-a', 'upper-b', 'athletic'] as const;
export type PlanWorkoutId = (typeof PLAN_WORKOUT_IDS)[number];

/** "4:10:00", "4:10" (h:mm) or "1:56:30" → seconds; null if it isn't a time. */
export function parseHms(s: unknown): number | null {
  if (typeof s !== 'string') return null;
  const m = /^\s*(\d{1,2}):([0-5]\d)(?::([0-5]\d))?\s*$/.exec(s);
  if (!m) return null;
  return +m[1] * 3600 + +m[2] * 60 + (m[3] ? +m[3] : 0);
}
export function fmtHms(sec: number): string {
  const s = Math.round(sec);
  return `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const goalOk = (s: unknown) => {
  const t = parseHms(s);
  return t != null && t >= GOAL_MIN && t <= GOAL_MAX;
};
const halfOk = (s: unknown) => {
  const t = parseHms(s);
  return t != null && t >= 3600 && t <= 3 * 3600 + 30 * 60;
};

/** Whatever is stored (another device, an old version, junk) → a valid plans state. */
export function normalisePlans(raw: unknown): PlansState {
  if (!obj(raw)) return DEFAULT_PLANS;
  let marathon: MarathonPlanPref | null = null;
  if (obj(raw.marathon) && isDate(raw.marathon.start)) {
    const m = raw.marathon;
    marathon = {
      // A start that isn't a Monday snaps back to its week's Monday.
      start: weekStart(m.start as string),
      goal: goalOk(m.goal) ? fmtHms(parseHms(m.goal)!) : DEFAULT_GOAL,
      half: m.half === null ? null : halfOk(m.half) ? fmtHms(parseHms(m.half)!) : null,
    };
  }
  let gym: GymPlanPref | null = null;
  if (obj(raw.gym)) {
    const templates: Record<string, string> = {};
    const t = obj(raw.gym.templates) ? raw.gym.templates : {};
    for (const id of PLAN_WORKOUT_IDS) {
      const v = t[id];
      if (typeof v === 'string' && v.length > 0 && v.length <= 64) templates[id] = v;
    }
    gym = { templates, since: isDate(raw.gym.since) ? weekStart(raw.gym.since as string) : null };
  }
  return marathon === null && gym === null ? DEFAULT_PLANS : { marathon, gym };
}
