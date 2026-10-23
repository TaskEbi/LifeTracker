/** Features register their sheets here, so the shell can render any of them without importing every feature. */
import type { ComponentType } from 'react';
import type { SheetSpec } from './sheets';

export const sheetRegistry = new Map<string, ComponentType<{ spec: SheetSpec }>>();
export function registerSheet(type: string, component: ComponentType<{ spec: SheetSpec }>) {
  sheetRegistry.set(type, component);
}
