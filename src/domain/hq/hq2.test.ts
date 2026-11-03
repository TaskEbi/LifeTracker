import { describe, expect, it } from 'vitest';
import type { LogDayMetric, LogEntry, LtDetail, LtEvent, SectionId } from '../../data/types';
import { DEFAULT_SLEEP, DEFAULT_TARGETS } from '../prefs';
import { addDays } from '../log/dates';
import type { ProgressInput } from '../progress/engine';
import { dayFacts } from '../progress/quests';
import { answerBout, currentPair, isFinished, maxQuestions, startBout, type Bout } from './arena';
import { BREATHS, breathAt, estimateMax, fuelPlan, MARATHON_KM, paceBand, platesFor, warmUp } from './body2';
import { newCards, STARTER_DECKS } from './decks';
import { closingDate, dayOfYear, diaryStreak, firstThingToday, isClosingTime, QUESTIONS, questionFor, sameDayBefore } from './diary';
import { isDark, mockPace, mockReview, MOCK_PRESETS, nextSquare, normaliseVision, squareAt, urgeTotals } from './drills';
import { fmtClock, forgeDay, freeGaps, revisionPlan, subjectOfExam } from './forge';
import { normaliseRanking, priorityGap, weekLedger } from './ledger';
import { INTERVALS, intervalWeight, pickInterval, programme, splitOf, weakest, type StandItem } from './music';
import { oathProgress, oathWords, type Oath } from './oath';
import { QUOTES } from './quotes';
import { flipPoints, isClose, rankOptions } from './scales';
import { isUnlocked, nextTopics, normaliseSkills, tierProgress, topicById, TOPICS } from './techTree';
import { journey, ROAD_KM, STATIONS } from './tokaido';
import { distanceFeel, reelPanels, reelYears, yearReel } from './wrapped';

const T = '2026-11-04'; // a Wednesday
let n = 0;
const TOPIC: Record<string, SectionId> = { violin: 'violin', study: 'study', coding: 'coding', sports: 'sports', gym: 'gym', reading: 'reading', future: 'future', chess: 'chess' };
const entry = (date: string, minutes: number, topic = 'violin'): LogEntry => ({ id: `e${++n}`, date, topic_id: topic, subcategory_id: null, minutes, note: null, created_at: `${date}T10:00:00Z`, updated_at: `${date}T10:00:00Z`, deleted_at: null });
const metric = (date: string, m: LogDayMetric['metric'], minutes: number): LogDayMetric => ({ id: `${m}:${date}`, date, metric: m, minutes, created_at: date, updated_at: date, deleted_at: null });
const input = (p: Partial<ProgressInput> = {}): ProgressInput => ({
  today: T, entries: [], topicSection: new Map(Object.entries(TOPIC)), details: new Map(), metrics: [], nights: new Map(), todos: [],
  dayOf: (iso) => iso.slice(0, 10), restDays: [], cabinetDays: [], targets: DEFAULT_TARGETS, sleep: DEFAULT_SLEEP, ...p,
});
const run = (date: string, km: number, minutes: number): { e: LogEntry; d: LtDetail } => {
  const e = entry(date, minutes, 'sports');
  return { e, d: { id: e.id, section: 'sports', data: { sport: 'running', km }, created_at: date, updated_at: date, deleted_at: null } };
};

describe('the quote shelf', () => {
  it('has 154 lines with unique ids, each saying who said it', () => {
    expect(QUOTES.length).toBe(154);
    expect(new Set(QUOTES.map((q) => q.id)).size).toBe(154);
    for (const q of QUOTES) {
      expect(q.by, q.id).toBeTruthy();
      expect(q.feelings.length, q.id).toBeGreaterThan(0);
    }
  });
});

