/**
 * 巻物, the scroll: type what you did in plain words and it becomes records.
 *   "violin 45 bach, ran 8k in 44, slept 23:30-7:10, screen 2h15, task buy rosin fri, wish see the aurora"
 * Pure: it only reads the text. Nothing here saves anything; what it couldn't read comes back as
 * `unknown`, so nothing is guessed behind your back.
 */
import { addDays, shortDay, weekdayIndex } from '../log/dates';
import type { TimedSection } from '../../data/types';

export type Sport = 'running' | 'cycling' | 'swimming' | 'tennis' | 'volleyball';

export type Intent =
  | { kind: 'session'; section: TimedSection; date: string; minutes: number; note: string; sport?: Sport; km?: number; match?: boolean; subject?: string; studyKind?: string; book?: string }
  | { kind: 'night'; date: string; bed: string | null; wake: string | null; minutes: number }
  | { kind: 'screen'; date: string; minutes: number }
  | { kind: 'task'; title: string; due: string | null }
  | { kind: 'wish'; title: string }
  | { kind: 'rest' }
  | { kind: 'unknown'; text: string; hint?: string };

export interface ScrollContext {
  today: string;
  subjects: string[];
  /** Titles of books you know, to spot which one you read. */
  books: string[];
}

const SECTION_WORDS: [RegExp, TimedSection][] = [
  [/^(violin|fiddle|practi[sc]ed?|scales?|orchestra|trio)\b/, 'violin'],
  [/^(cod(?:e|ed|ing)|programming|cp|joi|usaco|codeforces|cf|atcoder|dragoncode)\b/, 'coding'],
  [/^(gym|lift(?:ed|ing)?|weights|upper [ab]|athletic)\b/, 'gym'],
  [/^(stud(?:y|ied|ying)|revis(?:e|ed|ion)|homework|hw|past paper|school(?:work)?)\b/, 'study'],
  [/^(chess|puzzles?|tactics|openings?|endgames?)\b/, 'chess'],
  [/^(read(?:ing)?|kindle|books?)\b/, 'reading'],
  // Contest words only: plain "maths" is the school subject, in Study.
  [/^(maths? (?:contests?|comps?|competitions?|olympiad)|olympiad|bmo[12]?|amc(?: ?1[02])?|aime|smc|ukmt)\b/, 'maths'],
  [/^(uni(?: prep)?|sat|tmua|essays?|ucas|common app|personal statement|applications?)\b/, 'future'],
];
const SPORT_WORDS: [RegExp, Sport][] = [
  [/^(run|ran|running|jog(?:ged)?)\b/, 'running'],
  [/^(cycl(?:e|ed|ing)|bik(?:e|ed|ing)|rode|ride)\b/, 'cycling'],
  [/^(swim|swam|swimming)\b/, 'swimming'],
  [/^(tennis)\b/, 'tennis'],
  [/^(volleyball|vball)\b/, 'volleyball'],
];

const STUDY_KINDS = ['Homework', 'Revision', 'Past paper', 'Reading', 'Lesson prep'];

/** Words that start a new clause when they follow "and" or "then". */
const STARTS = 'violin|fiddle|practi[sc]ed?|cod(?:e|ed|ing)|gym|lift(?:ed)?|stud(?:y|ied)|revis(?:e|ed)|chess|read|olympiad|bmo[12]?|amc|uni|run|ran|jog(?:ged)?|cycl(?:e|ed)|bik(?:e|ed)|rode|swim|swam|tennis|volleyball|slept|sleep|screen|phone|task|todo|wish';
const FREE_TEXT = /^(?:task|todo|to-do|remind me to|remember to|wish|bucket(?: list)?|someday)\s/i;
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Finds a duration and returns it with the text it was found in removed. */
export function takeDuration(text: string, clockIsPace = false): { minutes: number | null; rest: string } {
  const out = (minutes: number, m: RegExpMatchArray) => ({ minutes: Math.max(0, Math.round(minutes)), rest: `${text.slice(0, m.index)} ${text.slice(m.index! + m[0].length)}` });
  let m = text.match(/\bhalf an hour\b/i);
  if (m) return out(30, m);
  m = text.match(/\ban? hour and a half\b/i);
  if (m) return out(90, m);
  m = text.match(/\b(?:an|one) hour\b/i);
  if (m) return out(60, m);
  m = text.match(/\b(\d{1,2}):(\d{2}):(\d{2})\b/);
  if (m) return out(+m[1] * 60 + +m[2] + +m[3] / 60, m);
  m = text.match(/\b(\d{1,3}):(\d{2})\b/);
  if (m) return out(clockIsPace && +m[1] >= 10 ? +m[1] + +m[2] / 60 : +m[1] * 60 + +m[2], m);
  m = text.match(/\b(\d+(?:\.\d+)?)\s*h(?:ours?|rs?)?(?:\b|(?=\d))\s*(?:(\d+)\s*(?:m|mins?|minutes?)?\b)?/i);
  if (m) return out(+m[1] * 60 + (m[2] ? +m[2] : 0), m);
  m = text.match(/\b(\d+)\s*(?:m|mins?|minutes?)\b/i);
  if (m) return out(+m[1], m);
  m = text.match(/(?:^|\s)(\d{1,3})(?=\s|$)/);
  if (m) return out(+m[1], m);
  return { minutes: null, rest: text };
}

