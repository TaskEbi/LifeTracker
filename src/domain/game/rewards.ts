/**
 * More to earn (M54): True Silver and True Gold skins for every body, a prize for every achievement,
 * and a monthly Hangar Pass.
 *
 * - **Skins** are bought with Ryō once a body is levelled (`skin:<body>:silver` / `:gold` items, from
 *   `buy` rows). Which one a body wears is part of the loadout (`skins`).
 * - **Achievement prizes**: each unlocked achievement has a prize to claim, by tier. The claim row's
 *   ref is `ach:<id>:<tier>`, and the XP it gives is worked out from the tier (`ACH_XP`), never stored.
 * - **The pass** fills from the XP your records earn in a calendar month (bought and claimed XP don't
 *   count). Each tier is a claim row `pass:<YYYY-MM>:<n>`; a month's tiers can be claimed until the
 *   end of the next month.
 */
import type { XpEvent } from '../progress/engine';
import { ACH_XP, type Bag } from './catalog';
import type { Tx } from './wallet';

// ─── True Silver and True Gold ──────────────────────────────────────────────

export type SkinId = 'silver' | 'gold';

export interface Skin {
  id: SkinId;
  name: string;
  kanji: string;
  /** Body level needed to buy it. */
  level: number;
  cost: Bag;
  /** The two colours the body is cast in. */
  c: string;
  c2: string;
}

export const SKINS: Record<SkinId, Skin> = {
  silver: { id: 'silver', name: 'True Silver', kanji: '銀', level: 12, cost: { coins: 2500 }, c: '#9aa7b6', c2: '#eef3f8' },
  gold: { id: 'gold', name: 'True Gold', kanji: '金', level: 25, cost: { coins: 6000, gems: 60 }, c: '#c8921a', c2: '#ffe9a0' },
};
export const SKIN_IDS: SkinId[] = ['silver', 'gold'];

export const skinItem = (body: string, skin: SkinId) => `skin:${body}:${skin}`;
export const isSkin = (v: unknown): v is SkinId => v === 'silver' || v === 'gold';

/** Why a skin can't be bought yet, or null when it can (owning it is checked separately). */
export function skinLock(skin: SkinId, bodyLevel: number, owned: (item: string) => boolean, body: string, mk: number): string | null {
  if (!mk) return 'Build the body first';
  if (bodyLevel < SKINS[skin].level) return `Needs body LV ${SKINS[skin].level}`;
  if (skin === 'gold' && !owned(skinItem(body, 'silver'))) return 'True Silver first';
  return null;
}

// ─── achievement prizes ─────────────────────────────────────────────────────

export type AchTier = keyof typeof ACH_XP;

export const ACH_PRIZE: Record<AchTier, Bag> = {
  bronze: { coins: 150 },
  silver: { coins: 400, tickets: 1 },
  gold: { coins: 1000, chests: ['iron'] },
  platinum: { coins: 2500, gems: 25, chests: ['gold'] },
};

export const achRef = (id: string, tier: AchTier) => `ach:${id}:${tier}`;

/** The XP a claim row gives, from its ref (only achievement prizes give XP straight away). */
export function claimXp(ref: string): number {
  if (!ref.startsWith('ach:')) return 0;
  const tier = ref.slice(ref.lastIndexOf(':') + 1) as AchTier;
  return ACH_XP[tier] ?? 0;
}

export interface AchPrize {
  ref: string;
  id: string;
  title: string;
  tier: AchTier;
  unlockedOn: string;
  gain: Bag;
  xp: number;
}

