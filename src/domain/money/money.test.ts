import { describe, expect, it } from 'vitest';
import type { LtRecord } from '../../data/types';
import { allowanceDue, allowanceOf, byCategory, fmtMoney, goalOf, goalPace, goalSaved, noSpendRun, received, spent, txOf, wallet, weekdaySpend, type Tx } from './model';

const rec = (data: Record<string, unknown>): LtRecord => ({ id: 'r', section: 'cabinet', kind: 'mn_tx', data, sort_order: 0, archived_at: null, created_at: '', updated_at: '', deleted_at: null });
let k = 0;
const tx = (date: string, dir: Tx['dir'], amount: number, category = 'Other', goalId: string | null = null): Tx => ({ id: String(k++), date, dir, amount, category, note: '', goalId });

describe('money', () => {
  it('reads movements and goals defensively', () => {
    expect(txOf(rec({ date: '2026-11-09', dir: 'out', amount: 4.505, category: 'Snacks' }))).toMatchObject({ amount: 4.51, category: 'Snacks' });
    expect(txOf(rec({ date: '2026-11-09', dir: 'out', amount: -4 }))).toBeNull();
    expect(txOf(rec({ date: '2026-11-09', dir: 'save', amount: -4, goalId: 'g' }))).toMatchObject({ amount: -4 });
    expect(txOf(rec({ date: 'x', dir: 'in', amount: 4 }))).toBeNull();
    expect(goalOf(rec({ title: 'Headphones', target: 199 }))).toMatchObject({ target: 199, by: null });
    expect(goalOf(rec({ title: 'Headphones', target: 0 }))).toBeNull();
  });

  const txs = [tx('2026-11-01', 'in', 50, 'Starting balance'), tx('2026-11-02', 'in', 20, 'Pocket money'), tx('2026-11-03', 'out', 6.5, 'Snacks'), tx('2026-11-03', 'out', 12, 'Games'), tx('2026-11-05', 'out', 3.5, 'Snacks'), tx('2026-11-06', 'save', 30, 'Saving', 'g'), tx('2026-11-07', 'save', -5, 'Saving', 'g')];

  it('derives the wallet and the goal', () => {
    expect(wallet(txs)).toBe(23);
    expect(wallet(txs, '2026-11-02')).toBe(70);
    expect(goalSaved('g', txs)).toBe(25);
    expect(spent(txs, '2026-11-01', '2026-11-30')).toBe(22);
    expect(received(txs, '2026-11-01', '2026-11-30')).toBe(20);
  });

  it('splits spending by category and weekday', () => {
    expect(byCategory(txs, '2026-11-01', '2026-11-30')).toEqual([
      { category: 'Games', amount: 12, n: 1 },
      { category: 'Snacks', amount: 10, n: 2 },
    ]);
    // 2026-11-03 is a Tuesday, 2026-11-05 a Thursday; one week
    expect(weekdaySpend(txs, '2026-11-02', '2026-11-08')).toEqual([0, 18.5, 0, 3.5, 0, 0, 0]);
  });

  it('counts days without spending', () => {
    expect(noSpendRun(txs, '2026-11-09')).toBe(4);
    expect(noSpendRun(txs, '2026-11-05')).toBe(0);
    expect(noSpendRun([], '2026-11-05')).toBe(0);
  });

  it('paces a goal', () => {
    expect(goalPace({ id: 'g', title: 'x', target: 100, by: '2026-11-23', done: null }, 30, '2026-11-09')).toEqual({ left: 70, perWeek: 35, days: 14 });
    expect(goalPace({ id: 'g', title: 'x', target: 100, by: null, done: null }, 30, '2026-11-09').perWeek).toBeNull();
  });

  it('knows when pocket money is due', () => {
    const weekly = allowanceOf({ amount: 20, every: 'week', on: 0 })!;
    expect(allowanceDue(weekly, txs, '2026-11-09')).toEqual({ due: '2026-11-09', got: false });
    expect(allowanceDue(weekly, txs, '2026-11-08')).toEqual({ due: '2026-11-02', got: true });
    const monthly = allowanceOf({ amount: 80, every: 'month', on: 15 })!;
    expect(allowanceDue(monthly, txs, '2026-11-09').due).toBe('2026-10-15');
    expect(allowanceDue(monthly, txs, '2026-01-09').due).toBe('2025-12-15');
    expect(allowanceOf({ amount: 0, every: 'week', on: 0 })).toBeNull();
  });

  it('formats money', () => {
    expect(fmtMoney(12)).toBe('S$12');
    expect(fmtMoney(12.5)).toBe('S$12.50');
    expect(fmtMoney(-1234.5, '£')).toBe('−£1,234.50');
  });
});
