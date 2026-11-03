/**
 * 五年日記, the five-year diary: one line a day, and the same question on the same date every year,
 * so next year you'll see what you answered this year, and the year after both. Rows are lt_records
 * (`hq_diary`, one per day). The last two functions are the evening close-out's: what to do with
 * today's leftovers, and tomorrow's first thing.
 */
import type { LtRecord } from '../../data/types';
import { addDays } from '../log/dates';

export const QUESTIONS = [
  'What’s the best thing that happened today?',
  'What did you learn today?',
  'What are you putting off?',
  'Who made today better?',
  'What are you proud of right now?',
  'What would you do if you weren’t afraid?',
  'What’s taking up the most room in your head?',
  'What did you do today that you didn’t have to?',
  'What do you want to remember about this week?',
  'Which piece of music is stuck in your head?',
  'What’s the hardest thing you’re working on?',
  'What are you looking forward to?',
  'What did you get wrong today, and what does it teach?',
  'What do you want to be true a year from now?',
  'What surprised you today?',
  'What are you grateful for that you usually forget?',
  'If today had a title, what would it be?',
  'What made you laugh?',
  'What did your body tell you today?',
  'What would you tell yourself a year ago?',
  'Which problem did you enjoy most lately?',
  'Who do you want to be more like, and why?',
  'What’s something you changed your mind about?',
  'What would make tomorrow a good day?',
  'What did you do for someone else?',
  'What do you keep saying you’ll do?',
  'What’s a small thing that went right?',
  'What are you reading, and what stayed with you?',
  'Where do you want to live in ten years?',
  'What’s worrying you that probably won’t happen?',
  'What did you practise today, and what got better?',
  'What’s the most beautiful thing you saw today?',
  'What’s your biggest question at the moment?',
  'What would you do with a free day tomorrow?',
  'What’s something you’re better at than a year ago?',
  'What are you avoiding?',
  'Who should you thank?',
  'What’s one thing you’d change about today?',
  'What’s your favourite thing about where you are now?',
  'What are you curious about?',
  'What gave you energy today? What took it?',
  'If you could ask your future self one thing, what would it be?',
  'What would you be sad to lose?',
  'What did you do today that was only for you?',
  'What’s the bravest thing you did lately?',
  'What do you want to get better at this month?',
  'Who do you miss?',
  'What did today teach you about yourself?',
  'What’s a song that sums up right now?',
  'What are you sure of?',
  'What did you finish?',
  'What will you not remember about today in a year? Write it down.',
  'What are you trying too hard at?',
  'What matters less than you thought?',
  'What matters more than you thought?',
  'Where were you happiest this week?',
  'What’s one thing you’d like to tell a friend?',
  'What do people get wrong about you?',
  'What would make this year a great year?',
  'What’s the next small step?',
];

/** Day of the year (1–366) by month and day, counting 29 Feb in every year, so a date keeps its question. */
export function dayOfYear(date: string): number {
  const m = +date.slice(5, 7);
  const d = +date.slice(8, 10);
  const before = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];
  return before[m - 1] + d;
}

export const questionFor = (date: string) => QUESTIONS[dayOfYear(date) % QUESTIONS.length];

export interface DiaryEntry {
  date: string;
  text: string;
}

export function diaryOf(r: LtRecord): DiaryEntry | null {
  if (r.deleted_at || r.kind !== 'hq_diary') return null;
  const d = r.data;
  return typeof d.date === 'string' && typeof d.text === 'string' && d.text.trim() ? { date: d.date, text: d.text } : null;
}

/** The same date in other years, latest first. */
export function sameDayBefore(all: DiaryEntry[], date: string): DiaryEntry[] {
  const md = date.slice(5);
  return all.filter((e) => e.date.slice(5) === md && e.date < date).sort((a, b) => b.date.localeCompare(a.date));
}

/** Days written in a row, ending today or yesterday. */
export function diaryStreak(all: DiaryEntry[], today: string): number {
  const days = new Set(all.map((e) => e.date));
  let d = days.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (days.has(d)) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

// ─── closing the day ────────────────────────────────────────────────────────

export interface CloseDay {
  date: string;
  /** Tomorrow's first thing, decided the night before. */
  first: string;
  /** When it was closed (HH:MM). */
  at: string | null;
}

export function closeDayOf(r: LtRecord): CloseDay | null {
  if (r.deleted_at || r.kind !== 'hq_close') return null;
  const d = r.data;
  return typeof d.date === 'string' ? { date: d.date, first: typeof d.first === 'string' ? d.first : '', at: typeof d.at === 'string' ? d.at : null } : null;
}

/** From the early evening until the small hours is the time to close a day. */
export const isClosingTime = (hour: number) => hour >= 19 || hour < 3;

/** The day you're closing: past midnight it's still yesterday. */
export const closingDate = (today: string, hour: number) => (hour < 3 ? addDays(today, -1) : today);

/** What you decided last night, if anything. */
export function firstThingToday(all: CloseDay[], today: string): string | null {
  const v = all.find((c) => c.date === addDays(today, -1))?.first.trim();
  return v || null;
}
