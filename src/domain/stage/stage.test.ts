import { describe, expect, it } from 'vitest';
import type { LtRecord } from '../../data/types';
import { parseRepertoire, pieceSpan, pieceYear, sortRepertoire } from '../../features/violin/model';
import type { Sitting } from '../maths/model';
import {
  chessEvents,
  eventType,
  headToHead,
  lastNote,
  nervesSplit,
  parseSets,
  parseTime,
  predictionGap,
  prepOf,
  raceBests,
  raceDistance,
  readySplit,
  recordOf,
  reflectionData,
  revisionFor,
  revisionSplit,
  setTally,
  showOfMark,
  showOfRecord,
  showOfSitting,
  showOfSport,
  sleepSplit,
  stageLine,
  statAverages,
  subjectSummaries,
  timeText,
  trophies,
  wasPb,
  type Show,
} from './model';

const rec = (kind: string, data: Record<string, unknown>, id = 'r1'): LtRecord => ({ id, section: 'cabinet', kind, data, sort_order: 0, archived_at: null, created_at: '2026-11-01T00:00:00Z', updated_at: '', deleted_at: null });
const sportName = (id: string) => id[0].toUpperCase() + id.slice(1);
let n = 0;
const show = (p: Partial<Show>): Show => ({
  id: `s${++n}`,
  type: 'other',
  source: 'show',
  date: '2026-11-01',
  title: 'x',
  kind: '',
  result: '',
  outcome: null,
  place: null,
  pct: null,
  predict: null,
  event: null,
  where: '',
  opp: '',
  pieces: [],
  sets: [],
  stats: {},
  km: null,
  secs: null,
  minutes: null,
  goal: '',
  ready: null,
  nerves: null,
  rating: null,
  well: '',
  next: '',
  ...p,
});

describe('reading results from where they live', () => {
  it('reads a performance row defensively', () => {
    const s = showOfRecord(rec('pf_show', { type: 'violin', date: '2026-11-08', title: 'Winter concert', kind: 'Concert', pieces: ['p1', 3], rating: 4, nerves: 9, result: '' }))!;
    expect(s).toMatchObject({ type: 'violin', title: 'Winter concert', pieces: ['p1'], rating: 4, nerves: null, result: '★★★★' });
    expect(showOfRecord(rec('pf_show', { type: 'magic', date: '2026-11-08' }))).toMatchObject({ type: 'other', title: 'Something else', kind: 'Competition', result: 'Done' });
    expect(showOfRecord(rec('pf_show', { type: 'talk' }))).toBeNull();
    expect(showOfRecord(rec('pf_show', { type: 'chess', date: '2026-11-08', outcome: 'draw' }))!.result).toBe('Drew');
    expect(showOfRecord(rec('pf_show', { type: 'other', date: '2026-11-08', place: 2 }))!.result).toBe('2nd');
  });

  it('turns a Study mark into a test, keeping the guess', () => {
    const t = showOfMark(rec('study_mark', { subject: 'Physics', title: 'SHM test', score: 42, outOf: 50, date: '2026-11-05', predict: 75, grade: 'A' }))!;
    expect(t).toMatchObject({ type: 'test', source: 'mark', kind: 'Physics', pct: 84, predict: 75, result: '84% · A' });
    expect(showOfMark(rec('study_mark', { subject: 'Physics', score: 4, outOf: 0 }))).toBeNull();
    expect(showOfMark(rec('study_mark', { subject: 'Maths', score: 30, outOf: 40, date: '2026-11-02' }))!.title).toBe('Maths test');
  });

  it('turns sports sessions into matches and races, and leaves training alone', () => {
    const e = { id: 'e1', date: '2026-11-07', minutes: 90, note: null };
    const m = showOfSport(e, { sport: 'volleyball', type: 'match', opp: 'Tanglin', sets: [[25, 21], [22, 25], [15, 12]], stats: { kills: 7, bad: -1 } }, sportName)!;
    expect(m).toMatchObject({ type: 'match', kind: 'Volleyball', title: 'vs Tanglin', outcome: 'win', result: 'Won 2–1', stats: { kills: 7 } });
    expect(showOfSport(e, { sport: 'tennis', type: 'match', score: '6–4, 3–6', result: 'loss' }, sportName)!.result).toBe('Lost 6–4, 3–6');
    expect(showOfSport(e, { sport: 'volleyball', type: 'training' }, sportName)).toBeNull();
    expect(showOfSport(e, { sport: 'running', km: 7 }, sportName)).toBeNull();
    const r = showOfSport({ ...e, minutes: 112 }, { sport: 'running', km: 21.1, race: 'City Half', secs: 6730, place: 41 }, sportName)!;
    expect(r).toMatchObject({ type: 'race', title: 'City Half', secs: 6730, result: '1:52:10 · 41st' });
    expect(showOfSport({ ...e, minutes: 25 }, { sport: 'running', km: 5, race: 'parkrun' }, sportName)!.secs).toBe(1500);
  });

  it('shows real maths contests with a score, not practice papers', () => {
    const base: Sitting = { id: 'm', contest: 'smc', label: 'SMC 2026', date: '2026-10-01', real: true, score: 112, max: 125, correct: null, blank: null, marks: [], award: 'Gold', note: '', minutes: 90, entryId: null };
    expect(showOfSitting(base)).toMatchObject({ type: 'maths', pct: 90, result: '112/125 · Gold' });
    expect(showOfSitting({ ...base, real: false })).toBeNull();
    expect(showOfSitting({ ...base, score: null })).toBeNull();
  });

  it('keeps only the reflection fields that are set', () => {
    expect(reflectionData({ goal: '  Stay relaxed ', ready: 4, nerves: null, rating: undefined, well: '', next: 'x' })).toEqual({ goal: 'Stay relaxed', ready: 4, next: 'x' });
  });

  it('reads a prep row', () => {
    expect(prepOf(rec('pf_prep', { event: 'ev@2026-11-20', ticks: ['run', 4], ready: 3, predict: 140 }))).toEqual({ event: 'ev@2026-11-20', ticks: ['run'], goal: '', ready: 3, nerves: null, predict: null });
    expect(prepOf(rec('pf_prep', {}))).toBeNull();
  });
});

