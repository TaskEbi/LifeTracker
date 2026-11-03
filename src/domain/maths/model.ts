/**
 * Maths: contests, practice papers and a notebook of problems. A sitting is one paper, real or
 * practice, kept in lt_records; a problem keeps every attempt at it. Time spent is a Daily Log entry
 * like any section. XP is derived from these records, never stored.
 */
import type { LogEntry, LtRecord } from '../../data/types';
import { addDays } from '../log/dates';

// ─── the contests ───────────────────────────────────────────────────────────

export type ContestId = 'smc' | 'bmo1' | 'bmo2' | 'amc12' | 'aime' | 'usamo' | 'other';
/** How a paper's score is entered: a total, right and blank answers, or marks per problem. */
export type Scoring = 'total' | 'amc' | 'marks';

export interface ContestInfo {
  id: ContestId;
  name: string;
  org: string;
  scoring: Scoring;
  max: number;
  questions: number;
  minutes: number;
  format: string;
  /** What gets you in, in words: cut-offs change every year, so none is written down here. */
  entry: string;
  tips: string[];
}

export const CONTESTS: ContestInfo[] = [
  {
    id: 'smc',
    name: 'SMC',
    org: 'UKMT',
    scoring: 'total',
    max: 125,
    questions: 25,
    minutes: 90,
    format: '25 multiple-choice questions in 90 minutes, out of 125. No calculators.',
    entry: 'Through your school.',
    tips: ['3 minutes 36 seconds a question on average.', 'Results set who is entered for BMO1; the score needed changes every year.'],
  },
  {
    id: 'bmo1',
    name: 'BMO1',
    org: 'UKMT',
    scoring: 'marks',
    max: 60,
    questions: 6,
    minutes: 210,
    format: '6 problems in 3½ hours, 10 marks each. Full written solutions. No calculators.',
    entry: 'From your SMC score, or entered by a teacher.',
    tips: ['35 minutes a problem on average, but it rarely goes evenly.', 'Problem 1 is meant to be the most accessible, so settle in there.', 'The paper itself says a few finished solutions earn more than many unfinished ones.', 'Write it up as if for someone who hasn’t seen the problem: say what you’re proving, then prove it.'],
  },
  {
    id: 'bmo2',
    name: 'BMO2',
    org: 'UKMT',
    scoring: 'marks',
    max: 40,
    questions: 4,
    minutes: 210,
    format: '4 problems in 3½ hours, 10 marks each. Full written solutions. No calculators.',
    entry: 'Up to 100 invited from BMO1; others may be able to enter for a fee.',
    tips: ['Over 50 minutes a problem: there is time to try things and throw them away.', 'One complete solution is worth more than scattered ideas across all four.'],
  },
  {
    id: 'amc12',
    name: 'AMC 12',
    org: 'MAA',
    scoring: 'amc',
    max: 150,
    questions: 25,
    minutes: 75,
    format: '25 multiple-choice questions in 75 minutes. 6 for right, 1.5 for blank, 0 for wrong: out of 150. No calculators.',
    entry: 'Sit it at a registered centre. There are A and B dates; you can take both.',
    tips: ['3 minutes a question on average, and the later ones are harder.', 'The cut-off for the AIME is set after each sitting.'],
  },
  {
    id: 'aime',
    name: 'AIME',
    org: 'MAA',
    scoring: 'total',
    max: 15,
    questions: 15,
    minutes: 180,
    format: '15 questions in 3 hours, each answer a whole number from 0 to 999. No calculators.',
    entry: 'By invitation, from your AMC 10 or 12 score.',
    tips: ['12 minutes a question on average.', 'No penalty for a wrong answer: always write something.'],
  },
  {
    id: 'usamo',
    name: 'USAMO',
    org: 'MAA',
    scoring: 'marks',
    max: 42,
    questions: 6,
    minutes: 540,
    format: '6 proof problems over two days, 4½ hours a day, 7 marks each.',
    entry: 'By invitation from AMC and AIME scores. Check MAA’s eligibility rules: it depends on where you live and study.',
    tips: ['Each day has three problems, roughly in rising order.'],
  },
  { id: 'other', name: 'Other', org: '', scoring: 'total', max: 100, questions: 0, minutes: 90, format: '', entry: '', tips: [] },
];

export const contestInfo = (id: ContestId): ContestInfo => CONTESTS.find((c) => c.id === id) ?? CONTESTS[CONTESTS.length - 1];

