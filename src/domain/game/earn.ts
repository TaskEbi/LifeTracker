/**
 * Everything you've earned, derived from the records like XP: one grant per keyed thing, so nothing
 * pays twice and editing a record changes what it paid. Records from before GAME_FROM don't pay Ryō
 * or materials (old Daily Log history shouldn't flood the game); what you've unlocked does pay,
 * whenever it happened, so the Hangar opens with something to spend.
 */
import type { SectionId } from '../../data/types';
import { addDays, weekStart, weekdayIndex } from '../log/dates';
import { drawFortune } from '../fun/omikuji';
import { overallLevel, sectionLevel, STAGES, stageFor, type XpEvent } from '../progress/engine';
import type { BossFight } from '../progress/boss';
import type { QuestSet } from '../progress/quests';
import { MATS, type Bag, type ChestTier, type Mats } from './catalog';
import { eventOn, eventRunsUpTo, tokenRate } from './events';
import { hash32 } from './loot';
import { upgradeLevel, type Grant, type Tx } from './wallet';

/** LifeTracker's own first month: Ryō and materials count from here. */
export const GAME_FROM = '2026-10-01';

export const EMBLEM_GEMS = { bronze: 2, silver: 5, gold: 15, platinum: 40 } as const;
export const WISH_PRIZE: Record<string, { gems: number; chest: ChestTier | null }> = {
  common: { gems: 10, chest: null },
  rare: { gems: 20, chest: 'wood' },
  epic: { gems: 40, chest: 'iron' },
  legendary: { gems: 100, chest: 'gold' },
};
const SWEEP_PRIZE: Record<string, { gems: number; chest: ChestTier }> = {
  daily: { gems: 3, chest: 'wood' },
  weekly: { gems: 15, chest: 'iron' },
  monthly: { gems: 50, chest: 'gold' },
};

/** A row from the Hideout or Reading, in the shape it needs here. */
export interface EarnRow {
  id: string;
  kind: string;
  /** Local day it was made. */
  day: string;
  data: Record<string, unknown>;
}

export interface EarnInput {
  today: string;
  xp: XpEvent[];
  achievements: { id: string; title: string; tier: keyof typeof EMBLEM_GEMS; unlockedOn: string | null }[];
  quests: QuestSet[];
  bosses: BossFight[];
  /** Days with anything logged (rest days not included). */
  activeDays: string[];
  /** Days counting towards the streak (rest days included). */
  streakDays: Set<string>;
  bucket: { id: string; title: string; doneOn: string | null; rarity: string }[];
  rows: EarnRow[];
  txs: Tx[];
}

export interface DayBonus {
  /** Added together; 0.25 is a quarter on top. */
  pct: number;
  doubled: boolean;
  lines: string[];
}

const FORTUNE_BONUS: Record<string, number> = { daikichi: 0.5, chukichi: 0.15 };

/** Why a day's Ryō is worth more. Shown on the Hangar, and used by the grants. */
export function dayBonus(date: string, txs: Tx[]): DayBonus {
  const lines: string[] = [];
  let pct = 0;
  const magnet = upgradeLevel(txs, 'magnet', date);
  if (magnet) {
    pct += magnet * 0.05;
    lines.push(`Coin Magnet +${magnet * 5}%`);
  }
  if (weekdayIndex(date) >= 5) {
    pct += 0.25;
    lines.push('Weekend rush +25%');
  }
  const f = drawFortune(date);
  const fb = FORTUNE_BONUS[f.rank.id];
  if (fb) {
    pct += fb;
    lines.push(`Today's fortune ${f.rank.kanji} +${Math.round(fb * 100)}%`);
  }
  const doubled = txs.some((t) => t.type === 'use' && t.ref === 'incense' && t.at === date);
  if (doubled) lines.push('Lucky Incense ×2');
  return { pct, doubled, lines };
}

// ─── hideout rooms ──────────────────────────────────────────────────────────

