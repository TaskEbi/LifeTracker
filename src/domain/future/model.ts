/**
 * Future (CH10): university prep and plans. Everything is an lt_records row in the 'future'
 * section, one kind per thing: a university on the shortlist, a test, a grade, an activity or
 * honour, an essay, a story for the story bank, a programme or competition, a career path, an age
 * on the life timeline, a person to contact. Readers here turn a row's data into a typed value and
 * never throw on an odd one (it is skipped).
 */
import type { LtRecord } from '../../data/types';

export const FUTURE_KINDS = ['uni', 'test', 'grade', 'activity', 'essay', 'story', 'program', 'career', 'age', 'contact'] as const;
export type FutureKind = (typeof FUTURE_KINDS)[number];

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const day = (v: unknown) => (typeof v === 'string' && DATE.test(v) ? v : null);
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const pick = <T extends string>(v: unknown, list: readonly T[], fallback: T): T => (list.includes(v as T) ? (v as T) : fallback);
const list = <T>(v: unknown, each: (x: unknown) => T | null, max = 50): T[] => (Array.isArray(v) ? v.map(each).filter((x): x is T => x !== null).slice(0, max) : []);
const dates = (v: unknown): Record<string, string> => {
  const out: Record<string, string> = {};
  if (v && typeof v === 'object') for (const [k, d] of Object.entries(v)) if (day(d)) out[k] = d as string;
  return out;
};

export interface Check {
  id: string;
  label: string;
  done: boolean;
}
const check = (x: unknown): Check | null => {
  const c = x as Partial<Check>;
  return c && typeof c.label === 'string' && c.label.trim() ? { id: str(c.id, 40) || c.label, label: str(c.label, 120), done: !!c.done } : null;
};

// ─── universities ───────────────────────────────────────────────────────────

export const UNI_STATUSES = ['researching', 'applying', 'submitted', 'interview', 'offer', 'waitlist', 'rejected', 'accepted', 'declined'] as const;
export type UniStatus = (typeof UNI_STATUSES)[number];
export const UNI_STATUS_LABEL: Record<UniStatus, string> = {
  researching: 'Researching',
  applying: 'Applying',
  submitted: 'Submitted',
  interview: 'Interview',
  offer: 'Offer',
  waitlist: 'Waitlist',
  rejected: 'Rejected',
  accepted: 'Accepted',
  declined: 'Declined',
};
/** Sent off: the application has left. */
export const isSent = (s: UniStatus) => !['researching', 'applying'].includes(s);
export const TIERS = ['reach', 'target', 'safety'] as const;
export type Tier = (typeof TIERS)[number];
export const COUNTRIES = ['US', 'UK', 'Other'] as const;
export type Country = (typeof COUNTRIES)[number];

export interface Uni {
  id: string;
  name: string;
  country: Country;
  course: string;
  tier: Tier | null;
  /** How it's applied to: EA, REA, ED, RD, UCAS… */
  plan: string;
  deadline: string | null;
  interview: string | null;
  tests: string[];
  /** Music options there (joint degree, dual degree, minor…). */
  music: string;
  status: UniStatus;
  /** The day each status was first reached. */
  statusAt: Record<string, string>;
  checklist: Check[];
  /** The user has checked the facts against the official site (presets start unchecked). */
  checked: boolean;
  url: string;
  notes: string;
  order: number;
}
export function uniOf(r: LtRecord): Uni | null {
  const d = r.data;
  const name = str(d.name, 80);
  if (r.kind !== 'uni' || !name) return null;
  return {
    id: r.id,
    name,
    country: pick(d.country, COUNTRIES, 'Other'),
    course: str(d.course, 120),
    tier: TIERS.includes(d.tier as Tier) ? (d.tier as Tier) : null,
    plan: str(d.plan, 40),
    deadline: day(d.deadline),
    interview: day(d.interview),
    tests: list(d.tests, (x) => str(x, 20) || null, 8),
    music: str(d.music, 300),
    status: pick(d.status, UNI_STATUSES, 'researching'),
    statusAt: dates(d.statusAt),
    checklist: list(d.checklist, check, 30),
    checked: !!d.checked,
    url: str(d.url, 300),
    notes: str(d.notes, 2000),
    order: r.sort_order,
  };
}

// ─── tests ──────────────────────────────────────────────────────────────────

export interface TestScale {
  min: number;
  max: number;
  step: number;
  /** Section scores, if the test has them (SAT: reading & writing, maths). */
  parts?: string[];
}
export const TEST_SCALES: Record<string, TestScale> = {
  SAT: { min: 400, max: 1600, step: 10, parts: ['Reading & Writing', 'Maths'] },
  ACT: { min: 1, max: 36, step: 1 },
  TMUA: { min: 1, max: 9, step: 0.1 },
  ESAT: { min: 1, max: 9, step: 0.1 },
  MAT: { min: 0, max: 100, step: 1 },
  IELTS: { min: 0, max: 9, step: 0.5 },
};
export const scaleOf = (name: string): TestScale => TEST_SCALES[name] ?? { min: 0, max: 100, step: 1 };

