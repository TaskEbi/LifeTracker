import { describe, expect, it } from 'vitest';
import type { LtRecord } from '../../data/types';
import { schoolYear, suggestActivities } from './activities';
import { essayCount, essayOf, keepVersions, testOf, testSummary, uniOf, wordCount } from './model';
import { departures, futureXp, linksFor, roadmap, seasonWeek } from './plan';
import { defaultChecklist, presetDate, UNI_PRESETS } from './presets';

const T = '2026-10-31';
let n = 0;
const rec = (kind: string, data: Record<string, unknown>, extra: Partial<LtRecord> = {}): LtRecord => ({
  id: `r${++n}`, section: 'future', kind, data, sort_order: n, archived_at: null, created_at: `${T}T09:00:00Z`, updated_at: `${T}T09:00:00Z`, deleted_at: null, ...extra,
});

describe('future records', () => {
  it('reads a university and skips broken rows', () => {
    const u = uniOf(rec('uni', { name: 'MIT', country: 'US', plan: 'Early Action', deadline: '2027-11-01', tests: ['SAT'], status: 'nope', tier: 'reach' }))!;
    expect(u).toMatchObject({ name: 'MIT', country: 'US', status: 'researching', tier: 'reach', deadline: '2027-11-01', checked: false });
    expect(uniOf(rec('uni', { name: '' }))).toBeNull();
    expect(uniOf(rec('test', { name: 'MIT' }))).toBeNull();
    expect(uniOf(rec('uni', { name: 'X', deadline: '1 Nov' }))!.deadline).toBeNull();
  });

  it('summarises test scores: best official, best practice, latest', () => {
    const t = testOf(rec('test', { name: 'SAT', target: 1580, scores: [
      { date: '2026-11-01', score: 1490, official: false },
      { date: '2026-12-01', score: 1530, official: false },
      { date: '2027-03-08', score: 1550, official: true },
      { date: '2027-03-01', score: 'bad' },
    ] }))!;
    expect(t.scores).toHaveLength(3);
    const s = testSummary(t);
    expect(s.official?.score).toBe(1550);
    expect(s.practice?.score).toBe(1530);
    expect(s.last?.date).toBe('2027-03-08');
  });

  it('counts essays against their limit; UCAS by characters with three parts of 350+', () => {
    expect(wordCount('  one two\nthree  ')).toBe(3);
    const common = essayOf(rec('essay', { kind: 'common', parts: ['word '.repeat(700)] }))!;
    expect(essayCount(common)).toMatchObject({ used: 700, over: true, left: -50 });
    const ucas = essayOf(rec('essay', { kind: 'ucas', parts: ['a'.repeat(400), 'b'.repeat(100)] }))!;
    expect(ucas.parts).toHaveLength(3);
    expect(essayCount(ucas)).toMatchObject({ used: 500, over: false, shortParts: [1, 2] });
  });

  it('keeps the newest versions that fit', () => {
    const v = (d: number, len: number) => ({ at: `2026-11-0${d}T00:00:00Z`, text: 'x'.repeat(len) });
    const kept = keepVersions([v(1, 100), v(2, 100), v(3, 9000), v(4, 9000), v(5, 9000)], 5, 20_000);
    expect(kept.map((k) => k.at.slice(8, 10))).toEqual(['05', '04']);
  });
});

describe('the departure board', () => {
  it('lists dated things soonest first with a status', () => {
    const recs = [
      rec('uni', { name: 'MIT', plan: 'EA', deadline: '2026-11-10', status: 'applying' }),
      rec('uni', { name: 'Cambridge', plan: 'UCAS', deadline: '2026-10-20', status: 'applying' }),
      rec('uni', { name: 'Harvard', plan: 'REA', deadline: '2026-11-02', status: 'submitted' }),
      rec('test', { name: 'SAT', sittings: [{ date: '2026-12-05', registered: false }] }),
      rec('uni', { name: 'Yale', plan: 'RD', deadline: '2026-11-03', status: 'rejected' }),
    ];
    const d = departures(recs, T);
    expect(d.map((x) => [x.dest, x.status])).toEqual([
      ['Cambridge', 'delayed'],
      ['Harvard', 'departed'],
      ['Yale', 'cancelled'],
      ['MIT', 'boarding'],
      ['SAT', 'on time'],
    ]);
    expect(d[4].via).toBe('Sitting · not registered');
  });
});

