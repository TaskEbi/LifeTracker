/**
 * 工房, the forge: turns what needs doing into time. Day: drops tasks and your best next moves into
 * the free gaps around your calendar. Revision: spreads your difficult topics across the days before
 * each exam, the worst ones most often, with past papers at the end. Both only propose; nothing goes
 * in the calendar or the task list until you accept it.
 */
import type { SectionId } from '../../data/types';
import { addDays, dayCount } from '../log/dates';

const toMin = (t: string) => +t.slice(0, 2) * 60 + +t.slice(3, 5);
export const fmtClock = (m: number) => `${String(Math.floor(((m % 1440) + 1440) % 1440 / 60)).padStart(2, '0')}:${String(((m % 60) + 60) % 60).padStart(2, '0')}`;

export interface BusySlot {
  start: string;
  end: string | null;
}

export interface ForgeItem {
  id: string;
  title: string;
  minutes: number;
  section: SectionId | null;
  /** The task it came from, if any. */
  taskId?: string;
}

export interface ForgeBlock extends ForgeItem {
  start: string;
  end: string;
}

export const MIN_GAP = 15;
const BREAK = 5;
/** A timed event with no end is taken to last an hour. */
const DEFAULT_LENGTH = 60;

/** The free stretches between from and to (minutes since midnight), rounded to 5 minutes. */
export function freeGaps(busy: BusySlot[], from: number, to: number): [number, number][] {
  const taken = busy.map((b) => [toMin(b.start), b.end ? toMin(b.end) : toMin(b.start) + DEFAULT_LENGTH] as [number, number]).sort((a, b) => a[0] - b[0]);
  const up = (m: number) => Math.ceil(m / 5) * 5;
  const out: [number, number][] = [];
  let at = up(from);
  for (const [a, b] of taken) {
    if (a - at >= MIN_GAP) out.push([at, Math.min(a, to)]);
    at = Math.max(at, up(b));
  }
  if (to - at >= MIN_GAP) out.push([at, to]);
  return out.filter(([a, b]) => b - a >= MIN_GAP);
}

/**
 * First fit, in the order given (most important first). A long item may shrink to fit a gap, but
 * never below 15 minutes; what doesn't fit comes back in `left`.
 */
export function forgeDay(items: ForgeItem[], gaps: [number, number][]): { blocks: ForgeBlock[]; left: ForgeItem[] } {
  const room = gaps.map((g) => [...g] as [number, number]);
  const blocks: ForgeBlock[] = [];
  const left: ForgeItem[] = [];
  for (const item of items) {
    let gap = room.find(([a, b]) => b - a >= item.minutes);
    if (!gap && item.minutes > MIN_GAP) gap = [...room].sort((x, y) => y[1] - y[0] - (x[1] - x[0])).find(([a, b]) => b - a >= MIN_GAP);
    if (!gap) {
      left.push(item);
      continue;
    }
    const minutes = Math.min(item.minutes, gap[1] - gap[0]);
    blocks.push({ ...item, minutes, start: fmtClock(gap[0]), end: fmtClock(gap[0] + minutes) });
    gap[0] += minutes + BREAK;
  }
  return { blocks: blocks.sort((a, b) => a.start.localeCompare(b.start)), left };
}

// ─── revision ───────────────────────────────────────────────────────────────

export interface RevisionExam {
  title: string;
  date: string;
  subject: string;
}
export interface RevisionTopic {
  subject: string;
  name: string;
  /** 1 lost, 2 shaky, 3 getting there. */
  level: 1 | 2 | 3;
}
export interface RevisionItem {
  subject: string;
  /** What to do: a topic, or a past paper. */
  what: string;
  minutes: number;
  paper: boolean;
}
export interface RevisionDay {
  date: string;
  items: RevisionItem[];
}

/** Which subject an exam is for, from its title: "Physics mock" → Physics. Longest name first. */
export function subjectOfExam(title: string, subjects: string[]): string | null {
  const t = title.toLowerCase();
  return [...subjects].sort((a, b) => b.length - a.length).find((s) => t.includes(s.toLowerCase())) ?? null;
}

const WEIGHT = { 1: 3, 2: 2, 3: 1 } as const;

/**
 * A plan from today up to each exam. Each day, the subject whose exam is closest for the work left
 * gets the next session. Topics come round in proportion to how bad they are, least recently done
 * first; the last two days before an exam are past papers.
 */
export function revisionPlan(exams: RevisionExam[], topics: RevisionTopic[], today: string, minutesPerDay: number, sessionMinutes = 30): RevisionDay[] {
  const ahead = exams.filter((e) => e.date > today).sort((a, b) => a.date.localeCompare(b.date));
  if (!ahead.length) return [];
  const last = ahead[ahead.length - 1].date;
  const perDay = Math.max(1, Math.floor(minutesPerDay / sessionMinutes));
  const lastDone = new Map<string, number>();
  const count = new Map<string, number>();
  const out: RevisionDay[] = [];
  const total = dayCount(today, last) - 1;
  for (let d = 0; d < total; d++) {
    const date = addDays(today, d);
    const items: RevisionItem[] = [];
    const usedToday = new Set<string>();
    for (let s = 0; s < perDay; s++) {
      const open = ahead.filter((e) => e.date > date);
      if (!open.length) break;
      // Closest exam first; a subject already done today gives way if another is open.
      const pick = [...open].sort((a, b) => Number(usedToday.has(a.subject)) - Number(usedToday.has(b.subject)) || a.date.localeCompare(b.date))[0];
      usedToday.add(pick.subject);
      const daysLeft = dayCount(date, pick.date) - 1;
      const mine = topics.filter((t) => t.subject === pick.subject);
      if (daysLeft <= 2 || !mine.length) {
        items.push({ subject: pick.subject, what: daysLeft <= 2 ? 'Past paper, timed' : 'Past paper questions', minutes: sessionMinutes, paper: true });
        continue;
      }
      // Fewest visits for its weight comes next; ties go to the one left longest.
      const topic = [...mine].sort((a, b) => (count.get(a.name) ?? 0) / WEIGHT[a.level] - (count.get(b.name) ?? 0) / WEIGHT[b.level] || (lastDone.get(a.name) ?? -1) - (lastDone.get(b.name) ?? -1) || a.name.localeCompare(b.name))[0];
      count.set(topic.name, (count.get(topic.name) ?? 0) + 1);
      lastDone.set(topic.name, d);
      items.push({ subject: pick.subject, what: topic.name, minutes: sessionMinutes, paper: false });
    }
    if (items.length) out.push({ date, items });
  }
  return out;
}