/** Unlocked achievements whose prize hasn't been claimed, newest first. */
export function achPrizes(list: { id: string; title: string; tier: AchTier; unlockedOn: string | null }[], claimed: Set<string>): AchPrize[] {
  const out: AchPrize[] = [];
  for (const a of list) {
    if (!a.unlockedOn) continue;
    const ref = achRef(a.id, a.tier);
    if (claimed.has(ref)) continue;
    out.push({ ref, id: a.id, title: a.title, tier: a.tier, unlockedOn: a.unlockedOn, gain: ACH_PRIZE[a.tier], xp: ACH_XP[a.tier] });
  }
  return out.sort((a, b) => b.unlockedOn.localeCompare(a.unlockedOn) || a.ref.localeCompare(b.ref));
}

// ─── the Hangar Pass ────────────────────────────────────────────────────────

/** The pass starts with this month. */
export const PASS_FROM = '2026-11';
/** XP per tier, and how many tiers. */
export const PASS_STEP = 150;
export const PASS_TIERS = 30;

/** What tier n (1-based) pays. Big ones every fifth tier, the biggest at the end. */
export function passGain(n: number): Bag {
  if (n === PASS_TIERS) return { gems: 100, chests: ['mythic'], stock: { bigscroll: 1 } };
  if (n % 10 === 0) return { gems: 40, chests: ['gold'] };
  if (n % 5 === 0) return { gems: 20, chests: ['iron'], stock: { scroll: 1 } };
  switch (n % 5) {
    case 1:
      return { coins: 200 + n * 10 };
    case 2:
      return { tickets: 1 };
    case 3:
      return { coins: 150 + n * 10, chests: ['wood'] };
    default:
      return { gems: 8 + Math.floor(n / 5) * 2, stock: n % 2 ? undefined : { scroll: 1 } };
  }
}

export const passRef = (month: string, n: number) => `pass:${month}:${n}`;

const monthOf = (d: string) => d.slice(0, 7);
/** The month after `m` (YYYY-MM). */
export function nextMonth(m: string): string {
  const [y, mo] = m.split('-').map(Number);
  return mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, '0')}`;
}

/** XP towards the pass: what the records earned, without bought or claimed XP. */
export function passXp(xp: XpEvent[], month: string): number {
  let n = 0;
  for (const e of xp) if (monthOf(e.date) === month && !e.key.startsWith('item:')) n += e.xp;
  return n;
}

export interface PassState {
  month: string;
  xp: number;
  /** Tiers reached (0 to PASS_TIERS). */
  reached: number;
  /** XP into the next tier. */
  into: number;
  tiers: { n: number; ref: string; gain: Bag; reached: boolean; claimed: boolean }[];
  /** Still claimable (this month, or last month until this one ends). */
  open: boolean;
}

export function passState(xp: XpEvent[], month: string, today: string, claimed: Set<string>): PassState {
  const total = passXp(xp, month);
  const reached = Math.min(PASS_TIERS, Math.floor(total / PASS_STEP));
  const now = monthOf(today);
  return {
    month,
    xp: total,
    reached,
    into: reached >= PASS_TIERS ? 0 : total - reached * PASS_STEP,
    tiers: Array.from({ length: PASS_TIERS }, (_, i) => {
      const n = i + 1;
      const ref = passRef(month, n);
      return { n, ref, gain: passGain(n), reached: n <= reached, claimed: claimed.has(ref) };
    }),
    open: month >= PASS_FROM && (month === now || nextMonth(month) === now),
  };
}

/** This month's pass, and last month's if it still has prizes waiting. */
export function passesNow(xp: XpEvent[], today: string, claimed: Set<string>): PassState[] {
  const now = monthOf(today);
  const out = [passState(xp, now, today, claimed)];
  const [y, m] = now.split('-').map(Number);
  const last = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
  if (last >= PASS_FROM) {
    const prev = passState(xp, last, today, claimed);
    if (prev.tiers.some((t) => t.reached && !t.claimed)) out.push(prev);
  }
  return out;
}

/** Claim refs for the pass and achievements already written. */
export const rewardClaims = (txs: Tx[]) => new Set(txs.filter((t) => t.type === 'claim' && (t.ref.startsWith('ach:') || t.ref.startsWith('pass:'))).map((t) => t.ref));
