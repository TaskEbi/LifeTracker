/**
 * Everything the Hangar sells, drops and unlocks. Only descriptions and prices live here: the art
 * is in `src/ui/i/bots`, what you own is worked out from `gm_tx` rows (see wallet.ts).
 */
import type { SectionId } from '../../data/types';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

export const RARITY: Record<Rarity, { name: string; kanji: string; color: string; order: number }> = {
  common: { name: 'Common', kanji: '並', color: '#b8c2cc', order: 0 },
  rare: { name: 'Rare', kanji: '稀', color: '#55b8ff', order: 1 },
  epic: { name: 'Epic', kanji: '極', color: '#c77dff', order: 2 },
  legendary: { name: 'Legendary', kanji: '伝', color: '#ffc23d', order: 3 },
  mythic: { name: 'Mythic', kanji: '神', color: '#ff4d8d', order: 4 },
};

// ─── currencies ─────────────────────────────────────────────────────────────

/** 両 Ryō: the everyday coin. 玉 Tama: the rare gem. 星 Stardust: what a duplicate capsule breaks into. */
export const COIN = { id: 'coins', name: 'Ryō', kanji: '両', color: '#ffc23d' } as const;
export const GEM = { id: 'gems', name: 'Tama', kanji: '玉', color: '#3df5e0' } as const;
export const DUST = { id: 'dust', name: 'Stardust', kanji: '星', color: '#c9a7ff' } as const;
export const TICKET = { id: 'tickets', name: 'Capsule ticket', kanji: '券', color: '#ff6fae' } as const;

/** One material per section: doing the thing is the only way to get it. */
export const MATS: Record<SectionId, { name: string; kanji: string; hint: string }> = {
  violin: { name: 'Rosin', kanji: '松', hint: 'practice' },
  coding: { name: 'Logic chip', kanji: '碼', hint: 'coding' },
  sports: { name: 'Trail stone', kanji: '岩', hint: 'runs and matches' },
  gym: { name: 'Iron plate', kanji: '鉄', hint: 'lifting' },
  study: { name: 'Chalk', kanji: '墨', hint: 'school study' },
  chess: { name: 'Ivory', kanji: '駒', hint: 'chess' },
  sleep: { name: 'Moonlight', kanji: '月', hint: 'logged nights' },
  screen: { name: 'Zen sand', kanji: '砂', hint: 'screen time' },
  cabinet: { name: 'Curio', kanji: '珍', hint: 'the Cabinet' },
  future: { name: 'Ticket stub', kanji: '符', hint: 'uni prep' },
  reading: { name: 'Ink', kanji: '頁', hint: 'reading' },
  maths: { name: 'Proof', kanji: '証', hint: 'contest maths' },
};
export const MAT_IDS = Object.keys(MATS) as SectionId[];

export type Mats = Partial<Record<SectionId, number>>;

/** A price or a gain. Event tokens are per event occurrence ('momiji-2026'). */
export interface Bag {
  coins?: number;
  gems?: number;
  dust?: number;
  tickets?: number;
  mats?: Mats;
  tokens?: Record<string, number>;
  /** Consumables, by id. */
  stock?: Record<string, number>;
  /** Cosmetics and other one-off things (`hat:crown`), kept for good. */
  items?: string[];
  /** Unopened chests are worked out from records; a loot chest adds one here. */
  chests?: ChestTier[];
}

// ─── the robot: chassis ─────────────────────────────────────────────────────

export type ChassisGroup = 'folklore' | 'toys' | 'tribute' | 'cosmic' | 'event';

export interface Chassis {
  id: string;
  name: string;
  kanji: string;
  group: ChassisGroup;
  rarity: Rarity;
  /** Default colours; a paint job replaces them. */
  c: string;
  c2: string;
  blurb: string;
  /** Mk II and Mk III add hardware; what each one adds. */
  mk: [string, string];
  /** Overall level needed to buy it. */
  level?: number;
  /** A tribute's section and the section level each Mk needs. */
  section?: SectionId;
  /** Only sold in this event. */
  event?: string;
  /** Materials a Mk costs: the first two carry the weight. */
  mats?: SectionId[];
}

const F = (id: string, name: string, kanji: string, rarity: Rarity, c: string, c2: string, blurb: string, mk: [string, string], mats: SectionId[], level?: number): Chassis => ({ id, name, kanji, group: 'folklore', rarity, c, c2, blurb, mk, mats, level });
const T = (id: string, name: string, kanji: string, rarity: Rarity, c: string, c2: string, blurb: string, mk: [string, string], mats: SectionId[], level?: number): Chassis => ({ id, name, kanji, group: 'toys', rarity, c, c2, blurb, mk, mats, level });
const S = (id: string, name: string, kanji: string, section: SectionId, c: string, c2: string, blurb: string, mk: [string, string]): Chassis => ({ id, name, kanji, group: 'tribute', rarity: 'epic', c, c2, blurb, mk, section, mats: [section] });
const C = (id: string, name: string, kanji: string, rarity: Rarity, c: string, c2: string, blurb: string, mk: [string, string], mats: SectionId[], level: number): Chassis => ({ id, name, kanji, group: 'cosmic', rarity, c, c2, blurb, mk, mats, level });
const E = (id: string, name: string, kanji: string, event: string, c: string, c2: string, blurb: string, mk: [string, string]): Chassis => ({ id, name, kanji, group: 'event', rarity: 'legendary', c, c2, blurb, mk, event });