describe('the day forge', () => {
  it('finds the gaps around the calendar, with the short ones left out', () => {
    expect(freeGaps([{ start: '10:00', end: '11:00' }, { start: '11:10', end: '12:00' }], 9 * 60, 13 * 60)).toEqual([[540, 600], [720, 780]]);
    expect(freeGaps([], 9 * 60 + 2, 10 * 60)).toEqual([[545, 600]]);
    // An event with no end counts as an hour.
    expect(freeGaps([{ start: '10:00', end: null }], 600, 720)).toEqual([[660, 720]]);
  });

  it('fills them in order, with a short break, and never below 15 minutes', () => {
    const items = [{ id: 'a', title: 'A', minutes: 30, section: null }, { id: 'b', title: 'B', minutes: 30, section: null }, { id: 'c', title: 'C', minutes: 90, section: null }];
    const { blocks, left } = forgeDay(items, [[540, 610]]);
    expect(blocks.map((b) => [b.id, b.start, b.end])).toEqual([['a', '09:00', '09:30'], ['b', '09:35', '10:05']]);
    expect(left.map((l) => l.id)).toEqual(['c']);
  });

  it('shrinks a long item to fit the biggest gap', () => {
    const { blocks } = forgeDay([{ id: 'x', title: 'X', minutes: 90, section: null }], [[540, 560], [600, 640]]);
    expect(blocks[0]).toMatchObject({ start: '10:00', end: '10:40', minutes: 40 });
  });

  it('formats clock times', () => {
    expect(fmtClock(545)).toBe('09:05');
  });
});

describe('the revision forge', () => {
  const exams = [{ title: 'Physics mock', date: addDays(T, 10), subject: 'Physics' }];
  const topics = [{ subject: 'Physics', name: 'Fields', level: 1 as const }, { subject: 'Physics', name: 'Waves', level: 3 as const }];

  it('knows the subject from the title, longest name first', () => {
    expect(subjectOfExam('Further Maths paper 1', ['Maths', 'Further Maths'])).toBe('Further Maths');
    expect(subjectOfExam('Physics mock', ['Maths', 'Physics'])).toBe('Physics');
    expect(subjectOfExam('French oral', ['Maths'])).toBeNull();
  });

  it('stops before the exam and ends on past papers', () => {
    const plan = revisionPlan(exams, topics, T, 60);
    expect(plan.every((d) => d.date < exams[0].date)).toBe(true);
    expect(plan[plan.length - 1].items.every((i) => i.paper)).toBe(true);
    expect(plan[0].items.length).toBe(2);
    expect(plan[0].items[0].paper).toBe(false);
  });

  it('gives the worst topics the most time, and every topic a turn', () => {
    const all = revisionPlan(exams, topics, T, 90).flatMap((d) => d.items).filter((i) => !i.paper);
    const count = (name: string) => all.filter((i) => i.what === name).length;
    expect(count('Waves')).toBeGreaterThan(0);
    expect(count('Fields')).toBeGreaterThan(count('Waves'));
  });

  it('shares days between subjects, and stops planning one once its exam has gone', () => {
    const two = [{ title: 'Maths', date: addDays(T, 4), subject: 'Maths' }, { title: 'Physics', date: addDays(T, 8), subject: 'Physics' }];
    const plan = revisionPlan(two, topics, T, 60);
    expect(new Set(plan[0].items.map((i) => i.subject)).size).toBe(2);
    expect(plan.filter((d) => d.date >= addDays(T, 4)).every((d) => d.items.every((i) => i.subject === 'Physics'))).toBe(true);
  });

  it('is empty with no exams, and still offers past papers with no topics', () => {
    expect(revisionPlan([], topics, T, 60)).toEqual([]);
    expect(revisionPlan([{ title: 'Maths', date: addDays(T, 5), subject: 'Maths' }], [], T, 30)[0].items[0].what).toBe('Past paper questions');
  });
});

describe('the arena', () => {
  const fight = (items: number[]): { order: number[]; asked: number } => {
    let b: Bout<number> = startBout(items);
    let asked = 0;
    while (!isFinished(b)) {
      const [a, c] = currentPair(b)!;
      b = answerBout(b, a > c); // a bigger number matters more
      asked++;
    }
    return { order: b.sorted, asked };
  };

  it('ranks everything from head-to-head answers', () => {
    expect(fight([3, 1, 4, 1.5, 9, 2.6, 5]).order).toEqual([9, 5, 4, 3, 2.6, 1.5, 1]);
  });

  it('stays under the limit it promises', () => {
    const items = [8, 3, 12, 1, 7, 10, 2, 11, 6, 4, 9, 5];
    expect(fight(items).asked).toBeLessThanOrEqual(maxQuestions(12));
    expect(maxQuestions(12)).toBeLessThanOrEqual(35);
  });

  it('copes with nothing, and with one', () => {
    expect(isFinished(startBout([]))).toBe(true);
    expect(startBout([1]).sorted).toEqual([1]);
    expect(currentPair(startBout([1]))).toBeNull();
  });
});