function takeDistance(text: string, sport?: Sport): { km: number | null; rest: string } {
  const cut = (km: number, m: RegExpMatchArray) => ({ km: Math.round(km * 100) / 100, rest: `${text.slice(0, m.index)} ${text.slice(m.index! + m[0].length)}` });
  let m = text.match(/\b(\d+(?:\.\d+)?)\s*(?:km|ks?|kms|kilomet(?:re|er)s?)\b/i);
  if (m) return cut(+m[1], m);
  m = text.match(/\b(\d+(?:\.\d+)?)\s*(?:mi|miles?)\b/i);
  if (m) return cut(+m[1] * 1.60934, m);
  // A swim of 1500m: metres, because no swim is 1500 minutes.
  if (sport === 'swimming') {
    m = text.match(/\b(\d{3,4})\s*m\b/i);
    if (m) return cut(+m[1] / 1000, m);
  }
  return { km: null, rest: text };
}

const clean = (s: string) => {
  const t = s.replace(/\s+/g, ' ').replace(/^[\s:–—-]+|[\s:–—-]+$/g, '').replace(/^(?:for|in|of|on|at)\s+(?=\S)/i, '').replace(/\s+(?:for|in|of|on|at)$/i, '').trim();
  // Only a joining word left over ("ran 8k in 44" without the numbers): no note.
  return /^(?:for|in|of|on|at)$/i.test(t) ? '' : t;
};

