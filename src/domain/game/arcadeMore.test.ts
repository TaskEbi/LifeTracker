import { describe, expect, it } from 'vitest';
import type { XpEvent } from '../progress/engine';
import { dayStats } from './arcade';
import {
  ballsFor,
  BALLS_A_DAY,
  boutsFor,
  CHUTES,
  codeFor,
  dojoOf,
  DOJO_TITLES,
  dropBall,
  dropRef,
  duelPrize,
  duelRef,
  heroOf,
  judge,
  MORE_FROM,
  moreOf,
  moreWaiting,
  pachiOf,
  parseDropRef,
  parseDuelRef,
  parseVaultRef,
  PIN_ROWS,
  playRound,
  pocketsFor,
  reelPrize,
  rivalOf,
  rivalStance,
  STANCES,
  startDuel,
  TRIPLE_PRIZE,
  VAULT_PRIZES,
  VAULT_SLOTS,
  VAULT_SYMBOLS,
  vaultOf,
  vaultPrize,
  vaultRef,
  withGrit,
  type Duel,
  type Stance,
} from './arcadeMore';
import { sellable, TITLES } from './catalog';
import type { EarnInput } from './earn';
import type { Tx } from './wallet';

const xp = (key: string, date: string, section: XpEvent['section'], n: number): XpEvent => ({ key, date, section, xp: n, reason: key });
const base = (over: Partial<EarnInput> = {}): EarnInput => ({ today: MORE_FROM, xp: [], achievements: [], quests: [], bosses: [], activeDays: [], streakDays: new Set(), bucket: [], rows: [], txs: [], ...over });
const tx = (type: Tx['type'], ref: string, at: string, id = `${type}:${ref}`): Tx => ({ id, type, ref, at, cost: {}, gain: {} });
const stats = (i: EarnInput) => dayStats(i.xp, '2026-11-09', i.today);

describe('pachinko', () => {
  it('pays balls for turning up and for XP, up to the daily cap', () => {
    expect(ballsFor(undefined, false)).toBe(0);
    expect(ballsFor(undefined, true)).toBe(2);
    const day = dayStats([xp('entry:a:logged', MORE_FROM, 'violin', 45)], MORE_FROM, MORE_FROM).get(MORE_FROM);
    expect(ballsFor(day, true)).toBe(5);
    const big = dayStats([xp('entry:a:logged', MORE_FROM, 'violin', 900)], MORE_FROM, MORE_FROM).get(MORE_FROM);
    expect(ballsFor(big, true)).toBe(BALLS_A_DAY);
  });

  it("moves the same seven pockets about each day, with one that spins the reels", () => {
    const a = pocketsFor('2026-11-15');
    expect(a).toHaveLength(CHUTES);
    expect(a.filter((p) => p.kind === 'reel')).toHaveLength(1);
    expect(pocketsFor('2026-11-15')).toEqual(a);
    const days = ['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19'].map((d) => pocketsFor(d).findIndex((p) => p.kind === 'reel'));
    expect(new Set([a.findIndex((p) => p.kind === 'reel'), ...days]).size).toBeGreaterThan(1);
  });

  it('a ball moves half a pocket a row, stays on the board and is the same every time', () => {
    for (let n = 1; n <= 300; n++) {
      const chute = n % CHUTES;
      const d = dropBall(n, chute, '2026-11-15');
      expect(d.path).toHaveLength(PIN_ROWS + 1);
      expect(d.path[0]).toBe(chute * 2);
      for (let i = 1; i < d.path.length; i++) {
        expect(Math.abs(d.path[i] - d.path[i - 1])).toBe(1);
        expect(d.path[i]).toBeGreaterThanOrEqual(0);
        expect(d.path[i]).toBeLessThanOrEqual((CHUTES - 1) * 2);
      }
      expect(d.pocket).toBe(d.path[PIN_ROWS] / 2);
      expect(Number.isInteger(d.pocket)).toBe(true);
      expect(dropBall(n, chute, '2026-11-15')).toEqual(d);
      expect(!!d.reels).toBe(d.hit.kind === 'reel');
      const back = parseDropRef(dropRef(d));
      expect(back).toMatchObject({ n, chute, pocket: d.pocket });
    }
  });

  it('the reels pay by what they show, and odds stay near what they should be', () => {
    const seen = { jackpot: 0, triple: 0, pair: 0, none: 0 };
    let spins = 0;
    for (let n = 1; n <= 6000; n++) {
      const d = dropBall(n, 3, '2026-11-15');
      if (!d.reels) continue;
      spins++;
      seen[d.reels.cls]++;
      const [a, b, c] = d.reels.faces;
      const same = (a === b ? 1 : 0) + (b === c ? 1 : 0) + (a === c ? 1 : 0);
      if (d.reels.cls === 'jackpot') expect(d.reels.faces).toEqual(['七', '七', '七']);
      if (d.reels.cls === 'triple') expect(same === 3 && a !== '七').toBe(true);
      if (d.reels.cls === 'pair') expect(same).toBe(1);
      if (d.reels.cls === 'none') expect(same).toBe(0);
      expect(d.gain).toEqual(reelPrize(d.reels));
    }
    expect(spins).toBeGreaterThan(800);
    expect(seen.pair / spins).toBeGreaterThan(0.28);
    expect(seen.pair / spins).toBeLessThan(0.42);
    expect((seen.jackpot + seen.triple) / spins).toBeLessThan(0.16);
    expect(TRIPLE_PRIZE['七'].items).toEqual(['title:lucky7']);
  });

  it('counts balls, spins and jackpots from the rows', () => {
    const s = pachiOf([tx('drop', 'drop:1:3:2:c', MORE_FROM), tx('drop', 'drop:2:3:4:j', MORE_FROM), tx('drop', 'drop:3:0:1:p', '2026-11-16'), tx('drop', 'nonsense', MORE_FROM)]);
    expect(s).toMatchObject({ balls: 3, spins: 2, jackpots: 1, triples: 0 });
    expect(s.usedByDay.get(MORE_FROM)).toBe(2);
  });
});

