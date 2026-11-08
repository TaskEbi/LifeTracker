/**
 * Randomness, but repeatable. A chest's contents come from its key, so two devices opening the same
 * chest get the same thing. A spin's come from its row id. Only the owned-or-not check (duplicates
 * break into Stardust) depends on what you have at the moment of opening, and the result is saved.
 */
import type { SectionId } from '../../data/types';
import { capsulePool, CHESTS, CONSUMABLES, DUST_FROM_DUPE, MAT_IDS, RARITY, SPIN_ODDS, type Bag, type ChestTier, type Rarity } from './catalog';

/** A number from a string (FNV-1a), then mixed. */
export function hash32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995);
  return (h ^ (h >>> 15)) >>> 0;
}

/** A stream of numbers in [0, 1) from a seed. */
export function stream(seed: string): () => number {
  let i = 0;
  return () => hash32(`${seed}/${i++}`) / 0x100000000;
}

const between = (r: () => number, [a, b]: [number, number]) => a + Math.floor(r() * (b - a + 1));

function rarityRoll(r: () => number, floor: Rarity = 'common'): Rarity {
  const order = Object.keys(RARITY) as Rarity[];
  const allowed = order.filter((x) => RARITY[x].order >= RARITY[floor].order);
  const total = allowed.reduce((n, x) => n + SPIN_ODDS[x], 0);
  let v = r() * total;
  for (const x of allowed) {
    v -= SPIN_ODDS[x];
    if (v < 0) return x;
  }
  return allowed[0];
}

function poolPick(r: () => number, rarity: Rarity): string {
  const pool = capsulePool();
  // A rarity with nothing in it falls to the nearest one that has.
  const order = Object.keys(RARITY) as Rarity[];
  for (let at = RARITY[rarity].order; at >= 0; at--) {
    const list = pool.filter((p) => p.rarity === order[at]);
    if (list.length) return list[Math.floor(r() * list.length)].item;
  }
  return pool[0].item;
}

/** One capsule: a thing you get, or Stardust when you already have it. */
function resolve(item: string, rarity: Rarity, owned: Set<string>, into: Bag) {
  if (owned.has(item)) {
    into.dust = (into.dust ?? 0) + DUST_FROM_DUPE[rarity];
  } else {
    (into.items ??= []).push(item);
    owned.add(item);
  }
}

/** What's inside a chest. `cat` is the Lucky Cat Shrine's level. */
export function rollChest(key: string, tier: ChestTier, owned: Set<string>, cat = 0): Bag {
  const r = stream(`chest:${key}`);
  const def = CHESTS[tier];
  const gain: Bag = { coins: Math.round(between(r, def.coins) * (1 + cat * 0.2)) };
  const gems = between(r, def.gems);
  if (gems) gain.gems = gems;
  gain.mats = {};
  for (let i = 0; i < def.rolls; i++) {
    const s: SectionId = MAT_IDS[Math.floor(r() * MAT_IDS.length)];
    gain.mats[s] = (gain.mats[s] ?? 0) + between(r, def.mats);
  }
  if (r() < def.ticket) gain.tickets = tier === 'mythic' ? 5 : tier === 'gold' ? 2 : 1;
  if (r() < def.ticket / 2) {
    const c = CONSUMABLES[Math.floor(r() * CONSUMABLES.length)];
    gain.stock = { [c.id]: 1 };
  }
  if (r() < def.gear + cat * 0.05) {
    const floor: Rarity = tier === 'mythic' ? 'legendary' : tier === 'gold' ? 'rare' : 'common';
    const rarity = rarityRoll(r, floor);
    resolve(poolPick(r, rarity), rarity, new Set(owned), gain);
  }
  return gain;
}

/**
 * A lucky bag, rolled from its row id when it's bought: Ryō, three handfuls of materials and one
 * headline prize (new gear, tickets, two of an item, or a gold chest), sometimes Tama on top.
 */
export function rollLuckyBag(seed: string, owned: Set<string>): Bag {
  const r = stream(`bag:${seed}`);
  const gain: Bag = { coins: between(r, [700, 1400]), mats: {} };
  for (let i = 0; i < 3; i++) {
    const s: SectionId = MAT_IDS[Math.floor(r() * MAT_IDS.length)];
    gain.mats![s] = (gain.mats![s] ?? 0) + between(r, [6, 14]);
  }
  const roll = r();
  if (roll < 0.45) {
    const rarity = rarityRoll(r, 'rare');
    resolve(poolPick(r, rarity), rarity, new Set(owned), gain);
  } else if (roll < 0.7) gain.tickets = 2;
  else if (roll < 0.9) gain.stock = { [CONSUMABLES[Math.floor(r() * CONSUMABLES.length)].id]: 2 };
  else gain.chests = ['gold'];
  if (r() < 0.5) gain.gems = between(r, [5, 20]);
  return gain;
}

export interface SpinResult {
  gain: Bag;
  rolled: Rarity[];
  /** What each capsule held, in order, for the machine to show. */
  capsules: { item: string; rarity: Rarity; dupe: boolean }[];
}

/**
 * `count` capsules. `sinceEpic` spins have passed since an Epic or better, and `pity` is how many
 * it may take: the last one is then at least an Epic.
 */
export function rollSpin(seed: string, count: number, owned: Set<string>, sinceEpic: number, pity: number): SpinResult {
  const r = stream(`spin:${seed}`);
  const gain: Bag = {};
  const rolled: Rarity[] = [];
  const capsules: SpinResult['capsules'] = [];
  const have = new Set(owned);
  let since = sinceEpic;
  for (let i = 0; i < count; i++) {
    const rarity = rarityRoll(r, since + 1 >= pity ? 'epic' : 'common');
    since = RARITY[rarity].order >= RARITY.epic.order ? 0 : since + 1;
    const item = poolPick(r, rarity);
    const dupe = have.has(item);
    resolve(item, rarity, have, gain);
    rolled.push(rarity);
    capsules.push({ item, rarity, dupe });
  }
  return { gain, rolled, capsules };
}