/** What one Hideout row pays. The Lighthouse's reading flow pays nothing, on purpose. */
function rowPay(r: EarnRow): { date: string; coins: number; gems?: number; label: string; extra?: { date: string; coins: number; gems?: number; label: string; tag: string } } | null {
  const d = r.data;
  const str = (k: string) => (typeof d[k] === 'string' ? (d[k] as string) : null);
  switch (r.kind) {
    case 'hq_checkin':
      return { date: str('date') ?? r.day, coins: 10, label: 'Inner weather' };
    case 'hq_ritual_day': {
      const n = Array.isArray(d.done) ? d.done.length : 0;
      return n ? { date: str('date') ?? r.day, coins: Math.min(n * 8, 40), label: `${n} ritual${n === 1 ? '' : 's'}` } : null;
    }
    case 'hq_recall_day': {
      const n = Number(d.reviewed) || 0;
      return n ? { date: str('date') ?? r.day, coins: Math.min(10 + Math.floor(n / 2), 70), label: `${n} cards recalled` } : null;
    }
    case 'hq_review':
      return { date: str('sealedOn') ?? r.day, coins: 150, gems: 10, label: 'Weekly review sealed' };
    case 'hq_diary':
      return { date: str('date') ?? r.day, coins: 15, label: 'Five-year diary' };
    case 'hq_close':
      return { date: str('date') ?? r.day, coins: 15, label: 'Closed the day' };
    case 'hq_mock':
      return { date: str('date') ?? r.day, coins: 60, label: 'Mock paper finished' };
    case 'hq_urge_day': {
      const n = Number(d.held) || 0;
      return n ? { date: str('date') ?? r.day, coins: Math.min(n * 10, 40), label: 'Held off scrolling' } : null;
    }
    case 'hq_prediction': {
      const made = { date: str('madeOn') ?? r.day, coins: 5, label: 'Prediction made' };
      return d.resolvedOn ? { ...made, extra: { date: String(d.resolvedOn), coins: 20, label: 'Prediction called', tag: 'called' } } : made;
    }
    case 'hq_capsule': {
      const sealed = { date: str('sealedOn') ?? r.day, coins: 20, label: 'Time capsule sealed' };
      return d.openedOn ? { ...sealed, extra: { date: String(d.openedOn), coins: 60, gems: 5, label: 'Time capsule opened', tag: 'opened' } } : sealed;
    }
    case 'hq_note':
      return { date: str('writtenOn') ?? r.day, coins: 20, label: 'A message to yourself' };
    case 'hq_oath':
      return { date: str('from') ?? r.day, coins: 20, label: 'Oath sworn' };
    case 'hq_scale':
      return { date: r.day, coins: 20, label: 'Decision weighed' };
    case 'hq_experiment':
      return { date: str('start') ?? r.day, coins: 30, label: 'Experiment started' };
    default:
      return null;
  }
}

// ─── weekly bounties ────────────────────────────────────────────────────────

export interface BountyDef {
  id: string;
  title: string;
  goal: number;
  unit: string;
  gain: Bag;
  /** How far along it is this week. */
  measure: (w: WeekFacts) => number;
}

export interface WeekFacts {
  xp: number;
  sections: Set<string>;
  tasks: number;
  nights: number;
  sessions: number;
  quests: number;
  boss: boolean;
  hideoutDays: number;
  days: number;
  review: boolean;
  recall: number;
}

const BOUNTIES: BountyDef[] = [
  { id: 'xp500', title: 'Earn 500 XP this week', goal: 500, unit: 'XP', gain: { gems: 20, coins: 200 }, measure: (w) => w.xp },
  { id: 'xp900', title: 'Earn 900 XP this week', goal: 900, unit: 'XP', gain: { gems: 40, chests: ['iron'] }, measure: (w) => w.xp },
  { id: 'wide4', title: 'Work in 4 different sections', goal: 4, unit: 'sections', gain: { gems: 15, tickets: 1 }, measure: (w) => w.sections.size },
  { id: 'wide7', title: 'Work in 7 different sections', goal: 7, unit: 'sections', gain: { gems: 35, chests: ['iron'] }, measure: (w) => w.sections.size },
  { id: 'tasks5', title: 'Finish 5 tasks', goal: 5, unit: 'tasks', gain: { gems: 12, coins: 200 }, measure: (w) => w.tasks },
  { id: 'nights5', title: 'Log 5 nights of sleep', goal: 5, unit: 'nights', gain: { gems: 12, mats: { sleep: 15 } }, measure: (w) => w.nights },
  { id: 'sessions6', title: 'Log 6 sessions', goal: 6, unit: 'sessions', gain: { gems: 15, coins: 300 }, measure: (w) => w.sessions },
  { id: 'quests6', title: 'Clear 6 quests', goal: 6, unit: 'quests', gain: { gems: 15, tickets: 1 }, measure: (w) => w.quests },
  { id: 'boss', title: "Defeat the week's boss", goal: 1, unit: 'boss', gain: { gems: 25, chests: ['iron'] }, measure: (w) => (w.boss ? 1 : 0) },
  { id: 'days5', title: 'Be active on 5 days', goal: 5, unit: 'days', gain: { gems: 15, coins: 300 }, measure: (w) => w.days },
  { id: 'hideout3', title: 'Use the Hideout on 3 days', goal: 3, unit: 'days', gain: { gems: 15, mats: { cabinet: 15 } }, measure: (w) => w.hideoutDays },
  { id: 'recall30', title: 'Recall 30 cards in the Dojo', goal: 30, unit: 'cards', gain: { gems: 15, mats: { study: 15 } }, measure: (w) => w.recall },
  { id: 'review', title: 'Seal your weekly review', goal: 1, unit: 'review', gain: { gems: 15, coins: 300 }, measure: (w) => (w.review ? 1 : 0) },
];

