/**
 * Every body has a level and a mastery of its own, apart from your overall level (which stays the
 * drone's). Both are derived, never stored, like XP:
 *
 * - Which body earned what comes from `pilot` rows (gm_tx): one each time you change body, with the
 *   moment it happened. XP from a record goes to the body you were piloting when the record was saved;
 *   XP that only has a day (quests, bosses, weekly goals) goes to the body you ended that day in.
 * - Body XP is the XP you earned while piloting it, doubled in the body's own sections, plus a lump
 *   for each Mk you've built. Levels come much faster than overall ones and stop at 30.
 * - Mastery points come from turning up and logging with it (more in its own sections), clearing quest
 *   boards and beating bosses. Nine tiers, Bronze I to Gold III, each with a prize you claim; Silver
 *   III teaches the body a battle cry and Gold III gives its own title.
 * - Hidden bodies (group 'secret') are never sold: each has a rule, and meeting it builds Mk I free.
 *
 * Prizes are `claim` rows (ids from `pairId('gm:claim', ref)`), so nothing pays twice.
 */
import type { SectionId } from '../../data/types';
import type { XpEvent } from '../progress/engine';
import { CHASSIS, chassisById, MATS, type Bag, type Chassis } from './catalog';
import { EVENTS } from './events';
import type { Tx } from './wallet';

/** Bodies start counting the day this arrived. */
export const MASTERY_FROM = '2026-11-14';
/** Before any pilot row, the body you're wearing counts from this moment. */
export const PILOT_SEED_T = `${MASTERY_FROM}T00:00:00.000Z`;

// ─── levels ─────────────────────────────────────────────────────────────────

export const BODY_MAX = 30;
/** XP from body level n to n + 1. The overall level needs 40 + 5n. */
export const bodyStep = (n: number) => 15 + 5 * n;
/** XP in a body's own sections counts this many times over. */
export const OWN_MULT = 2;
/** Building Mk II and Mk III gives the body this much XP straight away. */
export const MK_XP: Record<number, number> = { 2: 200, 3: 500 };

export function bodyLevel(xp: number): { level: number; into: number; need: number; max: boolean } {
  let level = 1;
  let left = Math.max(0, Math.floor(xp));
  while (level < BODY_MAX && left >= bodyStep(level)) {
    left -= bodyStep(level);
    level++;
  }
  const max = level >= BODY_MAX;
  return { level, into: max ? 0 : left, need: max ? 0 : bodyStep(level), max };
}

/** Total body XP to reach a level. */
export const bodyXpFor = (level: number) => Array.from({ length: Math.max(0, Math.min(BODY_MAX, level) - 1) }, (_, i) => bodyStep(i + 1)).reduce((a, b) => a + b, 0);

/** The sections a body is "from": its tribute section, its festival's boosted ones, or its materials. */
export function bodySections(ch: Chassis): SectionId[] {
  if (ch.section) return [ch.section];
  if (ch.event) return EVENTS.find((e) => e.id === ch.event)?.boost ?? [];
  return ch.mats ?? [];
}

// ─── mastery ────────────────────────────────────────────────────────────────

export const MP = { session: 10, own: 25, day: 20, daily: 30, weekly: 80, monthly: 150, boss: 100 } as const;

export type Metal = 'bronze' | 'silver' | 'gold';
export interface Tier {
  id: string;
  name: string;
  metal: Metal;
  at: number;
}

export const TIERS: Tier[] = [
  { id: 'b1', name: 'Bronze I', metal: 'bronze', at: 100 },
  { id: 'b2', name: 'Bronze II', metal: 'bronze', at: 250 },
  { id: 'b3', name: 'Bronze III', metal: 'bronze', at: 450 },
  { id: 's1', name: 'Silver I', metal: 'silver', at: 700 },
  { id: 's2', name: 'Silver II', metal: 'silver', at: 1000 },
  { id: 's3', name: 'Silver III', metal: 'silver', at: 1400 },
  { id: 'g1', name: 'Gold I', metal: 'gold', at: 1900 },
  { id: 'g2', name: 'Gold II', metal: 'gold', at: 2500 },
  { id: 'g3', name: 'Gold III', metal: 'gold', at: 3200 },
];
export const METAL: Record<Metal, { name: string; kanji: string; color: string }> = {
  bronze: { name: 'Bronze', kanji: '銅', color: '#d08a4f' },
  silver: { name: 'Silver', kanji: '銀', color: '#c9d3de' },
  gold: { name: 'Gold', kanji: '金', color: '#ffc23d' },
};

/** How many tiers a points total has reached (0 to 9). */
export const tierCount = (mp: number) => TIERS.filter((t) => mp >= t.at).length;

