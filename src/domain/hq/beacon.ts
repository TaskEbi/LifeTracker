/**
 * 灯台, the lighthouse: what you left yourself for a bad day, and the proof, from your own records,
 * that you've been here before and got through it. Messages are lt_records (`hq_note`), written on
 * good days and read on the others. Every line of proof is counted, never made up, and left out when
 * the records can't back it up.
 */
import type { LtRecord } from '../../data/types';
import { dayCount, shortDay } from '../log/dates';
import { activeDays, type ProgressInput } from '../progress/engine';
import { hoursBySection } from './capsule';
import type { CheckIn } from './checkin';
import { hallOfRecords } from './hall';
import { labRows } from './lab';
import { FEELINGS, type FeelingId, type Quote } from './quotes';
import type { Review } from './review';

export interface Note {
  id: string;
  text: string;
  /** Which bad days it's for. Empty means any of them. */
  feelings: FeelingId[];
  writtenOn: string;
  /** Your inner weather on the day you wrote it, if you'd logged one. */
  mood: number | null;
  reads: number;
  lastRead: string | null;
}

const isFeeling = (v: unknown): v is FeelingId => FEELINGS.some((f) => f.id === v);

export function noteOf(r: LtRecord): Note | null {
  if (r.deleted_at || r.kind !== 'hq_note') return null;
  const d = r.data;
  if (typeof d.text !== 'string' || !d.text.trim()) return null;
  return {
    id: r.id,
    text: d.text,
    feelings: Array.isArray(d.feelings) ? d.feelings.filter(isFeeling) : [],
    writtenOn: typeof d.writtenOn === 'string' ? d.writtenOn : r.created_at.slice(0, 10),
    mood: typeof d.mood === 'number' ? d.mood : null,
    reads: typeof d.reads === 'number' ? d.reads : 0,
    lastRead: typeof d.lastRead === 'string' ? d.lastRead : null,
  };
}

export function ownQuoteOf(r: LtRecord): Quote | null {
  if (r.deleted_at || r.kind !== 'hq_quote') return null;
  const d = r.data;
  if (typeof d.text !== 'string' || !d.text.trim()) return null;
  return {
    id: r.id,
    text: d.text,
    by: typeof d.by === 'string' ? d.by : '',
    source: typeof d.source === 'string' ? d.source : '',
    trust: 'sourced',
    feelings: Array.isArray(d.feelings) ? d.feelings.filter(isFeeling) : [],
    topics: [],
  };
}

/**
 * Which messages to read now. Ones written for this feeling come first, then ones for any day;
 * within each, the one you've gone longest without reading, so they all get their turn.
 */
export function notesFor(notes: Note[], feeling: FeelingId | null): Note[] {
  const fit = feeling ? notes.filter((n) => !n.feelings.length || n.feelings.includes(feeling)) : notes;
  const staleFirst = (a: Note, b: Note) => (a.lastRead ?? '').localeCompare(b.lastRead ?? '') || a.writtenOn.localeCompare(b.writtenOn);
  const aimed = feeling ? fit.filter((n) => n.feelings.includes(feeling)).sort(staleFirst) : [];
  return [...aimed, ...fit.filter((n) => !aimed.includes(n)).sort(staleFirst)];
}

export const WRITING_PROMPTS = [
  'What do you know today that you’ll forget on a bad day?',
  'Why did you start all this? Say it plainly.',
  'What’s something hard you got through that you never expected to?',
  'What would you say to a friend who felt the way you feel on your worst days?',
  'What does it feel like when you’ve finished a session you didn’t want to start?',
  'What will you be glad you kept going for, a year from now?',
  'What’s true about you that a bad day will try to tell you isn’t?',
];

export interface ProofLine {
  id: string;
  /** Big number or short fact. */
  big: string;
  text: string;
}

/** Stops of `minDays` or more that ended with you logging again. */
export function comebacks(days: Set<string>, today: string, minDays = 5): number {
  const sorted = [...days].filter((d) => d <= today).sort();
  let n = 0;
  for (let i = 1; i < sorted.length; i++) if (dayCount(sorted[i - 1], sorted[i]) - 2 >= minDays) n++;
  return n;
}

export interface RoughSpells {
  /** Stretches of storm or rain that have ended. */
  cleared: number;
  /** Average days each one lasted. */
  avgDays: number;
}