export interface Score {
  date: string;
  score: number;
  official: boolean;
  parts: Record<string, number>;
  note: string;
}
export interface Sitting {
  date: string;
  registered: boolean;
}
export interface TestPlan {
  id: string;
  name: string;
  target: number | null;
  sittings: Sitting[];
  scores: Score[];
  notes: string;
}
export function testOf(r: LtRecord): TestPlan | null {
  const d = r.data;
  const name = str(d.name, 20);
  if (r.kind !== 'test' || !name) return null;
  return {
    id: r.id,
    name,
    target: num(d.target),
    sittings: list(d.sittings, (x) => {
      const s = x as Partial<Sitting>;
      return day(s?.date) ? { date: s.date as string, registered: !!s.registered } : null;
    }).sort((a, b) => a.date.localeCompare(b.date)),
    scores: list(
      d.scores,
      (x) => {
        const s = x as Partial<Score>;
        if (!day(s?.date) || num(s.score) === null) return null;
        const parts: Record<string, number> = {};
        if (s.parts && typeof s.parts === 'object') for (const [k, v] of Object.entries(s.parts)) if (num(v) !== null) parts[k] = v as number;
        return { date: s.date as string, score: s.score as number, official: !!s.official, parts, note: str(s.note, 200) };
      },
      200,
    ).sort((a, b) => a.date.localeCompare(b.date)),
    notes: str(d.notes, 2000),
  };
}
/** Best official score, best practice score and the latest one. */
export function testSummary(t: TestPlan) {
  const best = (l: Score[]) => l.reduce<Score | null>((m, s) => (!m || s.score > m.score ? s : m), null);
  return { official: best(t.scores.filter((s) => s.official)), practice: best(t.scores.filter((s) => !s.official)), last: t.scores.at(-1) ?? null };
}

// ─── grades ─────────────────────────────────────────────────────────────────

export const A_LEVEL_GRADES = ['A*', 'A', 'B', 'C', 'D', 'E', 'U'] as const;
export interface Grade {
  id: string;
  subject: string;
  target: string;
  predicted: string;
  achieved: string;
}
export function gradeOf(r: LtRecord): Grade | null {
  const d = r.data;
  const subject = str(d.subject, 40);
  if (r.kind !== 'grade' || !subject) return null;
  return { id: r.id, subject, target: str(d.target, 4), predicted: str(d.predicted, 4), achieved: str(d.achieved, 4) };
}

// ─── activities and honours ─────────────────────────────────────────────────

export const ACTIVITY_TYPES = ['activity', 'honor'] as const;
export const HONOR_LEVELS = ['School', 'Regional', 'National', 'International'] as const;
/** Common App's activity list allows 10 activities and 5 honours, with these lengths. */
export const ACTIVITY_LIMITS = { activities: 10, honors: 5, title: 50, org: 100, desc: 150, honorTitle: 100 } as const;
export const SCHOOL_YEARS = [10, 11, 12, 13] as const;

export interface Activity {
  id: string;
  type: (typeof ACTIVITY_TYPES)[number];
  title: string;
  org: string;
  role: string;
  desc: string;
  hoursPerWeek: number | null;
  weeksPerYear: number | null;
  years: number[];
  level: string;
  /** What it was suggested from (a section), if anything. */
  source: string;
  order: number;
}
export function activityOf(r: LtRecord): Activity | null {
  const d = r.data;
  const title = str(d.title, 120);
  if (r.kind !== 'activity' || !title) return null;
  return {
    id: r.id,
    type: pick(d.type, ACTIVITY_TYPES, 'activity'),
    title,
    org: str(d.org, 120),
    role: str(d.role, 60),
    desc: str(d.desc, 400),
    hoursPerWeek: num(d.hoursPerWeek),
    weeksPerYear: num(d.weeksPerYear),
    years: list(d.years, (x) => (typeof x === 'number' && Number.isInteger(x) ? x : null), 6),
    level: str(d.level, 20),
    source: str(d.source, 30),
    order: r.sort_order,
  };
}

// ─── essays and the story bank ──────────────────────────────────────────────

