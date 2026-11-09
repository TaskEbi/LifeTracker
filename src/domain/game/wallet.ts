/**
 * The ledger. What you've earned is worked out from your records (earn.ts), so editing a session
 * changes it like XP. What you've spent can't be derived, so each buy, chest and spin is one `gm_tx`
 * row saying what it cost and what it gave. Balance = earned + gains − costs; ownership is whatever
 * those rows handed over.
 */
import type { SectionId } from '../../data/types';
import type { Bag, ChestTier, CosmeticKind, Mats, Rarity } from './catalog';
import { chassisById, COSMETIC_NAME, cosmeticOf, MATS, upgradeById } from './catalog';

export type TxType = 'buy' | 'mk' | 'upgrade' | 'open' | 'spin' | 'claim' | 'use' | 'trade' | 'deliver' | 'roll' | 'cast';

export interface Tx {
  id: string;
  type: TxType;
  /** Day it happened (Daily Log time zone). */
  at: string;
  /** What it's about: 'hat:crown', 'chassis:tanuki:2', 'magnet:3', a chest key, 'scroll'… */
  ref: string;
  cost: Bag;
  gain: Bag;
  /** Rarities of a spin's capsules (the pity count needs them). */
  rolled?: Rarity[];
}

/** Whatever was granted from records. */
export interface Grant {
  key: string;
  date: string;
  source: GrantSource;
  label: string;
  gain: Bag;
}

export type GrantSource = 'training' | 'daily' | 'streak' | 'quests' | 'bounty' | 'boss' | 'emblems' | 'levels' | 'bucket' | 'hideout' | 'reading' | 'album' | 'workshop' | 'event';

export const SOURCE_INFO: Record<GrantSource, { name: string; kanji: string; hint: string }> = {
  training: { name: 'Every XP you earn', kanji: '修', hint: 'Ryō for each XP, and a material for each section you worked in' },
  daily: { name: 'Turning up', kanji: '日', hint: 'A little for any active day; Tama on the first of the month' },
  streak: { name: 'Streak milestones', kanji: '炎', hint: 'Every 7 days a crate; every 30 a gold chest; every 100 a reliquary' },
  quests: { name: 'Quests', kanji: '任', hint: 'Tama and a chest when all three of a board are done' },
  bounty: { name: 'Weekly bounties', kanji: '賞', hint: 'Three new ones every Monday' },
  boss: { name: 'Boss raids', kanji: '討', hint: 'Tama and a strongbox per boss' },
  emblems: { name: 'Emblems', kanji: '紋', hint: 'Bronze 2, silver 5, gold 15, platinum 40 Tama' },
  levels: { name: 'Levels and forms', kanji: '覚', hint: 'Tama per level, chests every 5, a chest per form, section levels too' },
  bucket: { name: 'Bucket list', kanji: '夢', hint: 'The rarer the wish, the bigger the prize' },
  hideout: { name: 'The Hideout', kanji: '基', hint: 'Reviews, recall, diary, rituals, predictions, capsules, close-outs' },
  reading: { name: 'Kindle highlights', kanji: '読', hint: 'A Ryō per line saved, up to 20 a day' },
  album: { name: 'The Album', kanji: '写', hint: '10 Ryō for the photo of the day, once a day' },
  workshop: { name: 'Workshop machines', kanji: '工', hint: 'Ticket Printer and Omamori Rack' },
  event: { name: 'Seasonal events', kanji: '祭', hint: 'Tokens for whatever you log while one runs' },
};

export interface Wallet {
  coins: number;
  gems: number;
  dust: number;
  tickets: number;
  mats: Record<SectionId, number>;
  /** By event run. */
  tokens: Record<string, number>;
  /** Tokens earned in a run, whatever's been spent: the prize track reads this. */
  tokensEarned: Record<string, number>;
  /** Consumables held. */
  stock: Record<string, number>;
  /** One-off things owned ('hat:crown', 'chassis:tanuki:1'). */
  items: Set<string>;
  /** Chests waiting to be opened, oldest first. */
  chests: { key: string; tier: ChestTier; date: string; label: string }[];
}