describe('the dojo', () => {
  it('gives challenges for active days', () => {
    expect(boutsFor(undefined, false)).toBe(0);
    expect(boutsFor(undefined, true)).toBe(2);
    const day = dayStats([xp('entry:a:logged', MORE_FROM, 'violin', 120)], MORE_FROM, MORE_FROM).get(MORE_FROM);
    expect(boutsFor(day, true)).toBe(3);
  });

  it('makes you stronger with levels, body levels and Mk, and with grit after losses', () => {
    const a = heroOf(10, 1, 1);
    expect(heroOf(20, 1, 1).hp).toBeGreaterThan(a.hp);
    expect(heroOf(20, 1, 1).atk).toBeGreaterThan(a.atk);
    expect(heroOf(10, 20, 1).hp).toBeGreaterThan(a.hp);
    expect(heroOf(10, 1, 3).atk).toBeGreaterThan(a.atk);
    expect(withGrit(a, 2).atk).toBe(Math.round(a.atk * 1.2));
    expect(withGrit(a, 99).atk).toBe(Math.round(a.atk * 1.5));
    expect(withGrit(a, 3).hp).toBe(a.hp);
  });

  it('rivals get harder floor by floor, masters every fifth, and never wear a hidden body', () => {
    for (let f = 1; f <= 120; f++) {
      const r = rivalOf(f);
      expect(r.master).toBe(f % 5 === 0);
      expect(r.body.unlock).toBeUndefined();
      expect(r.body.event).toBeUndefined();
      if (r.master) expect(['legendary', 'mythic']).toContain(r.body.rarity);
      if (f > 1 && !r.master && !rivalOf(f - 1).master) expect(r.hp).toBeGreaterThan(rivalOf(f - 1).hp);
      expect(rivalOf(f)).toEqual(r);
    }
  });

  it("a rival's stance is fixed by what has been played, favours its style and never comes three times running", () => {
    const rival = rivalOf(3);
    const counts: Record<Stance, number> = { strike: 0, guard: 0, feint: 0 };
    for (let n = 1; n <= 400; n++) {
      let d: Duel = startDuel(n, { hp: 100000, atk: 1 }, { ...rival, hp: 100000, atk: 1 });
      for (let k = 0; k < 12; k++) d = playRound(d, (['strike', 'guard', 'feint'] as Stance[])[(n + k) % 3], false);
      d.rounds.forEach((r, i) => {
        counts[r.theirs]++;
        if (i >= 2) expect(r.theirs === d.rounds[i - 1].theirs && r.theirs === d.rounds[i - 2].theirs).toBe(false);
      });
    }
    const total = counts.strike + counts.guard + counts.feint;
    expect(counts[rival.style] / total).toBeGreaterThan(0.38);
    expect(rivalStance(7, rival, [], [])).toBe(rivalStance(7, rival, [], []));
  });

  it('a round hits, hurts or clashes, kiai doubles one win, and the duel ends', () => {
    const rival = rivalOf(1);
    const hero = { hp: 60, atk: 10 };
    const start = startDuel(1, hero, rival);
    const theirs = rivalStance(1, rival, [], []);
    const beat = (Object.keys(STANCES) as Stance[]).find((s) => STANCES[s].beats === theirs)!;
    const lose = STANCES[theirs].beats;
    const win = playRound(start, beat, true);
    expect(win.rounds[0]).toMatchObject({ result: 'win', dealt: 20, taken: 0, kiai: true });
    expect(win.kiaiLeft).toBe(false);
    expect(playRound(start, beat, false).rounds[0].dealt).toBe(10);
    const lost = playRound(start, lose, true);
    expect(lost.rounds[0]).toMatchObject({ result: 'lose', dealt: 0, taken: rival.atk });
    expect(lost.kiaiLeft).toBe(false);
    const clash = playRound(start, theirs, false);
    expect(clash.rounds[0]).toMatchObject({ result: 'clash', dealt: 3, taken: Math.max(1, Math.floor(rival.atk / 3)) });
    expect(clash.kiaiLeft).toBe(true);
    // Kiai can't be used twice.
    let d = win;
    for (let i = 0; i < 200 && !d.over; i++) d = playRound(d, 'guard', true);
    expect(d.over).not.toBeNull();
    expect(d.rounds.filter((r) => r.kiai)).toHaveLength(1);
    expect(playRound(d, 'strike', false)).toBe(d);
  });

  it('the floor is one past the floors beaten, and losses there add grit', () => {
    expect(dojoOf([])).toMatchObject({ floor: 1, grit: 0, duels: 0 });
    const txs = [tx('duel', duelRef(1, 1, true, 5), MORE_FROM), tx('duel', duelRef(2, 2, false, 4), MORE_FROM), tx('duel', duelRef(3, 2, false, 6), '2026-11-16')];
    const s = dojoOf(txs);
    expect(s).toMatchObject({ floor: 2, grit: 2, wins: 1, losses: 2, duels: 3 });
    expect(s.recent[0]).toMatchObject({ n: 3, won: false });
    // The same floor won on two devices counts once.
    expect(dojoOf([...txs, tx('duel', duelRef(4, 1, true, 3), '2026-11-16')]).floor).toBe(2);
    expect(dojoOf([...txs, tx('duel', duelRef(4, 2, true, 3), '2026-11-16')])).toMatchObject({ floor: 3, grit: 0 });
    expect(parseDuelRef(duelRef(12, 30, true, 9))).toEqual({ n: 12, floor: 30, won: true, rounds: 9 });
  });

  it('masters pay a chest and Tama, and three of them a title', () => {
    expect(duelPrize(3)).toEqual({ coins: 54 });
    expect(duelPrize(5)).toMatchObject({ tickets: 1, chests: ['iron'] });
    expect(duelPrize(10)).toMatchObject({ chests: ['gold'], items: ['title:dojo10'] });
    expect(duelPrize(50).chests).toEqual(['mythic']);
    expect(duelPrize(200).coins).toBe(duelPrize(50).coins);
    for (const id of Object.values(DOJO_TITLES)) expect(TITLES.find((t) => t.id === id)).toBeTruthy();
  });
});

