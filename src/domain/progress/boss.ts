/**
 * The weekly boss, derived like quests. Each week (Monday to Sunday) a boss is drawn by date from a
 * fixed roster, so every device shows the same one and nothing is stored. Everything logged that
 * week hits it; its weak section hits twice as hard. Its HP comes from your own last four weeks, so
 * the bosses grow as you do. Defeating it is an XP event keyed by the week, so it pays once.
 */
import { addDays, dayCount, weekStart } from '../log/dates';
import { SECTION_IDS, type SectionId } from '../../data/types';
import type { ProgressInput, XpEvent, XpSection } from './engine';
import { dayFacts, hash, type Facts } from './quests';

/** Bosses start this week: earlier weeks have none, so old history can't defeat any. */
export const BOSS_FROM = '2026-10-26';
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

export const HP_MIN = 300;
export const HP_MAX = 1500;
/** HP is this much more than your recent weekly average. */
const HP_GROWTH = 1.1;

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
  mouth: 'fangs' | 'grin' | 'beak' | 'flat';
}

export const BOSSES: BossDef[] = [
  { id: 'namake', name: 'Namake-oni', title: 'Oni of the Sofa', kanji: '怠', weak: 'gym', taunt: 'Just one more episode…', c: '#b91c1c', c2: '#fca5a5', horns: 2, mouth: 'fangs' },
  { id: 'yofukashi', name: 'Yofukashi-garasu', title: 'Crow of the Late Night', kanji: '夜', weak: 'sleep', taunt: 'Midnight is still early.', c: '#312e81', c2: '#a5b4fc', horns: 0, mouth: 'beak' },
  { id: 'sumaho', name: 'Sumaho-kitsune', title: 'Fox of the Endless Feed', kanji: '画', weak: 'screen', taunt: 'Scroll. Scroll. Scroll.', c: '#ea580c', c2: '#fed7aa', horns: 0, mouth: 'grin' },
  { id: 'wasure', name: 'Wasure-gumo', title: 'Spider of Forgetting', kanji: '忘', weak: 'study', taunt: 'You learned that? I ate it.', c: '#4c1d95', c2: '#c4b5fd', horns: 3, mouth: 'fangs' },
  { id: 'mushi', name: 'Mushi-ryū', title: 'Dragon of Bugs', kanji: '虫', weak: 'coding', taunt: 'Wrong Answer on test 37.', c: '#15803d', c2: '#86efac', horns: 2, mouth: 'grin' },
  { id: 'fukyo', name: 'Fukyō-tengu', title: 'Tengu of Discord', kanji: '濁', weak: 'violin', taunt: 'Your E string is flat.', c: '#9f1239', c2: '#fda4af', horns: 1, mouth: 'flat' },
  { id: 'kage', name: 'Kage-shōgun', title: 'General of Blunders', kanji: '影', weak: 'chess', taunt: 'Hang the queen. I dare you.', c: '#1e293b', c2: '#cbd5e1', horns: 2, mouth: 'flat' },
  { id: 'noroma', name: 'Noroma-kappa', title: 'Kappa of the Slow Lane', kanji: '鈍', weak: 'sports', taunt: 'Why run? Float.', c: '#0e7490', c2: '#a5f3fc', horns: 0, mouth: 'grin' },
];

/** One round of the roster: every boss once, in a seeded order. */
function cycleOrder(cycle: number): number[] {
  let seed = hash(`boss:${cycle}`);
  const rand = () => {
    seed = (Math.imul(seed ^ (seed >>> 15), 2246822507) + 0x9e3779b9) >>> 0;
    return seed / 4294967296;
  };
  const order = BOSSES.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

/**
 * The week's boss. The roster comes round in rounds of eight weeks, each boss once per round in a
 * seeded order, and never the same boss two weeks running.
 */
export function bossFor(monday: string): BossDef {
  const week = Math.round((dayCount(BOSS_FROM, monday) - 1) / 7);
  const len = BOSSES.length;
  const cycle = Math.floor(week / len);
  const order = cycleOrder(cycle);
  const prevLast = cycleOrder(cycle - 1)[len - 1];
  if (order[0] === prevLast) [order[0], order[1]] = [order[1], order[0]];
  return BOSSES[order[week - cycle * len]];
}

export interface Hit {
  date: string;
  /** A section, or 'tasks' / 'general'. */
  source: SectionId | 'tasks' | 'general';
  label: string;
  dmg: number;
  weak: boolean;
}

const TIMED: XpSection[] = ['violin', 'coding', 'sports', 'gym', 'study', 'chess', 'general'];

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
    hits.push({ date, source: s, label: 'first this week', dmg: DMG.newSection, weak: false });
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

/** HP for the week: 10% over the average of the four weeks before it, rounded to 10, within limits. */
export function bossHp(monday: string, days: Map<string, Facts>, today: string): number {
  let sum = 0;
  for (let k = 1; k <= 4; k++) sum += plainDamage(addDays(monday, -7 * k), days, today);
  const hp = Math.round(((sum / 4) * HP_GROWTH) / 10) * 10;
  return Math.min(HP_MAX, Math.max(HP_MIN, hp));
}

export interface BossFight {
  start: string;
  end: string;
  boss: BossDef;
  hp: number;
  damage: number;
  /** Newest first. */
  hits: Hit[];
  /** The day the damage first reached the HP, or null. */
  defeatedOn: string | null;
  key: string;
}

export function bossFight(input: ProgressInput, monday: string, days = dayFacts(input)): BossFight {
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
    if (!f) continue;
    for (const h of dayHits(d, f, boss.weak, seen)) {
      hits.push(h);
      damage += h.dmg;
    }
    if (!defeatedOn && damage >= hp) defeatedOn = d;
  }
  return { start: monday, end: addDays(monday, 6), boss, hp, damage, hits: hits.reverse(), defeatedOn, key: `boss:${monday}` };
}

/** Every week's fight from BOSS_FROM to this week, oldest first. */
export function bossHistory(input: ProgressInput, days = dayFacts(input)): BossFight[] {
  const out: BossFight[] = [];
  for (let w = BOSS_FROM; w <= input.today; w = addDays(w, 7)) out.push(bossFight(input, w, days));
  return out;
}

export function bossEvents(input: ProgressInput, history = bossHistory(input)): XpEvent[] {
  return history
    .filter((f) => f.defeatedOn)
    .map((f) => ({ key: f.key, date: f.defeatedOn!, section: 'quests' as const, xp: BOSS_XP, reason: `Boss defeated: ${f.boss.name}` }));
}

/** This week's fight. */
export const currentBoss = (input: ProgressInput, days = dayFacts(input)) => bossFight(input, weekStart(input.today), days);
