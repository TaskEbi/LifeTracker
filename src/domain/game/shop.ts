/**
 * What's on the shelves: a weekly stock and a daily deal, drawn by date so every device sees the
 * same and nothing is stored. Also the full catalogue's prices.
 */
import type { SectionId } from '../../data/types';
import { CHASSIS, chassisCost, CONSUMABLES, cosmeticLists, cosmeticPrice, MAT_IDS, MATS, RARITY, SHOP_THEMES, type Bag, type Chassis, type CosmeticKind, type Gear, type Rarity, type Title } from './catalog';
import { hash32 } from './loot';
import { eventById } from './events';

/** A discount, in whole percent. */
export function discounted(cost: Bag, pct: number): Bag {
  const off = (n?: number) => (n == null ? undefined : Math.max(1, Math.round((n * (100 - pct)) / 100)));
  return { ...cost, coins: off(cost.coins), gems: off(cost.gems), dust: off(cost.dust) };
}

export interface ShopItem {
  /** What you'd own: 'chassis:tanuki:1', 'hat:crown', 'theme:arcade', or a consumable id with `stock`. */
  item: string;
  name: string;
  kind: string;
  rarity: Rarity;
  cost: Bag;
  off?: number;
  /** A consumable, which you can own more than one of. */
  stock?: boolean;
}

function gearItem(kind: CosmeticKind, g: Gear, off?: number): ShopItem {
  const base = cosmeticPrice(g.rarity);
  return { item: `${kind}:${g.id}`, name: g.name, kind, rarity: g.rarity, cost: off ? discounted(base, off) : base, off };
}

/** All cosmetics that can be bought outright (event ones only from the event; earned titles never). */
export function catalogue(kind: CosmeticKind): ShopItem[] {
  return (cosmeticLists[kind] as (Gear & Title)[])
    .filter((g) => !g.event && !g.section && !g.level)
    .map((g) => gearItem(kind, g))
    .sort((a, b) => RARITY[a.rarity].order - RARITY[b.rarity].order);
}

export const themeItems = (): ShopItem[] =>
  SHOP_THEMES.map((t) => ({ item: `theme:${t.id}`, name: t.name, kind: 'theme', rarity: t.rarity, cost: cosmeticPrice(t.rarity) }));

export const consumableItems = (): ShopItem[] => CONSUMABLES.map((c) => ({ item: c.id, name: c.name, kind: 'consumable', rarity: c.rarity, cost: c.price, stock: true }));

/** Chassis that the weekly stock can feature (not tributes, which take section levels, or events). */
const shelfChassis = (): Chassis[] => CHASSIS.filter((c) => !c.event && !c.section);

function pick<T>(list: T[], seed: string, n: number): T[] {
  const left = [...list];
  const out: T[] = [];
  for (let i = 0; i < n && left.length; i++) out.push(left.splice(hash32(`${seed}:${i}`) % left.length, 1)[0]);
  return out;
}

/** This week's shelf: a featured chassis at 30% off, and five cosmetics at 25%. */
export function weeklyStock(monday: string): ShopItem[] {
  const out: ShopItem[] = [];
  const [ch] = pick(shelfChassis(), `week:${monday}:chassis`, 1);
  out.push({ item: `chassis:${ch.id}:1`, name: ch.name, kind: 'chassis', rarity: ch.rarity, cost: discounted(chassisCost(ch, 1), 30), off: 30 });
  const kinds: CosmeticKind[] = ['paint', 'hat', 'pet', 'aura', 'title'];
  for (const k of kinds) {
    const list = (cosmeticLists[k] as (Gear & Title)[]).filter((g) => !g.event && !g.section && !g.level);
    const [g] = pick(list, `week:${monday}:${k}`, 1);
    out.push(gearItem(k, g, 25));
  }
  return out;
}

export interface DailyDeal {
  id: string;
  name: string;
  line: string;
  kanji: string;
  cost: Bag;
  gain: Bag;
}

/** One deal a day, once a day. */
export function dailyDeal(date: string): DailyDeal {
  const h = hash32(`deal:${date}`);
  const kind = h % 3;
  if (kind === 0) {
    const s: SectionId = MAT_IDS[(h >>> 4) % MAT_IDS.length];
    return { id: `deal:${date}`, name: `${MATS[s].name} crate`, line: `20 ${MATS[s].name} for a song`, kanji: MATS[s].kanji, cost: { coins: 250 }, gain: { mats: { [s]: 20 } } };
  }
  if (kind === 1) {
    const c = CONSUMABLES[(h >>> 4) % CONSUMABLES.length];
    return { id: `deal:${date}`, name: c.name, line: `A third off: ${c.desc}`, kanji: c.kanji, cost: discounted(c.price, 33), gain: { stock: { [c.id]: 1 } } };
  }
  return { id: `deal:${date}`, name: 'Capsule ticket', line: 'One spin on the machine, cheap', kanji: '券', cost: { coins: 500 }, gain: { tickets: 1 } };
}

// ─── exchange ───────────────────────────────────────────────────────────────

/** Ryō into Tama, at a poor rate, a few a week. */
export const GEM_EXCHANGE = { coins: 120, weekly: 25 } as const;
/** Four of one material into one of another. */
export const MAT_EXCHANGE = 4;
/** Stardust into a ticket. */
export const DUST_TICKET = 100;

export const eventNameOf = (eventId: string) => eventById(eventId)?.name ?? eventId;
