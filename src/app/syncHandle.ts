/** The running sync loop, so screens can ask it to push now (e.g. before signing out). */
import type { SyncHandle } from '../data/sync';

let handle: SyncHandle | null = null;
export const setSync = (h: SyncHandle | null) => {
  handle = h;
};
export const syncNow = () => handle?.request();
export const flushSync = (timeout?: number) => handle?.flush(timeout) ?? Promise.resolve();
