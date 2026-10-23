/** Which sheet is open. Features open their own; the shell renders whichever is current. */
import { createStore, useStore } from '../lib/createStore';

export type SheetSpec =
  | { type: 'quick' }
  | { type: 'violin'; editId?: string | null }
  | { type: 'task'; editId?: string | null; section?: string | null }
  | { type: 'event'; key?: string; date?: string; editId?: string | null }
  | { type: string; [k: string]: unknown };

export const sheets = createStore<{ sheet: SheetSpec | null }>({ sheet: null });
export const openSheet = (sheet: SheetSpec) => sheets.set({ sheet });
export const closeSheet = () => sheets.set({ sheet: null });
export const useSheet = () => useStore(sheets, (s) => s.sheet);
