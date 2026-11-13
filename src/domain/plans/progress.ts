/**
 * The marathon plan against the records: what's logged (runs) pulled out of a ProgressInput, and
 * plan moments between two states (a planned run done, a plan week or phase finished). All
 * derived; nothing stored.
 */
import type { ProgressInput } from '../progress/engine';
import type { Moment } from '../progress/moments';
import { marathonStatus, PHASES, PLAN_WEEKS, type LoggedRun, type MarathonStatus } from './marathon';
import type { PlansState } from './types';

/** Runs (sports entries with sport 'running'), oldest first. */
export function trainingLogs(input: Pick<ProgressInput, 'entries' | 'details' | 'topicSection'>): { runs: LoggedRun[] } {
  const runs: LoggedRun[] = [];
  for (const e of input.entries) {
    if (e.deleted_at) continue;
    const det = input.details.get(e.id);
    const d = det && !det.deleted_at ? det : null;
    const section = d ? d.section : input.topicSection.get(e.topic_id);
    const data = (d?.data ?? null) as Record<string, unknown> | null;
    if (section === 'sports' && data?.sport === 'running') {
      const km = typeof data.km === 'number' && Number.isFinite(data.km) && data.km > 0 ? data.km : null;
      runs.push({ id: e.id, date: e.date, km });
    }
  }
  return { runs: runs.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id)) };
}

/** The marathon plan's status for a ProgressInput (null when no plan is started). */
export function marathonOf(input: ProgressInput, plans: PlansState | undefined = input.plans): MarathonStatus | null {
  if (!plans?.marathon) return null;
  return marathonStatus(plans.marathon, trainingLogs(input).runs, input.today);
}

/**
 * What changed for the plans between two states. Both are judged with the plan settings of
 * `after`, so changing the plan itself never fires anything; a moment fires only when a session,
 * week or phase goes from not done to done.
 */
export function planMoments(before: ProgressInput, after: ProgressInput): Moment[] {
  const plans = after.plans;
  if (!plans?.marathon) return [];
  const out: Moment[] = [];
  const a = trainingLogs(after);
  const b = trainingLogs(before);
  const today = after.today;

  if (plans.marathon) {
    const s0 = marathonStatus(plans.marathon, b.runs, today);
    const s1 = marathonStatus(plans.marathon, a.runs, today);
    for (const w of s1.weeks)
      for (const r of w.runs) if (s1.sessions.get(r.id)!.status === 'done' && s0.sessions.get(r.id)!.status !== 'done') out.push({ type: 'plan-session', plan: 'marathon', title: r.title, week: w.n });
    for (const [n, w] of s1.week) if (w.status === 'done' && s0.week.get(n)!.status !== 'done') out.push({ type: 'plan-week', plan: 'marathon', week: n, of: PLAN_WEEKS });
    s1.phases.forEach((p, i) => {
      if (p.status === 'cleared' && s0.phases[i].status !== 'cleared') out.push({ type: 'plan-phase', phase: p.phase.name, next: PHASES[i + 1]?.name ?? null });
    });
  }
  return out;
}
