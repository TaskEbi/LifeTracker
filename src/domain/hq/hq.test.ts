import { describe, expect, it } from 'vitest';
import type { LogDayMetric, LogEntry, LtDetail, SectionId } from '../../data/types';
import { DEFAULT_SLEEP, DEFAULT_TARGETS } from '../prefs';
import type { ProgressInput } from '../progress/engine';
import { dayFacts } from '../progress/quests';
import { comebacks, goodDayToWrite, notesFor, proofLines, roughSpells, roughToday, type Note } from './beacon';
import { FEELINGS, QUOTES, quotesFor, shuffled, wordsOfDay } from './quotes';
import { activeNiggles, legsHurt, loadGuard, recurring, type Niggle } from './body';
import { capsulePresets, compareSnapshots, onThisDay, type Snapshot } from './capsule';
import { scout, type ScoutGame } from './chessScout';
import { exchange } from './exchange';
import { masteryClocks, nextMilestones, runways, xpFromExtraMinutes, xpRate } from './forecast';
import { fmtWear, wearOf, type Gear, type WearEvent } from './gear';
import { hallOfRecords } from './hall';
import { experimentResult, fmtMetric, labRows, pearson, runLab, weekdayProfile, type Experiment } from './lab';
import { isBedtime, nextMoves, type MoveContext } from './nextMove';
import { calibration, isDue, type Prediction } from './oracle';
import { detectPitch, freqOfMidi, ladderStatus, logTempo, midiName, nearestNote, tapTempo, VIOLIN_STRINGS, type Ladder } from './pitch';
import { planWeekFor, reviewIsDue, reviewStreak, tapeFor, type Review } from './review';
import { appliesOn, chainOf, slotAt, type Ritual } from './rituals';
import { hourScore, parseForecast, runWindows, type HourForecast } from './runWindow';
import { describeIntent, hasIntents, parseScroll, takeDuration, type Intent } from './scroll';
import { shadowRace } from './shadow';
import { sleepBank, sleepNeed, tonight } from './sleepBank';
import { blankWords, cardOf, clozeOf, deckStats, freshSrs, hasBlank, intervalLabel, leaks, NEW_PER_DAY, reviewQueue, schedule, tappableWords, type Card } from './srs';
import { addDays } from '../log/dates';

const T = '2026-11-04'; // a Wednesday
let n = 0;
const TOPICS: Record<string, SectionId> = { violin: 'violin', study: 'study', coding: 'coding', sports: 'sports', gym: 'gym', reading: 'reading', future: 'future', chess: 'chess' };
const entry = (date: string, minutes: number, topic = 'violin', note: string | null = null): LogEntry => ({
  id: `e${++n}`, date, topic_id: topic, subcategory_id: null, minutes, note,
  created_at: `${date}T10:00:00Z`, updated_at: `${date}T10:00:00Z`, deleted_at: null,
});
const metric = (date: string, m: LogDayMetric['metric'], minutes: number): LogDayMetric => ({ id: `${m}:${date}`, date, metric: m, minutes, created_at: date, updated_at: date, deleted_at: null });

function input(p: Partial<ProgressInput> = {}): ProgressInput {
  return {
    today: T, entries: [], topicSection: new Map(Object.entries(TOPICS)), details: new Map(), metrics: [], nights: new Map(), todos: [],
    dayOf: (iso) => iso.slice(0, 10), restDays: [], cabinetDays: [], targets: DEFAULT_TARGETS, sleep: DEFAULT_SLEEP, ...p,
  };
}
const run = (date: string, km: number, minutes: number): { e: LogEntry; d: LtDetail } => {
  const e = entry(date, minutes, 'sports');
  return { e, d: { id: e.id, section: 'sports', data: { sport: 'running', km }, created_at: date, updated_at: date, deleted_at: null } };
};
const ctx = (p: Partial<MoveContext> = {}): MoveContext => ({
  nowMin: 16 * 60, minutes: 45, energy: 'ok', deadlines: [], cardsDue: 0, bigThree: [], legsHurt: false, planRun: null, bossWeak: null, quests: [], overdueTasks: 0, sleepLogged: true, ...p,
});

describe('the next move', () => {
  it('sends you to bed when it is late, whatever else is open', () => {
    expect(nextMoves(input(), ctx({ nowMin: 23 * 60 }))[0].id).toBe('bed');
    expect(nextMoves(input(), ctx({ nowMin: 90 }))[0].id).toBe('bed');
    expect(isBedtime(input(), 16 * 60)).toBe(false);
  });

  it('puts a near deadline first and says why', () => {
    const moves = nextMoves(input(), ctx({ deadlines: [{ section: 'coding', title: 'JOI second round', date: addDays(T, 3) }] }));
    expect(moves[0].id).toBe('coding');
    expect(moves[0].why[0]).toBe('JOI second round in 3 days');
    expect(moves[0].action).toEqual({ type: 'focus', section: 'coding', goal: 45 });
  });

  it('never offers something that does not fit the time', () => {
    const moves = nextMoves(input(), ctx({ minutes: 15 }), 10);
    expect(moves.map((m) => m.id)).not.toContain('gym');
    expect(moves.map((m) => m.id)).not.toContain('coding');
  });

  it('low energy prefers the easy things', () => {
    const low = nextMoves(input(), ctx({ energy: 'low' }), 10).map((m) => m.id);
    expect(low.indexOf('reading')).toBeLessThan(low.indexOf('coding'));
  });

  it('counts a section already done today against it', () => {
    const fresh = nextMoves(input(), ctx(), 10).find((m) => m.id === 'chess')!;
    const done = nextMoves(input({ entries: [entry(T, 30, 'chess')] }), ctx(), 10).find((m) => m.id === 'chess')!;
    expect(done.score).toBeLessThan(fresh.score);
  });

  it('a sore leg moves running down and warns', () => {
    const fine = nextMoves(input(), ctx(), 10).find((m) => m.id === 'sports')!;
    const sore = nextMoves(input(), ctx({ legsHurt: true }), 10).find((m) => m.id === 'sports')!;
    expect(sore.score).toBeLessThan(fine.score);
    expect(sore.why.join()).toMatch(/niggle/);
  });

  it('a planned run replaces plain "Sport" and is skipped while legs hurt', () => {
    const moves = nextMoves(input(), ctx({ planRun: { title: 'Easy 8 km', km: 8 } }), 12);
    expect(moves[0].id).toBe('plan-run');
    expect(moves.map((m) => m.id)).not.toContain('sports');
    expect(nextMoves(input(), ctx({ planRun: { title: 'Easy 8 km', km: 8 }, legsHurt: true }), 12).map((m) => m.id)).not.toContain('plan-run');
  });

  it('offers due cards and overdue tasks', () => {
    const ids = nextMoves(input(), ctx({ cardsDue: 30, overdueTasks: 2 }), 12).map((m) => m.id);
    expect(ids).toContain('recall');
    expect(ids).toContain('tasks');
  });
});

