import { describe, expect, it } from 'vitest';
import { clue, halve } from './aids';
import { apart, compassRound, COMPASS_N, fillMatch, further, gamePay, pairsBoard, pairsScore, PAIRS_N, type Pts } from './games';
import { COUNTRIES, country, makeQuestion, seeded } from './model';
import { QUEST_POOL, questsFor, EMPTY_TALLY } from './quests';
import { GOODS, ship, SHIPS, SUPPLIES } from './shop';
import { route, voyagePay } from './voyage';
import { doubloonGrants, streakLine, walletOf, type DayRec, type VoyageRec, type WalletIn } from './wallet';

const day = (date: string, ok: number, extra: Partial<DayRec> = {}): DayRec => ({ date, n: ok, ok, pts: ok * 15, best: 0, daily: null, by: {}, used: {}, games: {}, ...extra });
const base = (over: Partial<WalletIn> = {}): WalletIn => ({ days: [], stamps: new Map(), medals: [], voyages: [], buys: [], today: '2026-11-20', ...over });

describe('atlas shop: the goods', () => {
  it('has unique ids, a free ship and chart, and ships that get better', () => {
    expect(new Set(GOODS.map((g) => g.id)).size).toBe(GOODS.length);
    expect(SHIPS[0].price).toBe(0);
    for (let i = 1; i < SHIPS.length; i++) {
      expect(SHIPS[i].price).toBeGreaterThan(SHIPS[i - 1].price);
      expect(SHIPS[i].hull).toBeGreaterThanOrEqual(SHIPS[i - 1].hull);
      expect(SHIPS[i].bonus).toBeGreaterThan(SHIPS[i - 1].bonus);
    }
    expect(ship('nope').id).toBe('raft');
    expect(SUPPLIES.find((s) => s.id === 'anchor')!.max).toBe(2);
  });
});

describe('atlas wallet: Doubloons are derived', () => {
  it('pays a tenth of the day’s points (capped), the daily challenge, and stamps', () => {
    const w = walletOf(base({ days: [day('2026-11-19', 20), day('2026-11-20', 1000, { pts: 99999, daily: { ok: 12, n: 12, pts: 300 } })], stamps: new Map([['fr', '2026-11-19']]) }));
    const g = Object.fromEntries(w.grants.map((x) => [x.key, x.amount]));
    expect(g['db:day:2026-11-19']).toBe(30);
    expect(g['db:day:2026-11-20']).toBe(300);
    expect(g['db:daily:2026-11-20']).toBe(50);
    expect(g['db:stamp:fr']).toBe(20);
  });

  it('takes what was spent off the purse, and counts supplies bought less used', () => {
    const w = walletOf(
      base({
        days: [day('2026-11-20', 100, { used: { fifty: 2, glass: 1 } })],
        buys: [
          { id: 'a', item: 'fifty', n: 5, cost: 125, date: '2026-11-20' },
          { id: 'b', item: 'sloop', n: 1, cost: 250, date: '2026-11-20' },
          { id: 'c', item: 'glass', n: 1, cost: 15, date: '2026-11-20' },
        ],
      }),
    );
    expect(w.spent).toBe(390);
    expect(w.balance).toBe(w.earned - 390);
    expect(w.stock.fifty).toBe(3);
    expect(w.stock.glass).toBe(0);
    expect(w.owned.has('sloop')).toBe(true);
    expect(w.owned.has('raft')).toBe(true);
    expect(w.owned.has('galleon')).toBe(false);
  });

  it('pays medals by tier and deck, and flawless once', () => {
    const g = doubloonGrants(base({ medals: [{ id: 'm', deck: 'sub-australia-and-new-zealand', tier: 2, flawless: true, date: '2026-11-20' }] }));
    expect(g.filter((x) => x.kind === 'medal').map((x) => x.amount)).toEqual([12, 22, 30]);
  });

  it('pays only the first three voyages a day, more on a better ship and harder seas', () => {
    const v = (id: string, at: string, extra: Partial<VoyageRec> = {}): VoyageRec => ({ id, date: '2026-11-20', at, legs: 6, route: ['fr', 'es', 'pt', 'ma', 'dz', 'tn'], diff: 'normal', focus: 'mix', ship: 'raft', hull: 3, i: 6, ok: 6, log: [], done: true, sunk: false, ...extra });
    const g = doubloonGrants(base({ voyages: [v('d', 'T4'), v('a', 'T1'), v('b', 'T2'), v('c', 'T3')] }));
    expect(new Set(g.filter((x) => x.kind === 'voyage').map((x) => x.key.split(':')[2]))).toEqual(new Set(['a', 'b', 'c']));
    expect(voyagePay({ ok: 6, legs: 6, done: true, diff: 'normal' }, 0)).toEqual({ ports: 36, home: 27 });
    expect(voyagePay({ ok: 4, legs: 6, done: false, diff: 'expert' }, 0.5)).toEqual({ ports: 72, home: 0 });
  });
});