const emptyMats = () => Object.fromEntries(Object.keys(MATS).map((s) => [s, 0])) as Record<SectionId, number>;

function apply(w: Wallet, b: Bag, sign: 1 | -1) {
  w.coins += sign * (b.coins ?? 0);
  w.gems += sign * (b.gems ?? 0);
  w.dust += sign * (b.dust ?? 0);
  w.tickets += sign * (b.tickets ?? 0);
  for (const [s, n] of Object.entries(b.mats ?? {})) w.mats[s as SectionId] += sign * (n ?? 0);
  for (const [k, n] of Object.entries(b.tokens ?? {})) w.tokens[k] = (w.tokens[k] ?? 0) + sign * n;
  for (const [k, n] of Object.entries(b.stock ?? {})) w.stock[k] = (w.stock[k] ?? 0) + sign * n;
}

export function walletOf(grants: Grant[], txs: Tx[]): Wallet {
  const w: Wallet = { coins: 0, gems: 0, dust: 0, tickets: 0, mats: emptyMats(), tokens: {}, tokensEarned: {}, stock: {}, items: new Set(), chests: [] };
  const opened = new Set(txs.filter((t) => t.type === 'open').map((t) => t.ref));
  const addChests = (key: string, b: Bag, date: string, label: string) =>
    (b.chests ?? []).forEach((tier, i) => {
      const k = `${key}#${i}`;
      if (!opened.has(k)) w.chests.push({ key: k, tier, date, label });
    });
  for (const g of grants) {
    apply(w, g.gain, 1);
    for (const [k, n] of Object.entries(g.gain.tokens ?? {})) w.tokensEarned[k] = (w.tokensEarned[k] ?? 0) + n;
    for (const it of g.gain.items ?? []) w.items.add(it);
    addChests(g.key, g.gain, g.date, g.label);
  }
  for (const t of txs) {
    apply(w, t.gain, 1);
    apply(w, t.cost, -1);
    for (const it of t.gain.items ?? []) w.items.add(it);
    addChests(`tx:${t.id}`, t.gain, t.at, 'From a chest');
  }
  w.chests.sort((a, b) => a.date.localeCompare(b.date) || a.key.localeCompare(b.key));
  return w;
}

/** What's missing to pay for something (empty when you can). */
export function shortfall(w: Wallet, cost: Bag): string[] {
  const out: string[] = [];
  const need = (have: number, want: number | undefined, name: string) => {
    if (want && have < want) out.push(`${(want - Math.max(0, have)).toLocaleString('en-GB')} more ${name}`);
  };
  need(w.coins, cost.coins, 'Ryō');
  need(w.gems, cost.gems, 'Tama');
  need(w.dust, cost.dust, 'Stardust');
  need(w.tickets, cost.tickets, cost.tickets === 1 ? 'ticket' : 'tickets');
  for (const [s, n] of Object.entries(cost.mats ?? {})) need(w.mats[s as SectionId], n, MATS[s as SectionId].name);
  for (const [k, n] of Object.entries(cost.tokens ?? {})) need(w.tokens[k] ?? 0, n, 'tokens');
  return out;
}

export const canAfford = (w: Wallet, cost: Bag) => shortfall(w, cost).length === 0;

/** Reads a stored row back. Rows from an older version keep working: unknown fields are ignored. */
export function txOf(r: { id: string; kind: string; deleted_at: string | null; data: Record<string, unknown> }): Tx | null {
  if (r.deleted_at || r.kind !== 'gm_tx') return null;
  const d = r.data;
  if (typeof d.type !== 'string' || typeof d.at !== 'string' || typeof d.ref !== 'string') return null;
  return { id: r.id, type: d.type as TxType, at: d.at, ref: d.ref, cost: (d.cost as Bag) ?? {}, gain: (d.gain as Bag) ?? {}, rolled: Array.isArray(d.rolled) ? (d.rolled as Rarity[]) : undefined };
}

