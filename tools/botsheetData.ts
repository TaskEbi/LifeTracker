import { CHASSIS } from '../src/domain/game/catalog';
import { STAGES } from '../src/domain/progress/engine';

export { CHASSIS };
/** Colours of the forms, by lowercased name with spaces removed. */
export const STAGE_COLOURS: Record<string, { c: string; c2: string }> = Object.fromEntries(STAGES.map((s) => [s.name.toLowerCase().replace(/ /g, ''), { c: s.c, c2: s.c2 }]));
