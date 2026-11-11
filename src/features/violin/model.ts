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
  /** Repertoire: when you started and finished it, "2024" or "2024-09"; '' if not known. */
  started: string;
  finished: string;
  /** A grade or level, e.g. "Grade 6" or "ABRSM 7". */
  level: string;
  note: string;
  fav: boolean;
}

const ym = (v: unknown) => (typeof v === 'string' && /^\d{4}(-(0[1-9]|1[0-2]))?$/.test(v) ? v : '');

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
    started: ym(d.started),
    finished: ym(d.finished),
    level: typeof d.level === 'string' ? d.level.slice(0, 30) : '',
    note: typeof d.note === 'string' ? d.note.slice(0, 600) : '',
    fav: d.fav === true,
  };
}

export const PIECE_STATUSES = ['Learning', 'Polishing', 'Rehearsing', 'Performed', 'Learned', 'Shelved'] as const;

// ─── repertoire ─────────────────────────────────────────────────────────────

/** "Composer — Title" for lists. */
export const pieceName = (p: Pick<Piece, 'composer' | 'title'>) => (p.composer ? `${p.composer} — ${p.title}` : p.title);

/** The year a piece belongs to in the repertoire: finished, else started, else null. */
export const pieceYear = (p: Pick<Piece, 'started' | 'finished'>): number | null => (p.finished ? +p.finished.slice(0, 4) : p.started ? +p.started.slice(0, 4) : null);

/** "Sep 2024 – Mar 2025", "2023", "since Oct 2026" or ''. */
export function pieceSpan(p: Pick<Piece, 'started' | 'finished' | 'archived'>): string {
  const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const f = (v: string) => (v.length > 4 ? `${M[+v.slice(5, 7) - 1]} ${v.slice(0, 4)}` : v);
  if (p.started && p.finished) return p.started === p.finished ? f(p.started) : `${f(p.started)} – ${f(p.finished)}`;
  if (p.finished) return f(p.finished);
  if (p.started) return p.archived ? `from ${f(p.started)}` : `since ${f(p.started)}`;
  return '';
}

export interface RepertoireLine {
  composer: string;
  title: string;
  year: string;
}
/**
 * Lines for adding many past pieces at once: "Composer — Title", "Composer: Title", "Composer - Title", or a title
 * alone, each with an optional year at the end ("… 2023" or "… (2023)"). A line's year beats the default.
 */
export function parseRepertoire(text: string, defaultYear = ''): RepertoireLine[] {
  const out: RepertoireLine[] = [];
  for (const raw of text.split(/\r?\n/)) {
    let line = raw.replace(/^\s*(?:[-*•·]|\d+[.)])\s+/, '').trim();
    if (!line) continue;
    let year = /^\d{4}$/.test(defaultYear) ? defaultYear : '';
    const y = /[\s,]*\(?((?:19|20)\d{2})\)?\s*$/.exec(line);
    if (y && y.index > 0) {
      year = y[1];
      line = line.slice(0, y.index).trim();
    }
    const m = /^(.{1,80}?)\s*(?:—|–|:|\s-\s)\s*(.+)$/.exec(line);
    const composer = m ? m[1].trim() : '';
    const title = (m ? m[2] : line).trim().slice(0, 120);
    if (title) out.push({ composer: composer.slice(0, 80), title, year });
  }
  return out.slice(0, 100);
}

export type RepSort = 'year' | 'composer' | 'title';
/** The repertoire in order: by year (newest first, undated last), composer, or title. */
export function sortRepertoire<T extends Pick<Piece, 'composer' | 'title' | 'started' | 'finished' | 'archived'>>(list: T[], by: RepSort): T[] {
  const name = (p: T) => p.title.toLowerCase();
  if (by === 'title') return [...list].sort((a, b) => name(a).localeCompare(name(b)));
  if (by === 'composer') return [...list].sort((a, b) => Number(!a.composer) - Number(!b.composer) || a.composer.localeCompare(b.composer) || name(a).localeCompare(name(b)));
  // Current pieces first, then by the latest date known.
  const key = (p: T) => (!p.archived ? '9999' : p.finished || p.started || '0000');
  return [...list].sort((a, b) => key(b).localeCompare(key(a)) || name(a).localeCompare(name(b)));
}

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