// ─── prizes ─────────────────────────────────────────────────────────────────

export interface Prize {
  /** The claim's ref: `body:<id>:lv5`, `body:<id>:s3`, `hall:first`. */
  ref: string;
  label: string;
  gain: Bag;
  /** Something only this body gives: its battle cry or its title. */
  special?: 'cry' | 'title';
}

const ownMat = (ch: Chassis): SectionId => bodySections(ch)[0] ?? 'cabinet';

export const LEVEL_PRIZES: { level: number; gain: (ch: Chassis) => Bag }[] = [
  { level: 5, gain: () => ({ coins: 150 }) },
  { level: 10, gain: () => ({ gems: 10, tickets: 1 }) },
  { level: 15, gain: () => ({ chests: ['iron'] }) },
  { level: 20, gain: (ch) => ({ gems: 20, mats: { [ownMat(ch)]: 15 } }) },
  { level: 25, gain: () => ({ tickets: 2 }) },
  { level: 30, gain: () => ({ gems: 40, chests: ['gold'] }) },
];

const TIER_GAIN: Record<string, (ch: Chassis) => Bag> = {
  b1: () => ({ coins: 200 }),
  b2: (ch) => ({ mats: { [ownMat(ch)]: 10 } }),
  b3: () => ({ coins: 300, tickets: 1 }),
  s1: () => ({ gems: 15 }),
  s2: () => ({ chests: ['iron'] }),
  s3: (ch) => ({ coins: 500, items: [`cry:${ch.id}`] }),
  g1: () => ({ chests: ['gold'] }),
  g2: () => ({ gems: 50 }),
  g3: (ch) => ({ tickets: 2, items: [`title:m_${ch.id}`] }),
};

export const levelPrize = (ch: Chassis, level: number): Prize => ({ ref: `body:${ch.id}:lv${level}`, label: `Level ${level}`, gain: LEVEL_PRIZES.find((p) => p.level === level)!.gain(ch) });
export const tierPrize = (ch: Chassis, t: Tier): Prize => ({ ref: `body:${ch.id}:${t.id}`, label: t.name, gain: TIER_GAIN[t.id](ch), special: t.id === 's3' ? 'cry' : t.id === 'g3' ? 'title' : undefined });

/** The mastery hall: prizes for mastering several bodies. */
export const HALL: { id: string; name: string; need: string; tier: string; count: number; gain: Bag }[] = [
  { id: 'tour', name: 'Well Travelled', need: 'Bronze I with 10 bodies', tier: 'b1', count: 10, gain: { chests: ['gold'], items: ['title:m_tour'] } },
  { id: 'first', name: 'Mastered One', need: 'Gold III with a body', tier: 'g3', count: 1, gain: { gems: 100, items: ['title:m_first'] } },
  { id: 'shape', name: 'Shapeshifter', need: 'Gold III with 5 bodies', tier: 'g3', count: 5, gain: { chests: ['mythic'], items: ['title:m_shape'] } },
  { id: 'faces', name: 'A Thousand Faces', need: 'Gold III with 10 bodies', tier: 'g3', count: 10, gain: { gems: 300, chests: ['mythic'], items: ['title:m_faces'] } },
];

// ─── who was piloting ───────────────────────────────────────────────────────

export interface Pilot {
  chassis: string;
  /** Milliseconds. */
  ms: number;
  /** Its day, on the Daily Log clock. */
  at: string;
}

/** The pilot rows in order; with none yet, the body you're wearing counts from the start. */
export function pilotsOf(txs: Tx[], current: string): Pilot[] {
  const out: Pilot[] = [];
  for (const t of txs) {
    if (t.type !== 'pilot') continue;
    const ms = Date.parse(t.t ?? '');
    out.push({ chassis: t.ref, ms: Number.isFinite(ms) ? ms : Date.parse(`${t.at}T12:00:00Z`), at: t.at });
  }
  if (!out.length) return [{ chassis: current, ms: Date.parse(PILOT_SEED_T), at: MASTERY_FROM }];
  return out.sort((a, b) => a.ms - b.ms);
}

/** Who was flying at a moment (if the record has one) or at the end of a day. */
export function pilotAt(pilots: Pilot[], ms: number | null, date: string): string | null {
  let who: string | null = null;
  for (const p of pilots) {
    if (ms != null ? p.ms <= ms : p.at <= date) who = p.chassis;
    else break;
  }
  return who;
}

// ─── the numbers for every body ─────────────────────────────────────────────

export interface MasteryInput {
  xp: XpEvent[];
  /** When the record behind an XP event was saved (ms), if it has a moment; null for day-only XP. */
  stampOf: (key: string) => number | null;
  txs: Tx[];
  /** The body worn now ('drone' for the drone). */
  current: string;
}