describe('the vault', () => {
  it("has one code a day, the same wherever it's asked for", () => {
    const c = codeFor('2026-11-15');
    expect(c).toHaveLength(VAULT_SLOTS);
    c.forEach((x) => expect(x >= 0 && x < VAULT_SYMBOLS.length).toBe(true));
    expect(codeFor('2026-11-15')).toEqual(c);
    const week = new Set(['2026-11-15', '2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19'].map((d) => codeFor(d).join('')));
    expect(week.size).toBeGreaterThan(2);
  });

  it('judges a guess: right place, wrong place, repeats counted once', () => {
    expect(judge([0, 1, 2, 3], [0, 1, 2, 3])).toEqual({ hit: 4, near: 0 });
    expect(judge([0, 1, 2, 3], [3, 2, 1, 0])).toEqual({ hit: 0, near: 4 });
    expect(judge([0, 0, 1, 2], [0, 3, 0, 0])).toEqual({ hit: 1, near: 1 });
    expect(judge([1, 1, 2, 2], [1, 2, 1, 5])).toEqual({ hit: 1, near: 2 });
    expect(judge([4, 4, 4, 4], [0, 1, 2, 3])).toEqual({ hit: 0, near: 0 });
  });

  it('pays more for fewer tries, and a little when it stays shut', () => {
    const worth = (n: number) => (vaultPrize(n).coins ?? 0) + 20 * (vaultPrize(n).gems ?? 0);
    expect(worth(1)).toBe(worth(3));
    expect(worth(3)).toBeGreaterThan(worth(4));
    expect(worth(5)).toBeGreaterThan(worth(6));
    expect(worth(6)).toBeGreaterThan(worth(7));
    expect(worth(7)).toBeGreaterThan(worth(8));
    expect(worth(8)).toBeGreaterThan(worth(0));
  });

  it("reads the results: today's, the best, and days running", () => {
    const txs = [tx('crack', vaultRef('2026-11-15', 5), '2026-11-15'), tx('crack', vaultRef('2026-11-16', 0), '2026-11-16'), tx('crack', vaultRef('2026-11-17', 4), '2026-11-17'), tx('crack', vaultRef('2026-11-18', 6), '2026-11-18')];
    expect(vaultOf(txs, '2026-11-18', true)).toMatchObject({ today: { tries: 6 }, cracked: 3, failed: 1, best: 4, run: 2 });
    expect(vaultOf(txs, '2026-11-19', false)).toMatchObject({ today: null, open: false, run: 2 });
    expect(vaultOf(txs, '2026-11-16', true)).toMatchObject({ today: { tries: 0 }, run: 0 });
    expect(parseVaultRef(vaultRef('2026-11-15', 0))).toEqual({ date: '2026-11-15', tries: 0 });
  });
});