/** An upgrade's level on a day (a machine pays from the day it's bought). */
export function upgradeLevel(txs: Tx[], id: string, date?: string): number {
  let lv = 0;
  for (const t of txs) {
    if (t.type !== 'upgrade' || (date && t.at > date)) continue;
    const [uid, n] = t.ref.split(':');
    if (uid === id) lv = Math.max(lv, Number(n) || 0);
  }
  return lv;
}

/** The Mk you own of a chassis, or 0. */
export function chassisMk(w: Pick<Wallet, 'items'>, id: string): 0 | 1 | 2 | 3 {
  return w.items.has(`chassis:${id}:3`) ? 3 : w.items.has(`chassis:${id}:2`) ? 2 : w.items.has(`chassis:${id}:1`) ? 1 : 0;
}

/** Spins since the last Epic or better. */
export function spinsSinceEpic(txs: Tx[]): number {
  let n = 0;
  for (const t of txs) {
    if (t.type !== 'spin' || !t.rolled) continue;
    for (const r of t.rolled) n = r === 'common' || r === 'rare' ? n + 1 : 0;
  }
  return n;
}

// ─── what you're wearing ────────────────────────────────────────────────────

export interface Loadout {
  /** 'drone' is the character's own body, which follows the forms. */
  chassis: string;
  paint: string | null;
  hat: string | null;
  pet: string | null;
  aura: string | null;
  title: string | null;
}

export const DEFAULT_LOADOUT: Loadout = { chassis: 'drone', paint: null, hat: null, pet: null, aura: null, title: null };

export function normaliseLoadout(v: unknown): Loadout {
  if (!v || typeof v !== 'object') return DEFAULT_LOADOUT;
  const o = v as Record<string, unknown>;
  const str = (x: unknown) => (typeof x === 'string' && x ? x : null);
  return { chassis: str(o.chassis) ?? 'drone', paint: str(o.paint), hat: str(o.hat), pet: str(o.pet), aura: str(o.aura), title: str(o.title) };
}

// ─── naming things ──────────────────────────────────────────────────────────

/** A display name for anything a ledger row or a chest can hold. */
export function itemName(item: string): string {
  const [kind, id, mk] = item.split(':');
  if (kind === 'chassis') return `${chassisById(id)?.name ?? id} Mk ${mk === '3' ? 'III' : mk === '2' ? 'II' : 'I'}`;
  if (kind === 'theme') return `${id} theme`;
  const c = cosmeticOf(item);
  return c ? c.entry.name : item;
}

export function itemKindName(item: string): string {
  const [kind] = item.split(':');
  if (kind === 'chassis') return 'Chassis';
  if (kind === 'theme') return 'Colour theme';
  return COSMETIC_NAME[kind as CosmeticKind] ?? kind;
}

export const upgradeName = (ref: string) => upgradeById(ref.split(':')[0])?.name ?? ref;

/** Adds two bags. */
export function plus(a: Bag, b: Bag): Bag {
  const mats: Mats = { ...a.mats };
  for (const [s, n] of Object.entries(b.mats ?? {})) mats[s as SectionId] = (mats[s as SectionId] ?? 0) + (n ?? 0);
  const tokens = { ...a.tokens };
  for (const [k, n] of Object.entries(b.tokens ?? {})) tokens[k] = (tokens[k] ?? 0) + n;
  const stock = { ...a.stock };
  for (const [k, n] of Object.entries(b.stock ?? {})) stock[k] = (stock[k] ?? 0) + n;
  return {
    coins: (a.coins ?? 0) + (b.coins ?? 0),
    gems: (a.gems ?? 0) + (b.gems ?? 0),
    dust: (a.dust ?? 0) + (b.dust ?? 0),
    tickets: (a.tickets ?? 0) + (b.tickets ?? 0),
    mats,
    tokens,
    stock,
    items: [...(a.items ?? []), ...(b.items ?? [])],
    chests: [...(a.chests ?? []), ...(b.chests ?? [])],
  };
}
