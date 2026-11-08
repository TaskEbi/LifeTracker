/**
 * The shopping street around the Hangar's shop, all worked out from the date, the hour and your
 * `gm_tx` rows, so nothing new is stored and every device sees the same street:
 *
 * - Mameda, the tanuki who keeps the shop, and the Regular's card: trust from what you've spent,
 *   six ranks, each a standing discount and a perk.
 * - The stamp card: a stamp for each day you buy something, a prize for each full card.
 * - The time sale: one thing at half price for two hours a day.
 * - Haggling: once a day, stop the needle in the middle for money off a shelf item.
 * - The lucky bag (fukubukuro): pay up front, find out what's inside.
 * - Requests: townsfolk who want materials, and pay for them.
 * - The night market: after dark, past festivals' gear comes back, at a price.
 * - Gear sets (sets.ts) and a wishlist, which the Hangar shows.
 */
import type { SectionId } from '../../data/types';
import { addDays } from '../log/dates';
import { cosmeticLists, cosmeticPrice, MAT_IDS, MATS, RARITY, sellable, SHOP_THEMES, type Bag, type CosmeticKind, type Gear, type Mats, type Rarity, type Title } from './catalog';
import { EVENTS } from './events';
import { hash32 } from './loot';
import { discounted, gearItem, type ShopItem } from './shop';
import type { Tx, Wallet } from './wallet';

// ─── the Regular's card ─────────────────────────────────────────────────────

export interface Rank {
  n: number;
  name: string;
  kanji: string;
  /** Trust needed. */
  need: number;
  /** Standing discount in the shop, in whole percent. */
  off: number;
  /** What this rank adds, in words. */
  perk: string;
}

export const RANKS: Rank[] = [
  { n: 0, name: 'First-timer', kanji: '一見', need: 0, off: 0, perk: 'Look around. Buy something. Mameda remembers faces.' },
  { n: 1, name: 'Familiar face', kanji: '顔見', need: 150, off: 3, perk: '3% off, and Mameda will haggle with you once a day' },
  { n: 2, name: 'Regular', kanji: '常連', need: 500, off: 5, perk: '5% off, and a fourth request on the board' },
  { n: 3, name: 'Valued customer', kanji: '得意', need: 1200, off: 7, perk: '7% off, and a second lucky bag each week' },
  { n: 4, name: 'Patron', kanji: '旦那', need: 2500, off: 10, perk: '10% off, and a fourth stall in the night market' },
  { n: 5, name: 'Legend of the street', kanji: '名人', need: 5000, off: 12, perk: '12% off, and time sales at 60% off' },
];

/** Spending that earns trust. Exchanges, chests and using things up don't. */
const TRUSTED = new Set<Tx['type']>(['buy', 'mk', 'upgrade', 'spin', 'deliver']);

/** Trust: a point per 10 Ryō, per Tama, per 10 Stardust spent; a delivered request adds 15 and a point a material. */
export function trustOf(txs: Tx[]): number {
  let t = 0;
  for (const x of txs) {
    if (!TRUSTED.has(x.type)) continue;
    t += Math.floor((x.cost.coins ?? 0) / 10) + (x.cost.gems ?? 0) + Math.floor((x.cost.dust ?? 0) / 10);
    if (x.type === 'deliver') t += 15 + Object.values(x.cost.mats ?? {}).reduce((n, v) => n + (v ?? 0), 0);
  }
  return t;
}

export interface Standing {
  trust: number;
  rank: Rank;
  next: Rank | null;
  /** Share of the way to the next rank, 0–1 (1 at the top). */
  progress: number;
}

export function standingOf(txs: Tx[]): Standing {
  const trust = trustOf(txs);
  let rank = RANKS[0];
  for (const r of RANKS) if (trust >= r.need) rank = r;
  const next = RANKS[rank.n + 1] ?? null;
  return { trust, rank, next, progress: next ? (trust - rank.need) / (next.need - rank.need) : 1 };
}

/** A shop price after the standing discount. */
export const withRank = (cost: Bag, rank: Rank): Bag => (rank.off ? discounted(cost, rank.off) : cost);

export const perks = (rank: Rank) => ({
  haggle: rank.n >= 1,
  requests: rank.n >= 2 ? 4 : 3,
  bags: rank.n >= 3 ? 2 : 1,
  stalls: rank.n >= 4 ? 4 : 3,
  saleOff: rank.n >= 5 ? 60 : 50,
});

// ─── the stamp card ─────────────────────────────────────────────────────────

export const STAMP_CARD = 8;