export const ESSAY_STATUSES = ['idea', 'outline', 'drafting', 'review', 'final'] as const;
export type EssayStatus = (typeof ESSAY_STATUSES)[number];
export const ESSAY_STATUS_LABEL: Record<EssayStatus, string> = { idea: 'Idea', outline: 'Outline', drafting: 'Drafting', review: 'Review', final: 'Final' };
export const ESSAY_KINDS = ['common', 'ucas', 'supplement', 'other'] as const;
export type EssayKind = (typeof ESSAY_KINDS)[number];
export interface Limit {
  unit: 'words' | 'chars';
  n: number;
}
/** UCAS: three questions, 4,000 characters between them, at least 350 each (from 2026 entry). */
export const UCAS_QUESTIONS = [
  'Why do you want to study this course or subject?',
  'How have your qualifications and studies helped you to prepare for this course or subject?',
  'What else have you done to prepare outside of education, and why are these experiences useful?',
] as const;
export const UCAS_MIN_PART = 350;
export const ESSAY_DEFAULTS: Record<EssayKind, { title: string; limit: Limit }> = {
  common: { title: 'Common App personal essay', limit: { unit: 'words', n: 650 } },
  ucas: { title: 'UCAS personal statement', limit: { unit: 'chars', n: 4000 } },
  supplement: { title: 'Supplement', limit: { unit: 'words', n: 250 } },
  other: { title: 'Essay', limit: { unit: 'words', n: 500 } },
};
/** Common App's seven prompts, in short (the full wording is on the Common App site). */
export const COMMON_PROMPTS = [
  'A background, identity, interest or talent so meaningful your application would be incomplete without it',
  'A challenge, setback or failure, and what you learned',
  'A time you questioned or challenged a belief or idea',
  'Something someone did for you that made you thankful, and how it affected you',
  'An accomplishment or event that sparked growth and a new understanding',
  'A topic or idea so engaging you lose track of time',
  'A topic of your choice',
] as const;

export interface Version {
  at: string;
  text: string;
}
export interface Essay {
  id: string;
  kind: EssayKind;
  title: string;
  /** The university a supplement is for (a uni record id). */
  uniId: string | null;
  prompt: string;
  limit: Limit;
  /** One part per UCAS question; one part otherwise. */
  parts: string[];
  status: EssayStatus;
  statusAt: Record<string, string>;
  versions: Version[];
  stories: string[];
  deadline: string | null;
}
export function essayOf(r: LtRecord): Essay | null {
  const d = r.data;
  if (r.kind !== 'essay') return null;
  const kind = pick(d.kind, ESSAY_KINDS, 'other');
  const lim = d.limit as Partial<Limit> | undefined;
  const limit: Limit = lim && (lim.unit === 'words' || lim.unit === 'chars') && num(lim.n) ? { unit: lim.unit, n: lim.n as number } : ESSAY_DEFAULTS[kind].limit;
  const parts = list(d.parts, (x) => (typeof x === 'string' ? x.slice(0, 6000) : null), 3);
  return {
    id: r.id,
    kind,
    title: str(d.title, 120) || ESSAY_DEFAULTS[kind].title,
    uniId: str(d.uniId, 40) || null,
    prompt: str(d.prompt, 1000),
    limit,
    parts: kind === 'ucas' ? [0, 1, 2].map((i) => parts[i] ?? '') : [parts[0] ?? ''],
    status: pick(d.status, ESSAY_STATUSES, 'idea'),
    statusAt: dates(d.statusAt),
    versions: list(d.versions, (x) => {
      const v = x as Partial<Version>;
      return typeof v?.at === 'string' && typeof v.text === 'string' ? { at: v.at, text: v.text } : null;
    }, 8),
    stories: list(d.stories, (x) => str(x, 40) || null, 20),
    deadline: day(d.deadline),
  };
}
export const wordCount = (text: string) => (text.trim() ? text.trim().split(/\s+/).length : 0);
export const essayText = (e: Pick<Essay, 'parts'>) => e.parts.join('\n\n');
/** How much of the limit is used: the whole essay's count, and for UCAS each part's characters. */
export function essayCount(e: Pick<Essay, 'parts' | 'limit' | 'kind'>) {
  const used = e.limit.unit === 'words' ? e.parts.reduce((n, p) => n + wordCount(p), 0) : e.parts.reduce((n, p) => n + p.length, 0);
  const shortParts = e.kind === 'ucas' ? e.parts.map((p, i) => [i, p.length] as const).filter(([, n]) => n < UCAS_MIN_PART).map(([i]) => i) : [];
  return { used, left: e.limit.n - used, over: used > e.limit.n, shortParts };
}
/** Versions kept on a record: the newest few, small enough for the row (32 KB). */
export function keepVersions(versions: Version[], max = 5, budget = 20_000): Version[] {
  const out: Version[] = [];
  let size = 0;
  for (const v of [...versions].sort((a, b) => b.at.localeCompare(a.at))) {
    if (out.length >= max || size + v.text.length > budget) break;
    out.push(v);
    size += v.text.length;
  }
  return out;
}

export interface Story {
  id: string;
  title: string;
  text: string;
  tags: string[];
}
export function storyOf(r: LtRecord): Story | null {
  const d = r.data;
  const title = str(d.title, 120);
  if (r.kind !== 'story' || !title) return null;
  return { id: r.id, title, text: str(d.text, 3000), tags: list(d.tags, (x) => str(x, 24) || null, 8) };
}