describe('all three at once', () => {
  it('nothing before they opened pays, and banks go down as rows are written', () => {
    const before = base({ today: '2026-11-14', activeDays: ['2026-11-13', '2026-11-14'], xp: [xp('entry:a:logged', '2026-11-14', 'violin', 200)] });
    const m0 = moreOf(before, stats(before));
    expect(m0.balls.now).toBe(0);
    expect(m0.bouts.now).toBe(0);

    const i = base({ today: '2026-11-16', activeDays: [MORE_FROM, '2026-11-16'], xp: [xp('entry:a:logged', MORE_FROM, 'violin', 150), xp('entry:b:logged', '2026-11-16', 'coding', 30)] });
    const m = moreOf(i, stats(i));
    expect(m.balls).toEqual({ now: 12 + 4, today: 4 });
    expect(m.bouts).toEqual({ now: 3 + 2, today: 2 });
    expect(m.vault).toMatchObject({ open: true, today: null });
    expect(moreWaiting(m)).toBe(3);

    const played = { ...i, txs: [tx('drop', 'drop:1:3:2:c', '2026-11-16'), tx('duel', duelRef(1, 1, true, 4), '2026-11-16'), tx('crack', vaultRef('2026-11-16', 4), '2026-11-16')] };
    const m2 = moreOf(played, stats(played));
    expect(m2.balls.now).toBe(15);
    expect(m2.bouts.now).toBe(4);
    expect(m2.dojo.floor).toBe(2);
    expect(m2.vault.today).toEqual({ tries: 4 });
    expect(moreWaiting(m2)).toBe(2);
  });

  it('vault milestones wait until claimed', () => {
    const txs = Array.from({ length: 5 }, (_, k) => tx('crack', vaultRef(`2026-11-${15 + k}`, 4), `2026-11-${15 + k}`));
    const i = base({ today: '2026-11-19', txs });
    expect(moreOf(i, stats(i)).vaultToClaim).toEqual([5]);
    const j = { ...i, txs: [...txs, tx('claim', 'vaultbook:5', '2026-11-19')] };
    expect(moreOf(j, stats(j)).vaultToClaim).toEqual([]);
  });

  it('every title these games hand out exists and is never sold', () => {
    const ids = ['lucky7', ...Object.values(DOJO_TITLES), ...VAULT_PRIZES.flatMap((p) => (p.title ? [p.title] : []))];
    for (const id of ids) {
      const t = TITLES.find((x) => x.id === id);
      expect(t, id).toBeTruthy();
      expect(sellable(t!)).toBe(false);
    }
  });
});
