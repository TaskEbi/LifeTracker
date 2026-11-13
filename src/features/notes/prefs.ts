/**
 * Choices on the notes pages that are a convenience of this device, not data: which level is
 * shown (AS, A2 or both), which cards a sitting takes, and their order. Kept in localStorage.
 */
import { isLevel, type CardKind, type Level, type SessionMode } from '../../domain/notes/tools';
import { createStore, useStore } from '../../lib/createStore';

export interface NotesPrefs {
  level: Level;
  kind: CardKind | 'all';
  mode: SessionMode;
}

const KEY = 'lifetracker-notes';
const DEFAULTS: NotesPrefs = { level: 'as', kind: 'all', mode: 'due' };

function load(): NotesPrefs {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<NotesPrefs> | null;
    return {
      level: isLevel(p?.level) ? p.level : DEFAULTS.level,
      kind: p?.kind === 'term' || p?.kind === 'formula' ? p.kind : 'all',
      mode: p?.mode === 'all' ? 'all' : 'due',
    };
  } catch {
    return DEFAULTS;
  }
}

const store = createStore<NotesPrefs>(load());

export const useNotesPrefs = () => useStore(store, (s) => s);
export function setNotesPrefs(patch: Partial<NotesPrefs>) {
  store.set(patch);
  try {
    localStorage.setItem(KEY, JSON.stringify(store.get()));
  } catch {
    // private mode or a full disk: the choice lasts until the page is closed
  }
}
