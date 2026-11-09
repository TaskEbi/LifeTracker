/**
 * EPQ: the Extended Project lives inside Study. Its hours are Study sessions whose subject is the
 * project's subject (default "EPQ"); everything else is lt_records under the study section:
 * `epq_project` (one row), `epq_milestone`, `epq_log` (the production log), `epq_source` and
 * `epq_words` (a word count per day). Pure functions only; tested in epq.test.ts.
 */
import type { LtRecord } from '../../data/types';
import { addDays, dayCount } from '../log/dates';

export const EPQ_SUBJECT = 'EPQ';
export const DEFAULT_WORDS = 5000;
export const DEFAULT_HOURS = 120;
/** A row holds 32 KB at most; long text is capped well under that. */
export const LOG_MAX = 4000;
export const NOTE_MAX = 1500;

export interface EpqProject {
  id: string;
  title: string;
  question: string;
  /** Hand-in date, YYYY-MM-DD. */
  deadline: string | null;
  wordTarget: number;
  hoursTarget: number;
  subject: string;
  started: string | null;
}

const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.slice(0, max) : '');
const date = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
const posInt = (v: unknown, dflt: number) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.round(v) : dflt);

export function projectOf(r: LtRecord): EpqProject {
  const d = (r.data ?? {}) as Record<string, unknown>;
  return {
    id: r.id,
    title: str(d.title),
    question: str(d.question, 400),
    deadline: date(d.deadline),
    wordTarget: posInt(d.wordTarget, DEFAULT_WORDS),
    hoursTarget: posInt(d.hoursTarget, DEFAULT_HOURS),
    subject: str(d.subject, 40).trim() || EPQ_SUBJECT,
    started: date(d.started),
  };
}

export interface Milestone {
  id: string;
  title: string;
  due: string | null;
  done: string | null;
  order: number;
}
export function milestoneOf(r: LtRecord): Milestone | null {
  const d = (r.data ?? {}) as Record<string, unknown>;
  const title = str(d.title, 120).trim();
  if (!title) return null;
  return { id: r.id, title, due: date(d.due), done: date(d.done), order: r.sort_order };
}

/**
 * The usual stages of an essay EPQ, as fractions of the way from today to the deadline.
 * The exam board's own dates win: these are only a starting point to edit.
 */
export const USUAL_MILESTONES: { title: string; at: number }[] = [
  { title: 'Title and question agreed', at: 0.05 },
  { title: 'Project proposal form signed off', at: 0.12 },
  { title: 'Research and literature review', at: 0.35 },
  { title: 'Mid-project review', at: 0.5 },
  { title: 'First full draft', at: 0.68 },
  { title: 'Feedback acted on, final draft', at: 0.85 },
  { title: 'Presentation', at: 0.93 },
  { title: 'Hand in', at: 1 },
];

/** The usual milestones spread between today and the deadline (or over six months if none). */
export function plannedMilestones(today: string, deadline: string | null): { title: string; due: string }[] {
  const span = deadline && deadline > today ? dayCount(today, deadline) - 1 : 182;
  return USUAL_MILESTONES.map((m) => ({ title: m.title, due: addDays(today, Math.round(span * m.at)) }));
}

export type MilestoneState = 'done' | 'late' | 'soon' | 'later' | 'undated';
export function milestoneState(m: Milestone, today: string): MilestoneState {
  if (m.done) return 'done';
  if (!m.due) return 'undated';
  if (m.due < today) return 'late';
  return dayCount(today, m.due) - 1 <= 14 ? 'soon' : 'later';
}

/** Milestones in the order they come: by date, undated last, then as added. */
export const sortMilestones = (list: Milestone[]) =>
  [...list].sort((a, b) => (a.due ?? '9999').localeCompare(b.due ?? '9999') || a.order - b.order);

export const LOG_KINDS = ['Progress', 'Decision', 'Problem', 'Reflection'] as const;
export type LogKind = (typeof LOG_KINDS)[number];
export const LOG_PROMPTS: Record<LogKind, string> = {
  Progress: 'What did you do, and what came of it?',
  Decision: 'What did you decide, what else did you consider, and why this?',
  Problem: 'What went wrong or got stuck, and what will you try?',
  Reflection: 'What have you learned about the topic, or about how you work?',
};

export interface LogEntry {
  id: string;
  date: string;
  kind: LogKind;
  text: string;
  next: string;
}
export function logOf(r: LtRecord): LogEntry | null {
  const d = (r.data ?? {}) as Record<string, unknown>;
  const text = str(d.text, LOG_MAX).trim();
  const day = date(d.date);
  if (!text || !day) return null;
  const kind = (LOG_KINDS as readonly string[]).includes(d.kind as string) ? (d.kind as LogKind) : 'Progress';
  return { id: r.id, date: day, kind, text, next: str(d.next, 400).trim() };
}

/** The production log as plain text, oldest first, ready to paste into the official form. */
export function logAsText(entries: LogEntry[], project?: Pick<EpqProject, 'title'>): string {
  const lines = [...entries].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  const head = project?.title ? `Production log: ${project.title}\n\n` : 'Production log\n\n';
  return head + lines.map((e) => `${longDate(e.date)} · ${e.kind}\n${e.text}${e.next ? `\nNext: ${e.next}` : ''}`).join('\n\n');
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const longDate = (d: string) => `${Number(d.slice(8, 10))} ${MONTHS[Number(d.slice(5, 7)) - 1]} ${d.slice(0, 4)}`;

export const SOURCE_TYPES = ['Book', 'Journal article', 'Website', 'Report', 'News', 'Video', 'Other'] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];
/** How far you'd lean on it: checked against who wrote it, when, why and with what evidence. */
export const TRUST = { 3: 'Strong', 2: 'Fair', 1: 'Weak' } as const;
export type Trust = keyof typeof TRUST;