/** Every fifth card is a gold one. */
export const stampPrize = (card: number): Bag => (card % 5 === 0 ? { gems: 50, tickets: 2, chests: ['gold'] } : { gems: 15, tickets: 1, chests: ['iron'] });

export interface StampCard {
  /** Days with a purchase, oldest first. */
  days: string[];
  /** Stamps on the card in hand. */
  onCard: number;
  /** Full cards (1-based) not yet handed in. */
  toClaim: number[];
  stampedToday: boolean;
}

export function stampCard(txs: Tx[], today: string): StampCard {
  const days = [...new Set(txs.filter((t) => t.type === 'buy').map((t) => t.at))].sort();
  const full = Math.floor(days.length / STAMP_CARD);
  const claimed = new Set(txs.filter((t) => t.type === 'claim' && t.ref.startsWith('stamp:')).map((t) => t.ref));
  const toClaim: number[] = [];
  for (let k = 1; k <= full; k++) if (!claimed.has(`stamp:${k}`)) toClaim.push(k);
  return { days, onCard: days.length % STAMP_CARD, toClaim, stampedToday: days.includes(today) };
}

// ─── the time sale ──────────────────────────────────────────────────────────

export interface TimeSale {
  item: ShopItem;
  /** Hours on the Daily Log clock, [from, to). */
  from: number;
  to: number;
}

const allSellable = (): { kind: CosmeticKind; g: Gear }[] =>
  (['paint', 'hat', 'pet', 'aura', 'title'] as CosmeticKind[]).flatMap((kind) => (cosmeticLists[kind] as (Gear & Title)[]).filter(sellable).map((g) => ({ kind, g })));

/** Two hours a day, somewhere between 8 in the morning and 9 at night, one Rare-or-better thing at half price. */
export function timeSale(date: string, rank: Rank): TimeSale {
  const h = hash32(`sale:${date}`);
  const from = 8 + (h % 12);
  const pool = allSellable().filter((x) => RARITY[x.g.rarity].order >= RARITY.rare.order);
  const { kind, g } = pool[(h >>> 5) % pool.length];
  return { item: gearItem(kind, g, perks(rank).saleOff), from, to: from + 2 };
}

export const saleState = (s: TimeSale, hour: number): 'soon' | 'on' | 'gone' => (hour < s.from ? 'soon' : hour < s.to ? 'on' : 'gone');

// ─── haggling ───────────────────────────────────────────────────────────────

/** Where the needle stopped (0–1, the middle at 0.5) as money off, in whole percent. */
export function haggleOff(pos: number): number {
  const d = Math.abs(Math.min(1, Math.max(0, pos)) - 0.5) * 2;
  if (d <= 0.07) return 30;
  if (d <= 0.2) return 20;
  if (d <= 0.38) return 12;
  if (d <= 0.6) return 6;
  return 0;
}

export const HAGGLE_WORDS: Record<number, string> = {
  30: 'Perfect. Mameda winces and knocks off 30%.',
  20: 'Good haggle: 20% off.',
  12: 'Not bad: 12% off.',
  6: 'He takes pity on you: 6% off.',
  0: 'He laughs. Full price.',
};

// ─── the lucky bag ──────────────────────────────────────────────────────────

/** Contents are rolled when you buy it (loot.ts rollLuckyBag), and always beat the price on average. */
export const LUCKY_BAG = { id: 'fukubukuro', name: 'Fukubukuro', kanji: '福', cost: { coins: 1500 } as Bag, line: 'A sealed lucky bag. Ryō, materials and one headline prize: gear, tickets, items or a gold chest.' };

export const bagsThisWeek = (txs: Tx[], monday: string) => txs.filter((t) => t.type === 'buy' && t.ref === LUCKY_BAG.id && t.at >= monday).length;

// ─── requests ───────────────────────────────────────────────────────────────

export interface Request {
  id: string;
  who: string;
  kanji: string;
  line: string;
  want: Mats;
  gain: Bag;
}

