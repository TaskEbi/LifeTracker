import { describe, expect, it } from 'vitest';
import { mergeAura, mergeIdle, mergeSave, sameData } from './saves';
import { fresh, settle } from './idle';
import { AURAS, freshAura, normaliseAura, restoreAura } from './aura';

const T0 = Date.UTC(2026, 10, 14);
const ext = { sections: 0, streak: 0, level: 1, aura: 1 };

describe('game saves across devices', () => {
  it('merging the dial keeps the upgrades and auras of both copies, even when the other has more rolls', () => {
    // The phone: upgraded, rare auras found. The PC: an old copy that has piled up more rolls.
    const phone = { ...freshAura(T0), rolls: 90_000, motes: 5e6, got: { lint: 900, overflow: 1 }, first: { lint: '2026-11-14', overflow: '2026-11-15' }, ups: { speed: 24, luck: 25 }, worn: 'overflow' };
    const pc = { ...freshAura(T0 + 9e6), rolls: 120_000, motes: 300, got: { lint: 1500, breeze: 3 }, first: { lint: '2026-11-14', breeze: '2026-11-14' }, ups: { speed: 6 } };
    const m = mergeAura(phone, pc);
    expect(m.ups).toEqual({ speed: 24, luck: 25 });
    expect(Object.keys(m.got).sort()).toEqual(['breeze', 'lint', 'overflow']);
    expect(m.got.lint).toBe(1500);
    expect(m.rolls).toBe(120_000);
    expect(sameData(mergeAura(pc, phone), m)).toBe(true);
  });

  it('a merge is idempotent, so devices settle on one save', () => {
    const a = { ...freshAura(T0), rolls: 10, got: { lint: 10 }, first: { lint: '2026-11-14' }, ups: { speed: 2 }, fixes: ['x'] };
    const b = { ...freshAura(T0 + 1), rolls: 12, got: { breeze: 1 }, first: { breeze: '2026-11-15' }, ups: { luck: 1 } };
    const m = mergeAura(a, b);
    expect(sameData(mergeAura(m, a), m)).toBe(true);
    expect(sameData(mergeAura(m, b), m)).toBe(true);
    expect(sameData(mergeAura(m, m), m)).toBe(true);
    // As row data, through the sync layer: merging what came back from the server changes nothing.
    const row = JSON.parse(JSON.stringify(m));
    expect(sameData(mergeSave('gm_aura', row, row), row)).toBe(true);
  });

  it('merging the factory keeps lifetime totals, milestones and perks from both', () => {
    const phone = { ...fresh(T0), life: 5e6, bolts: 1e5, gens: { tanuki: 60 }, ups: ['a'], done: ['m1'], perks: { head: 3 }, cogs: 40 };
    const pc = settle({ ...fresh(T0), life: 1e3, gens: { tanuki: 5, mouse: 3 }, done: ['m2'] }, T0 + 2 * 86_400_000, ext).save;
    const m = mergeIdle(pc, phone);
    expect(m.life).toBe(5e6);
    expect(m.bolts).toBe(1e5);
    expect(m.gens).toEqual({ tanuki: 60, mouse: 3 });
    expect(m.done.sort()).toEqual(['m1', 'm2']);
    expect(m.perks.head).toBe(3);
    expect(m.cogs).toBe(40);
  });

  it('only game saves merge', () => {
    expect(mergeSave('hq_checkin', {}, {})).toBeNull();
    expect(sameData({ a: 1, b: [1, { c: 2 }] }, { b: [1, { c: 2 }], a: 1 })).toBe(true);
    expect(sameData({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });

  it('a restore puts things back once and never lowers anything', () => {
    const now = { ...freshAura(T0), rolls: 500, motes: 9e7, got: { lint: 400 }, first: { lint: '2026-11-14' }, ups: { speed: 26, luck: 3 } };
    const r = { id: 'fix', found: ['lint', 'overflow', 'nope'], ups: { speed: 24, luck: 25, fuse: 9 }, motes: 5e7 };
    const s = restoreAura(now, r, '2026-11-15');
    expect(s.got).toEqual({ lint: 400, overflow: 1 });
    expect(s.first.overflow).toBe('2026-11-15');
    expect(s.ups).toEqual({ speed: 26, luck: 25, fuse: 5 });
    expect(s.motes).toBe(9e7);
    expect(s.queue).toEqual([]);
    expect(restoreAura(s, r, '2026-11-16')).toBe(s);
    // It survives being saved and read back.
    expect(normaliseAura(JSON.parse(JSON.stringify(s)), T0 + 1).fixes).toEqual(['fix']);
    expect(AURAS.some((a) => a.id === 'overflow' && a.odds === 120_000_000)).toBe(true);
  });
});