describe('the oath', () => {
  const oath = (p: Partial<Oath> = {}): Oath => ({ id: 'o', metric: 'minutes', section: 'violin', target: 100, from: '2026-11-02', until: '2026-11-08', stake: 'No dessert', paidOn: null, ...p });
  const facts = (entries: LogEntry[]) => dayFacts(input({ entries }));

  it('counts only inside its dates, and only its section', () => {
    const p = oathProgress(oath(), facts([entry('2026-11-02', 30), entry('2026-11-01', 500), entry('2026-11-03', 500, 'coding')]), T);
    expect(p.done).toBe(30);
    expect(p.pct).toBeCloseTo(0.3);
  });

  it('is ahead or behind by the calendar', () => {
    expect(oathProgress(oath(), facts([entry('2026-11-02', 60)]), T).status).toBe('ahead');
    expect(oathProgress(oath(), facts([entry('2026-11-02', 5)]), T).status).toBe('behind');
    expect(oathProgress(oath({ from: addDays(T, 1), until: addDays(T, 5) }), facts([]), T).status).toBe('not-started');
  });

  it('is kept as soon as it’s reached, and broken only once the date has gone', () => {
    expect(oathProgress(oath(), facts([entry('2026-11-02', 100)]), T).status).toBe('kept');
    const late = oathProgress(oath(), facts([entry('2026-11-02', 10)]), '2026-11-09');
    expect(late.status).toBe('broken');
    expect(oathProgress(oath(), facts([entry('2026-11-02', 10)]), '2026-11-08').status).not.toBe('broken');
  });

  it('says what’s needed each day from here', () => {
    const p = oathProgress(oath(), facts([entry('2026-11-02', 50)]), T);
    expect(p.daysLeft).toBe(5);
    expect(p.perDay).toBe(10);
  });

  it('reads the other measures', () => {
    const r = run('2026-11-03', 12.5, 60);
    const f = dayFacts(input({ entries: [r.e], details: new Map([[r.e.id, r.d]]) }));
    expect(oathProgress(oath({ metric: 'km', section: null, target: 20 }), f, T).done).toBe(12.5);
    expect(oathProgress(oath({ metric: 'sessions', section: 'sports', target: 1 }), f, T).status).toBe('kept');
    expect(oathWords(oath())).toBe('100 minutes of violin');
    expect(oathWords(oath({ metric: 'km', target: 50 }))).toBe('50 km');
  });
});

describe('the scales', () => {
  const d = {
    options: ['Cambridge', 'MIT'],
    criteria: [{ id: 'c', name: 'Course', weight: 5 }, { id: 'm', name: 'Music', weight: 1 }],
    scores: { Cambridge: { c: 7, m: 10 }, MIT: { c: 9, m: 4 } },
  };

  it('weights the scores and ranks them', () => {
    const r = rankOptions(d);
    expect(r[0].option).toBe('MIT');
    expect(r[0].score).toBeCloseTo((9 * 5 + 4) / 6 * 10);
    expect(r[1].score).toBeCloseTo((7 * 5 + 10) / 6 * 10);
  });

  it('finds what would flip it', () => {
    expect(flipPoints(d)).toEqual([{ criterion: 'Course', weight: 1 }, { criterion: 'Music', weight: 2 }]);
  });

  it('says nothing flips a clear win', () => {
    const clear = { ...d, scores: { Cambridge: { c: 1, m: 1 }, MIT: { c: 10, m: 10 } } };
    expect(flipPoints(clear)).toEqual([]);
    expect(isClose(rankOptions(clear))).toBe(false);
    expect(isClose([{ option: 'a', score: 60 }, { option: 'b', score: 58 }])).toBe(true);
  });

  it('counts an unscored option as the middle, and copes with no criteria', () => {
    expect(rankOptions({ ...d, scores: {} })[0].score).toBe(50);
    expect(rankOptions({ options: ['a'], criteria: [], scores: {} })[0].score).toBe(0);
    expect(flipPoints({ options: ['a'], criteria: [], scores: {} })).toEqual([]);
  });
});