describe('the shadow rival', () => {
  it('has nothing to race until a past week has time in it', () => {
    expect(shadowRace(dayFacts(input()), T, 0.5)).toBeNull();
  });

  it('runs last weeks’ pace plus 5%, day by day, and ignores empty weeks', () => {
    // Mon 26 Oct: 100; Wed 28: 100. Week before and two before that: empty.
    const i = input({ entries: [entry('2026-10-26', 100), entry('2026-10-28', 100), entry('2026-11-02', 50)] });
    const race = shadowRace(dayFacts(i), T, 0)!;
    expect(race.weeks).toBe(1);
    expect(race.theirs.slice(0, 3)).toEqual([105, 105, 210]);
    expect(race.me).toBe(50);
    expect(race.shadow).toBe(105); // start of Wednesday
    expect(race.lead).toBe(-55);
    expect(race.mine).toEqual([50, 50, 50, null, null, null, null]);
    expect(shadowRace(dayFacts(i), T, 1)!.shadow).toBe(210); // end of Wednesday
  });
});

describe('the scroll', () => {
  const c = { today: T, subjects: ['Maths', 'Further Maths', 'Physics', 'Computer Science'], books: ['Dune', 'The Pragmatic Programmer'] };
  const one = (text: string): Intent => parseScroll(text, c)[0];

  it('reads durations however they are written', () => {
    expect(takeDuration('1h30').minutes).toBe(90);
    expect(takeDuration('1h 5m').minutes).toBe(65);
    expect(takeDuration('45 min').minutes).toBe(45);
    expect(takeDuration('an hour').minutes).toBe(60);
    expect(takeDuration('half an hour').minutes).toBe(30);
    expect(takeDuration('1.5h').minutes).toBe(90);
    expect(takeDuration('1:30').minutes).toBe(90);
    expect(takeDuration('44:30', true).minutes).toBe(45);
    expect(takeDuration('nothing').minutes).toBeNull();
  });

  it('logs a section with a note', () => {
    expect(one('violin 45 bach partita')).toEqual({ kind: 'session', section: 'violin', date: T, minutes: 45, note: 'bach partita' });
    expect(one('practised for an hour')).toMatchObject({ section: 'violin', minutes: 60 });
    expect(one('chess 30m puzzles')).toMatchObject({ section: 'chess', minutes: 30, note: 'puzzles' });
    expect(one('uni prep 40 essay draft')).toMatchObject({ section: 'future', minutes: 40 });
  });

  it('reads runs: distance, time and sport', () => {
    expect(one('ran 8k in 44')).toMatchObject({ section: 'sports', sport: 'running', km: 8, minutes: 44 });
    expect(one('run 10.5km 58:30')).toMatchObject({ km: 10.5, minutes: 59 });
    expect(one('run 21km 1:56')).toMatchObject({ km: 21, minutes: 116 });
    expect(one('swam 1500m 35')).toMatchObject({ sport: 'swimming', km: 1.5, minutes: 35 });
    expect(one('tennis match 90')).toMatchObject({ sport: 'tennis', minutes: 90, match: true });
    expect(one('ran 8k')).toMatchObject({ kind: 'unknown' });
  });

  it('knows your subjects, longest name first', () => {
    expect(one('further maths 40 past paper')).toMatchObject({ section: 'study', subject: 'Further Maths', minutes: 40, studyKind: 'Past paper' });
    expect(one('physics 1h moments')).toMatchObject({ subject: 'Physics', minutes: 60, note: 'moments' });
    expect(one('revised 30')).toMatchObject({ section: 'study', minutes: 30, studyKind: 'Revision' });
  });

  it('finds a book you know', () => {
    expect(one('read 30 dune')).toMatchObject({ section: 'reading', minutes: 30, book: 'Dune', note: '' });
    expect(one('read 20 some new thing')).toMatchObject({ note: 'some new thing' });
  });

  it('reads nights across midnight, named after this morning', () => {
    expect(one('slept 23:30-7:10')).toEqual({ kind: 'night', date: T, bed: '23:30', wake: '07:10', minutes: 460 });
    expect(one('slept 11:30 7:10')).toMatchObject({ bed: '23:30', wake: '07:10' });
    expect(one('slept 7h30')).toEqual({ kind: 'night', date: T, bed: null, wake: null, minutes: 450 });
    expect(one('slept badly')).toMatchObject({ kind: 'unknown' });
  });

  it('reads screen time, tasks with due days and wishes', () => {
    expect(one('screen 2h15')).toEqual({ kind: 'screen', date: T, minutes: 135 });
    expect(one('task buy rosin fri')).toEqual({ kind: 'task', title: 'buy rosin', due: '2026-11-06' });
    expect(one('todo call the luthier tomorrow')).toEqual({ kind: 'task', title: 'call the luthier', due: '2026-11-05' });
    expect(one('task finish essay wed')).toMatchObject({ due: '2026-11-11' }); // Wednesday already: next one
    expect(one('wish see the aurora')).toEqual({ kind: 'wish', title: 'see the aurora' });
    expect(one('rest day')).toEqual({ kind: 'rest' });
  });

  it('splits a whole day and takes a day word', () => {
    const all = parseScroll('violin 45, ran 8k in 44 and physics 40; slept 7h, task buy strings', c);
    expect(all.map((i) => i.kind)).toEqual(['session', 'session', 'session', 'night', 'task']);
    expect(parseScroll('yesterday: violin 30, gym 60', c).map((i) => (i as { date: string }).date)).toEqual([addDays(T, -1), addDays(T, -1)]);
    expect(one('violin 30 yesterday')).toMatchObject({ date: addDays(T, -1), minutes: 30 });
  });

  it('keeps "and" inside a task, and says what it could not read', () => {
    expect(one('task buy bread and milk')).toMatchObject({ title: 'buy bread and milk' });
    const u = one('flew to the moon');
    expect(u.kind).toBe('unknown');
    expect(hasIntents([u])).toBe(false);
    expect(hasIntents(parseScroll('violin 20', c))).toBe(true);
    expect(parseScroll('violin', c).every((i) => i.kind === 'unknown')).toBe(true);
  });

  it('describes what it will do', () => {
    expect(describeIntent(one('ran 8k in 44'), T)).toBe('Running · 8 km · 44 min');
    expect(describeIntent(one('violin 90 yesterday'), T)).toBe('Violin · 1h 30m · yesterday');
    expect(describeIntent(one('slept 23:30-7:10'), T)).toBe('Sleep · 23:30 → 07:10 · 7h 40m');
    expect(describeIntent(one('task buy rosin fri'), T)).toBe('New task · buy rosin · due Fri 6 Nov');
    expect(describeIntent(one('task buy rosin tomorrow'), T)).toBe('New task · buy rosin · due tomorrow');
  });
});

