/**
 * Plans against the records: what's logged (runs, gym sessions) pulled out of a ProgressInput,
 * the gym plan's week, and plan moments between two states (a planned session done, a plan week
 * or phase finished). All derived; nothing stored.
 */
import { addDays, dayCount, weekStart } from '../log/dates';
import type { ProgressInput } from '../progress/engine';
import type { Moment } from '../progress/moments';
import { PLAN_WORKOUTS } from './gym';
import { marathonStatus, matchGym, PHASES, PLAN_WEEKS, planWeeks, raceDate, weekOf, weekStatus, type LoggedGym, type LoggedRun, type MarathonStatus, type PlanGym, type SessionState, type WeekStatus } from './marathon';
import type { PlansState } from './types';

/** Runs (sports entries with sport 'running') and finished gym sessions, oldest first. */
export function trainingLogs(input: Pick<ProgressInput, 'entries' | 'details' | 'topicSection'>): { runs: LoggedRun[]; gyms: LoggedGym[] } {
  const runs: LoggedRun[] = [];
  const gyms: LoggedGym[] = [];
  for (const e of input.entries) {
    if (e.deleted_at) continue;
    const det = input.details.get(e.id);
    const d = det && !det.deleted_at ? det : null;
    const section = d ? d.section : input.topicSection.get(e.topic_id);
    const data = (d?.data ?? null) as Record<string, unknown> | null;
    if (section === 'sports' && data?.sport === 'running') {
      const km = typeof data.km === 'number' && Number.isFinite(data.km) && data.km > 0 ? data.km : null;
      runs.push({ id: e.id, date: e.date, km });
    } else if (section === 'gym' && data && typeof data.name === 'string' && Array.isArray(data.exercises)) {
      gyms.push({ id: e.id, date: e.date, template: typeof data.template === 'string' ? data.template : null, name: data.name });
    }
  }
  const by = (a: { date: string; id: string }, b: { date: string; id: string }) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id);
  return { runs: runs.sort(by), gyms: gyms.sort(by) };
}

export interface GymPlanWeek {
  monday: string;
  sessions: PlanGym[];
  /** Week number: the marathon plan's when inside it, else weeks since the gym plan was taken up. */
  week: number;
  /** 24 inside the marathon plan; 0 = open-ended (gym plan on its own). */
  of: number;
  states: Map<string, SessionState>;
  status: WeekStatus;
  done: number;
}

/** The gym plan's workouts for the week starting `monday` (taper-adjusted inside the marathon plan). */
export function gymPlanWeek(plans: PlansState, monday: string, gyms: LoggedGym[], today: string): GymPlanWeek {
  const m = plans.marathon;
  const n = m ? weekOf(m.start, monday) : null;
  let sessions: PlanGym[];
  let week: number;
  let of: number;
  if (m && n) {
    sessions = planWeeks(m)[n - 1].gym;
    week = n;
    of = PLAN_WEEKS;
  } else {
    sessions = PLAN_WORKOUTS.map((w) => ({ kind: 'gym', id: `g@${monday}-${w.id}`, week: 0, day: w.day, date: addDays(monday, w.day), workout: w.id, title: w.name }));
    const since = plans.gym?.since;
    week = since && monday >= since ? Math.floor((dayCount(since, monday) - 1) / 7) + 1 : 1;
    of = 0;
  }
  const hits = matchGym(monday, sessions, gyms, plans.gym?.templates ?? {});
  const states = new Map<string, SessionState>();
  for (const s of sessions) {
    const h = hits.get(s.id);
    states.set(s.id, h ? { status: 'done', by: { id: h.id, date: h.date } } : { status: s.date < today ? 'missed' : s.date === today ? 'today' : 'upcoming' });
  }
  const done = sessions.filter((s) => states.get(s.id)!.status === 'done').length;
  return { monday, sessions, week, of, states, status: weekStatus(monday, done, sessions.length, today), done };
}

/** The marathon plan's status for a ProgressInput (null when no plan is started). */
export function marathonOf(input: ProgressInput, plans: PlansState | undefined = input.plans): MarathonStatus | null {
  if (!plans?.marathon) return null;
  const { runs, gyms } = trainingLogs(input);
  return marathonStatus(plans.marathon, runs, gyms, plans.gym?.templates ?? {}, input.today);
}

/** Mondays whose gym plan week is worth comparing: the marathon plan's weeks, else since the plan was taken up (≤ 2 years). */
function gymMondays(plans: PlansState, today: string): string[] {
  const out = new Set<string>();
  if (plans.marathon) for (let i = 0; i < PLAN_WEEKS; i++) out.add(addDays(plans.marathon.start, 7 * i));
  const now = weekStart(today);
  const since = plans.gym?.since && plans.gym.since <= now ? plans.gym.since : now;
  for (let w = since, i = 0; w <= now && i < 104; w = addDays(w, 7), i++) out.add(w);
  if (plans.marathon && raceDate(plans.marathon.start) < now) out.add(now);
  return [...out];
}

/**
 * What changed for the plans between two states. Both are judged with the plan settings of
 * `after`, so changing the plan itself never fires anything; a moment fires only when a session,
 * week or phase goes from not done to done.
 */
export function planMoments(before: ProgressInput, after: ProgressInput): Moment[] {
  const plans = after.plans;
  if (!plans || (!plans.marathon && !plans.gym)) return [];
  const out: Moment[] = [];
  const a = trainingLogs(after);
  const b = trainingLogs(before);
  const templates = plans.gym?.templates ?? {};
  const today = after.today;

  if (plans.marathon) {
    const s0 = marathonStatus(plans.marathon, b.runs, b.gyms, templates, today);
    const s1 = marathonStatus(plans.marathon, a.runs, a.gyms, templates, today);
    for (const w of s1.weeks)
      for (const r of w.runs) if (s1.sessions.get(r.id)!.status === 'done' && s0.sessions.get(r.id)!.status !== 'done') out.push({ type: 'plan-session', plan: 'marathon', title: r.title, week: w.n });
    for (const [n, w] of s1.week) if (w.status === 'done' && s0.week.get(n)!.status !== 'done') out.push({ type: 'plan-week', plan: 'marathon', week: n, of: PLAN_WEEKS });
    s1.phases.forEach((p, i) => {
      if (p.status === 'cleared' && s0.phases[i].status !== 'cleared') out.push({ type: 'plan-phase', phase: p.phase.name, next: PHASES[i + 1]?.name ?? null });
    });
  }
  if (plans.gym) {
    for (const monday of gymMondays(plans, today)) {
      const w0 = gymPlanWeek(plans, monday, b.gyms, today);
      const w1 = gymPlanWeek(plans, monday, a.gyms, today);
      for (const s of w1.sessions) if (w1.states.get(s.id)!.status === 'done' && w0.states.get(s.id)!.status !== 'done') out.push({ type: 'plan-session', plan: 'gym', title: s.title, week: w1.week });
      if (w1.status === 'done' && w0.status !== 'done') out.push({ type: 'plan-week', plan: 'gym', week: w1.week, of: w1.of });
    }
  }
  return out;
}
