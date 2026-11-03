/**
 * Maths' changes. A real contest with a date is also a calendar event (kind competition, tagged
 * `data.maths`), which is how it reaches Home, Next move and Future's honours list. Time on a paper
 * is a Daily Log entry whose id the sitting remembers. Everything goes through `withReward`, so what a
 * save earned comes straight from the records.
 */
import { closeSheet, openSheet } from '../../app/sheets';
import { ltToday, sectionEntries, sectionRecords, withReward } from '../../data/lt';
import { deleteRecord, saveRecord } from '../../data/records';
import { deleteSession, saveSession } from '../../data/sessions';
import { commit, data, type DataState } from '../../data/store';
import type { LtEvent } from '../../data/types';
import { uuid } from '../../lib/random';
import { amcScore, contestInfo, mathsSession, problemOf, SEASON_2026, sittingOf, withAttempt, type Attempt, type ContestId, type MathsDetail, type MathsSession, type Outcome, type Problem, type Sitting, type Topic } from '../../domain/maths/model';
import { focusStore, startFocus } from '../focus/focus';

const now = () => new Date().toISOString();

export const sittingsIn = (st: DataState): Sitting[] => sectionRecords(st, 'maths', 'sitting').map(sittingOf).filter((s): s is Sitting => !!s);
export const problemsIn = (st: DataState): Problem[] => sectionRecords(st, 'maths', 'problem').map(problemOf).filter((p): p is Problem => !!p);
export const sessionsIn = (st: DataState): MathsSession[] => sectionEntries<MathsDetail>(st, 'maths').map((s) => mathsSession(s.entry, s.detail));

// ─── the calendar ───────────────────────────────────────────────────────────

/** Bring the calendar in line with the real contests. Changes only what differs, and keeps a start time set there. */
export function syncContestEvents() {
  const st = data.get();
  const t = now();
  const want = sittingsIn(st).filter((s) => s.real && s.date);
  const mine = [...st.lt_events.values()].filter((e) => !e.deleted_at && typeof e.data.maths === 'string');
  const rows: LtEvent[] = [];
  for (const s of want) {
    const hit = mine.find((e) => e.data.maths === s.id);
    const title = s.label.slice(0, 120);
    if (!hit) rows.push({ id: uuid(), title, section: 'maths', kind: 'competition', date: s.date!, start: null, end: null, repeat: null, exceptions: {}, note: null, data: { maths: s.id }, cancelled_at: null, created_at: t, updated_at: t, deleted_at: null });
    else if (hit.title !== title || hit.date !== s.date) rows.push({ ...hit, title, date: s.date!, updated_at: t });
  }
  for (const e of mine) if (!want.some((s) => s.id === e.data.maths)) rows.push({ ...e, deleted_at: t, updated_at: t });
  if (rows.length) commit('lt_events', rows);
}

// ─── sittings ───────────────────────────────────────────────────────────────

export interface SittingForm {
  contest: ContestId;
  label: string;
  date: string | null;
  real: boolean;
  /** Typed total, for contests that only have one. */
  total: string;
  max: string;
  correct: number;
  blank: number;
  /** Typed marks per problem. */
  marks: string[];
  award: string;
  note: string;
  minutes: string;
}

export const blankSitting = (contest: ContestId, real: boolean, today: string): SittingForm => ({
  contest,
  label: '',
  date: real ? null : today,
  real,
  total: '',
  max: String(contestInfo(contest).max),
  correct: 0,
  blank: 0,
  marks: Array.from({ length: contestInfo(contest).scoring === 'marks' ? contestInfo(contest).questions : 0 }, () => ''),
  award: '',
  note: '',
  minutes: '',
});

export function formOfSitting(s: Sitting): SittingForm {
  const info = contestInfo(s.contest);
  return {
    contest: s.contest,
    label: s.label,
    date: s.date,
    real: s.real,
    total: info.scoring === 'total' && s.score != null ? String(s.score) : '',
    max: String(s.max),
    correct: s.correct ?? 0,
    blank: s.blank ?? 0,
    marks: info.scoring === 'marks' ? Array.from({ length: info.questions }, (_, i) => (s.marks[i] == null ? '' : String(s.marks[i]))) : [],
    award: s.award,
    note: s.note,
    minutes: s.minutes == null ? '' : String(s.minutes),
  };
}

