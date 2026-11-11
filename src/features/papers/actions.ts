/**
 * Past papers: reading and writing the ppq_* rows (lt_records, study section, no migration).
 * Papers, hard questions and booklets have ids derived from their keys, so two devices ticking
 * the same paper write the same row. No catalogue import here: the Study desk and Home use this.
 */
import { sectionRecords } from '../../data/lt';
import { pairId } from '../../data/logActions';
import { saveRecord } from '../../data/records';
import { commit, data, type DataState } from '../../data/store';
import type { LtRecord } from '../../data/types';
import { afterRetry, firstRetry, hardMarkOf, mistakeOf, paperMarkOf, PAPER_KINDS, retryOrder, type HardMark, type Mistake, type MistakeWhy, type PaperMark } from '../../domain/papers/records';

const SECTION = 'study' as const;
const now = () => new Date().toISOString();

export interface PapersState {
  marks: Map<string, PaperMark>;
  hard: Map<string, HardMark>;
  /** Topic booklets done: key → day. */
  booklets: Map<string, string>;
  mistakes: Mistake[];
}

export function papersIn(st: DataState): PapersState {
  const marks = new Map<string, PaperMark>();
  for (const r of sectionRecords(st, SECTION, PAPER_KINDS.paper)) {
    const m = paperMarkOf(r);
    if (m) marks.set(m.paper, m);
  }
  const hard = new Map<string, HardMark>();
  for (const r of sectionRecords(st, SECTION, PAPER_KINDS.hard)) {
    const m = hardMarkOf(r);
    if (m) hard.set(m.key, m);
  }
  const booklets = new Map<string, string>();
  for (const r of sectionRecords(st, SECTION, PAPER_KINDS.topic)) if (typeof r.data.key === 'string' && typeof r.data.done === 'string') booklets.set(r.data.key, r.data.done);
  const mistakes = sectionRecords(st, SECTION, PAPER_KINDS.mistake)
    .map(mistakeOf)
    .filter((m): m is Mistake => !!m)
    .sort((a, b) => b.date.localeCompare(a.date));
  return { marks, hard, booklets, mistakes };
}

/** Everything due for a retry today, hard questions and mistakes together. */
export function dueCount(s: PapersState, today: string): number {
  return retryOrder([...s.hard.values()], today).due.length + retryOrder(s.mistakes, today).due.length;
}

/** One line for the ways in. */
export function papersLine(s: PapersState, today: string): string {
  const done = [...s.marks.values()].filter((m) => m.done).length;
  const hard = [...s.hard.values()].filter((m) => m.state === 'done').length;
  const due = dueCount(s, today);
  const parts = [
    done ? `${done} ${done === 1 ? 'paper' : 'papers'} done` : 'Every paper to 2021, ticked off as you go',
    hard ? `${hard} hard ${hard === 1 ? 'question' : 'questions'}` : null,
    due ? `${due} to retry today` : null,
  ];
  return parts.filter(Boolean).join(' · ');
}

function upsert(id: string, kind: string, value: Record<string, unknown>) {
  const prev = data.get().lt_records.get(id);
  const t = now();
  const row: LtRecord = prev
    ? { ...prev, data: value, deleted_at: null, updated_at: t }
    : {
        id,
        section: SECTION,
        kind,
        data: value,
        sort_order: 0,
        archived_at: null,
        created_at: t,
        updated_at: t,
        deleted_at: null,
      };
  commit('lt_records', [row]);
}
function remove(id: string) {
  const prev = data.get().lt_records.get(id);
  if (prev && !prev.deleted_at) commit('lt_records', [{ ...prev, deleted_at: now(), updated_at: now() }]);
}

const paperRowId = (paper: string) => pairId('ppq:paper', paper);
const current = (paper: string): PaperMark | null => {
  const r = data.get().lt_records.get(paperRowId(paper));
  return r && !r.deleted_at ? paperMarkOf(r) : null;
};

/** Writes a paper's row; a row with nothing left in it is removed. */
export function savePaper(m: PaperMark) {
  if (!m.done && !m.mock) return remove(paperRowId(m.paper));
  upsert(paperRowId(m.paper), PAPER_KINDS.paper, { ...m });
}

