/**
 * 天秤, the scales: for a decision too big to feel your way through. Options scored on criteria you
 * weight yourself. The interesting part isn't the winner but what would flip it, and how you feel
 * when you see the answer. Rows are lt_records (`hq_scale`).
 */
import type { LtRecord } from '../../data/types';

export interface Criterion {
  id: string;
  name: string;
  /** 1 (a bit) to 5 (everything). */
  weight: number;
}
export interface Decision {
  id: string;
  title: string;
  options: string[];
  criteria: Criterion[];
  /** scores[option][criterion id] from 0 to 10; missing counts as 5. */
  scores: Record<string, Record<string, number>>;
  /** What you decided in the end. */
  chose: string | null;
}

export function decisionOf(r: LtRecord): Decision | null {
  if (r.deleted_at || r.kind !== 'hq_scale') return null;
  const d = r.data;
  if (typeof d.title !== 'string') return null;
  return {
    id: r.id,
    title: d.title,
    options: Array.isArray(d.options) ? (d.options as string[]) : [],
    criteria: Array.isArray(d.criteria) ? (d.criteria as Criterion[]) : [],
    scores: d.scores && typeof d.scores === 'object' ? (d.scores as Decision['scores']) : {},
    chose: typeof d.chose === 'string' ? d.chose : null,
  };
}

const scoreOf = (d: Decision, option: string, c: Criterion) => d.scores[option]?.[c.id] ?? 5;

export interface Ranked {
  option: string;
  /** 0–100. */
  score: number;
}

export function rankOptions(d: Pick<Decision, 'options' | 'criteria' | 'scores'>): Ranked[] {
  const total = d.criteria.reduce((n, c) => n + c.weight, 0);
  return d.options
    .map((option) => ({
      option,
      score: total ? d.criteria.reduce((n, c) => n + scoreOf(d as Decision, option, c) * c.weight, 0) / total * 10 : 0,
    }))
    .sort((a, b) => b.score - a.score || a.option.localeCompare(b.option));
}

export interface Flip {
  criterion: string;
  /** The weight (1–5) at which the runner-up takes over. */
  weight: number;
}

/** What changes the answer: criteria whose weight, somewhere in 1–5, would put the runner-up first. */
export function flipPoints(d: Pick<Decision, 'options' | 'criteria' | 'scores'>): Flip[] {
  const ranked = rankOptions(d);
  if (ranked.length < 2) return [];
  const [top, second] = ranked;
  const out: Flip[] = [];
  for (const c of d.criteria) {
    for (const w of [1, 2, 3, 4, 5]) {
      if (w === c.weight) continue;
      const trial = { ...d, criteria: d.criteria.map((x) => (x.id === c.id ? { ...x, weight: w } : x)) };
      const best = rankOptions(trial);
      if (best[0].option === second.option && best[0].score > (best.find((b) => b.option === top.option)?.score ?? 0)) {
        out.push({ criterion: c.name, weight: w });
        break;
      }
    }
  }
  return out;
}

/** How close it is: under 5 points is a coin toss, whatever the numbers look like. */
export const isClose = (ranked: Ranked[]) => ranked.length >= 2 && ranked[0].score - ranked[1].score < 5;

export const UNI_CRITERIA = ['Course content', 'Music alongside', 'City and life', 'Cost and funding', 'My chance of getting in', 'Where it leads'];
