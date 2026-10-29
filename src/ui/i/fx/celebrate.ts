/**
 * Full-screen celebrations. Anything can queue one; the celebration layer (mounted once in the
 * shell) plays them in order. `preview` marks one played on request, not earned: the layer labels
 * it so on screen.
 */
import { createStore, useStore } from '../../../lib/createStore';
import type { Achievement } from '../../../domain/progress/achievements';
import type { SectionId } from '../../../data/types';

export type QuestPeriodName = 'daily' | 'weekly' | 'monthly';

export type Celebration =
  | { kind: 'achievement'; achievement: Achievement; preview?: boolean }
  | { kind: 'level'; from: number; to: number; preview?: boolean }
  | { kind: 'section-level'; section: SectionId | string; from: number; to: number; preview?: boolean }
  /** `sweep`: all of the period's quests are done; `titles` are its quests (for the fanned cards). */
  | { kind: 'quest'; title: string; period: QuestPeriodName; sweep?: boolean; titles?: string[]; xp?: number; preview?: boolean }
  | { kind: 'boss'; name: string; bossId?: string; xp?: number; preview?: boolean }
  | { kind: 'evolve'; from: number; to: number; level?: number; preview?: boolean };

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
