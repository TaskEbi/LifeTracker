/**
 * The Arcade's bridge to the records (domain/game/arcade.ts). Dice, casts and bingo marks are
 * derived; a roll, a cast or a claim is one `gm_tx` row. Rolls and casts take their row id from their
 * number, so the same roll on two devices is the same row.
 */
import { useMemo } from 'react';
import { pairId } from '../../data/logActions';
import { data } from '../../data/store';
import { toast } from '../../data/ui';
import {
  arcadeOf,
  biteFor,
  BOOK_PRIZES,
  bookRef,
  bingoPrize,
  bingoRef,
  bingoState,
  castRef,
  catchPay,
  ESCAPE_PAY,
  parseCastRef,
  parseRollRef,
  rollDie,
  rollRef,
  type ArcadeState,
  type Bite,
  type BingoState,
  type PondContext,
  type Roll,
} from '../../domain/game/arcade';
import type { Bag } from '../../domain/game/catalog';
import type { Tx } from '../../domain/game/wallet';
import { claimOnce, getGame, ltHour, recentSections, useGame, write, type GameState } from './store';

const memo = new WeakMap<GameState, ArcadeState>();

export function arcadeFor(g: GameState): ArcadeState {
  let a = memo.get(g);
  if (!a) memo.set(g, (a = arcadeOf(g.earnInput)));
  return a;
}

export function useArcade(): ArcadeState {
  const g = useGame();
  return useMemo(() => arcadeFor(g), [g]);
}

export const getArcade = () => arcadeFor(getGame());

const topN = (txs: Tx[], type: 'roll' | 'cast') =>
  txs.reduce((n, t) => {
    if (t.type !== type) return n;
    const p = type === 'roll' ? parseRollRef(t.ref) : parseCastRef(t.ref);
    return Math.max(n, p?.n ?? 0);
  }, 0);

const live = (id: string) => {
  const r = data.get().lt_records.get(id);
  return !!r && !r.deleted_at;
};

// ─── bingo ──────────────────────────────────────────────────────────────────

/** Claim one line (or the full card). Returns what it paid. */
export function claimBingo(s: BingoState, line: number | 'full'): Bag | null {
  // Read the card again from the records: never pay for a line that isn't there.
  const fresh = bingoState(s.card.monday, getGame().earnInput);
  if (!fresh.toClaim.includes(line)) return null;
  const gain = bingoPrize(fresh, line);
  return claimOnce(bingoRef(s.card.monday, line), gain) ? gain : null;
}

export function claimAllBingo(s: BingoState): Bag[] {
  const out: Bag[] = [];
  for (const line of s.toClaim) {
    const g = claimBingo(s, line);
    if (g) out.push(g);
  }
  return out;
}

// ─── sugoroku ───────────────────────────────────────────────────────────────

export function rollOnce(): Roll | null {
  const g = getGame();
  const a = arcadeFor(g);
  if (a.dice.now < 1) {
    toast('No dice left. Log something to earn more.');
    return null;
  }
  const n = topN(g.txs, 'roll') + 1;
  const id = pairId('gm', `board:${n}`);
  if (live(id)) return null;
  const mats = recentSections(g);
  const roll = rollDie(n, a.board.pos, a.board.lap, mats.length ? mats : ['cabinet']);
  write({ type: 'roll', ref: rollRef(roll), cost: {}, gain: roll.gain }, id);
  return roll;
}

// ─── the pond ───────────────────────────────────────────────────────────────

export function pondContext(a: ArcadeState): PondContext {
  return { hour: ltHour(), month: Number(a.today.slice(5, 7)), sections: [...(a.stats.get(a.today)?.sections ?? [])] };
}

/** What's on the line for the next cast (nothing is written until it's landed or lost). */
export function nextBite(): Bite | null {
  const g = getGame();
  const a = arcadeFor(g);
  if (a.casts.now < 1) {
    toast('No casts left. Log some time to earn more.');
    return null;
  }
  return biteFor(topN(g.txs, 'cast') + 1, pondContext(a));
}

/** Land it (or lose it): one row either way. */
export function endCast(b: Bite, landed: boolean, perfect: boolean): Bag | null {
  const g = getGame();
  const id = pairId('gm', `cast:${b.n}`);
  if (live(id)) return null;
  const first = landed && !arcadeFor(g).pond.book.has(b.fish.id);
  const gain = landed ? catchPay(b.fish, b.cm, perfect, first) : ESCAPE_PAY;
  write({ type: 'cast', ref: castRef(b.n, landed ? b.fish.id : null, landed ? b.cm : 0, perfect), cost: {}, gain }, id);
  return gain;
}

export function claimBook(at: number): Bag | null {
  const a = getArcade();
  if (!a.bookToClaim.includes(at)) return null;
  const p = BOOK_PRIZES.find((x) => x.at === at)!;
  const gain: Bag = p.title ? { ...p.gain, items: [`title:${p.title}`] } : p.gain;
  return claimOnce(bookRef(at), gain) ? gain : null;
}

/** One line for Home: what's waiting in the Arcade. */
export const arcadeLine = (a: ArcadeState) => {
  const bits: string[] = [];
  if (a.dice.now) bits.push(`${a.dice.now} ${a.dice.now === 1 ? 'die' : 'dice'}`);
  if (a.casts.now) bits.push(`${a.casts.now} cast${a.casts.now === 1 ? '' : 's'}`);
  const claims = a.bingo.toClaim.length + (a.lastBingo?.toClaim.length ?? 0);
  if (claims) bits.push(`bingo ×${claims}`);
  return bits.length ? bits.join(' · ') : `Bingo ${a.bingo.progress.filter((p) => p.marked).length}/16`;
};
