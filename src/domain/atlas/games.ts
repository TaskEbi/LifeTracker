/**
 * The Atlas's three mini-games. Pairs 対 (turn cards over to match a flag to its country, or a
 * country to its capital), Compass 羅 (which of two is further north, south, east or west) and
 * Fill the map 塗 (name every country of a continent from memory, and watch them fill in). They are
 * practice: they don't move the boxes, but they count for quests and pay Doubloons once a day.
 */
import { COUNTRIES, country, matchCapital, matchName, shuffle, type Rng } from './model';

export type GameId = 'pairs' | 'compass' | 'fill';
export const GAMES: { id: GameId; name: string; kanji: string; hint: string }[] = [
  { id: 'fill', name: 'Fill the map', kanji: '塗', hint: 'Name every country of a continent from memory and watch the map fill in' },
  { id: 'pairs', name: 'Pairs', kanji: '対', hint: 'Turn over cards to match flags to countries, or countries to capitals' },
  { id: 'compass', name: 'Compass', kanji: '羅', hint: 'Which is further north? Ten quick calls about where things are' },
];

// ── pairs ──

export type PairKind = 'flag-name' | 'name-cap' | 'flag-cap';
export const PAIR_KINDS: { id: PairKind; name: string }[] = [
  { id: 'flag-name', name: 'Flag ↔ country' },
  { id: 'name-cap', name: 'Country ↔ capital' },
  { id: 'flag-cap', name: 'Flag ↔ capital' },
];
export const isPairKind = (s: string): s is PairKind => PAIR_KINDS.some((k) => k.id === s);
export const PAIRS_N = 6;

export interface PairCard {
  key: string;
  id: string;
  face: 'flag' | 'name' | 'cap';
}

/** Six countries, each as two cards, shuffled. */
export function pairsBoard(ids: readonly string[], kind: PairKind, rng: Rng = Math.random): PairCard[] {
  const [a, b] = kind.split('-') as [PairCard['face'], PairCard['face']];
  const picked = shuffle(ids, rng).slice(0, PAIRS_N);
  return shuffle(
    picked.flatMap((id) => [
      { key: `${id}:a`, id, face: a },
      { key: `${id}:b`, id, face: b },
    ]),
    rng,
  );
}

/** 100 for a board cleared in six turns, less for each turn more and each five seconds; never under 10. */
export function pairsScore(turns: number, secs: number): number {
  return Math.max(10, Math.min(100, 100 - 4 * Math.max(0, turns - PAIRS_N) - Math.floor(secs / 5)));
}

// ── compass ──

export type Dir = 'north' | 'south' | 'east' | 'west';
export const DIRS: Dir[] = ['north', 'south', 'east', 'west'];
/** World-map points: x, y, ring, then the bounding box (x0, y0, x1, y1). */
export type Pts = Record<string, readonly number[]>;
export interface CompassQ {
  dir: Dir;
  a: string;
  b: string;
  /** The one further that way. */
  answer: string;
}
export const COMPASS_N = 10;
/** Countries that cross the date line, or sprawl too far to say which side they're on. */
const NO_EW = new Set(['ru', 'ki', 'fj', 'us', 'nz', 'ca', 'cl']);

/** True when one lies wholly further that way than the other, so there's no arguing. */
export function apart(pts: Pts, a: string, b: string, dir: Dir): boolean {
  const p = pts[a];
  const q = pts[b];
  if (!p || !q) return false;
  if (dir === 'north' || dir === 'south') return p[6] < q[4] || q[6] < p[4];
  if (NO_EW.has(a) || NO_EW.has(b)) return false;
  return p[5] < q[3] || q[5] < p[3];
}

/** Which of two is further that way (they must be apart). */
export function further(pts: Pts, a: string, b: string, dir: Dir): string {
  const [p, q] = [pts[a], pts[b]];
  if (dir === 'north') return p[1] < q[1] ? a : b;
  if (dir === 'south') return p[1] > q[1] ? a : b;
  if (dir === 'east') return p[0] > q[0] ? a : b;
  return p[0] < q[0] ? a : b;
}

/** Ten calls, getting closer: the first from anywhere, later ones near each other. */
export function compassRound(pts: Pts, rng: Rng = Math.random): CompassQ[] {
  const ids = COUNTRIES.map((c) => c.id).filter((id) => pts[id]);
  const out: CompassQ[] = [];
  const used = new Set<string>();
  let guard = 0;
  while (out.length < COMPASS_N && guard++ < 2000) {
    const dir = DIRS[Math.floor(rng() * DIRS.length)];
    const a = ids[Math.floor(rng() * ids.length)];
    if (used.has(a)) continue;
    const close = out.length >= 3;
    const pool = close ? [...country(a).near, ...COUNTRIES.filter((c) => c.sub === country(a).sub).map((c) => c.id)] : ids;
    const b = shuffle(pool, rng).find((x) => x !== a && !used.has(x) && apart(pts, a, x, dir));
    if (!b) continue;
    used.add(a);
    used.add(b);
    const [l, r] = rng() < 0.5 ? [a, b] : [b, a];
    out.push({ dir, a: l, b: r, answer: further(pts, a, b, dir) });
  }
  return out;
}

// ── fill the map ──

export type FillMode = 'name' | 'cap';
/** The country a typed word names, among those not yet found: only an exact name (or other name), so it can be checked as you type. */
export function fillMatch(text: string, left: readonly string[], mode: FillMode): string | null {
  for (const id of left) if ((mode === 'cap' ? matchCapital(text, id) : matchName(text, id)) === 1) return id;
  return null;
}

// ── pay ──

/** What a day at each game pays (once a day): from the best score, and a bonus for a whole map filled. */
export function gamePay(game: string, rec: { best: number; full?: number }): number {
  const best = rec.best;
  if (best <= 0) return 0;
  if (game === 'pairs') return Math.floor(best / 4);
  if (game === 'compass') return best * 2 + (best >= COMPASS_N ? 10 : 0);
  if (game === 'fill') return Math.min(40, Math.floor(best / 2)) + (rec.full ? 20 : 0);
  return 0;
}
