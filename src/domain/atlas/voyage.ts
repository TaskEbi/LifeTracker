/**
 * Voyages 航: a route of ports from one country to the next nearest, a question at each. A right
 * answer trades at the port; a wrong one is a storm that costs the hull a plank. Lose the hull and
 * the voyage ends where it is. What a voyage pays is worked out from its row.
 */
import { CONTS, COUNTRIES, country, diff, QTYPES, shuffle, typesFor, type Cont, type Diff, type QType, type Rng, type Skill } from './model';

export interface Leg {
  id: string;
  name: string;
  kanji: string;
  ports: number;
}
export const LEGS: Leg[] = [
  { id: 'coastal', name: 'Coastal', kanji: '岸', ports: 6 },
  { id: 'crossing', name: 'Crossing', kanji: '渡', ports: 12 },
  { id: 'grand', name: 'Grand tour', kanji: '巡', ports: 20 },
];
export const leg = (id: string) => LEGS.find((l) => l.id === id) ?? LEGS[0];

export type Focus = Skill | 'mix';
export const FOCI: { id: Focus; name: string }[] = [
  { id: 'mix', name: 'A bit of everything' },
  { id: 'flag', name: 'Flags' },
  { id: 'map', name: 'Map' },
  { id: 'cap', name: 'Capitals' },
];
export const isFocus = (s: string): s is Focus => FOCI.some((f) => f.id === s);

/**
 * A route of n ports: each next port is one of the nearest countries to the port before (or, when
 * those are all visited, to any port so far), so the voyage wanders across a part of the world.
 */
export function route(n: number, from: Cont | 'world', rng: Rng = Math.random): string[] {
  const pool = from === 'world' ? COUNTRIES : COUNTRIES.filter((c) => c.cont === from);
  const out = [pool[Math.floor(rng() * pool.length)].id];
  const seen = new Set(out);
  while (out.length < Math.min(n, COUNTRIES.length)) {
    const last = out[out.length - 1];
    let next = shuffle(country(last).near, rng).find((id) => !seen.has(id));
    if (!next) {
      // back along the way for somewhere not yet visited
      for (let i = out.length - 2; i >= 0 && !next; i--) next = shuffle(country(out[i]).near, rng).find((id) => !seen.has(id));
    }
    if (!next) {
      const rest = COUNTRIES.filter((c) => c.cont === country(last).cont && !seen.has(c.id));
      next = (rest.length ? rest : COUNTRIES.filter((c) => !seen.has(c.id)))[0]?.id;
    }
    if (!next) break;
    out.push(next);
    seen.add(next);
  }
  return out;
}

/** The kind of question asked at a port. */
export function portType(id: string, focus: Focus, rng: Rng = Math.random): QType {
  const pool = typesFor(id).filter((t) => focus === 'mix' || QTYPES.find((q) => q.id === t)!.skills.includes(focus));
  return pool[Math.floor(rng() * pool.length)];
}

export interface VoyageRow {
  date: string;
  /** When it set sail (ISO), so the day's first three can be told apart. */
  at: string;
  legs: number;
  route: string[];
  diff: Diff;
  focus: Focus;
  ship: string;
  hull: number;
  /** Ports passed so far (traded or stormed). */
  i: number;
  /** Ports traded at (right answers). */
  ok: number;
  /** Per port passed: true traded, false a storm. */
  log: boolean[];
  /** Brought home: every port passed with the hull whole. */
  done: boolean;
  sunk: boolean;
}

export const PORT_PAY = 4;
export const HOME_PAY = 3;
/** Only the first voyages set out each day pay. */
export const VOYAGES_A_DAY = 3;
export const DIFF_PAY: Record<Diff, number> = { easy: 1, normal: 1.5, hard: 2, expert: 3 };

/** Doubloons for one voyage: each port traded at, and a chest for bringing it home, more for a better ship. */
export function voyagePay(v: Pick<VoyageRow, 'ok' | 'legs' | 'done' | 'diff'>, bonus: number): { ports: number; home: number } {
  const m = DIFF_PAY[v.diff] ?? 1;
  const ports = Math.round(v.ok * PORT_PAY * m * (1 + bonus));
  const home = v.done ? Math.round(v.legs * HOME_PAY * m * (1 + bonus)) : 0;
  return { ports, home };
}

export const voyageOver = (v: Pick<VoyageRow, 'done' | 'sunk'>) => v.done || v.sunk;
export const diffName = (d: Diff) => diff(d).name;
export const startName = (from: string) => (from === 'world' ? 'Anywhere' : (CONTS.find((c) => c.id === from)?.name ?? 'Anywhere'));