/** Three bounties a week, drawn by date: the same on every device. */
export function bountiesFor(monday: string): BountyDef[] {
  const left = [...BOUNTIES];
  const out: BountyDef[] = [];
  for (let i = 0; i < 3; i++) {
    const at = hash32(`bounty:${monday}:${i}`) % left.length;
    out.push(left.splice(at, 1)[0]);
  }
  return out;
}

function weekFacts(monday: string, input: EarnInput, xp: XpEvent[] = input.xp): WeekFacts {
  const end = addDays(monday, 6);
  const inWeek = (d: string) => d >= monday && d <= end;
  const w: WeekFacts = { xp: 0, sections: new Set(), tasks: 0, nights: 0, sessions: 0, quests: 0, boss: false, hideoutDays: 0, days: 0, review: false, recall: 0 };
  for (const e of xp) {
    if (!inWeek(e.date) || e.key.startsWith('item:')) continue;
    w.xp += e.xp;
    if (e.section !== 'general' && e.section !== 'quests') w.sections.add(e.section);
    if (e.key.startsWith('task:')) w.tasks++;
    if (e.key.startsWith('night:') && e.key.endsWith(':logged')) w.nights++;
    if (e.key.startsWith('entry:') && (e.key.endsWith(':logged') || e.key.endsWith(':gym'))) w.sessions++;
    if (e.key.startsWith('quest:') && !e.key.endsWith(':sweep')) w.quests++;
    if (e.key.startsWith('boss:')) w.boss = true;
  }
  const hq = new Set<string>();
  for (const r of input.rows) {
    if (!r.kind.startsWith('hq_')) continue;
    const pay = rowPay(r);
    if (pay && inWeek(pay.date)) hq.add(pay.date);
    if (pay && inWeek(pay.date) && r.kind === 'hq_review') w.review = true;
    if (r.kind === 'hq_recall_day' && pay && inWeek(pay.date)) w.recall += Number(r.data.reviewed) || 0;
  }
  w.hideoutDays = hq.size;
  w.days = input.activeDays.filter(inWeek).length;
  return w;
}

export interface BountyProgress {
  def: BountyDef;
  done: number;
  complete: boolean;
}

export function bountyBoard(monday: string, input: EarnInput, xp?: XpEvent[]): BountyProgress[] {
  const w = weekFacts(monday, input, xp);
  return bountiesFor(monday).map((def) => {
    const done = Math.min(def.goal, def.measure(w));
    return { def, done, complete: done >= def.goal };
  });
}

// ─── the grants ─────────────────────────────────────────────────────────────