describe('the lab', () => {
  /** 40 days where more sleep goes with better weather. */
  const fixture = () => {
    const metrics: LogDayMetric[] = [];
    const checkIns = [];
    for (let i = 0; i < 40; i++) {
      const d = addDays(T, -i);
      const good = i % 2 === 0;
      metrics.push(metric(d, 'sleep', good ? 480 : 360));
      checkIns.push({ date: d, mood: good ? 5 : 2, energy: good ? 4 : 2, note: '' });
    }
    return { i: input({ metrics }), checkIns };
  };

  it('finds a real link, says how big, and how many days back it', () => {
    const { i, checkIns } = fixture();
    const { findings } = runLab(labRows(i, checkIns));
    const f = findings.find((x) => x.hypothesis.id === 'sleep-mood')!;
    expect(f.n).toBe(40);
    expect(f.r).toBeCloseTo(1, 5);
    expect(f.strength).toBe('strong');
    expect(f.diff).toBe(3);
  });

  it('stays quiet without enough days and says how far along it is', () => {
    const { pending, findings } = runLab(labRows(input({ metrics: [metric(T, 'sleep', 400)] }), [{ date: T, mood: 3, energy: null, note: '' }]));
    expect(findings).toEqual([]);
    expect(pending.find((p) => p.hypothesis.id === 'sleep-mood')!.n).toBe(1);
  });

  it('pairs a lag: today’s screen with tonight’s sleep, which is tomorrow’s row', () => {
    const metrics: LogDayMetric[] = [];
    for (let i = 1; i < 30; i++) {
      const d = addDays(T, -i);
      const high = i % 2 === 0;
      metrics.push(metric(d, 'screen', high ? 300 : 60));
      metrics.push(metric(addDays(d, 1), 'sleep', high ? 360 : 480));
    }
    const f = runLab(labRows(input({ metrics }), [])).findings.find((x) => x.hypothesis.id === 'screen-sleep')!;
    expect(f.r).toBeLessThan(-0.9);
  });

  it('pearson handles a flat line', () => {
    expect(pearson([[1, 2], [1, 3], [1, 4]])).toBe(0);
  });

  it('formats values', () => {
    expect(fmtMetric('sleep', 455)).toBe('7h 35m');
    expect(fmtMetric('mood', 3.25)).toBe('3.3/5');
    expect(fmtMetric('bed', 660)).toBe('23:00');
    expect(fmtMetric('bed', 780)).toBe('01:00');
  });

  it('averages by weekday', () => {
    const p = weekdayProfile(labRows(input({ entries: [entry('2026-11-02', 60), entry('2026-10-26', 30)] }), []));
    expect(p.work[0]).toBe(45);
  });

  it('compares an experiment with the days before it', () => {
    const { i, checkIns } = fixture();
    const rows = labRows(i, checkIns);
    const e: Experiment = { id: 'x', title: 'No phone in bed', start: addDays(T, -9), days: 14, metric: 'sleep' };
    const r = experimentResult(rows, e, T);
    expect(r.status).toBe('running');
    expect(r.day).toBe(10);
    expect(r.during!.n).toBe(10);
    expect(r.before!.n).toBe(14);
    expect(experimentResult(rows, { ...e, days: 5 }, T).status).toBe('done');
    expect(experimentResult(rows, { ...e, start: addDays(T, 1) }, T).status).toBe('not-started');
  });
});

describe('the observatory', () => {
  it('turns XP events into a rate and dates', () => {
    const events = [{ key: 'a', date: T, section: 'violin' as const, xp: 280, reason: '' }, { key: 'b', date: addDays(T, -40), section: 'violin' as const, xp: 9999, reason: '' }];
    expect(xpRate(events, T)).toBe(10);
    const m = nextMilestones(0, 1, 10, T, 2);
    expect(m[0]).toMatchObject({ kind: 'form', name: 'Ring', level: 3, days: Math.ceil(m[0].xpLeft / 10) });
    expect(m[0].date).toBe(addDays(T, m[0].days!));
    expect(nextMilestones(0, 1, 0, T)[0].date).toBeNull();
  });

  it('caps what-if XP by the engine’s own daily cap', () => {
    expect(xpFromExtraMinutes(30)).toBe(15);
    expect(xpFromExtraMinutes(600)).toBe(30);
  });

  it('counts lifetime hours and projects mastery', () => {
    const i = input({ entries: [entry(addDays(T, -1), 5600), entry('2020-01-01', 600)] });
    const c = masteryClocks(i).find((x) => x.section === 'violin')!;
    expect(Math.round(c.hours)).toBe(103);
    expect(c.perDay).toBe(100);
    expect(c.next).toBe(250);
    expect(c.masteryDate).not.toBeNull();
    const more = masteryClocks(i, { violin: 50 }).find((x) => x.section === 'violin')!;
    expect(more.masteryDate! < c.masteryDate!).toBe(true);
    // A pace that wouldn't get there in a lifetime gives no date, not a silly one.
    const slow = input({ entries: [entry(addDays(T, -1), 56)] });
    expect(masteryClocks(slow).find((x) => x.section === 'violin')!.masteryDate).toBeNull();
  });

  it('says how much time there is before a deadline', () => {
    const i = input({ entries: [entry(addDays(T, -3), 280, 'coding')] });
    const [r] = runways(i, [{ title: 'JOI', date: addDays(T, 30), section: 'coding' }, { title: 'Gone', date: addDays(T, -1), section: 'coding' }]);
    expect(r.daysLeft).toBe(30);
    expect(r.hours).toBeCloseTo(5, 5);
    expect(runways(i, [{ title: 'JOI', date: addDays(T, 30), section: 'coding' }], { coding: 60 })[0].hours).toBeCloseTo(35, 5);
    expect(runways(i, [{ title: 'Other', date: addDays(T, 30), section: null }])).toEqual([]);
  });
});

