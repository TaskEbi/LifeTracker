/**
 * Full-screen celebrations. Anything can queue one; the celebration layer (mounted once in the
 * shell) plays them in order. `preview` marks one played on request, not earned: the layer labels
 * it so on screen.
 */
import { createStore, useStore } from '../../../lib/createStore';
import type { Achievement } from '../../../domain/progress/achievements';
import type { SectionId } from '../../../data/types';
import type { Moment } from '../../../domain/progress/moments';

export type QuestPeriodName = 'daily' | 'weekly' | 'monthly';

export type Celebration =
  | { kind: 'achievement'; achievement: Achievement; preview?: boolean }
  | { kind: 'level'; from: number; to: number; preview?: boolean }
  | { kind: 'section-level'; section: SectionId | string; from: number; to: number; preview?: boolean }
  /** `sweep`: all of the period's quests are done; `titles` are its quests (for the fanned cards). */
  | { kind: 'quest'; title: string; period: QuestPeriodName; sweep?: boolean; titles?: string[]; xp?: number; preview?: boolean }
  | { kind: 'boss'; name: string; bossId?: string; xp?: number; preview?: boolean }
  | { kind: 'evolve'; from: number; to: number; level?: number; preview?: boolean }
  /** Records, streaks, combos, plan progress… (see domain/progress/moments.ts). */
  | { kind: 'moment'; moment: Moment; preview?: boolean };

export const celebrationStore = createStore<{ queue: Celebration[]; playing: boolean }>({ queue: [], playing: false });

export function celebrate(...items: Celebration[]) {
  if (!items.length) return;
  celebrationStore.set((s) => ({ ...s, queue: [...s.queue, ...items] }));
}

/** True while celebrations are queued or the layer is still on screen. */
export const useCelebrating = () => useStore(celebrationStore, (s) => s.playing || s.queue.length > 0);

// ─── per-device preference ───────────────────────────────────────────────────

/**
 * full: the 3D sequences (calm cards when the device asks for reduced motion);
 * calm: cross-fading cards with the same information; off: only the reward box.
 */
export type FxMode = 'full' | 'calm' | 'off';
const KEY = 'lifetracker-fx';

function readMode(): FxMode {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'calm' || v === 'off' ? v : 'full';
  } catch {
    return 'full';
  }
}

export const fxStore = createStore<{ mode: FxMode }>({ mode: readMode() });
export const useFxMode = () => useStore(fxStore, (s) => s.mode);

export function setFxMode(mode: FxMode) {
  try {
    localStorage.setItem(KEY, mode);
  } catch {
    /* private mode: kept for this visit only */
  }
  fxStore.set({ mode });
}

/** How a sequence should actually play right now. */
export function playStyle(): 'full' | 'calm' {
  if (fxStore.get().mode !== 'full') return 'calm';
  try {
    return matchMedia('(prefers-reduced-motion: reduce)').matches ? 'calm' : 'full';
  } catch {
    return 'full';
  }
}

// ─── per-device extras ───────────────────────────────────────────────────────

/** chapter: play the 第N話 card on the first save of each day (default on). */
export interface FxPrefs {
  chapter: boolean;
}
const CHAPTER_KEY = 'lifetracker-fx-chapter';

function readPrefs(): FxPrefs {
  try {
    return { chapter: localStorage.getItem(CHAPTER_KEY) !== 'off' };
  } catch {
    return { chapter: true };
  }
}

export const fxPrefs = createStore<FxPrefs>(readPrefs());
export const useFxPrefs = () => useStore(fxPrefs, (s) => s);

export function setFxPrefs(patch: Partial<FxPrefs>) {
  const next = { ...fxPrefs.get(), ...patch };
  try {
    localStorage.setItem(CHAPTER_KEY, next.chapter ? 'on' : 'off');
  } catch {
    /* private mode: kept for this visit only */
  }
  fxPrefs.set(next);
}