describe('calendar links and reminders', () => {
  it('a university gets its deadline and interview, and a reminder two weeks before until it is sent', () => {
    const r = rec('uni', { name: 'Oxford', plan: 'UCAS', deadline: '2027-10-15', interview: '2027-12-08', status: 'applying' });
    // a year out: the events now, the reminders only once they're within 45 days
    expect(linksFor(r, T)).toMatchObject({ tasks: [] });
    expect(linksFor(r, T).events).toHaveLength(2);
    const l = linksFor(r, '2027-10-20');
    expect(l.events.map((e) => [e.key, e.date, e.kind])).toEqual([['deadline', '2027-10-15', 'other'], ['interview', '2027-12-08', 'other']]);
    expect(l.tasks.map((t) => [t.key, t.due])).toEqual([['interview', '2027-12-01']]);
    const early = linksFor(r, '2027-09-10');
    expect(early.tasks.map((t) => [t.key, t.due])).toEqual([['deadline', '2027-10-01']]);
    expect(linksFor({ ...r, data: { ...r.data, status: 'submitted' } }, '2027-10-20').tasks.map((t) => t.key)).toEqual(['interview']);
    expect(linksFor({ ...r, data: { ...r.data, status: 'rejected' } }, T)).toEqual({ events: [], tasks: [] });
  });

  it('a test sitting is an exam with a reminder to register six weeks before, never in the past', () => {
    const r = rec('test', { name: 'SAT', sittings: [{ date: '2026-11-20', registered: false }, { date: '2027-03-13', registered: true }] });
    const l = linksFor(r, T);
    expect(l.events.map((e) => e.kind)).toEqual(['exam', 'exam']);
    expect(l.tasks).toEqual([{ key: 'register:2026-11-20', title: 'Register for the SAT (2026-11-20)', due: T }]);
  });
});

describe('roadmap, XP and the season', () => {
  it('lays out the usual cycle for the entry year, with the user’s dates in it', () => {
    const r = roadmap(2028, [rec('uni', { name: 'MIT', plan: 'EA', deadline: '2027-11-01' })], T);
    expect(r.find((s) => s.title.startsWith('UCAS deadline: Oxford'))).toMatchObject({ date: '2027-10-15', typical: true });
    expect(r.find((s) => s.kind === 'uni')).toMatchObject({ date: '2027-11-01', typical: false });
    expect(r.at(-1)!.date).toBe('2028-09-01');
  });

  it('awards milestones once, on the day they happened', () => {
    const xp = futureXp([
      rec('uni', { name: 'MIT', status: 'offer', statusAt: { submitted: '2027-10-30', offer: '2027-12-14' } }),
      rec('test', { name: 'SAT', scores: [{ date: '2027-03-08', score: 1550, official: true }, { date: '2027-06-01', score: 1590, official: true }] }),
      rec('essay', { kind: 'common', status: 'final', statusAt: { final: '2027-09-20' } }),
      rec('program', { name: 'RSI', statusAt: { accepted: '2027-04-01' } }),
      rec('uni', { name: 'Yale', status: 'researching' }),
    ]);
    expect(xp.map((x) => [x.reason, x.date, x.xp])).toEqual([
      ['Application sent: MIT', '2027-10-30', 100],
      ['Offer from MIT', '2027-12-14', 200],
      ['SAT taken: 1550', '2027-03-08', 50],
      ['Essay finished: Common App personal essay', '2027-09-20', 40],
      ['Accepted: RSI', '2027-04-01', 60],
    ]);
  });

  it('suggests more time near a deadline', () => {
    const far = [rec('uni', { name: 'MIT', deadline: '2027-11-01' })];
    expect(seasonWeek(300, far, T)).toEqual({ minutes: 300, reason: null });
    expect(seasonWeek(300, [rec('uni', { name: 'MIT', deadline: '2026-12-10' })], T)).toEqual({ minutes: 450, reason: 'MIT in 6 weeks' });
    expect(seasonWeek(300, [rec('uni', { name: 'MIT', deadline: '2026-11-14' })], T)).toEqual({ minutes: 600, reason: 'MIT in 14 days' });
  });
});

describe('presets and activities', () => {
  it('turns usual dates into the right cycle', () => {
    expect(presetDate('10-15', 2028)).toBe('2027-10-15');
    expect(presetDate('+01-14', 2028)).toBe('2028-01-14');
    expect(UNI_PRESETS.every((u) => /^\+?\d{2}-\d{2}$/.test(u.deadline))).toBe(true);
    expect(defaultChecklist('UK', ['TMUA']).map((c) => c.label)).toContain('TMUA score sent');
  });

  it('places days in UK school years for a 2028 start', () => {
    expect(schoolYear('2026-10-31', 2028)).toBe(12);
    expect(schoolYear('2027-09-10', 2028)).toBe(13);
    expect(schoolYear('2025-09-10', 2028)).toBe(11);
    expect(schoolYear('2020-01-01', 2028)).toBeNull();
  });

  it('suggests activities from real logged weeks, not ones already on the list', () => {
    const weeks = (section: string, k: number, minutes: number, sport?: string) =>
      Array.from({ length: k }, (_, i) => ({ section, date: `2026-${String(10 - Math.floor(i / 4)).padStart(2, '0')}-${String(1 + (i % 4) * 7).padStart(2, '0')}`, minutes, sport }));
    const s = [...weeks('violin', 8, 300), ...weeks('sports', 6, 120, 'running'), ...weeks('chess', 2, 60), ...weeks('study', 10, 600)];
    const out = suggestActivities(s, [{ title: 'City half marathon', date: '2026-10-12', section: 'sports', kind: 'competition' }, { title: 'Recital', date: '2026-09-20', section: 'violin', kind: 'performance' }], T, 2028, [{ source: 'running', title: 'Running' }]);
    expect(out.map((a) => a.key)).toEqual(['violin', 'event:City half marathon:2026-10-12']);
    expect(out[0]).toMatchObject({ hoursPerWeek: 5, weeksPerYear: 8, years: [12], desc: 'Solo and orchestral playing; 1 performance in the last year' });
    expect(out[1].type).toBe('honor');
  });
});