describe('the dojo', () => {
  const card = (p: Partial<Card> = {}): Card => ({ id: `c${++n}`, deck: 'Physics', front: 'Q', back: 'A', source: 'typed', cause: null, highlightId: null, srs: freshSrs(T), createdOn: T, ...p });

  it('spaces a card out as you get it right', () => {
    let s = freshSrs(T);
    s = schedule(s, 'good', T);
    expect(s).toMatchObject({ interval: 1, due: addDays(T, 1), reps: 1, firstOn: T });
    s = schedule(s, 'good', s.due);
    expect(s.interval).toBe(3);
    s = schedule(s, 'good', s.due);
    expect(s.interval).toBe(8); // 3 × 2.5, rounded
    expect(s.ease).toBe(2.5);
  });

  it('brings a forgotten card back tomorrow and lowers its ease, never below the floor', () => {
    let s = schedule(schedule(freshSrs(T), 'good', T), 'good', T);
    s = schedule(s, 'again', T);
    expect(s).toMatchObject({ interval: 1, reps: 0, lapses: 1, due: addDays(T, 1) });
    expect(s.ease).toBeCloseTo(2.3);
    for (let i = 0; i < 20; i++) s = schedule(s, 'again', T);
    expect(s.ease).toBe(1.3);
  });

  it('easy jumps further than good, hard less', () => {
    const base = schedule(schedule(schedule(freshSrs(T), 'good', T), 'good', T), 'good', T);
    const iv = (g: 'hard' | 'good' | 'easy') => schedule(base, g, T).interval;
    expect(iv('hard')).toBeLessThan(iv('good'));
    expect(iv('good')).toBeLessThan(iv('easy'));
    expect(intervalLabel(freshSrs(T), 'again', T)).toBe('1d');
    expect(intervalLabel({ ...base, interval: 100 }, 'good', T)).toBe('8mo');
  });

  it('queues what is due, then new ones up to the daily allowance', () => {
    const due = card({ srs: { ...freshSrs(T), firstOn: '2026-10-01', due: T, interval: 3, reps: 2 } });
    const later = card({ srs: { ...freshSrs(T), firstOn: '2026-10-01', due: addDays(T, 2), interval: 3, reps: 2 } });
    const fresh = Array.from({ length: NEW_PER_DAY + 5 }, () => card());
    const q = reviewQueue([later, ...fresh, due], T);
    expect(q[0].id).toBe(due.id);
    expect(q.map((c) => c.id)).not.toContain(later.id);
    expect(q.length).toBe(1 + NEW_PER_DAY);
    // Cards started today use up the allowance.
    const started = Array.from({ length: 10 }, () => card({ srs: { ...freshSrs(T), firstOn: T, due: addDays(T, 1), interval: 1, reps: 1 } }));
    expect(reviewQueue([...started, ...fresh], T).length).toBe(NEW_PER_DAY - 10);
    expect(reviewQueue([card({ deck: 'Other' }), card()], T, 'Other').length).toBe(1);
  });

  it('cuts a blank from a highlight', () => {
    const words = tappableWords('The map is not the territory.');
    expect(words.length).toBe(6);
    const text = blankWords(words, new Set([4, 5]));
    expect(text).toBe('The map is not {{the territory}}.');
    expect(hasBlank(text)).toBe(true);
    expect(clozeOf(text)).toEqual({ hidden: 'The map is not [ … ].', answer: 'the territory', whole: 'The map is not the territory.' });
    expect(blankWords(words, new Set())).toBe('The map is not the territory.');
  });

  it('shows where marks leak and what is due per deck', () => {
    const list = [card({ source: 'mistake', cause: 'careless' }), card({ source: 'mistake', cause: 'careless' }), card({ source: 'mistake', cause: 'time' }), card({ cause: 'concept' })];
    expect(leaks(list).map((l) => [l.cause, l.n])).toEqual([['careless', 2], ['time', 1]]);
    expect(deckStats(list, T)[0]).toMatchObject({ deck: 'Physics', total: 4, due: 4, mature: 0 });
  });

  it('survives a damaged row', () => {
    const row = (data: Record<string, unknown>) => ({ id: 'x', section: 'study' as const, kind: 'hq_card', data, sort_order: 1, archived_at: null, created_at: `${T}T00:00:00Z`, updated_at: T, deleted_at: null });
    expect(cardOf(row({}))).toBeNull();
    expect(cardOf(row({ front: 'hi' }))!.srs).toMatchObject({ due: T, reps: 0, ease: 2.5 });
  });
});

describe('the infirmary', () => {
  const nig = (p: Partial<Niggle>): Niggle => ({ id: 'n', region: 'lknee', severity: 2, note: '', startedOn: T, healedOn: null, log: [], ...p });

  it('tells which niggles matter for running', () => {
    expect(legsHurt([nig({})])).toBe(true);
    expect(legsHurt([nig({ severity: 1 })])).toBe(false);
    expect(legsHurt([nig({ region: 'lshoulder' })])).toBe(false);
    expect(legsHurt([nig({ healedOn: T })])).toBe(false);
    expect(activeNiggles([nig({ healedOn: T }), nig({})]).length).toBe(1);
  });

  it('spots the same place coming back', () => {
    const list = [nig({ startedOn: addDays(T, -10) }), nig({ startedOn: addDays(T, -100) }), nig({ startedOn: addDays(T, -300) }), nig({ region: 'neck' })];
    expect(recurring(list, T)).toEqual([{ region: 'lknee', n: 3 }]);
    expect(recurring(list.map((x) => ({ ...x, startedOn: addDays(T, -400) })), T)).toEqual([]);
  });

  const week = (fromDaysAgo: number, km: number) => Array.from({ length: 7 }, (_, i) => [addDays(T, -(fromDaysAgo + i)), km / 7] as [string, number]);

  it('needs old weeks before it says anything', () => {
    expect(loadGuard(new Map(week(0, 40)), T).zone).toBe('unknown');
  });

  it('reads steady, rising and falling load', () => {
    const steady = loadGuard(new Map([...week(0, 40), ...week(7, 40), ...week(14, 40), ...week(21, 40)]), T);
    expect(steady.ratio).toBeCloseTo(1, 5);
    expect(steady.zone).toBe('good');
    const spike = loadGuard(new Map([...week(0, 80), ...week(7, 30), ...week(14, 30), ...week(21, 30)]), T);
    expect(spike.zone).toBe('high');
    expect(spike.jump).toBeCloseTo(80 / 30 - 1, 5);
    const caution = loadGuard(new Map([...week(0, 60), ...week(7, 35), ...week(14, 35), ...week(21, 35)]), T);
    expect(caution.zone).toBe('caution');
    expect(loadGuard(new Map([...week(7, 40), ...week(14, 40), ...week(21, 40)]), T).zone).toBe('low');
  });
});

describe('the armoury', () => {
  const shoes: Gear = { id: 'g', type: 'shoes', name: 'Pegasus', metric: 'km', source: 'running', limit: 700, since: '2026-10-01', baseline: 100, past: [] };
  const ev: WearEvent[] = [
    { date: '2026-10-20', source: 'running', minutes: 50, km: 10 },
    { date: '2026-09-20', source: 'running', minutes: 50, km: 99 }, // before these shoes
    { date: '2026-10-21', source: 'cycling', minutes: 50, km: 30 }, // not running
  ];

  it('wears shoes by the kilometres logged since they came into use', () => {
    const w = wearOf(shoes, ev, T);
    expect(w.used).toBe(110);
    expect(w.status).toBe('fresh');
    expect(w.left).toBe(590);
    expect(w.dueDate).not.toBeNull();
  });

  it('flags worn and due', () => {
    expect(wearOf({ ...shoes, baseline: 570 }, ev, T).status).toBe('worn');
    const due = wearOf({ ...shoes, baseline: 700 }, ev, T);
    expect(due.status).toBe('due');
    expect(due.dueDate).toBe(T);
  });

  it('wears strings by hours, a bow by days', () => {
    const strings: Gear = { ...shoes, metric: 'hours', source: 'violin', limit: 200, baseline: 0 };
    expect(wearOf(strings, [{ date: '2026-10-20', source: 'violin', minutes: 90, km: null }], T).used).toBe(1.5);
    const bow: Gear = { ...shoes, metric: 'days', source: 'none', limit: 240, baseline: 0, since: addDays(T, -24) };
    expect(wearOf(bow, [], T).used).toBe(24);
    expect(wearOf(bow, [], T).dueDate).toBe(addDays(T, 216));
    expect(fmtWear('km', 12.4)).toBe('12 km');
  });

  it('gives no date when nothing is wearing it', () => {
    expect(wearOf({ ...shoes, since: T }, [], T).dueDate).toBeNull();
  });
});

