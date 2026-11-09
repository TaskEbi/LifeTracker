/**
 * The weekly boss, derived like quests. Each week (Monday to Sunday) a boss is drawn by date from a
 * fixed roster, so every device shows the same one and nothing is stored. Everything logged that
 * week hits it; its weak section hits twice as hard. Its HP comes from your own last four weeks, so
 * the bosses grow as you do. Defeating it is an XP event keyed by the week, so it pays once.
 *
 * Two eras. Before BOSS_ERA2 the first eight bosses come round with the original rules, so past
 * weeks never change. From BOSS_ERA2 all 24 come round, and they are stronger: ranks (Demon,
 * Warlord, Overlord) that scale HP and reward, a trait each (regenerate, enrage or resist), a second
 * phase at half HP that switches the weakness, and combos for days that hit three or more sections.
 */
import { addDays, dayCount, weekStart } from '../log/dates';
import { SECTION_IDS, TIMED_SECTIONS, type SectionId } from '../../data/types';
import { BOMB_DMG } from '../game/catalog';
import type { ProgressInput, XpEvent, XpSection } from './engine';
import { dayFacts, hash, type Facts } from './quests';

/** Bosses start this week: earlier weeks have none, so old history can't defeat any. */
export const BOSS_FROM = '2026-10-26';
/** The stronger roster and rules start this week. */
export const BOSS_ERA2 = '2026-11-16';
/** XP for a first-era boss (and a Demon-rank one after). */
export const BOSS_XP = 100;

export const DMG = {
  /** Per minute logged; the weak section deals `weakMultiplier` times this. */
  minute: 1,
  weakMultiplier: 2,
  task: 10,
  night: 10,
  bedtime: 10,
  screen: 5,
  screenUnder: 15,
  /** The first time a section shows up in the week. */
  newSection: 25,
} as const;

/** Era-two combos: a day that hits this many different sections. */
export const COMBO = { three: 30, five: 80 } as const;
/** Regenerating bosses heal this share of their HP after a whole day with no hits. */
export const REGEN = 0.06;
/** Enraged bosses grow this much on Saturday if more than half their HP is left. */
export const ENRAGE = 0.2;

export const HP_MIN = 300;
export const HP_MAX = 1500;
const HP_GROWTH = 1.1;
/** Era two: harder. */
export const HP2 = { min: 500, max: 3200, growth: 1.25 } as const;

export type Tier = 1 | 2 | 3;
export const TIERS: Record<Tier, { name: string; kanji: string; hp: number; xp: number }> = {
  1: { name: 'Demon', kanji: '鬼', hp: 1, xp: 100 },
  2: { name: 'Warlord', kanji: '将', hp: 1.2, xp: 150 },
  3: { name: 'Overlord', kanji: '王', hp: 1.45, xp: 220 },
};

export type Trait = 'regen' | 'enrage' | 'resist';
export const TRAITS: Record<Trait, { name: string; kanji: string }> = {
  regen: { name: 'Regenerates', kanji: '再' },
  enrage: { name: 'Enrages', kanji: '怒' },
  resist: { name: 'Resists', kanji: '盾' },
};

export type Face = 'mask' | 'round' | 'skull' | 'long' | 'square';
export type Eyes = 'two' | 'one' | 'three' | 'slits' | 'many';
export type Mouth = 'fangs' | 'grin' | 'beak' | 'flat' | 'tusks' | 'stitched' | 'void';
export type Extra = 'ears' | 'wings' | 'tentacles' | 'halo' | 'beard' | 'tongue' | 'antlers' | 'mane' | 'blindfold' | 'claws' | 'nose' | 'gems' | 'scales';

