/**
 * Repeat rules shared by calendar events and repeating tasks: every n days, weeks (on chosen
 * weekdays), months (same date or same weekday, e.g. 2nd Tuesday / last Friday) or years.
 * A rule is anchored on a first day; "every n" counts from that day's day, week, month or year.
 */
import type { Repeat, RepeatFreq } from '../../data/types';
import { addDays, dayCount, dayOfMonth, monthEnd, weekdayIndex, weekStart } from '../log/dates';

const freqOf = (r: Repeat): RepeatFreq => r.freq ?? 'weekly';
const everyOf = (r: Repeat) => Math.max(1, Math.floor(r.every ?? 1));
const monthIndex = (d: string) => +d.slice(0, 4) * 12 + +d.slice(5, 7) - 1;

/** 1st…4th weekday of its month, or -1 for a 5th (shown as "last"). */
export function nthWeekday(date: string): number {
  const n = Math.ceil(dayOfMonth(date) / 7);
  return n > 4 ? -1 : n;
}
const isLastWeekday = (date: string) => dayOfMonth(date) + 7 > dayOfMonth(monthEnd(date));

/** Does a rule anchored on `anchor` land on `date`? (Ignores `until`; `date` before the anchor never does.) */
export function repeatsOn(r: Repeat, anchor: string, date: string): boolean {
  if (date < anchor) return false;
  const every = everyOf(r);
  switch (freqOf(r)) {
    case 'daily':
      return (dayCount(anchor, date) - 1) % every === 0;
    case 'weekly':
      return r.days.includes(weekdayIndex(date)) && ((dayCount(weekStart(anchor), weekStart(date)) - 1) / 7) % every === 0;
    case 'monthly': {
      if ((monthIndex(date) - monthIndex(anchor)) % every) return false;
      if (r.by !== 'weekday') return dayOfMonth(date) === dayOfMonth(anchor);
      if (weekdayIndex(date) !== weekdayIndex(anchor)) return false;
      const n = nthWeekday(anchor);
      return n === -1 ? isLastWeekday(date) : nthWeekday(date) === n;
    }
    case 'yearly':
      return date.slice(5) === anchor.slice(5) && (+date.slice(0, 4) - +anchor.slice(0, 4)) % every === 0;
  }
}

/** Searching further than this for a match gives up (a rule that can never land, e.g. 29 Feb every 3 years). */
const HORIZON = 366 * 12;

/** The first day after `after` the rule lands on, or null. */
export function nextOn(r: Repeat, anchor: string, after: string): string | null {
  let d = addDays(after < anchor ? addDays(anchor, -1) : after, 1);
  for (let i = 0; i < HORIZON; i++, d = addDays(d, 1)) if (repeatsOn(r, anchor, d)) return d;
  return null;
}

/** The day of the n-th occurrence (1 = the first), for "ends after n times". */
export function nthOn(r: Repeat, anchor: string, n: number): string | null {
  let d: string | null = addDays(anchor, -1);
  for (let i = 0; i < n && d; i++) d = nextOn(r, anchor, d);
  return d;
}

const DAY = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const NTH = ['', '1st', '2nd', '3rd', '4th'];
const ordinal = (n: number) => `${n}${n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th'}`;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Every 2 weeks on Tue, Thu", "Monthly on the last Fri", "Every 3 days". */
export function repeatLabel(r: Repeat, anchor: string): string {
  const every = everyOf(r);
  const unit = { daily: 'day', weekly: 'week', monthly: 'month', yearly: 'year' }[freqOf(r)];
  const head = every === 1 ? { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' }[freqOf(r)] : `Every ${every} ${unit}s`;
  switch (freqOf(r)) {
    case 'daily':
      return head;
    case 'weekly': {
      const days = [...r.days].sort();
      if (every === 1 && days.join() === '0,1,2,3,4') return 'Weekdays';
      if (every === 1 && days.length === 7) return 'Daily';
      return `${head} on ${days.map((d) => DAY[d]).join(', ')}`;
    }
    case 'monthly': {
      if (r.by !== 'weekday') return `${head} on the ${ordinal(dayOfMonth(anchor))}`;
      const n = nthWeekday(anchor);
      return `${head} on the ${n === -1 ? 'last' : NTH[n]} ${DAY[weekdayIndex(anchor)]}`;
    }
    case 'yearly':
      return `${head} on ${dayOfMonth(anchor)} ${MONTHS[+anchor.slice(5, 7) - 1]}`;
  }
}

/** Problems with a rule, in words, or null. */
export function checkRepeat(r: Repeat, anchor: string): string | null {
  const every = r.every ?? 1;
  if (!Number.isInteger(every) || every < 1 || every > 99) return 'Repeat every 1 to 99.';
  if (freqOf(r) === 'weekly' && !r.days.length) return 'Pick at least one day for it to repeat on.';
  if (r.until && r.until < anchor) return 'The repeat ends before it starts.';
  if (!nextOn(r, anchor, addDays(anchor, -1))) return 'That repeat never lands on a day.';
  return null;
}

/** When a repeating task is ticked: its next due day, after both its current due day and today. */
export function nextTaskDue(r: Repeat, due: string, today: string): string | null {
  const next = nextOn(r, due, due > today ? due : today);
  return next && (!r.until || next <= r.until) ? next : null;
}