describe('scores and times', () => {
  it('parses sets', () => {
    expect(parseSets('25-21, 22–25 15:12')).toEqual([[25, 21], [22, 25], [15, 12]]);
    expect(parseSets('')).toEqual([]);
    expect(parseSets('25-21, great')).toBeNull();
    expect(setTally([[25, 21], [22, 25], [15, 12]])).toEqual({ won: 2, lost: 1, outcome: 'win' });
    expect(setTally([]).outcome).toBeNull();
  });

  it('reads and writes race times', () => {
    expect(parseTime('1:52:10')).toBe(6730);
    expect(parseTime('25:03')).toBe(1503);
    expect(parseTime('52')).toBe(3120);
    expect(parseTime('25:75')).toBeNull();
    expect(parseTime('fast')).toBeNull();
    expect(timeText(6730)).toBe('1:52:10');
    expect(timeText(1503)).toBe('25:03');
  });

  it('knows the standard distances within 2%', () => {
    expect(raceDistance(21.1)?.id).toBe('half');
    expect(raceDistance(5.05)?.id).toBe('5k');
    expect(raceDistance(7)).toBeNull();
    expect(raceDistance(null)).toBeNull();
  });
});

describe('the calendar', () => {
  it('sorts events into kinds of day', () => {
    expect(eventType({ kind: 'exam', section: 'study', title: 'Physics mock' })).toBe('test');
    expect(eventType({ kind: 'exam', section: 'maths', title: 'BMO1' })).toBe('maths');
    expect(eventType({ kind: 'performance', section: null, title: 'Winter concert' })).toBe('violin');
    expect(eventType({ kind: 'performance', section: 'study', title: 'Assembly talk' })).toBe('talk');
    expect(eventType({ kind: 'competition', section: 'sports', title: 'Inter-school volleyball' })).toBe('match');
    expect(eventType({ kind: 'competition', section: 'sports', title: 'Sundown 10K' })).toBe('race');
    expect(eventType({ kind: 'competition', section: 'chess', title: 'Rapid open' })).toBe('chess');
    expect(eventType({ kind: 'session', section: 'sports', title: 'Practice' })).toBeNull();
    // Added from the Stage: the event says what it is.
    expect(eventType({ kind: 'performance', section: null, title: 'Year 12 assembly', data: { stage: 'talk' } })).toBe('talk');
    expect(eventType({ kind: 'session', section: null, title: 'x', data: { stage: 'talk' } })).toBeNull();
  });

  it('finds what you told yourself last time', () => {
    const list = [show({ type: 'violin', date: '2026-06-01', next: 'Slow down in the cadenza' }), show({ type: 'violin', date: '2026-09-01', next: 'Breathe before the entry' }), show({ type: 'test', date: '2026-10-01', next: 'Read the question' })];
    expect(lastNote(list, 'violin', '2026-11-20')?.next).toBe('Breathe before the entry');
    expect(lastNote(list, 'violin', '2026-08-01')?.next).toBe('Slow down in the cadenza');
    expect(lastNote(list, 'match', '2026-11-20')).toBeNull();
  });
});