describe('atlas wallet: the streak and its anchors', () => {
  const good = (dates: string[]) => dates.map((d) => ({ date: d, ok: 12 }));
  it('counts days in a row, today still open', () => {
    expect(streakLine(good(['2026-11-18', '2026-11-19']), [], '2026-11-20').streak).toBe(2);
    expect(streakLine(good(['2026-11-18', '2026-11-19', '2026-11-20']), [], '2026-11-20').streak).toBe(3);
    expect(streakLine(good(['2026-11-17', '2026-11-19']), [], '2026-11-20').streak).toBe(1);
  });
  it('lets an anchor bought beforehand hold a missed day, used once', () => {
    const l = streakLine(good(['2026-11-16', '2026-11-17', '2026-11-19']), ['2026-11-15'], '2026-11-20');
    expect(l.streak).toBe(3);
    expect(l.used).toBe(1);
    expect(l.frozen).toEqual(['2026-11-18']);
    // one bought after the miss can't reach back
    expect(streakLine(good(['2026-11-16', '2026-11-17', '2026-11-19']), ['2026-11-19'], '2026-11-20').streak).toBe(1);
  });
  it('pays a streak milestone on the day it is reached, and uses up anchors in the purse', () => {
    const days = ['2026-11-14', '2026-11-15', '2026-11-16'].map((d) => day(d, 12));
    const w = walletOf(base({ days, buys: [{ id: 'x', item: 'anchor', n: 2, cost: 240, date: '2026-11-01' }] }));
    expect(w.grants.find((g) => g.kind === 'streak')).toMatchObject({ date: '2026-11-16', amount: 20 });
    // the 17th, 18th and 19th were missed: two anchors hold two days, the third breaks it
    expect(w.streak.used).toBe(2);
    expect(w.stock.anchor).toBe(0);
    expect(w.streak.streak).toBe(0);
  });
});

describe('atlas quests', () => {
  it('deals three a day from the three families, the same everywhere', () => {
    const q = questsFor('2026-11-20');
    expect(q).toHaveLength(3);
    expect(questsFor('2026-11-20').map((x) => x.id)).toEqual(q.map((x) => x.id));
    expect(new Set(QUEST_POOL.map((x) => x.id)).size).toBe(QUEST_POOL.length);
    expect(q.every((x) => x.of(EMPTY_TALLY) === 0)).toBe(true);
  });
  it('pays the quests the day’s row shows done, and the set', () => {
    const date = '2026-11-20';
    const by: Record<string, number> = { flag: 99, map: 99, cap: 99, typed: 99, review: 99, africa: 99, asia: 99, europe: 99, namerica: 99, samerica: 99, oceania: 99 };
    const games = Object.fromEntries(['round', 'sprint', 'survival', 'voyage', 'pairs'].map((k) => [k, { n: 1, best: 0, full: 0 }]));
    const d = day(date, 50, { best: 20, by, daily: { ok: 5, n: 12, pts: 50 }, games: { ...games, compass: { n: 1, best: 8, full: 0 }, fill: { n: 1, best: 25, full: 0 } } });
    const g = doubloonGrants(base({ days: [d], today: date })).filter((x) => x.kind === 'quest');
    expect(g).toHaveLength(4);
    expect(g.some((x) => x.key === `db:quests:${date}`)).toBe(true);
  });
});

