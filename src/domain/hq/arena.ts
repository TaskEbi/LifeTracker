/**
 * 闘技場, the arena: when everything feels equally urgent, make tasks fight. Two at a time, you pick
 * the one that matters more, and a binary insertion sort turns those few choices into a full ranking
 * (about n·log n questions, so twelve tasks take around thirty taps at worst).
 */

export interface Bout<T> {
  sorted: T[];
  rest: T[];
  lo: number;
  hi: number;
}

export function startBout<T>(items: T[]): Bout<T> {
  const [first, ...rest] = items;
  return { sorted: first === undefined ? [] : [first], rest, lo: 0, hi: first === undefined ? 0 : 1 };
}

export const isFinished = <T,>(b: Bout<T>) => b.rest.length === 0;

/** The two to compare now: the newcomer and the one it's up against. */
export function currentPair<T>(b: Bout<T>): [T, T] | null {
  if (isFinished(b)) return null;
  return [b.rest[0], b.sorted[Math.floor((b.lo + b.hi) / 2)]];
}

/** The newcomer won (it matters more) or lost. Returns the next state. */
export function answerBout<T>(b: Bout<T>, newcomerWins: boolean): Bout<T> {
  if (isFinished(b)) return b;
  const mid = Math.floor((b.lo + b.hi) / 2);
  const lo = newcomerWins ? b.lo : mid + 1;
  const hi = newcomerWins ? mid : b.hi;
  if (lo < hi) return { ...b, lo, hi };
  const sorted = [...b.sorted.slice(0, lo), b.rest[0], ...b.sorted.slice(lo)];
  return { sorted, rest: b.rest.slice(1), lo: 0, hi: sorted.length };
}

/** At most this many questions for n items. */
export const maxQuestions = (n: number) => {
  let total = 0;
  for (let i = 1; i < n; i++) total += Math.ceil(Math.log2(i + 1));
  return total;
};