const isContest = (v: unknown): v is ContestId => CONTESTS.some((c) => c.id === v);

/** The two ways up. Each rung opens the next. */
export const ROADS: { id: 'uk' | 'us'; name: string; rungs: ContestId[] }[] = [
  { id: 'uk', name: 'UKMT', rungs: ['smc', 'bmo1', 'bmo2'] },
  { id: 'us', name: 'MAA', rungs: ['amc12', 'aime', 'usamo'] },
];

/**
 * This season, one tap away on the first visit. The SMC date is UKMT's; the AMC 12B and BMO1 dates are
 * the ones the user gave, which beat the published ones: they sit them on the 14th and, at school, the 19th.
 */
export const SEASON_2026: { contest: ContestId; label: string; date: string; score?: number; note?: string }[] = [
  { contest: 'smc', label: 'SMC 2026', date: '2026-10-07', score: 112 },
  { contest: 'amc12', label: 'AMC 12B 2026', date: '2026-11-14' },
  { contest: 'bmo1', label: 'BMO1 2026', date: '2026-11-19', note: 'At school' },
];

// ─── scoring ────────────────────────────────────────────────────────────────

export const amcScore = (correct: number, blank: number) => correct * 6 + blank * 1.5;

/** What a guess is worth on the AMC with this many options left, against 1.5 for leaving it blank. */
export function amcGuess(optionsLeft: number): { worth: number; advice: 'guess' | 'blank' | 'either' } {
  const worth = 6 / optionsLeft;
  return { worth, advice: worth > 1.5 ? 'guess' : worth < 1.5 ? 'blank' : 'either' };
}

/** Questions right to reach a score on the AMC, leaving all the others blank. Null if out of reach. */
export function amcNeeded(target: number, questions = 25): number | null {
  const n = Math.max(0, Math.ceil((target - questions * 1.5) / 4.5));
  return n <= questions ? n : null;
}

const SECONDS = (minutes: number, questions: number) => Math.round((minutes * 60) / questions);
/** Average time a question, in words. */
export function pace(c: Pick<ContestInfo, 'minutes' | 'questions'>): string | null {
  if (!c.questions) return null;
  const s = SECONDS(c.minutes, c.questions);
  const m = Math.floor(s / 60);
  return s % 60 ? `${m} min ${s % 60} s` : `${m} min`;
}

// ─── sittings ───────────────────────────────────────────────────────────────

export interface Sitting {
  id: string;
  contest: ContestId;
  /** "AMC 12B 2026", "BMO1 2019". */
  label: string;
  /** Null until the date is known. */
  date: string | null;
  /** The real thing, or a practice paper. */
  real: boolean;
  score: number | null;
  max: number;
  correct: number | null;
  blank: number | null;
  /** Marks per problem; null where not marked yet. */
  marks: (number | null)[];
  award: string;
  note: string;
  minutes: number | null;
  /** The Daily Log entry for its time, if there is one. */
  entryId: string | null;
}

const str = (v: unknown) => (typeof v === 'string' ? v : '');
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const day = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);

export function sittingOf(r: LtRecord): Sitting | null {
  if (r.kind !== 'sitting' || r.deleted_at) return null;
  const d = r.data;
  const contest = isContest(d.contest) ? d.contest : 'other';
  const info = contestInfo(contest);
  return {
    id: r.id,
    contest,
    label: str(d.label) || info.name,
    date: day(d.date),
    real: d.real !== false,
    score: num(d.score),
    max: num(d.max) ?? info.max,
    correct: num(d.correct),
    blank: num(d.blank),
    marks: Array.isArray(d.marks) ? d.marks.map((m) => num(m)) : [],
    award: str(d.award),
    note: str(d.note),
    minutes: num(d.minutes),
    entryId: str(d.entryId) || null,
  };
}
export const sittingsOf = (records: LtRecord[]): Sitting[] => records.map(sittingOf).filter((s): s is Sitting => !!s);

export const percentOf = (s: Pick<Sitting, 'score' | 'max'>) => (s.score == null || !s.max ? null : Math.round((s.score / s.max) * 1000) / 10);

const byDate = (a: Sitting, b: Sitting) => (a.date ?? '9999').localeCompare(b.date ?? '9999');