export interface BodyStat {
  id: string;
  xp: number;
  level: number;
  into: number;
  need: number;
  max: boolean;
  mp: number;
  /** Tiers reached, 0–9. */
  tiers: number;
  next: Tier | null;
  /** XP earned with it in its own sections (before doubling). */
  ownXp: number;
  sessions: number;
  days: number;
}

const SESSION = /^(entry:[^:]+|night:[^:]+|screen:[^:]+):logged$/;
const SWEEP = /^quest:(daily|weekly|monthly):[^:]+:sweep$/;

export function bodyStats(input: MasteryInput): Map<string, BodyStat> {
  const pilots = pilotsOf(input.txs, input.current);
  const acc = new Map<string, { xp: number; ownXp: number; mp: number; sessions: number; days: Set<string> }>();
  const get = (id: string) => {
    let a = acc.get(id);
    if (!a) acc.set(id, (a = { xp: 0, ownXp: 0, mp: 0, sessions: 0, days: new Set() }));
    return a;
  };
  const own = new Map<string, Set<string>>();
  for (const ch of CHASSIS) own.set(ch.id, new Set(bodySections(ch)));

  for (const e of input.xp) {
    if (e.date < MASTERY_FROM && input.stampOf(e.key) == null) continue;
    const who = pilotAt(pilots, input.stampOf(e.key), e.date);
    if (!who || who === 'drone' || !own.has(who)) continue;
    const a = get(who);
    const mine = own.get(who)!.has(e.section);
    a.xp += e.xp * (mine ? OWN_MULT : 1);
    if (mine) a.ownXp += e.xp;
    if (e.section !== 'quests' && e.section !== 'general') a.days.add(e.date);
    if (SESSION.test(e.key)) {
      a.sessions++;
      a.mp += mine ? MP.own : MP.session;
    }
    const sw = SWEEP.exec(e.key);
    if (sw) a.mp += MP[sw[1] as 'daily' | 'weekly' | 'monthly'];
    if (e.key.startsWith('boss:')) a.mp += MP.boss;
  }
  for (const t of input.txs) {
    if (t.type !== 'mk') continue;
    const [, id, mk] = t.ref.split(':');
    if (MK_XP[Number(mk)] && own.has(id)) get(id).xp += MK_XP[Number(mk)];
  }

  const out = new Map<string, BodyStat>();
  for (const ch of CHASSIS) {
    const a = acc.get(ch.id);
    const mp = (a?.mp ?? 0) + (a?.days.size ?? 0) * MP.day;
    const lv = bodyLevel(a?.xp ?? 0);
    const tiers = tierCount(mp);
    out.set(ch.id, { id: ch.id, xp: a?.xp ?? 0, ...lv, mp, tiers, next: TIERS[tiers] ?? null, ownXp: a?.ownXp ?? 0, sessions: a?.sessions ?? 0, days: a?.days.size ?? 0 });
  }
  return out;
}

/** Every prize a body has reached, claimed or not, in track order. */
export function bodyPrizes(ch: Chassis, s: BodyStat): { prize: Prize; reached: boolean; kind: 'level' | 'tier' }[] {
  return [
    ...LEVEL_PRIZES.map((p) => ({ prize: levelPrize(ch, p.level), reached: s.level >= p.level, kind: 'level' as const })),
    ...TIERS.map((t) => ({ prize: tierPrize(ch, t), reached: s.mp >= t.at, kind: 'tier' as const })),
  ];
}

/** Prizes reached and not yet claimed, for one body or all of them. */
export function unclaimed(stats: Map<string, BodyStat>, claimed: Set<string>, only?: string): Prize[] {
  const out: Prize[] = [];
  for (const ch of CHASSIS) {
    if (only && ch.id !== only) continue;
    const s = stats.get(ch.id);
    if (!s) continue;
    for (const p of bodyPrizes(ch, s)) if (p.reached && !claimed.has(p.prize.ref)) out.push(p.prize);
  }
  if (!only) for (const h of hallState(stats)) if (h.reached && !claimed.has(`hall:${h.id}`)) out.push({ ref: `hall:${h.id}`, label: h.name, gain: h.gain, special: 'title' });
  return out;
}

export function hallState(stats: Map<string, BodyStat>) {
  return HALL.map((h) => {
    const at = TIERS.find((t) => t.id === h.tier)!.at;
    const have = [...stats.values()].filter((s) => s.mp >= at).length;
    return { ...h, have, reached: have >= h.count };
  });
}

