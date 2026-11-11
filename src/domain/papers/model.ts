/**
 * The paper list and the hard questions, read from the generated catalogue. Pure, tested.
 * Ids: a paper is "<unit code>|<session>" (e.g. "WPH11|January 2019"), a hard question is
 * "<unit code>|<session>|<question>", a topic booklet is "<unit code>|<set>|<name>".
 */
import { PMT_BASE, REPORT_BASE, TOPIC_BOOKLETS, UNITS, type UnitRow } from './catalogue';
import { HARD, HARD_TOPICS, hardKey, type HardQ, type HardUnit, type Tier } from './hard';
import { pctOf, type HardMark, type PaperMark } from './records';

export type Subject = UnitRow['subject'];
export const SUBJECTS: Subject[] = ['Physics', 'Maths', 'Further Maths', 'Computer Science'];
export const BOARD: Record<Subject, string> = {
  Physics: 'Edexcel International A Level (WPH1x)',
  Maths: 'Edexcel International A Level (WMA, WME, WST, WDM)',
  'Further Maths': 'Edexcel International A Level (WFM)',
  'Computer Science': 'Cambridge International A Level 9618',
};

export interface Paper {
  id: string;
  unit: UnitRow;
  session: string;
  /** "Jan 2019", "Jun 2021 v2", "Specimen". */
  short: string;
  year: number;
  qp: string;
  ms: string | null;
  ma: string | null;
  er: string | null;
}

const enc = (path: string) => PMT_BASE + path.split('/').map(encodeURIComponent).join('/');
const fileOf = (u: UnitRow, s: string, t: 'QP' | 'MS' | 'MA') => enc(u.tpl.replace('{S}', s).replaceAll('{T}', t));

export function shortSession(s: string): string {
  if (s.startsWith('Specimen')) return s.replace(/[()]/g, '');
  const m = s.match(/^(\w{3})\w*\s+(\d{4})(.*)$/);
  if (!m) return s;
  const extra = m[3]
    .trim()
    .replace(/^\(v(\d)\)$/, 'v$1')
    .replace(/^\(R\)$/, '(R)')
    .replace(/^\(IAL\)$/, 'IAL');
  return `${m[1]} ${m[2]}${extra ? ` ${extra}` : ''}`;
}

function papersFor(u: UnitRow): Paper[] {
  return u.s.map((row) => {
    const [session, docs = '', er] = row.split('|');
    const year = Number(session.match(/\d{4}/)?.[0] ?? 0);
    return {
      id: `${u.code}|${session}`,
      unit: u,
      session,
      short: shortSession(session),
      year,
      qp: fileOf(u, session, 'QP'),
      ms: docs.includes('m') ? fileOf(u, session, 'MS') : null,
      ma: docs.includes('a') ? fileOf(u, session, 'MA') : null,
      er: er
        ? REPORT_BASE +
          er
            .split('/')
            .map((p) => encodeURIComponent(decodeURIComponent(p)))
            .join('/')
        : null,
    };
  });
}

let all: Paper[] | null = null;
let byId: Map<string, Paper> | null = null;
export function allPapers(): Paper[] {
  all ??= UNITS.flatMap(papersFor);
  return all;
}
export function paperById(id: string): Paper | undefined {
  byId ??= new Map(allPapers().map((p) => [p.id, p]));
  return byId.get(id);
}
export const unitsOf = (subject: Subject) => UNITS.filter((u) => u.subject === subject);
export const unitByCode = (code: string) => UNITS.find((u) => u.code === code);
export const papersOfUnit = (code: string) => allPapers().filter((p) => p.unit.code === code);

/** Usual length and marks, for pre-filling a score. Check the paper's cover. */
const TYPICAL: Record<string, { minutes: number; marks: number }> = {
  WPH11: { minutes: 90, marks: 80 },
  WPH12: { minutes: 90, marks: 80 },
  WPH13: { minutes: 80, marks: 50 },
  WPH14: { minutes: 105, marks: 90 },
  WPH15: { minutes: 105, marks: 90 },
  WPH16: { minutes: 80, marks: 50 },
  WPH01: { minutes: 90, marks: 80 },
  WPH02: { minutes: 90, marks: 80 },
  WPH04: { minutes: 95, marks: 80 },
  WPH05: { minutes: 95, marks: 80 },
  WMA11: { minutes: 90, marks: 75 },
  WMA12: { minutes: 120, marks: 125 },
  WMA13: { minutes: 90, marks: 75 },
  WMA14: { minutes: 120, marks: 125 },
  '9618/1': { minutes: 90, marks: 75 },
  '9618/2': { minutes: 120, marks: 75 },
  '9618/3': { minutes: 90, marks: 75 },
  '9618/4': { minutes: 150, marks: 75 },
  '9608/1': { minutes: 90, marks: 75 },
  '9608/2': { minutes: 120, marks: 75 },
  '9608/3': { minutes: 90, marks: 75 },
  '9608/4': { minutes: 120, marks: 75 },
};
export function typicalOf(code: string): { minutes: number; marks: number } | null {
  if (TYPICAL[code]) return TYPICAL[code];
  return /^W(ME|ST|FM|DM)/.test(code) ? { minutes: 90, marks: 75 } : null;
}

export interface UnitProgress {
  done: number;
  total: number;
  /** Average % of the papers with a score. */
  avg: number | null;
  kept: number;
}
export function unitProgress(papers: Paper[], marks: Map<string, PaperMark>): UnitProgress {
  let done = 0;
  let kept = 0;
  const pcts: number[] = [];
  for (const p of papers) {
    const m = marks.get(p.id);
    if (m?.done) done++;
    if (m?.mock && !m.done) kept++;
    const pc = m?.done ? pctOf(m) : null;
    if (pc != null) pcts.push(pc);
  }
  return {
    done,
    total: papers.length,
    avg: pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : null,
    kept,
  };
}