export const CHASSIS: Chassis[] = [
  F('tanuki', 'Tanuki Tinker', '狸', 'common', '#8a5a33', '#f2c078', 'A raccoon-dog that drums its own belly and fixes things badly.', ['Sake flask and a leaf on its head', 'Straw hat and a bigger belly drum'], ['gym', 'cabinet']),
  F('daruma', 'Daruma', '達', 'common', '#d7263d', '#ffd166', 'Knock it over and it gets back up. One eye painted in, the other when you win.', ['Gold moustache and brows', 'Second eye painted in, gold kanji on the belly'], ['study', 'sleep']),
  F('kappa', 'Kappa Diver', '河', 'rare', '#2a9d8f', '#a7f3d0', 'A river imp in a diving rig. Keep the dish on its head full.', ['Tortoise-shell backpack', 'Webbed hands and a cucumber torpedo'], ['sports', 'screen']),
  F('maneki', 'Maneki Unit', '招', 'rare', '#f4f1ea', '#e63946', 'A beckoning cat, wired to the till. Its paw never stops.', ['Red collar with a gold bell', 'Giant koban coin in its other paw'], ['cabinet', 'future'], 5),
  F('kasa', 'Kasa-obake', '傘', 'rare', '#7b2cbf', '#ffd60a', 'A one-legged umbrella ghost. Its tongue is out. So is its warranty.', ['Geta sandal and torn ribs', 'A trail of little rain clouds'], ['sleep', 'reading'], 8),
  F('chochin', 'Chōchin Lantern', '灯', 'rare', '#f77f00', '#fcbf49', 'A paper lantern that split open and grinned. Lit from inside.', ['Hanging tassels and a burning wick', 'Ghost flames circling it'], ['reading', 'sleep'], 10),
  F('karakuri', 'Karakuri Doll', '絡', 'epic', '#9c6644', '#e6ccb2', 'An Edo-period tea-serving automaton, with its back taken off.', ['Exposed brass gears', 'Tea tray and a spinning escapement'], ['coding', 'study'], 15),
  F('koi', 'Koi Submarine', '鯉', 'epic', '#e85d04', '#faa307', 'A koi with portholes. It swam the waterfall and kept going.', ['Periscope and fins', 'A waterfall of bubbles and a dragon whisker'], ['sports', 'future'], 18),
  F('tengu', 'Tengu Jet', '天', 'epic', '#c1121f', '#fdf0d5', 'A long-nosed mountain goblin with feathered jet engines.', ['Feather fan and a tokin cap', 'Full wings and afterburners'], ['chess', 'sports'], 22),
  F('komainu', 'Komainu Guard', '狛', 'legendary', '#6c757d', '#ffb703', 'A shrine lion-dog in stone armour. One mouth open, one shut.', ['Curled mane plates', 'Shimenawa rope and a guardian flame'], ['gym', 'maths'], 30),

  T('tin', 'Tin Toy', '錫', 'common', '#e63946', '#a8dadc', 'A 1950s wind-up robot, sparking at the chest. Key in the back.', ['Spark-gun chest and pincers', 'Rocket pack and a bigger key'], ['cabinet', 'gym']),
  T('pocket', 'Pocket Bit', '携', 'common', '#8d99ae', '#8bac0f', 'A brick of a handheld with a two-tone green face.', ['Link cable tail', 'Cartridge crown and pixel particles'], ['coding', 'screen']),
  T('capsule', 'Capsule Kid', '蛋', 'common', '#ff6fae', '#f4f1ea', 'A little one who came out of a gashapon and stayed in the ball.', ['Stickers and little arms', 'Spare capsules orbiting it'], ['cabinet', 'reading']),
  T('boombox', 'Boombox', '響', 'rare', '#3a3a3a', '#ff3366', 'Twin speakers, a cassette for a mouth. Always on side B.', ['Pumping speaker cones', 'Handle, equaliser and headphones'], ['violin', 'screen'], 5),
  T('vending', 'Jihanki', '販', 'rare', '#0077b6', '#ffb703', 'A Japanese vending machine that went for a walk.', ['Lit drink rows and a coin slot', 'Hot/cold panel and a falling can'], ['cabinet', 'sports'], 8),
  T('sprite', '8-Bit Knight', '騎', 'epic', '#2d6a4f', '#ffd166', 'Every pixel is a little square. It has never once been anti-aliased.', ['Pixel sword and shield', 'Pixel cape and a heart bar'], ['coding', 'chess'], 12),
  T('arcade', 'Cabinet Rex', '遊', 'epic', '#3a0ca3', '#f72585', 'An arcade cabinet with a marquee for a forehead and a joystick arm.', ['Marquee and CRT glow', 'Coin door and a high score'], ['coding', 'screen'], 20),

  S('maestro', 'The Maestro', '奏', 'violin', '#7f3b1d', '#f0c27b', 'Body of a violin, scroll for a head, f-holes for a face.', ['A drawn bow arm', 'Floating staves and notes']),
  S('compiler', 'The Compiler', '譯', 'coding', '#0f3d1e', '#39ff14', 'A green-phosphor CRT on legs. Its face is an ASCII smile.', ['Ribbon-cable arms and a keyboard', 'Falling code and an AC stamp']),
  S('pacer', 'The Pacer', '駆', 'sports', '#d9480f', '#fff3bf', 'A race bib, spring legs and a stopwatch for a face.', ['Winged running shoes', 'Finish tape and a speed trail']),
  S('ironclad', 'The Ironclad', '鋼', 'gym', '#343a40', '#c0ff33', 'A kettlebell torso, plates for shoulders. Does not skip legs.', ['Loaded barbell across the back', 'Lifting belt and chalk cloud']),
  S('scholar', 'The Scholar', '賢', 'study', '#264653', '#e9c46a', 'A chalkboard with a mortarboard. Marks your work in real time.', ['Chalk-tray arms and a ruler', 'Orbiting formulae and a tassel']),
  S('knight', 'The Grandmaster', '棋', 'chess', '#2b2d42', '#edf2f4', 'A knight piece with a visor, always one move ahead.', ['Board-pattern barding', 'Crown and a captured queen']),
  S('dreamer', 'The Dreamer', '夢', 'sleep', '#3c096c', '#ffd6ff', 'A crescent moon in a nightcap, hugging a pillow.', ['A small sheep to count', 'Constellation and drifting Zs']),
  S('monk', 'The Monk', '禅', 'screen', '#5f7a61', '#e9f5db', 'A stack of balanced stones around a sleeping phone.', ['An ensō halo', 'Raked sand and a bamboo fountain']),
  S('curator', 'The Curator', '蒐', 'cabinet', '#6f4e37', '#ffe8b6', 'A curio cabinet on legs. Its eyes are two open drawers.', ['Red thread map', 'Specimen jars orbiting it']),
  S('conductor', 'The Station Master', '駅', 'future', '#14213d', '#fca311', 'A split-flap departure board with a peaked cap and a whistle.', ['Ticket punch and a lantern', 'A little train circling it']),
  S('bookworm', 'The Bookworm', '書', 'reading', '#774936', '#fff1d0', 'An open book with a bookmark tongue and reading glasses.', ['Stacks of spines for feet', 'Pages taking flight and a lamp']),
  S('euclid', 'Euclid', '幾', 'maths', '#c1272d', '#f9b816', 'Byrne\'s red, blue and yellow, folded into a walking right triangle.', ['Dividers for legs', 'Squares on all three sides, and Q.E.D.']),

  C('origami', 'Paper Crane', '折', 'rare', '#ef476f', '#fff5e1', 'One sheet, no cuts, a thousand folds. Weighs nothing.', ['Sharper folded wings', 'A flight of little cranes'], ['study', 'screen'], 12),
  C('bonsai', 'Bonsai Mech', '盆', 'epic', '#588157', '#a3b18a', 'A tiny old tree growing out of a robot in a glazed pot.', ['Hanging moss and a wire frame', 'Blossom and a tiny shrine'], ['sleep', 'cabinet'], 25),
  C('jelly', 'Abyssal Jelly', '海', 'epic', '#06d6a0', '#ff5ca8', 'A bioluminescent bell from the deepest part of the sea.', ['Longer glowing tentacles', 'A lure and drifting spores'], ['sleep', 'reading'], 30),
  C('saucer', 'Mothership', '飛', 'epic', '#7209b7', '#4cc9f0', 'A saucer with a very small pilot and a very big plan.', ['Landing legs and a dome', 'Tractor beam, carrying a cow'], ['future', 'coding'], 35),
  C('crystal', 'Crystal Golem', '晶', 'legendary', '#4361ee', '#90e0ef', 'Faceted all the way through. Light comes out differently than it went in.', ['Floating shards', 'A crown of prisms and rainbow refraction'], ['maths', 'gym'], 45),
  C('orrery', 'The Orrery', '儀', 'legendary', '#b08968', '#ffd166', 'A brass model of the heavens, with a sun in its chest.', ['Three planets on arms', 'Saturn and a star map'], ['maths', 'reading'], 60),
  C('tesla', 'Tesla Coil', '雷', 'mythic', '#3a86ff', '#ffbe0b', 'A column of copper rings holding a live arc for a head.', ['Arcs between its hands', 'Ball lightning and a plasma globe'], ['coding', 'maths'], 80),

  E('kodama', 'Kodama', '紅', 'momiji', '#d00000', '#ffba08', 'A forest spirit with a maple-leaf face, rattling its head.', ['A crown of red maple', 'Falling leaves and a shrine bell']),
  E('yukidaruma', 'Yuki-daruma', '雪', 'yuki', '#caf0f8', '#ff6b6b', 'A snow daruma in a bucket hat. Melts for nobody.', ['Scarf and a twig broom', 'A blizzard and an ice crown']),
  E('setsubunoni', 'Setsubun Oni', '鬼', 'setsubun', '#e63946', '#ffd60a', 'Beans have never worked on this one.', ['A spiked kanabō club', 'Tiger-skin belt and thunder drums']),
  E('sakurei', 'Sakura Spirit', '桜', 'hanami', '#ffafcc', '#ffffff', 'A paper-thin shrine maiden of petals and very little time.', ['Hanging blossom hairpins', 'A storm of petals and a tiny lantern']),
  E('teruteru', 'Teru-teru Bōzu', '雨', 'tsuyu', '#adb5bd', '#4895ef', 'The little cloth ghost you hang up to ask for a dry day.', ['Hydrangea blooms and a string', 'A rainbow and a rain-proof parasol']),
  E('orihime', 'Star Weaver', '織', 'tanabata', '#3d348b', '#f7b801', 'Weaves the Milky Way out of wishes on strips of paper.', ['A loom of light and tanzaku', 'A magpie bridge across the stars']),
  E('kingyo', 'Kingyo Matsuri', '祭', 'natsu', '#ff4d6d', '#fff0f3', 'A festival goldfish in a bag, wearing a happi coat.', ['Paper scoop and a fan', 'Fireworks and a taiko drum']),
  E('hyakki', 'Night Parade', '百', 'hyakki', '#ff7b00', '#9d4edd', 'A jack-o\'-lantern at the head of a hundred demons.', ['Bats and a witch\'s hat', 'A parade of ghost flames']),
];