describe('the ledger', () => {
  const ev = (p: Partial<LtEvent>): LtEvent => ({ id: 'ev', title: 'School', section: null, kind: 'school', date: '2026-11-02', start: '09:00', end: '15:00', repeat: null, exceptions: {}, note: null, data: {}, cancelled_at: null, created_at: T, updated_at: T, deleted_at: null, ...p });

  it('adds up the week so far, and only the days that have happened', () => {
    const i = input({ entries: [entry('2026-11-02', 60), entry('2026-11-03', 30, 'coding')], metrics: [metric('2026-11-02', 'sleep', 480), metric('2026-11-02', 'screen', 120)] });
    const w = weekLedger(i, [ev({})], '2026-11-02');
    expect(w.days).toBe(3);
    expect(w.total).toBe(3 * 1440);
    const by = Object.fromEntries(w.lines.map((l) => [l.id, l.minutes]));
    expect(by).toMatchObject({ sleep: 480, violin: 60, coding: 30, screen: 120, fixed: 360 });
    expect(w.unaccounted).toBe(3 * 1440 - 1050);
    expect(w.nightsMissing).toBe(2);
    expect(w.screenDaysMissing).toBe(2);
  });

  it('doesn’t count calendar sessions, which are logged anyway', () => {
    const w = weekLedger(input(), [ev({ kind: 'session' })], '2026-11-02');
    expect(w.lines.find((l) => l.id === 'fixed')).toBeUndefined();
  });

  it('puts your ranking beside your time', () => {
    const i = input({ entries: [entry(addDays(T, -2), 300, 'coding'), entry(addDays(T, -3), 60)] });
    const rows = priorityGap(i, normaliseRanking(['violin', 'coding']));
    expect(rows[0]).toMatchObject({ section: 'violin', rank: 1, actual: 2, gap: 1, minutes: 60 });
    expect(rows[1]).toMatchObject({ section: 'coding', rank: 2, actual: 1, gap: -1 });
    expect(rows[1].share).toBeCloseTo(300 / 360);
  });

  it('fills in a ranking that’s missing or old', () => {
    expect(normaliseRanking(null)).toHaveLength(8);
    const r = normaliseRanking(['chess', 'nope', 'chess']);
    expect(r[0]).toBe('chess');
    expect(new Set(r).size).toBe(8);
  });
});

describe('the five-year diary', () => {
  it('asks the same question on the same date every year', () => {
    expect(questionFor('2026-11-04')).toBe(questionFor('2031-11-04'));
    expect(questionFor('2026-11-04')).not.toBe(questionFor('2026-11-05'));
    expect(dayOfYear('2026-01-01')).toBe(1);
    expect(dayOfYear('2026-03-01')).toBe(61);
    expect(dayOfYear('2028-02-29')).toBe(60);
    expect(new Set(QUESTIONS).size).toBe(QUESTIONS.length);
  });

  it('finds the same day in earlier years, latest first', () => {
    const list = [{ date: '2024-11-04', text: 'a' }, { date: '2025-11-04', text: 'b' }, { date: '2025-11-05', text: 'c' }, { date: '2026-11-04', text: 'd' }];
    expect(sameDayBefore(list, '2026-11-04').map((e) => e.text)).toEqual(['b', 'a']);
  });

  it('counts days in a row, not breaking until today’s over', () => {
    const list = [{ date: addDays(T, -1), text: 'a' }, { date: addDays(T, -2), text: 'b' }, { date: addDays(T, -4), text: 'c' }];
    expect(diaryStreak(list, T)).toBe(2);
    expect(diaryStreak([...list, { date: T, text: 'd' }], T)).toBe(3);
    expect(diaryStreak(list, addDays(T, 2))).toBe(0);
  });
});

