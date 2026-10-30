export const KINDS = ['link', 'video', 'article', 'paper', 'photo', 'music', 'quote', 'note'] as const;
export type Kind = (typeof KINDS)[number];

export const STATUSES = ['none', 'up_next', 'in_progress', 'done'] as const;
export type Status = (typeof STATUSES)[number];

export const ROOM_COLORS = [
  'mustard', 'sage', 'blue', 'rose', 'lavender', 'apricot',
  'teal', 'forest', 'olive', 'lemon', 'coral', 'cherry', 'magenta', 'plum', 'sky', 'navy', 'slate', 'charcoal',
] as const;
export type RoomColor = (typeof ROOM_COLORS)[number];

export type ViewName = 'shelves' | 'collage' | 'map' | 'mind';
export type Theme = 'system' | 'light' | 'dark';
/** Colour schemes for the whole cabinet; each has a daylight and a night version. */
export const PALETTES = [
  'kraft', 'reading-room', 'blueprint', 'pressed-rose', 'white-cube', 'observatory',
  'sea-glass', 'terracotta', 'citrus', 'graphite', 'candy', 'sunset',
] as const;
export type Palette = (typeof PALETTES)[number];
/** Design themes: each restyles the whole layout (type, cards, header, sidebar), independent of the colours. */
export const DESIGNS = ['cabinet', 'gallery', 'zine', 'archive', 'soft'] as const;
export type Design = (typeof DESIGNS)[number];

/** Metadata cached from the link-preview function (or filled in by hand for examples). */
export interface Preview {
  site_name?: string;
  description?: string;
  thumbnail?: string;
  favicon?: string;
  embed?: { provider: string; src: string; aspect?: number };
  fetched_at?: string;
  ok?: boolean;
}

export interface Item {
  id: string;
  kind: Kind;
  title: string;
  url: string | null;
  creator: string | null;
  body: string | null;
  note: string | null;
  room_id: string | null;
  tags: string[];
  status: Status;
  favourite: boolean;
  image_path: string | null;
  preview: Preview | null;
  accession_no: number | null;
  collage_pos: { x: number; y: number } | null;
  is_example: boolean;
  created_at: string;
  updated_at: string;
  last_opened_at: string | null;
  deleted_at: string | null;
}