export const chassisById = (id: string) => CHASSIS.find((x) => x.id === id);

const MK_COIN: Record<Rarity, number[]> = {
  common: [800, 1500, 4000],
  rare: [1800, 3000, 7000],
  epic: [3000, 5000, 11000],
  legendary: [5000, 9000, 18000],
  mythic: [9000, 15000, 30000],
};
const MK_MAT: Record<Rarity, number[]> = {
  common: [8, 25, 60],
  rare: [15, 40, 90],
  epic: [25, 60, 140],
  legendary: [40, 90, 200],
  mythic: [60, 140, 300],
};
const MK_GEM: Record<Rarity, number[]> = {
  common: [0, 15, 50],
  rare: [10, 30, 80],
  epic: [40, 80, 180],
  legendary: [120, 180, 350],
  mythic: [250, 300, 600],
};
/** Section level a tribute's Mk needs. */
export const TRIBUTE_LEVEL = [3, 8, 15];
/** Event chassis cost tokens; Mk upgrades take tokens then materials from anything you've got. */
const EVENT_TOKENS = [700, 900, 1200];

/** What Mk n of a chassis costs (n = 1 buys it). */
export function chassisCost(ch: Chassis, mk: 1 | 2 | 3, eventKey?: string): Bag {
  const i = mk - 1;
  if (ch.event) return { tokens: eventKey ? { [eventKey]: EVENT_TOKENS[i] } : {}, gems: [0, 50, 120][i] };
  const mats: Mats = {};
  for (const [n, s] of (ch.mats ?? []).entries()) mats[s] = Math.round(MK_MAT[ch.rarity][i] * (n === 0 ? 1 : 0.6));
  return { coins: MK_COIN[ch.rarity][i], gems: MK_GEM[ch.rarity][i] || undefined, mats };
}

