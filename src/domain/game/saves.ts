/**
 * The Works and the Aura Dial each keep one save row that every device rewrites as it plays. Their
 * times can't say which copy is ahead: a device that has just been opened settles its time away and
 * stamps "now" on whatever it had, however old. So when two copies meet, the one that has made more
 * wins: bolts ever made for the factory, rolls ever made for the dial. Both only grow, and an old
 * copy catching up on time away earns at its own (slower) rate, up to the away cap.
 *
 * Reads the raw row data, so the sync layer can use it without loading the games.
 */

const PROGRESS_FIELD: Record<string, string> = { gm_idle: 'life', gm_aura: 'rolls' };

/** How far a save has come, or null if this kind of row isn't a game save. */
export function saveProgress(kind: string, data: unknown): number | null {
  const field = PROGRESS_FIELD[kind];
  if (!field) return null;
  const v = data && typeof data === 'object' ? (data as Record<string, unknown>)[field] : undefined;
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0;
}

/** Which copy of a save to keep: 'local', 'remote', or null when it isn't a game save or they're level. */
export function pickSave(kind: string, local: unknown, remote: unknown): 'local' | 'remote' | null {
  const a = saveProgress(kind, local);
  const b = saveProgress(kind, remote);
  if (a === null || b === null || a === b) return null;
  return a > b ? 'local' : 'remote';
}