describe('patterns', () => {
  const tests = [
    show({ type: 'test', kind: 'Physics', date: '2026-09-10', pct: 70, predict: 60 }),
    show({ type: 'test', kind: 'Physics', date: '2026-10-10', pct: 80, predict: 75 }),
    show({ type: 'test', kind: 'Physics', date: '2026-11-05', pct: 90, predict: 80 }),
    show({ type: 'test', kind: 'Maths', date: '2026-11-01', pct: 95 }),
  ];

  it('sums up each subject', () => {
    const [phys, maths] = subjectSummaries(tests);
    expect(phys).toMatchObject({ subject: 'Physics', n: 3, avg: 80, trend: 15, line: [70, 80, 90] });
    expect(phys.best.pct).toBe(90);
    expect(maths).toMatchObject({ subject: 'Maths', n: 1, trend: null });
  });

  it('measures how far the guesses were off', () => {
    expect(predictionGap(tests)).toEqual({ n: 3, gap: 8, within5: 1 });
    expect(predictionGap(tests.slice(3))).toBeNull();
  });

  it('counts revision in the two weeks before a test and compares more with less', () => {
    const sessions = [
      { date: '2026-11-05', subject: 'Physics', minutes: 30 },
      { date: '2026-10-23', subject: 'Physics', minutes: 60 },
      { date: '2026-10-22', subject: 'Physics', minutes: 999 }, // 15 days before: outside
      { date: '2026-10-30', subject: 'Maths', minutes: 45 },
    ];
    expect(revisionFor(tests[2], sessions)).toBe(90);
    expect(revisionSplit(tests.slice(0, 3), sessions)).toBeNull();
    const more = [...tests, show({ type: 'test', kind: 'Maths', date: '2026-10-01', pct: 60 })];
    expect(revisionSplit(more, sessions)).toEqual({ median: 0, more: 93, less: 70, nMore: 2, nLess: 3 });
  });

  it('keeps a win–loss record with form, streak and sets', () => {
    const matches = [
      show({ type: 'match', date: '2026-11-07', outcome: 'win', opp: 'Tanglin', sets: [[25, 21], [25, 18]] }),
      show({ type: 'match', date: '2026-11-01', outcome: 'win', opp: 'tanglin' }),
      show({ type: 'match', date: '2026-10-20', outcome: 'loss', opp: 'ACS', sets: [[20, 25], [25, 23], [10, 15]] }),
      show({ type: 'match', date: '2026-10-10' }),
    ];
    expect(recordOf(matches)).toEqual({ played: 3, won: 2, lost: 1, drawn: 0, form: ['win', 'win', 'loss'], streak: { outcome: 'win', n: 2 }, setsWon: 3, setsLost: 2 });
    expect(headToHead(matches)).toEqual([
      { opp: 'Tanglin', won: 2, lost: 0, drawn: 0, last: '2026-11-07' },
      { opp: 'ACS', won: 0, lost: 1, drawn: 0, last: '2026-10-20' },
    ]);
  });

  it('averages match stats where they were counted', () => {
    const list = [show({ stats: { kills: 6, aces: 2 } }), show({ stats: { kills: 9 } }), show({})];
    expect(statAverages(list, ['kills', 'aces', 'digs'])).toEqual([
      { id: 'kills', avg: 7.5, best: 9, n: 2 },
      { id: 'aces', avg: 2, best: 2, n: 1 },
    ]);
  });

  it('finds race bests and whether each was a best on the day', () => {
    const a = show({ type: 'race', date: '2026-03-01', km: 21.1, secs: 7200 });
    const b = show({ type: 'race', date: '2026-10-25', km: 21.0975, secs: 6960 });
    const c = show({ type: 'race', date: '2026-11-08', km: 21.1, secs: 7100 });
    const races = [a, b, c, show({ type: 'race', km: 7, secs: 2000 })];
    expect(raceBests(races).map((x) => [x.id, x.best.secs])).toEqual([['half', 6960]]);
    expect([wasPb(a, races), wasPb(b, races), wasPb(c, races)]).toEqual([true, true, false]);
  });

  it('adds up chess points by event', () => {
    const games = [show({ type: 'chess', title: 'Rapid open', outcome: 'win', date: '2026-11-08' }), show({ type: 'chess', title: 'Rapid open', outcome: 'draw', date: '2026-11-08' }), show({ type: 'chess', title: 'League', outcome: 'loss', date: '2026-10-01' })];
    expect(chessEvents(games)).toEqual([
      { name: 'Rapid open', points: 1.5, games: 2, last: '2026-11-08' },
      { name: 'League', points: 0, games: 1, last: '2026-10-01' },
    ]);
  });

  it('compares how it went by readiness, nerves and sleep, only with enough on each side', () => {
    const list = [show({ ready: 5, nerves: 2, rating: 5, date: 'a' }), show({ ready: 4, nerves: 4, rating: 4, date: 'b' }), show({ ready: 2, nerves: 5, rating: 2, date: 'c' }), show({ ready: 3, nerves: 1, rating: 3, date: 'd' })];
    expect(readySplit(list)).toEqual({ hi: 4.5, lo: 2.5, nHi: 2, nLo: 2 });
    expect(nervesSplit(list)).toEqual({ hi: 3, lo: 4, nHi: 2, nLo: 2 });
    expect(readySplit(list.slice(0, 3))).toBeNull();
    const sleep: Record<string, number> = { a: 480, b: 500, c: 360, d: 400 };
    expect(sleepSplit(list, (d) => sleep[d] ?? null)).toEqual({ hi: 4.5, lo: 2.5, nHi: 2, nLo: 2 });
  });

  it('puts the big moments on the shelf, newest first', () => {
    const list = [
      show({ type: 'violin', date: '2026-06-01', result: 'Distinction' }),
      show({ type: 'test', date: '2026-11-05', pct: 99 }),
      show({ type: 'other', date: '2026-10-01', place: 2 }),
      show({ type: 'match', date: '2026-10-02', outcome: 'win', sets: [[25, 20], [25, 19]] }),
      show({ type: 'talk', date: '2026-09-01', rating: 3 }),
    ];
    expect(trophies(list).map((t) => [t.why, t.tier])).toEqual([
      ['Near perfect', 'gold'],
      ['Clean sweep', 'bronze'],
      ['Second place', 'silver'],
      ['Distinction', 'gold'],
    ]);
  });

  it('writes the line for Home', () => {
    expect(stageLine([], { title: 'Winter concert', date: '2026-11-14' }, '2026-11-11')).toBe('Winter concert in 3 days');
    expect(stageLine([], { title: 'BMO1', date: '2026-11-12' }, '2026-11-11')).toBe('BMO1 tomorrow');
    expect(stageLine([show({ date: '2026-11-02' })], null, '2026-11-11')).toBe('1 this month');
    expect(stageLine([], null, '2026-11-11')).toBe('Performances, tests, matches and races');
  });
});

