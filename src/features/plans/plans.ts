/**
 * The training plans in the app: reading the plan status from the records, starting/changing a
 * plan (lt_prefs 'plans').
 */
import { useMemo } from 'react';
import { ltToday, prefValue, progressInput, sectionEntries, setPref, usePlans, useToday } from '../../data/lt';
import { data } from '../../data/store';
import { occurrences } from '../../domain/calendar/occurrences';
import { addDays, weekStart } from '../../domain/log/dates';
import { pacesFor, type MarathonStatus, type PlanRun, type PlanSession, type SessionState } from '../../domain/plans/marathon';
import { marathonOf } from '../../domain/plans/progress';
import { DEFAULT_GOAL, DEFAULT_HALF, DEFAULT_START, normalisePlans, type MarathonPlanPref, type PlansState } from '../../domain/plans/types';
import { useStore } from '../../lib/createStore';

const getPlans = (): PlansState => normalisePlans(prefValue(data.get(), 'plans'));

export interface PlanView {
  plans: PlansState;
  today: string;
  marathon: MarathonStatus | null;
  /** Days with volleyball/tennis this week and next (calendar or logged). */
  courtDays: Set<string>;
}

/** Everything the plan screens need, derived from the records. */
export function usePlanView(): PlanView {
  const today = useToday();
  const st = useStore(data, (s) => s);
  const plans = usePlans();
  return useMemo(() => {
    const input = progressInput(st, today);
    const marathon = marathonOf(input, plans);
    const from = weekStart(today);
    const courtDays = new Set<string>();
    for (const o of occurrences(st.lt_events.values(), from, addDays(from, 13)))
      if (!o.cancelled && o.event.section === 'sports' && /volley|tennis|court/i.test(`${o.event.title} ${String(o.event.data?.sport ?? '')}`)) courtDays.add(o.date);
    for (const s of sectionEntries<{ sport?: string }>(st, 'sports')) if (s.entry.date >= from && /volleyball|tennis/.test(s.detail?.sport ?? '')) courtDays.add(s.entry.date);
    return { plans, today, marathon, courtDays };
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
    if (m) for (const w of m.weeks) for (const s of w.runs) if (s.date === date) out.push({ s, state: m.sessions.get(s.id)! });
    return out;
  }, [v, date]);
}
