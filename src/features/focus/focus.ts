/**
 * Focus mode: one timer for any timed section, kept on this device (it survives reloads and
 * keeps counting while the phone is locked). Finishing hands the minutes to that section's own
 * log sheet, so the session is saved like any other, and nothing is logged until you save it.
 */
import { createStore, useStore } from '../../lib/createStore';
import type { TimedSection } from '../../data/types';

/** Gym has its own session flow; the others log through their sheet. */
export const FOCUS_SECTIONS = ['violin', 'coding', 'study', 'chess', 'sports', 'future'] as const satisfies readonly TimedSection[];
export type FocusSection = (typeof FOCUS_SECTIONS)[number];
export const FOCUS_GOALS = [15, 25, 45, 60, 90] as const;

export interface Focus {
  section: FocusSection;
  /** Minutes aimed for, or null for an open session. */
  goal: number | null;
  /** When the current run started (ms), or null while paused or finished. */
  startedAt: number | null;
  /** Seconds counted before the current run. */
  banked: number;
  /** When it was finished (ms): the minutes now wait to be logged. */
  finishedAt: number | null;
  minutes: number;
}

const KEY = 'lifetracker-focus';

function load(): Focus | null {
  try {
    const f = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Focus | null;
    return f && (FOCUS_SECTIONS as readonly string[]).includes(f.section) && typeof f.banked === 'number' ? f : null;
  } catch {
    return null;
  }
}

export const focusStore = createStore<{ focus: Focus | null }>({ focus: load() });
export const useFocus = () => useStore(focusStore, (s) => s.focus);

function put(focus: Focus | null) {
  focusStore.set({ focus });
  try {
    if (focus) localStorage.setItem(KEY, JSON.stringify(focus));
    else localStorage.removeItem(KEY);
  } catch {
    /* private mode: the timer still runs for this visit */
  }
}

export const elapsedSec = (f: Focus, now = Date.now()) => Math.floor(f.banked + (f.startedAt ? (now - f.startedAt) / 1000 : 0));
export const focusMinutes = (f: Focus, now = Date.now()) => Math.max(1, Math.round(elapsedSec(f, now) / 60));

export function startFocus(section: FocusSection, goal: number | null) {
  put({ section, goal, startedAt: Date.now(), banked: 0, finishedAt: null, minutes: 0 });
}

export function pauseFocus() {
  const f = focusStore.get().focus;
  if (f?.startedAt) put({ ...f, startedAt: null, banked: elapsedSec(f) });
}

export function resumeFocus() {
  const f = focusStore.get().focus;
  if (f && !f.startedAt && !f.finishedAt) put({ ...f, startedAt: Date.now() });
}

/** Stop the clock; the minutes wait until the session is saved (or the focus is discarded). */
export function finishFocus(): Focus | null {
  const f = focusStore.get().focus;
  if (!f) return null;
  const done = f.finishedAt ? f : { ...f, startedAt: null, banked: elapsedSec(f), finishedAt: Date.now(), minutes: focusMinutes(f) };
  put(done);
  return done;
}

export const discardFocus = () => put(null);
