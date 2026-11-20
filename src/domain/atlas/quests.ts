/**
 * Three quests a day, the same on every device: one about answers, one about a way of playing,
 * one about a mini-game. Whether a quest is done is read from the day's row, so it is never
 * stored. The pool and the way a day picks from it must not change: past days' pay depends on it.
 */
import { CONTS, seeded, shuffle } from './model';

/** What a day's row says, as quests read it. */
export interface DayTally {
  ok: number;
  best: number;
  daily: boolean;
  /** Right answers by skill, continent, typed and review. */
  by: Record<string, number>;
  /** Sittings finished, by kind. */
  games: Record<string, { n: number; best: number }>;
}

export interface Quest {
  id: string;
  kanji: string;
  text: string;
  target: number;
  pay: number;
  /** How far today's row has got. */
  of: (t: DayTally) => number;
}

const by = (k: string) => (t: DayTally) => t.by[k] ?? 0;
const plays = (k: string) => (t: DayTally) => t.games[k]?.n ?? 0;

const ANSWERS: Quest[] = [
  ...CONTS.map((c) => ({ id: `cont-${c.id}`, kanji: c.kanji, text: `Get 12 right in ${c.name}`, target: 12, pay: 30, of: by(c.id) })),
  { id: 'flag', kanji: '旗', text: 'Get 15 flags right', target: 15, pay: 25, of: by('flag') },
  { id: 'map', kanji: '図', text: 'Get 10 places on the map right', target: 10, pay: 25, of: by('map') },
  { id: 'cap', kanji: '都', text: 'Get 10 capitals right', target: 10, pay: 25, of: by('cap') },
  { id: 'typed', kanji: '書', text: 'Type 5 right answers on Expert', target: 5, pay: 40, of: by('typed') },
  { id: 'run', kanji: '連', text: 'Get 12 right in a row', target: 12, pay: 30, of: (t) => t.best },
  { id: 'review', kanji: '復', text: 'Get 15 review cards right', target: 15, pay: 30, of: by('review') },
];
const MODES: Quest[] = [
  { id: 'daily', kanji: '日', text: 'Finish the daily challenge', target: 1, pay: 20, of: (t) => (t.daily ? 1 : 0) },
  { id: 'round', kanji: '周', text: 'Finish a round', target: 1, pay: 25, of: plays('round') },
  { id: 'sprint', kanji: '速', text: 'Finish a sprint', target: 1, pay: 20, of: plays('sprint') },
  { id: 'survival', kanji: '命', text: 'Finish a survival run', target: 1, pay: 20, of: plays('survival') },
  { id: 'voyage', kanji: '航', text: 'Bring a voyage home', target: 1, pay: 40, of: plays('voyage') },
];
const GAMES: Quest[] = [
  { id: 'pairs', kanji: '対', text: 'Clear a board of Pairs', target: 1, pay: 20, of: plays('pairs') },
  { id: 'compass', kanji: '羅', text: 'Score 7 or more at Compass', target: 7, pay: 25, of: (t) => t.games.compass?.best ?? 0 },
  { id: 'fill', kanji: '塗', text: 'Name 20 countries in Fill the map', target: 20, pay: 30, of: (t) => t.games.fill?.best ?? 0 },
];
export const QUEST_POOL = [...ANSWERS, ...MODES, ...GAMES];

/** All three done pays this on top. */
export const QUEST_SET_PAY = 25;

export function questsFor(date: string): Quest[] {
  const rng = seeded(`atlas-quests:${date}`);
  return [shuffle(ANSWERS, rng)[0], shuffle(MODES, rng)[0], shuffle(GAMES, rng)[0]];
}

export const EMPTY_TALLY: DayTally = { ok: 0, best: 0, daily: false, by: {}, games: {} };
