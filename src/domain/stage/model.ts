/**
 * 本番 The Stage: performances, tests, matches, races, chess games and talks: the days that count.
 * There is no table of its own. Each result lives where that activity already lives, so nothing is kept twice:
 * - a test is a Study mark (`study_mark`, study section) with extra fields;
 * - a match or a race is a sports session (log entry + lt_details) with extra detail, so its time still counts;
 * - a violin performance, an over-the-board chess game, a talk or anything else is an `lt_records` row,
 *   kind `pf_show`, under the cabinet section;
 * - a real maths contest is the Maths page's sitting, shown read-only.
 * Getting ready for something on the calendar is a `pf_prep` row whose id comes from the occurrence key.
 * Everything here is pure and tested in stage.test.ts. Nothing earns XP.
 */
import { addDays } from '../log/dates';
import { contestInfo, type Sitting } from '../maths/model';
import type { LtRecord } from '../../data/types';

export const STAGE_TYPES = {
  violin: { k: '奏', name: 'Violin', one: 'Performance', c: '#ff9b45' },
  test: { k: '試', name: 'Tests', one: 'Test', c: '#aa8dff' },
  match: { k: '戦', name: 'Matches', one: 'Match', c: '#ff6b6b' },
  race: { k: '走', name: 'Races', one: 'Race', c: '#3dd196' },
  chess: { k: '棋', name: 'Chess', one: 'Chess game', c: '#d9c38c' },
  talk: { k: '話', name: 'Talks', one: 'Talk', c: '#6fd0ff' },
  other: { k: '他', name: 'Other', one: 'Something else', c: '#c2c8d0' },
  maths: { k: '数', name: 'Maths', one: 'Maths contest', c: '#ffd166' },
} as const;
export type StageType = keyof typeof STAGE_TYPES;
/** The kinds you can log from the Stage (maths contests are logged on the Maths page). */
export const LOGGABLE: Exclude<StageType, 'maths'>[] = ['violin', 'test', 'match', 'race', 'chess', 'talk', 'other'];
/** The kinds kept as `pf_show` rows. */
export type ShowType = 'violin' | 'chess' | 'talk' | 'other';
export const SHOW_TYPES: ShowType[] = ['violin', 'chess', 'talk', 'other'];

/** What kind of occasion, per type (the first is the default). */
export const SUBTYPES: Partial<Record<StageType, readonly string[]>> = {
  violin: ['Concert', 'Recital', 'Grade exam', 'Competition', 'Audition', 'Masterclass', 'Informal'],
  test: ['Class test', 'Quiz', 'Mock', 'End of term', 'External exam'],
  chess: ['Tournament', 'League', 'Rapid', 'Blitz', 'Friendly'],
  talk: ['Presentation', 'Speech', 'Debate', 'Interview', 'Assembly'],
  other: ['Competition', 'Contest', 'Exam', 'Show', 'Other'],
};

/** Stats you can count in a match, per court sport. */
export const MATCH_STATS: Record<string, { id: string; name: string; bad?: boolean }[]> = {
  volleyball: [
    { id: 'kills', name: 'Kills' },
    { id: 'aces', name: 'Aces' },
    { id: 'blocks', name: 'Blocks' },
    { id: 'digs', name: 'Digs' },
    { id: 'errors', name: 'Errors', bad: true },
  ],
  tennis: [
    { id: 'aces', name: 'Aces' },
    { id: 'winners', name: 'Winners' },
    { id: 'df', name: 'Double faults', bad: true },
    { id: 'ue', name: 'Unforced errors', bad: true },
  ],
};