// ─── the robot: paint, hats, pets, auras, titles ────────────────────────────

export interface Paint {
  id: string;
  name: string;
  rarity: Rarity;
  c: string;
  c2: string;
  /** A CSS effect on the whole robot. */
  fx?: 'neon' | 'chrome' | 'holo' | 'void' | 'gold' | 'glitch' | 'ink';
  event?: string;
}

export const PAINTS: Paint[] = [
  { id: 'gunmetal', name: 'Gunmetal', rarity: 'common', c: '#4b5563', c2: '#9ca3af' },
  { id: 'bronze', name: 'Old Bronze', rarity: 'common', c: '#9a6a2f', c2: '#e0b973' },
  { id: 'bubblegum', name: 'Bubblegum', rarity: 'common', c: '#ec4899', c2: '#fbcfe8' },
  { id: 'mint', name: 'Mint Chip', rarity: 'common', c: '#14b8a6', c2: '#ccfbf1' },
  { id: 'denim', name: 'Denim', rarity: 'common', c: '#1e40af', c2: '#bfdbfe' },
  { id: 'clay', name: 'Terracotta', rarity: 'common', c: '#b4532a', c2: '#fcd9b6' },
  { id: 'sunset', name: 'Sunset Strip', rarity: 'rare', c: '#f43f5e', c2: '#fbbf24' },
  { id: 'ultra', name: 'Ultraviolet', rarity: 'rare', c: '#6d28d9', c2: '#f0abfc' },
  { id: 'toxic', name: 'Toxic Waste', rarity: 'rare', c: '#65a30d', c2: '#d9f99d' },
  { id: 'glacier', name: 'Glacier', rarity: 'rare', c: '#0284c7', c2: '#e0f2fe' },
  { id: 'indigo', name: 'Aizome', rarity: 'rare', c: '#1e3a5f', c2: '#7fb3d5' },
  { id: 'lacquer', name: 'Red Lacquer', rarity: 'rare', c: '#a4161a', c2: '#ffcb69' },
  { id: 'neon', name: 'Neon Tokyo', rarity: 'epic', c: '#ff2bd6', c2: '#2ef2ff', fx: 'neon' },
  { id: 'chrome', name: 'Liquid Chrome', rarity: 'epic', c: '#94a3b8', c2: '#f8fafc', fx: 'chrome' },
  { id: 'sumi', name: 'Sumi-e', rarity: 'epic', c: '#111111', c2: '#d4d4d4', fx: 'ink' },
  { id: 'blood', name: 'Blood Moon', rarity: 'epic', c: '#7f1d1d', c2: '#fb7185', fx: 'neon' },
  { id: 'gold', name: 'Gold Leaf', rarity: 'legendary', c: '#b8860b', c2: '#fff1a8', fx: 'gold' },
  { id: 'holo', name: 'Holographic', rarity: 'legendary', c: '#22d3ee', c2: '#f472b6', fx: 'holo' },
  { id: 'glitch', name: 'Corrupted', rarity: 'legendary', c: '#00ff9d', c2: '#ff0055', fx: 'glitch' },
  { id: 'void', name: 'The Void', rarity: 'mythic', c: '#312e81', c2: '#a78bfa', fx: 'void' },
  { id: 'maple', name: 'Maple Lacquer', rarity: 'epic', c: '#b91c1c', c2: '#fdba74', event: 'momiji' },
  { id: 'frost', name: 'First Frost', rarity: 'epic', c: '#7dd3fc', c2: '#ffffff', fx: 'chrome', event: 'yuki' },
  { id: 'beans', name: 'Roasted Bean', rarity: 'epic', c: '#78350f', c2: '#fde68a', event: 'setsubun' },
  { id: 'petal', name: 'Falling Petal', rarity: 'epic', c: '#f9a8d4', c2: '#fff1f2', event: 'hanami' },
  { id: 'hydrangea', name: 'Hydrangea', rarity: 'epic', c: '#6366f1', c2: '#c4b5fd', event: 'tsuyu' },
  { id: 'milkyway', name: 'Milky Way', rarity: 'epic', c: '#1e1b4b', c2: '#fde047', fx: 'neon', event: 'tanabata' },
  { id: 'firework', name: 'Hanabi', rarity: 'epic', c: '#e11d48', c2: '#38bdf8', fx: 'neon', event: 'natsu' },
  { id: 'pumpkin', name: 'Pumpkin Rot', rarity: 'epic', c: '#c2410c', c2: '#a855f7', event: 'hyakki' },
];

export interface Gear {
  id: string;
  name: string;
  rarity: Rarity;
  event?: string;
}