describe('atlas voyages', () => {
  it('routes through distinct countries, each port near one passed before', () => {
    for (let s = 0; s < 20; s++) {
      const r = route(20, 'europe', seeded(`v${s}`));
      expect(r).toHaveLength(20);
      expect(new Set(r).size).toBe(20);
      expect(country(r[0]).cont).toBe('europe');
    }
  });
});

describe('atlas supplies', () => {
  it('fifty-fifty keeps the right answer and halves the rest; typing becomes four', () => {
    const rng = seeded('x');
    const q = makeQuestion('fr', 'flag-name', 'hard', 'europe', rng);
    const h = halve(q, rng);
    expect(h.options).toContain('fr');
    expect(h.options!.length).toBe(3);
    const t = halve(makeQuestion('fr', 'name-cap', 'expert', 'europe', rng), rng);
    expect(t.typed).toBe(false);
    expect(t.options).toHaveLength(4);
    expect(t.options).toContain('fr');
  });
  it('the spyglass gives a clue without the answer, and never drops the right one', () => {
    const rng = seeded('y');
    expect(clue(makeQuestion('jp', 'name-cap', 'expert', 'asia', rng)).text).toContain('“T”');
    const f = clue(makeQuestion('jp', 'name-flag', 'hard', 'asia', rng), rng);
    expect(f.drop).not.toBe('jp');
    const m = clue(makeQuestion('jp', 'name-map', 'hard', 'asia', rng), rng);
    expect(m.near).not.toBe('jp');
  });
});

describe('atlas mini-games', () => {
  it('deals six pairs, two cards each', () => {
    const b = pairsBoard(COUNTRIES.map((c) => c.id), 'flag-name', seeded('p'));
    expect(b).toHaveLength(PAIRS_N * 2);
    expect(new Set(b.map((c) => c.id)).size).toBe(PAIRS_N);
    expect(pairsScore(6, 0)).toBe(100);
    expect(pairsScore(10, 30)).toBe(78);
    expect(pairsScore(99, 999)).toBe(10);
  });
  it('asks compass questions with an answer beyond argument', () => {
    const pts: Pts = { no: [500, 35, 0, 460, 3, 540, 45], es: [470, 100, 0, 450, 90, 490, 112], jp: [820, 111, 0, 800, 81, 846, 152], cn: [760, 100, 0, 700, 60, 800, 140] };
    expect(apart(pts, 'no', 'es', 'north')).toBe(true);
    expect(further(pts, 'no', 'es', 'north')).toBe('no');
    expect(further(pts, 'no', 'es', 'south')).toBe('es');
    expect(apart(pts, 'jp', 'cn', 'north')).toBe(false);
    // a full round on made-up points
    const all: Pts = Object.fromEntries(COUNTRIES.map((c, i) => [c.id, [(i * 37) % 1000, (i * 53) % 435, 0, (i * 37) % 1000 - 2, (i * 53) % 435 - 2, (i * 37) % 1000 + 2, (i * 53) % 435 + 2]]));
    const r = compassRound(all, seeded('c'));
    expect(r).toHaveLength(COMPASS_N);
    for (const q of r) expect(further(all, q.a, q.b, q.dir)).toBe(q.answer);
  });
  it('fills the map from exact names only, as you type', () => {
    expect(fillMatch('fran', ['fr', 'de'], 'name')).toBeNull();
    expect(fillMatch('France', ['fr', 'de'], 'name')).toBe('fr');
    expect(fillMatch('holland', ['nl'], 'name')).toBe('nl');
    expect(fillMatch('berlin', ['fr', 'de'], 'cap')).toBe('de');
    expect(fillMatch('France', ['de'], 'name')).toBeNull();
  });
  it('pays a day’s best, capped', () => {
    expect(gamePay('pairs', { best: 100 })).toBe(25);
    expect(gamePay('compass', { best: 10 })).toBe(30);
    expect(gamePay('fill', { best: 195, full: 1 })).toBe(60);
    expect(gamePay('round', { best: 50 })).toBe(0);
  });
});