const FOLK: { who: string; kanji: string; line: string }[] = [
  { who: 'Old Gen, the carpenter', kanji: '大', line: 'My plane keeps catching. Bring me {m} and I\'ll pay fair.' },
  { who: 'Hanako from the bathhouse', kanji: '湯', line: 'The boiler\'s on its last legs. {m}, please, before the evening rush.' },
  { who: 'Professor Kuroda', kanji: '博', line: 'For an experiment I am not at liberty to discuss: {m}.' },
  { who: 'A kid with a kite', kanji: '凧', line: 'I\'m building a robot like yours! I need {m}. I have pocket money.' },
  { who: 'The night-shift guard', kanji: '警', line: 'Long nights. Something to tinker with would help. {m}?' },
  { who: 'Mrs Satō at the tofu shop', kanji: '豆', line: 'Don\'t ask what it\'s for. {m}, and there\'s tofu in it for you.' },
  { who: 'A travelling monk', kanji: '僧', line: 'The temple roof leaks onto the scrolls. {m} would mend it.' },
  { who: 'The fox at the shrine gate', kanji: '狐', line: 'A small offering, traveller. {m}. You will be rewarded. Probably.' },
  { who: 'Ramen Taishō', kanji: '麺', line: 'New stall, new sign. I need {m} by tonight.' },
  { who: 'The arcade\'s high scorer', kanji: '鬼', line: 'My cabinet\'s glitching. {m}. Don\'t tell anyone I asked.' },
  { who: 'Granny Fumi', kanji: '婆', line: 'My grandson wants a robot for his birthday. {m}, dear?' },
  { who: 'The lighthouse keeper', kanji: '灯', line: 'The lamp needs work before the fog comes in. {m}.' },
];

const matWords = (want: Mats) =>
  Object.entries(want)
    .map(([s, n]) => `${n} ${MATS[s as SectionId].name}`)
    .join(' and ');

/**
 * The day's board. `sections` are the ones you've worked in lately, so nobody asks for rosin if you
 * don't play; fewer than two and anything goes.
 */
export function requestsFor(date: string, sections: SectionId[], count: number): Request[] {
  const pool = sections.length >= 2 ? [...sections].sort() : [...MAT_IDS];
  const folk = [...FOLK];
  const out: Request[] = [];
  for (let i = 0; i < count; i++) {
    const h = hash32(`req:${date}:${i}`);
    const who = folk.splice(h % folk.length, 1)[0];
    const s1 = pool[(h >>> 4) % pool.length];
    const want: Mats = { [s1]: 4 + ((h >>> 9) % 8) };
    if ((h >>> 13) % 3 === 0 && pool.length > 1) {
      const rest = pool.filter((s) => s !== s1);
      want[rest[(h >>> 15) % rest.length]] = 3 + ((h >>> 19) % 5);
    }
    const units = Object.values(want).reduce((n, v) => n + (v ?? 0), 0);
    const gain: Bag = { coins: units * 25, gems: Math.ceil(units / 3), ...(units >= 14 ? { tickets: 1 } : {}) };
    out.push({ id: `req:${date}:${i}`, who: who.who, kanji: who.kanji, line: who.line.replace('{m}', matWords(want)), want, gain });
  }
  return out;
}

// ─── the night market ───────────────────────────────────────────────────────

export const NIGHT = { from: 19, to: 5 } as const;
export const nightOpen = (hour: number) => hour >= NIGHT.from || hour < NIGHT.to;
/** The night a moment belongs to: after midnight it's still the evening before. */
export const nightOf = (date: string, hour: number) => (hour < NIGHT.to ? addDays(date, -1) : date);

export const NIGHT_PRICE: Bag = { coins: 2500, gems: 60 };
export const NIGHT_DUST = 450;
export const NIGHT_EXTRAS = [
  { id: 'box', name: 'Shady strongbox', kanji: '箱', line: 'Fell off the back of a cart. An Iron Strongbox, no questions.', cost: { coins: 600 } as Bag, gain: { chests: ['iron'] } as Bag },
  { id: 'tickets', name: 'Ticket bundle', kanji: '券', line: 'Three capsule tickets, cheaper than spinning with Tama.', cost: { gems: 75 } as Bag, gain: { tickets: 3 } as Bag },
] as const;

/** Past festivals' gear, a few stalls a night (never the festival that's on). */
export function nightStock(night: string, runningEvent: string | null, stalls: number): ShopItem[] {
  const pool: { kind: CosmeticKind; id: string; name: string; rarity: Rarity }[] = [];
  for (const e of EVENTS) {
    if (e.id === runningEvent) continue;
    for (const [kind, id] of [['hat', e.hat], ['pet', e.pet], ['aura', e.aura], ['paint', e.paint]] as [CosmeticKind, string][]) {
      const g = cosmeticLists[kind].find((x) => x.id === id);
      if (g) pool.push({ kind, id, name: g.name, rarity: g.rarity });
    }
  }
  const out: ShopItem[] = [];
  for (let i = 0; i < stalls && pool.length; i++) {
    const p = pool.splice(hash32(`night:${night}:${i}`) % pool.length, 1)[0];
    out.push({ item: `${p.kind}:${p.id}`, name: p.name, kind: p.kind, rarity: p.rarity, cost: NIGHT_PRICE });
  }
  return out;
}

