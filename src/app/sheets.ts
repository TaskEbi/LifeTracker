/** Which sheet is open. Features open their own; the shell renders whichever is current. */
import { createStore, useStore } from '../lib/createStore';

/** A sheet type plus whatever it needs (editId, a preset…). Each sheet reads its own fields. */
export type SheetSpec = { type: string; [k: string]: unknown };

export const sheets = createStore<{ sheet: SheetSpec | null }>({ sheet: null });
export const openSheet = (sheet: SheetSpec) => sheets.set({ sheet });
export const closeSheet = () => sheets.set({ sheet: null });
export const useSheet = () => useStore(sheets, (s) => s.sheet);