describe('the oracle', () => {
  const p = (confidence: number, outcome: boolean | null, by = T): Prediction => ({ id: `p${++n}`, claim: 'x', confidence, by, madeOn: T, outcome, resolvedOn: null, note: '' });

  it('scores judgement and spots overconfidence', () => {
    const c = calibration([p(90, true), p(90, false), p(90, false), p(90, false), p(90, false)]);
    expect(c.n).toBe(5);
    expect(c.brier).toBeCloseTo((0.01 + 4 * 0.81) / 5, 5);
    expect(c.bias).toBe(70);
    expect(c.verdict).toMatch(/Too sure/);
    expect(c.bins).toEqual([{ from: 90, to: 99, n: 5, said: 90, hit: 20 }]);
  });

  it('spots modesty and good calibration', () => {
    expect(calibration(Array.from({ length: 5 }, () => p(60, true))).verdict).toMatch(/Too modest/);
    const fair = [p(80, true), p(80, true), p(80, true), p(80, true), p(80, false)];
    expect(calibration(fair).verdict).toMatch(/Well calibrated/);
    expect(calibration([p(70, true)]).verdict).toMatch(/4 more/);
    expect(calibration([p(70, null)]).brier).toBeNull();
  });

  it('knows what has come due', () => {
    expect(isDue(p(70, null, T), T)).toBe(true);
    expect(isDue(p(70, null, addDays(T, 1)), T)).toBe(false);
    expect(isDue(p(70, true, T), T)).toBe(false);
  });
});

describe('the vault', () => {
  const snap = (p: Partial<Snapshot> = {}): Snapshot => ({ level: 5, rank: 'Initiate', form: 'Ring', streak: 3, hours: { violin: 10 }, totalHours: 10, km: 20, books: 1, wishes: 0, emblems: 4, ...p });

  it('compares then with now, and leaves out what did not move', () => {
    const rows = compareSnapshots(snap(), snap({ level: 9, hours: { violin: 40 }, totalHours: 40 }));
    expect(rows.map((r) => r.label)).toEqual(['Level', 'Hours logged', 'Violin']);
    expect(rows[2]).toMatchObject({ then: '10 h', now: '40 h', delta: 30 });
  });

  it('offers dates in order, without any that have passed', () => {
    const p = capsulePresets(T, [{ label: 'Race day', date: '2027-04-18' }, { label: 'Gone', date: '2026-01-01' }]);
    expect(p[0]).toEqual({ label: 'In 1 month', date: '2026-12-04' });
    expect(p.map((x) => x.label)).toContain('Race day');
    expect(p.map((x) => x.label)).not.toContain('Gone');
    expect([...p].sort((a, b) => a.date.localeCompare(b.date))).toEqual(p);
    expect(capsulePresets('2026-01-31')[0].date).toBe('2026-02-28');
  });

  it('finds what you were doing on this day', () => {
    const memories = onThisDay(input({ entries: [entry(addDays(T, -7), 40, 'violin', 'Bach clicked'), entry(addDays(T, -8), 40)] }));
    expect(memories).toHaveLength(1);
    expect(memories[0]).toMatchObject({ ago: 'A week ago', lines: [{ section: 'violin', text: '40 min · Bach clicked' }] });
  });
});

describe('the war room', () => {
  const rv = (week: string): Review => ({ id: week, week, win: '', stuck: '', change: '', theme: '', rating: null, big: [], sealedOn: week });

  it('plans next week from Friday on', () => {
    expect(planWeekFor('2026-11-05')).toBe('2026-11-02'); // Thu
    expect(planWeekFor('2026-11-06')).toBe('2026-11-09'); // Fri
    expect(planWeekFor('2026-11-08')).toBe('2026-11-09'); // Sun
    expect(planWeekFor('2026-11-09')).toBe('2026-11-09'); // Mon
  });

  it('asks at the weekend and early in the week, until it is done', () => {
    expect(reviewIsDue('2026-11-07', [])).toBe(true); // Sat
    expect(reviewIsDue('2026-11-09', [])).toBe(true); // Mon
    expect(reviewIsDue('2026-11-04', [])).toBe(false); // Wed
    expect(reviewIsDue('2026-11-07', [rv('2026-11-09')])).toBe(false);
  });

  it('counts reviews in a row, not breaking on one still open', () => {
    expect(reviewStreak([rv('2026-10-26'), rv('2026-10-19'), rv('2026-10-05')], '2026-11-04')).toBe(2);
    expect(reviewStreak([rv('2026-11-02'), rv('2026-10-26')], '2026-11-04')).toBe(2);
    expect(reviewStreak([], T)).toBe(0);
  });

  it('builds the tape of the week before', () => {
    const i = input({ entries: [entry('2026-10-28', 90)], metrics: [metric('2026-10-28', 'sleep', 420), metric('2026-10-29', 'sleep', 480), metric('2026-11-02', 'sleep', 100)] });
    const t = tapeFor(i, '2026-11-02', [{ date: '2026-10-28', mood: 4, energy: null, note: '' }], [rv('2026-10-26')]);
    expect(t.recap.minutes).toBe(90);
    expect(t.sleep).toBe(450);
    expect(t.mood).toBe(4);
    expect(t.screen).toBeNull();
    expect(t.previous?.week).toBe('2026-10-26');
  });
});

