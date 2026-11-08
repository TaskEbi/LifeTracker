import { describe, expect, it } from 'vitest';
import { capsulePool, cosmeticOf, MAT_IDS, RARITY, TITLES, type Bag } from './catalog';
import { EVENTS } from './events';
import { rollLuckyBag } from './loot';
import {
  haggleOff,
  listPrice,
  mamedaLine,
  nightOf,
  nightOpen,
  nightStock,
  perks,
  RANKS,
  requestsFor,
  saleState,
  saved,
  STAMP_CARD,
  stampCard,
  standingOf,
  timeSale,
  trustOf,
  withRank,
  type TalkContext,
} from './market';
import { SETS, setPrize, setRarity, setsProgress } from './sets';
import { catalogue, weeklyStock } from './shop';
import { walletOf, type Tx } from './wallet';
import { addDays } from '../log/dates';

const tx = (type: Tx['type'], ref: string, at: string, cost: Bag = {}, gain: Bag = {}, id = `${type}:${ref}:${at}`): Tx => ({ id, type, ref, at, cost, gain });

describe('the Regular’s card', () => {
  it('earns trust from spending, not from exchanges or chests', () => {
    const txs = [
      tx('buy', 'hat:cap', '2026-11-01', { coins: 400 }),
      tx('spin', 'spin:1', '2026-11-01', { gems: 30 }),
      tx('trade', 'gems', '2026-11-01', { coins: 1200 }, { gems: 10 }),
      tx('open', 'k#0', '2026-11-01'),
      tx('deliver', 'req:2026-11-01:0', '2026-11-01', { mats: { violin: 6, gym: 4 } }, { coins: 250 }),
    ];
    expect(trustOf(txs)).toBe(40 + 30 + 15 + 10);
  });

  it('climbs through six ranks, each a bigger discount', () => {
    expect(standingOf([]).rank.n).toBe(0);
    expect(standingOf([]).next?.n).toBe(1);
    const rich = standingOf([tx('buy', 'x', '2026-11-01', { coins: 60000 })]);
    expect(rich.rank.n).toBe(5);
    expect(rich.next).toBeNull();
    expect(rich.progress).toBe(1);
    for (let i = 1; i < RANKS.length; i++) {
      expect(RANKS[i].need).toBeGreaterThan(RANKS[i - 1].need);
      expect(RANKS[i].off).toBeGreaterThan(RANKS[i - 1].off);
    }
    const mid = standingOf([tx('buy', 'x', '2026-11-01', { coins: 6000 })]);
    expect(mid.rank.n).toBe(2);
    expect(mid.progress).toBeCloseTo((600 - 500) / 700, 5);
  });

  it('takes the rank discount off a price, and perks grow with rank', () => {
    expect(withRank({ coins: 1000, gems: 40 }, RANKS[0])).toEqual({ coins: 1000, gems: 40 });
    expect(withRank({ coins: 1000, gems: 40 }, RANKS[4])).toMatchObject({ coins: 900, gems: 36 });
    expect(perks(RANKS[0])).toEqual({ haggle: false, requests: 3, bags: 1, stalls: 3, saleOff: 50 });
    expect(perks(RANKS[5])).toEqual({ haggle: true, requests: 4, bags: 2, stalls: 4, saleOff: 60 });
  });
});

describe('the stamp card', () => {
  it('stamps once a day you buy, and a full card can be handed in once', () => {
    const days = Array.from({ length: 9 }, (_, i) => `2026-11-${String(i + 1).padStart(2, '0')}`);
    const txs = days.flatMap((d) => [tx('buy', 'scroll', d, { coins: 500 }), tx('buy', 'bomb', d, { coins: 700 })]);
    const c = stampCard(txs, '2026-11-09');
    expect(c.days).toHaveLength(9);
    expect(c.onCard).toBe(9 - STAMP_CARD);
    expect(c.toClaim).toEqual([1]);
    expect(c.stampedToday).toBe(true);
    const after = stampCard([...txs, tx('claim', 'stamp:1', '2026-11-09')], '2026-11-10');
    expect(after.toClaim).toEqual([]);
    expect(after.stampedToday).toBe(false);
  });

  it('only counts purchases, not spins or upgrades', () => {
    const c = stampCard([tx('spin', 'spin:1', '2026-11-01', { gems: 30 }), tx('upgrade', 'magnet:1', '2026-11-02', { coins: 500 })], '2026-11-02');
    expect(c.days).toEqual([]);
  });
});

