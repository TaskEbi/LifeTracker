/** A store for the Hangar's reveal: the spotlight on what you just bought or built. */
import { createStore } from '../../lib/createStore';
import type { Bag, ChestTier } from '../../domain/game/catalog';
import type { SpinResult } from '../../domain/game/loot';

export type Reveal =
  | { kind: 'bot'; chassis: string; mk: 1 | 2 | 3 }
  | { kind: 'item'; item: string }
  | { kind: 'chest'; tier: ChestTier; gain: Bag }
  | { kind: 'chests'; count: number; gain: Bag }
  | { kind: 'spin'; res: SpinResult }
  | { kind: 'loot'; art: 'bag' | 'stamp' | 'set'; title: string; line?: string; gain: Bag };

export const revealStore = createStore<{ reveal: Reveal | null }>({ reveal: null });
export const showReveal = (reveal: Reveal) => revealStore.set({ reveal });
export const closeReveal = () => revealStore.set({ reveal: null });
export const evolveBot = (o: { chassis: string; mk: 1 | 2 | 3 }) => showReveal({ kind: 'bot', ...o });