// ─── the wishlist ───────────────────────────────────────────────────────────

/** The catalogue price of a cosmetic or theme, or null for anything the catalogue doesn't sell. */
export function listPrice(item: string): { name: string; rarity: Rarity; cost: Bag } | null {
  const [kind, id] = item.split(':');
  if (kind === 'theme') {
    const t = SHOP_THEMES.find((x) => x.id === id);
    return t ? { name: t.name, rarity: t.rarity, cost: cosmeticPrice(t.rarity) } : null;
  }
  const g = (cosmeticLists[kind as CosmeticKind] as (Gear & Title)[] | undefined)?.find((x) => x.id === id);
  return g && sellable(g) ? { name: g.name, rarity: g.rarity, cost: cosmeticPrice(g.rarity) } : null;
}

/** How close you are to affording something, 0–1: the scarcest currency decides. */
export function saved(w: Wallet, cost: Bag): number {
  const parts: [number, number | undefined][] = [
    [w.coins, cost.coins],
    [w.gems, cost.gems],
    [w.dust, cost.dust],
  ];
  let p = 1;
  for (const [have, need] of parts) if (need) p = Math.min(p, Math.max(0, have) / need);
  return Math.min(1, p);
}

// ─── Mameda ─────────────────────────────────────────────────────────────────

export interface TalkContext {
  date: string;
  hour: number;
  rank: Rank;
  coins: number;
  wish: { name: string; ready: boolean } | null;
  sale: { name: string; state: 'soon' | 'on' | 'gone'; from: number; to: number };
  night: boolean;
  event: string | null;
  stampsToGo: number;
  toClaim: boolean;
}

const MORNING = [
  'Early, aren\'t you? The kettle\'s on. Have a look round.',
  'Fresh stock on the shelf, fresh dust on the counter.',
  'Morning! Log something before school and come back rich.',
];
const DAY = [
  'Everything on the shelf is real, and so is the price. Mostly.',
  'Buy something, I\'ll stamp your card. Eight stamps and I\'ll owe you.',
  'I\'ve been a tanuki for three hundred years. I know a bargain.',
  'The capsule machine is rigged. In your favour, eventually. Read the odds.',
  'Requests on the board, if you\'ve materials to spare.',
];
const EVENING = [
  'Long day? Sit. Browse. Spend responsibly.',
  'The lanterns go up at seven. You didn\'t hear it from me.',
  'Closing soon. Ha! I never close.',
];
const LATE = ['It\'s the middle of the night. Even tanuki sleep. Go to bed.', 'Shop\'s open, you shouldn\'t be. Sleep pays Moonlight, you know.'];

/** What Mameda says when you walk in: the most useful thing first, otherwise small talk. */
export function mamedaLine(c: TalkContext): string {
  const pick = (list: string[]) => list[hash32(`talk:${c.date}:${c.hour}`) % list.length];
  if (c.hour < 5) return pick(LATE);
  if (c.toClaim) return 'Your stamp card\'s full! Hand it over and I\'ll fetch your prize.';
  if (c.wish?.ready) return `That ${c.wish.name} you've been eyeing? You can afford it now. Just saying.`;
  if (c.sale.state === 'on') return `Time sale! ${c.sale.name} at a discount, but only till ${c.sale.to}:00.`;
  if (c.night) return 'Lanterns are up round the back. The night market\'s open till five.';
  if (c.coins < 100) return 'Pockets looking light. Go and log something; the Ryō will follow.';
  if (c.event && hash32(`ev:${c.date}`) % 3 === 0) return `${c.event} is on. Festival stuff sells out when it ends, so don't dawdle.`;
  if (c.sale.state === 'soon' && hash32(`soon:${c.date}:${c.hour}`) % 2 === 0) return `Come back at ${c.sale.from}:00. I'm putting something good on sale.`;
  if (c.stampsToGo <= 2 && c.stampsToGo > 0) return `${c.stampsToGo} more stamp${c.stampsToGo === 1 ? '' : 's'} and your card's full.`;
  return pick(c.hour < 11 ? MORNING : c.hour < 18 ? DAY : EVENING);
}

const THANKS = [
  'Pleasure doing business.',
  'Good choice. That one\'s been staring at me all week.',
  'Sold! Come back soon.',
  'Wear it well.',
  'I\'d have paid double. Don\'t tell anyone.',
  'Stamped. Mind how you go.',
];
export const thanksLine = (n: number) => THANKS[hash32(`thanks:${n}`) % THANKS.length];
