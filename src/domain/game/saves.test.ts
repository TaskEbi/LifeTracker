import { describe, expect, it } from 'vitest';
import { pickSave, saveProgress } from './saves';
import { fresh, settle } from './idle';

describe('game saves across devices', () => {
  it('measures the factory by bolts ever made and the dial by rolls ever made', () => {
    expect(saveProgress('gm_idle', { life: 1234, at: 1 })).toBe(1234);
    expect(saveProgress('gm_aura', { rolls: 88, at: 1 })).toBe(88);
    expect(saveProgress('gm_idle', { at: 5 })).toBe(0);
    expect(saveProgress('gm_idle', null)).toBe(0);
    expect(saveProgress('hq_checkin', { life: 9 })).toBeNull();
  });

  it('keeps the copy that has made more, whatever its time says', () => {
    const phone = { life: 5_000_000, at: 1_000 };
    const pcJustOpened = { life: 40_000, at: 9_999_999 };
    expect(pickSave('gm_idle', pcJustOpened, phone)).toBe('remote');
    expect(pickSave('gm_idle', phone, pcJustOpened)).toBe('local');
    expect(pickSave('gm_aura', { rolls: 10 }, { rolls: 10 })).toBeNull();
    expect(pickSave('mn_tx', { life: 1 }, { life: 2 })).toBeNull();
  });

  it('an old copy that settles its time away still trails one that kept playing', () => {
    const ext = { sections: 0, streak: 0, level: 1, aura: 1 };
    const t0 = Date.UTC(2026, 10, 1);
    const base = { ...fresh(t0), gens: { tanuki: 5 }, life: 1_000 };
    // The other device bought more machines and kept the factory running for a day.
    const ahead = settle({ ...base, gens: { tanuki: 60 } }, t0 + 86_400_000, ext).save;
    // This one was shut all that time and only catches up when it's opened, two days on.
    const stale = settle(base, t0 + 2 * 86_400_000, ext).save;
    expect(stale.at).toBeGreaterThan(ahead.at);
    expect(pickSave('gm_idle', stale, ahead)).toBe('remote');
  });
});