// ─── programmes and competitions ────────────────────────────────────────────

export const PROGRAM_STATUSES = ['considering', 'applying', 'applied', 'accepted', 'rejected', 'done'] as const;
export type ProgramStatus = (typeof PROGRAM_STATUSES)[number];
export const PROGRAM_STATUS_LABEL: Record<ProgramStatus, string> = { considering: 'Considering', applying: 'Applying', applied: 'Applied', accepted: 'Accepted', rejected: 'Not this time', done: 'Done' };
export interface Program {
  id: string;
  name: string;
  kind: 'program' | 'competition';
  deadline: string | null;
  start: string | null;
  end: string | null;
  status: ProgramStatus;
  statusAt: Record<string, string>;
  result: string;
  checked: boolean;
  url: string;
  notes: string;
}
export function programOf(r: LtRecord): Program | null {
  const d = r.data;
  const name = str(d.name, 100);
  if (r.kind !== 'program' || !name) return null;
  return {
    id: r.id,
    name,
    kind: d.kind === 'competition' ? 'competition' : 'program',
    deadline: day(d.deadline),
    start: day(d.start),
    end: day(d.end),
    status: pick(d.status, PROGRAM_STATUSES, 'considering'),
    statusAt: dates(d.statusAt),
    result: str(d.result, 120),
    checked: !!d.checked,
    url: str(d.url, 300),
    notes: str(d.notes, 2000),
  };
}

// ─── careers, the life timeline, people ─────────────────────────────────────

export interface Career {
  id: string;
  name: string;
  why: string;
  needs: string;
  steps: Check[];
  /** 1–5: how much it pulls right now. */
  pull: number;
}
export function careerOf(r: LtRecord): Career | null {
  const d = r.data;
  const name = str(d.name, 80);
  if (r.kind !== 'career' || !name) return null;
  const pull = num(d.pull);
  return { id: r.id, name, why: str(d.why, 1000), needs: str(d.needs, 1000), steps: list(d.steps, check, 20), pull: pull && pull >= 1 && pull <= 5 ? Math.round(pull) : 3 };
}

export interface Age {
  id: string;
  age: number;
  text: string;
  /** Bucket-list items hung on this age. */
  bucket: string[];
}
export function ageOf(r: LtRecord): Age | null {
  const d = r.data;
  const age = num(d.age);
  if (r.kind !== 'age' || age === null || age < 10 || age > 100) return null;
  return { id: r.id, age: Math.round(age), text: str(d.text, 2000), bucket: list(d.bucket, (x) => str(x, 40) || null, 30) };
}

export const CONTACT_STATUSES = ['idea', 'contacted', 'replied', 'meeting', 'working', 'done', 'no-reply'] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];
export const CONTACT_STATUS_LABEL: Record<ContactStatus, string> = { idea: 'To contact', contacted: 'Contacted', replied: 'Replied', meeting: 'Meeting', working: 'Working together', done: 'Done', 'no-reply': 'No reply' };
export const CONTACT_KINDS = ['professor', 'research', 'internship', 'mentor'] as const;
export interface Contact {
  id: string;
  name: string;
  org: string;
  kind: (typeof CONTACT_KINDS)[number];
  status: ContactStatus;
  statusAt: Record<string, string>;
  next: string | null;
  notes: string;
}
export function contactOf(r: LtRecord): Contact | null {
  const d = r.data;
  const name = str(d.name, 100);
  if (r.kind !== 'contact' || !name) return null;
  return {
    id: r.id,
    name,
    org: str(d.org, 120),
    kind: pick(d.kind, CONTACT_KINDS, 'research'),
    status: pick(d.status, CONTACT_STATUSES, 'idea'),
    statusAt: dates(d.statusAt),
    next: day(d.next),
    notes: str(d.notes, 2000),
  };
}

/** The profile: entry year and birth year (for the timeline by age), kept in lt_prefs 'future_profile'. */
export interface FutureProfile {
  entryYear: number;
  birthYear: number | null;
}
export function profileOf(v: unknown): FutureProfile {
  const p = (v && typeof v === 'object' ? v : {}) as Partial<FutureProfile>;
  const y = (x: unknown, lo: number, hi: number) => (typeof x === 'number' && Number.isInteger(x) && x >= lo && x <= hi ? x : null);
  return { entryYear: y(p.entryYear, 2020, 2100) ?? 2028, birthYear: y(p.birthYear, 1950, 2030) };
}

/** Record the day a status was first reached (kept if it goes back and forth). */
export function stampStatus(statusAt: Record<string, string>, status: string, today: string): Record<string, string> {
  return statusAt[status] ? statusAt : { ...statusAt, [status]: today };
}