describe('rituals', () => {
  const r = (p: Partial<Ritual> = {}): Ritual => ({ id: 'r', title: 'Stretch', cue: '', slot: 'morning', days: [], since: addDays(T, -30), archived: false, ...p });
  const doneOn = (...days: string[]) => new Map(days.map((d) => [d, new Set(['r'])]));

  it('builds a chain and survives one miss, not two', () => {
    expect(chainOf(r(), doneOn(T, addDays(T, -1), addDays(T, -2)), T).n).toBe(3);
    expect(chainOf(r(), doneOn(T, addDays(T, -2)), T).n).toBe(2);
    expect(chainOf(r(), doneOn(T, addDays(T, -3)), T).n).toBe(1);
  });

  it('today not done yet is no miss', () => {
    const c = chainOf(r(), doneOn(addDays(T, -1), addDays(T, -2)), T);
    expect(c.n).toBe(2);
    expect(c.held).toBe(false);
    const held = chainOf(r(), doneOn(addDays(T, -2), addDays(T, -3)), T);
    expect(held).toMatchObject({ n: 2, held: true });
    expect(chainOf(r(), doneOn(), T)).toMatchObject({ n: 0, held: false });
  });

  it('only counts the days it applies to', () => {
    const wedOnly = r({ days: [2] }); // Wednesdays
    expect(appliesOn(wedOnly, T)).toBe(true);
    expect(appliesOn(wedOnly, addDays(T, 1))).toBe(false);
    expect(chainOf(wedOnly, doneOn(T, addDays(T, -7)), T).n).toBe(2);
    expect(chainOf(wedOnly, doneOn(T), T).recent.filter((x) => x === null).length).toBe(12);
    expect(appliesOn(r({ since: addDays(T, 1) }), T)).toBe(false);
  });

  it('works out a completion rate and the slot for the hour', () => {
    expect(chainOf(r({ since: addDays(T, -3) }), doneOn(addDays(T, -1), addDays(T, -3)), T).rate).toBeCloseTo(2 / 3);
    expect(slotAt(7)).toBe('morning');
    expect(slotAt(14)).toBe('day');
    expect(slotAt(21)).toBe('evening');
  });
});

describe('the sleep bank', () => {
  const nights = (...v: number[]) => new Map(v.map((m, i) => [addDays(T, -i), m]));

  it('works out what your schedule asks for', () => {
    expect(sleepNeed(DEFAULT_SLEEP)).toBe(465); // 22:45 → 06:30
  });

  it('owes for short nights, the recent ones most', () => {
    const b = sleepBank(nights(345, 465, 465), T, DEFAULT_SLEEP);
    expect(b.debt).toBe(120);
    expect(b.state).toBe('light');
    const older = sleepBank(nights(465, 465, 345), T, DEFAULT_SLEEP);
    expect(older.debt).toBeLessThan(b.debt);
  });

  it('says little without nights, and clears with enough sleep', () => {
    expect(sleepBank(new Map(), T, DEFAULT_SLEEP)).toMatchObject({ debt: 0, state: 'unknown', nights: 0 });
    expect(sleepBank(nights(465, 465, 465), T, DEFAULT_SLEEP)).toMatchObject({ debt: 0, state: 'clear' });
    expect(sleepBank(nights(600, 300, 465), T, DEFAULT_SLEEP).debt).toBeLessThan(10);
    expect(sleepBank(nights(700, 300, 465), T, DEFAULT_SLEEP).debt).toBe(0);
  });

  it('sets tonight’s bedtime from your plan', () => {
    const t = tonight(T, DEFAULT_SLEEP, { need: 465, debt: 0, nights: 5, state: 'clear' }, null);
    expect(t.wake).toBe('06:30');
    expect(t.bed).toBe('22:30');
    expect(t.repay).toBe(0);
  });

  it('moves it for an early start and for what you owe', () => {
    const early = tonight(T, DEFAULT_SLEEP, { need: 465, debt: 0, nights: 5, state: 'clear' }, { title: 'Mock exam', start: '07:00' });
    expect(early.wake).toBe('06:00');
    expect(early.bed).toBe('22:00');
    expect(early.because[0]).toMatch(/Mock exam at 07:00/);
    const debt = tonight(T, DEFAULT_SLEEP, { need: 465, debt: 400, nights: 5, state: 'heavy' }, null);
    expect(debt.repay).toBe(45);
    expect(debt.bed).toBe('21:45');
    // A first thing that's later than your plan doesn't change it.
    expect(tonight(T, DEFAULT_SLEEP, { need: 465, debt: 0, nights: 5, state: 'clear' }, { title: 'Late', start: '11:00' }).wake).toBe('06:30');
  });
});

describe('the scout report', () => {
  const start = 1_780_000_000;
  const g = (i: number, result: ScoutGame['result'], p: Partial<ScoutGame> = {}): ScoutGame => ({ end: start + i * 600, white: i % 2 === 0, rated: true, result, opening: 'Sicilian Defense', tc: 'blitz', ...p });
  const hour = () => 20;

  it('needs a few games', () => {
    expect(scout([g(0, 'win')], hour)).toBeNull();
    expect(scout(Array.from({ length: 9 }, (_, i) => g(i, 'win', { tc: 'daily' })), hour)).toBeNull();
  });

  it('scores openings, colours and hours', () => {
    const list = [g(0, 'win'), g(1, 'win'), g(2, 'draw'), g(3, 'loss', { opening: 'London System' }), g(4, 'loss', { opening: 'London System' }), g(5, 'loss', { opening: 'London System' })];
    const s = scout(list, hour)!;
    expect(s.overall).toMatchObject({ n: 6, win: 2, draw: 1, loss: 3, pct: 42 });
    expect(s.openings.map((o) => [o.name, o.pct])).toEqual([['Sicilian', 83], ['London System', 0]]);
    expect(s.hours).toHaveLength(1);
    expect(s.hours[0].label).toBe('Evening');
  });

  it('spots tilt, only within a sitting, and a run of losses', () => {
    // Pairs: after a loss you lose again; after a win you win again.
    const pat: ScoutGame['result'][] = ['win', 'win', 'win', 'win', 'win', 'win', 'loss', 'loss', 'loss', 'loss', 'loss', 'loss', 'loss'];
    const s = scout(pat.map((r, i) => g(i, r)), hour)!;
    expect(s.tilt).toBe('yes');
    expect(s.lossRun).toBe(7);
    expect(s.advice[0]).toMatch(/lost the last 7/);
    // The same games, hours apart: nothing was "right after".
    const far = scout(pat.map((r, i) => g(i * 100, r)), hour)!;
    expect(far.afterLoss).toBeNull();
    expect(far.tilt).toBeNull();
  });

  it('counts a late-night game in the small hours', () => {
    const s = scout(Array.from({ length: 6 }, (_, i) => g(i, 'win')), () => 1)!;
    expect(s.hours[0].label).toBe('Late night');
  });
});

