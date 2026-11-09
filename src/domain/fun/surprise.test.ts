import { describe, expect, it } from 'vitest';
import { mainSection, pickSurprise, shouldSurprise, surpriseOptions, SURPRISE_COOLDOWN, SURPRISE_DAILY, SURPRISE_FRESH, SURPRISES, type SurpriseLog } from './surprise';

const empty: SurpriseLog = { shown: [] };
const NOW = Date.UTC(2026, 10, 9, 12);

describe('surprise scenes', () => {
  it('has forty, each once, a section scene for every section', () => {
    expect(SURPRISES).toHaveLength(40);
    expect(new Set(SURPRISES.map((s) => s.id)).size).toBe(40);
    expect(new Set(SURPRISES.filter((s) => s.section).map((s) => s.section)).size).toBe(12);
  });

  it('plays on a low roll only, with a cooldown and a daily cap', () => {
    expect(shouldSurprise(empty, NOW, '2026-11-09', 0.1)).toBe(true);
    expect(shouldSurprise(empty, NOW, '2026-11-09', 0.9)).toBe(false);
    const recent: SurpriseLog = { shown: [{ id: 'ramen', at: NOW - SURPRISE_COOLDOWN + 1000, day: '2026-11-09' }] };
    expect(shouldSurprise(recent, NOW, '2026-11-09', 0)).toBe(false);
    const full: SurpriseLog = { shown: Array.from({ length: SURPRISE_DAILY }, (_, i) => ({ id: 'ramen' as const, at: NOW - (10 - i) * 3_600_000, day: '2026-11-09' })) };
    expect(shouldSurprise(full, NOW, '2026-11-09', 0)).toBe(false);
    expect(shouldSurprise(full, NOW, '2026-11-10', 0)).toBe(true);
  });

  it("only offers a section's scene after a save in that section, and night scenes at night", () => {
    const day = surpriseOptions(empty, 'violin', 12).map((o) => o.def.id);
    expect(day).toContain('concert');
    expect(day).not.toContain('accepted');
    expect(day).not.toContain('hanabi');
    expect(day).toContain('fuji');
    const night = surpriseOptions(empty, null, 22).map((o) => o.def.id);
    expect(night).toContain('hanabi');
    expect(night).not.toContain('fuji');
    expect(night.some((id) => SURPRISES.find((s) => s.id === id)?.section)).toBe(false);
  });

  it('never repeats one of the last few, and weights the section scene', () => {
    const shown = SURPRISES.filter((s) => !s.section).slice(0, SURPRISE_FRESH).map((s, i) => ({ id: s.id, at: i, day: 'x' }));
    const ids = surpriseOptions({ shown }, 'coding', 12).map((o) => o.def.id);
    for (const s of shown) expect(ids).not.toContain(s.id);
    expect(surpriseOptions(empty, 'coding', 12).find((o) => o.def.id === 'accepted')!.weight).toBe(4);
    const picks = new Set(Array.from({ length: 200 }, (_, i) => pickSurprise(empty, 'coding', 12, i / 200)));
    expect(picks.has('accepted')).toBe(true);
    expect(picks.size).toBeGreaterThan(20);
  });

  it('finds what a save was mostly about', () => {
    expect(mainSection([{ section: 'violin', xp: 25 }, { section: 'violin', xp: 10 }, { section: 'quests', xp: 80 }, { section: 'coding', xp: 30 }])).toBe('violin');
    expect(mainSection([{ section: 'general', xp: 5 }])).toBe(null);
  });
});