const typed = (v: string): number | null => (v.trim() === '' || !Number.isFinite(Number(v)) ? null : Number(v));

/** The score a form adds up to, or null if nothing's been entered. An AMC paper with nothing filled in isn't marked yet. */
export function formScore(f: SittingForm): number | null {
  const scoring = contestInfo(f.contest).scoring;
  if (scoring === 'amc') return f.correct || f.blank ? amcScore(f.correct, f.blank) : null;
  if (scoring === 'marks') {
    const marks = f.marks.map(typed).filter((m): m is number => m != null);
    return marks.length ? marks.reduce((a, b) => a + b, 0) : null;
  }
  return typed(f.total);
}

/** What's wrong with a form, or null. */
export function checkSitting(f: SittingForm, today: string): string | null {
  const info = contestInfo(f.contest);
  const score = formScore(f);
  const max = typed(f.max) ?? info.max;
  if (f.contest === 'other' && !f.label.trim()) return 'What was the contest called?';
  if (max <= 0) return 'The maximum has to be more than 0.';
  if (!f.real && !f.date) return 'Which day did you do it?';
  if (score != null && !f.date) return 'A score needs a date.';
  if (score != null && f.date! > today) return "That day hasn't happened yet, so it can't have a score.";
  if (info.scoring === 'amc' && f.correct + f.blank > info.questions) return `Right and blank add up to more than ${info.questions} questions.`;
  if (info.scoring === 'marks') {
    const each = info.max / info.questions;
    if (f.marks.some((m) => (typed(m) ?? 0) < 0 || (typed(m) ?? 0) > each)) return `Each problem is out of ${each}.`;
  }
  if (score != null && (score < 0 || score > max)) return `The score has to be between 0 and ${max}.`;
  if (typed(f.minutes) != null && (typed(f.minutes)! <= 0 || typed(f.minutes)! > 1440)) return 'Minutes should be between 1 and 1440.';
  return null;
}

/** Save a paper and its time. Returns an error message, or null. */
export function saveSitting(f: SittingForm, id?: string | null): string | null {
  const today = ltToday();
  const bad = checkSitting(f, today);
  if (bad) return bad;
  const info = contestInfo(f.contest);
  const score = formScore(f);
  const minutes = typed(f.minutes);
  const label = f.label.trim().slice(0, 80) || info.name;
  const value: Record<string, unknown> = {
    contest: f.contest,
    label,
    real: f.real,
    max: typed(f.max) ?? info.max,
    ...(f.date ? { date: f.date } : {}),
    ...(score != null ? { score } : {}),
    ...(info.scoring === 'amc' && score != null ? { correct: f.correct, blank: f.blank } : {}),
    ...(info.scoring === 'marks' && score != null ? { marks: f.marks.map(typed) } : {}),
    ...(f.award.trim() ? { award: f.award.trim().slice(0, 60) } : {}),
    ...(f.note.trim() ? { note: f.note.trim().slice(0, 2000) } : {}),
    ...(minutes != null ? { minutes: Math.round(minutes) } : {}),
  };
  const before = id ? data.get().lt_records.get(id) : undefined;
  const oldEntry = before ? sittingOf(before)?.entryId ?? null : null;
  let err: string | null = null;
  withReward(() => {
    const saved = saveRecord('maths', 'sitting', value, id);
    const live = oldEntry && !data.get().log_entries.get(oldEntry)?.deleted_at ? oldEntry : null;
    if (minutes != null && f.date && f.date <= today) {
      const kind = f.real ? 'Contest' : 'Past paper';
      const r = saveSession({ section: 'maths', date: f.date, minutes: Math.round(minutes), note: null, subcategory: kind, detail: { kind, paper: label, sittingId: saved.id } }, live);
      if ('error' in r) err = r.error;
      else saveRecord('maths', 'sitting', { ...value, entryId: r.id }, saved.id);
    } else if (live) {
      deleteSession(live, 'Time for this paper removed');
    }
  });
  syncContestEvents();
  clearTimerMock();
  return err;
}