describe('the run window', () => {
  const hours = (date: string, feels: (h: number) => number, rain = 0): HourForecast[] =>
    Array.from({ length: 24 }, (_, h) => ({ time: `${date}T${String(h).padStart(2, '0')}:00`, feels: feels(h), rain, wind: 5, day: h >= 7 && h < 19 }));

  it('reads the forecast and leaves out holes', () => {
    expect(parseForecast({})).toEqual([]);
    const out = parseForecast({ hourly: { time: ['2026-11-04T06:00', '2026-11-04T07:00'], apparent_temperature: [12, NaN as unknown as number], precipitation_probability: [10, 0], wind_speed_10m: [3, 0], is_day: [1, 1] } });
    expect(out[0]).toEqual({ time: '2026-11-04T06:00', feels: 12, rain: 10, wind: 3, day: true });
  });

  it('prefers cool, dry daylight', () => {
    const base = { time: '', feels: 12, rain: 0, wind: 5, day: true };
    expect(hourScore(base)).toBe(100);
    expect(hourScore({ ...base, feels: 30 })).toBeLessThan(60);
    expect(hourScore({ ...base, rain: 80 })).toBeLessThan(60);
    expect(hourScore({ ...base, day: false })).toBeLessThan(100);
  });

  it('finds the coolest free stretch in waking hours', () => {
    const f = hours(T, (h) => 30 - Math.abs(h - 14)); // hottest at 14:00, cooler either end
    const w = runWindows(f, 60, `${T}T05:00`, [], { from: '06:30', to: '22:00' });
    // 07:00 and 21:00 are the coolest whole hours in the waking window; daylight breaks the tie.
    expect(w[0].start).toBe('07:00');
    expect(w[0].end).toBe('08:00');
    expect(w[0].why[0]).toMatch(/Feels like/);
  });

  it('avoids the calendar with a margin, and hours that have passed', () => {
    const f = hours(T, () => 12);
    const w = runWindows(f, 60, `${T}T05:00`, [{ date: T, start: '08:00', end: '16:00' }], { from: '07:00', to: '22:00' }, 5);
    expect(w.some((x) => x.start >= '07:30' && x.start < '16:30')).toBe(false);
    const later = runWindows(f, 60, `${T}T18:20`, [], { from: '07:00', to: '22:00' }, 1);
    expect(later[0].start).toBe('18:00');
  });

  it('keeps windows apart and fits long runs', () => {
    const f = hours(T, () => 12);
    const w = runWindows(f, 120, `${T}T05:00`, [], { from: '07:00', to: '22:00' }, 3);
    expect(w).toHaveLength(3);
    expect(w[0].end).toBe('09:00');
    expect(new Set(w.map((x) => x.start)).size).toBe(3);
  });
});

describe('the practice room', () => {
  const tone = (hz: number, rate = 44100, n = 4096, amp = 0.4) => {
    const out = new Float32Array(n);
    // A little second harmonic, as a real string has.
    for (let i = 0; i < n; i++) out[i] = amp * Math.sin((2 * Math.PI * hz * i) / rate) + amp * 0.3 * Math.sin((4 * Math.PI * hz * i) / rate);
    return out;
  };

  it('hears the open strings within a couple of cents', () => {
    for (const s of VIOLIN_STRINGS) {
      const hz = freqOfMidi(s.midi, 442);
      const got = detectPitch(tone(hz), 44100)!;
      const n = nearestNote(got, 442);
      expect(n.midi).toBe(s.midi);
      expect(Math.abs(n.cents)).toBeLessThanOrEqual(3);
    }
  });

  it('says how sharp or flat', () => {
    const hz = 442 * 2 ** (20 / 1200);
    expect(nearestNote(detectPitch(tone(hz), 44100)!, 442).cents).toBeGreaterThanOrEqual(17);
    expect(nearestNote(440, 442)).toMatchObject({ name: 'A4', midi: 69, cents: -8 });
  });

  it('stays quiet on silence and noise', () => {
    expect(detectPitch(new Float32Array(4096), 44100)).toBeNull();
    const noise = new Float32Array(4096);
    let seed = 7;
    for (let i = 0; i < noise.length; i++) {
      seed = (seed * 16807) % 2147483647;
      noise[i] = seed / 2147483647 - 0.5;
    }
    expect(detectPitch(noise, 44100)).toBeNull();
  });

  it('names notes', () => {
    expect(midiName(69)).toBe('A4');
    expect(midiName(55)).toBe('G3');
    expect(midiName(76)).toBe('E5');
    expect(freqOfMidi(69, 442)).toBe(442);
  });

  it('works out tap tempo and forgets old taps', () => {
    expect(tapTempo([0])).toBeNull();
    expect(tapTempo([0, 500, 1000, 1500])).toBe(120);
    expect(tapTempo([0, 500, 6000, 6400, 6800])).toBe(150);
  });

  it('climbs a tempo ladder in small steps', () => {
    const l: Ladder = { id: 'x', name: 'Bach', goal: 120, log: [] };
    expect(ladderStatus(l)).toMatchObject({ best: null, next: 72, pct: 0 });
    const log = logTempo(logTempo([], '2026-11-01', 80), '2026-11-08', 90);
    const s = ladderStatus({ ...l, log });
    expect(s.best).toBe(90);
    expect(s.next).toBe(94);
    expect(s.pct).toBe(0.75);
    expect(s.perWeek).toBe(10);
    expect(ladderStatus({ ...l, log: [{ date: T, bpm: 119 }] }).next).toBe(120);
  });

  it('keeps one mark a day', () => {
    expect(logTempo([{ date: T, bpm: 80 }], T, 84)).toEqual([{ date: T, bpm: 84 }]);
  });
});

describe('the words', () => {
  it('has unique ids, says who said each, and leaves out the famous fakes', () => {
    expect(new Set(QUOTES.map((q) => q.id)).size).toBe(QUOTES.length);
    for (const q of QUOTES) {
      expect(q.by, q.id).toBeTruthy();
      expect(q.feelings.length, q.id).toBeGreaterThan(0);
    }
    const all = QUOTES.map((q) => q.text.toLowerCase()).join(' | ');
    expect(all).not.toContain('going through hell');
    expect(all).not.toContain('seems impossible');
    expect(all).not.toContain('success is not final');
  });

  it('has something for every feeling', () => {
    for (const f of FEELINGS) expect(quotesFor(f.id, 'x').length, f.id).toBeGreaterThanOrEqual(5);
  });

  it('draws today’s words by date, the same on every device, and short enough for Home', () => {
    expect(wordsOfDay(T)).toEqual(wordsOfDay(T));
    expect(wordsOfDay(T).text.length).toBeLessThanOrEqual(110);
    expect(wordsOfDay(addDays(T, 1)).id).not.toBe(wordsOfDay(T).id);
  });

  it('goes round the whole shelf before repeating', () => {
    const pool = QUOTES.filter((q) => q.text.length <= 110).length;
    // Start on a round boundary, so the whole window falls in one shuffled round.
    const dayNo = Math.floor(Date.UTC(2026, 10, 4) / 86_400_000);
    const start = addDays(T, pool - (dayNo % pool));
    const seen = new Set(Array.from({ length: pool }, (_, i) => wordsOfDay(addDays(start, i)).id));
    expect(seen.size).toBe(pool);
  });

  it('shuffles the same way for the same seed, and only what fits', () => {
    expect(quotesFor('failed', 'a').map((q) => q.id)).toEqual(quotesFor('failed', 'a').map((q) => q.id));
    expect(quotesFor('failed', 'a').every((q) => q.feelings.includes('failed'))).toBe(true);
    expect(quotesFor(null, 'a').length).toBe(QUOTES.length);
    expect(shuffled([1, 2, 3], 'z').sort()).toEqual([1, 2, 3]);
  });
});

