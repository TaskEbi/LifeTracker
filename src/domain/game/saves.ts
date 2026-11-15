/**
 * The Works and the Aura Dial each keep one save row that every device rewrites as it plays. Two
 * copies that differ are merged, never picked between: everything either copy has reached is kept
 * (auras found, upgrade levels, milestones, lifetime counts), and the running state (what's on the
 * floor, the motes in hand, the queue) comes from the copy that has made more. Times can't decide
 * it: a device that has just been opened settles its time away and stamps "now" on an old save.
 *
 * Merging is idempotent and only ever adds, so two devices meeting settle on the same save.
 */
import { normalise, type IdleSave } from './idle';
import { normaliseAura, type AuraSave } from './aura';

/** Reading a save to merge it must not clamp its time to this device's clock. */
export const NO_CLAMP = Number.MAX_SAFE_INTEGER;

const maxRec = (a: Record<string, number>, b: Record<string, number>) => {
  const out = { ...a };
  for (const [k, n] of Object.entries(b)) out[k] = Math.max(out[k] ?? 0, n);
  return out;
};
const union = (a: string[], b: string[]) => [...new Set([...a, ...b])];

export function mergeIdle(x: IdleSave, y: IdleSave): IdleSave {
  const [p, o] = x.life > y.life || (x.life === y.life && x.at >= y.at) ? [x, y] : [y, x];
  // The machines and upgrades of the same run can be pooled; after a rebuild they belong to that run.
  const sameRun = p.rebuilds === o.rebuilds;
  const later = p.catDay >= o.catDay ? p : o;
  return {
    ...p,
    at: Math.max(p.at, o.at),
    life: Math.max(p.life, o.life),
    taps: Math.max(p.taps, o.taps),
    crits: Math.max(p.crits, o.crits),
    gens: sameRun ? maxRec(p.gens, o.gens) : p.gens,
    ups: sameRun ? union(p.ups, o.ups) : p.ups,
    perks: maxRec(p.perks, o.perks),
    printsAll: Math.max(p.printsAll, o.printsAll),
    rebuilds: Math.max(p.rebuilds, o.rebuilds),
    cats: Math.max(p.cats, o.cats),
    done: union(p.done, o.done),
    cogs: Math.max(p.cogs, o.cogs),
    catDay: later.catDay,
    catCogs: later.catCogs,
    crate: p.crate >= o.crate ? p.crate : o.crate,
    best: Math.max(p.best, o.best),
    hot: p.hot || o.hot,
  };
}

export function mergeAura(x: AuraSave, y: AuraSave): AuraSave {
  const [p, o] = x.rolls > y.rolls || (x.rolls === y.rolls && x.at >= y.at) ? [x, y] : [y, x];
  const got = maxRec(p.got, o.got);
  const first = { ...o.first, ...p.first };
  for (const [k, d] of Object.entries(o.first)) if (!first[k] || d < first[k]) first[k] = d;
  // A scene still to watch on the other copy, for an aura this one hadn't rolled yet.
  const queue = [...p.queue, ...o.queue.filter((id) => !p.got[id] && !p.queue.includes(id))];
  return {
    ...p,
    at: Math.max(p.at, o.at),
    motesAll: Math.max(p.motesAll, o.motesAll),
    rolls: Math.max(p.rolls, o.rolls),
    hand: Math.max(p.hand, o.hand),
    got,
    first,
    ups: maxRec(p.ups, o.ups),
    queue,
    fixes: union(p.fixes, o.fixes),
  };
}

/** Whether this kind of row is a game save that merges. */
export const isGameSave = (kind: string) => kind === 'gm_idle' || kind === 'gm_aura';

/** Two copies of a save, merged (as plain row data), or null if the row isn't a game save. */
export function mergeSave(kind: string, a: unknown, b: unknown): Record<string, unknown> | null {
  if (kind === 'gm_idle') return mergeIdle(normalise(a, NO_CLAMP), normalise(b, NO_CLAMP)) as unknown as Record<string, unknown>;
  if (kind === 'gm_aura') return mergeAura(normaliseAura(a, NO_CLAMP), normaliseAura(b, NO_CLAMP)) as unknown as Record<string, unknown>;
  return null;
}

/** Deep equality of plain JSON, ignoring key order (the server stores rows as jsonb, which reorders keys). */
export function sameData(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    const bb = b as unknown[];
    return a.length === bb.length && a.every((v, i) => sameData(v, bb[i]));
  }
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  return ka.length === kb.length && ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && sameData((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
}