/** A rough spell is a run of storm or rain days; it ends on the next better day logged. */
export function roughSpells(checkIns: CheckIn[]): RoughSpells {
  const sorted = [...checkIns].sort((a, b) => a.date.localeCompare(b.date));
  let cleared = 0;
  let total = 0;
  let start: string | null = null;
  for (const c of sorted) {
    if (c.mood <= 2) start ??= c.date;
    else if (start) {
      cleared++;
      total += dayCount(start, c.date) - 1;
      start = null;
    }
  }
  return { cleared, avgDays: cleared ? total / cleared : 0 };
}

const PRIORITY: Record<FeelingId, string[]> = {
  flat: ['low-days', 'hours', 'comebacks', 'win'],
  tired: ['weather', 'low-days', 'comebacks', 'hours'],
  failed: ['comebacks', 'weather', 'win', 'record'],
  swamped: ['weather', 'hours', 'win', 'wishes'],
  doubt: ['hours', 'record', 'win', 'books'],
  afraid: ['record', 'weather', 'win', 'comebacks'],
};

export interface ProofContext {
  checkIns: CheckIn[];
  reviews: Review[];
  books: number;
  wishes: number;
}

/** What your records say you've already been through, most useful for this feeling first. */
export function proofLines(input: ProgressInput, ctx: ProofContext, feeling: FeelingId | null, limit = 4): ProofLine[] {
  const lines: ProofLine[] = [];
  const { total } = hoursBySection(input);
  if (total >= 1) lines.push({ id: 'hours', big: `${Math.round(total).toLocaleString('en-GB')} h`, text: 'logged so far. Nobody did those for you.' });

  const back = comebacks(activeDays(input), input.today);
  if (back >= 1) lines.push({ id: 'comebacks', big: `${back}×`, text: `you’ve stopped for five days or more and come back. Every one of those times, you came back.` });

  const spells = roughSpells(ctx.checkIns);
  if (spells.cleared >= 2) {
    const avg = Math.max(1, Math.round(spells.avgDays));
    lines.push({ id: 'weather', big: `${spells.cleared}/${spells.cleared}`, text: `storms and rain in your weather log cleared, in about ${avg} ${avg === 1 ? 'day' : 'days'} on average.` });
  }

  const low = labRows(input, ctx.checkIns).filter((r) => r.energy != null && r.energy <= 2 && r.work > 0);
  if (low.length >= 2) lines.push({ id: 'low-days', big: `${low.length}`, text: 'days you logged low energy and still got something done.' });

  const best = hallOfRecords(input).find((r) => r.id === 'streak' || r.id === 'long-run');
  if (best) lines.push({ id: 'record', big: best.value, text: `your ${best.label.toLowerCase()}. You did that.` });

  const wins = ctx.reviews.filter((r) => r.win.trim());
  if (wins.length) lines.push({ id: 'win', big: '勝', text: `“${wins[0].win.trim()}” You wrote that, the week of ${shortDay(wins[0].week)}.` });

  if (ctx.books >= 1) lines.push({ id: 'books', big: `${ctx.books}`, text: `${ctx.books === 1 ? 'book' : 'books'} finished.` });
  if (ctx.wishes >= 1) lines.push({ id: 'wishes', big: `${ctx.wishes}`, text: `${ctx.wishes === 1 ? 'thing' : 'things'} crossed off your bucket list.` });

  const order = feeling ? PRIORITY[feeling] : [];
  const rank = (l: ProofLine) => {
    const i = order.indexOf(l.id);
    return i < 0 ? order.length : i;
  };
  return [...lines].sort((a, b) => rank(a) - rank(b)).slice(0, limit);
}

/** How rough today looks: storm or rain in today's check-in. */
export const roughToday = (checkIns: CheckIn[], today: string) => checkIns.some((c) => c.date === today && c.mood <= 2);

/** Written on a good day: the best time to leave something for a bad one. */
export const goodDayToWrite = (checkIns: CheckIn[], today: string) => checkIns.some((c) => c.date === today && c.mood >= 4);

/** Days since a message was written, for "you wrote this 40 days ago". */
export const daysAgo = (from: string, today: string) => Math.max(0, dayCount(from, today) - 1);