/** Before the day: a short list for each kind, ticked on the prep sheet. Ids stay stable; words can change. */
export const PREP: Record<StageType, { id: string; t: string }[]> = {
  violin: [
    { id: 'run', t: 'Run the whole programme without stopping' },
    { id: 'someone', t: 'Play it to someone' },
    { id: 'record', t: 'Record it and listen back' },
    { id: 'memory', t: 'Memory check: start from three different places' },
    { id: 'piano', t: 'Rehearse with the accompanist or group' },
    { id: 'kit', t: 'Strings, rosin, music and clothes ready' },
    { id: 'sleep', t: 'Early night before' },
  ],
  test: [
    { id: 'topics', t: 'Know which topics are on it' },
    { id: 'paper', t: 'One past paper or practice set, timed' },
    { id: 'shaky', t: 'Go back over the shaky topics' },
    { id: 'sheet', t: 'One-page summary from memory' },
    { id: 'kit', t: 'Pens, calculator, anything else packed' },
    { id: 'sleep', t: 'Early night before' },
  ],
  match: [
    { id: 'when', t: 'Know the time, place and lineup' },
    { id: 'kit', t: 'Kit packed: shoes, knee pads, water' },
    { id: 'rest', t: 'Light day before, nothing heavy' },
    { id: 'food', t: 'Eat 2–3 hours before' },
    { id: 'warm', t: 'Warm-up plan' },
    { id: 'sleep', t: 'Early night before' },
  ],
  race: [
    { id: 'pace', t: 'Pace plan for each part' },
    { id: 'kit', t: 'Kit laid out, bib pinned' },
    { id: 'fuel', t: 'Fuel and water plan' },
    { id: 'travel', t: 'Start time and travel sorted' },
    { id: 'taper', t: 'Easy days before' },
    { id: 'sleep', t: 'Early night before' },
  ],
  chess: [
    { id: 'openings', t: 'Openings refreshed' },
    { id: 'tactics', t: 'Tactics warm-up on the day' },
    { id: 'clock', t: 'Know the time control' },
    { id: 'kit', t: 'Pen, water, a snack' },
    { id: 'sleep', t: 'Early night before' },
  ],
  talk: [
    { id: 'lines', t: 'Opening and closing lines by heart' },
    { id: 'aloud', t: 'Said it out loud twice' },
    { id: 'time', t: 'Timed it' },
    { id: 'questions', t: 'Three questions you might get' },
    { id: 'sleep', t: 'Early night before' },
  ],
  other: [
    { id: 'when', t: 'Know when and where' },
    { id: 'practise', t: 'Practised it' },
    { id: 'kit', t: 'Packed what you need' },
    { id: 'sleep', t: 'Early night before' },
  ],
  maths: [
    { id: 'paper', t: 'One past paper, timed' },
    { id: 'review', t: 'Go over the problems you got wrong' },
    { id: 'kit', t: 'Pencils, ruler, compass, ID' },
    { id: 'sleep', t: 'Early night before' },
  ],
};

export type Outcome = 'win' | 'loss' | 'draw';
export const OUTCOME_LABEL: Record<Outcome, string> = { win: 'Won', loss: 'Lost', draw: 'Drew' };

/** Before and after: the same fields for every kind, all optional. */
export interface Reflection {
  /** What you were aiming for, set before. */
  goal: string;
  /** 1–5: how ready you felt beforehand. */
  ready: number | null;
  /** 1–5: how nervous. */
  nerves: number | null;
  /** 1–5: how it went, in your own eyes. */
  rating: number | null;
  well: string;
  /** What to do differently next time: shown before the next one of its kind. */
  next: string;
}
export const REFLECTION_KEYS = ['goal', 'ready', 'nerves', 'rating', 'well', 'next'] as const;
export const TEXT_MAX = 600;

export interface Show extends Reflection {
  /** The id of the row it lives in (record or log entry). */
  id: string;
  type: StageType;
  source: 'show' | 'mark' | 'sport' | 'maths';
  date: string;
  title: string;
  /** Subtype, subject, sport or contest. */
  kind: string;
  /** The headline: "84%", "Won 2–1", "1:52:10", "Distinction". */
  result: string;
  outcome: Outcome | null;
  /** Placing, if there was one. */
  place: number | null;
  /** Percent, for tests and contests. */
  pct: number | null;
  /** A test sat but not marked yet: no score until it comes back. */
  pending: boolean;
  /** Predicted percent, for tests. */
  predict: number | null;
  /** The calendar occurrence it was for. */
  event: string | null;
  where: string;
  opp: string;
  /** Violin pieces (lt_records ids). */
  pieces: string[];
  sets: [number, number][];
  stats: Record<string, number>;
  km: number | null;
  /** Race time in seconds. */
  secs: number | null;
  minutes: number | null;
}

// ─── reading the rows ───────────────────────────────────────────────────────