describe('violin repertoire', () => {
  it('reads many past pieces at once', () => {
    const text = ['Bach — Partita No. 2, Gigue (2023)', '2. Vivaldi: Concerto in A minor, I 2021', '- Seitz - Student Concerto No. 2', 'Meditation from Thaïs', '', 'Kreisler – Liebesleid, 2024'].join('\n');
    expect(parseRepertoire(text, '2022')).toEqual([
      { composer: 'Bach', title: 'Partita No. 2, Gigue', year: '2023' },
      { composer: 'Vivaldi', title: 'Concerto in A minor, I', year: '2021' },
      { composer: 'Seitz', title: 'Student Concerto No. 2', year: '2022' },
      { composer: '', title: 'Meditation from Thaïs', year: '2022' },
      { composer: 'Kreisler', title: 'Liebesleid', year: '2024' },
    ]);
    // A title that is only a year-like number keeps it.
    expect(parseRepertoire('1812')).toEqual([{ composer: '', title: '1812', year: '' }]);
  });

  it('dates and sorts the repertoire', () => {
    const p = (title: string, composer: string, started: string, finished: string, archived = true) => ({ title, composer, started, finished, archived });
    expect(pieceYear(p('a', '', '2023-09', '2024-03'))).toBe(2024);
    expect(pieceYear(p('a', '', '2023', ''))).toBe(2023);
    expect(pieceSpan(p('a', '', '2023-09', '2024-03'))).toBe('Sep 2023 – Mar 2024');
    expect(pieceSpan(p('a', '', '2026-10', '', false))).toBe('since Oct 2026');
    const list = [p('Zigeunerweisen', 'Sarasate', '', '2025'), p('Bruch 1', 'Bruch', '2026-09', '', false), p('Old', '', '', ''), p('Partita', 'Bach', '2022', '2023')];
    expect(sortRepertoire(list, 'year').map((x) => x.title)).toEqual(['Bruch 1', 'Zigeunerweisen', 'Partita', 'Old']);
    expect(sortRepertoire(list, 'composer').map((x) => x.title)).toEqual(['Partita', 'Bruch 1', 'Zigeunerweisen', 'Old']);
    expect(sortRepertoire(list, 'title').map((x) => x.title)).toEqual(['Bruch 1', 'Old', 'Partita', 'Zigeunerweisen']);
  });
});