/** The paper to do next in a unit: the oldest real paper not done and not kept for a mock; specimens last. */
export function nextPaper(papers: Paper[], marks: Map<string, PaperMark>): Paper | null {
  const open = papers.filter((p) => !marks.get(p.id)?.done && !marks.get(p.id)?.mock);
  return open.find((p) => p.year > 0 && !p.session.startsWith('Specimen')) ?? open[0] ?? null;
}

/** Keeps the newest n papers that aren't done as mock papers. Returns the ids to mark. */
export function newestForMocks(papers: Paper[], marks: Map<string, PaperMark>, n: number): string[] {
  return papers
    .filter((p) => !p.session.startsWith('Specimen') && !marks.get(p.id)?.done)
    .slice(-n)
    .map((p) => p.id);
}

// ── Hard questions ──

export interface HardItem extends HardQ {
  key: string;
  paper: Paper | undefined;
  topic: string;
}
let hardItems: HardItem[] | null = null;
export function hardList(): HardItem[] {
  hardItems ??= HARD.map((h) => ({
    ...h,
    key: hardKey(h),
    paper: paperById(`${h.u}|${h.s}`),
    topic: HARD_TOPICS.find((t) => t.id === h.t)?.name ?? h.t,
  }));
  return hardItems;
}

export interface HardFilter {
  unit: HardUnit | 'all';
  topic: string;
  tier: Tier | 0;
  search: string;
  hideDone: boolean;
  mcqOnly: boolean;
  /** Only the ones marked wrong. */
  wrongOnly: boolean;
}
export const NO_FILTER: HardFilter = {
  unit: 'all',
  topic: 'all',
  tier: 0,
  search: '',
  hideDone: false,
  mcqOnly: false,
  wrongOnly: false,
};

export function matchHard(h: HardItem, f: HardFilter, marks: Map<string, HardMark>): boolean {
  if (f.unit !== 'all' && h.u !== f.unit) return false;
  if (f.topic !== 'all' && h.t !== f.topic) return false;
  if (f.tier && h.tier !== f.tier) return false;
  if (f.mcqOnly && !h.mcq) return false;
  const m = marks.get(h.key);
  if (f.hideDone && m?.state === 'done') return false;
  if (f.wrongOnly && m?.state !== 'wrong') return false;
  const words = f.search.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length) {
    const hay = [h.u, h.s, h.paper?.short, h.q, h.title, h.note, h.topic, h.mcq ? 'multiple choice mcq' : ''].join(' ').toLowerCase();
    if (!words.every((w) => hay.includes(w))) return false;
  }
  return true;
}

/** Hardest first, then by session, then question. */
export function sortHard(list: HardItem[]): HardItem[] {
  const order = (s: string) => Number(s.match(/\d{4}/)?.[0] ?? 0) * 100 + (s.startsWith('Jan') ? 1 : s.startsWith('Jun') ? 6 : 10);
  return [...list].sort((a, b) => a.tier - b.tier || order(a.s) - order(b.s) || a.u.localeCompare(b.u) || a.q.localeCompare(b.q, 'en', { numeric: true }));
}

export function topicCounts(
  unit: HardUnit | 'all',
  marks: Map<string, HardMark>,
): {
  id: string;
  name: string;
  unit: HardUnit;
  total: number;
  done: number;
  wrong: number;
}[] {
  return HARD_TOPICS.filter((t) => unit === 'all' || t.unit === unit).map((t) => {
    const qs = hardList().filter((h) => h.t === t.id);
    return {
      ...t,
      total: qs.length,
      done: qs.filter((h) => marks.get(h.key)?.state === 'done').length,
      wrong: qs.filter((h) => marks.get(h.key)?.state === 'wrong').length,
    };
  });
}

/** A question to try: not done yet, the hardest tier still open, picked with r in [0, 1). */
export function pickHard(list: HardItem[], marks: Map<string, HardMark>, r: number): HardItem | null {
  const open = list.filter((h) => marks.get(h.key)?.state !== 'done');
  if (!open.length) return null;
  const tier = Math.min(...open.map((h) => h.tier));
  const top = open.filter((h) => h.tier === tier);
  return top[Math.min(top.length - 1, Math.floor(r * top.length))];
}

// ── Topic booklets ──

export interface Booklet {
  key: string;
  unit: string;
  set: string;
  name: string;
  qp: string;
  ms: string | null;
}
export const bookletPage = (code: string) => TOPIC_BOOKLETS.find((t) => t.unit === code)?.page ?? null;
export function bookletsOf(code: string): Booklet[] {
  const row = TOPIC_BOOKLETS.find((t) => t.unit === code);
  return (row?.items ?? []).map((i) => ({
    key: `${code}|${i.set}|${i.name}`,
    unit: code,
    set: i.set,
    name: i.name,
    qp: enc(i.dir + i.qp),
    ms: i.ms ? enc(i.dir + i.ms) : null,
  }));
}

/** Physics booklet names start with the spec section ("1.3 Motion"); maths ones are older UK modules. */
export const BOOKLET_NOTE: Record<string, string> = {
  WMA11: 'From the old UK C1 papers, which cover most of P1.',
  WMA12: 'From the old UK C2 papers, which cover most of P2.',
  WME01: 'From the old UK M1 papers: the same content as IAL M1.',
  WST01: 'From the old UK S1 papers: the same content as IAL S1.',
  WFM01: 'From the old UK FP1 papers, which cover most of F1.',
  WDM11: 'From the old UK D1 papers: close to IAL D1.',
};
