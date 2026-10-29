/**
 * The training plans in the app: reading the plan status from the records, starting/changing a
 * plan (lt_prefs 'plans'), and taking up the gym plan (three ordinary gym_template records).
 */
import { useMemo } from 'react';
import { ltToday, prefValue, progressInput, sectionEntries, sectionRecords, setPref, usePlans, useToday } from '../../data/lt';
import { saveRecord } from '../../data/records';
import { data } from '../../data/store';
import { occurrences } from '../../domain/calendar/occurrences';
import { addDays, weekStart } from '../../domain/log/dates';
import { adjustExercises, carriedWeights, missingPlanWorkouts, PLAN_WORKOUTS, templateValue } from '../../domain/plans/gym';
import { pacesFor, type LoggedGym, type MarathonStatus, type PlanRun, type PlanSession, type SessionState } from '../../domain/plans/marathon';
import { gymPlanWeek, marathonOf, trainingLogs, type GymPlanWeek } from '../../domain/plans/progress';
import { DEFAULT_GOAL, DEFAULT_HALF, DEFAULT_START, normalisePlans, type MarathonPlanPref, type PlansState } from '../../domain/plans/types';
import { useStore } from '../../lib/createStore';
import type { GymDetail, Template } from '../gym/model';

const getPlans = (): PlansState => normalisePlans(prefValue(data.get(), 'plans'));

export interface PlanView {
  plans: PlansState;
  today: string;
  marathon: MarathonStatus | null;
  gym: GymPlanWeek | null;
  /** Days with volleyball/tennis this week and next (calendar or logged). */
  courtDays: Set<string>;
  gyms: LoggedGym[];
}

/** Everything the plan screens need, derived from the records. */
export function usePlanView(): PlanView {
  const today = useToday();
  const st = useStore(data, (s) => s);
  const plans = usePlans();
  return useMemo(() => {
    const input = progressInput(st, today);
    const marathon = marathonOf(input, plans);
    const { gyms } = trainingLogs(input);
    const gym = plans.gym || plans.marathon ? gymPlanWeek(plans, weekStart(today), gyms, today) : null;
    const from = weekStart(today);
    const courtDays = new Set<string>();
    for (const o of occurrences(st.lt_events.values(), from, addDays(from, 13)))
      if (!o.cancelled && o.event.section === 'sports' && /volley|tennis|court/i.test(`${o.event.title} ${String(o.event.data?.sport ?? '')}`)) courtDays.add(o.date);
    for (const s of sectionEntries<{ sport?: string }>(st, 'sports')) if (s.entry.date >= from && /volleyball|tennis/.test(s.detail?.sport ?? '')) courtDays.add(s.entry.date);
    return { plans, today, marathon, gym, courtDays, gyms };
  }, [st, today, plans]);
}

/** The first Monday on or after a date. */
export const nextMonday = (d: string) => (weekStart(d) === d ? d : addDays(weekStart(d), 7));
/** Default start: 2 Nov 2026, or the next Monday once that has passed. */
export const defaultStart = (today: string) => (today <= DEFAULT_START ? DEFAULT_START : nextMonday(today));

export function startMarathon(pref: Partial<MarathonPlanPref> = {}) {
  const p = getPlans();
  const today = ltToday();
  setPref('plans', { ...p, marathon: { start: pref.start ?? defaultStart(today), goal: pref.goal ?? DEFAULT_GOAL, half: pref.half === undefined ? DEFAULT_HALF : pref.half } });
}
export function updateMarathon(patch: Partial<MarathonPlanPref>) {
  const p = getPlans();
  if (!p.marathon) return;
  setPref('plans', { ...p, marathon: { ...p.marathon, ...patch } });
}
export function stopMarathon() {
  setPref('plans', { ...getPlans(), marathon: null });
}

/**
 * "Use my gym plan": the three workouts as ordinary gym templates, ids remembered in the plan.
 * Safe to tap twice or on a second device: stored ids that still exist are kept, and a template
 * already made from the plan (marked `plan`) is reused instead of made again.
 */
export function adoptGymPlan(): { created: number } {
  const st = data.get();
  const p = getPlans();
  const records = sectionRecords(st, 'gym', 'gym_template');
  const live = new Set(records.map((r) => r.id));
  const templates = { ...(p.gym?.templates ?? {}) };
  let created = 0;
  for (const w of missingPlanWorkouts(templates, live)) {
    const existing = records.find((r) => (r.data as { plan?: string }).plan === w.id);
    templates[w.id] = existing ? existing.id : (created++, saveRecord('gym', 'gym_template', templateValue(w)).id);
  }
  setPref('plans', { ...p, gym: { templates, since: p.gym?.since ?? weekStart(ltToday()) } });
  return { created };
}
export function stopGymPlan() {
  setPref('plans', { ...getPlans(), gym: null });
}

/** The plan workout a template was made for, if any. */
export function planWorkoutOf(plans: PlansState, templateId: string) {
  const id = Object.entries(plans.gym?.templates ?? {}).find(([, t]) => t === templateId)?.[0];
  return id ? PLAN_WORKOUTS.find((w) => w.id === id) : undefined;
}

/**
 * Starting a plan template: the last session's weights carry forward, and in the marathon taper
 * the sets are trimmed as planned. Other templates start as they are.
 */
export function planTemplateForToday(t: Template): Template {
  const plans = getPlans();
  const w = planWorkoutOf(plans, t.id);
  if (!w) return t;
  const sessions = sectionEntries<GymDetail>(data.get(), 'gym')
    .filter((s) => s.detail && Array.isArray(s.detail.exercises))
    .map((s) => ({ date: s.entry.date, template: s.detail!.template, exercises: s.detail!.exercises }));
  const today = ltToday();
  const week = gymPlanWeek(plans, weekStart(today), [], today);
  const adj = week.sessions.find((s) => s.workout === w.id)?.adjust;
  return { ...t, exercises: adjustExercises(carriedWeights(t.exercises, sessions, t.id), adj) };
}

/** Minutes a planned run should take, for prefilling the log sheet. */
export function runMinutes(run: PlanRun, goal: string): number {
  const p = pacesFor(goal);
  const pace = run.type === 'race' ? p.mp : run.type === 'easy' || run.type === 'long' || run.type === 'shakeout' || run.type === 'strides' ? (p.easy[0] + p.easy[1]) / 2 : (p.easy[0] + p.mp) / 2;
  return Math.max(5, Math.round((run.km * pace) / 60 / 5) * 5);
}

/** Planned sessions on one day (for the calendar's day agenda): derived, read-only. */
export function usePlanDay(date: string): { s: PlanSession; state: SessionState }[] {
  const v = usePlanView();
  return useMemo(() => {
    const out: { s: PlanSession; state: SessionState }[] = [];
    const m = v.marathon;
    if (m) for (const w of m.weeks) for (const s of [...w.runs, ...w.gym]) if (s.date === date) out.push({ s, state: m.sessions.get(s.id)! });
    if (v.plans.gym && !out.some((x) => x.s.kind === 'gym')) {
      const g = gymPlanWeek(v.plans, weekStart(date), v.gyms, v.today);
      if (!m || g.of === 0) for (const s of g.sessions) if (s.date === date) out.push({ s, state: g.states.get(s.id)! });
    }
    return out;
  }, [v, date]);
}
