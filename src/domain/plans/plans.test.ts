import { describe, expect, it } from 'vitest';
import type { LogEntry, LtDetail, SectionId } from '../../data/types';
import { addDays, weekdayIndex } from '../log/dates';
import { DEFAULT_SLEEP, DEFAULT_TARGETS } from '../prefs';
import type { ProgressInput } from '../progress/engine';
import { adjustExercises, carriedWeights, missingPlanWorkouts, PLAN_WORKOUTS } from './gym';
import { courtNotes, fmtPace, marathonStatus, matchRuns, pacesFor, PHASES, PLAN_WEEKS, planWeeks, raceDate, riegel, STEP_BACK, weekOf, type LoggedRun } from './marathon';
import { gymPlanWeek, planMoments } from './progress';
import { DEFAULT_GOAL, DEFAULT_START, normalisePlans, type PlansState } from './types';

const START = DEFAULT_START;
const PREF = { start: START, goal: DEFAULT_GOAL, half: null };
const weeks = planWeeks(PREF);

describe('marathon plan shape', () => {
  it('is 24 weeks with the race on Sunday 18 Apr 2027 for a 2 Nov 2026 start', () => {
    expect(weeks).toHaveLength(PLAN_WEEKS);
    expect(raceDate(START)).toBe('2027-04-18');
    const race = weeks[23].runs.find((r) => r.type === 'race')!;
    expect(race.date).toBe('2027-04-18');
    expect(weekdayIndex(race.date)).toBe(6);
    expect(weekOf(START, '2027-04-18')).toBe(24);
    expect(weekOf(START, '2026-11-01')).toBeNull();
  });

  it('builds weekly km within ~10% a week (more only after a step-back), peaking at 64–67', () => {
    const km = weeks.map((w) => w.km);
    expect(km.slice(0, 3)).toEqual([33, 36, 38]);
    for (let i = 1; i < 21; i++) {
      const n = i + 1;
      if (STEP_BACK.includes(n)) {
        expect(km[i]).toBeLessThan(km[i - 1] * 0.85);
        continue;
      }
      const ref = STEP_BACK.includes(n - 1) ? km[i - 2] : km[i - 1];
      expect(km[i], `week ${n}`).toBeLessThanOrEqual(ref * 1.11);
    }
    const peak = Math.max(...km.slice(0, 21));
    expect(peak).toBeGreaterThanOrEqual(64);
    expect(peak).toBeLessThanOrEqual(67);
    // three-week taper, each week less than the one before (race week's total includes the race)
    expect(km[21]).toBeLessThan(km[20]);
    expect(km[22]).toBeLessThan(km[21]);
    expect(km[23] - 42.195).toBeLessThan(km[22]);
  });

  it('has the longest long runs (30–32 km) in weeks 17, 19 and 21, and a half tune-up in week 12', () => {
    const long = (n: number) => weeks[n - 1].runs.find((r) => r.long)!;
    expect(long(17).km).toBe(32);
    expect(long(19).km).toBe(32);
    expect(long(19).title).toMatch(/last 10 @MP/);
    expect(long(21).km).toBe(30);
    expect(Math.max(...weeks.slice(0, 23).map((w) => long(w.n).km))).toBe(32);
    expect(long(12).type).toBe('tuneup');
    expect(weeks.filter((w) => w.stepBack).map((w) => w.n)).toEqual([4, 8, 12, 16, 20]);
  });

  it('puts phases on the right weeks and keeps the gym out of the last two days', () => {
    expect(weeks.map((w) => w.phase.id).join(',')).toBe(['base', 'base', 'base', 'base', 'base', 'base', 'build', 'build', 'build', 'build', 'build', 'build', 'specific', 'specific', 'specific', 'specific', 'specific', 'specific', 'specific', 'peak', 'peak', 'taper', 'taper', 'taper'].join(','));
    expect(PHASES.reduce((a, p) => a + p.to - p.from + 1, 0)).toBe(24);
    expect(weeks[23].gym.every((g) => g.day <= 3 && g.adjust?.maxSets === 2)).toBe(true);
    expect(weeks[23].gym.some((g) => g.workout === 'athletic')).toBe(false);
    expect(weeks[21].gym.find((g) => g.workout === 'athletic')!.adjust?.half).toBe(true);
    expect(weeks[5].gym.map((g) => g.day)).toEqual([0, 2, 3]);
    // optional Friday runs only from week 9
    expect(weeks.slice(0, 8).some((w) => w.runs.some((r) => r.day === 4))).toBe(false);
    expect(weeks[8].runs.find((r) => r.day === 4)!.optional).toBe(true);
  });
});

