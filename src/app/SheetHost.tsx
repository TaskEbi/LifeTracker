import { sheetRegistry } from './sheetRegistry';
import { useSheet } from './sheets';

/** Renders whichever sheet is open. Keyed so a new sheet starts with fresh state. */
export function SheetHost() {
  const spec = useSheet();
  if (!spec) return null;
  const C = sheetRegistry.get(spec.type);
  return C ? <C key={JSON.stringify(spec)} spec={spec} /> : null;
}
