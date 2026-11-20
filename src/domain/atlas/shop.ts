/**
 * The Chandlery 店: what Doubloons buy in the Atlas. Supplies are used up in play; ships, charts and
 * titles are bought once and kept. Prices live here; a purchase row keeps what it cost.
 */

export type Shelf = 'supply' | 'ship' | 'chart' | 'title';

export interface Good {
  id: string;
  shelf: Shelf;
  name: string;
  kanji: string;
  price: number;
  hint: string;
  /** Supplies: the most you can hold. */
  max?: number;
}

export type SupplyId = 'fifty' | 'glass' | 'heart' | 'sand' | 'anchor';

export const SUPPLIES: (Good & { id: SupplyId })[] = [
  { id: 'fifty', shelf: 'supply', name: 'Fifty-fifty', kanji: '半', price: 25, max: 99, hint: 'Takes away half the wrong answers. Typing becomes four choices; the whole map becomes four lit' },
  { id: 'glass', shelf: 'supply', name: 'Spyglass', kanji: '鏡', price: 15, max: 99, hint: 'A clue: the region, and the first letter of the answer' },
  { id: 'heart', shelf: 'supply', name: 'Spare heart', kanji: '命', price: 40, max: 99, hint: 'One more life in survival, or a patched hull on a voyage' },
  { id: 'sand', shelf: 'supply', name: 'Hourglass', kanji: '砂', price: 40, max: 99, hint: 'Fifteen more seconds in a sprint' },
  { id: 'anchor', shelf: 'supply', name: 'Streak anchor', kanji: '錨', price: 120, max: 2, hint: 'Holds your streak through a day you don’t play. Used by itself; two at most' },
];

export interface Ship extends Good {
  /** Storms it can take on a voyage. */
  hull: number;
  /** Extra voyage pay, as a fraction. */
  bonus: number;
}
export const SHIPS: Ship[] = [
  { id: 'raft', shelf: 'ship', name: 'Raft', kanji: '筏', price: 0, hull: 3, bonus: 0, hint: 'Logs and rope. It floats' },
  { id: 'sloop', shelf: 'ship', name: 'Sloop', kanji: '帆', price: 250, hull: 3, bonus: 0.1, hint: 'One mast, quick about the islands' },
  { id: 'dhow', shelf: 'ship', name: 'Dhow', kanji: '舟', price: 500, hull: 4, bonus: 0.2, hint: 'A lateen sail that rode the monsoon' },
  { id: 'junk', shelf: 'ship', name: 'Junk', kanji: '戎', price: 900, hull: 4, bonus: 0.3, hint: 'Battened sails and a hull in watertight rooms' },
  { id: 'galleon', shelf: 'ship', name: 'Galleon', kanji: '艦', price: 1500, hull: 5, bonus: 0.4, hint: 'Three masts and a hold for treasure' },
  { id: 'clipper', shelf: 'ship', name: 'Clipper', kanji: '疾', price: 2400, hull: 5, bonus: 0.5, hint: 'All sail, built to race the tea home' },
  { id: 'steamer', shelf: 'ship', name: 'Steamer', kanji: '汽', price: 3600, hull: 6, bonus: 0.6, hint: 'Paddle wheels, a funnel and no need of wind' },
  { id: 'airship', shelf: 'ship', name: 'Airship', kanji: '飛', price: 5000, hull: 6, bonus: 0.8, hint: 'Over the storms rather than through them' },
];

export const CHARTS: Good[] = [
  { id: 'night', shelf: 'chart', name: 'Night chart', kanji: '夜', price: 0, hint: 'Sea blue and sage, lit in amber' },
  { id: 'parchment', shelf: 'chart', name: 'Parchment', kanji: '紙', price: 400, hint: 'An old explorer’s map in ink and sepia' },
  { id: 'blueprint', shelf: 'chart', name: 'Blueprint', kanji: '青', price: 400, hint: 'White lines on drafting blue' },
  { id: 'daylight', shelf: 'chart', name: 'Daylight', kanji: '昼', price: 400, hint: 'A school atlas: bright sea, green land' },
  { id: 'jade', shelf: 'chart', name: 'Jade', kanji: '翠', price: 700, hint: 'Carved green stone on black lacquer' },
  { id: 'neon', shelf: 'chart', name: 'Neon', kanji: '光', price: 900, hint: 'A radar screen at midnight' },
  { id: 'royal', shelf: 'chart', name: 'Royal', kanji: '金', price: 1500, hint: 'Gold leaf on deep purple, fit for a court' },
];

export const TITLES: Good[] = [
  { id: 'curious', shelf: 'title', name: 'the Curious', kanji: '問', price: 50, hint: 'Everyone starts somewhere' },
  { id: 'flags', shelf: 'title', name: 'Flag Fanatic', kanji: '旗', price: 150, hint: 'Can tell Chad from Romania' },
  { id: 'hopper', shelf: 'title', name: 'Border Hopper', kanji: '越', price: 200, hint: 'Never stays in one country long' },
  { id: 'capitals', shelf: 'title', name: 'Capital Collector', kanji: '都', price: 250, hint: 'Ouagadougou? Easy' },
  { id: 'seadog', shelf: 'title', name: 'Sea Dog', kanji: '海', price: 300, hint: 'Salt in the beard' },
  { id: 'wizard', shelf: 'title', name: 'Map Wizard', kanji: '魔', price: 500, hint: 'Finds Tuvalu without zooming' },
  { id: 'oldsalt', shelf: 'title', name: 'Old Salt', kanji: '老', price: 800, hint: 'Has seen every storm twice' },
  { id: 'keeper', shelf: 'title', name: 'Keeper of the Globe', kanji: '球', price: 1500, hint: 'The world, held in one head' },
];

export const GOODS: Good[] = [...SUPPLIES, ...SHIPS, ...CHARTS, ...TITLES];
const BY = new Map(GOODS.map((g) => [g.id, g]));
export const good = (id: string): Good | undefined => BY.get(id);
export const ship = (id: string): Ship => SHIPS.find((s) => s.id === id) ?? SHIPS[0];
export const isSupply = (id: string): id is SupplyId => SUPPLIES.some((s) => s.id === id);
/** Kept once bought (and the free ones are had from the start). */
export const isKeep = (id: string) => !!good(id) && !isSupply(id);
export const FREE = new Set(GOODS.filter((g) => g.price === 0).map((g) => g.id));