describe('paces', () => {
  it('match the 4:10 targets', () => {
    const p = pacesFor('4:10:00');
    expect(fmtPace(p.mp)).toBe('5:55');
    expect([fmtPace(p.easy[0]), fmtPace(p.easy[1])]).toEqual(['6:30', '7:10']);
    expect([fmtPace(p.long[0]), fmtPace(p.long[1])]).toEqual(['6:40', '7:10']);
    expect([fmtPace(p.t[0]), fmtPace(p.t[1])]).toEqual(['5:15', '5:20']);
    expect(fmtPace(p.i)).toBe('4:55');
  });
  it('follow the goal, keeping the order easy > MP > T > I', () => {
    const fast = pacesFor('3:45:00');
    const slow = pacesFor('4:30:00');
    expect(fast.mp).toBeLessThan(slow.mp);
    for (const p of [fast, slow]) {
      expect(p.easy[0]).toBeGreaterThan(p.mp);
      expect(p.mp).toBeGreaterThan(p.hmp);
      expect(p.hmp).toBeGreaterThan(p.t[1]);
      expect(p.t[0]).toBeGreaterThan(p.i);
    }
    expect(planWeeks({ start: START, goal: '3:45:00' })[12].runs[0].desc).toContain(fmtPace(fast.t[0]));
  });
  it('predict about 4:02 from a 1:56 half (Riegel)', () => {
    const s = riegel(6960);
    expect(s).toBeGreaterThan(4 * 3600);
    expect(s).toBeLessThan(4 * 3600 + 3 * 60);
  });
});

describe('matching runs', () => {
  const w5 = weeks[4]; // Tue 10 intervals, Wed 7, Sat 7, Sun 18
  const d = (day: number) => addDays(w5.start, day);
  const run = (id: string, day: number, km: number | null): LoggedRun => ({ id, date: d(day), km });

  it('matches same-day runs first', () => {
    const m = matchRuns(w5, [run('a', 1, 10), run('b', 2, 7), run('c', 5, 7), run('d', 6, 18)]);
    expect(m.get('m5-1')!.id).toBe('a');
    expect(m.get('m5-2')!.id).toBe('b');
    expect(m.get('m5-5')!.id).toBe('c');
    expect(m.get('m5-6')!.id).toBe('d');
  });
  it('matches a moved run to the nearest planned day in the week', () => {
    const m = matchRuns(w5, [run('mon', 0, 9), run('thu', 3, 7)]);
    expect(m.get('m5-1')!.id).toBe('mon');
    expect(m.get('m5-2')!.id).toBe('thu');
    expect(m.has('m5-5')).toBe(false);
  });
  it('gives the long run the week’s longest run only if it is at least 75% of the plan', () => {
    expect(matchRuns(w5, [run('sat', 5, 14)]).get('m5-6')!.id).toBe('sat'); // 14 ≥ 13.5
    const short = matchRuns(w5, [run('sun', 6, 13)]); // 13 < 13.5
    expect(short.has('m5-6')).toBe(false);
    expect(short.get('m5-5')!.id).toBe('sun'); // still counts as the Saturday run
  });
  it('ignores runs from other weeks and much-too-short runs on other days', () => {
    const m = matchRuns(w5, [{ id: 'x', date: addDays(w5.start, -1), km: 18 }, run('y', 0, 2)]);
    expect(m.size).toBe(0);
  });
});

describe('week and phase status', () => {
  const runsFor = (n: number, skip: number[] = []): LoggedRun[] => weeks[n - 1].runs.filter((r) => !r.optional && !skip.includes(r.day)).map((r) => ({ id: r.id + 'x', date: r.date, km: r.km }));

  it('is done / partial / missed / now / upcoming', () => {
    const today = addDays(weeks[2].start, 2); // Wed of week 3
    const logs = [...runsFor(1), ...runsFor(2, [6, 5])];
    const s = marathonStatus(PREF, logs, [], {}, today);
    expect(s.current).toBe(3);
    expect(s.week.get(1)!.status).toBe('done');
    expect(s.week.get(2)!.status).toBe('partial');
    expect(s.week.get(3)!.status).toBe('now');
    expect(s.week.get(4)!.status).toBe('upcoming');
    expect(marathonStatus(PREF, [], [], {}, today).week.get(1)!.status).toBe('missed');
    expect(s.sessions.get('m3-1')!.status).toBe('missed');
    expect(s.sessions.get('m3-2')!.status).toBe('today');
  });

  it('clears a phase when its last long run is done and ≥ 80% of its runs are', () => {
    const today = addDays(weeks[5].start, 6);
    const all = [1, 2, 3, 4, 5, 6].flatMap((n) => runsFor(n));
    expect(marathonStatus(PREF, all, [], {}, today).phases[0].status).toBe('cleared');
    // 24 runs in base; dropping 4 midweek runs leaves 20/24 = 83%
    const some = [1, 2, 3, 4, 5, 6].flatMap((n) => runsFor(n, n <= 4 ? [2] : []));
    expect(marathonStatus(PREF, some, [], {}, today).phases[0].status).toBe('cleared');
    const noLast = all.filter((r) => r.date !== weeks[5].runs.find((x) => x.long)!.date);
    expect(marathonStatus(PREF, noLast, [], {}, today).phases[0].status).toBe('active');
    expect(marathonStatus(PREF, noLast, [], {}, addDays(today, 1)).phases[0].status).toBe('over');
  });
});