/** Real contests still to come, soonest first; ones without a date last. */
export const upcoming = (list: Sitting[], today: string) => list.filter((s) => s.real && s.score == null && (s.date == null || s.date >= today)).sort(byDate);
/** Real contests that have happened and have no score yet. */
export const awaitingResult = (list: Sitting[], today: string) => list.filter((s) => s.real && s.score == null && s.date != null && s.date < today).sort(byDate);
/** Scored papers, newest first. */
export const results = (list: Sitting[]) => list.filter((s) => s.score != null).sort((a, b) => byDate(b, a));

export const daysUntil = (date: string, today: string) => Math.round((Date.parse(date) - Date.parse(today)) / 864e5);

/** Best score at a contest, across real and practice papers unless `real` is given. */
export function bestAt(list: Sitting[], contest: ContestId, real?: boolean): Sitting | null {
  let best: Sitting | null = null;
  for (const s of list) {
    if (s.contest !== contest || s.score == null || (real != null && s.real !== real)) continue;
    if (!best || s.score > best.score!) best = s;
  }
  return best;
}

export type RungState = 'done' | 'booked' | 'open' | 'ahead';
export interface Rung {
  contest: ContestInfo;
  state: RungState;
  /** The latest real sitting for this rung, if any. */
  sitting: Sitting | null;
}

/** One road's rungs: scored, booked, the next one open, the rest ahead. */
export function roadOf(rungs: ContestId[], list: Sitting[]): Rung[] {
  const out: Rung[] = [];
  let open = false;
  for (const id of rungs) {
    const mine = list.filter((s) => s.real && s.contest === id).sort(byDate);
    const scored = mine.filter((s) => s.score != null).at(-1) ?? null;
    const booked = mine.find((s) => s.score == null) ?? null;
    if (booked) out.push({ contest: contestInfo(id), state: 'booked', sitting: booked });
    else if (scored) out.push({ contest: contestInfo(id), state: 'done', sitting: scored });
    else if (!open) {
      out.push({ contest: contestInfo(id), state: 'open', sitting: null });
      open = true;
    } else out.push({ contest: contestInfo(id), state: 'ahead', sitting: null });
    if (booked) open = true;
  }
  return out;
}

// ─── the notebook ───────────────────────────────────────────────────────────

export const TOPICS = ['Algebra', 'Combinatorics', 'Geometry', 'Number theory'] as const;
export type Topic = (typeof TOPICS)[number];
export type Outcome = 'clean' | 'hint' | 'stuck';
export const OUTCOME_LABEL: Record<Outcome, string> = { clean: 'Solved it', hint: 'With a hint', stuck: 'Stuck' };
/** Days until a problem comes back: soon if you were stuck, later if you needed a hint. */
const COME_BACK: Record<Outcome, number | null> = { clean: null, hint: 21, stuck: 7 };
const MAX_ATTEMPTS = 20;

export interface Attempt {
  date: string;
  outcome: Outcome;
}
export interface Problem {
  id: string;
  title: string;
  topic: Topic | null;
  statement: string;
  idea: string;
  attempts: Attempt[];
}

const isOutcome = (v: unknown): v is Outcome => v === 'clean' || v === 'hint' || v === 'stuck';

export function problemOf(r: LtRecord): Problem | null {
  if (r.kind !== 'problem' || r.deleted_at) return null;
  const d = r.data;
  const attempts = (Array.isArray(d.attempts) ? d.attempts : [])
    .map((a) => ({ date: day((a as Attempt)?.date), outcome: (a as Attempt)?.outcome }))
    .filter((a): a is Attempt => !!a.date && isOutcome(a.outcome))
    .sort((a, b) => a.date.localeCompare(b.date));
  return { id: r.id, title: str(d.title) || 'Untitled problem', topic: (TOPICS as readonly unknown[]).includes(d.topic) ? (d.topic as Topic) : null, statement: str(d.statement), idea: str(d.idea), attempts };
}
export const problemsOf = (records: LtRecord[]): Problem[] => records.map(problemOf).filter((p): p is Problem => !!p);

export const statusOf = (p: Problem): Outcome | null => p.attempts.at(-1)?.outcome ?? null;
export const lastTried = (p: Problem): string | null => p.attempts.at(-1)?.date ?? null;
/** The first day it was solved without help. */
export const solvedOn = (p: Problem): string | null => p.attempts.find((a) => a.outcome === 'clean')?.date ?? null;
/** Solved cleanly after an earlier go that wasn't: the notebook doing its job. */
export const cameBack = (p: Problem): boolean => {
  const first = p.attempts.findIndex((a) => a.outcome === 'clean');
  return first > 0;
};