const str = (v: unknown, max = TEXT_MAX) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const scale = (v: unknown) => (typeof v === 'number' && v >= 1 && v <= 5 ? Math.round(v) : null);
const day = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
const outcomeOf = (v: unknown): Outcome | null => (v === 'win' || v === 'loss' || v === 'draw' ? v : null);
const placeOf = (v: unknown) => {
  const n = num(v);
  return n != null && n >= 1 ? Math.round(n) : null;
};

export function reflectionOf(d: Record<string, unknown>): Reflection {
  return { goal: str(d.goal), ready: scale(d.ready), nerves: scale(d.nerves), rating: scale(d.rating), well: str(d.well), next: str(d.next) };
}
/** Only the reflection fields that are set, ready to merge into a row's data. */
export function reflectionData(r: Partial<Reflection>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of REFLECTION_KEYS) {
    const v = r[k];
    if (typeof v === 'string' ? v.trim() : v != null) out[k] = typeof v === 'string' ? v.trim().slice(0, TEXT_MAX) : v;
  }
  return out;
}

const blank = (id: string, type: StageType, source: Show['source'], date: string, d: Record<string, unknown>): Show => ({
  id,
  type,
  source,
  date,
  title: '',
  kind: '',
  result: '',
  outcome: null,
  place: null,
  pct: null,
  pending: false,
  predict: null,
  event: str(d.event, 200) || null,
  where: '',
  opp: '',
  pieces: [],
  sets: [],
  stats: {},
  km: null,
  secs: null,
  minutes: null,
  ...reflectionOf(d),
});