export interface BossDef {
  id: string;
  name: string;
  /** What it is, in a few words. */
  title: string;
  kanji: string;
  weak: SectionId;
  /** What it says when it appears. */
  taunt: string;
  c: string;
  c2: string;
  /** Art: horn count and mouth. */
  horns: 0 | 1 | 2 | 3;
  mouth: Mouth;
  face?: Face;
  eyes?: Eyes;
  extra?: Extra[];
  /** Era two. */
  tier: Tier;
  trait: Trait;
  /** For `resist`: the section that deals half. */
  resist?: SectionId;
  /** The weakness once its mask cracks at half HP. */
  weak2: SectionId;
  /** What it says when it cracks. */
  taunt2: string;
}

export const BOSSES: BossDef[] = [
  // The first eight (the whole first era).
  { id: 'namake', name: 'Namake-oni', title: 'Oni of the Sofa', kanji: '怠', weak: 'gym', taunt: 'Just one more episode…', c: '#b91c1c', c2: '#fca5a5', horns: 2, mouth: 'fangs', tier: 1, trait: 'regen', weak2: 'sports', taunt2: 'Fine. FINE. I’ll get up.' },
  { id: 'yofukashi', name: 'Yofukashi-garasu', title: 'Crow of the Late Night', kanji: '夜', weak: 'sleep', taunt: 'Midnight is still early.', c: '#312e81', c2: '#a5b4fc', horns: 0, mouth: 'beak', tier: 2, trait: 'enrage', weak2: 'screen', taunt2: 'Caw… the sun… it burns…' },
  { id: 'sumaho', name: 'Sumaho-kitsune', title: 'Fox of the Endless Feed', kanji: '画', weak: 'screen', taunt: 'Scroll. Scroll. Scroll.', c: '#ea580c', c2: '#fed7aa', horns: 0, mouth: 'grin', tier: 1, trait: 'regen', weak2: 'reading', taunt2: 'Wait, you put the phone DOWN?' },
  { id: 'wasure', name: 'Wasure-gumo', title: 'Spider of Forgetting', kanji: '忘', weak: 'study', taunt: 'You learned that? I ate it.', c: '#4c1d95', c2: '#c4b5fd', horns: 3, mouth: 'fangs', tier: 2, trait: 'regen', weak2: 'reading', taunt2: 'My web… you remembered?' },
  { id: 'mushi', name: 'Mushi-ryū', title: 'Dragon of Bugs', kanji: '虫', weak: 'coding', taunt: 'Wrong Answer on test 37.', c: '#15803d', c2: '#86efac', horns: 2, mouth: 'grin', tier: 2, trait: 'resist', resist: 'study', weak2: 'maths', taunt2: 'Accepted?! Impossible!' },
  { id: 'fukyo', name: 'Fukyō-tengu', title: 'Tengu of Discord', kanji: '濁', weak: 'violin', taunt: 'Your E string is flat.', c: '#9f1239', c2: '#fda4af', horns: 1, mouth: 'flat', tier: 1, trait: 'enrage', weak2: 'study', taunt2: 'That… was in tune.' },
  { id: 'kage', name: 'Kage-shōgun', title: 'General of Blunders', kanji: '影', weak: 'chess', taunt: 'Hang the queen. I dare you.', c: '#1e293b', c2: '#cbd5e1', horns: 2, mouth: 'flat', tier: 2, trait: 'resist', resist: 'gym', weak2: 'maths', taunt2: 'You saw the fork. How?' },
  { id: 'noroma', name: 'Noroma-kappa', title: 'Kappa of the Slow Lane', kanji: '鈍', weak: 'sports', taunt: 'Why run? Float.', c: '#0e7490', c2: '#a5f3fc', horns: 0, mouth: 'grin', tier: 1, trait: 'regen', weak2: 'gym', taunt2: 'My dish is spilling!' },

  // Era two: sixteen more.
  { id: 'shiori', name: 'Shiori-kui', title: 'Devourer of Bookmarks', kanji: '栞', weak: 'reading', taunt: 'You’ll finish it someday. Someday.', c: '#92400e', c2: '#fcd34d', horns: 0, mouth: 'void', face: 'round', eyes: 'one', extra: ['tentacles'], tier: 1, trait: 'regen', weak2: 'study', taunt2: 'Chapter after chapter… stop!' },
  { id: 'nebou', name: 'Nebō-baku', title: 'Tapir of Oversleeping', kanji: '寝', weak: 'sleep', taunt: 'Five more minutes. Forever.', c: '#1e3a8a', c2: '#93c5fd', horns: 0, mouth: 'flat', face: 'round', eyes: 'slits', extra: ['ears', 'nose'], tier: 1, trait: 'regen', weak2: 'gym', taunt2: 'Who set an ALARM?' },
  { id: 'gorogoro', name: 'Gorogoro-ushi', title: 'Ox of Lying Around', kanji: '転', weak: 'gym', taunt: 'The floor is comfortable.', c: '#57534e', c2: '#e7e5e4', horns: 2, mouth: 'tusks', face: 'square', eyes: 'two', extra: ['beard'], tier: 1, trait: 'resist', resist: 'study', weak2: 'sports', taunt2: 'MOO— I mean, ow.' },
  { id: 'kara', name: 'Kara-gani', title: 'Crab of the Comfort Shell', kanji: '殻', weak: 'sports', taunt: 'Outside is overrated.', c: '#c2410c', c2: '#fdba74', horns: 0, mouth: 'stitched', face: 'square', eyes: 'many', extra: ['claws'], tier: 1, trait: 'resist', resist: 'coding', weak2: 'gym', taunt2: 'My shell is cracking!' },
  { id: 'atode', name: 'Atode-tanuki', title: 'Tanuki of “Later”', kanji: '後', weak: 'study', taunt: 'Later. Definitely later.', c: '#78350f', c2: '#fde68a', horns: 0, mouth: 'grin', face: 'round', eyes: 'two', extra: ['ears', 'beard'], tier: 1, trait: 'regen', weak2: 'coding', taunt2: 'Now?! You did it NOW?' },
  { id: 'keisan', name: 'Keisan-nue', title: 'Chimera of Careless Slips', kanji: '算', weak: 'maths', taunt: 'Did you carry the one?', c: '#0f766e', c2: '#5eead4', horns: 2, mouth: 'fangs', face: 'long', eyes: 'three', extra: ['mane'], tier: 2, trait: 'enrage', weak2: 'study', taunt2: 'You checked your working…' },
  { id: 'mirai', name: 'Mirai-nashi', title: 'Phantom of No Plan', kanji: '迷', weak: 'future', taunt: 'Applications? Next year.', c: '#6b21a8', c2: '#e9d5ff', horns: 0, mouth: 'void', face: 'skull', eyes: 'slits', extra: ['blindfold'], tier: 2, trait: 'enrage', weak2: 'study', taunt2: 'A plan… I can see a plan…' },
  { id: 'tsuuchi', name: 'Tsūchi-nezumi', title: 'Rat King of Notifications', kanji: '鳴', weak: 'screen', taunt: 'Ding! Ding! Ding!', c: '#be185d', c2: '#f9a8d4', horns: 0, mouth: 'grin', face: 'round', eyes: 'many', extra: ['ears', 'tongue'], tier: 2, trait: 'regen', weak2: 'reading', taunt2: 'Do Not Disturb?! Cruel!' },
  { id: 'onchi', name: 'Onchi-dako', title: 'Octopus of Wrong Notes', kanji: '音', weak: 'violin', taunt: 'Was that a C sharp? Bold.', c: '#7e22ce', c2: '#d8b4fe', horns: 0, mouth: 'void', face: 'round', eyes: 'two', extra: ['tentacles'], tier: 2, trait: 'resist', resist: 'coding', weak2: 'study', taunt2: 'Scales… the scales hurt…' },
  { id: 'nullpo', name: 'Nullpo-oni', title: 'Oni of the Null Pointer', kanji: '零', weak: 'coding', taunt: 'Segmentation fault (core dumped).', c: '#064e3b', c2: '#6ee7b7', horns: 2, mouth: 'stitched', face: 'square', eyes: 'one', extra: ['gems'], tier: 2, trait: 'regen', weak2: 'maths', taunt2: 'Bounds checked?! Rude.' },
  { id: 'tsumi', name: 'Tsumi-gitsune', title: 'Fox of Forced Mates', kanji: '詰', weak: 'chess', taunt: 'Mate in three. Yours.', c: '#a16207', c2: '#fef08a', horns: 0, mouth: 'grin', face: 'long', eyes: 'slits', extra: ['ears', 'mane'], tier: 2, trait: 'enrage', weak2: 'maths', taunt2: 'You calculated it all…' },
  { id: 'yowaki', name: 'Yowaki-tengu', title: 'Tengu of Self-Doubt', kanji: '疑', weak: 'violin', taunt: 'Everyone else is better.', c: '#b91c1c', c2: '#fecaca', horns: 1, mouth: 'flat', face: 'long', eyes: 'two', extra: ['nose', 'wings'], tier: 2, trait: 'resist', resist: 'screen', weak2: 'chess', taunt2: 'You… kept going anyway?' },
  { id: 'shimekiri', name: 'Shimekiri-gami', title: 'God of Deadlines', kanji: '締', weak: 'study', taunt: 'Due tomorrow. Or was it today?', c: '#7f1d1d', c2: '#fca5a5', horns: 3, mouth: 'fangs', face: 'mask', eyes: 'three', extra: ['halo', 'gems'], tier: 3, trait: 'enrage', weak2: 'future', taunt2: 'Handed in… EARLY?!' },
  { id: 'akirame', name: 'Akirame-yūrei', title: 'Ghost of Giving Up', kanji: '諦', weak: 'violin', taunt: 'Why bother? Nobody’s watching.', c: '#334155', c2: '#e2e8f0', horns: 0, mouth: 'void', face: 'long', eyes: 'slits', extra: ['blindfold', 'halo'], tier: 3, trait: 'regen', weak2: 'gym', taunt2: 'You didn’t give up. I… fade.' },
  { id: 'daidara', name: 'Daidara-bocchi', title: 'Giant of the Endless Week', kanji: '巨', weak: 'gym', taunt: 'Your week is small. I am not.', c: '#44403c', c2: '#fbbf24', horns: 2, mouth: 'tusks', face: 'square', eyes: 'three', extra: ['antlers', 'beard'], tier: 3, trait: 'resist', resist: 'screen', weak2: 'sports', taunt2: 'The mountain… shakes?' },
  { id: 'yamiryu', name: 'Yami-ryūō', title: 'Dragon King of the Dark Screen', kanji: '闇', weak: 'screen', taunt: 'One more video. Then sleep. Then one more.', c: '#1e1b4b', c2: '#a78bfa', horns: 2, mouth: 'fangs', face: 'long', eyes: 'slits', extra: ['wings', 'scales', 'mane'], tier: 3, trait: 'enrage', weak2: 'sleep', taunt2: 'The light… you turned it OFF.' },
];
/** The first era's roster. */
const V1 = BOSSES.slice(0, 8);

