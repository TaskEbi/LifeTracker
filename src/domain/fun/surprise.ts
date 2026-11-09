/**
 * Surprise scenes: forty short comic episodes (5–8 s) that now and then play after something you
 * log. Which and when is decided here, from a dice roll and what has played lately on this device:
 *  - at most one in SURPRISE_CHANCE of the saves that earn XP;
 *  - never within SURPRISE_COOLDOWN of the last, and at most SURPRISE_DAILY a day;
 *  - never one of the last SURPRISE_FRESH again;
 *  - a section's own scene is four times as likely after a save in that section, and never plays
 *    after a save in another; a few belong to the night or the day.
 */
import type { SectionId } from '../../data/types';

export type SurpriseId =
  | 'concert' | 'accepted' | 'ekiden' | 'deadlift' | 'hanamaru' | 'checkmate' | 'dreamsheep' | 'unplug' | 'treasure' | 'shinkansen' | 'storybook' | 'qed'
  | 'ramen' | 'catpost' | 'wishstar' | 'sumo' | 'ninja' | 'iai' | 'kaiju' | 'hanabi' | 'fuji' | 'koi' | 'manekineko' | 'daruma'
  | 'kendama' | 'rocket' | 'thunder' | 'cranes' | 'taiko' | 'bento' | 'ekistamp' | 'gacha' | 'sakura' | 'onsen' | 'highscore' | 'paperplane'
  | 'dragon' | 'forge' | 'matcha' | 'mochi';

export interface SurpriseDef {
  id: SurpriseId;
  name: string;
  kanji: string;
  /** Only after a save in this section. */
  section?: SectionId;
  /** Only at night (19:00–05:00) or by day. */
  when?: 'night' | 'day';
}

export const SURPRISES: SurpriseDef[] = [
  { id: 'concert', name: 'Standing ovation', kanji: '奏', section: 'violin' },
  { id: 'accepted', name: 'Accepted', kanji: '解', section: 'coding' },
  { id: 'ekiden', name: 'Ekiden relay', kanji: '駆', section: 'sports' },
  { id: 'deadlift', name: 'Heavy lift', kanji: '剛', section: 'gym' },
  { id: 'hanamaru', name: 'Hanamaru', kanji: '秀', section: 'study' },
  { id: 'checkmate', name: 'Checkmate', kanji: '詰', section: 'chess' },
  { id: 'dreamsheep', name: 'Counting sheep', kanji: '夢', section: 'sleep' },
  { id: 'unplug', name: 'Unplugged', kanji: '離', section: 'screen' },
  { id: 'treasure', name: 'Treasure found', kanji: '宝', section: 'cabinet' },
  { id: 'shinkansen', name: 'Departure', kanji: '翔', section: 'future' },
  { id: 'storybook', name: 'Into the story', kanji: '読', section: 'reading' },
  { id: 'qed', name: 'Q.E.D.', kanji: '証', section: 'maths' },
  { id: 'ramen', name: 'Ramen break', kanji: '麺' },
  { id: 'catpost', name: 'Special delivery', kanji: '猫' },
  { id: 'wishstar', name: 'Shooting star', kanji: '願', when: 'night' },
  { id: 'sumo', name: 'Sumo slam', kanji: '押' },
  { id: 'ninja', name: 'Rooftop ninja', kanji: '忍' },
  { id: 'iai', name: 'One cut', kanji: '斬' },
  { id: 'kaiju', name: 'Kaiju attack', kanji: '撃' },
  { id: 'hanabi', name: 'Fireworks', kanji: '祭', when: 'night' },
  { id: 'fuji', name: 'Summit', kanji: '頂', when: 'day' },
  { id: 'koi', name: 'Up the waterfall', kanji: '昇' },
  { id: 'manekineko', name: 'Lucky cat', kanji: '福' },
  { id: 'daruma', name: 'Daruma', kanji: '達' },
  { id: 'kendama', name: 'Kendama', kanji: '技' },
  { id: 'rocket', name: 'Lift-off', kanji: '発' },
  { id: 'thunder', name: 'Power surge', kanji: '覚' },
  { id: 'cranes', name: 'A thousand cranes', kanji: '鶴' },
  { id: 'taiko', name: 'Taiko', kanji: '響' },
  { id: 'bento', name: 'Bento', kanji: '弁', when: 'day' },
  { id: 'ekistamp', name: 'Station stamp', kanji: '印' },
  { id: 'gacha', name: 'Jackpot', kanji: '当' },
  { id: 'sakura', name: 'Sakura storm', kanji: '桜' },
  { id: 'onsen', name: 'Hot spring', kanji: '癒' },
  { id: 'highscore', name: 'New high score', kanji: '新' },
  { id: 'paperplane', name: 'Paper plane', kanji: '飛', when: 'day' },
  { id: 'dragon', name: 'Dragon ride', kanji: '龍' },
  { id: 'forge', name: 'The forge', kanji: '鍛' },
  { id: 'matcha', name: 'Tea ceremony', kanji: '和' },
  { id: 'mochi', name: 'Moon rabbits', kanji: '月', when: 'night' },
];