describe('closing the day', () => {
  it('opens in the evening, and past midnight it’s still yesterday', () => {
    expect(isClosingTime(20)).toBe(true);
    expect(isClosingTime(1)).toBe(true);
    expect(isClosingTime(14)).toBe(false);
    expect(closingDate(T, 1)).toBe(addDays(T, -1));
    expect(closingDate(T, 22)).toBe(T);
  });

  it('brings back last night’s decision, and only last night’s', () => {
    const list = [{ date: addDays(T, -1), first: 'Two past papers', at: '22:00' }, { date: addDays(T, -2), first: 'Old', at: null }];
    expect(firstThingToday(list, T)).toBe('Two past papers');
    expect(firstThingToday([{ date: addDays(T, -2), first: 'Old', at: null }], T)).toBeNull();
    expect(firstThingToday([{ date: addDays(T, -1), first: '  ', at: null }], T)).toBeNull();
  });
});

describe('breathing', () => {
  const box = BREATHS.find((b) => b.id === 'box')!;
  it('knows where you are in the pattern', () => {
    expect(breathAt(box, 0)).toMatchObject({ label: 'Breathe in', left: 4, fill: 0, round: 0 });
    expect(breathAt(box, 2000).fill).toBeCloseTo(0.5);
    expect(breathAt(box, 5000)).toMatchObject({ label: 'Hold', fill: 1 });
    expect(breathAt(box, 10000).fill).toBeCloseTo(0.5);
    expect(breathAt(box, 13000)).toMatchObject({ label: 'Hold empty', fill: 0 });
    expect(breathAt(box, 16000)).toMatchObject({ label: 'Breathe in', round: 1 });
  });
  it('gives every pattern a way in and out', () => {
    for (const p of BREATHS) {
      expect(p.phases.some((x) => x.label === 'Breathe in'), p.id).toBe(true);
      expect(p.phases.some((x) => x.label === 'Breathe out'), p.id).toBe(true);
    }
  });
});

describe('bar tools', () => {
  it('works out plates per side', () => {
    expect(platesFor(100)).toEqual({ side: [25, 15], total: 100, off: 0 });
    expect(platesFor(62.5)).toMatchObject({ side: [20, 1.25], total: 62.5 });
    expect(platesFor(20).side).toEqual([]);
    expect(platesFor(10)).toEqual({ side: [], total: 20, off: -10 });
  });
  it('says when it can’t be made exactly', () => {
    expect(platesFor(101)).toMatchObject({ total: 100, off: 1 });
  });
  it('estimates a one-rep max', () => {
    expect(estimateMax(100, 1)).toBe(100);
    expect(estimateMax(100, 5)).toBeCloseTo(116.7);
    expect(estimateMax(0, 5)).toBe(0);
  });
  it('ramps up without passing the working weight or repeating', () => {
    const w = warmUp(100);
    expect(w[0]).toEqual({ weight: 20, reps: 10 });
    expect(w.map((s) => s.weight)).toEqual([20, 40, 60, 80, 90]);
    expect(warmUp(30).every((s) => s.weight < 30)).toBe(true);
    expect(warmUp(20)).toEqual([]);
  });
});

describe('race kit', () => {
  const goal = 4 * 3600 + 10 * 60;
  it('adds up to the goal, with a slightly quicker second half', () => {
    const band = paceBand(goal);
    expect(band[band.length - 1]).toMatchObject({ label: 'Finish', km: MARATHON_KM, at: '4:10:00' });
    const halfTime = band.find((b) => b.label === 'Half')!;
    expect(halfTime.at > '2:05:00').toBe(true);
    expect(halfTime.pace > band[band.length - 1].pace).toBe(true);
    expect(paceBand(goal, 0).find((b) => b.label === 'Half')!.at).toBe('2:05:00');
    expect(band[0].at).toBe('29:46');
  });
  it('plans gels through the race, and none right at the end', () => {
    const fuel = fuelPlan(goal);
    expect(fuel[0].minute).toBe(35);
    expect(fuel.length).toBe(6);
    expect(fuel[fuel.length - 1].minute).toBeLessThan(goal / 60 - 15);
    expect(fuel[0].km).toBeCloseTo(5.9, 1);
  });
});