export const HATS: Gear[] = [
  { id: 'cap', name: 'Bottle Cap', rarity: 'common' },
  { id: 'headband', name: 'Hachimaki', rarity: 'common' },
  { id: 'propeller', name: 'Propeller Beanie', rarity: 'common' },
  { id: 'catears', name: 'Cat Ears', rarity: 'common' },
  { id: 'kasa', name: 'Straw Kasa', rarity: 'rare' },
  { id: 'headphones', name: 'Studio Headphones', rarity: 'rare' },
  { id: 'mortar', name: 'Mortarboard', rarity: 'rare' },
  { id: 'tophat', name: 'Top Hat', rarity: 'rare' },
  { id: 'antlers', name: 'Nara Antlers', rarity: 'rare' },
  { id: 'kitsune', name: 'Kitsune Mask', rarity: 'epic' },
  { id: 'kabuto', name: 'Kabuto', rarity: 'epic' },
  { id: 'wizard', name: 'Star Wizard', rarity: 'epic' },
  { id: 'horns', name: 'Oni Horns', rarity: 'epic' },
  { id: 'crown', name: 'Crown', rarity: 'legendary' },
  { id: 'halo', name: 'Halo', rarity: 'legendary' },
  { id: 'sunwheel', name: 'Sun Wheel', rarity: 'mythic' },
  { id: 'momijiwreath', name: 'Maple Wreath', rarity: 'epic', event: 'momiji' },
  { id: 'santa', name: 'Snow Cap', rarity: 'epic', event: 'yuki' },
  { id: 'onimask', name: 'Paper Oni Mask', rarity: 'epic', event: 'setsubun' },
  { id: 'blossom', name: 'Blossom Crown', rarity: 'epic', event: 'hanami' },
  { id: 'raincoat', name: 'Rain Hood', rarity: 'epic', event: 'tsuyu' },
  { id: 'tanzaku', name: 'Wish Strips', rarity: 'epic', event: 'tanabata' },
  { id: 'happi', name: 'Festival Band', rarity: 'epic', event: 'natsu' },
  { id: 'witch', name: 'Witch Hat', rarity: 'epic', event: 'hyakki' },
];

export const PETS: Gear[] = [
  { id: 'chick', name: 'Piyo the Chick', rarity: 'common' },
  { id: 'cube', name: 'Companion Cube', rarity: 'common' },
  { id: 'slime', name: 'Mochi Slime', rarity: 'common' },
  { id: 'cat', name: 'Roof Cat', rarity: 'rare' },
  { id: 'goldfish', name: 'Air Goldfish', rarity: 'rare' },
  { id: 'wisp', name: 'Hitodama', rarity: 'rare' },
  { id: 'bat', name: 'Bat Drone', rarity: 'rare' },
  { id: 'minidrone', name: 'Your First Form', rarity: 'epic' },
  { id: 'shuriken', name: 'Living Shuriken', rarity: 'epic' },
  { id: 'moon', name: 'Pocket Moon', rarity: 'epic' },
  { id: 'dragon', name: 'Tiny Ryū', rarity: 'legendary' },
  { id: 'blackhole', name: 'House-trained Black Hole', rarity: 'mythic' },
  { id: 'tanukileaf', name: 'Leaf Sprite', rarity: 'epic', event: 'momiji' },
  { id: 'snowbun', name: 'Snow Rabbit', rarity: 'epic', event: 'yuki' },
  { id: 'bean', name: 'Lucky Bean', rarity: 'epic', event: 'setsubun' },
  { id: 'bee', name: 'Sakura Bee', rarity: 'epic', event: 'hanami' },
  { id: 'snail', name: 'Rain Snail', rarity: 'epic', event: 'tsuyu' },
  { id: 'magpie', name: 'Bridge Magpie', rarity: 'epic', event: 'tanabata' },
  { id: 'hanabi', name: 'Pocket Firework', rarity: 'epic', event: 'natsu' },
  { id: 'ghost', name: 'Little Ghost', rarity: 'epic', event: 'hyakki' },
];

export const AURAS: Gear[] = [
  { id: 'dust', name: 'Workshop Dust', rarity: 'common' },
  { id: 'embers', name: 'Embers', rarity: 'rare' },
  { id: 'bubbles', name: 'Bubbles', rarity: 'rare' },
  { id: 'notes', name: 'Floating Notes', rarity: 'rare' },
  { id: 'matrix', name: 'Falling Code', rarity: 'epic' },
  { id: 'lightning', name: 'Static', rarity: 'epic' },
  { id: 'sigil', name: 'Summoning Circle', rarity: 'epic' },
  { id: 'galaxy', name: 'Pocket Galaxy', rarity: 'legendary' },
  { id: 'rays', name: 'Go-sign Rays', rarity: 'legendary' },
  { id: 'eclipse', name: 'Total Eclipse', rarity: 'mythic' },
  { id: 'leaves', name: 'Falling Maple', rarity: 'epic', event: 'momiji' },
  { id: 'snow', name: 'Quiet Snow', rarity: 'epic', event: 'yuki' },
  { id: 'beanstorm', name: 'Thrown Beans', rarity: 'epic', event: 'setsubun' },
  { id: 'petals', name: 'Petal Storm', rarity: 'epic', event: 'hanami' },
  { id: 'rain', name: 'Plum Rain', rarity: 'epic', event: 'tsuyu' },
  { id: 'stars', name: 'River of Stars', rarity: 'epic', event: 'tanabata' },
  { id: 'lanterns', name: 'Festival Lanterns', rarity: 'epic', event: 'natsu' },
  { id: 'flames', name: 'Ghost Flames', rarity: 'epic', event: 'hyakki' },
];

export interface Title extends Gear {
  /** Earned, not bought: a section at this level, or an overall level. */
  section?: SectionId;
  sectionLevel?: number;
  level?: number;
  /** Earned by completing a gear set (sets.ts), never sold. */
  set?: string;
}

