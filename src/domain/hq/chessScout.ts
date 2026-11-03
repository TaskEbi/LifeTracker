/**
 * The scout report: patterns in your own Chess.com games that the ratings page doesn't show. Which
 * openings actually score, which hours you play badly, and whether you tilt after a loss.
 */

export interface ScoutGame {
  end: number;
  white: boolean;
  rated: boolean;
  result: 'win' | 'loss' | 'draw';
  opening: string | null;
  tc: string;
}

export interface Score {
  n: number;
  win: number;
  draw: number;
  loss: number;
  /** Points per game, 0–100%. */
  pct: number;
}

function score(games: ScoutGame[]): Score {
  const win = games.filter((g) => g.result === 'win').length;
  const draw = games.filter((g) => g.result === 'draw').length;
  const n = games.length;
  return { n, win, draw, loss: n - win - draw, pct: n ? Math.round(((win + draw / 2) / n) * 100) : 0 };
}

export interface OpeningScore extends Score {
  name: string;
}
export interface HourBand extends Score {
  label: string;
}

export interface Scout {
  games: number;
  overall: Score;
  white: Score;
  black: Score;
  /** At least `MIN_OPENING` games, best score first. */
  openings: OpeningScore[];
  hours: HourBand[];
  /** Score in the game right after a loss / right after a win. */
  afterLoss: Score | null;
  afterWin: Score | null;
  tilt: 'none' | 'some' | 'yes' | null;
  /** Losses in a row, right now. */
  lossRun: number;
  /** Stop-loss: how far a session goes wrong. How often a session has 3+ losses in a row. */
  advice: string[];
}

export const MIN_OPENING = 3;
const BANDS = [
  { label: 'Morning', from: 5, to: 12 },
  { label: 'Afternoon', from: 12, to: 18 },
  { label: 'Evening', from: 18, to: 22 },
  { label: 'Late night', from: 22, to: 29 },
];

const shortOpening = (name: string) => name.split(/\s+(?:Variation|Line|Attack|Defense|Defence|Gambit|Game|Opening)\b/)[0] || name;

/** `hourOf` turns a unix time into the hour in your time zone. */
export function scout(all: ScoutGame[], hourOf: (unix: number) => number): Scout | null {
  const games = all.filter((g) => g.rated && g.tc !== 'daily').sort((a, b) => a.end - b.end);
  if (games.length < 5) return null;
  const byOpening = new Map<string, ScoutGame[]>();
  for (const g of games) {
    if (!g.opening) continue;
    const key = shortOpening(g.opening);
    byOpening.set(key, [...(byOpening.get(key) ?? []), g]);
  }
  const openings = [...byOpening].filter(([, list]) => list.length >= MIN_OPENING).map(([name, list]) => ({ name, ...score(list) })).sort((a, b) => b.pct - a.pct || b.n - a.n);
  const hours = BANDS.map((b) => ({
    label: b.label,
    ...score(games.filter((g) => {
      const h = hourOf(g.end);
      const v = h < 5 ? h + 24 : h;
      return v >= b.from && v < b.to;
    })),
  })).filter((b) => b.n > 0);

  // Only games in the same sitting count as "right after": within 30 minutes.
  const afterL: ScoutGame[] = [];
  const afterW: ScoutGame[] = [];
  for (let i = 1; i < games.length; i++) {
    const p = games[i - 1];
    if (games[i].end - p.end > 1800) continue;
    if (p.result === 'loss') afterL.push(games[i]);
    if (p.result === 'win') afterW.push(games[i]);
  }
  const afterLoss = afterL.length >= 5 ? score(afterL) : null;
  const afterWin = afterW.length >= 5 ? score(afterW) : null;
  const gap = afterLoss && afterWin ? afterWin.pct - afterLoss.pct : null;
  const tilt = gap == null ? null : gap >= 15 ? 'yes' : gap >= 7 ? 'some' : 'none';
  let lossRun = 0;
  for (let i = games.length - 1; i >= 0 && games[i].result === 'loss'; i--) lossRun++;

  const overall = score(games);
  const advice: string[] = [];
  if (lossRun >= 3) advice.push(`You’ve lost the last ${lossRun}. Stop for now: puzzles, or nothing.`);
  if (tilt === 'yes') advice.push(`You tilt. You score ${afterLoss!.pct}% right after a loss and ${afterWin!.pct}% after a win. Try a rule: two losses in a row ends the session.`);
  else if (tilt === 'some') advice.push(`A little tilt: ${afterLoss!.pct}% right after a loss, ${afterWin!.pct}% after a win.`);
  else if (tilt === 'none') advice.push(`No sign of tilt: ${afterLoss!.pct}% after a loss, ${afterWin!.pct}% after a win.`);
  const worstHour = hours.filter((b) => b.n >= 5).sort((a, b) => a.pct - b.pct)[0];
  if (worstHour && worstHour.pct <= overall.pct - 8) advice.push(`${worstHour.label} is your weak time: ${worstHour.pct}% against ${overall.pct}% overall (${worstHour.n} games).`);
  const worstOpening = [...openings].filter((o) => o.n >= 5).sort((a, b) => a.pct - b.pct)[0];
  if (worstOpening && worstOpening.pct <= overall.pct - 10) advice.push(`Look at the ${worstOpening.name}: ${worstOpening.pct}% from ${worstOpening.n} games.`);

  return { games: games.length, overall, white: score(games.filter((g) => g.white)), black: score(games.filter((g) => !g.white)), openings, hours, afterLoss, afterWin, tilt, lossRun, advice };
}