describe('the time sale', () => {
  it('runs two hours a day between 8:00 and 21:00, on something Rare or better that the shop sells', () => {
    const sellable = new Set(capsulePool().map((p) => p.item));
    for (let d = 1; d <= 30; d++) {
      const date = `2026-11-${String(d).padStart(2, '0')}`;
      const s = timeSale(date, RANKS[0]);
      expect(s.from).toBeGreaterThanOrEqual(8);
      expect(s.to).toBe(s.from + 2);
      expect(s.to).toBeLessThanOrEqual(21);
      expect(sellable.has(s.item.item)).toBe(true);
      expect(RARITY[s.item.rarity].order).toBeGreaterThanOrEqual(RARITY.rare.order);
      expect(s.item.off).toBe(50);
      expect(timeSale(date, RANKS[0])).toEqual(s);
    }
    expect(timeSale('2026-11-08', RANKS[5]).item.off).toBe(60);
  });

  it('is soon, on, then gone', () => {
    const s = { item: catalogue('hat')[0], from: 10, to: 12 };
    expect([9, 10, 11, 12].map((h) => saleState(s, h))).toEqual(['soon', 'on', 'on', 'gone']);
  });
});

describe('haggling', () => {
  it('pays more the closer to the middle, and nothing at the edges', () => {
    expect(haggleOff(0.5)).toBe(30);
    expect(haggleOff(0.45)).toBe(20);
    expect(haggleOff(0.35)).toBe(12);
    expect(haggleOff(0.25)).toBe(6);
    expect(haggleOff(0)).toBe(0);
    expect(haggleOff(1)).toBe(0);
    expect(haggleOff(-3)).toBe(0);
    // symmetric
    for (const p of [0.05, 0.22, 0.33, 0.41, 0.48]) expect(haggleOff(p)).toBe(haggleOff(1 - p));
  });
});

describe('the lucky bag', () => {
  it('is the same bag for the same row, always has Ryō, materials and a headline prize', () => {
    const owned = new Set<string>();
    expect(rollLuckyBag('row-1', owned)).toEqual(rollLuckyBag('row-1', owned));
    let coins = 0;
    for (let i = 0; i < 400; i++) {
      const b = rollLuckyBag(`row-${i}`, owned);
      expect(b.coins).toBeGreaterThanOrEqual(700);
      expect(Object.values(b.mats ?? {}).reduce((n, v) => n + (v ?? 0), 0)).toBeGreaterThanOrEqual(18);
      const headline = (b.items?.length ?? 0) + (b.dust ? 1 : 0) + (b.tickets ?? 0) + Object.keys(b.stock ?? {}).length + (b.chests?.length ?? 0);
      expect(headline, `bag ${i}`).toBeGreaterThan(0);
      for (const it of b.items ?? []) expect(RARITY[cosmeticOf(it)!.entry.rarity].order).toBeGreaterThanOrEqual(RARITY.rare.order);
      coins += b.coins!;
    }
    expect(coins / 400).toBeGreaterThan(950);
  });

  it('breaks gear you already own into Stardust', () => {
    const all = new Set(capsulePool().map((p) => p.item));
    for (let i = 0; i < 100; i++) expect(rollLuckyBag(`row-${i}`, all).items ?? []).toEqual([]);
  });
});

describe('requests', () => {
  it('asks for materials from the sections you work in, the same all day, and pays for them', () => {
    const a = requestsFor('2026-11-08', ['violin', 'maths', 'gym'], 3);
    expect(requestsFor('2026-11-08', ['gym', 'violin', 'maths'], 3)).toEqual(a);
    expect(a).toHaveLength(3);
    expect(new Set(a.map((r) => r.who)).size).toBe(3);
    for (const r of a) {
      for (const s of Object.keys(r.want)) expect(['violin', 'maths', 'gym']).toContain(s);
      const units = Object.values(r.want).reduce((n, v) => n + (v ?? 0), 0);
      expect(units).toBeGreaterThanOrEqual(4);
      expect(r.gain.coins).toBe(units * 25);
      expect(r.gain.gems).toBeGreaterThan(0);
      expect(r.line).not.toContain('{m}');
    }
    expect(requestsFor('2026-11-09', ['violin', 'maths', 'gym'], 3)).not.toEqual(a);
  });

  it('asks for anything when you have worked in fewer than two sections', () => {
    const seen = new Set<string>();
    for (let d = 1; d <= 28; d++) for (const r of requestsFor(`2026-11-${String(d).padStart(2, '0')}`, ['violin'], 4)) Object.keys(r.want).forEach((s) => seen.add(s));
    expect(seen.size).toBeGreaterThan(4);
    for (const s of seen) expect(MAT_IDS).toContain(s);
  });
});

describe('the night market', () => {
  it('is open from 19:00 to 05:00, and after midnight belongs to the evening before', () => {
    expect([4, 5, 18, 19, 23, 0].map(nightOpen)).toEqual([true, false, false, true, true, true]);
    expect(nightOf('2026-11-09', 2)).toBe('2026-11-08');
    expect(nightOf('2026-11-08', 22)).toBe('2026-11-08');
  });

  it("sells past festivals' gear, never the running festival's, and never a body", () => {
    const momiji = EVENTS.find((e) => e.id === 'momiji')!;
    const theirs = new Set([`hat:${momiji.hat}`, `pet:${momiji.pet}`, `aura:${momiji.aura}`, `paint:${momiji.paint}`]);
    for (let d = 1; d <= 30; d++) {
      const stock = nightStock(`2026-11-${String(d).padStart(2, '0')}`, 'momiji', 4);
      expect(stock).toHaveLength(4);
      expect(new Set(stock.map((s) => s.item)).size).toBe(4);
      for (const s of stock) {
        expect(theirs.has(s.item)).toBe(false);
        expect(s.item.startsWith('chassis:')).toBe(false);
        expect((cosmeticOf(s.item)!.entry as { event?: string }).event).toBeTruthy();
      }
    }
  });
});