export const tierOf = (b: BossDef, monday: string): Tier => (monday >= BOSS_ERA2 ? b.tier : 1);

/** One round of a roster: every boss once, in a seeded order. */
function cycleOrder(n: number, key: string): number[] {
  let seed = hash(key);
  const rand = () => {
    seed = (Math.imul(seed ^ (seed >>> 15), 2246822507) + 0x9e3779b9) >>> 0;
    return seed / 4294967296;
  };
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

function v1For(monday: string): BossDef {
  const week = Math.round((dayCount(BOSS_FROM, monday) - 1) / 7);
  const len = V1.length;
  const cycle = Math.floor(week / len);
  const order = cycleOrder(len, `boss:${cycle}`);
  const prevLast = cycleOrder(len, `boss:${cycle - 1}`)[len - 1];
  if (order[0] === prevLast) [order[0], order[1]] = [order[1], order[0]];
  return V1[order[week - cycle * len]];
}

function v2Order(cycle: number): number[] {
  const len = BOSSES.length;
  const order = cycleOrder(len, `boss2:${cycle}`);
  const prev = cycle === 0 ? BOSSES.indexOf(v1For(addDays(BOSS_ERA2, -7))) : v2Order(cycle - 1)[len - 1];
  if (order[0] === prev) [order[0], order[1]] = [order[1], order[0]];
  return order;
}

/**
 * The week's boss. The roster comes round in rounds (eight weeks in the first era, 24 after), each
 * boss once per round in a seeded order, and never the same boss two weeks running.
 */
export function bossFor(monday: string): BossDef {
  if (monday < BOSS_ERA2) return v1For(monday);
  const week = Math.round((dayCount(BOSS_ERA2, monday) - 1) / 7);
  const len = BOSSES.length;
  const cycle = Math.floor(week / len);
  return BOSSES[v2Order(cycle)[week - cycle * len]];
}

export interface Hit {
  date: string;
  /** A section, 'tasks' / 'general', a Hangar item, a combo, or the boss itself (heals, rage). */
  source: SectionId | 'tasks' | 'general' | 'item' | 'combo' | 'boss';
  label: string;
  /** Damage dealt; negative when the boss heals. */
  dmg: number;
  weak: boolean;
  /** A flat bonus (first this week, combos, items): no weakness or resistance applies. */
  flat?: boolean;
  /** Halved by the boss's resistance. */
  resisted?: boolean;
}

/** Every timed section, so a new one can't be left out, plus topics no section uses. */
const TIMED: XpSection[] = [...TIMED_SECTIONS, 'general'];

/** What one day's records deal, as separate hits. `seen` holds sections already met this week. */
export function dayHits(date: string, f: Facts, weak: SectionId | null, seen: Set<SectionId>): Hit[] {
  const hits: Hit[] = [];
  const mult = (s: SectionId | 'tasks' | 'general') => (s === weak ? DMG.weakMultiplier : 1);
  for (const s of TIMED) {
    const min = f.min[s] ?? 0;
    if (!min) continue;
    const src = s as SectionId | 'general';
    hits.push({ date, source: src, label: `${min} min`, dmg: min * DMG.minute * mult(src), weak: src === weak });
  }
  if (f.tasks) hits.push({ date, source: 'tasks', label: `${f.tasks} task${f.tasks === 1 ? '' : 's'} done`, dmg: f.tasks * DMG.task, weak: false });
  if (f.nights) {
    const dmg = (f.nights * DMG.night + f.bedKept * DMG.bedtime) * mult('sleep');
    hits.push({ date, source: 'sleep', label: f.bedKept ? 'night logged, bed on time' : 'night logged', dmg, weak: weak === 'sleep' });
  }
  if (f.screens) {
    const dmg = (f.screens * DMG.screen + f.screenUnder * DMG.screenUnder) * mult('screen');
    hits.push({ date, source: 'screen', label: f.screenUnder ? 'logged, under target' : 'logged', dmg, weak: weak === 'screen' });
  }
  for (const s of SECTION_IDS) {
    if (!f.sections.has(s) || seen.has(s)) continue;
    seen.add(s);
    hits.push({ date, source: s, label: 'first this week', dmg: DMG.newSection, weak: false, flat: true });
  }
  return hits;
}

/** Everything a week dealt, with no weakness (what the next bosses' HP is based on). */
function plainDamage(monday: string, days: Map<string, Facts>, today: string): number {
  const seen = new Set<SectionId>();
  let n = 0;
  for (let i = 0; i < 7; i++) {
    const d = addDays(monday, i);
    if (d > today) break;
    const f = days.get(d);
    if (f) for (const h of dayHits(d, f, null, seen)) n += h.dmg;
  }
  return n;
}

const round10 = (n: number) => Math.round(n / 10) * 10;

/**
 * HP for the week, from the average of the four weeks before it, within limits. First era: +10%.
 * Era two: +25%, then times the boss's rank (Warlord ×1.2, Overlord ×1.45).
 */
export function bossHp(monday: string, days: Map<string, Facts>, today: string): number {
  let sum = 0;
  for (let k = 1; k <= 4; k++) sum += plainDamage(addDays(monday, -7 * k), days, today);
  if (monday < BOSS_ERA2) return Math.min(HP_MAX, Math.max(HP_MIN, round10((sum / 4) * HP_GROWTH)));
  const t = TIERS[bossFor(monday).tier].hp;
  return Math.min(HP2.max, Math.max(round10(HP2.min * t), round10((sum / 4) * HP2.growth * t)));
}

export interface BossFight {
  start: string;
  end: string;
  boss: BossDef;
  /** HP now (an enraged boss's grows on Saturday). */
  hp: number;
  damage: number;
  /** Newest first. */
  hits: Hit[];
  /** The day the damage first reached the HP, or null. */
  defeatedOn: string | null;
  key: string;
  /** XP for defeating it. */
  xp: number;
  tier: Tier;
  /** Era-two rules apply. */
  era2: boolean;
  /** The day its mask cracked at half HP (its weakness switches the day after), or null. */
  crackedOn: string | null;
  /** The weakness today. */
  weakNow: SectionId;
  enragedOn: string | null;
  /** HP it has healed back this week. */
  healed: number;
}

function v1Fight(input: ProgressInput, monday: string, days: Map<string, Facts>): BossFight {
  const boss = bossFor(monday);
  const hp = bossHp(monday, days, input.today);
  const seen = new Set<SectionId>();
  const hits: Hit[] = [];
  let damage = 0;
  let defeatedOn: string | null = null;
  for (let i = 0; i < 7; i++) {
    const d = addDays(monday, i);
    if (d > input.today) break;
    const f = days.get(d);
    const found = f ? dayHits(d, f, boss.weak, seen) : [];
    // Raid Bombs from the Hangar. Only this week's fight: bossHp reads plainDamage, so next week's HP doesn't grow.
    for (const u of input.usedItems ?? []) if (u.item === 'bomb' && u.date === d) found.push({ date: d, source: 'item', label: 'Raid Bomb', dmg: BOMB_DMG, weak: false, flat: true });
    for (const h of found) {
      hits.push(h);
      damage += h.dmg;
    }
    if (!defeatedOn && damage >= hp) defeatedOn = d;
  }
  return { start: monday, end: addDays(monday, 6), boss, hp, damage, hits: hits.reverse(), defeatedOn, key: `boss:${monday}`, xp: BOSS_XP, tier: 1, era2: false, crackedOn: null, weakNow: boss.weak, enragedOn: null, healed: 0 };
}

/** Sections that count towards a combo: everything with its own colour, not tasks or extras. */
const comboSource = (h: Hit) => !h.flat && h.dmg > 0 && h.source !== 'tasks' && h.source !== 'general' && h.source !== 'item' && h.source !== 'combo' && h.source !== 'boss';

export function bossFight(input: ProgressInput, monday: string, days = dayFacts(input)): BossFight {
  if (monday < BOSS_ERA2) return v1Fight(input, monday, days);
  const boss = bossFor(monday);
  let hp = bossHp(monday, days, input.today);
  const seen = new Set<SectionId>();
  const hits: Hit[] = [];
  let damage = 0;
  let healed = 0;
  let defeatedOn: string | null = null;
  let crackedOn: string | null = null;
  let enragedOn: string | null = null;
  let weakNow = boss.weak;
  for (let i = 0; i < 7; i++) {
    const d = addDays(monday, i);
    if (d > input.today) break;
    // Saturday: an enraging boss with more than half its HP left grows.
    if (i === 5 && boss.trait === 'enrage' && !defeatedOn && damage < hp / 2) {
      const grow = round10(hp * ENRAGE);
      hp += grow;
      enragedOn = d;
      hits.push({ date: d, source: 'boss', label: `Enraged · HP +${grow}`, dmg: 0, weak: false, flat: true });
    }
    weakNow = crackedOn ? boss.weak2 : boss.weak;
    const f = days.get(d);
    const found = f ? dayHits(d, f, weakNow, seen) : [];
    if (boss.trait === 'resist' && boss.resist)
      for (const h of found)
        if (!h.flat && h.source === boss.resist) {
          h.dmg = Math.ceil(h.dmg / 2);
          h.resisted = true;
        }
    for (const u of input.usedItems ?? []) if (u.item === 'bomb' && u.date === d) found.push({ date: d, source: 'item', label: 'Raid Bomb', dmg: BOMB_DMG, weak: false, flat: true });
    const kinds = new Set(found.filter(comboSource).map((h) => h.source)).size;
    if (kinds >= 5) found.push({ date: d, source: 'combo', label: `Super combo · ${kinds} sections`, dmg: COMBO.five, weak: false, flat: true });
    else if (kinds >= 3) found.push({ date: d, source: 'combo', label: `Combo · ${kinds} sections`, dmg: COMBO.three, weak: false, flat: true });
    let dayDmg = 0;
    for (const h of found) {
      hits.push(h);
      damage += h.dmg;
      dayDmg += h.dmg;
    }
    if (!defeatedOn && damage >= hp) defeatedOn = d;
    // A whole day gone by with no hits: a regenerating boss heals (never above full).
    if (boss.trait === 'regen' && !defeatedOn && d < input.today && dayDmg === 0 && damage > 0) {
      const heal = Math.min(damage, round10(hp * REGEN));
      damage -= heal;
      healed += heal;
      hits.push({ date: d, source: 'boss', label: 'Regenerates', dmg: -heal, weak: false, flat: true });
    }
    if (!crackedOn && !defeatedOn && damage >= hp / 2) crackedOn = d;
  }
  if (crackedOn && crackedOn < input.today) weakNow = boss.weak2;
  return { start: monday, end: addDays(monday, 6), boss, hp, damage, hits: hits.reverse(), defeatedOn, key: `boss:${monday}`, xp: TIERS[boss.tier].xp, tier: boss.tier, era2: true, crackedOn, weakNow, enragedOn, healed };
}

const historyMemo = new WeakMap<ProgressInput, BossFight[]>();

/** Every week's fight from BOSS_FROM to this week, oldest first. Worked out once per input. */
export function bossHistory(input: ProgressInput, days?: Map<string, Facts>): BossFight[] {
  let out = historyMemo.get(input);
  if (!out) {
    const facts = days ?? dayFacts(input);
    out = [];
    for (let w = BOSS_FROM; w <= input.today; w = addDays(w, 7)) out.push(bossFight(input, w, facts));
    historyMemo.set(input, out);
  }
  return out;
}

export function bossEvents(input: ProgressInput, history = bossHistory(input)): XpEvent[] {
  return history
    .filter((f) => f.defeatedOn)
    .map((f) => ({ key: f.key, date: f.defeatedOn!, section: 'quests' as const, xp: f.xp, reason: `Boss defeated: ${f.boss.name}` }));
}

/** This week's fight. */
export const currentBoss = (input: ProgressInput, days = dayFacts(input)) => bossFight(input, weekStart(input.today), days);

/** What a boss's trait does, in words. */
export function traitLine(b: BossDef): string {
  if (b.trait === 'regen') return `Heals ${REGEN * 100}% of its HP after each whole day with no hits`;
  if (b.trait === 'enrage') return `On Saturday, if more than half its HP is left, it grows ${ENRAGE * 100}% stronger`;
  return `Takes half damage from ${b.resist ?? 'one section'}`;
}
