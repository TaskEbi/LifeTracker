/**
 * Money records: lt_records under the cabinet section, kinds `mn_tx` and `mn_goal`, plus three
 * prefs (currency symbol, pocket money, weekly budget). No migration, and no stored balance.
 */
import { useCallback } from 'react';
import { prefValue, sectionRecords, setPref } from '../../data/lt';
import { saveRecord } from '../../data/records';
import { data, type DataState } from '../../data/store';
import { allowanceOf, cents, fmtMoney, goalOf, txOf, type Allowance, type Goal, type Tx } from '../../domain/money/model';
import { useStore } from '../../lib/createStore';

const SECTION = 'cabinet' as const;

export interface MoneyState {
  txs: Tx[];
  goals: Goal[];
  allowance: Allowance | null;
  /** Weekly spending budget, or null. */
  budget: number | null;
  symbol: string;
}

let lastRecs: DataState['lt_records'] | null = null;
let lastPrefs: DataState['lt_prefs'] | null = null;
let last: MoneyState | null = null;
export function moneyOf(st: DataState): MoneyState {
  if (st.lt_records === lastRecs && st.lt_prefs === lastPrefs && last) return last;
  lastRecs = st.lt_records;
  lastPrefs = st.lt_prefs;
  const sym = prefValue(st, 'money_currency');
  const budget = prefValue(st, 'money_budget');
  last = {
    txs: sectionRecords(st, SECTION, 'mn_tx')
      .map(txOf)
      .filter((t): t is Tx => t != null)
      // newest first; within a day, the last one added first
      .reverse()
      .sort((a, b) => b.date.localeCompare(a.date)),
    goals: sectionRecords(st, SECTION, 'mn_goal')
      .map(goalOf)
      .filter((g): g is Goal => g != null),
    allowance: allowanceOf(prefValue(st, 'money_allowance')),
    budget: typeof budget === 'number' && budget > 0 ? budget : null,
    symbol: typeof sym === 'string' && sym.trim() ? sym.trim().slice(0, 4) : 'S$',
  };
  return last;
}
export const useMoney = () => useStore(data, moneyOf);

/** Formats in the chosen currency. */
export function useMoneyFmt() {
  const symbol = useStore(data, (s) => moneyOf(s).symbol);
  return useCallback((n: number) => fmtMoney(n, symbol), [symbol]);
}

export const saveTx = (t: Omit<Tx, 'id'>, id?: string) =>
  saveRecord(SECTION, 'mn_tx', { date: t.date, dir: t.dir, amount: cents(t.amount), category: t.category, note: t.note.trim().slice(0, 200), goalId: t.goalId }, id);

export const saveGoal = (g: Omit<Goal, 'id'>, id?: string) => saveRecord(SECTION, 'mn_goal', { title: g.title.trim().slice(0, 80), target: cents(g.target), by: g.by, done: g.done }, id);

export function saveMoneySettings(s: { symbol: string; allowance: Allowance | null; budget: number | null }) {
  setPref('money_currency', s.symbol.trim().slice(0, 4) || 'S$');
  setPref('money_allowance', s.allowance);
  setPref('money_budget', s.budget);
}

/** Reads a typed amount: "12.50", "S$12", "1,200". */
export function parseAmount(s: string): number | null {
  const n = Number(s.replace(/[^\d.]/g, ''));
  return s.trim() && Number.isFinite(n) && n > 0 ? cents(n) : null;
}
