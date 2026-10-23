/**
 * Chess.com's public API (no login, read-only): ratings by time control and recent games. Nothing is stored in the
 * database unless I choose to log a day's games as a session.
 */
import { createStore } from '../../lib/createStore';

export const TIME_CLASSES = ['rapid', 'blitz', 'bullet', 'daily'] as const;
export type TimeClass = (typeof TIME_CLASSES)[number];

export interface Rating {
  tc: TimeClass;
  rating: number;
  best: number | null;
  win: number;
  loss: number;
  draw: number;
}
export interface Stats {
  ratings: Rating[];
  tactics: number | null;
  rush: number | null;
}

export interface Game {
  url: string;
  end: number;
  tc: TimeClass | 'other';
  timeControl: string;
  rated: boolean;
  white: boolean;
  opponent: string;
  opponentRating: number;
  rating: number;
  result: 'win' | 'loss' | 'draw';
  /** Seconds between the PGN's start and end, for live games only. */
  seconds: number | null;
  opening: string | null;
}

const DRAWS = new Set(['agreed', 'repetition', 'stalemate', 'insufficient', '50move', 'timevsinsufficient']);

export function parseStats(j: Record<string, unknown>): Stats {
  const ratings: Rating[] = [];
  for (const tc of TIME_CLASSES) {
    const s = j[`chess_${tc}`] as { last?: { rating?: number }; best?: { rating?: number }; record?: { win?: number; loss?: number; draw?: number } } | undefined;
    if (!s?.last?.rating) continue;
    ratings.push({ tc, rating: s.last.rating, best: s.best?.rating ?? null, win: s.record?.win ?? 0, loss: s.record?.loss ?? 0, draw: s.record?.draw ?? 0 });
  }
  const tactics = (j.tactics as { highest?: { rating?: number } } | undefined)?.highest?.rating ?? null;
  const rush = (j.puzzle_rush as { best?: { score?: number } } | undefined)?.best?.score ?? null;
  return { ratings, tactics, rush };
}

const tag = (pgn: string, name: string) => pgn.match(new RegExp(`\\[${name} "([^"]*)"\\]`))?.[1] ?? null;

function pgnSeconds(pgn: string): number | null {
  const d0 = tag(pgn, 'UTCDate') ?? tag(pgn, 'Date');
  const t0 = tag(pgn, 'StartTime');
  const d1 = tag(pgn, 'EndDate');
  const t1 = tag(pgn, 'EndTime');
  if (!d0 || !t0 || !d1 || !t1) return null;
  const at = (d: string, t: string) => Date.parse(`${d.replace(/\./g, '-')}T${t}Z`);
  const s = (at(d1, t1) - at(d0, t0)) / 1000;
  return Number.isFinite(s) && s >= 0 && s < 4 * 3600 ? s : null;
}

interface RawSide {
  username?: string;
  rating?: number;
  result?: string;
}
export function parseGame(g: Record<string, unknown>, username: string): Game | null {
  const w = g.white as RawSide | undefined;
  const b = g.black as RawSide | undefined;
  if (!w || !b || g.rules !== 'chess') return null;
  const white = w.username?.toLowerCase() === username.toLowerCase();
  if (!white && b.username?.toLowerCase() !== username.toLowerCase()) return null;
  const me = white ? w : b;
  const them = white ? b : w;
  const r = me.result ?? '';
  const tc = (TIME_CLASSES as readonly string[]).includes(g.time_class as string) ? (g.time_class as TimeClass) : 'other';
  const pgn = typeof g.pgn === 'string' ? g.pgn : '';
  const eco = typeof g.eco === 'string' ? decodeURIComponent(g.eco.split('/').pop() ?? '').replace(/-/g, ' ').replace(/(\s+|\.{3})\d+\..*$/, '') : null;
  return {
    url: String(g.url ?? ''),
    end: Number(g.end_time ?? 0),
    tc,
    timeControl: String(g.time_control ?? ''),
    rated: !!g.rated,
    white,
    opponent: them.username ?? '?',
    opponentRating: them.rating ?? 0,
    rating: me.rating ?? 0,
    result: r === 'win' ? 'win' : DRAWS.has(r) ? 'draw' : 'loss',
    seconds: tc === 'daily' ? null : pgnSeconds(pgn),
    opening: eco || null,
  };
}

/** Time spent on live games per day (from the games' own start/end times), by a day function. */
export function timeByDay(games: Game[], dayOf: (iso: string) => string): Map<string, { seconds: number; games: number }> {
  const out = new Map<string, { seconds: number; games: number }>();
  for (const g of games) {
    if (g.seconds == null) continue;
    const d = dayOf(new Date(g.end * 1000).toISOString());
    const v = out.get(d) ?? { seconds: 0, games: 0 };
    out.set(d, { seconds: v.seconds + g.seconds, games: v.games + 1 });
  }
  return out;
}

// ─── fetching ───────────────────────────────────────────────────────────────

export type ChessState =
  | { status: 'idle' }
  | { status: 'loading'; username: string }
  | { status: 'error'; username: string; message: string }
  | { status: 'ok'; username: string; stats: Stats; games: Game[]; fetchedAt: number };

export const chess = createStore<{ s: ChessState }>({ s: { status: 'idle' } });

const BASE = 'https://api.chess.com/pub/player/';

async function getJson(url: string): Promise<Record<string, unknown>> {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (res.status === 404) throw new Error('No Chess.com player with that username.');
  if (res.status === 429) throw new Error('Chess.com asked to slow down. Try again in a minute.');
  if (!res.ok) throw new Error(`Chess.com answered ${res.status}.`);
  return (await res.json()) as Record<string, unknown>;
}

/** Load stats and the two latest monthly archives. Keeps the last good result if called again for the same user. */
export async function loadChess(username: string, force = false) {
  const cur = chess.get().s;
  const u = username.trim().toLowerCase();
  if (!u) return;
  if (!force && (cur.status === 'loading' || (cur.status === 'ok' && cur.username === u && Date.now() - cur.fetchedAt < 10 * 60_000))) return;
  chess.set({ s: { status: 'loading', username: u } });
  try {
    const name = encodeURIComponent(u);
    const [stats, archives] = await Promise.all([getJson(`${BASE}${name}/stats`), getJson(`${BASE}${name}/games/archives`)]);
    const months = (Array.isArray(archives.archives) ? (archives.archives as string[]) : []).filter((a) => a.startsWith(BASE)).slice(-2);
    const lists = await Promise.all(months.map((m) => getJson(m)));
    const games = lists
      .flatMap((l) => (Array.isArray(l.games) ? (l.games as Record<string, unknown>[]) : []))
      .map((g) => parseGame(g, u))
      .filter((g): g is Game => !!g)
      .sort((a, b) => b.end - a.end);
    chess.set({ s: { status: 'ok', username: u, stats: parseStats(stats), games, fetchedAt: Date.now() } });
  } catch (e) {
    const message = e instanceof TypeError ? "Couldn't reach Chess.com (offline?)." : e instanceof Error ? e.message : 'Something went wrong.';
    chess.set({ s: { status: 'error', username: u, message } });
  }
}