// ─── moments, through ProgressInput ──────────────────────────────────────────

let n = 0;
const TOPICS: [string, SectionId][] = [['topic-sports', 'sports'], ['topic-gym', 'gym']];
function entry(section: 'sports' | 'gym', date: string, data: Record<string, unknown>, minutes = 40): [LogEntry, LtDetail] {
  const id = `e${++n}`;
  const t = `${date}T10:00:00Z`;
  return [
    { id, date, topic_id: `topic-${section}`, subcategory_id: null, minutes, note: null, created_at: t, updated_at: t, deleted_at: null },
    { id, section, data, created_at: t, updated_at: t, deleted_at: null },
  ];
}
function input(rows: [LogEntry, LtDetail][], plans: PlansState, today: string): ProgressInput {
  return {
    today, entries: rows.map((r) => r[0]), topicSection: new Map(TOPICS), details: new Map(rows.map((r) => [r[0].id, r[1]])), metrics: [], nights: new Map(), todos: [],
    dayOf: (iso) => iso.slice(0, 10), restDays: [], cabinetDays: [], targets: DEFAULT_TARGETS, sleep: DEFAULT_SLEEP, plans,
  };
}

describe('planMoments', () => {
  const plans: PlansState = { marathon: PREF, gym: { templates: { 'upper-a': 'tpl-a', 'upper-b': 'tpl-b', athletic: 'tpl-c' }, since: START } };
  const w1 = weeks[0];
  const runRow = (day: number, km: number) => entry('sports', addDays(w1.start, day), { sport: 'running', km });

  it('fires plan-session once when a planned run becomes done, and nothing on a repeat', () => {
    const today = addDays(w1.start, 1);
    const tue = runRow(1, 7);
    const m = planMoments(input([], plans, today), input([tue], plans, today));
    expect(m).toEqual([{ type: 'plan-session', plan: 'marathon', title: w1.runs[0].title, week: 1 }]);
    expect(planMoments(input([tue], plans, today), input([tue], plans, today))).toEqual([]);
    // an extra run that matches nothing new: no moment
    expect(planMoments(input([tue], plans, today), input([tue, runRow(1, 2)], plans, today))).toEqual([]);
  });

  it('fires plan-week when the last required run of the week is logged', () => {
    const today = addDays(w1.start, 6);
    const three = [runRow(1, 7), runRow(2, 6), runRow(5, 6)];
    const m = planMoments(input(three, plans, today), input([...three, runRow(6, 14)], plans, today));
    expect(m.filter((x) => x.type === 'plan-week')).toEqual([{ type: 'plan-week', plan: 'marathon', week: 1, of: 24 }]);
  });

  it('fires plan-phase when a phase clears', () => {
    const today = addDays(weeks[5].start, 6);
    const base = weeks.slice(0, 6).flatMap((w) => w.runs.map((r) => entry('sports', r.date, { sport: 'running', km: r.km })));
    const last = base.pop()!;
    const m = planMoments(input(base, plans, today), input([...base, last], plans, today));
    expect(m.find((x) => x.type === 'plan-phase')).toEqual({ type: 'plan-phase', phase: 'Base', next: 'Build' });
  });

  it('fires gym plan sessions for sessions from the plan template; changing the plan fires nothing', () => {
    const today = addDays(w1.start, 0);
    const gym = entry('gym', today, { name: 'Upper A · Strength', template: 'tpl-a', exercises: [] });
    expect(planMoments(input([], plans, today), input([gym], plans, today))).toEqual([{ type: 'plan-session', plan: 'gym', title: 'Upper A · Strength', week: 1 }]);
    const other = { ...plans, marathon: { ...PREF, start: addDays(START, 7) } };
    expect(planMoments(input([gym], plans, today), input([gym], other, today))).toEqual([]);
    expect(planMoments(input([], { marathon: null, gym: null }, today), input([gym], { marathon: null, gym: null }, today))).toEqual([]);
  });
});