export interface Source {
  id: string;
  title: string;
  author: string;
  year: string;
  type: SourceType;
  publisher: string;
  url: string;
  accessed: string | null;
  notes: string;
  trust: Trust;
  used: boolean;
}
export function sourceOf(r: LtRecord): Source | null {
  const d = (r.data ?? {}) as Record<string, unknown>;
  const title = str(d.title, 300).trim();
  if (!title) return null;
  const type = (SOURCE_TYPES as readonly string[]).includes(d.type as string) ? (d.type as SourceType) : 'Other';
  const trust = d.trust === 1 || d.trust === 3 ? d.trust : 2;
  return {
    id: r.id,
    title,
    author: str(d.author, 200).trim(),
    year: str(d.year, 12).trim(),
    type,
    publisher: str(d.publisher, 200).trim(),
    url: str(d.url, 600).trim(),
    accessed: date(d.accessed),
    notes: str(d.notes, NOTE_MAX).trim(),
    trust,
    used: !!d.used,
  };
}

/**
 * A Harvard-style reference. Schools differ in the small print, so this is a sound draft:
 * Author (Year) Title. Publisher. Available at: URL (Accessed: date).
 */
export function harvard(s: Source): string {
  const who = s.author || s.publisher || 'Anon.';
  const when = s.year || 'n.d.';
  const title = s.type === 'Book' || s.type === 'Report' ? `*${s.title}*` : `‘${s.title}’`;
  const pub = s.publisher && s.publisher !== who ? ` ${s.publisher}.` : '';
  const web = s.url ? ` Available at: ${s.url}${s.accessed ? ` (Accessed: ${longDate(s.accessed)})` : ''}.` : '';
  return `${who} (${when}) ${title}.${pub}${web}`;
}

/** Reference list: sources you've used, by author then year. */
export const referenceList = (sources: Source[]) =>
  sources
    .filter((s) => s.used)
    .sort((a, b) => (a.author || a.publisher || a.title).localeCompare(b.author || b.publisher || b.title) || a.year.localeCompare(b.year))
    .map(harvard);

export interface WordDay {
  date: string;
  words: number;
}
export function wordsOf(r: LtRecord): WordDay | null {
  const d = (r.data ?? {}) as Record<string, unknown>;
  const day = date(d.date);
  return day && typeof d.words === 'number' && Number.isFinite(d.words) && d.words >= 0 ? { date: day, words: Math.round(d.words) } : null;
}
/** Latest count per day (two devices may write the same day). */
export function wordHistory(list: WordDay[]): WordDay[] {
  const by = new Map<string, number>();
  for (const w of list) by.set(w.date, w.words);
  return [...by].map(([d, words]) => ({ date: d, words })).sort((a, b) => a.date.localeCompare(b.date));
}

export interface Pace {
  /** How far along, 0–1. */
  pct: number;
  /** Still to go. */
  left: number;
  /** Days until the deadline (0 on the day), or null without one. */
  days: number | null;
  /** Needed per week from now to finish on time. */
  perWeek: number | null;
  /** Where you'd be if you'd gone at an even pace from the start. */
  expected: number | null;
  /** Ahead (+) or behind (−) of that even pace. */
  ahead: number | null;
}

/** Progress on a target that should be met by the deadline, against an even pace from the start. */
export function paceOf(done: number, target: number, today: string, deadline: string | null, started: string | null): Pace {
  const pct = target > 0 ? Math.min(1, done / target) : 0;
  const left = Math.max(0, target - done);
  if (!deadline) return { pct, left, days: null, perWeek: null, expected: null, ahead: null };
  const days = Math.max(0, dayCount(today, deadline) - 1);
  const perWeek = left === 0 ? 0 : days === 0 ? left : Math.ceil((left / days) * 7);
  let expected: number | null = null;
  if (started && started < deadline) {
    const span = dayCount(started, deadline) - 1;
    const gone = Math.min(span, Math.max(0, dayCount(started, today) - 1));
    expected = Math.round((target * gone) / span);
  }
  return { pct, left, days, perWeek, expected, ahead: expected == null ? null : done - expected };
}

/** Minutes logged on the project per ISO week (Monday), oldest first, for a small chart. */
export function minutesByWeek(sessions: { date: string; minutes: number }[], today: string, weeks = 12): { monday: string; minutes: number }[] {
  const dow = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7;
  const thisMonday = addDays(today, -dow);
  const out = Array.from({ length: weeks }, (_, i) => ({ monday: addDays(thisMonday, -7 * (weeks - 1 - i)), minutes: 0 }));
  for (const s of sessions) {
    const i = out.findIndex((w, k) => s.date >= w.monday && (k === out.length - 1 || s.date < out[k + 1].monday));
    if (i >= 0 && s.date <= today) out[i].minutes += s.minutes;
  }
  return out;
}

/** Days since anything happened on the project: a session, a log entry or a word count. */
export function quietDays(today: string, dates: string[]): number | null {
  const last = dates.filter((d) => d <= today).sort().pop();
  return last ? dayCount(last, today) - 1 : null;
}
