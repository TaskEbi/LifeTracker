/**
 * The sleep bank: how much sleep you owe from the last two weeks (recent nights count most, a good
 * night pays some back), and what time tonight's bedtime has to be to cover tomorrow's first thing.
 */
import { addDays } from '../log/dates';
import type { SleepSchedule } from '../prefs';
import { scheduleFor } from '../progress/engine';

const toMin = (t: string) => +t.slice(0, 2) * 60 + +t.slice(3, 5);
const fromMin = (m: number) => {
  const v = ((Math.round(m) % 1440) + 1440) % 1440;
  return `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`;
};

/** A night's sleep your own schedule asks for. */
export function sleepNeed(s: SleepSchedule): number {
  const d = toMin(s.weekday.wake) - toMin(s.weekday.bed);
  return d <= 0 ? d + 1440 : d;
}

export interface SleepBank {
  need: number;
  /** Minutes owed, weighted to recent nights. */
  debt: number;
  /** Nights the sum is based on. */
  nights: number;
  /** Plain words. */
  state: 'unknown' | 'clear' | 'light' | 'heavy';
}

const DECAY = 0.85;

/** `minutes`: sleep per morning date. Nights not logged count for nothing either way. */
export function sleepBank(minutes: Map<string, number>, today: string, schedule: SleepSchedule): SleepBank {
  const need = sleepNeed(schedule);
  let debt = 0;
  let nights = 0;
  // Oldest first: what you owe fades a little each day, and each night adds to it or pays it off.
  for (let i = 13; i >= 0; i--) {
    debt *= DECAY;
    const v = minutes.get(addDays(today, -i));
    if (v == null) continue;
    nights++;
    // An extra-long night can clear what you owe, but you can't bank sleep ahead.
    debt = Math.max(0, debt + need - v);
  }
  const d = Math.round(debt);
  return { need, debt: d, nights, state: nights < 3 ? 'unknown' : d < 45 ? 'clear' : d < 180 ? 'light' : 'heavy' };
}

export interface Tonight {
  bed: string;
  wake: string;
  /** Why these times. */
  because: string[];
  /** Extra minutes added to start paying back the debt. */
  repay: number;
}

/** Time to get ready between waking and your first thing. */
export const GET_READY = 60;
/** Time to fall asleep. */
export const FALL_ASLEEP = 15;
const MAX_REPAY = 45;

/**
 * Tonight's bedtime: wake early enough for tomorrow's first timed thing, sleep what your schedule
 * asks, plus up to 45 minutes towards the debt.
 */
export function tonight(today: string, schedule: SleepSchedule, bank: SleepBank, first: { title: string; start: string } | null): Tonight {
  const tomorrow = addDays(today, 1);
  const plan = scheduleFor(tomorrow, schedule);
  const because: string[] = [];
  let wake = toMin(plan.wake);
  if (first && toMin(first.start) - GET_READY < wake) {
    wake = toMin(first.start) - GET_READY;
    because.push(`${first.title} at ${first.start}, and an hour to get ready`);
  } else {
    because.push(`Your plan has you up at ${plan.wake}`);
  }
  const repay = Math.min(MAX_REPAY, Math.round(bank.debt / 4 / 5) * 5);
  if (repay > 0) because.push(`${repay} extra minutes towards what you owe`);
  because.push(`${Math.floor(bank.need / 60)}h ${bank.need % 60}m of sleep, ${FALL_ASLEEP} minutes to drop off`);
  return { bed: fromMin(wake - bank.need - repay - FALL_ASLEEP), wake: fromMin(wake), because, repay };
}