export const ordinal = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : (['th', 'st', 'nd', 'rd'][n % 10] ?? 'th')}`;

/** A `pf_show` row: a violin performance, a chess game, a talk or anything else. */
export function showOfRecord(r: LtRecord): Show | null {
  if (r.kind !== 'pf_show' || r.deleted_at) return null;
  const d = r.data ?? {};
  const type = (SHOW_TYPES as string[]).includes(d.type as string) ? (d.type as ShowType) : 'other';
  const date = day(d.date);
  if (!date) return null;
  const s = blank(r.id, type, 'show', date, d);
  s.title = str(d.title, 120) || STAGE_TYPES[type].one;
  s.kind = str(d.kind, 40) || SUBTYPES[type]![0];
  s.where = str(d.where, 120);
  s.opp = str(d.opp, 80);
  s.outcome = outcomeOf(d.outcome);
  s.place = placeOf(d.place);
  s.pieces = Array.isArray(d.pieces) ? d.pieces.filter((p): p is string => typeof p === 'string').slice(0, 30) : [];
  const text = str(d.result, 80);
  s.result = text || (s.outcome ? OUTCOME_LABEL[s.outcome] : s.place ? ordinal(s.place) : s.rating ? '★'.repeat(s.rating) : 'Done');
  return s;
}

/**
 * A Study mark with the Stage's extra fields. A test logged before it's marked has no score yet
 * (`score` null): it shows as waiting, and the Study page leaves it out until the score is in.
 */
export function showOfMark(r: LtRecord): Show | null {
  if (r.kind !== 'study_mark' || r.deleted_at) return null;
  const d = r.data ?? {};
  const score = num(d.score);
  const outOf = num(d.outOf);
  if (typeof d.subject !== 'string' || (outOf != null && outOf <= 0) || (score != null && outOf == null)) return null;
  const s = blank(r.id, 'test', 'mark', day(d.date) ?? r.created_at.slice(0, 10), d);
  s.kind = d.subject;
  s.title = str(d.title, 80) || `${d.subject} test`;
  const grade = str(d.grade, 12);
  if (score == null) {
    s.pending = true;
    s.result = grade || 'Score to come';
  } else {
    s.pct = Math.round((score / outOf!) * 100);
    s.result = `${s.pct}%${grade ? ` · ${grade}` : ''}`;
  }
  const p = num(d.predict);
  s.predict = p != null && p >= 0 && p <= 100 ? Math.round(p) : null;
  s.where = str(d.testKind, 40);
  return s;
}

/** Sets from "25-21, 22-25 15–12": null if any part isn't a pair of scores. */
export function parseSets(text: string): [number, number][] | null {
  const parts = text.split(/[,;/\s]+/).filter(Boolean);
  if (!parts.length) return [];
  const out: [number, number][] = [];
  for (const p of parts) {
    const m = /^(\d{1,3})[-–—:](\d{1,3})$/.exec(p);
    if (!m) return null;
    out.push([+m[1], +m[2]]);
  }
  return out.slice(0, 7);
}
export const setsText = (sets: [number, number][]) => sets.map(([a, b]) => `${a}–${b}`).join(', ');
/** Sets won and lost, and who won the match on sets (null when level or none). */
export function setTally(sets: [number, number][]): { won: number; lost: number; outcome: Outcome | null } {
  const won = sets.filter(([a, b]) => a > b).length;
  const lost = sets.filter(([a, b]) => b > a).length;
  return { won, lost, outcome: !sets.length ? null : won > lost ? 'win' : lost > won ? 'loss' : 'draw' };
}

const pad = (n: number) => String(n).padStart(2, '0');
/** 6730 → "1:52:10", 1500 → "25:00". */
export function timeText(secs: number): string {
  const s = Math.round(secs);
  const h = Math.floor(s / 3600);
  return h ? `${h}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}` : `${Math.floor(s / 60)}:${pad(s % 60)}`;
}
/** "1:52:10", "52:10" or "52" (minutes) → seconds; null if it doesn't read as a time. */
export function parseTime(text: string): number | null {
  const t = text.trim();
  if (!t) return null;
  const parts = t.split(':');
  if (parts.length > 3 || parts.some((p) => !/^\d{1,3}$/.test(p))) return null;
  const n = parts.map(Number);
  if (n.length > 1 && n.slice(1).some((x) => x > 59)) return null;
  const secs = n.length === 3 ? n[0] * 3600 + n[1] * 60 + n[2] : n.length === 2 ? n[0] * 60 + n[1] : n[0] * 60;
  return secs > 0 ? secs : null;
}

/** The standard race a distance is (within 2%), for bests. */
export const RACE_DISTANCES = [
  { id: '5k', name: '5K', km: 5 },
  { id: '10k', name: '10K', km: 10 },
  { id: 'half', name: 'Half marathon', km: 21.0975 },
  { id: 'full', name: 'Marathon', km: 42.195 },
] as const;
export const raceDistance = (km: number | null) => (km ? (RACE_DISTANCES.find((r) => Math.abs(km - r.km) / r.km <= 0.02) ?? null) : null);

/** A sports session that is a match (court sport, type match) or a race (a distance with a race name). */
export function showOfSport(e: { id: string; date: string; minutes: number; note: string | null }, d: Record<string, unknown> | null, sportName: (id: string) => string): Show | null {
  if (!d || typeof d.sport !== 'string') return null;
  if (d.type === 'match') {
    const s = blank(e.id, 'match', 'sport', e.date, d);
    s.kind = sportName(d.sport);
    s.minutes = e.minutes;
    s.opp = str(d.opp, 80);
    s.where = str(d.comp, 80);
    s.title = s.opp ? `vs ${s.opp}` : `${s.kind} match`;
    s.sets = Array.isArray(d.sets) ? d.sets.filter((x): x is [number, number] => Array.isArray(x) && x.length === 2 && x.every((v) => typeof v === 'number')).slice(0, 7) : [];
    const tally = setTally(s.sets);
    s.outcome = outcomeOf(d.result) ?? tally.outcome;
    s.stats = d.stats && typeof d.stats === 'object' ? Object.fromEntries(Object.entries(d.stats as Record<string, unknown>).filter(([, v]) => typeof v === 'number' && v >= 0 && v < 1000) as [string, number][]) : {};
    const score = s.sets.length ? `${tally.won}–${tally.lost}` : str(d.score, 60);
    s.result = [s.outcome ? OUTCOME_LABEL[s.outcome] : '', score].filter(Boolean).join(' ') || 'Played';
    return s;
  }
  const name = str(d.race, 80);
  if (!name) return null;
  const s = blank(e.id, 'race', 'sport', e.date, d);
  s.kind = sportName(d.sport);
  s.title = name;
  s.km = num(d.km);
  s.minutes = e.minutes;
  const secs = num(d.secs);
  s.secs = secs && secs > 0 ? secs : e.minutes * 60;
  s.place = placeOf(d.place);
  s.result = [timeText(s.secs), s.place ? ordinal(s.place) : ''].filter(Boolean).join(' · ');
  return s;
}

/** A real maths contest with a score (practice papers stay on the Maths page). */
export function showOfSitting(s: Sitting): Show | null {
  if (!s.real || !s.date || s.score == null) return null;
  const out = blank(s.id, 'maths', 'maths', s.date, {});
  out.title = s.label;
  out.kind = contestInfo(s.contest).name;
  out.pct = s.max ? Math.round((s.score / s.max) * 100) : null;
  out.result = `${s.score}/${s.max}${s.award ? ` · ${s.award}` : ''}`;
  out.minutes = s.minutes;
  return out;
}

export const byNewest = (a: Show, b: Show) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title);

// ─── the calendar ───────────────────────────────────────────────────────────

/** Which kind of day a calendar event is, or null if it isn't one for the Stage. */
export function eventType(ev: { kind: string; section: string | null; title: string; data?: Record<string, unknown> }): StageType | null {
  const set = ev.data?.stage;
  if (typeof set === 'string' && set in STAGE_TYPES && ev.kind !== 'session') return set as StageType;
  const sec = ev.section;
  if (ev.kind === 'exam') return sec === 'maths' ? 'maths' : 'test';
  if (ev.kind === 'performance') return sec === 'violin' || !sec ? 'violin' : 'talk';
  if (ev.kind !== 'competition') return null;
  if (sec === 'maths') return 'maths';
  if (sec === 'chess') return 'chess';
  if (sec === 'violin') return 'violin';
  if (sec === 'sports') return /race|run|marathon|\b\d+\s?k\b|10k|5k|half|parkrun|swim|tri|ride|cycl/i.test(ev.title) ? 'race' : 'match';
  return 'other';
}

// ─── planning ahead ─────────────────────────────────────────────────────────

/** What you know before the day: kept on the calendar event (`data.plan`) and used to fill the log sheet in later. */
export interface Plan {
  kind: string;
  where: string;
  opp: string;
  comp: string;
  sport: string;
  km: string;
  subject: string;
}
export const PLAN_KEYS: (keyof Plan)[] = ['kind', 'where', 'opp', 'comp', 'sport', 'km', 'subject'];

/** The calendar kind and section each Stage kind is put under, so the Calendar and the other pages see it too. */
export const PLAN_EVENT: Record<Exclude<StageType, 'maths'>, { kind: 'performance' | 'exam' | 'competition'; section: 'violin' | 'study' | 'sports' | 'chess' | null }> = {
  violin: { kind: 'performance', section: 'violin' },
  test: { kind: 'exam', section: 'study' },
  match: { kind: 'competition', section: 'sports' },
  race: { kind: 'competition', section: 'sports' },
  chess: { kind: 'competition', section: 'chess' },
  talk: { kind: 'performance', section: null },
  other: { kind: 'competition', section: null },
};

export function planOf(d: Record<string, unknown> | undefined): Plan {
  const p = (d?.plan && typeof d.plan === 'object' ? d.plan : {}) as Record<string, unknown>;
  const out = {} as Plan;
  for (const k of PLAN_KEYS) out[k] = str(p[k], 120);
  return out;
}

/** The plan as stored: only the fields that have something in them. */
export function planData(p: Partial<Plan>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of PLAN_KEYS) {
    const v = str(p[k], 120);
    if (v) out[k] = v;
  }
  return out;
}

/** A name for the calendar when you didn't type one: "Volleyball vs Tanglin", "Physics test". */
export function planTitle(type: StageType, typed: string, p: Partial<Plan>, sportName: string): string {
  const t = typed.trim();
  if (t) return t.slice(0, 120);
  const opp = str(p.opp, 80);
  if (type === 'match') return opp ? `${sportName} vs ${opp}` : `${sportName} match`;
  if (type === 'test') {
    const subject = str(p.subject, 40);
    const kind = str(p.kind, 30) || 'Test';
    return subject ? `${subject} ${kind.toLowerCase()}` : kind;
  }
  if (type === 'chess') return opp ? `Chess vs ${opp}` : 'Chess game';
  if (type === 'race') return str(p.km, 10) ? `${str(p.km, 10)} km ${sportName.toLowerCase()}` : sportName;
  return `${STAGE_TYPES[type].one}`;
}

/** One line of what's planned: "vs Tanglin · Inter-school league · Court 2 · 16:00". */
export function planLine(type: StageType, p: Plan, start: string | null): string {
  const bits: string[] = [];
  if (type === 'match' && p.opp) bits.push(`vs ${p.opp}`);
  if (type === 'chess' && p.opp) bits.push(`vs ${p.opp}`);
  if (type === 'race' && p.km) bits.push(`${p.km} km`);
  if (type === 'test' && p.subject) bits.push(p.subject);
  if (p.kind && type !== 'match' && type !== 'race') bits.push(p.kind);
  if (p.comp) bits.push(p.comp);
  if (p.where) bits.push(p.where);
  if (start) bits.push(start);
  return bits.join(' · ');
}

/** How long a match is planned for, in minutes, if the event has a start and an end. */
export function plannedMinutes(start: string | null, end: string | null): number | null {
  if (!start || !end) return null;
  const m = +end.slice(0, 2) * 60 + +end.slice(3) - (+start.slice(0, 2) * 60 + +start.slice(3));
  return m > 0 && m <= 480 ? m : null;
}

export interface Prep {
  event: string;
  ticks: string[];
  goal: string;
  ready: number | null;
  nerves: number | null;
  predict: number | null;
}
export function prepOf(r: LtRecord): Prep | null {
  if (r.kind !== 'pf_prep' || r.deleted_at) return null;
  const d = r.data ?? {};
  const event = str(d.event, 200);
  if (!event) return null;
  const p = num(d.predict);
  return { event, ticks: Array.isArray(d.ticks) ? d.ticks.filter((t): t is string => typeof t === 'string') : [], goal: str(d.goal), ready: scale(d.ready), nerves: scale(d.nerves), predict: p != null && p >= 0 && p <= 100 ? Math.round(p) : null };
}

/** The last thing you told yourself for next time about this kind of day, before `date`. */
export function lastNote(shows: Show[], type: StageType, date: string): Show | null {
  return [...shows].filter((s) => s.type === type && s.next && s.date < date).sort(byNewest)[0] ?? null;
}

// ─── patterns ───────────────────────────────────────────────────────────────

const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
const r1 = (n: number | null) => (n == null ? null : Math.round(n * 10) / 10);

export interface SubjectSummary {
  subject: string;
  n: number;
  avg: number;
  best: Show;
  last: Show;
  /** Last mark minus the average of the ones before it (needs 2+). */
  trend: number | null;
  /** Percents, oldest first. */
  line: number[];
}
export function subjectSummaries(tests: Show[]): SubjectSummary[] {
  const by = new Map<string, Show[]>();
  for (const t of tests) if (t.type === 'test' && t.pct != null) by.set(t.kind, [...(by.get(t.kind) ?? []), t]);
  return [...by.entries()]
    .map(([subject, list]) => {
      const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
      const pcts = sorted.map((t) => t.pct!);
      const before = pcts.slice(0, -1);
      return {
        subject,
        n: sorted.length,
        avg: Math.round(mean(pcts)!),
        best: sorted.reduce((a, b) => (b.pct! > a.pct! ? b : a)),
        last: sorted[sorted.length - 1],
        trend: before.length ? Math.round(pcts[pcts.length - 1] - mean(before)!) : null,
        line: pcts.slice(-12),
      };
    })
    .sort((a, b) => b.last.date.localeCompare(a.last.date));
}

/** How far your guesses are off: positive means you did better than you thought. Needs 2+ tests with a guess. */
export function predictionGap(tests: Show[]): { n: number; gap: number; within5: number } | null {
  const list = tests.filter((t) => t.pct != null && t.predict != null);
  if (list.length < 2) return null;
  const d = list.map((t) => t.pct! - t.predict!);
  return { n: list.length, gap: Math.round(mean(d)!), within5: list.filter((t) => Math.abs(t.pct! - t.predict!) <= 5).length };
}

/** Study minutes on a test's subject in the two weeks up to and including its day. */
export function revisionFor(test: Pick<Show, 'kind' | 'date'>, sessions: { date: string; subject: string; minutes: number }[], days = 14): number {
  const from = addDays(test.date, -(days - 1));
  return sessions.filter((s) => s.subject === test.kind && s.date >= from && s.date <= test.date).reduce((a, s) => a + s.minutes, 0);
}

/** Tests with more revision than your median against the rest. Needs 4+ tests and both halves. */
export function revisionSplit(tests: Show[], sessions: { date: string; subject: string; minutes: number }[]): { median: number; more: number; less: number; nMore: number; nLess: number } | null {
  const list = tests.filter((t) => t.type === 'test' && t.pct != null).map((t) => ({ pct: t.pct!, min: revisionFor(t, sessions) }));
  if (list.length < 4) return null;
  const sorted = list.map((x) => x.min).sort((a, b) => a - b);
  const median = sorted[Math.floor((sorted.length - 1) / 2)];
  const more = list.filter((x) => x.min > median);
  const less = list.filter((x) => x.min <= median);
  if (!more.length || !less.length) return null;
  return { median, more: Math.round(mean(more.map((x) => x.pct))!), less: Math.round(mean(less.map((x) => x.pct))!), nMore: more.length, nLess: less.length };
}

export interface WinLoss {
  played: number;
  won: number;
  lost: number;
  drawn: number;
  /** Newest first, up to five. */
  form: Outcome[];
  /** Current run of the same result, newest back. */
  streak: { outcome: Outcome; n: number } | null;
  setsWon: number;
  setsLost: number;
}
/** Win–loss for a list of matches or games (only those with a result count). */
export function recordOf(list: Show[]): WinLoss {
  const done = list.filter((s) => s.outcome).sort(byNewest);
  let streak: WinLoss['streak'] = null;
  for (const s of done) {
    if (!streak) streak = { outcome: s.outcome!, n: 1 };
    else if (s.outcome === streak.outcome) streak.n++;
    else break;
  }
  let setsWon = 0;
  let setsLost = 0;
  for (const s of list) {
    const t = setTally(s.sets);
    setsWon += t.won;
    setsLost += t.lost;
  }
  return {
    played: done.length,
    won: done.filter((s) => s.outcome === 'win').length,
    lost: done.filter((s) => s.outcome === 'loss').length,
    drawn: done.filter((s) => s.outcome === 'draw').length,
    form: done.slice(0, 5).map((s) => s.outcome!),
    streak,
    setsWon,
    setsLost,
  };
}

/** Results against each opponent you've met, most played first. */
export function headToHead(list: Show[]): { opp: string; won: number; lost: number; drawn: number; last: string }[] {
  const by = new Map<string, Show[]>();
  for (const s of list) {
    if (!s.opp || !s.outcome) continue;
    const k = s.opp.toLowerCase();
    by.set(k, [...(by.get(k) ?? []), s]);
  }
  return [...by.values()]
    .map((l) => {
      const r = recordOf(l);
      return { opp: [...l].sort(byNewest)[0].opp, won: r.won, lost: r.lost, drawn: r.drawn, last: [...l].sort(byNewest)[0].date };
    })
    .sort((a, b) => b.won + b.lost + b.drawn - (a.won + a.lost + a.drawn) || b.last.localeCompare(a.last));
}

/** Average of each stat over the matches where it was counted, and the best single match. */
export function statAverages(list: Show[], ids: string[]): { id: string; avg: number; best: number; n: number }[] {
  return ids
    .map((id) => {
      const v = list.map((s) => s.stats[id]).filter((x): x is number => typeof x === 'number');
      return { id, avg: r1(mean(v)) ?? 0, best: v.length ? Math.max(...v) : 0, n: v.length };
    })
    .filter((x) => x.n > 0);
}

/** Fastest time at each standard distance. */
export function raceBests(races: Show[]): { id: string; name: string; best: Show }[] {
  const out: { id: string; name: string; best: Show }[] = [];
  for (const r of RACE_DISTANCES) {
    const list = races.filter((s) => s.type === 'race' && s.secs && raceDistance(s.km)?.id === r.id);
    if (list.length) out.push({ id: r.id, name: r.name, best: list.reduce((a, b) => (b.secs! < a.secs! ? b : a)) });
  }
  return out;
}
/** Whether this race was a best at its distance when it was run (the first one counts). */
export function wasPb(race: Show, races: Show[]): boolean {
  const dist = raceDistance(race.km);
  const mine = race.secs;
  if (!dist || !mine) return false;
  return !races.some((s) => s.id !== race.id && s.secs && raceDistance(s.km)?.id === dist.id && s.date <= race.date && s.secs <= mine && (s.date < race.date || s.secs < mine));
}

/** Points from chess games, 1 a win and ½ a draw, by event name. */
export function chessEvents(games: Show[]): { name: string; points: number; games: number; last: string }[] {
  const by = new Map<string, Show[]>();
  for (const g of games) if (g.type === 'chess' && g.outcome) by.set(g.title, [...(by.get(g.title) ?? []), g]);
  return [...by.entries()]
    .map(([name, l]) => ({ name, points: l.reduce((a, g) => a + (g.outcome === 'win' ? 1 : g.outcome === 'draw' ? 0.5 : 0), 0), games: l.length, last: [...l].sort(byNewest)[0].date }))
    .sort((a, b) => b.last.localeCompare(a.last));
}

export interface Split {
  hi: number;
  lo: number;
  nHi: number;
  nLo: number;
}
function split(list: { v: number; rating: number }[], isHi: (v: number) => boolean): Split | null {
  const hi = list.filter((x) => isHi(x.v));
  const lo = list.filter((x) => !isHi(x.v));
  if (hi.length < 2 || lo.length < 2) return null;
  return { hi: r1(mean(hi.map((x) => x.rating)))!, lo: r1(mean(lo.map((x) => x.rating)))!, nHi: hi.length, nLo: lo.length };
}
/** Your own rating of how it went when you felt ready (4–5) against when you didn't. Needs 2+ each side. */
export const readySplit = (shows: Show[]) => split(shows.filter((s) => s.ready != null && s.rating != null).map((s) => ({ v: s.ready!, rating: s.rating! })), (v) => v >= 4);
/** The same for nerves: very nervous (4–5) against calmer. */
export const nervesSplit = (shows: Show[]) => split(shows.filter((s) => s.nerves != null && s.rating != null).map((s) => ({ v: s.nerves!, rating: s.rating! })), (v) => v >= 4);
/** The same for sleep the night before (the night named after the day itself): 7½ hours or more against less. */
export function sleepSplit(shows: Show[], sleepOn: (date: string) => number | null): Split | null {
  return split(
    shows.flatMap((s) => {
      const m = s.rating != null ? sleepOn(s.date) : null;
      return m != null && m > 0 ? [{ v: m, rating: s.rating! }] : [];
    }),
    (v) => v >= 450,
  );
}

export interface Trophy {
  show: Show;
  why: string;
  tier: 'gold' | 'silver' | 'bronze';
}
/** The moments worth a shelf: wins in big events, podiums, top marks, bests, five stars. Newest first. */
export function trophies(shows: Show[]): Trophy[] {
  const races = shows.filter((s) => s.type === 'race');
  const out: Trophy[] = [];
  for (const s of shows) {
    if (s.place === 1) out.push({ show: s, why: 'First place', tier: 'gold' });
    else if (s.place === 2) out.push({ show: s, why: 'Second place', tier: 'silver' });
    else if (s.place === 3) out.push({ show: s, why: 'Third place', tier: 'bronze' });
    else if (s.type === 'race' && wasPb(s, races)) out.push({ show: s, why: `Best ${raceDistance(s.km)!.name}`, tier: 'silver' });
    else if ((s.type === 'test' || s.type === 'maths') && s.pct != null && s.pct >= 90) out.push({ show: s, why: s.pct >= 98 ? 'Near perfect' : 'Top mark', tier: s.pct >= 98 ? 'gold' : 'silver' });
    else if (/distinction|gold|winner|champion/i.test(s.result)) out.push({ show: s, why: 'Distinction', tier: 'gold' });
    else if (s.rating === 5) out.push({ show: s, why: 'Five stars', tier: 'bronze' });
    else if (s.type === 'match' && s.outcome === 'win' && s.sets.length && setTally(s.sets).lost === 0 && s.sets.length >= 2) out.push({ show: s, why: 'Clean sweep', tier: 'bronze' });
  }
  return out.sort((a, b) => byNewest(a.show, b.show));
}

/** One line about where you stand, for Home. */
export function stageLine(shows: Show[], next: { title: string; date: string } | null, today: string): string {
  if (next) {
    const n = Math.round((Date.parse(next.date) - Date.parse(today)) / 86400000);
    return `${next.title} ${n === 0 ? 'today' : n === 1 ? 'tomorrow' : `in ${n} days`}`;
  }
  const month = shows.filter((s) => s.date.slice(0, 7) === today.slice(0, 7)).length;
  if (month) return `${month} this month`;
  return shows.length ? `${shows.length} on record` : 'Performances, tests, matches and races';
}