export const TITLES: Title[] = [
  { id: 'rookie', name: 'Fresh out of the box', rarity: 'common' },
  { id: 'tinkerer', name: 'Weekend Tinkerer', rarity: 'common' },
  { id: 'ronin', name: 'Masterless', rarity: 'rare' },
  { id: 'capsule', name: 'One More Spin', rarity: 'rare' },
  { id: 'nightowl', name: 'Night Owl', rarity: 'rare' },
  { id: 'whale', name: 'Certified Whale', rarity: 'epic' },
  { id: 'sudo', name: 'sudo make me a sandwich', rarity: 'epic' },
  { id: 'menace', name: 'A Menace to Bosses', rarity: 'epic' },
  { id: 'lastboss', name: 'Final Boss Energy', rarity: 'legendary' },
  { id: 'protag', name: 'Main Character', rarity: 'legendary' },
  { id: 'virtuoso', name: 'Virtuoso', rarity: 'epic', section: 'violin', sectionLevel: 15 },
  { id: 'accepted', name: 'Accepted on First Submit', rarity: 'epic', section: 'coding', sectionLevel: 15 },
  { id: 'distance', name: 'Goes the Distance', rarity: 'epic', section: 'sports', sectionLevel: 15 },
  { id: 'liftheavy', name: 'Lifts Heavy Things Up', rarity: 'epic', section: 'gym', sectionLevel: 15 },
  { id: 'topset', name: 'Top Set', rarity: 'epic', section: 'study', sectionLevel: 15 },
  { id: 'zugzwang', name: 'Zugzwang', rarity: 'epic', section: 'chess', sectionLevel: 15 },
  { id: 'wellrested', name: 'Well Rested, For Once', rarity: 'epic', section: 'sleep', sectionLevel: 15 },
  { id: 'offline', name: 'Gone Offline', rarity: 'epic', section: 'screen', sectionLevel: 15 },
  { id: 'hoarder', name: 'Tasteful Hoarder', rarity: 'epic', section: 'cabinet', sectionLevel: 15 },
  { id: 'boarding', name: 'Now Boarding', rarity: 'epic', section: 'future', sectionLevel: 15 },
  { id: 'tsundoku', name: 'Tsundoku Survivor', rarity: 'epic', section: 'reading', sectionLevel: 15 },
  { id: 'qed', name: 'Q.E.D.', rarity: 'epic', section: 'maths', sectionLevel: 15 },
  { id: 'centurion', name: 'Centurion', rarity: 'legendary', level: 100 },
  { id: 'twohundred', name: 'Two Hundred Not Out', rarity: 'mythic', level: 200 },
  { id: 'set_ninja', name: 'Shadow of the Arcade', rarity: 'epic', set: 'ninja' },
  { id: 'set_shrine', name: 'Keeper of the Gate', rarity: 'epic', set: 'shrine' },
  { id: 'set_arcade', name: 'High Score', rarity: 'epic', set: 'arcade' },
  { id: 'set_farm', name: 'Salt of the Earth', rarity: 'rare', set: 'farm' },
  { id: 'set_storm', name: 'Eye of the Storm', rarity: 'epic', set: 'storm' },
  { id: 'set_space', name: 'Spacefarer', rarity: 'legendary', set: 'space' },
  { id: 'set_royal', name: 'Long May They Reign', rarity: 'legendary', set: 'royal' },
  { id: 'set_void', name: 'Beyond the Veil', rarity: 'mythic', set: 'void' },
  { id: 'set_cosy', name: 'Softest Robot Alive', rarity: 'rare', set: 'cosy' },
  { id: 'set_class', name: 'Top of the Class', rarity: 'rare', set: 'class' },
  { id: 'set_setsubun', name: 'Oni wa Soto', rarity: 'epic', set: 'setsubun' },
  { id: 'set_hanami', name: 'Under the Blossom', rarity: 'epic', set: 'hanami' },
  { id: 'set_tsuyu', name: 'Rain Walker', rarity: 'epic', set: 'tsuyu' },
  { id: 'set_tanabata', name: 'Wish Upon a Strip', rarity: 'epic', set: 'tanabata' },
  { id: 'set_natsu', name: 'Summer Never Ends', rarity: 'epic', set: 'natsu' },
  { id: 'set_hyakki', name: 'Head of the Parade', rarity: 'epic', set: 'hyakki' },
  { id: 'set_momiji', name: 'Autumn Spirit', rarity: 'epic', set: 'momiji' },
  { id: 'set_yuki', name: 'Snow Festival Royalty', rarity: 'epic', set: 'yuki' },
];

/** Things the shop and the capsule machine may hand out: not event-only, earned or set titles. */
export const sellable = (g: Gear & Partial<Title>) => !g.event && !g.section && !g.level && !g.set;

export type CosmeticKind = 'paint' | 'hat' | 'pet' | 'aura' | 'title';
export const cosmeticLists: Record<CosmeticKind, readonly (Gear | Paint | Title)[]> = { paint: PAINTS, hat: HATS, pet: PETS, aura: AURAS, title: TITLES };
export const COSMETIC_NAME: Record<CosmeticKind, string> = { paint: 'Paint', hat: 'Headgear', pet: 'Companion', aura: 'Aura', title: 'Title' };

/** `hat:crown` → its entry. */
export function cosmeticOf(item: string): { kind: CosmeticKind; entry: Gear | Paint | Title } | null {
  const [kind, id] = item.split(':');
  const list = cosmeticLists[kind as CosmeticKind];
  const entry = list?.find((x) => x.id === id);
  return entry ? { kind: kind as CosmeticKind, entry } : null;
}