export interface Room {
  id: string;
  name: string;
  color: RoomColor;
  description: string | null;
  sort_order: number;
  is_example: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Connection {
  id: string;
  item_a: string;
  item_b: string;
  label: string | null;
  is_example: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/** A Daily Log topic (parent_id null) or one of its subcategories (one level only). */
export interface LogTopic {
  id: string;
  parent_id: string | null;
  name: string;
  /** Only top-level topics' colours are shown; subcategories use their topic's. */
  color: RoomColor;
  sort_order: number;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/** Time spent on a topic on one calendar day, entered by hand after the fact. */
export interface LogEntry {
  id: string;
  /** Calendar date YYYY-MM-DD in the Daily Log time zone; never derived from a timestamp. */
  date: string;
  topic_id: string;
  subcategory_id: string | null;
  minutes: number;
  note: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * A weekly goal for a top-level topic, in force from week_start (a Monday) until a later
 * revision. minutes null means the goal was removed from that week on.
 */
export interface LogGoal {
  id: string;
  topic_id: string;
  week_start: string;
  minutes: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export const LOG_METRICS = ['sleep', 'screen', 'sleep_score'] as const;
/**
 * Sleep (the night before `date`, counted on the morning you wake), that night's sleep
 * score out of 100, and screen time that day.
 */
export type LogMetric = (typeof LOG_METRICS)[number];

/**
 * One day's sleep or screen time. Unlike entries these aren't added up: there is one row per
 * metric per day, and setting it again replaces the number. Clearing it soft-deletes the row.
 */
export interface LogDayMetric {
  id: string;
  date: string;
  metric: LogMetric;
  /** Minutes for sleep and screen time; for sleep_score, the score (0–100). */
  minutes: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export const TODO_PRIORITIES = ['high', 'normal', 'low'] as const;
export type TodoPriority = (typeof TODO_PRIORITIES)[number];

/** One thing I want to do. Finishing it stamps done_at; unticking clears it. */
export interface Todo {
  id: string;
  title: string;
  priority: TodoPriority;
  /** LifeTracker: the section this task belongs to (added column; AnyStop keeps it when it round-trips the row). */
  section?: SectionId | null;
  /** Calendar date YYYY-MM-DD, or null when there is no deadline. */
  due: string | null;
  done_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/** The five stages of the Road to IOI page, in order. */
export const ROAD_STAGES = ['joi1', 'joi2', 'final', 'camp', 'ioi'] as const;
export type RoadStageId = (typeof ROAD_STAGES)[number];

export interface RoadStage {
  /** Contest day (YYYY-MM-DD), or null until known; DragonCode's targets fill a missing one. */
  date: string | null;
  /** Start time in Japan time (HH:MM), or null. */
  time: string | null;
  target: string;
  /** Why this stage matters, in my words. */
  reason: string;
  /** The day I qualified (cleared the stage), or null. */
  cleared_on: string | null;
  /** A line about the moment, written once it is cleared. */
  memory: string;
}

/** Road to IOI: my training arc. Training days come from a Daily Log topic and from DragonCode. */
export interface RoadSettings {
  /** "Why do I want this?", in one sentence. */
  why: string;
  /** The Daily Log topic whose entries count as training (sessions saved on the page go there too). */
  topic_id: string | null;
  /** DragonCode's address and the read-only link key from its Settings. Empty when not linked. */
  dragon_url: string;
  dragon_key: string;
  stages: Record<RoadStageId, RoadStage>;
  /** My own dates for the season's other contests (NOI, USACO, APIO), keyed by calendar id, over the built-in ones. */
  events: Record<string, RoadEvent>;
}

/** A contest on the season calendar as I set it: an exact day replacing a rough one, or hidden from the page. */
export interface RoadEvent {
  date: string | null;
  /** Start time (HH:MM) in the contest's own time zone, or null. */
  time: string | null;
  hidden: boolean;
}

const stage = (date: string | null = null, time: string | null = null): RoadStage => ({ date, time, target: '', reason: '', cleared_on: null, memory: '' });

export const DEFAULT_DRAGON_URL = 'https://dragon-academy-sigma.vercel.app';

export const DEFAULT_ROAD: RoadSettings = {
  why: '',
  topic_id: null,
  dragon_url: DEFAULT_DRAGON_URL,
  dragon_key: '',
  // JOI 2027 qualifier dates from the official schedule (ioi-jp.org/joi-2027/tournament_info); the rest are set on the page.
  // Later stages fall back to the published schedule in features/road/calendar.ts until a date is set here.
  stages: { joi1: stage('2026-10-25', '14:00'), joi2: stage('2026-11-29', '13:00'), final: stage(), camp: stage(), ioi: stage() },
  events: {},
};

/** Fill in anything an older or partial copy is missing, so the page can trust the shape. */
export function normaliseRoad(raw: unknown): RoadSettings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<RoadSettings>;
  const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback);
  const orNull = (v: unknown) => (typeof v === 'string' && v ? v : null);
  const stages = {} as Record<RoadStageId, RoadStage>;
  for (const id of ROAD_STAGES) {
    const given = (r.stages?.[id] ?? null) as Partial<RoadStage> | null;
    const base = DEFAULT_ROAD.stages[id];
    stages[id] = given
      ? { date: orNull(given.date), time: orNull(given.time), target: str(given.target), reason: str(given.reason), cleared_on: orNull(given.cleared_on), memory: str(given.memory) }
      : { ...base };
  }
  const events: Record<string, RoadEvent> = {};
  if (r.events && typeof r.events === 'object') {
    for (const [id, raw] of Object.entries(r.events as Record<string, unknown>)) {
      if (!raw || typeof raw !== 'object') continue;
      const e = raw as Partial<RoadEvent>;
      events[id] = { date: orNull(e.date), time: orNull(e.time), hidden: e.hidden === true };
    }
  }
  return {
    why: str(r.why),
    topic_id: orNull(r.topic_id),
    dragon_url: str(r.dragon_url, DEFAULT_DRAGON_URL) || DEFAULT_DRAGON_URL,
    dragon_key: str(r.dragon_key),
    stages,
    events,
  };
}

export interface Settings {
  museum_name: string;
  default_view: ViewName;
  theme: Theme;
  palette: Palette;
  design: Design;
  examples_seeded: boolean;
  /** IANA zone that decides what "today" and week boundaries mean in the Daily Log. */
  log_timezone: string;
  road: RoadSettings;
  updated_at: string;
}

// ─── LifeTracker additions (lt_ tables; AnyStop never reads them) ──────────

/** The channels of LifeTracker. Calendar, tasks and progress are shared utilities, not sections. */
export const SECTION_IDS = ['violin', 'coding', 'sports', 'gym', 'study', 'chess', 'sleep', 'screen', 'cabinet'] as const;
export type SectionId = (typeof SECTION_IDS)[number];
/** Sections whose activity is time logged as Daily Log entries. */
export const TIMED_SECTIONS = ['violin', 'coding', 'sports', 'gym', 'study', 'chess'] as const;
export type TimedSection = (typeof TIMED_SECTIONS)[number];

/**
 * Structured detail for one Daily Log entry (same id as the entry). The entry stays the one
 * authoritative record of "minutes on a day"; this only adds what a section needs on top
 * (violin pieces, a run's distance, gym sets). A detail whose entry is gone is ignored.
 */
export interface LtDetail {
  id: string;
  section: TimedSection;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type EventKind = 'session' | 'exam' | 'performance' | 'competition' | 'school' | 'other';
export interface EventException {
  cancelled?: boolean;
  /** Moved to another day. */
  date?: string;
  start?: string;
  end?: string;
}
export type RepeatFreq = 'daily' | 'weekly' | 'monthly' | 'yearly';
/**
 * How an event (or a repeating task) recurs, counted from its first day. Older events only have
 * `days` and `until`: they are weekly, every week.
 */
export interface Repeat {
  freq?: RepeatFreq;
  /** Every n days / weeks / months / years (default 1). */
  every?: number;
  /** Weekly: 0 = Monday … 6 = Sunday (same as the Daily Log's weekdayIndex). Empty otherwise. */
  days: number[];
  /** Monthly: on the same date (default) or the same weekday, e.g. the 2nd Tuesday or the last Friday. */
  by?: 'date' | 'weekday';
  /** Last day it may land on, or null for no end. */
  until: string | null;
}
/** A calendar event. With `repeat` it recurs from `date` (see Repeat) until `until`. */
export interface LtEvent {
  id: string;
  title: string;
  section: SectionId | null;
  kind: EventKind;
  /** First (or only) day, YYYY-MM-DD. */
  date: string;
  /** HH:MM, or null for all-day. */
  start: string | null;
  end: string | null;
  repeat: Repeat | null;
  /** Per-occurrence changes, keyed by the occurrence's original date. */
  exceptions: Record<string, EventException>;
  note: string | null;
  data: Record<string, unknown>;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/** Bed and wake times for the night before `date`. Its duration also goes into log_metrics (sleep). */
export interface LtNight {
  id: string;
  date: string;
  bed: string | null;
  wake: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type DayMarkKind = 'rest';
/** A day marked on purpose, e.g. a planned rest day (keeps the streak). One per kind per day. */
export interface LtDayMark {
  id: string;
  date: string;
  kind: DayMarkKind;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/** Things a section keeps: repertoire, gym templates, marks, study notes. `kind` says which. */
export interface LtRecord {
  id: string;
  section: SectionId;
  kind: string;
  data: Record<string, unknown>;
  sort_order: number;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/** One thing on the bucket list. Done when `done_at` is set; `data` keeps extras (e.g. a rarity later). */
export interface LtBucket {
  id: string;
  title: string;
  note: string | null;
  done_at: string | null;
  sort_order: number;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/** Synced preferences, one row per key (section ↔ topic mapping, targets, sleep schedule…). */
export interface LtPref {
  id: string;
  value: unknown;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface Records {
  rooms: Room;
  items: Item;
  connections: Connection;
  log_topics: LogTopic;
  log_entries: LogEntry;
  log_goals: LogGoal;
  log_metrics: LogDayMetric;
  todos: Todo;
  lt_records: LtRecord;
  lt_details: LtDetail;
  lt_events: LtEvent;
  lt_nights: LtNight;
  lt_day_marks: LtDayMark;
  lt_prefs: LtPref;
  lt_bucket: LtBucket;
}
export type TableName = keyof Records;
export type RecordOf<T extends TableName> = Records[T];
/** Push order matters: rooms before the items that use them, items before strings, topics before entries. */
export const TABLES: TableName[] = [
  'rooms', 'items', 'connections', 'log_topics', 'log_entries', 'log_goals', 'log_metrics', 'todos',
  'lt_records', 'lt_details', 'lt_events', 'lt_nights', 'lt_day_marks', 'lt_prefs', 'lt_bucket',
];
/** The tables that existed in Curio Cabinet; the rest are LifeTracker's own. */
export const ANYSTOP_TABLES: TableName[] = ['rooms', 'items', 'connections', 'log_topics', 'log_entries', 'log_goals', 'log_metrics', 'todos'];

export const DEFAULT_SETTINGS: Settings = {
  museum_name: 'Curio Cabinet',
  default_view: 'shelves',
  theme: 'system',
  palette: 'kraft',
  design: 'cabinet',
  examples_seeded: false,
  log_timezone: 'Asia/Singapore',
  road: DEFAULT_ROAD,
  updated_at: new Date(0).toISOString(),
};