export function grantsFor(input: EarnInput): Grant[] {
  const { today, txs } = input;
  const out: Grant[] = [];
  const has = new Set<string>();
  const push = (g: Grant) => {
    if (has.has(g.key) || g.date > today) return;
    has.add(g.key);
    out.push(g);
  };
  const up = (id: string, date: string) => upgradeLevel(txs, id, date);

  // Everything that pays per XP, a day at a time.
  const dayXp = new Map<string, { all: number; perSection: Map<SectionId, number> }>();
  for (const e of input.xp) {
    if (e.key.startsWith('item:') || e.date < GAME_FROM) continue;
    let d = dayXp.get(e.date);
    if (!d) dayXp.set(e.date, (d = { all: 0, perSection: new Map() }));
    d.all += e.xp;
    if (e.section !== 'general' && e.section !== 'quests') d.perSection.set(e.section, (d.perSection.get(e.section) ?? 0) + e.xp);
  }
  const runs = eventRunsUpTo(today);
  const activeSet = new Set(input.activeDays);
  for (const [date, d] of dayXp) {
    const bonus = dayBonus(date, txs);
    const coins = Math.round(d.all * (1 + bonus.pct) * (bonus.doubled ? 2 : 1));
    const run = eventOn(date);
    const scan = up('scanner', date);
    const mats: Mats = {};
    for (const [s, xp] of d.perSection) {
      const n = Math.ceil(xp / 10) + scan;
      mats[s] = run?.def.boost.includes(s) ? n * 2 : n;
    }
    push({ key: `day:${date}`, date, source: 'training', label: `${d.all} XP${bonus.pct || bonus.doubled ? ` · ${bonus.lines.join(', ')}` : ''}`, gain: { coins, mats } });
  }

  // Turning up.
  const active = [...new Set(input.activeDays)].filter((d) => d >= GAME_FROM && d <= today).sort();
  for (const date of active) {
    const coins = 10 + up('dynamo', date) * 15;
    const gems = date.endsWith('-01') ? 10 : 0;
    push({ key: `up:${date}`, date, source: 'daily', label: gems ? 'First of the month' : up('dynamo', date) ? 'Daily Dynamo' : 'Turned up', gain: gems ? { coins, gems } : { coins } });
  }

  // Streak milestones: a run may skip one day, as the streak itself may.
  const streak = [...input.streakDays].filter((d) => d >= GAME_FROM && d <= today).sort();
  let n = 0;
  let prev = '';
  for (const date of streak) {
    n = prev && (addDays(prev, 1) === date || addDays(prev, 2) === date) ? n + 1 : 1;
    prev = date;
    if (n % 100 === 0) push({ key: `streak:${date}`, date, source: 'streak', label: `${n}-day streak`, gain: { gems: 100, chests: ['mythic'] } });
    else if (n % 30 === 0) push({ key: `streak:${date}`, date, source: 'streak', label: `${n}-day streak`, gain: { gems: 30, chests: ['gold'] } });
    else if (n % 7 === 0) push({ key: `streak:${date}`, date, source: 'streak', label: `${n}-day streak`, gain: { gems: 5, chests: ['wood'] } });
  }

  // Quests.
  for (const set of input.quests) {
    if (!set.sweptOn) continue;
    const p = SWEEP_PRIZE[set.period];
    const dig = up('prospector', set.sweptOn);
    const extra = set.period === 'daily' ? dig : dig * 5;
    push({ key: `sweep:${set.period}:${set.start}`, date: set.sweptOn, source: 'quests', label: `All ${set.period} quests`, gain: { gems: p.gems + extra, chests: [p.chest] } });
  }

  // Bounties.
  const firstWeek = weekStart(GAME_FROM);
  const xpByWeek = new Map<string, XpEvent[]>();
  for (const e of input.xp) {
    if (e.date < firstWeek) continue;
    const k = weekStart(e.date);
    const list = xpByWeek.get(k);
    if (list) list.push(e);
    else xpByWeek.set(k, [e]);
  }
  for (let w = firstWeek; w <= today; w = addDays(w, 7)) {
    for (const b of bountyBoard(w, input, xpByWeek.get(w) ?? [])) {
      if (b.complete) push({ key: `bounty:${w}:${b.def.id}`, date: addDays(w, 6) > today ? today : addDays(w, 6), source: 'bounty', label: b.def.title, gain: b.def.gain });
    }
    const printer = up('printer', addDays(w, 6));
    if (printer && input.activeDays.some((d) => d >= w && d <= addDays(w, 6))) {
      push({ key: `printer:${w}`, date: addDays(w, 6) > today ? today : addDays(w, 6), source: 'workshop', label: 'Ticket Printer', gain: { tickets: printer } });
    }
  }

  // The Omamori Rack, on the first of each month after it was bought.
  const rackAt = txs.find((t) => t.type === 'upgrade' && t.ref.startsWith('rack:'))?.at;
  if (rackAt) {
    for (let m = `${rackAt.slice(0, 7)}-01`; m <= today; m = addDays(`${m.slice(0, 7)}-28`, 4).slice(0, 7) + '-01') {
      if (m >= rackAt) push({ key: `rack:${m}`, date: m, source: 'workshop', label: 'Omamori Rack', gain: { stock: { omamori: 1 } } });
    }
  }

  // Boss.
  for (const b of input.bosses) {
    if (b.defeatedOn) push({ key: `bossgem:${b.start}`, date: b.defeatedOn, source: 'boss', label: `${b.boss.name} defeated`, gain: { gems: 20 + up('prospector', b.defeatedOn) * 5, chests: ['iron'] } });
  }

  // Emblems.
  for (const a of input.achievements) {
    if (!a.unlockedOn) continue;
    push({ key: `emblem:${a.id}`, date: a.unlockedOn, source: 'emblems', label: a.title, gain: a.tier === 'platinum' ? { gems: EMBLEM_GEMS.platinum, chests: ['gold'] } : { gems: EMBLEM_GEMS[a.tier] } });
  }

  // Levels, forms and section levels: on the day the running total crossed each one.
  const sorted = [...input.xp].filter((e) => e.date <= today).sort((a, b) => a.date.localeCompare(b.date));
  let total = 0;
  let level = 1;
  const bySection = new Map<SectionId, number>();
  const sectionLv = new Map<SectionId, number>();
  for (const e of sorted) {
    total += e.xp;
    const now = overallLevel(total).level;
    while (level < now) {
      level++;
      const chest: ChestTier | null = level % 50 === 0 ? 'mythic' : level % 25 === 0 ? 'gold' : level % 5 === 0 ? 'iron' : null;
      push({ key: `lv:${level}`, date: e.date, source: 'levels', label: `Level ${level}`, gain: chest ? { gems: 5, chests: [chest] } : { gems: 5 } });
      const form = stageFor(level);
      if (STAGES[form].level === level) push({ key: `form:${form}`, date: e.date, source: 'levels', label: `Form: ${STAGES[form].name}`, gain: { gems: 25, chests: [form >= 20 ? 'gold' : 'iron'] } });
    }
    if (e.section === 'general' || e.section === 'quests') continue;
    const s = e.section;
    const x = (bySection.get(s) ?? 0) + e.xp;
    bySection.set(s, x);
    const sl = sectionLevel(x).level;
    let was = sectionLv.get(s) ?? 1;
    while (was < sl) {
      was++;
      push({ key: `sec:${s}:${was}`, date: e.date, source: 'levels', label: `${MATS[s].name}: section level ${was}`, gain: { gems: 3, mats: { [s]: 5 }, ...(was % 5 === 0 ? { chests: ['wood' as ChestTier] } : {}) } });
    }
    sectionLv.set(s, was);
  }

  // Bucket list.
  for (const b of input.bucket) {
    if (!b.doneOn) continue;
    const p = WISH_PRIZE[b.rarity] ?? WISH_PRIZE.rare;
    push({ key: `wish:${b.id}`, date: b.doneOn, source: 'bucket', label: b.title, gain: p.chest ? { gems: p.gems, chests: [p.chest] } : { gems: p.gems } });
  }

  // Hideout rooms and highlights.
  const lines = new Map<string, number>();
  for (const r of input.rows) {
    if (r.kind === 'highlight') {
      if (r.day >= GAME_FROM) lines.set(r.day, (lines.get(r.day) ?? 0) + 1);
      continue;
    }
    const pay = rowPay(r);
    if (!pay) continue;
    const wired = (d: string) => (up('hideout', d) ? 2 : 1);
    push({ key: `hq:${r.id}`, date: pay.date, source: 'hideout', label: pay.label, gain: { coins: pay.coins * wired(pay.date), ...(pay.gems ? { gems: pay.gems } : {}) } });
    if (pay.extra) push({ key: `hq:${r.id}:${pay.extra.tag}`, date: pay.extra.date, source: 'hideout', label: pay.extra.label, gain: { coins: pay.extra.coins * wired(pay.extra.date), ...(pay.extra.gems ? { gems: pay.extra.gems } : {}) } });
  }
  for (const [date, n] of lines) push({ key: `lines:${date}`, date, source: 'reading', label: `${n} highlight${n === 1 ? '' : 's'}`, gain: { coins: Math.min(n, 20) } });

  // Seasonal tokens: a share of the day's XP, plus a little for turning up at all.
  for (const run of runs) {
    const rate = tokenRate(run);
    for (let d = run.start; d <= run.end && d <= today; d = addDays(d, 1)) {
      const xp = dayXp.get(d)?.all ?? 0;
      const on = activeSet.has(d);
      if (!xp && !on) continue;
      const pass = 1 + up('festival', d) * 0.25;
      const n = Math.round((xp / 4 + (on ? 10 : 0)) * rate * pass);
      if (n) push({ key: `token:${run.key}:${d}`, date: d, source: 'event', label: `${run.def.name}: ${run.def.token.name}`, gain: { tokens: { [run.key]: n } } });
    }
  }

  return out;
}