const COSMETIC_COIN: Record<Rarity, number> = { common: 400, rare: 1200, epic: 3200, legendary: 7000, mythic: 14000 };
const COSMETIC_GEM: Record<Rarity, number> = { common: 0, rare: 0, epic: 40, legendary: 150, mythic: 400 };
export const DUST_PRICE: Record<Rarity, number> = { common: 40, rare: 120, epic: 400, legendary: 1200, mythic: 3000 };
export const DUST_FROM_DUPE: Record<Rarity, number> = { common: 8, rare: 24, epic: 80, legendary: 240, mythic: 600 };

/** Shop price of a cosmetic; titles earned by level aren't sold. */
export function cosmeticPrice(rarity: Rarity): Bag {
  return { coins: COSMETIC_COIN[rarity], gems: COSMETIC_GEM[rarity] || undefined };
}

// ─── consumables ────────────────────────────────────────────────────────────

export interface Consumable {
  id: string;
  name: string;
  kanji: string;
  rarity: Rarity;
  desc: string;
  price: Bag;
  /** Limited per week in the shop, so none of them can replace actually doing the thing. */
  weeklyLimit?: number;
}

export const SCROLL_XP = { scroll: 120, bigscroll: 500 } as const;
export const TONIC = { pct: 0.5, cap: 120 } as const;
export const BOMB_DMG = 150;

export const CONSUMABLES: Consumable[] = [
  { id: 'scroll', name: 'Training Scroll', kanji: '巻', rarity: 'common', desc: `+${SCROLL_XP.scroll} XP towards your overall level the moment you read it.`, price: { coins: 500 }, weeklyLimit: 3 },
  { id: 'bigscroll', name: 'Secret Technique', kanji: '奥', rarity: 'rare', desc: `+${SCROLL_XP.bigscroll} XP towards your overall level.`, price: { gems: 40 }, weeklyLimit: 1 },
  { id: 'tonic', name: 'Spirit Tonic', kanji: '薬', rarity: 'rare', desc: `Today's XP gets a ${TONIC.pct * 100}% top-up, up to ${TONIC.cap} XP. Drink it, then go and do something.`, price: { coins: 900 }, weeklyLimit: 2 },
  { id: 'bomb', name: 'Raid Bomb', kanji: '爆', rarity: 'rare', desc: `${BOMB_DMG} damage to this week's boss. Doesn't raise next week's HP.`, price: { coins: 700 }, weeklyLimit: 2 },
  { id: 'incense', name: 'Lucky Incense', kanji: '香', rarity: 'rare', desc: 'Doubles the Ryō you earn from XP today.', price: { gems: 15 }, weeklyLimit: 2 },
  { id: 'omamori', name: 'Streak Omamori', kanji: '守', rarity: 'epic', desc: 'When the streak buffer is holding, turns yesterday into a rest day and refills the shield.', price: { gems: 30 }, weeklyLimit: 1 },
];
export const consumableById = (id: string) => CONSUMABLES.find((x) => x.id === id);

// ─── workshop upgrades ──────────────────────────────────────────────────────

export interface Upgrade {
  id: string;
  name: string;
  kanji: string;
  desc: string;
  /** What each level gives, in words. */
  per: (lv: number) => string;
  /** Cost of level 1, 2, … (its length is the max level). */
  costs: Bag[];
  /** Overall level needed. */
  level?: number;
}

