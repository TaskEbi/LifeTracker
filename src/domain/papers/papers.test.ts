import { describe, expect, it } from 'vitest';
import type { LtRecord } from '../../data/types';
import { LAST_YEAR, TOPIC_BOOKLETS, UNITS } from './catalogue';
import { HARD, HARD_TOPICS } from './hard';
import {
  allPapers,
  bookletsOf,
  hardList,
  matchHard,
  newestForMocks,
  nextPaper,
  NO_FILTER,
  paperById,
  pickHard,
  shortSession,
  sortHard,
  topicCounts,
  typicalOf,
  unitProgress,
  papersOfUnit,
} from './model';
import { afterRetry, firstRetry, hardMarkOf, mistakeOf, paperMarkOf, retryOrder, whyCounts, type HardMark, type PaperMark } from './records';

const rec = (data: Record<string, unknown>, id = 'r'): LtRecord => ({
  id,
  section: 'study',
  kind: 'k',
  data,
  sort_order: 1,
  archived_at: null,
  created_at: '2026-11-01T00:00:00Z',
  updated_at: '',
  deleted_at: null,
});
const mark = (paper: string, over: Partial<PaperMark> = {}): [string, PaperMark] => [
  paper,
  {
    paper,
    done: '2026-11-10',
    score: null,
    outOf: null,
    minutes: null,
    mock: false,
    markId: null,
    ...over,
  },
];

describe('paper catalogue', () => {
  it('has every unit of the four subjects, nothing after the last year', () => {
    expect(UNITS.map((u) => u.code)).toEqual(expect.arrayContaining(['WPH11', 'WPH12', 'WPH13', 'WMA11', 'WMA12', 'WME01', 'WST01', 'WFM01', '9618/1', '9618/2', '9608/1']));
    for (const p of allPapers()) expect(p.year).toBeLessThanOrEqual(LAST_YEAR);
    expect(allPapers().length).toBeGreaterThan(500);
    expect(new Set(allPapers().map((p) => p.id)).size).toBe(allPapers().length);
  });

  it('builds Physics & Maths Tutor links and examiner reports', () => {
    const p = paperById('WPH11|January 2019')!;
    expect(p.qp).toBe('https://pmt.physicsandmathstutor.com/download/Physics/A-level/Past-Papers/Edexcel-IAL/2018-spec/Unit-1/QP/January%202019%20(IAL)%20QP.pdf');
    expect(p.ms).toContain('/MS/January%202019%20(IAL)%20MS.pdf');
    expect(p.er).toBe('https://edexcel-past-papers.vercel.app/alevels/Physics/2019%20january/Examiner-report%20(2018)/WPH11_01_pef_20190307.pdf');
    expect(paperById('WMA11|January 2019')!.qp).toContain('Maths/A-level/Papers/Edexcel-IAL/Pure/P1/QP/January%202019%20QP.pdf');
    expect(paperById('9618/2|June 2021 (v2)')!.short).toBe('Jun 2021 v2');
  });

  it('shortens session names', () => {
    expect(shortSession('January 2019')).toBe('Jan 2019');
    expect(shortSession('June 2013 (R)')).toBe('Jun 2013 (R)');
    expect(shortSession('Specimen (2015)')).toBe('Specimen 2015');
  });

  it('every hard question points at a real paper and topic', () => {
    for (const h of hardList()) {
      expect(h.paper, `${h.key}`).toBeDefined();
      expect(
        HARD_TOPICS.some((t) => t.id === h.t && t.unit === h.u),
        h.key,
      ).toBe(true);
      expect(h.s).not.toMatch(/2022|2023/);
    }
    expect(new Set(HARD.map((h) => `${h.u}|${h.s}|${h.q}`)).size).toBe(HARD.length);
  });

  it('booklets pair question papers with their mark schemes', () => {
    const u1 = bookletsOf('WPH11');
    expect(u1.length).toBeGreaterThan(10);
    expect(u1.some((b) => b.ms)).toBe(true);
    expect(TOPIC_BOOKLETS.every((t) => t.items.every((i) => i.qp.endsWith('.pdf')))).toBe(true);
  });

  it('gives usual timings', () => {
    expect(typicalOf('WPH12')).toEqual({ minutes: 90, marks: 80 });
    expect(typicalOf('WST01')).toEqual({ minutes: 90, marks: 75 });
    expect(typicalOf('WPH03')).toBeNull();
  });
});