export function togglePaperDone(paper: string, today: string) {
  const m = current(paper) ?? {
    paper,
    done: null,
    score: null,
    outOf: null,
    minutes: null,
    mock: false,
    markId: null,
  };
  savePaper(m.done ? { ...m, done: null, score: null, outOf: null, minutes: null } : { ...m, done: today, mock: false });
}

export function setMock(papers: string[], on: boolean) {
  for (const paper of papers) {
    const m = current(paper) ?? {
      paper,
      done: null,
      score: null,
      outOf: null,
      minutes: null,
      mock: false,
      markId: null,
    };
    if (m.done && on) continue;
    savePaper({ ...m, mock: on });
  }
}

/** The score also goes into Study's marks (one mark per paper, updated in place) when asked. */
export function saveScore(
  paper: string,
  v: {
    done: string;
    score: number | null;
    outOf: number | null;
    minutes: number | null;
  },
  mark: { subject: string; title: string } | null,
) {
  const prev = current(paper);
  let markId = prev?.markId ?? null;
  if (mark && v.score != null && v.outOf) {
    const old = markId ? data.get().lt_records.get(markId) : undefined;
    markId = saveRecord(
      SECTION,
      'study_mark',
      {
        ...(old && !old.deleted_at ? old.data : {}),
        subject: mark.subject,
        title: mark.title.slice(0, 80),
        score: v.score,
        outOf: v.outOf,
        date: v.done,
      },
      old && !old.deleted_at ? markId : null,
    ).id;
  }
  savePaper({
    paper,
    done: v.done,
    score: v.score,
    outOf: v.outOf,
    minutes: v.minutes,
    mock: false,
    markId,
  });
}

// ── Hard questions ──

const hardRowId = (key: string) => pairId('ppq:hard', key);

export function setHard(key: string, state: 'done' | 'wrong' | null, today: string) {
  if (!state) return remove(hardRowId(key));
  const r = state === 'wrong' ? firstRetry(today) : null;
  upsert(hardRowId(key), PAPER_KINDS.hard, {
    key,
    state,
    date: today,
    ...(r ? { step: r.step, due: r.due } : {}),
  });
}

export function retryHard(m: HardMark, right: boolean, today: string) {
  if (!m.retry) return;
  const next = afterRetry(m.retry, right, today);
  if (!next)
    return upsert(hardRowId(m.key), PAPER_KINDS.hard, {
      key: m.key,
      state: 'done',
      date: today,
    });
  upsert(hardRowId(m.key), PAPER_KINDS.hard, {
    key: m.key,
    state: 'wrong',
    date: m.date,
    step: next.step,
    due: next.due,
  });
}

// ── Topic booklets ──

export function toggleBooklet(key: string, today: string) {
  const id = pairId('ppq:topic', key);
  const prev = data.get().lt_records.get(id);
  if (prev && !prev.deleted_at) return remove(id);
  upsert(id, PAPER_KINDS.topic, { key, done: today });
}

// ── Mistakes ──

export interface MistakeInput {
  subject: string;
  paper: string;
  q: string;
  topic: string;
  why: MistakeWhy;
  note: string;
  date: string;
}

export function saveMistake(m: MistakeInput, id?: string) {
  const prev = id ? data.get().lt_records.get(id) : undefined;
  const keep = prev && !prev.deleted_at ? prev.data : null;
  const r = keep && typeof keep.due === 'string' ? { step: Number(keep.step) || 0, due: keep.due } : keep?.fixed ? null : firstRetry(m.date);
  return saveRecord(
    SECTION,
    PAPER_KINDS.mistake,
    {
      subject: m.subject,
      paper: m.paper.slice(0, 80),
      q: m.q.trim().slice(0, 30),
      topic: m.topic.trim().slice(0, 80),
      why: m.why,
      note: m.note.trim().slice(0, 600),
      date: m.date,
      ...(r ? { step: r.step, due: r.due } : {}),
      ...(keep?.fixed ? { fixed: keep.fixed } : {}),
    },
    id,
  );
}

export function retryMistake(m: Mistake, right: boolean, today: string) {
  if (!m.retry) return;
  const rec = data.get().lt_records.get(m.id);
  if (!rec) return;
  const next = afterRetry(m.retry, right, today);
  const rest = { ...rec.data };
  delete rest.due;
  delete rest.step;
  commit('lt_records', [
    {
      ...rec,
      data: next ? { ...rest, step: next.step, due: next.due } : { ...rest, fixed: today },
      updated_at: now(),
    },
  ]);
}