describe('the conductor', () => {
  const item = (p: Partial<StandItem>): StandItem => ({ id: 'x', kind: 'piece', title: 'X', status: 'Polishing', idle: 3, performIn: null, ...p });

  it('fills the time exactly, warm-up first', () => {
    for (const minutes of [15, 30, 45, 60, 90]) {
      const seg = programme([item({ id: 'a' }), item({ id: 'b' }), item({ id: 'c' }), item({ id: 'd' }), item({ id: 's', kind: 'scale', title: 'D major' })], minutes);
      expect(seg.reduce((n, s) => n + s.minutes, 0), `${minutes}`).toBe(minutes);
      expect(seg[0].id).toBe('warm');
      expect(seg[0].title).toBe('D major');
    }
  });

  it('puts what’s performed soon first, then what’s been left', () => {
    const soon = programme([item({ id: 'old', idle: 40 }), item({ id: 'concert', performIn: 3, idle: 1 })], 30);
    expect(soon[1].id).toBe('concert');
    expect(soon[1].minutes).toBeGreaterThan(soon[2].minutes);
    const left = programme([item({ id: 'recent', idle: 1 }), item({ id: 'neglected', idle: 12 })], 20);
    expect(left[1].id).toBe('neglected');
    expect(programme([item({ id: 'shelved', status: 'Shelved', idle: 90 }), item({ id: 'live', idle: 2 })], 20)[1].id).toBe('live');
  });

  it('copes with an empty stand', () => {
    const seg = programme([], 30);
    expect(seg.reduce((n, s) => n + s.minutes, 0)).toBe(30);
    expect(seg[1].id).toBe('free');
  });

  it('adds a run-through when there’s time, and works out the split', () => {
    const seg = programme([item({ id: 'a' })], 30);
    expect(seg[seg.length - 1].id).toBe('run');
    expect(splitOf(seg).a).toBe(seg.filter((s) => s.itemId === 'a').reduce((n, s) => n + s.minutes, 0));
    expect(programme([item({ id: 'a' })], 15).some((s) => s.id === 'run')).toBe(false);
  });
});