describe('gear sets', () => {
  it('are made of real pieces, each with its own title that is never sold', () => {
    const sold = new Set([...capsulePool().map((p) => p.item), ...(['paint', 'hat', 'pet', 'aura', 'title'] as const).flatMap((k) => catalogue(k).map((s) => s.item))]);
    for (let w = 0; w < 52; w++) for (const s of weeklyStock(addDays('2026-11-02', w * 7))) sold.add(s.item);
    const ids = SETS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of SETS) {
      expect(s.items).toHaveLength(4);
      for (const it of s.items) expect(cosmeticOf(it), `${s.id} ${it}`).not.toBeNull();
      const t = TITLES.find((x) => x.id === s.title);
      expect(t?.set).toBe(s.id);
      expect(t?.rarity, s.id).toBe(setRarity(s));
      expect(sold.has(`title:${s.title}`)).toBe(false);
    }
    expect(SETS.filter((s) => s.festival)).toHaveLength(EVENTS.length);
  });

  it('can be claimed once all four are owned, and the claim hands over the title', () => {
    const ninja = SETS.find((s) => s.id === 'ninja')!;
    const bought = ninja.items.map((it) => tx('buy', it, '2026-11-01', {}, { items: [it] }, `b:${it}`));
    const w = walletOf([], bought.slice(0, 3));
    expect(setsProgress(w.items, bought).find((p) => p.set.id === 'ninja')).toMatchObject({ complete: false, claimed: false });
    const w2 = walletOf([], bought);
    expect(setsProgress(w2.items, bought).find((p) => p.set.id === 'ninja')).toMatchObject({ complete: true, claimed: false });
    const claim = tx('claim', 'set:ninja', '2026-11-02', {}, setPrize(ninja));
    const w3 = walletOf([], [...bought, claim]);
    expect(w3.items.has('title:set_ninja')).toBe(true);
    expect(w3.gems).toBe(60);
    expect(w3.chests).toHaveLength(1);
    expect(setsProgress(w3.items, [...bought, claim]).find((p) => p.set.id === 'ninja')?.claimed).toBe(true);
  });
});

describe('the wishlist', () => {
  it('prices catalogue things and nothing else', () => {
    expect(listPrice('hat:crown')?.cost.coins).toBeGreaterThan(0);
    expect(listPrice('theme:arcade')?.name).toBe('Arcade Night');
    expect(listPrice('hat:momijiwreath')).toBeNull();
    expect(listPrice('title:centurion')).toBeNull();
    expect(listPrice('title:set_void')).toBeNull();
    expect(listPrice('nonsense')).toBeNull();
  });

  it('measures saving by the scarcest currency', () => {
    const w = walletOf([{ key: 'g', date: '2026-11-01', source: 'daily', label: '', gain: { coins: 500, gems: 10 } }], []);
    expect(saved(w, { coins: 1000 })).toBe(0.5);
    expect(saved(w, { coins: 1000, gems: 40 })).toBe(0.25);
    expect(saved(w, { coins: 100 })).toBe(1);
  });
});

describe('Mameda', () => {
  const ctx = (over: Partial<TalkContext> = {}): TalkContext => ({
    date: '2026-11-08',
    hour: 14,
    rank: RANKS[0],
    coins: 5000,
    wish: null,
    sale: { name: 'Crown', state: 'soon', from: 16, to: 18 },
    night: false,
    event: null,
    stampsToGo: 5,
    toClaim: false,
    ...over,
  });

  it('says the most useful thing first', () => {
    expect(mamedaLine(ctx({ hour: 3 }))).toMatch(/sleep|bed/i);
    expect(mamedaLine(ctx({ toClaim: true }))).toMatch(/stamp card/);
    expect(mamedaLine(ctx({ wish: { name: 'Crown', ready: true } }))).toContain('Crown');
    expect(mamedaLine(ctx({ sale: { name: 'Halo', state: 'on', from: 14, to: 16 } }))).toContain('16:00');
    expect(mamedaLine(ctx({ night: true, hour: 20 }))).toMatch(/night market/);
    expect(mamedaLine(ctx({ coins: 20 }))).toMatch(/log something/);
  });

  it('says the same thing all hour', () => {
    expect(mamedaLine(ctx())).toBe(mamedaLine(ctx()));
  });
});
