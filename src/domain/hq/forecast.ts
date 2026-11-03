/**
 * 天文台, the observatory: where the current pace leads. Dates for the next forms and ranks, how many
 * hours you'll have put in before each deadline, lifetime mastery clocks, and a what-if: the same
 * sums with more time a day. All of it is arithmetic on your own last weeks, and is labelled so.
 */
import { addDays, dayCount } from '../log/dates';
import { RANKS, RULES, sectionOf, STAGES, xpForLevel, type ProgressInput, type XpEvent } from '../progress/engine';
import { TIMED_SECTIONS, type SectionId, type TimedSection } from '../../data/types';

export const RATE_DAYS = 28;

/** XP a day over the last four weeks. */
export function xpRate(events: XpEvent[], today: string, days = RATE_DAYS): number {
  const from = addDays(today, -(days - 1));
  return events.filter((e) => e.date >= from && e.date <= today).reduce((n, e) => n + e.xp, 0) / days;
}

/** XP a day that this many extra minutes a day would add, by the rules of the XP engine. */
export function xpFromExtraMinutes(extra: number): number {
  return Math.min(extra, RULES.timeCapPerDay) / RULES.minutesPerXp;
}

export interface Milestone {
  kind: 'form' | 'rank';
  name: string;
  level: number;
  xpLeft: number;
  /** Days at the given rate, or null if the rate is zero. */
  days: number | null;
  date: string | null;
}

/** The next forms and ranks at a given XP a day. */
export function nextMilestones(total: number, level: number, rate: number, today: string, limit = 3): Milestone[] {
  const items = [
    ...STAGES.filter((s) => s.level > level).map((s) => ({ kind: 'form' as const, name: s.name, level: s.level })),
    ...RANKS.filter((r) => r.level > level).map((r) => ({ kind: 'rank' as const, name: r.name, level: r.level })),
  ].sort((a, b) => a.level - b.level);
  return items.slice(0, limit).map((m) => {
    const xpLeft = Math.max(0, xpForLevel(m.level) - total);
    const days = rate > 0 ? Math.ceil(xpLeft / rate) : null;
    return { ...m, xpLeft, days, date: days != null && days < 365 * 60 ? addDays(today, days) : null };
  });
}

export interface MasteryClock {
  section: TimedSection;
  hours: number;
  /** Minutes a day over the last eight weeks. */
  perDay: number;
  /** The next round number of hours. */
  next: number;
  nextDate: string | null;
  /** When 10,000 hours arrives at this pace. */
  masteryDate: string | null;
}

const MARKS = [10, 50, 100, 250, 500, 1000, 2000, 3000, 5000, 7500, 10000];

export function minutesBySection(input: ProgressInput): Map<TimedSection, { total: number; recent: number }> {
  const from = addDays(input.today, -55);
  const out = new Map<TimedSection, { total: number; recent: number }>(TIMED_SECTIONS.map((s) => [s, { total: 0, recent: 0 }]));
  for (const e of input.entries) {
    if (e.date > input.today) continue;
    const s = sectionOf(e, input);
    const v = out.get(s as TimedSection);
    if (!v) continue;
    v.total += e.minutes;
    if (e.date >= from) v.recent += e.minutes;
  }
  return out;
}

export function masteryClocks(input: ProgressInput, extra: Partial<Record<TimedSection, number>> = {}): MasteryClock[] {
  const by = minutesBySection(input);
  return TIMED_SECTIONS.map((section) => {
    const v = by.get(section)!;
    const hours = v.total / 60;
    const perDay = v.recent / 56 + (extra[section] ?? 0);
    const next = MARKS.find((m) => m > hours) ?? 10000;
    const dateAt = (h: number) => {
      if (perDay <= 0) return null;
      const days = Math.ceil(((h - hours) * 60) / perDay);
      return days < 365 * 80 ? addDays(input.today, days) : null;
    };
    return { section, hours, perDay, next, nextDate: dateAt(next), masteryDate: dateAt(10000) };
  }).filter((c) => c.hours > 0 || c.perDay > 0);
}

export interface Runway {
  title: string;
  date: string;
  section: SectionId;
  daysLeft: number;
  /** Hours you'd log before it at the pace of the last four weeks. */
  hours: number;
  perWeek: number;
}

/** For each dated thing ahead, the time you'll have before it. */
export function runways(input: ProgressInput, deadlines: { title: string; date: string; section: SectionId | null }[], extra: Partial<Record<TimedSection, number>> = {}): Runway[] {
  const from = addDays(input.today, -27);
  const month = new Map<string, number>();
  for (const e of input.entries) {
    if (e.date < from || e.date > input.today) continue;
    const s = sectionOf(e, input);
    month.set(s, (month.get(s) ?? 0) + e.minutes);
  }
  return deadlines
    .filter((d): d is { title: string; date: string; section: SectionId } => !!d.section && (TIMED_SECTIONS as readonly string[]).includes(d.section) && d.date >= input.today)
    .map((d) => {
      const daysLeft = dayCount(input.today, d.date) - 1;
      const perDay = (month.get(d.section) ?? 0) / 28 + (extra[d.section as TimedSection] ?? 0);
      return { title: d.title, date: d.date, section: d.section, daysLeft, hours: (perDay * daysLeft) / 60, perWeek: (perDay * 7) / 60 };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}