describe('the ear trainer', () => {
  it('has the twelve intervals with the right sizes', () => {
    expect(INTERVALS.map((i) => i.semitones)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });
  it('asks the weak ones more, and drops none', () => {
    expect(intervalWeight({ asked: 10, right: 0 })).toBe(5);
    expect(intervalWeight({ asked: 10, right: 10 })).toBe(1);
    expect(intervalWeight(undefined)).toBe(3);
    const stats = Object.fromEntries(INTERVALS.map((i) => [i.id, { asked: 10, right: i.id === 'TT' ? 0 : 10 }]));
    let hits = 0;
    for (let k = 0; k < 1000; k++) if (pickInterval(stats, k / 1000).id === 'TT') hits++;
    expect(hits).toBeGreaterThan(250);
    const seen = new Set(Array.from({ length: 1000 }, (_, k) => pickInterval(stats, k / 1000).id));
    expect(seen.size).toBe(12);
  });
  it('names your weakest once there’s enough to go on', () => {
    expect(weakest({ m3: { asked: 2, right: 0 } })).toBeNull();
    expect(weakest({ m3: { asked: 6, right: 1 }, P5: { asked: 6, right: 6 } })!.id).toBe('m3');
  });
});

describe('the Tōkaidō', () => {
  it('has all the stations in order', () => {
    expect(STATIONS.length).toBe(55);
    expect(STATIONS[0].name).toBe('Nihonbashi');
    expect(STATIONS[54].name).toBe('Kyoto');
    for (let i = 1; i < STATIONS.length; i++) {
      expect(STATIONS[i].km, STATIONS[i].name).toBeGreaterThan(STATIONS[i - 1].km);
      expect(STATIONS[i].n).toBe(i);
    }
  });
  it('tells you where you’ve got to', () => {
    expect(journey(0)).toMatchObject({ trips: 0, passed: 0, toNext: 7.9 });
    expect(journey(0).last.name).toBe('Nihonbashi');
    const j = journey(100);
    expect(j.last.name).toBe('Hakone');
    expect(j.next!.name).toBe('Mishima');
    expect(j.toNext).toBeCloseTo(12.6);
  });
  it('starts again from Edo after Kyoto', () => {
    const j = journey(ROAD_KM + 10);
    expect(j.trips).toBe(1);
    expect(j.last.name).toBe('Shinagawa');
    expect(journey(ROAD_KM)).toMatchObject({ trips: 1, km: 0 });
  });
});

describe('the tech tree', () => {
  it('only needs topics that exist, and never one from a later tier', () => {
    for (const t of TOPICS) {
      for (const need of t.needs) {
        expect(topicById(need), `${t.id} needs ${need}`).toBeTruthy();
        expect(topicById(need)!.tier, `${t.id} needs ${need}`).toBeLessThanOrEqual(t.tier);
      }
    }
    expect(new Set(TOPICS.map((t) => t.id)).size).toBe(TOPICS.length);
  });
  it('unlocks when the foundations can be coded', () => {
    const seg = topicById('segtree')!;
    expect(isUnlocked(seg, {})).toBe(false);
    expect(isUnlocked(seg, { bit: { level: 1, on: null }, bsearch: { level: 3, on: null } })).toBe(false);
    expect(isUnlocked(seg, { bit: { level: 2, on: null }, bsearch: { level: 2, on: null } })).toBe(true);
    expect(isUnlocked(topicById('impl')!, {})).toBe(true);
  });
  it('suggests the earliest unlocked work, and skips what’s done', () => {
    const first = nextTopics({});
    expect(first.every((t) => t.needs.length === 0)).toBe(true);
    const later = nextTopics({ impl: { level: 3, on: T }, complexity: { level: 3, on: T } }, 10);
    expect(later.map((t) => t.id)).not.toContain('impl');
    expect(later.map((t) => t.id)).toContain('sort');
  });
  it('counts a tier and survives a damaged row', () => {
    expect(tierProgress({ impl: { level: 2, on: null } }, 1).done).toBe(1);
    expect(normaliseSkills({ impl: { level: 9 }, nope: { level: 1 } })).toEqual({ impl: { level: 3, on: null } });
    expect(normaliseSkills('x')).toEqual({});
  });
});

describe('board vision', () => {
  it('names squares from either side', () => {
    expect(squareAt('white', 0, 0)).toBe('a8');
    expect(squareAt('white', 7, 7)).toBe('h1');
    expect(squareAt('black', 0, 0)).toBe('h1');
    expect(squareAt('black', 7, 7)).toBe('a8');
  });
  it('knows the colours', () => {
    expect(isDark('a1')).toBe(true);
    expect(isDark('h1')).toBe(false);
    expect(isDark('e4')).toBe(false);
    expect(isDark('d4')).toBe(true);
  });
  it('never asks the same square twice running', () => {
    for (let k = 0; k < 200; k++) expect(nextSquare(k / 200, 'a1')).not.toBe('a1');
    expect(nextSquare(0.999999, null)).toMatch(/^[a-h][1-8]$/);
  });
  it('survives a damaged record', () => {
    expect(normaliseVision(null)).toEqual({ white: 0, black: 0, runs: [] });
  });
});

describe('the mock clock', () => {
  const m = { minutes: 60, count: 60, marks: [60, 120, 500] };
  it('says where you should be', () => {
    const p = mockPace(m, 600);
    expect(p.shouldBe).toBe(10);
    expect(p.done).toBe(3);
    expect(p.lead).toBe(-7);
    expect(p.left).toBe(3000);
    expect(mockPace(m, 3700).over).toBe(true);
    expect(mockPace(m, 3700).shouldBe).toBe(60);
  });
  it('finds which question ate the time', () => {
    const r = mockReview(m);
    expect(r.each).toEqual([60, 60, 380]);
    expect(r.slowest).toEqual({ n: 3, seconds: 380 });
    expect(r.sinks).toEqual([3]);
    expect(mockReview({ ...m, marks: [] }).slowest).toBeNull();
  });
  it('has sensible presets', () => {
    for (const p of MOCK_PRESETS) expect(p.minutes * p.count, p.id).toBeGreaterThan(0);
  });
});

describe('the bouncer', () => {
  it('counts urges held, overall and this week', () => {
    const t = urgeTotals([{ date: '2026-11-03', held: 3, gave: 1 }, { date: '2026-10-20', held: 1, gave: 3 }], '2026-11-02');
    expect(t).toMatchObject({ held: 4, gave: 4, weekHeld: 3, weekGave: 1, rate: 0.5 });
    expect(urgeTotals([], T).rate).toBeNull();
  });
});

describe('the deck library', () => {
  it('has real decks with no repeated questions', () => {
    expect(STARTER_DECKS.length).toBeGreaterThanOrEqual(5);
    for (const d of STARTER_DECKS) {
      expect(d.cards.length, d.id).toBeGreaterThanOrEqual(15);
      const fronts = d.cards.map(([f]) => f.toLowerCase());
      expect(new Set(fronts).size, d.id).toBe(fronts.length);
      for (const [f, b] of d.cards) expect(f && b, f).toBeTruthy();
    }
  });
  it('adds only what isn’t there, in that deck', () => {
    const deck = STARTER_DECKS[0];
    expect(newCards(deck, []).length).toBe(deck.cards.length);
    expect(newCards(deck, [{ deck: deck.deck, front: `  ${deck.cards[0][0].toUpperCase()} ` }]).length).toBe(deck.cards.length - 1);
    expect(newCards(deck, [{ deck: 'Other', front: deck.cards[0][0] }]).length).toBe(deck.cards.length);
  });
});

describe('the year so far', () => {
  const ctx = { checkIns: [], bookDates: [], wishDates: [], capsulesSealed: [] };
  it('adds up one year only, up to today', () => {
    const r1 = run('2026-03-10', 20, 120);
    const i = input({ entries: [entry('2026-03-01', 60), entry('2026-03-02', 100, 'coding'), entry('2025-12-31', 999), r1.e], details: new Map([[r1.e.id, r1.d]]) });
    const r = yearReel(i, 2026, ctx);
    expect(r.minutes).toBe(280);
    expect(r.km).toBe(20);
    expect(r.sections[0]).toEqual({ id: 'sports', minutes: 120 });
    expect(r.bestMonth).toEqual({ month: 2, minutes: 280 });
    expect(r.bestDay).toEqual({ date: '2026-03-10', minutes: 120 });
    expect(r.through).toBe(T);
    expect(yearReel(i, 2025, ctx).through).toBe('2025-12-31');
  });
  it('finds the most common weather and counts trophies in the year', () => {
    const checkIns = [{ date: '2026-01-01', mood: 4, energy: null, note: '' }, { date: '2026-01-02', mood: 4, energy: null, note: '' }, { date: '2026-01-03', mood: 2, energy: null, note: '' }];
    const r = yearReel(input(), 2026, { ...ctx, checkIns, bookDates: ['2026-02-01', '2025-02-01'] });
    expect(r.weather).toMatchObject({ name: 'Clear' });
    expect(r.weather!.share).toBeCloseTo(2 / 3);
    expect(r.books).toBe(1);
  });
  it('only plays reels with something to show', () => {
    const empty = yearReel(input(), 2026, ctx);
    expect(reelPanels(empty)).toEqual(['title', 'end']);
    const r = run('2026-03-10', 20, 120);
    const full = reelPanels(yearReel(input({ entries: [r.e], details: new Map([[r.e.id, r.d]]) }), 2026, ctx));
    expect(full).toContain('miles');
    expect(full).toContain('time');
    expect(full).not.toContain('nights');
  });
  it('gives distance a real feel', () => {
    expect(distanceFeel(2)).toBeNull();
    expect(distanceFeel(100)).toContain('Hakone');
    expect(distanceFeel(ROAD_KM * 2)).toContain('2.0 times');
  });
  it('lists the years there’s anything in', () => {
    expect(reelYears(input({ entries: [entry('2025-05-01', 10), entry('2026-05-01', 10)] }), [])).toEqual([2026, 2025]);
  });
});