/** Claim refs already written. */
export const claimedRefs = (txs: Tx[]) => new Set(txs.filter((t) => t.type === 'claim' && (t.ref.startsWith('body:') || t.ref.startsWith('hall:'))).map((t) => t.ref));

/** The ledger's words for a mastery claim. */
export function masteryLine(ref: string): string {
  const [kind, id, step] = ref.split(':');
  if (kind === 'hall') return `Mastery hall: ${HALL.find((h) => h.id === id)?.name ?? id}`;
  if (kind === 'secret') return `Woke up ${chassisById(id)?.name ?? id}`;
  const name = chassisById(id)?.name ?? id;
  if (step?.startsWith('lv')) return `${name} reached level ${step.slice(2)}`;
  return `${name}: ${TIERS.find((t) => t.id === step)?.name ?? step} mastery`;
}

// ─── hidden bodies ──────────────────────────────────────────────────────────

/** What the hidden bodies' rules read. Worked out by the store from the records. */
export interface SecretFacts {
  bodiesOwned: number;
  bestStreak: number;
  photos: number;
  bigWish: boolean;
  bosses: number;
  rebuilds: number;
  fish: number;
  /** Most sections with XP on one day. */
  bestDay: number;
  /** Mastery points with the Tanuki Tinker. */
  tanukiMp: number;
  /** Bodies at Gold III. */
  golds: number;
  /** A night's sleep logged for today. */
  sleptToday: boolean;
  /** The hour on the Daily Log clock. */
  hour: number;
}

export interface Secret {
  id: string;
  rule: string;
  /** Where you are, and where it opens. */
  progress: (f: SecretFacts) => [number, number];
}

export const EARLY = { from: 5, to: 8 } as const;

export const SECRETS: Secret[] = [
  { id: 'kitsune', rule: 'Reach Silver I mastery with the Tanuki Tinker', progress: (f) => [Math.min(f.tanukiMp, 700), 700] },
  { id: 'niwatori', rule: `Log last night's sleep, then come between 0${EARLY.from}:00 and 0${EARLY.to}:00`, progress: (f) => [f.sleptToday && f.hour >= EARLY.from && f.hour < EARLY.to ? 1 : 0, 1] },
  { id: 'shashin', rule: 'Take 30 photos for the Album', progress: (f) => [Math.min(f.photos, 30), 30] },
  { id: 'medetai', rule: 'Catch 30 fish at the Arcade pond', progress: (f) => [Math.min(f.fish, 30), 30] },
  { id: 'chagama', rule: 'Rebuild the Works once', progress: (f) => [Math.min(f.rebuilds, 1), 1] },
  { id: 'namazu', rule: 'Beat 8 weekly bosses', progress: (f) => [Math.min(f.bosses, 8), 8] },
  { id: 'nagareboshi', rule: 'Make an Epic or Legendary bucket-list wish come true', progress: (f) => [f.bigWish ? 1 : 0, 1] },
  { id: 'nue', rule: 'Own 12 bodies', progress: (f) => [Math.min(f.bodiesOwned, 12), 12] },
  { id: 'hoo', rule: 'Keep a 30-day streak', progress: (f) => [Math.min(f.bestStreak, 30), 30] },
  { id: 'ashura', rule: 'Log six different sections in one day', progress: (f) => [Math.min(f.bestDay, 6), 6] },
  { id: 'kirin', rule: 'Reach Gold III mastery with 3 bodies', progress: (f) => [Math.min(f.golds, 3), 3] },
];
export const secretById = (id: string) => SECRETS.find((s) => s.id === id);

export const secretOpen = (id: string, f: SecretFacts) => {
  const s = secretById(id);
  if (!s) return false;
  const [have, need] = s.progress(f);
  return have >= need;
};

/** The longest run of days in a set (rest days count, as for the streak). */
export function longestRun(days: Iterable<string>): number {
  const sorted = [...new Set(days)].sort();
  let best = 0;
  let run = 0;
  let prev = 0;
  for (const d of sorted) {
    const t = Date.parse(`${d}T12:00:00Z`) / 86_400_000;
    run = run && Math.round(t - prev) === 1 ? run + 1 : 1;
    prev = t;
    best = Math.max(best, run);
  }
  return best;
}

/** The most sections with XP on one day (quests, general and bought XP don't count). */
export function bestDaySections(xp: XpEvent[]): number {
  const by = new Map<string, Set<string>>();
  for (const e of xp) {
    if (e.section === 'quests' || e.section === 'general' || e.key.startsWith('item:') || !(e.section in MATS)) continue;
    let s = by.get(e.date);
    if (!s) by.set(e.date, (s = new Set()));
    s.add(e.section);
  }
  let best = 0;
  for (const s of by.values()) best = Math.max(best, s.size);
  return best;
}
