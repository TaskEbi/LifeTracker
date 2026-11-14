import { describe, expect, it } from 'vitest';
import { capsulePool, CHASSIS, chassisCost, CONSUMABLES, cosmeticLists, MAT_IDS, RARITY, SPIN_ODDS, TITLES, UPGRADES, type Bag, type CosmeticKind, type Rarity } from './catalog';
import { bountiesFor, bountyBoard, dayBonus, GAME_FROM, grantsFor, type EarnInput } from './earn';
import { eventOn, eventRunsUpTo, EVENTS, eventStock, nextEvent, runLength, tokenRate, trackOf } from './events';
import { hash32, rollChest, rollSpin } from './loot';
import { dailyDeal, discounted, weeklyStock } from './shop';
import { canAfford, chassisMk, normaliseLoadout, shortfall, spinsSinceEpic, txOf, upgradeLevel, walletOf, type Grant, type Tx } from './wallet';
import { STAGES, type XpEvent } from '../progress/engine';

const xp = (key: string, date: string, section: XpEvent['section'], n: number): XpEvent => ({ key, date, section, xp: n, reason: key });

const base = (over: Partial<EarnInput> = {}): EarnInput => ({
  today: '2026-11-04',
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

const tx = (type: Tx['type'], ref: string, at: string, cost: Bag = {}, gain: Bag = {}, id = `${type}:${ref}:${at}`): Tx => ({ id, type, ref, at, cost, gain });

const sum = (gs: Grant[], f: (b: Bag) => number | undefined) => gs.reduce((n, g) => n + (f(g.gain) ?? 0), 0);

describe('catalogue', () => {
  it('has unique ids and consistent event links', () => {
    const ids = CHASSIS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(CHASSIS.length).toBeGreaterThanOrEqual(40);
    for (const kind of ['paint', 'hat', 'pet', 'aura', 'title'] as CosmeticKind[]) {
      const list = cosmeticLists[kind].map((x) => x.id);
      expect(new Set(list).size).toBe(list.length);
    }
    for (const e of EVENTS) {
      const ch = CHASSIS.find((c) => c.id === e.chassis);
      expect(ch?.event).toBe(e.id);
      for (const [k, id] of [['hat', e.hat], ['pet', e.pet], ['aura', e.aura], ['paint', e.paint]] as [CosmeticKind, string][]) {
        const it = cosmeticLists[k].find((x) => x.id === id) as { event?: string } | undefined;
        expect(it?.event, `${e.id} ${k}`).toBe(e.id);
      }
    }
  });

  it('prices every Mk, and each Mk costs more', () => {
    for (const ch of CHASSIS.filter((c) => !c.event)) {
      const [a, b, c] = ([1, 2, 3] as const).map((m) => chassisCost(ch, m));
      expect(a.coins).toBeGreaterThan(0);
      expect(b.coins!).toBeGreaterThan(a.coins!);
      expect(c.coins!).toBeGreaterThan(b.coins!);
    }
  });

  it('tributes need their own section, one chassis per section', () => {
    const tributes = CHASSIS.filter((c) => c.group === 'tribute');
    expect(tributes.map((c) => c.section).sort()).toEqual([...MAT_IDS].sort());
    for (const t of tributes) expect(Object.keys(chassisCost(t, 1).mats!)).toEqual([t.section]);
  });

  it('every section\'s material is needed by something', () => {
    const used = new Set<string>();
    for (const u of UPGRADES) for (const c of u.costs) for (const s of Object.keys(c.mats ?? {})) used.add(s);
    for (const c of CHASSIS) for (const s of c.mats ?? []) used.add(s);
    expect([...used].sort()).toEqual([...MAT_IDS].sort());
  });

  it('the capsule pool has no event things and no titles you have to earn', () => {
    const pool = capsulePool();
    expect(pool.length).toBeGreaterThan(40);
    for (const p of pool) {
      const [kind, id] = p.item.split(':');
      const e = cosmeticLists[kind as CosmeticKind].find((x) => x.id === id) as { event?: string };
      expect(e.event).toBeUndefined();
    }
    const earned = TITLES.filter((t) => t.level || t.section).map((t) => `title:${t.id}`);
    expect(pool.some((p) => earned.includes(p.item))).toBe(false);
  });

  it('the odds on the front of the machine add up to 100', () => {
    expect(Object.values(SPIN_ODDS).reduce((a, b) => a + b, 0)).toBeCloseTo(100);
  });
});

describe('grants', () => {
  it('turns XP into coins and section materials, from the game start on', () => {
    const gs = grantsFor(
      base({
        xp: [xp('entry:a:time', '2026-11-03', 'violin', 20), xp('entry:a:logged', '2026-11-03', 'violin', 10), xp('old', '2026-09-01', 'violin', 500)],
      }),
    );
    const day = gs.find((g) => g.key === 'day:2026-11-03')!;
    // a Tuesday: no weekend bonus; 30 XP is 3 rosin (violin isn't one of the event's doubled materials)
    const expected = Math.round(30 * (1 + dayBonus('2026-11-03', []).pct));
    expect(day.gain.coins).toBe(expected);
    expect(day.gain.mats?.violin).toBe(3);
  });

  it('doubles the materials an event boosts', () => {
    const gs = grantsFor(base({ xp: [xp('x', '2026-11-03', 'maths', 30), xp('y', '2026-11-03', 'gym', 30)] }));
    const day = gs.find((g) => g.key === 'day:2026-11-03')!;
    expect(day.gain.mats?.maths).toBe(6);
    expect(day.gain.mats?.gym).toBe(3);
  });

  it('pays nothing for XP before GAME_FROM and ignores XP from items', () => {
    const gs = grantsFor(base({ xp: [xp('x', '2026-09-30', 'gym', 100), xp('item:1', '2026-11-03', 'quests', 500)] }));
    expect(gs.filter((g) => g.source === 'training')).toHaveLength(0);
    expect(GAME_FROM).toBe('2026-10-01');
  });

  it('gives each key once, whatever arrives twice', () => {
    const e = base({ achievements: [{ id: 'a', title: 'A', tier: 'gold', unlockedOn: '2026-10-05' }, { id: 'a', title: 'A', tier: 'gold', unlockedOn: '2026-10-05' }] });
    expect(sum(grantsFor(e), (b) => b.gems)).toBe(15);
  });

  it('emblems pay by tier, and platinum adds a gold chest', () => {
    const gs = grantsFor(base({ achievements: [{ id: 'p', title: 'P', tier: 'platinum', unlockedOn: '2025-01-01' }, { id: 'b', title: 'B', tier: 'bronze', unlockedOn: null }] }));
    expect(gs).toHaveLength(1);
    expect(gs[0].gain).toEqual({ gems: 40, chests: ['gold'] });
  });

  it('levels and forms pay, on the day the total crossed them', () => {
    const gs = grantsFor(base({ xp: [xp('a', '2026-10-02', 'gym', 45), xp('b', '2026-10-03', 'gym', 55)] }));
    expect(gs.find((g) => g.key === 'lv:2')?.date).toBe('2026-10-02');
    expect(gs.find((g) => g.key === 'form:1')?.label).toBe(`Form: ${STAGES[1].name}`);
  });

  it('bucket wishes pay by rarity', () => {
    const gs = grantsFor(base({ bucket: [{ id: 'l', title: 'Aurora', doneOn: '2026-11-01', rarity: 'legendary' }, { id: 'c', title: 'Tea', doneOn: '2026-11-01', rarity: 'common' }, { id: 'o', title: 'Open', doneOn: null, rarity: 'epic' }] }));
    expect(gs.find((g) => g.key === 'wish:l')?.gain).toEqual({ gems: 100, chests: ['gold'] });
    expect(gs.find((g) => g.key === 'wish:c')?.gain).toEqual({ gems: 10 });
    expect(gs.find((g) => g.key === 'wish:o')).toBeUndefined();
  });

  it('Hideout rooms pay, reading a note in the Lighthouse does not', () => {
    const rows = [
      { id: '1', kind: 'hq_review', day: '2026-11-01', data: { sealedOn: '2026-11-01' } },
      { id: '2', kind: 'hq_card', day: '2026-11-01', data: {} },
      { id: '3', kind: 'hq_capsule', day: '2026-10-01', data: { sealedOn: '2026-10-01', openedOn: '2026-11-02' } },
    ];
    const gs = grantsFor(base({ rows }));
    expect(gs.find((g) => g.key === 'hq:1')?.gain).toEqual({ coins: 150, gems: 10 });
    expect(gs.find((g) => g.key === 'hq:2')).toBeUndefined();
    expect(gs.find((g) => g.key === 'hq:3:opened')?.gain).toEqual({ coins: 60, gems: 5 });
  });

  it('Hideout Wiring only doubles from the day it was built', () => {
    const rows = [
      { id: 'old', kind: 'hq_diary', day: '2026-10-05', data: { date: '2026-10-05' } },
      { id: 'new', kind: 'hq_diary', day: '2026-11-03', data: { date: '2026-11-03' } },
    ];
    const gs = grantsFor(base({ rows, txs: [tx('upgrade', 'hideout:1', '2026-11-01')] }));
    expect(gs.find((g) => g.key === 'hq:old')?.gain.coins).toBe(15);
    expect(gs.find((g) => g.key === 'hq:new')?.gain.coins).toBe(30);
  });

  it('Coin Magnet and Incense only change the days they apply to', () => {
    const e = [xp('a', '2026-10-27', 'gym', 100), xp('b', '2026-11-03', 'gym', 100)];
    const plain = grantsFor(base({ xp: e }));
    const magnet = grantsFor(base({ xp: e, txs: [tx('upgrade', 'magnet:2', '2026-11-01')] }));
    const of = (gs: Grant[], d: string) => gs.find((g) => g.key === `day:${d}`)!.gain.coins!;
    expect(of(magnet, '2026-10-27')).toBe(of(plain, '2026-10-27'));
    expect(of(magnet, '2026-11-03')).toBeGreaterThan(of(plain, '2026-11-03'));
    const lit = grantsFor(base({ xp: e, txs: [tx('use', 'incense', '2026-11-03')] }));
    expect(of(lit, '2026-11-03')).toBe(of(plain, '2026-11-03') * 2);
  });

  it('a weekend day is worth more', () => {
    const b = dayBonus('2026-11-07', []);
    expect(b.lines.join()).toContain('Weekend rush');
    expect(b.pct).toBeGreaterThanOrEqual(0.25);
  });

  it('streak milestones survive one missed day, as the streak does', () => {
    const days = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08'];
    const gs = grantsFor(base({ streakDays: new Set(days), today: '2026-11-04' }));
    expect(gs.find((g) => g.source === 'streak')?.key).toBe('streak:2026-10-08');
  });

  it('nothing dated in the future is paid', () => {
    const gs = grantsFor(base({ today: '2026-11-04', bucket: [{ id: 'x', title: 'x', doneOn: '2026-11-05', rarity: 'rare' }] }));
    expect(gs).toHaveLength(0);
  });
});

describe('bounties', () => {
  it('draws three different ones a week, the same each time', () => {
    const a = bountiesFor('2026-11-02');
    expect(a).toHaveLength(3);
    expect(new Set(a.map((b) => b.id)).size).toBe(3);
    expect(bountiesFor('2026-11-02').map((b) => b.id)).toEqual(a.map((b) => b.id));
  });

  it('pays once complete, and not before', () => {
    const monday = '2026-11-02';
    const defs = bountiesFor(monday);
    const lots: XpEvent[] = [];
    for (let i = 0; i < 12; i++) {
      const s = MAT_IDS[i];
      lots.push(xp(`entry:${i}:logged`, '2026-11-03', s, 100));
      lots.push(xp(`task:${i}`, '2026-11-03', s, 5));
      lots.push(xp(`night:${i}:logged`, '2026-11-03', 'sleep', 10));
      lots.push(xp(`quest:daily:x:${i}`, '2026-11-03', 'quests', 15));
    }
    lots.push(xp('boss:2026-11-02', '2026-11-03', 'quests', 100));
    const input = base({ xp: lots, activeDays: ['2026-11-02', '2026-11-03', '2026-11-04'] });
    const board = bountyBoard(monday, input);
    expect(board.map((b) => b.def.id)).toEqual(defs.map((d) => d.id));
    const none = bountyBoard(monday, base());
    expect(none.every((b) => !b.complete)).toBe(true);
    for (const b of board.filter((x) => x.complete)) expect(grantsFor(input).some((g) => g.key === `bounty:${monday}:${b.def.id}`)).toBe(true);
  });
});

describe('events', () => {
  it('knows what is on', () => {
    expect(eventOn('2026-11-04')?.key).toBe('momiji-2026');
    expect(eventOn('2026-01-03')?.key).toBe('yuki-2025');
    expect(eventOn('2026-12-31')?.key).toBe('yuki-2026');
    expect(eventOn('2027-01-07')?.key).toBe('yuki-2026');
    expect(eventOn('2027-01-08')).toBeNull();
    expect(nextEvent('2026-11-04').def.id).toBe('yuki');
    expect(nextEvent('2027-01-08').def.id).toBe('setsubun');
  });

  it('no two festivals overlap', () => {
    const seen = new Map<string, string>();
    for (const run of eventRunsUpTo('2028-12-31')) {
      for (let d = new Date(run.start + 'T00:00:00Z'); d <= new Date(run.end + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 1)) {
        const k = d.toISOString().slice(0, 10);
        expect(seen.has(k), k).toBe(false);
        seen.set(k, run.key);
      }
    }
  });

  it('pays tokens only while running, faster in a short one', () => {
    const rows = [xp('a', '2026-10-20', 'gym', 100), xp('b', '2026-11-03', 'gym', 100), xp('c', '2026-12-01', 'gym', 100)];
    const gs = grantsFor(base({ xp: rows, today: '2027-01-01' }));
    const t = gs.filter((g) => g.source === 'event').map((g) => g.key);
    expect(t).toContain('token:hyakki-2026:2026-10-20');
    expect(t).toContain('token:momiji-2026:2026-11-03');
    expect(t.some((k) => k.includes('2026-12-01'))).toBe(false);
    const runs = eventRunsUpTo('2026-12-31');
    const short = runs.find((r) => r.def.id === 'setsubun')!;
    const long = runs.find((r) => r.def.id === 'momiji')!;
    expect(runLength(long)).toBe(30);
    expect(tokenRate(short)).toBeGreaterThan(tokenRate(long));
  });

  it('pays tokens for the festival sections twice, and for quests won while it runs', () => {
    const plain = grantsFor(base({ xp: [xp('a', '2026-11-03', 'gym', 90)], today: '2026-11-30' }));
    const boosted = grantsFor(base({ xp: [xp('a', '2026-11-03', 'maths', 90)], today: '2026-11-30' }));
    const tok = (gs: Grant[]) => gs.filter((g) => g.source === 'event').reduce((n, g) => n + (g.gain.tokens?.['momiji-2026'] ?? 0), 0);
    expect(tok(boosted)).toBe(tok(plain) * 2);
    const sets = [
      { period: 'daily' as const, start: '2026-11-04', end: '2026-11-04', quests: [], sweptOn: '2026-11-04' },
      { period: 'daily' as const, start: '2026-12-04', end: '2026-12-04', quests: [], sweptOn: '2026-12-04' },
    ];
    const keys = grantsFor(base({ quests: sets, today: '2026-12-31' })).filter((g) => g.source === 'event').map((g) => g.key);
    expect(keys).toEqual(['token:momiji-2026:sweep:daily:2026-11-04']);
  });

  it('a month of normal training reaches the stall', () => {
    const run = eventRunsUpTo('2026-12-31').find((r) => r.def.id === 'momiji')!;
    const rows: XpEvent[] = [];
    for (let i = 1; i <= 30; i++) rows.push(xp(`d${i}`, `2026-11-${String(i).padStart(2, '0')}`, 'gym', 150));
    const active = rows.map((r) => r.date);
    const w = walletOf(grantsFor(base({ xp: rows, activeDays: active, today: '2026-11-30' })), []);
    const earned = w.tokensEarned[run.key];
    expect(earned).toBeGreaterThan(trackOf(run.def).at(-1)!.at * 0.75);
    const stall = eventStock(run.def).reduce((n, s) => n + s.tokens, 0);
    expect(earned).toBeGreaterThan(stall);
  });
});

describe('wallet', () => {
  const g = (gain: Bag, key = 'k'): Grant => ({ key, date: '2026-11-01', source: 'training', label: 'x', gain });

  it('adds grants and gains, takes costs', () => {
    const w = walletOf([g({ coins: 1000, gems: 50, mats: { gym: 10 } })], [tx('buy', 'hat:crown', '2026-11-02', { coins: 400 }, { items: ['hat:crown'] })]);
    expect(w.coins).toBe(600);
    expect(w.gems).toBe(50);
    expect(w.mats.gym).toBe(10);
    expect(w.items.has('hat:crown')).toBe(true);
  });

  it('says exactly what is missing, and never lets you pay with what you lack', () => {
    const w = walletOf([g({ coins: 100, mats: { gym: 2 } })], []);
    expect(canAfford(w, { coins: 100 })).toBe(true);
    expect(canAfford(w, { coins: 101 })).toBe(false);
    expect(shortfall(w, { coins: 150, mats: { gym: 5 } })).toEqual(['50 more Ryō', '3 more Iron plate']);
  });

  it('chests wait until opened, and a chest can hold a chest', () => {
    const chest = g({ chests: ['iron', 'wood'] }, 'boss');
    expect(walletOf([chest], []).chests.map((c) => c.key)).toEqual(['boss#0', 'boss#1']);
    const opened = tx('open', 'boss#0', '2026-11-02', {}, { coins: 5, chests: ['gold'] }, 'o1');
    const w = walletOf([chest], [opened]);
    expect(w.chests.map((c) => c.key).sort()).toEqual(['boss#1', 'tx:o1#0']);
    expect(w.coins).toBe(5);
  });

  it('losing a record takes back what it paid, but not what you bought', () => {
    const buy = tx('buy', 'hat:cap', '2026-11-02', { coins: 400 }, { items: ['hat:cap'] });
    const w = walletOf([], [buy]);
    expect(w.coins).toBe(-400);
    expect(w.items.has('hat:cap')).toBe(true);
    expect(canAfford(w, { coins: 1 })).toBe(false);
  });

  it('reads levels, Mk and pity from rows', () => {
    const txs = [tx('upgrade', 'magnet:1', '2026-10-01'), tx('upgrade', 'magnet:2', '2026-11-01')];
    expect(upgradeLevel(txs, 'magnet')).toBe(2);
    expect(upgradeLevel(txs, 'magnet', '2026-10-15')).toBe(1);
    expect(chassisMk({ items: new Set(['chassis:koi:1', 'chassis:koi:2']) }, 'koi')).toBe(2);
    expect(chassisMk({ items: new Set() }, 'koi')).toBe(0);
    const spin = (rolled: Rarity[]): Tx => ({ ...tx('spin', 'spin:1', '2026-11-01'), rolled });
    expect(spinsSinceEpic([spin(['common', 'rare']), spin(['epic']), spin(['common', 'common', 'rare'])])).toBe(3);
  });

  it('reads stored rows back safely', () => {
    expect(txOf({ id: 'a', kind: 'gm_tx', deleted_at: null, data: { type: 'buy', at: '2026-11-01', ref: 'hat:cap' } })?.cost).toEqual({});
    expect(txOf({ id: 'a', kind: 'gm_tx', deleted_at: '2026-11-01', data: { type: 'buy', at: '2026-11-01', ref: 'x' } })).toBeNull();
    expect(txOf({ id: 'a', kind: 'hq_note', deleted_at: null, data: {} })).toBeNull();
    expect(normaliseLoadout(null).chassis).toBe('drone');
    expect(normaliseLoadout({ chassis: 'koi', hat: 5 })).toMatchObject({ chassis: 'koi', hat: null });
  });
});

describe('loot', () => {
  it('a chest holds the same thing wherever it is opened', () => {
    expect(rollChest('boss:1#0', 'iron', new Set())).toEqual(rollChest('boss:1#0', 'iron', new Set()));
    expect(rollChest('boss:1#0', 'iron', new Set())).not.toEqual(rollChest('boss:2#0', 'iron', new Set()));
  });

  it('a mythic reliquary is always better than a crate', () => {
    for (let i = 0; i < 40; i++) {
      const m = rollChest(`x${i}`, 'mythic', new Set());
      const w = rollChest(`x${i}`, 'wood', new Set());
      expect(m.coins!).toBeGreaterThan(w.coins!);
      expect(m.gems!).toBeGreaterThanOrEqual(80);
      expect(m.tickets).toBe(5);
    }
  });

  it('a mythic reliquary drops gear, Legendary or better', () => {
    for (let i = 0; i < 30; i++) {
      const m = rollChest(`y${i}`, 'mythic', new Set());
      expect((m.items?.length ?? 0) + (m.dust ? 1 : 0)).toBe(1);
      const [kind, id] = m.items![0].split(':');
      const e = cosmeticLists[kind as CosmeticKind].find((x) => x.id === id)!;
      expect(RARITY[e.rarity].order).toBeGreaterThanOrEqual(RARITY.legendary.order);
    }
  });

  it('a Lucky Cat means more coins', () => {
    expect(rollChest('z', 'iron', new Set(), 3).coins!).toBeGreaterThan(rollChest('z', 'iron', new Set(), 0).coins!);
  });

  it('breaks duplicates into Stardust', () => {
    const owned = new Set(capsulePool().map((p) => p.item));
    const r = rollSpin('dupes', 10, owned, 0, 30);
    expect(r.gain.items).toBeUndefined();
    expect(r.gain.dust).toBeGreaterThan(0);
    expect(r.capsules.every((c) => c.dupe)).toBe(true);
  });

  it('two capsules with the same thing in one spin count the second as a duplicate', () => {
    const pool = capsulePool();
    const r = rollSpin('many', 200, new Set(), 0, 30);
    expect(new Set(r.gain.items).size).toBe(r.gain.items!.length);
    expect(r.gain.items!.length).toBeLessThanOrEqual(pool.length);
    expect(r.gain.dust).toBeGreaterThan(0);
  });

  it('pity guarantees an Epic or better', () => {
    for (let i = 0; i < 25; i++) {
      const r = rollSpin(`pity${i}`, 1, new Set(), 29, 30);
      expect(RARITY[r.rolled[0]].order).toBeGreaterThanOrEqual(RARITY.epic.order);
    }
    const ten = rollSpin('ten', 40, new Set(), 0, 15);
    let since = 0;
    for (const x of ten.rolled) {
      since = RARITY[x].order >= RARITY.epic.order ? 0 : since + 1;
      expect(since).toBeLessThan(15);
    }
  });

  it('rolls near the odds printed on the machine', () => {
    const r = rollSpin('odds', 5000, new Set(), 0, 100000);
    const common = r.rolled.filter((x) => x === 'common').length / 5000;
    const rare = r.rolled.filter((x) => x === 'rare').length / 5000;
    expect(common).toBeGreaterThan(0.53);
    expect(common).toBeLessThan(0.63);
    expect(rare).toBeGreaterThan(0.25);
    expect(rare).toBeLessThan(0.33);
  });

  it('hash32 is stable', () => {
    expect(hash32('abc')).toBe(hash32('abc'));
    expect(hash32('abc')).not.toBe(hash32('abd'));
  });
});

describe('shop', () => {
  it('stocks the same shelf all week, a different one next week', () => {
    const a = weeklyStock('2026-11-02').map((s) => s.item);
    expect(a).toHaveLength(6);
    expect(weeklyStock('2026-11-02').map((s) => s.item)).toEqual(a);
    const weeks = Array.from({ length: 12 }, (_, i) => weeklyStock(`2026-${String(i + 1).padStart(2, '0')}-02`).map((s) => s.item).join());
    expect(new Set(weeks).size).toBeGreaterThan(9);
  });

  it('discounts, never to nothing', () => {
    expect(discounted({ coins: 1000, gems: 10 }, 25)).toMatchObject({ coins: 750, gems: 8 });
    expect(discounted({ coins: 1 }, 90).coins).toBe(1);
    const featured = weeklyStock('2026-11-02')[0];
    expect(featured.off).toBe(30);
    expect(featured.kind).toBe('chassis');
  });

  it('never sells event things or tributes on the weekly shelf', () => {
    for (let i = 1; i <= 28; i++) {
      for (const s of weeklyStock(`2026-06-${String(i).padStart(2, '0')}`)) {
        if (s.kind === 'chassis') {
          const c = CHASSIS.find((x) => x.id === s.item.split(':')[1])!;
          expect(c.event).toBeUndefined();
          expect(c.section).toBeUndefined();
        } else {
          const [k, id] = s.item.split(':');
          expect((cosmeticLists[k as CosmeticKind].find((x) => x.id === id) as { event?: string }).event).toBeUndefined();
        }
      }
    }
  });

  it('has a deal a day', () => {
    const d = dailyDeal('2026-11-04');
    expect(d.id).toBe('deal:2026-11-04');
    expect(Object.keys(d.gain).length).toBeGreaterThan(0);
    expect(CONSUMABLES.length).toBeGreaterThan(4);
  });
});

describe('album', () => {
  it('pays for the face of the day once a day, and nothing for memories', () => {
    const d = GAME_FROM > '2026-11-01' ? GAME_FROM : '2026-11-01';
    const shot = (id: string, role: string, date: string) => ({ id, kind: 'album_shot', day: date, data: { role, date, path: 'x' } });
    const gs = grantsFor(base({ rows: [shot('a', 'face', d), shot('b', 'face', d), shot('c', 'memory', d), shot('d', 'face', '2099-01-01')] }));
    const album = gs.filter((g) => g.source === 'album');
    expect(album).toHaveLength(1);
    expect(album[0].gain.coins).toBe(10);
  });
});