export const surpriseById = (id: string) => SURPRISES.find((s) => s.id === id);

export const SURPRISE_CHANCE = 0.3;
export const SURPRISE_COOLDOWN = 40 * 60_000;
export const SURPRISE_DAILY = 4;
export const SURPRISE_FRESH = 15;

export interface SurpriseLog {
  /** Played, oldest first: id, when (ms) and the Daily Log day. */
  shown: { id: SurpriseId; at: number; day: string }[];
}

/** Whether this save gets a scene. `roll` is a number in [0, 1). */
export function shouldSurprise(log: SurpriseLog, now: number, day: string, roll: number): boolean {
  const last = log.shown[log.shown.length - 1];
  if (last && now - last.at < SURPRISE_COOLDOWN) return false;
  if (log.shown.filter((s) => s.day === day).length >= SURPRISE_DAILY) return false;
  return roll < SURPRISE_CHANCE;
}

export const isNightHour = (hour: number) => hour >= 19 || hour < 5;

/** The scenes that could play after a save in `section` at `hour`, with their weights. */
export function surpriseOptions(log: SurpriseLog, section: SectionId | null, hour: number): { def: SurpriseDef; weight: number }[] {
  const recent = new Set(log.shown.slice(-SURPRISE_FRESH).map((s) => s.id));
  const night = isNightHour(hour);
  const fits = (d: SurpriseDef) => (!d.section || d.section === section) && (d.when !== 'night' || night) && (d.when !== 'day' || !night);
  let pool = SURPRISES.filter((d) => fits(d) && !recent.has(d.id));
  // Everything fitting has played lately: forget the history rather than play nothing.
  if (!pool.length) pool = SURPRISES.filter(fits);
  return pool.map((def) => ({ def, weight: def.section ? 4 : 1 }));
}

export function pickSurprise(log: SurpriseLog, section: SectionId | null, hour: number, roll: number): SurpriseId {
  const opts = surpriseOptions(log, section, hour);
  const total = opts.reduce((n, o) => n + o.weight, 0);
  let v = roll * total;
  for (const o of opts) {
    v -= o.weight;
    if (v < 0) return o.def.id;
  }
  return opts[opts.length - 1].def.id;
}

/** The section a save was mostly about (the most XP outside quests and general), if any. */
export function mainSection(lines: { section: string; xp: number }[]): SectionId | null {
  const by = new Map<string, number>();
  for (const l of lines) if (l.section !== 'quests' && l.section !== 'general') by.set(l.section, (by.get(l.section) ?? 0) + l.xp);
  let best: string | null = null;
  for (const [s, n] of by) if (best === null || n > (by.get(best) ?? 0)) best = s;
  return best as SectionId | null;
}
