/**
 * Violin: what a session and a repertoire item look like, and the statistics drawn from them.
 * A session is one Daily Log entry (minutes, day, note) plus this detail in lt_details.
 * Statistics are computed from the entries; per-piece minutes only where the time was split.
 */
import { addDays, weekdayIndex, weekStart } from '../../domain/log/dates';
import type { LtRecord } from '../../data/types';
import type { SectionEntry } from '../../data/lt';

export const SESSION_TYPES = [
  { id: 'solo', name: 'Solo practice', sub: 'Practice', hint: 'On your own' },
  { id: 'lesson', name: 'Lesson', sub: 'Lesson', hint: 'Usually Thursday' },
  { id: 'orchestra', name: 'Orchestra', sub: 'Orchestra', hint: 'Usually Thursday' },
  { id: 'trio', name: 'Trio practice', sub: 'Trio', hint: 'With the trio' },
] as const;
export type SessionType = (typeof SESSION_TYPES)[number]['id'];
export const typeInfo = (t: string | undefined) => SESSION_TYPES.find((s) => s.id === t);

export interface ViolinDetail {
  type: SessionType;
  /** lt_records ids (kind 'piece'). */
  pieces: string[];
  /** lt_records ids (kind 'scale'). */
  scales: string[];
  /** Minutes per item, only when the time was split. May cover less than the total. */
  split?: Record<string, number>;
}

export function isViolinDetail(d: unknown): d is ViolinDetail {
  const v = d as ViolinDetail | null;
  return !!v && typeof v.type === 'string' && Array.isArray(v.pieces) && Array.isArray(v.scales);
}

export type Session = SectionEntry<ViolinDetail>;

export interface Piece {
  id: string;
  kind: 'piece' | 'scale';
  title: string;
  composer: string;
  status: string;
  group: string;
  archived: boolean;
}

export function pieceOf(r: LtRecord): Piece {
  const d = r.data as Partial<Piece>;
  return {
    id: r.id,
    kind: r.kind === 'scale' ? 'scale' : 'piece',
    title: typeof d.title === 'string' ? d.title : 'Untitled',
    composer: typeof d.composer === 'string' ? d.composer : '',
    status: typeof d.status === 'string' ? d.status : r.kind === 'scale' ? '' : 'Learning',
    group: typeof d.group === 'string' ? d.group : '',
    archived: !!r.archived_at,
  };
}

export const PIECE_STATUSES = ['Learning', 'Polishing', 'Rehearsing', 'Performed', 'Shelved'] as const;

// ─── statistics ─────────────────────────────────────────────────────────────

export interface WeekTotal {
  week: string;
  minutes: number;
  byType: Record<string, number>;
}

/** Minutes per week (Monday start) for the `n` weeks ending with the one containing `today`. */
export function weekTotals(sessions: Session[], today: string, n = 8): WeekTotal[] {
  const current = weekStart(today);
  const weeks: WeekTotal[] = Array.from({ length: n }, (_, i) => ({ week: addDays(current, -7 * (n - 1 - i)), minutes: 0, byType: {} }));
  const index = new Map(weeks.map((w, i) => [w.week, i]));
  for (const s of sessions) {
    if (s.entry.date > today) continue;
    const i = index.get(weekStart(s.entry.date));
    if (i === undefined) continue;
    weeks[i].minutes += s.entry.minutes;
    const t = s.detail?.type ?? 'unspecified';
    weeks[i].byType[t] = (weeks[i].byType[t] ?? 0) + s.entry.minutes;
  }
  return weeks;
}

/** Minutes on each of the last `n` days, oldest first. */
export function dayGrid(sessions: Session[], today: string, n = 28): { date: string; minutes: number }[] {
  const by = new Map<string, number>();
  for (const s of sessions) by.set(s.entry.date, (by.get(s.entry.date) ?? 0) + s.entry.minutes);
  return Array.from({ length: n }, (_, i) => {
    const date = addDays(today, -(n - 1 - i));
    return { date, minutes: by.get(date) ?? 0 };
  });
}

export interface ItemStats {
  sessions: number;
  last: string | null;
  /** Minutes recorded for this item where a session was split; never estimated. */
  preciseMinutes: number;
  preciseSessions: number;
}

export function itemStats(sessions: Session[], id: string): ItemStats {
  let n = 0;
  let last: string | null = null;
  let minutes = 0;
  let precise = 0;
  for (const s of sessions) {
    const d = s.detail;
    if (!d || (!d.pieces.includes(id) && !d.scales.includes(id))) continue;
    n++;
    if (!last || s.entry.date > last) last = s.entry.date;
    const m = d.split?.[id];
    if (typeof m === 'number' && m > 0) {
      minutes += m;
      precise++;
    }
  }
  return { sessions: n, last, preciseMinutes: minutes, preciseSessions: precise };
}

/** Days with any violin in the last `n` days. */
export const daysPractised = (sessions: Session[], today: string, n = 28) => dayGrid(sessions, today, n).filter((d) => d.minutes > 0).length;

/** Thursday is lesson and orchestra day: suggest a lesson first on a Thursday. */
export const suggestedType = (date: string): SessionType => (weekdayIndex(date) === 3 ? 'lesson' : 'solo');

/** Check a draft before saving: a message to show, or null. */
export function checkSession(d: { minutes: number; date: string; split?: Record<string, number> | null }, today: string): string | null {
  if (!Number.isInteger(d.minutes) || d.minutes < 1 || d.minutes > 1440) return 'A session is between 1 minute and 24 hours.';
  if (d.date > today) return "That day hasn't happened yet.";
  const assigned = Object.values(d.split ?? {}).reduce((a, b) => a + b, 0);
  if (assigned > d.minutes) return `The split adds up to ${assigned} min, more than the ${d.minutes} min total.`;
  return null;
}
