import { describe, expect, it } from 'vitest';
import { addDays } from '../log/dates';
import type { XpEvent } from '../progress/engine';
import {
  ARCADE_FROM,
  arcadeOf,
  bankOf,
  biteFor,
  biting,
  BOARD,
  boardOf,
  bingoCard,
  bingoState,
  catchPay,
  castRef,
  castsFor,
  dayStats,
  diceFor,
  FISH,
  fishById,
  LINES,
  parseCastRef,
  parseRollRef,
  pondOf,
  rollDie,
  rollRef,
} from './arcade';
import { sellable, TITLES } from './catalog';
import type { EarnInput } from './earn';
import type { Tx } from './wallet';

const xp = (key: string, date: string, section: XpEvent['section'], n: number): XpEvent => ({ key, date, section, xp: n, reason: key });
const base = (over: Partial<EarnInput> = {}): EarnInput => ({
  today: '2026-11-11',
  xp: [],
  achievements: [],
  quests: [],
  bosses: [],
  activeDays: [],
  streakDays: new Set(),
  bucket: [],
  rows: [],
  txs: [],
  ...over,
});
const tx = (type: Tx['type'], ref: string, at: string, id = `${type}:${ref}`): Tx => ({ id, type, ref, at, cost: {}, gain: {} });

describe('day stats and banks', () => {
  it('reads sessions, tasks and nights from the XP keys', () => {
    const d = '2026-11-10';
    const s = dayStats(
      [xp('entry:a:time', d, 'violin', 30), xp('entry:a:logged', d, 'violin', 10), xp('entry:b:gym', d, 'gym', 40), xp('task:t', d, 'general', 5), xp('night:x:logged', d, 'sleep', 10), xp('item:scroll', d, 'general', 100)],
      d,
      d,
    ).get(d)!;
    expect(s.xp).toBe(95);
    expect(s.sessions.get('violin')).toBe(1);
    expect(s.sessions.get('gym')).toBe(1);
    expect(s.tasks).toBe(1);
    expect(s.night).toBe(true);
    expect([...s.sections].sort()).toEqual(['gym', 'sleep', 'violin']);
  });

  it('pays dice and casts only on active days', () => {
    const s = dayStats([xp('entry:a:time', '2026-11-10', 'violin', 130)], '2026-11-10', '2026-11-10').get('2026-11-10');
    expect(diceFor(s, false)).toBe(0);
    expect(diceFor(s, true)).toBe(2);
    expect(castsFor(s, true)).toBe(4);
    expect(castsFor(undefined, true)).toBe(1);
  });

  it('caps a bank and never goes below zero', () => {
    const earned = new Map([
      [ARCADE_FROM, 10],
      [addDays(ARCADE_FROM, 1), 10],
    ]);
    expect(bankOf(earned, new Map(), addDays(ARCADE_FROM, 1), 12).now).toBe(12);
    expect(bankOf(earned, new Map([[addDays(ARCADE_FROM, 1), 30]]), addDays(ARCADE_FROM, 1), 12).now).toBe(0);
  });
});

describe('bingo', () => {
  it('deals the same 16 different cells for a week, with a golden one', () => {
    const a = bingoCard('2026-11-16', []);
    const b = bingoCard('2026-11-16', []);
    expect(a.cells.map((c) => c.id)).toEqual(b.cells.map((c) => c.id));
    expect(new Set(a.cells.map((c) => c.id)).size).toBe(16);
    expect(a.gold).toBeGreaterThanOrEqual(0);
    expect(a.gold).toBeLessThan(16);
    expect(bingoCard('2026-11-23', []).cells.map((c) => c.id)).not.toEqual(a.cells.map((c) => c.id));
  });

  it('asks for sections you have been doing, never ones you have not', () => {
    const before = Array.from({ length: 12 }, (_, i) => xp(`entry:v${i}:logged`, addDays('2026-11-16', -1 - i), 'violin', 10));
    const card = bingoCard('2026-11-16', before);
    const secs = card.cells.filter((c) => c.section).map((c) => c.section);
    expect(secs).toEqual(['violin']);
    expect(card.cells.find((c) => c.section === 'violin')!.goal).toBe(2);
  });

  it('has ten lines and marks cells and lines from the week', () => {
    expect(LINES).toHaveLength(10);
    const monday = '2026-11-09';
    const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
    const lots: XpEvent[] = days.flatMap((d, i) => [
      ...(['violin', 'coding', 'study', 'gym', 'chess'] as const).flatMap((s) => [xp(`entry:${s}${i}:logged`, d, s, 10), xp(`entry:${s}${i}:time`, d, s, 30)]),
      xp(`task:a${i}`, d, 'general', 5),
      xp(`night:${d}:logged`, d, 'sleep', 10),
      xp(`night:${d}:bedtime`, d, 'sleep', 10),
      xp(`screen:${d}:under`, d, 'screen', 10),
      xp(`quest:daily:${d}:q`, d, 'quests', 10),
      xp(`boss:${monday}`, d, 'general', 1),
    ]);
    const s = bingoState(monday, base({ today: '2026-11-15', xp: lots, activeDays: days, rows: days.map((d) => ({ id: d, kind: 'hq_checkin', day: d, data: {} })) }));
    expect(s.full).toBe(true);
    expect(s.toClaim).toHaveLength(11);
    const claimed = bingoState(monday, base({ today: '2026-11-15', xp: lots, activeDays: days, rows: [], txs: [tx('claim', `bingo:${monday}:0`, '2026-11-15')] }));
    expect(claimed.lines[0].claimed).toBe(true);
  });
});

