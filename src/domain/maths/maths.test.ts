import { describe, expect, it } from 'vitest';
import type { LtRecord } from '../../data/types';
import { againOn, amcGuess, amcNeeded, amcScore, awaitingResult, bestAt, cameBack, CONTESTS, dueAgain, mathsXp, MATHS_XP, pace, percentOf, problemOf, roadOf, ROADS, SEASON_2026, sittingOf, sittingsOf, solvedOn, topicSpread, upcoming, weakestTopic, withAttempt, type Problem } from './model';

const rec = (id: string, kind: string, data: Record<string, unknown>): LtRecord => ({ id, section: 'maths', kind, data, sort_order: 0, archived_at: null, created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z', deleted_at: null });
const sit = (id: string, data: Record<string, unknown>) => rec(id, 'sitting', data);
const prob = (id: string, data: Record<string, unknown>) => rec(id, 'problem', data);

describe('contests', () => {
  it('has maximums that follow from each format', () => {
    const c = (id: string) => CONTESTS.find((x) => x.id === id)!;
    expect(c('amc12').max).toBe(c('amc12').questions * 6);
    expect(c('bmo1').max).toBe(c('bmo1').questions * 10);
    expect(c('bmo2').max).toBe(c('bmo2').questions * 10);
    expect(c('smc').max).toBe(125);
    expect(c('usamo').max).toBe(c('usamo').questions * 7);
  });

  it('works out the pace per question', () => {
    expect(pace({ minutes: 75, questions: 25 })).toBe('3 min');
    expect(pace({ minutes: 90, questions: 25 })).toBe('3 min 36 s');
    expect(pace({ minutes: 90, questions: 0 })).toBeNull();
  });

  it('starts the season with the score the user gave and dates in order', () => {
    expect(SEASON_2026.find((s) => s.contest === 'smc')?.score).toBe(112);
    const days = SEASON_2026.map((s) => s.date);
    expect([...days].sort()).toEqual(days);
  });
});

describe('AMC scoring', () => {
  it('scores right and blank answers', () => {
    expect(amcScore(25, 0)).toBe(150);
    expect(amcScore(0, 25)).toBe(37.5);
    expect(amcScore(15, 4)).toBe(96);
  });

  it('says when a guess beats a blank', () => {
    expect(amcGuess(5).advice).toBe('blank');
    expect(amcGuess(5).worth).toBeCloseTo(1.2);
    expect(amcGuess(4).advice).toBe('either');
    expect(amcGuess(3).advice).toBe('guess');
    expect(amcGuess(2).worth).toBe(3);
  });

  it('counts the questions needed for a score, the rest blank', () => {
    expect(amcNeeded(100)).toBe(14);
    expect(amcScore(14, 11)).toBeGreaterThanOrEqual(100);
    expect(amcScore(13, 12)).toBeLessThan(100);
    expect(amcNeeded(150)).toBe(25);
    expect(amcNeeded(151)).toBeNull();
    expect(amcNeeded(0)).toBe(0);
  });
});

describe('sittings', () => {
  const list = sittingsOf([
    sit('a', { contest: 'smc', label: 'SMC 2026', date: '2026-10-07', score: 112 }),
    sit('b', { contest: 'amc12', label: 'AMC 12B 2026', date: '2026-11-13' }),
    sit('c', { contest: 'bmo1', label: 'BMO1 2026', date: '2026-11-18' }),
    sit('d', { contest: 'bmo1', label: 'BMO1 2019', date: '2026-10-20', real: false, score: 31, marks: [10, 9, 7, 5, 0, null] }),
    sit('e', { contest: 'bmo2', label: 'BMO2 2027' }),
  ]);

  it('reads a record, filling in what the contest knows', () => {
    const s = sittingOf(sit('x', { contest: 'amc12' }))!;
    expect(s).toMatchObject({ contest: 'amc12', label: 'AMC 12', max: 150, real: true, date: null, score: null });
    expect(sittingOf(sit('y', { contest: 'nonsense' }))!.contest).toBe('other');
    expect(sittingOf({ ...sit('z', {}), deleted_at: '2026-10-01T00:00:00Z' })).toBeNull();
    expect(sittingOf(prob('p', {}))).toBeNull();
  });

  it('lists what is coming, soonest first, undated last', () => {
    expect(upcoming(list, '2026-11-03').map((s) => s.id)).toEqual(['b', 'c', 'e']);
    expect(upcoming(list, '2026-11-13')[0].id).toBe('b');
  });

  it('asks for a result only after the day has passed', () => {
    expect(awaitingResult(list, '2026-11-13')).toEqual([]);
    expect(awaitingResult(list, '2026-11-14').map((s) => s.id)).toEqual(['b']);
    expect(upcoming(list, '2026-11-14').map((s) => s.id)).toEqual(['c', 'e']);
  });

  it('finds bests, real or practice', () => {
    expect(bestAt(list, 'bmo1')?.id).toBe('d');
    expect(bestAt(list, 'bmo1', true)).toBeNull();
    expect(bestAt(list, 'smc', true)?.score).toBe(112);
    expect(percentOf(list[0])).toBe(89.6);
    expect(percentOf(list[1])).toBeNull();
  });

  it('walks each road: scored, booked, the next open, the rest ahead', () => {
    const uk = roadOf(ROADS[0].rungs, list);
    expect(uk.map((r) => [r.contest.id, r.state])).toEqual([['smc', 'done'], ['bmo1', 'booked'], ['bmo2', 'booked']]);
    const us = roadOf(ROADS[1].rungs, list);
    expect(us.map((r) => r.state)).toEqual(['booked', 'ahead', 'ahead']);
    const fresh = roadOf(ROADS[1].rungs, []);
    expect(fresh.map((r) => r.state)).toEqual(['open', 'ahead', 'ahead']);
    // a practice paper isn't a rung
    expect(roadOf(['bmo1'], sittingsOf([sit('p', { contest: 'bmo1', real: false, score: 40, date: '2026-10-01' })]))[0].state).toBe('open');
  });
});

describe('the notebook', () => {
  const p = (attempts: Problem['attempts'], topic: Problem['topic'] = 'Geometry'): Problem => ({ id: 'p', title: 'P', topic, statement: '', idea: '', attempts });

  it('brings stuck problems back sooner than hinted ones, and solved ones never', () => {
    expect(againOn(p([{ date: '2026-11-01', outcome: 'stuck' }]))).toBe('2026-11-08');
    expect(againOn(p([{ date: '2026-11-01', outcome: 'hint' }]))).toBe('2026-11-22');
    expect(againOn(p([{ date: '2026-11-01', outcome: 'clean' }]))).toBeNull();
    expect(againOn(p([]))).toBeNull();
  });

  it('lists what is due, the longest waiting first', () => {
    const a = { ...p([{ date: '2026-11-01', outcome: 'stuck' }]), id: 'a' };
    const b = { ...p([{ date: '2026-10-01', outcome: 'hint' }]), id: 'b' };
    const c = { ...p([{ date: '2026-11-07', outcome: 'stuck' }]), id: 'c' };
    expect(dueAgain([a, b, c], '2026-11-08').map((x) => x.id)).toEqual(['b', 'a']);
  });

  it('keeps one go a day and a bounded history', () => {
    const one = withAttempt([{ date: '2026-11-01', outcome: 'stuck' }], '2026-11-01', 'hint');
    expect(one).toEqual([{ date: '2026-11-01', outcome: 'hint' }]);
    let long: Problem['attempts'] = [];
    for (let i = 1; i <= 30; i++) long = withAttempt(long, `2026-10-${String(i).padStart(2, '0')}`, 'stuck');
    expect(long).toHaveLength(20);
    expect(long.at(-1)!.date).toBe('2026-10-30');
  });

  it('notices a problem solved after being stuck', () => {
    expect(cameBack(p([{ date: '2026-11-01', outcome: 'stuck' }, { date: '2026-11-08', outcome: 'clean' }]))).toBe(true);
    expect(cameBack(p([{ date: '2026-11-01', outcome: 'clean' }]))).toBe(false);
    expect(solvedOn(p([{ date: '2026-11-01', outcome: 'stuck' }, { date: '2026-11-08', outcome: 'clean' }, { date: '2026-11-09', outcome: 'hint' }]))).toBe('2026-11-08');
  });

  it('drops bad attempts when reading a record', () => {
    const r = problemOf(prob('p', { title: 'Q', topic: 'Knitting', attempts: [{ date: 'soon', outcome: 'clean' }, { date: '2026-11-01', outcome: 'maybe' }, { date: '2026-11-02', outcome: 'hint' }] }))!;
    expect(r.attempts).toEqual([{ date: '2026-11-02', outcome: 'hint' }]);
    expect(r.topic).toBeNull();
  });

  it('picks a topic to work on', () => {
    const rows = (a: [number, number], c: [number, number], g: [number, number], n: [number, number]) =>
      topicSpread([]).map((l, i) => ({ ...l, tried: [a, c, g, n][i][0], clean: [a, c, g, n][i][1] }));
    expect(weakestTopic(topicSpread([]))).toBeNull();
    expect(weakestTopic(rows([3, 3], [4, 1], [3, 2], [5, 5]))).toBe('Combinatorics');
    // something barely touched comes first
    expect(weakestTopic(rows([9, 1], [8, 8], [0, 0], [6, 6]))).toBe('Geometry');
  });
});

describe('XP', () => {
  it('pays once per marked paper, more for the real thing, and nothing before a score', () => {
    const xp = mathsXp([
      sit('a', { contest: 'smc', label: 'SMC 2026', date: '2026-10-07', score: 112 }),
      sit('b', { contest: 'amc12', date: '2026-11-13' }),
      sit('c', { contest: 'bmo1', label: 'BMO1 2019', date: '2026-10-20', real: false, score: 31 }),
    ]);
    expect(xp.map((x) => [x.key, x.xp])).toEqual([['maths:sitting:a', MATHS_XP.contest], ['maths:sitting:c', MATHS_XP.paper]]);
  });

  it('leaves older results out', () => {
    expect(mathsXp([sit('a', { contest: 'smc', date: '2025-10-01', score: 90 })])).toEqual([]);
    expect(mathsXp([prob('p', { title: 'Old', attempts: [{ date: '2026-09-30', outcome: 'clean' }] })])).toEqual([]);
  });

  it('pays for a problem the first time it is solved, up to a daily limit', () => {
    const day = '2026-11-01';
    const many = Array.from({ length: 5 }, (_, i) => prob(`p${i}`, { title: `P${i}`, attempts: [{ date: day, outcome: 'clean' }] }));
    expect(mathsXp(many)).toHaveLength(MATHS_XP.solvedPerDay);
    expect(mathsXp([prob('s', { attempts: [{ date: day, outcome: 'stuck' }] })])).toEqual([]);
    const later = mathsXp([prob('s', { title: 'S', attempts: [{ date: day, outcome: 'stuck' }, { date: '2026-11-08', outcome: 'clean' }] })]);
    expect(later).toEqual([expect.objectContaining({ key: 'maths:solved:s', date: '2026-11-08' })]);
  });
});