describe('progress', () => {
  const u1 = papersOfUnit('WPH11');
  it('suggests the oldest real paper, skipping done and mock papers', () => {
    const marks = new Map([mark('WPH11|January 2019'), mark('WPH11|June 2019', { done: null, mock: true })]);
    expect(nextPaper(u1, marks)!.id).toBe('WPH11|October 2019');
    const prog = unitProgress(
      u1,
      new Map([mark('WPH11|January 2019', { score: 60, outOf: 80 }), mark('WPH11|October 2019', { score: 40, outOf: 80 }), mark('WPH11|June 2019', { done: null, mock: true })]),
    );
    expect(prog).toEqual({ done: 2, total: u1.length, avg: 63, kept: 1 });
  });

  it('keeps the newest papers for mocks', () => {
    const real = u1.filter((p) => !p.session.startsWith('Specimen'));
    const newest = real[real.length - 1];
    expect(newestForMocks(u1, new Map([mark(newest.id)]), 2)).toEqual(real.slice(-3, -1).map((p) => p.id));
  });

  it('reads paper rows defensively', () => {
    expect(
      paperMarkOf(
        rec({
          paper: 'WPH11|January 2019',
          done: '2026-11-10',
          score: 70,
          outOf: 0,
          mock: 'yes',
        }),
      ),
    ).toMatchObject({ outOf: null, mock: false, score: 70 });
    expect(paperMarkOf(rec({ done: '2026-11-10' }))).toBeNull();
  });
});

describe('hard questions', () => {
  const none = new Map<string, HardMark>();
  it('filters by unit, topic, level, search and state', () => {
    const all = hardList();
    expect(all.filter((h) => matchHard(h, NO_FILTER, none))).toHaveLength(all.length);
    const u2 = all.filter((h) => matchHard(h, { ...NO_FILTER, unit: 'WPH12' }, none));
    expect(u2.length).toBeGreaterThan(40);
    expect(u2.every((h) => h.u === 'WPH12')).toBe(true);
    expect(
      all
        .filter((h) => matchHard(h, { ...NO_FILTER, search: 'fireboat jan 2021' }, none))
        .map((h) => h.q)
        .sort(),
    ).toEqual(['Q14(a)', 'Q14(b)', 'Q14(c)']);
    const k = all[0].key;
    const marks = new Map<string, HardMark>([
      [
        k,
        {
          key: k,
          state: 'wrong',
          date: '2026-11-10',
          retry: firstRetry('2026-11-10'),
        },
      ],
    ]);
    expect(all.filter((h) => matchHard(h, { ...NO_FILTER, wrongOnly: true }, marks)).map((h) => h.key)).toEqual([k]);
    expect(sortHard(all)[0].tier).toBe(1);
  });

  it('counts topics and picks from the hardest open tier', () => {
    const c = topicCounts('WPH11', none);
    expect(c.find((t) => t.id === 'materials')!.total).toBeGreaterThan(10);
    const list = hardList().filter((h) => h.t === 'materials');
    const done = new Map(list.filter((h) => h.tier === 1).map((h): [string, HardMark] => [h.key, { key: h.key, state: 'done', date: '2026-11-10', retry: null }]));
    expect(pickHard(list, done, 0.5)!.tier).toBe(2);
    expect(pickHard([], none, 0.1)).toBeNull();
  });
});

describe('retries', () => {
  it('spaces retries 2, 7, 21 days and clears after the last', () => {
    const r0 = firstRetry('2026-11-10');
    expect(r0).toEqual({ step: 0, due: '2026-11-12' });
    const r1 = afterRetry(r0, true, '2026-11-12')!;
    expect(r1).toEqual({ step: 1, due: '2026-11-19' });
    expect(afterRetry(r1, false, '2026-11-19')).toEqual({
      step: 0,
      due: '2026-11-21',
    });
    const r2 = afterRetry(r1, true, '2026-11-19')!;
    expect(r2.due).toBe('2026-12-10');
    expect(afterRetry(r2, true, '2026-12-10')).toBeNull();
  });

  it('orders due and later, reads mistakes and counts reasons', () => {
    const m1 = mistakeOf(
      rec(
        {
          subject: 'Physics',
          paper: 'WPH12|June 2019',
          q: 'Q13',
          why: 'Units or sig figs',
          date: '2026-11-01',
          due: '2026-11-03',
          step: 0,
        },
        'a',
      ),
    )!;
    const m2 = mistakeOf(
      rec(
        {
          subject: 'Maths',
          q: 'Q5',
          why: 'nonsense',
          date: '2026-11-09',
          due: '2026-11-20',
        },
        'b',
      ),
    )!;
    const m3 = mistakeOf(
      rec(
        {
          subject: 'Maths',
          q: 'Q6',
          why: 'Units or sig figs',
          date: '2026-11-02',
          due: '2026-11-04',
          fixed: '2026-11-08',
        },
        'c',
      ),
    )!;
    expect(m2.why).toBe('Method');
    expect(m3.retry).toBeNull();
    const o = retryOrder([m2, m1, m3], '2026-11-10');
    expect(o.due.map((m) => m.id)).toEqual(['a']);
    expect(o.later.map((m) => m.id)).toEqual(['b']);
    expect(whyCounts([m1, m2, m3])[0]).toEqual({
      why: 'Units or sig figs',
      n: 2,
    });
    expect(
      hardMarkOf(
        rec({
          key: 'WPH11|January 2019|Q14',
          state: 'wrong',
          date: '2026-11-10',
          due: '2026-11-12',
        }),
      )!.retry,
    ).toEqual({ step: 0, due: '2026-11-12' });
    expect(hardMarkOf(rec({ key: 'x', state: 'maybe', date: '2026-11-10' }))).toBeNull();
  });
});