describe('gym plan', () => {
  it('has the three workouts on Mon, Wed, Thu with little lower-body load', () => {
    expect(PLAN_WORKOUTS.map((w) => [w.id, w.day])).toEqual([['upper-a', 0], ['athletic', 2], ['upper-b', 3]]);
    const a = PLAN_WORKOUTS.find((w) => w.id === 'upper-a')!;
    expect(a.exercises[0]).toMatchObject({ name: 'Bench press', sets: 4, reps: 5, rest: 150 });
    expect(PLAN_WORKOUTS.flatMap((w) => w.exercises).some((e) => /squat|deadlift|lunge|leg press/i.test(e.name))).toBe(false);
  });
  it('only creates what is missing (idempotent)', () => {
    expect(missingPlanWorkouts(undefined, new Set())).toHaveLength(3);
    const stored = { 'upper-a': 'a', 'upper-b': 'b', athletic: 'c' };
    expect(missingPlanWorkouts(stored, new Set(['a', 'b', 'c']))).toHaveLength(0);
    expect(missingPlanWorkouts(stored, new Set(['a', 'c'])).map((w) => w.id)).toEqual(['upper-b']);
  });
  it('halves Athletic and caps sets for the taper', () => {
    const ath = PLAN_WORKOUTS.find((w) => w.id === 'athletic')!.exercises;
    const half = adjustExercises(ath, { half: true, note: '' });
    expect(half.some((e) => /box jump/i.test(e.name))).toBe(false);
    expect(half.find((e) => e.name === 'Pogo hops')!.sets).toBe(2);
    expect(adjustExercises(PLAN_WORKOUTS[0].exercises, { maxSets: 2, note: '' }).every((e) => e.sets <= 2)).toBe(true);
  });
  it('carries the last session’s weights forward', () => {
    const ex = PLAN_WORKOUTS[0].exercises;
    const out = carriedWeights(ex, [
      { date: '2026-11-02', template: 'tpl', exercises: [{ name: 'Bench press', sets: [{ weight: 60, done: true }, { weight: 62.5, done: true }] }] },
      { date: '2026-11-09', template: 'tpl', exercises: [{ name: 'Bench press', sets: [{ weight: 65, done: true }, { weight: 70, done: false }] }] },
      { date: '2026-11-10', template: 'other', exercises: [{ name: 'Bench press', sets: [{ weight: 100, done: true }] }] },
    ], 'tpl');
    expect(out[0].weight).toBe(65);
    expect(out[1].weight).toBe(ex[1].weight);
  });
  it('numbers its own weeks without a marathon plan, and uses the plan’s inside it', () => {
    const alone: PlansState = { marathon: null, gym: { templates: {}, since: '2026-10-26' } };
    const w = gymPlanWeek(alone, '2026-11-09', [], '2026-11-10');
    expect([w.week, w.of, w.sessions.length]).toEqual([3, 0, 3]);
    const race = gymPlanWeek({ marathon: PREF, gym: alone.gym }, weeks[23].start, [], '2026-10-30');
    expect([race.week, race.of, race.sessions.length]).toEqual([24, 24, 2]);
  });
});

describe('court notes', () => {
  it('flags a quality run or Athletic on or the day before a court day', () => {
    const w = weeks[4];
    const notes = courtNotes([...w.runs, ...w.gym], new Set([addDays(w.start, 2)])); // court on Wed
    expect(notes.map((x) => x.id).sort()).toEqual(['g5-athletic', 'm5-1']);
  });
});

describe('normalisePlans', () => {
  it('rejects junk', () => {
    for (const j of [null, 1, 'x', [], { marathon: 5 }, { marathon: { start: 'soon' } }, { gym: [] }]) expect(normalisePlans(j)).toEqual({ marathon: null, gym: null });
  });
  it('keeps good values, snaps the start to Monday and fixes a bad goal', () => {
    const p = normalisePlans({ marathon: { start: '2026-11-04', goal: '9:99' }, gym: { templates: { 'upper-a': 'id1', bogus: 'x', athletic: 7 }, since: 'nope' } });
    expect(p.marathon).toEqual({ start: '2026-11-02', goal: '4:10:00', half: null });
    expect(p.gym).toEqual({ templates: { 'upper-a': 'id1' }, since: null });
    expect(normalisePlans({ marathon: { start: START, goal: '3:59', half: '1:56:00' } }).marathon).toEqual({ start: START, goal: '3:59:00', half: '1:56:00' });
    expect(normalisePlans({ marathon: { start: START, goal: '1:00:00' } }).marathon!.goal).toBe('4:10:00');
  });
});