/** The paper goes; its time stays in the Daily Log, because it was still time spent. */
export function removeSitting(s: Sitting) {
  deleteRecord(s.id, s.entryId ? 'Paper deleted · its time stays in the log' : 'Paper deleted');
  syncContestEvents();
}

/** Add this season's contests. Skips any already there; returns how many were added. */
export function addSeason(amcDate: string): number {
  const have = new Set(sittingsIn(data.get()).map((s) => s.label.toLowerCase()));
  const todo = SEASON_2026.filter((s) => !have.has(s.label.toLowerCase()));
  if (!todo.length) return 0;
  withReward(() => {
    for (const s of todo) {
      saveRecord('maths', 'sitting', {
        contest: s.contest,
        label: s.label,
        real: true,
        max: contestInfo(s.contest).max,
        date: s.contest === 'amc12' ? amcDate : s.date,
        ...(s.score != null ? { score: s.score } : {}),
      });
    }
  });
  syncContestEvents();
  return todo.length;
}

// ─── sessions ───────────────────────────────────────────────────────────────

export interface MathsForm {
  kind: string;
  topic: Topic | null;
  minutes: number;
  date: string;
  note: string;
}

export function logMaths(f: MathsForm, editId?: string | null): string | null {
  let err: string | null = null;
  withReward(() => {
    const r = saveSession({ section: 'maths', date: f.date, minutes: f.minutes, note: f.note, subcategory: f.kind, detail: { kind: f.kind, ...(f.topic ? { topic: f.topic } : {}) } }, editId);
    if ('error' in r) {
      err = r.error;
      return false;
    }
    return true;
  });
  return err;
}

// ─── the notebook ───────────────────────────────────────────────────────────

export interface ProblemForm {
  title: string;
  topic: Topic | null;
  statement: string;
  idea: string;
}

/** Save a problem. `attempt` adds a go at it; editing the words alone doesn't. */
export function saveProblem(f: ProblemForm, attempt: { date: string; outcome: Outcome } | null, id?: string | null) {
  const rec = id ? data.get().lt_records.get(id) : undefined;
  const prev: Attempt[] = rec ? problemOf(rec)?.attempts ?? [] : [];
  const attempts = attempt ? withAttempt(prev, attempt.date, attempt.outcome) : prev;
  const value = {
    title: f.title.trim().slice(0, 120),
    ...(f.topic ? { topic: f.topic } : {}),
    ...(f.statement.trim() ? { statement: f.statement.trim().slice(0, 4000) } : {}),
    ...(f.idea.trim() ? { idea: f.idea.trim().slice(0, 4000) } : {}),
    attempts,
  };
  withReward(() => {
    saveRecord('maths', 'problem', value, id);
  });
}

// ─── a practice paper against the clock ─────────────────────────────────────

const TIMER_MOCK = 'lifetracker-maths-timer-mock';

/** Start the focus timer at a contest's length. Its minutes come back to that paper's sheet. */
export function startMock(contest: ContestId) {
  try {
    localStorage.setItem(TIMER_MOCK, contest);
  } catch {
    /* private mode: the minutes come back to the plain log sheet */
  }
  if (!focusStore.get().focus) startFocus('maths', contestInfo(contest).minutes);
  closeSheet();
  openSheet({ type: 'focus' });
}

/** The contest a finished timer was a practice paper for, if it was. A later plain timer doesn't count. */
export function timerMock(): ContestId | null {
  try {
    const id = localStorage.getItem(TIMER_MOCK) as ContestId | null;
    const f = focusStore.get().focus;
    return id && f?.section === 'maths' && f.goal === contestInfo(id).minutes ? id : null;
  } catch {
    return null;
  }
}

function clearTimerMock() {
  try {
    localStorage.removeItem(TIMER_MOCK);
  } catch {
    /* nothing to clear */
  }
}