describe('the lighthouse', () => {
  const note = (p: Partial<Note>): Note => ({ id: 'n', text: 'x', feelings: [], writtenOn: '2026-10-01', mood: null, reads: 0, lastRead: null, ...p });
  const c = (date: string, mood: number, energy: number | null = null) => ({ date, mood, energy, note: '' });
  const ctx = { checkIns: [], reviews: [], books: 0, wishes: 0 };

  it('reads messages meant for this feeling first, then ones for any day, and leaves out the rest', () => {
    const notes = [note({ id: 'any' }), note({ id: 'failed', feelings: ['failed'] }), note({ id: 'tired', feelings: ['tired'] })];
    expect(notesFor(notes, 'failed').map((n) => n.id)).toEqual(['failed', 'any']);
    expect(notesFor(notes, null).map((n) => n.id).sort()).toEqual(['any', 'failed', 'tired']);
  });

  it('gives every message its turn: the one unread longest comes first', () => {
    const notes = [note({ id: 'recent', lastRead: '2026-11-01' }), note({ id: 'older', lastRead: '2026-10-01' }), note({ id: 'never' })];
    expect(notesFor(notes, 'flat').map((n) => n.id)).toEqual(['never', 'older', 'recent']);
  });

  it('counts comebacks only after a real stop', () => {
    const d = (...x: string[]) => new Set(x);
    expect(comebacks(d('2026-10-01', '2026-10-07', '2026-10-09'), T)).toBe(1);
    expect(comebacks(d('2026-10-01', '2026-10-04'), T)).toBe(0);
    expect(comebacks(d(), T)).toBe(0);
  });

  it('counts rough spells that ended, not one still going', () => {
    const list = [c('2026-10-01', 1), c('2026-10-02', 2), c('2026-10-03', 4), c('2026-10-10', 2), c('2026-10-11', 3), c('2026-10-20', 1)];
    expect(roughSpells(list)).toEqual({ cleared: 2, avgDays: 1.5 });
    expect(roughSpells([c('2026-10-20', 1)])).toEqual({ cleared: 0, avgDays: 0 });
  });

  it('says nothing it can’t back up', () => {
    expect(proofLines(input(), ctx, 'flat')).toEqual([]);
  });

  it('builds proof from real records, the most useful for this feeling first', () => {
    const entries = [entry('2026-09-01', 600), entry('2026-09-20', 60), entry('2026-10-20', 60)];
    const checkIns = [c('2026-09-01', 1), c('2026-09-02', 4), c('2026-09-20', 2), c('2026-09-21', 3)];
    const lines = proofLines(input({ entries }), { ...ctx, checkIns, books: 2, wishes: 1 }, 'failed', 8);
    expect(lines[0]).toMatchObject({ id: 'comebacks', big: '2×' });
    expect(lines.find((l) => l.id === 'hours')!.big).toBe('12 h');
    expect(lines.find((l) => l.id === 'weather')).toMatchObject({ big: '2/2' });
    expect(proofLines(input({ entries }), { ...ctx, checkIns }, 'doubt')[0].id).toBe('hours');
    expect(lines.find((l) => l.id === 'books')!.text).toBe('books finished.');
  });

  it('quotes your own win back at you', () => {
    const reviews = [{ id: 'r', week: '2026-10-26', win: 'Ran further than ever', stuck: '', change: '', theme: '', rating: null, big: [], sealedOn: T }];
    expect(proofLines(input(), { ...ctx, reviews }, 'failed')[0].text).toContain('Ran further than ever');
  });

  it('counts low-energy days that still got done', () => {
    const lines = proofLines(input({ entries: [entry('2026-10-01', 30), entry('2026-10-02', 30)] }), { ...ctx, checkIns: [c('2026-10-01', 3, 1), c('2026-10-02', 3, 2), c('2026-10-03', 3, 1)] }, 'flat');
    expect(lines[0]).toMatchObject({ id: 'low-days', big: '2' });
  });

  it('knows a rough day from a good one', () => {
    expect(roughToday([c(T, 2)], T)).toBe(true);
    expect(roughToday([c(T, 3)], T)).toBe(false);
    expect(roughToday([], T)).toBe(false);
    expect(goodDayToWrite([c(T, 4)], T)).toBe(true);
    expect(goodDayToWrite([c(T, 3)], T)).toBe(false);
  });
});

describe('the exchange rate', () => {
  it('uses only what your records back up', () => {
    expect(exchange(120, input())).toEqual([]);
    expect(exchange(0, input({ entries: [entry(T, 40), entry(T, 40), entry(T, 40)] }))).toEqual([]);
    const r = run(T, 10, 60);
    const lines = exchange(120, input({ entries: [entry(T, 40), entry(T, 40), entry(T, 40), r.e], details: new Map([[r.e.id, r.d]]) }));
    expect(lines.find((l) => l.section === 'violin')!.amount).toBe(3);
    expect(lines.find((l) => l.section === 'sports')!.text).toMatch(/^20 km/);
    expect(lines.find((l) => l.section === 'sports')!.text).toMatch(/47% of a marathon/);
  });
});

describe('the hall of records', () => {
  it('finds bests with their dates and how close you came lately', () => {
    const old = run('2026-01-10', 20, 120);
    const recent = run(addDays(T, -2), 10, 50);
    const i = input({ entries: [entry('2026-02-01', 200), entry(addDays(T, -1), 100), old.e, recent.e], details: new Map([[old.e.id, old.d], [recent.e.id, recent.d]]), metrics: [metric(T, 'screen', 90), metric('2026-10-10', 'screen', 200), metric(T, 'sleep', 500)] });
    const by = Object.fromEntries(hallOfRecords(i).map((r) => [r.id, r]));
    expect(by['longest-session']).toMatchObject({ value: '3h 20m', date: '2026-02-01' });
    expect(by['longest-session'].chase).toBeCloseTo(0.5);
    expect(by['long-run']).toMatchObject({ value: '20 km', date: '2026-01-10', chase: 0.5 });
    expect(by['fast-run']).toMatchObject({ value: '5:00 /km', date: recent.e.date, chase: 1 });
    expect(by['low-screen']).toMatchObject({ value: '1h 30m', date: T });
    expect(by['longest-sleep']).toMatchObject({ value: '8h 20m' });
  });

  it('is empty with nothing logged', () => {
    expect(hallOfRecords(input())).toEqual([]);
  });

  it('counts the longest streak with one missed day allowed', () => {
    const days = ['2026-10-01', '2026-10-02', '2026-10-04', '2026-10-05', '2026-10-20'].map((d) => entry(d, 30));
    const s = hallOfRecords(input({ entries: days })).find((r) => r.id === 'streak')!;
    expect(s).toMatchObject({ value: '4 days', date: '2026-10-05' });
  });
});
