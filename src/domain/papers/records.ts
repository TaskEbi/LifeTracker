/**
 * Past papers: what you've done, kept as lt_records under the study section (no migration).
 * This file has no catalogue import, so the Study desk and Home can read progress without
 * loading the paper list.
 *
 * - `ppq_paper`: one row per paper (id from the paper id): done date, score, time, kept for a mock.
 * - `ppq_hard`: one row per hard question (id from its key): done, or wrong and due for a retry.
 * - `ppq_topic`: one row per topic booklet ticked off (id from its key).
 * - `ppq_mistake`: a mistake you want to retry, from any paper.
 */
import type { LtRecord } from '../../data/types';
import { addDays } from '../log/dates';

export const PAPER_KINDS = {
  paper: 'ppq_paper',
  hard: 'ppq_hard',
  topic: 'ppq_topic',
  mistake: 'ppq_mistake',
} as const;

export interface PaperMark {
  paper: string;
  /** The day it was done, or null if only kept for a mock. */
  done: string | null;
  score: number | null;
  outOf: number | null;
  minutes: number | null;
  mock: boolean;
  /** The Study mark this score also went into. */
  markId: string | null;
}

const str = (v: unknown) => (typeof v === 'string' && v ? v : null);
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

export function paperMarkOf(r: LtRecord): PaperMark | null {
  const d = r.data;
  const paper = str(d.paper);
  if (!paper) return null;
  const outOf = num(d.outOf);
  return {
    paper,
    done: str(d.done),
    score: num(d.score),
    outOf: outOf && outOf > 0 ? outOf : null,
    minutes: num(d.minutes),
    mock: d.mock === true,
    markId: str(d.markId),
  };
}

export const pctOf = (m: Pick<PaperMark, 'score' | 'outOf'>) => (m.score != null && m.outOf ? Math.round((m.score / m.outOf) * 100) : null);

/** Days between tries after getting something wrong: 2, then 7, then 21. Right on the last try clears it. */
export const RETRY_GAPS = [2, 7, 21] as const;

export interface Retry {
  /** 0 after the first miss; one more for each retry that still went wrong. */
  step: number;
  due: string;
}
export const firstRetry = (today: string): Retry => ({
  step: 0,
  due: addDays(today, RETRY_GAPS[0]),
});

/** After a retry: right moves it along the gaps (or clears it after the last), wrong starts again. */
export function afterRetry(r: Retry, right: boolean, today: string): Retry | null {
  if (!right) return firstRetry(today);
  const step = r.step + 1;
  return step >= RETRY_GAPS.length ? null : { step, due: addDays(today, RETRY_GAPS[step]) };
}

export interface HardMark {
  key: string;
  state: 'done' | 'wrong';
  date: string;
  retry: Retry | null;
}
export function hardMarkOf(r: LtRecord): HardMark | null {
  const d = r.data;
  const key = str(d.key);
  const date = str(d.date);
  if (!key || !date || (d.state !== 'done' && d.state !== 'wrong')) return null;
  const due = str(d.due);
  return {
    key,
    state: d.state,
    date,
    retry: d.state === 'wrong' && due ? { step: num(d.step) ?? 0, due } : null,
  };
}

export const MISTAKE_WHY = ['Didn’t know it', 'Misread the question', 'Method', 'Careless slip', 'Units or sig figs', 'Ran out of time'] as const;
export type MistakeWhy = (typeof MISTAKE_WHY)[number];

export interface Mistake {
  id: string;
  subject: string;
  /** Paper id from the catalogue, or free text such as "Mock, Nov". */
  paper: string;
  q: string;
  topic: string;
  why: MistakeWhy;
  note: string;
  date: string;
  retry: Retry | null;
  fixed: string | null;
}
export function mistakeOf(r: LtRecord): Mistake | null {
  const d = r.data;
  const subject = str(d.subject);
  const date = str(d.date);
  if (!subject || !date) return null;
  const why = (MISTAKE_WHY as readonly string[]).includes(d.why as string) ? (d.why as MistakeWhy) : 'Method';
  const due = str(d.due);
  const fixed = str(d.fixed);
  return {
    id: r.id,
    subject,
    paper: str(d.paper) ?? '',
    q: str(d.q) ?? '',
    topic: str(d.topic) ?? '',
    why,
    note: str(d.note) ?? '',
    date,
    retry: !fixed && due ? { step: num(d.step) ?? 0, due } : null,
    fixed,
  };
}

/** Things to try again: due first (oldest due first), then the rest by date. */
export function retryOrder<T extends { retry: Retry | null }>(items: T[], today: string): { due: T[]; later: T[] } {
  const live = items.filter((i) => i.retry).sort((a, b) => a.retry!.due.localeCompare(b.retry!.due));
  return {
    due: live.filter((i) => i.retry!.due <= today),
    later: live.filter((i) => i.retry!.due > today),
  };
}

/** How mistakes split by reason, biggest first. */
export function whyCounts(ms: Mistake[]): { why: MistakeWhy; n: number }[] {
  return MISTAKE_WHY.map((why) => ({
    why,
    n: ms.filter((m) => m.why === why).length,
  }))
    .filter((x) => x.n)
    .sort((a, b) => b.n - a.n);
}