describe('sugoroku', () => {
  it('has 32 squares, Start first, and wind never lands on wind', () => {
    expect(BOARD).toHaveLength(32);
    expect(BOARD[0].kind).toBe('start');
    BOARD.forEach((t, i) => {
      if (t.kind === 'wind') expect(BOARD[(i + t.jump!) % 32].kind).not.toBe('wind');
    });
  });

  it('rolls the same die for the same roll number and pays a lap', () => {
    const a = rollDie(7, 30, 0, ['violin']);
    expect(rollDie(7, 30, 0, ['violin'])).toEqual(a);
    expect(a.value).toBeGreaterThanOrEqual(1);
    expect(a.value).toBeLessThanOrEqual(6);
    expect(a.passedStart).toBe(true);
    expect(a.lap).toBe(1);
    expect(a.gain.gems).toBeGreaterThanOrEqual(25);
  });

  it('reads the board back from the rolls, whatever order they come in', () => {
    const r1 = rollDie(1, 0, 0, []);
    const r2 = rollDie(2, r1.to, r1.lap, []);
    const txs = [tx('roll', rollRef(r2), '2026-11-10', 'b'), tx('roll', rollRef(r1), '2026-11-10', 'a')];
    const b = boardOf(txs);
    expect(b.pos).toBe(r2.to);
    expect(b.rolls).toBe(2);
    expect(parseRollRef(rollRef(r2))).toEqual({ n: 2, value: r2.value, to: r2.to, lap: r2.lap });
  });

  it('every die face turns up across many rolls', () => {
    const seen = new Set(Array.from({ length: 200 }, (_, i) => rollDie(i + 1, 0, 0, []).value));
    expect(seen.size).toBe(6);
  });
});

describe('the pond', () => {
  it('lets night fish bite only at night and spirit fish only on their day', () => {
    const day = biting({ hour: 12, month: 11, sections: [] }).map((f) => f.id);
    const night = biting({ hour: 22, month: 11, sections: ['violin'] }).map((f) => f.id);
    expect(day).not.toContain('ryugu');
    expect(night).toContain('ryugu');
    expect(day).not.toContain('trebla');
    expect(night).toContain('trebla');
    expect(day).toContain('sanma');
    expect(biting({ hour: 12, month: 5, sections: [] }).map((f) => f.id)).not.toContain('sanma');
  });

  it('hooks the same fish for the same cast and keeps sizes in range', () => {
    const ctx = { hour: 12, month: 11, sections: ['coding' as const] };
    expect(biteFor(3, ctx)).toEqual(biteFor(3, ctx));
    for (let n = 1; n < 300; n++) {
      const b = biteFor(n, ctx);
      expect(b.cm).toBeGreaterThanOrEqual(b.fish.cm[0]);
      expect(b.cm).toBeLessThanOrEqual(b.fish.cm[1]);
      expect(biting(ctx)).toContain(b.fish);
    }
  });

  it('mostly hooks commons', () => {
    const ctx = { hour: 12, month: 11, sections: [] };
    const n = Array.from({ length: 1000 }, (_, i) => biteFor(i + 1, ctx).fish.rarity).filter((r) => r === 'common').length;
    expect(n).toBeGreaterThan(450);
    expect(n).toBeLessThan(700);
  });

  it('pays more for rarer and bigger fish, and Tama the first time', () => {
    const koi = fishById('koi')!;
    const funa = fishById('funa')!;
    expect(catchPay(koi, 90, false, false).coins!).toBeGreaterThan(catchPay(koi, 40, false, false).coins!);
    expect(catchPay(koi, 40, false, false).coins!).toBeGreaterThan(catchPay(funa, 25, false, false).coins!);
    expect(catchPay(funa, 20, false, true).gems).toBe(2);
    expect(catchPay(funa, 20, true, false).coins!).toBeGreaterThan(catchPay(funa, 20, false, false).coins!);
  });

  it('builds the fish book from casts', () => {
    const txs = [tx('cast', castRef(1, 'funa', 12.5, false), '2026-11-10'), tx('cast', castRef(2, 'funa', 20, true), '2026-11-10'), tx('cast', castRef(3, null, 0, false), '2026-11-11')];
    const p = pondOf(txs);
    expect(p.casts).toBe(3);
    expect(p.caught).toBe(2);
    expect(p.escaped).toBe(1);
    expect(p.book.get('funa')).toMatchObject({ caught: 2, best: 20, first: '2026-11-10' });
    expect(parseCastRef(castRef(9, 'koi', 55.5, true))).toEqual({ n: 9, fish: 'koi', cm: 55.5, perfect: true });
    expect(new Set(FISH.map((f) => f.id)).size).toBe(FISH.length);
  });
});

describe('the arcade as a whole', () => {
  it('fills the banks from active days and spends them with rows', () => {
    const d = ARCADE_FROM;
    const input = base({ today: addDays(d, 1), xp: [xp('entry:a:time', d, 'violin', 80)], activeDays: [d] });
    const a = arcadeOf(input);
    expect(a.dice.now).toBe(1);
    expect(a.casts.now).toBe(3);
    const roll = rollDie(1, 0, 0, []);
    const spent = arcadeOf({ ...input, txs: [tx('roll', rollRef(roll), d), tx('cast', castRef(1, 'funa', 12, false), d)] });
    expect(spent.dice.now).toBe(0);
    // Landing on a pond square hands over two casts.
    expect(spent.casts.now).toBe(2 + (roll.tile.kind === 'pond' ? 2 : 0));
  });

  it('keeps arcade titles out of the shop', () => {
    for (const id of ['angler', 'pondlord', 'bingo', 'sugoroku']) {
      const t = TITLES.find((x) => x.id === id)!;
      expect(sellable(t)).toBe(false);
    }
  });
});