/** "11:30pm", "23:30", "7.10" → HH:MM. */
function clock(raw: string, assumePm: boolean): string | null {
  const m = raw.match(/^(\d{1,2})[:.]?(\d{2})?\s*(am|pm)?$/i);
  if (!m) return null;
  let h = +m[1];
  const min = m[2] ? +m[2] : 0;
  if (min > 59 || h > 24) return null;
  const ap = m[3]?.toLowerCase();
  if (ap === 'pm' && h < 12) h += 12;
  if (ap === 'am' && h === 12) h = 0;
  // "slept 11:30 7:10": a bedtime between 8 and 11 without am/pm is the evening.
  if (!ap && assumePm && h >= 8 && h <= 11) h += 12;
  if (h === 24) h = 0;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function duration(bed: string, wake: string) {
  const t = (s: string) => +s.slice(0, 2) * 60 + +s.slice(3);
  const d = t(wake) - t(bed);
  return d <= 0 ? d + 1440 : d;
}

function parseNight(text: string, date: string): Intent {
  const times = [...text.matchAll(/\b\d{1,2}[:.]\d{2}\s*(?:am|pm)?\b|\b\d{1,2}\s*(?:am|pm)\b/gi)].map((m) => m[0]);
  if (times.length >= 2) {
    const bed = clock(times[0], true);
    const wake = clock(times[1], false);
    if (bed && wake) return { kind: 'night', date, bed, wake, minutes: duration(bed, wake) };
  }
  const d = takeDuration(text);
  if (d.minutes != null && d.minutes >= 30) return { kind: 'night', date, bed: null, wake: null, minutes: d.minutes };
  return { kind: 'unknown', text, hint: 'Try “slept 23:30-7:10” or “slept 7h30”.' };
}

const DAY_NAMES = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function takeDue(text: string, today: string): { due: string | null; rest: string } {
  let m = text.match(/\b(?:by |on |due )?(today|tonight)\s*$/i);
  if (m) return { due: today, rest: text.slice(0, m.index) };
  m = text.match(/\b(?:by |on |due )?(tomorrow|tmrw|tmr)\s*$/i);
  if (m) return { due: addDays(today, 1), rest: text.slice(0, m.index) };
  m = text.match(/\b(?:by |on |due )?(mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)(?:[a-z]*day)?\s*$/i);
  if (m) {
    const want = DAY_NAMES.indexOf(m[1].toLowerCase().slice(0, 3));
    const ahead = (want - weekdayIndex(today) + 7) % 7 || 7;
    return { due: addDays(today, ahead), rest: text.slice(0, m.index) };
  }
  return { due: null, rest: text };
}

function parseClause(raw: string, ctx: ScrollContext, dayHint: string): Intent | null {
  let text = raw.trim();
  if (!text) return null;
  let lower = text.toLowerCase();
  let date = dayHint;
  const dayWord = lower.match(/\b(yesterday|yday)\b/);
  if (dayWord) {
    date = addDays(ctx.today, -1);
    text = `${text.slice(0, dayWord.index)} ${text.slice(dayWord.index! + dayWord[0].length)}`.trim();
    lower = text.toLowerCase();
  }

  let m = text.match(/^(?:task|todo|to-do|remind me to|remember to)\s+(.+)/i);
  if (m) {
    const { due, rest } = takeDue(m[1], ctx.today);
    const title = clean(rest);
    return title ? { kind: 'task', title, due } : { kind: 'unknown', text: raw, hint: 'What’s the task?' };
  }
  m = text.match(/^(?:wish|bucket(?: list)?|someday)\s+(.+)/i);
  if (m) return { kind: 'wish', title: clean(m[1]) };
  if (/^rest\s*day$/i.test(text)) return { kind: 'rest' };

  if (/^(slept|sleep|bed)\b/i.test(lower)) {
    // Sleep logged without a day word is last night, named after this morning.
    return parseNight(text.replace(/^(slept|sleep)\b/i, ''), dayWord ? date : ctx.today);
  }
  if (/^(screen|phone)\b/i.test(lower)) {
    const d = takeDuration(text.replace(/^(screen(?:\s*time)?|phone)\b/i, ''));
    return d.minutes != null ? { kind: 'screen', date, minutes: d.minutes } : { kind: 'unknown', text: raw, hint: 'How long? “screen 2h15”.' };
  }

  for (const [re, sport] of SPORT_WORDS) {
    const hit = lower.match(re);
    if (!hit) continue;
    const after = text.slice(hit[0].length);
    const dist = takeDistance(after, sport);
    const d = takeDuration(dist.rest, true);
    const distanceSport = sport === 'running' || sport === 'cycling' || sport === 'swimming';
    if (d.minutes == null) return { kind: 'unknown', text: raw, hint: `How long? “${hit[0]} 45”.` };
    const match = /\bmatch\b/i.test(d.rest);
    const note = clean(d.rest.replace(/\bmatch\b|\btraining\b/gi, ''));
    return { kind: 'session', section: 'sports', date, minutes: d.minutes, note, sport, ...(distanceSport && dist.km ? { km: dist.km } : {}), ...(match ? { match } : {}) };
  }

  // A school subject on its own means study: "physics 40 moments".
  const subject = [...ctx.subjects].sort((a, b) => b.length - a.length).find((s) => lower.startsWith(s.toLowerCase()) && (lower.length === s.length || /\W/.test(lower[s.length])));
  // "maths contest 30" is the Maths section, even with Maths as a school subject.
  if (subject && !/^maths? (?:contests?|comps?|competitions?|olympiad)\b/.test(lower)) {
    const d = takeDuration(text.slice(subject.length));
    if (d.minutes == null) return { kind: 'unknown', text: raw, hint: `How long? “${subject} 40”.` };
    return studySession(date, d.minutes, subject, d.rest);
  }

  for (const [re, section] of SECTION_WORDS) {
    const hit = lower.match(re);
    if (!hit) continue;
    const d = takeDuration(text.slice(hit[0].length));
    if (d.minutes == null) return { kind: 'unknown', text: raw, hint: `How long? “${hit[0]} 45”.` };
    if (section === 'study') {
      const named = /^(past paper|homework|hw)/.test(hit[0]) ? (hit[0] === 'past paper' ? 'Past paper' : 'Homework') : /^revis/.test(hit[0]) ? 'Revision' : undefined;
      const s = studySession(date, d.minutes, null, d.rest);
      return s.kind === 'session' && named ? { ...s, studyKind: named } : s;
    }
    if (section === 'reading') {
      const rest = clean(d.rest);
      const low = rest.toLowerCase();
      const book = low ? ctx.books.find((b) => b.toLowerCase().includes(low) || low.includes(b.toLowerCase())) : undefined;
      return { kind: 'session', section, date, minutes: d.minutes, note: book ? '' : rest, ...(book ? { book } : {}) };
    }
    return { kind: 'session', section, date, minutes: d.minutes, note: clean(d.rest) };
  }
  return { kind: 'unknown', text: raw };
}

function studySession(date: string, minutes: number, subject: string | null, rest: string): Intent {
  let note = clean(rest);
  const studyKind = STUDY_KINDS.find((k) => new RegExp(`\\b${k}\\b`, 'i').test(note));
  if (studyKind) note = clean(note.replace(new RegExp(`\\b${studyKind}\\b`, 'i'), ''));
  return { kind: 'session', section: 'study', date, minutes, note, subject: subject ?? undefined, studyKind };
}

/** Everything the text says, in order. */
export function parseScroll(text: string, ctx: ScrollContext): Intent[] {
  const starts = new RegExp(`\\b(?:and|then)\\s+(?=(?:${[STARTS, ...ctx.subjects.map(escapeRe)].join('|')})\\b)`, 'gi');
  const clauses = text
    .split(/[\n;,]+/)
    // A task or a wish may have "and" in it; anything else may be two things at once.
    .flatMap((c) => (FREE_TEXT.test(c.trim()) ? [c] : c.split(starts)))
    .map((c) => c.trim())
    .filter(Boolean);
  // A leading "yesterday:" covers the whole scroll.
  let dayHint = ctx.today;
  const lead = clauses[0]?.match(/^(yesterday|yday)\s*:\s*/i);
  if (lead) {
    dayHint = addDays(ctx.today, -1);
    clauses[0] = clauses[0].slice(lead[0].length);
  }
  return clauses.map((c) => parseClause(c, ctx, dayHint)).filter((i): i is Intent => !!i);
}

/** Whether the text says something worth saving (a bare word is still only a search for a command). */
export const hasIntents = (intents: Intent[]) => intents.some((i) => i.kind !== 'unknown');

const MINS = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ''}` : `${m} min`);

/** One line for the preview. */
export function describeIntent(i: Intent, today: string): string {
  const day = (d: string) => (d === today ? '' : d === addDays(today, -1) ? ' · yesterday' : ` · ${shortDay(d)}`);
  switch (i.kind) {
    case 'session': {
      const head = i.sport ? i.sport[0].toUpperCase() + i.sport.slice(1) : i.subject ?? i.section[0].toUpperCase() + i.section.slice(1);
      const parts = [head, ...(i.km ? [`${i.km} km`] : []), MINS(i.minutes), ...(i.match ? ['match'] : []), ...(i.studyKind ? [i.studyKind] : []), ...(i.book ? [i.book] : []), ...(i.note ? [i.note] : [])];
      return parts.join(' · ') + day(i.date);
    }
    case 'night':
      return `Sleep · ${i.bed ? `${i.bed} → ${i.wake} · ` : ''}${MINS(i.minutes)}${day(i.date)}`;
    case 'screen':
      return `Screen time · ${MINS(i.minutes)}${day(i.date)}`;
    case 'task':
      return `New task · ${i.title}${i.due ? ` · due ${i.due === today ? 'today' : i.due === addDays(today, 1) ? 'tomorrow' : shortDay(i.due)}` : ''}`;
    case 'wish':
      return `Bucket list · ${i.title}`;
    case 'rest':
      return 'Rest day';
    case 'unknown':
      return i.text;
  }
}