export const UPGRADES: Upgrade[] = [
  {
    id: 'magnet',
    name: 'Coin Magnet',
    kanji: '磁',
    desc: 'Pulls more Ryō out of every XP you earn from today on.',
    per: (lv) => `+${lv * 5}% Ryō`,
    costs: [
      { coins: 500, mats: { gym: 5 } },
      { coins: 1500, mats: { gym: 15, coding: 10 } },
      { coins: 3500, mats: { gym: 30, coding: 25 }, gems: 20 },
      { coins: 7000, mats: { gym: 60, coding: 50 }, gems: 60 },
      { coins: 12000, mats: { gym: 120, coding: 100 }, gems: 150 },
    ],
  },
  {
    id: 'dynamo',
    name: 'Daily Dynamo',
    kanji: '発',
    desc: 'A little generator. Every day you do anything at all, it pays out.',
    per: (lv) => `+${lv * 15} Ryō per active day`,
    costs: [
      { coins: 400, mats: { sleep: 5 } },
      { coins: 1200, mats: { sleep: 15, sports: 10 } },
      { coins: 3000, mats: { sleep: 30, sports: 25 } },
      { coins: 6000, mats: { sleep: 60, sports: 50 }, gems: 40 },
      { coins: 10000, mats: { sleep: 100, sports: 90 }, gems: 100 },
    ],
  },
  {
    id: 'scanner',
    name: 'Material Scanner',
    kanji: '探',
    desc: 'Finds extra material each day you work in a section.',
    per: (lv) => `+${lv} material per section per day`,
    costs: [
      { coins: 800, mats: { study: 10, chess: 10 } },
      { coins: 2500, mats: { study: 30, chess: 30 }, gems: 25 },
      { coins: 6000, mats: { study: 70, chess: 70 }, gems: 80 },
    ],
  },
  {
    id: 'prospector',
    name: 'Gem Prospector',
    kanji: '鉱',
    desc: 'Digs out extra Tama whenever you clear quests or beat a boss.',
    per: (lv) => `+${lv} Tama per daily sweep, +${lv * 5} per weekly sweep or boss`,
    costs: [
      { coins: 1500, mats: { maths: 10, future: 10 } },
      { coins: 4000, mats: { maths: 30, future: 30 }, gems: 50 },
      { coins: 9000, mats: { maths: 70, future: 70 }, gems: 150 },
    ],
    level: 5,
  },
  {
    id: 'hideout',
    name: 'Hideout Wiring',
    kanji: '基',
    desc: 'Runs a cable down to the Hideout. Its rooms pay double from now on.',
    per: () => 'Double Ryō from Hideout rooms',
    costs: [{ coins: 2000, mats: { cabinet: 25, reading: 25 }, gems: 30 }],
    level: 5,
  },
  {
    id: 'printer',
    name: 'Ticket Printer',
    kanji: '刷',
    desc: 'Prints capsule tickets for every week you turn up.',
    per: (lv) => `+${lv} capsule ticket${lv === 1 ? '' : 's'} a week`,
    costs: [
      { coins: 1500, mats: { screen: 15, violin: 15 } },
      { coins: 4500, mats: { screen: 40, violin: 40 }, gems: 60 },
      { coins: 10000, mats: { screen: 90, violin: 90 }, gems: 180 },
    ],
    level: 8,
  },
  {
    id: 'cat',
    name: 'Lucky Cat Shrine',
    kanji: '猫',
    desc: 'Chests you open hold more, and drop gear more often.',
    per: (lv) => `+${lv * 20}% chest coins, +${lv * 5}% gear chance`,
    costs: [
      { coins: 2000, mats: { cabinet: 20, future: 20 }, gems: 20 },
      { coins: 5000, mats: { cabinet: 50, future: 50 }, gems: 70 },
      { coins: 11000, mats: { cabinet: 100, future: 100 }, gems: 200 },
    ],
    level: 10,
  },
  {
    id: 'mechanic',
    name: 'Capsule Mechanic',
    kanji: '匠',
    desc: 'Tunes the capsule machine: an Epic or better arrives sooner.',
    per: (lv) => `Guaranteed Epic within ${pityFor(lv)} spins`,
    costs: [
      { coins: 2500, mats: { coding: 25, maths: 25 } },
      { coins: 7000, mats: { coding: 60, maths: 60 }, gems: 80 },
    ],
    level: 12,
  },
  {
    id: 'festival',
    name: 'Festival Pass',
    kanji: '祝',
    desc: 'More tokens in every seasonal event.',
    per: (lv) => `+${lv * 25}% event tokens`,
    costs: [
      { coins: 3000, mats: { reading: 30, sleep: 30 }, gems: 40 },
      { coins: 9000, mats: { reading: 70, sleep: 70 }, gems: 150 },
    ],
    level: 15,
  },
  {
    id: 'rack',
    name: 'Omamori Rack',
    kanji: '札',
    desc: 'A free Streak Omamori on the first of every month.',
    per: () => '1 free Omamori a month',
    costs: [{ coins: 6000, mats: { sleep: 50, study: 50 }, gems: 120 }],
    level: 25,
  },
];
export const upgradeById = (id: string) => UPGRADES.find((x) => x.id === id);

export function pityFor(mechanicLevel: number): number {
  return [30, 22, 15][Math.min(2, mechanicLevel)];
}

// ─── chests ─────────────────────────────────────────────────────────────────

export type ChestTier = 'wood' | 'iron' | 'gold' | 'mythic';
export const CHESTS: Record<ChestTier, { name: string; kanji: string; color: string; coins: [number, number]; gems: [number, number]; mats: [number, number]; rolls: number; gear: number; ticket: number }> = {
  wood: { name: 'Wooden Crate', kanji: '木', color: '#b08150', coins: [40, 120], gems: [0, 2], mats: [2, 6], rolls: 1, gear: 0.04, ticket: 0.08 },
  iron: { name: 'Iron Strongbox', kanji: '鉄', color: '#9fb3c8', coins: [150, 400], gems: [3, 10], mats: [5, 14], rolls: 2, gear: 0.14, ticket: 0.25 },
  gold: { name: 'Gold Chest', kanji: '金', color: '#ffc23d', coins: [500, 1200], gems: [15, 40], mats: [12, 30], rolls: 3, gear: 0.4, ticket: 0.7 },
  mythic: { name: 'Mythic Reliquary', kanji: '神', color: '#ff4d8d', coins: [2000, 5000], gems: [80, 200], mats: [30, 70], rolls: 4, gear: 1, ticket: 1 },
};

// ─── capsule machine ────────────────────────────────────────────────────────

export const SPIN_COST = { gems: 30 } as const;
export const SPIN10_COST = { gems: 270 } as const;
export const SPIN_ODDS: Record<Rarity, number> = { common: 58, rare: 29, epic: 10.5, legendary: 2.2, mythic: 0.3 };

/** Everything the machine can drop (nothing event-only, and no titles earned by level). */
export function capsulePool(): { item: string; rarity: Rarity }[] {
  const out: { item: string; rarity: Rarity }[] = [];
  for (const kind of ['paint', 'hat', 'pet', 'aura', 'title'] as CosmeticKind[]) {
    for (const e of cosmeticLists[kind] as (Gear & Title)[]) {
      if (!sellable(e)) continue;
      out.push({ item: `${kind}:${e.id}`, rarity: e.rarity });
    }
  }
  return out;
}

// ─── new colour themes, sold in the shop ────────────────────────────────────

export const SHOP_THEMES = [
  { id: 'arcade', name: 'Arcade Night', kanji: '遊', rarity: 'rare' as Rarity, c: '#ff2e93', c2: '#21e6ff' },
  { id: 'gilded', name: 'Gilded', kanji: '金', rarity: 'epic' as Rarity, c: '#d4a017', c2: '#fff1a8' },
  { id: 'deepsea', name: 'Abyss', kanji: '淵', rarity: 'epic' as Rarity, c: '#06d6a0', c2: '#ff5ca8' },
  { id: 'momiji', name: 'Momiji', kanji: '紅', rarity: 'epic' as Rarity, c: '#d00000', c2: '#ffba08' },
  { id: 'gameboy', name: 'DMG-01', kanji: '携', rarity: 'legendary' as Rarity, c: '#306230', c2: '#8bac0f' },
];