/** The day a problem should come back, or null if it's done with. */
export function againOn(p: Problem): string | null {
  const s = statusOf(p);
  const wait = s ? COME_BACK[s] : null;
  return wait == null ? null : addDays(lastTried(p)!, wait);
}
/** Problems due another go, the longest waiting first. */
export function dueAgain(list: Problem[], today: string): Problem[] {
  return list
    .filter((p) => {
      const on = againOn(p);
      return on != null && on <= today;
    })
    .sort((a, b) => againOn(a)!.localeCompare(againOn(b)!));
}

/** Add a go at a problem: one per day (the latest counts), the most recent kept. */
export function withAttempt(attempts: Attempt[], date: string, outcome: Outcome): Attempt[] {
  return [...attempts.filter((a) => a.date !== date), { date, outcome }].sort((a, b) => a.date.localeCompare(b.date)).slice(-MAX_ATTEMPTS);
}

export interface TopicLine {
  topic: Topic;
  tried: number;
  clean: number;
}
export function topicSpread(list: Problem[]): TopicLine[] {
  return TOPICS.map((topic) => {
    const mine = list.filter((p) => p.topic === topic && p.attempts.length);
    return { topic, tried: mine.length, clean: mine.filter((p) => statusOf(p) === 'clean').length };
  });
}
/** The topic to work on: the lowest share solved with at least three tried, else the least tried. */
export function weakestTopic(lines: TopicLine[]): Topic | null {
  if (!lines.some((l) => l.tried)) return null;
  const enough = lines.filter((l) => l.tried >= 3);
  if (enough.length === lines.length) return [...enough].sort((a, b) => a.clean / a.tried - b.clean / b.tried)[0].topic;
  return [...lines].sort((a, b) => a.tried - b.tried)[0].topic;
}

// ─── sessions ───────────────────────────────────────────────────────────────

export const SESSION_KINDS = ['Problems', 'Past paper', 'Theory', 'Writing up', 'Contest'] as const;
export interface MathsDetail {
  kind?: string;
  topic?: string;
  paper?: string;
  sittingId?: string;
}
export interface MathsSession {
  id: string;
  date: string;
  minutes: number;
  note: string | null;
  kind: string;
  topic: string | null;
  paper: string | null;
  sittingId: string | null;
}
export function mathsSession(e: LogEntry, d: MathsDetail | null): MathsSession {
  return { id: e.id, date: e.date, minutes: e.minutes, note: e.note, kind: d?.kind ?? 'Maths', topic: d?.topic ?? null, paper: d?.paper ?? null, sittingId: d?.sittingId ?? null };
}

// ─── XP ─────────────────────────────────────────────────────────────────────

export const MATHS_XP = {
  /** A real contest, once its score is in. */
  contest: 40,
  /** A practice paper, once it's marked. */
  paper: 15,
  /** A problem solved without help, the first time. */
  solved: 5,
  /** Solved problems that earn XP in one day, so typing in a backlog doesn't flood the levels. */
  solvedPerDay: 3,
};
/** Older results fill the road and the emblems, not the levels. */
export const MATHS_XP_FROM = '2026-10-01';

export function mathsXp(records: LtRecord[]): { key: string; date: string; xp: number; reason: string }[] {
  const out: { key: string; date: string; xp: number; reason: string }[] = [];
  for (const s of sittingsOf(records)) {
    if (s.score == null || !s.date || s.date < MATHS_XP_FROM) continue;
    out.push({ key: `maths:sitting:${s.id}`, date: s.date, xp: s.real ? MATHS_XP.contest : MATHS_XP.paper, reason: `${s.label}: ${s.score}/${s.max}` });
  }
  const perDay = new Map<string, number>();
  const solved = problemsOf(records)
    .map((p) => ({ p, on: solvedOn(p) }))
    .filter((x): x is { p: Problem; on: string } => !!x.on && x.on >= MATHS_XP_FROM)
    .sort((a, b) => a.on.localeCompare(b.on) || a.p.id.localeCompare(b.p.id));
  for (const { p, on } of solved) {
    const n = perDay.get(on) ?? 0;
    perDay.set(on, n + 1);
    if (n < MATHS_XP.solvedPerDay) out.push({ key: `maths:solved:${p.id}`, date: on, xp: MATHS_XP.solved, reason: `Solved: ${p.title}` });
  }
  return out;
}
