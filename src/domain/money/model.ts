/**
 * Money: pocket money in, spending out, and saving goals. lt_records under the cabinet section:
 * `mn_tx` (one per movement) and `mn_goal`. The wallet and each goal's total are derived from the
 * movements; no balance is ever stored. Pure functions only; tested in money.test.ts.
 */
import type { LtRecord } from '../../data/types';
import { addDays, dayCount, weekdayIndex } from '../log/dates';

export const CATEGORIES = ['Food & drink', 'Snacks', 'Transport', 'Games', 'Music', 'Books', 'Clothes', 'Gifts', 'Going out', 'School', 'Other'] as const;
export const INCOME = ['Pocket money', 'Gift money', 'Earned', 'Starting balance', 'Other'] as const;

/** in: money arrives. out: money spent. save: moved from the wallet into a goal (negative takes it back). */
export type TxDir = 'in' | 'out' | 'save';
export interface Tx {
  id: string;
  date: string;
  dir: TxDir;
  /** Always positive for in and out; signed for save. */
  amount: number;
  category: string;
  note: string;
  goalId: string | null;
}

const day = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max).trim() : '');
/** Money is kept to the cent. */
export const cents = (n: number) => Math.round(n * 100) / 100;

export function txOf(r: LtRecord): Tx | null {
  const d = (r.data ?? {}) as Record<string, unknown>;
  const date = day(d.date);
  const dir = d.dir === 'in' || d.dir === 'out' || d.dir === 'save' ? d.dir : null;
  const amount = typeof d.amount === 'number' && Number.isFinite(d.amount) ? cents(d.amount) : null;
  if (!date || !dir || amount == null || (dir !== 'save' && amount <= 0) || amount === 0) return null;
  return { id: r.id, date, dir, amount, category: str(d.category, 40) || 'Other', note: str(d.note, 200), goalId: typeof d.goalId === 'string' ? d.goalId : null };
}

export interface Goal {
  id: string;
  title: string;
  target: number;
  /** Want it by, or null. */
  by: string | null;
  /** When it was reached and closed, or null while open. */
  done: string | null;
}
export function goalOf(r: LtRecord): Goal | null {
  const d = (r.data ?? {}) as Record<string, unknown>;
  const title = str(d.title, 80);
  const target = typeof d.target === 'number' && d.target > 0 ? cents(d.target) : null;
  if (!title || target == null) return null;
  return { id: r.id, title, target, by: day(d.by), done: day(d.done) };
}

/** What's in the wallet: in, less spent, less what's been put into goals. */
export function wallet(txs: Tx[], upTo?: string): number {
  let n = 0;
  for (const t of txs) {
    if (upTo && t.date > upTo) continue;
    n += t.dir === 'in' ? t.amount : -t.amount;
  }
  return cents(n);
}

/** What's been put into a goal so far. */
export const goalSaved = (goalId: string, txs: Tx[]) => cents(txs.filter((t) => t.dir === 'save' && t.goalId === goalId).reduce((a, t) => a + t.amount, 0));

/** Per week needed from today to reach the target by its date (null without a date or when reached). */
export function goalPace(g: Goal, saved: number, today: string): { left: number; perWeek: number | null; days: number | null } {
  const left = cents(Math.max(0, g.target - saved));
  if (!g.by || left === 0) return { left, perWeek: null, days: g.by ? Math.max(0, dayCount(today, g.by) - 1) : null };
  const days = Math.max(0, dayCount(today, g.by) - 1);
  return { left, perWeek: days === 0 ? left : cents(Math.ceil((left / days) * 7 * 100) / 100), days };
}

export const spent = (txs: Tx[], from: string, to: string) => cents(txs.filter((t) => t.dir === 'out' && t.date >= from && t.date <= to).reduce((a, t) => a + t.amount, 0));
export const received = (txs: Tx[], from: string, to: string) => cents(txs.filter((t) => t.dir === 'in' && t.category !== 'Starting balance' && t.date >= from && t.date <= to).reduce((a, t) => a + t.amount, 0));

/** Spending by category between two dates, biggest first. */
export function byCategory(txs: Tx[], from: string, to: string): { category: string; amount: number; n: number }[] {
  const m = new Map<string, { amount: number; n: number }>();
  for (const t of txs) {
    if (t.dir !== 'out' || t.date < from || t.date > to) continue;
    const c = m.get(t.category) ?? { amount: 0, n: 0 };
    m.set(t.category, { amount: c.amount + t.amount, n: c.n + 1 });
  }
  return [...m].map(([category, v]) => ({ category, amount: cents(v.amount), n: v.n })).sort((a, b) => b.amount - a.amount);
}

/** Spending per weekday, Monday first, averaged over the weeks since `from`. */
export function weekdaySpend(txs: Tx[], from: string, to: string): number[] {
  const weeks = Math.max(1, Math.ceil(dayCount(from, to) / 7));
  const out = Array(7).fill(0);
  for (const t of txs) if (t.dir === 'out' && t.date >= from && t.date <= to) out[weekdayIndex(t.date)] += t.amount;
  return out.map((v) => cents(v / weeks));
}

/** Days in a row without spending, up to today (today counts once it has passed without any). */
export function noSpendRun(txs: Tx[], today: string): number {
  const first = txs.reduce<string | null>((m, t) => (m == null || t.date < m ? t.date : m), null);
  if (!first) return 0;
  const spentOn = new Set(txs.filter((t) => t.dir === 'out').map((t) => t.date));
  let d = spentOn.has(today) ? null : today;
  let n = 0;
  while (d && d >= first && !spentOn.has(d)) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

export interface Allowance {
  amount: number;
  every: 'week' | 'month';
  /** Weekday 0 (Monday)–6 for weekly; day of the month 1–28 for monthly. */
  on: number;
}
export function allowanceOf(v: unknown): Allowance | null {
  const a = v as Partial<Allowance> | null;
  if (!a || typeof a.amount !== 'number' || a.amount <= 0 || (a.every !== 'week' && a.every !== 'month') || typeof a.on !== 'number') return null;
  return { amount: cents(a.amount), every: a.every, on: Math.round(a.on) };
}

/** The most recent pocket-money day on or before today, and whether it has been logged since. */
export function allowanceDue(a: Allowance, txs: Tx[], today: string): { due: string; got: boolean } {
  let due: string;
  if (a.every === 'week') due = addDays(today, -((weekdayIndex(today) - a.on + 7) % 7));
  else {
    const dom = Math.min(28, Math.max(1, a.on));
    const thisMonth = `${today.slice(0, 8)}${String(dom).padStart(2, '0')}`;
    if (thisMonth <= today) due = thisMonth;
    else {
      const [y, m] = [Number(today.slice(0, 4)), Number(today.slice(5, 7))];
      const pm = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
      due = `${pm}-${String(dom).padStart(2, '0')}`;
    }
  }
  return { due, got: txs.some((t) => t.dir === 'in' && t.category === 'Pocket money' && t.date >= due) };
}

/** Formats an amount: S$12.50, or S$12 when it's whole. */
export function fmtMoney(n: number, symbol = 'S$'): string {
  const neg = n < 0;
  const a = Math.abs(cents(n));
  const s = Number.isInteger(a) ? a.toLocaleString('en-GB') : a.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${neg ? '−' : ''}${symbol}${s}`;
}
