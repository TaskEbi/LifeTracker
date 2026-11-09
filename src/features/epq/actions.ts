/**
 * EPQ records: lt_records under the study section (no migration). The project and each day's
 * word count have ids derived from fixed keys, so two devices write the same row.
 * Hours are Study sessions with the project's subject, so they earn Study XP like any session.
 */
import { prefValue, sectionEntries, sectionRecords, setPref } from '../../data/lt';
import { pairId } from '../../data/logActions';
import { saveRecord } from '../../data/records';
import { commit, data, type DataState } from '../../data/store';
import type { LtRecord } from '../../data/types';
import {
  EPQ_SUBJECT,
  logOf,
  milestoneOf,
  plannedMilestones,
  projectOf,
  sortMilestones,
  sourceOf,
  wordHistory,
  wordsOf,
  type EpqProject,
  type LogEntry,
  type Milestone,
  type Source,
  type WordDay,
} from '../../domain/epq/model';
import { DEFAULT_SUBJECTS, isStudyDetail, type StudyDetail } from '../study/model';

const SECTION = 'study' as const;
const PROJECT_ID = pairId('epq', 'project');
const now = () => new Date().toISOString();

export interface EpqState {
  project: EpqProject | null;
  milestones: Milestone[];
  log: LogEntry[];
  sources: Source[];
  words: WordDay[];
  /** Study sessions on the project's subject, newest first. */
  sessions: { id: string; date: string; minutes: number; kind?: string; note: string }[];
}

const parsed = <T,>(st: DataState, kind: string, fn: (r: LtRecord) => T | null): T[] => sectionRecords(st, SECTION, kind).map(fn).filter((x): x is T => x != null);

export function epqIn(st: DataState): EpqState {
  const row = st.lt_records.get(PROJECT_ID);
  const project = row && !row.deleted_at ? projectOf(row) : null;
  const subject = (project?.subject ?? EPQ_SUBJECT).toLowerCase();
  const sessions = sectionEntries<StudyDetail>(st, 'study')
    .filter((s) => isStudyDetail(s.detail) && s.detail.subject.toLowerCase() === subject)
    .map((s) => ({ id: s.entry.id, date: s.entry.date, minutes: s.entry.minutes, kind: (s.detail as StudyDetail).kind, note: s.entry.note ?? '' }))
    .sort((a, b) => b.date.localeCompare(a.date));
  return {
    project,
    milestones: sortMilestones(parsed(st, 'epq_milestone', milestoneOf)),
    log: parsed(st, 'epq_log', logOf).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)),
    sources: parsed(st, 'epq_source', sourceOf),
    words: wordHistory(parsed(st, 'epq_words', wordsOf)),
    sessions,
  };
}

/** The project row, plus its subject in Study's subject list so sessions can be logged to it. */
export function saveProject(p: Omit<EpqProject, 'id'>) {
  const prev = data.get().lt_records.get(PROJECT_ID);
  const t = now();
  const value = { title: p.title.trim().slice(0, 200), question: p.question.trim().slice(0, 400), deadline: p.deadline, wordTarget: p.wordTarget, hoursTarget: p.hoursTarget, subject: p.subject.trim().slice(0, 40) || EPQ_SUBJECT, started: p.started };
  const row: LtRecord = prev
    ? { ...prev, data: value, deleted_at: null, updated_at: t }
    : { id: PROJECT_ID, section: SECTION, kind: 'epq_project', data: value, sort_order: 0, archived_at: null, created_at: t, updated_at: t, deleted_at: null };
  commit('lt_records', [row]);
  const raw = prefValue(data.get(), 'study_subjects');
  const list = Array.isArray(raw) && raw.length ? (raw as string[]) : DEFAULT_SUBJECTS;
  if (!list.some((s) => s.toLowerCase() === value.subject.toLowerCase())) setPref('study_subjects', [...list, value.subject].slice(0, 12));
}

export function saveMilestone(m: { title: string; due: string | null; done: string | null }, id?: string) {
  return saveRecord(SECTION, 'epq_milestone', { title: m.title.trim().slice(0, 120), due: m.due, done: m.done }, id);
}

export function toggleMilestone(m: Milestone, today: string) {
  saveMilestone({ title: m.title, due: m.due, done: m.done ? null : today }, m.id);
}

/** Adds the usual stages, skipping any you already have by name. */
export function addUsualMilestones(today: string, deadline: string | null, have: Milestone[]) {
  const names = new Set(have.map((m) => m.title.toLowerCase()));
  for (const m of plannedMilestones(today, deadline)) if (!names.has(m.title.toLowerCase())) saveMilestone({ title: m.title, due: m.due, done: null });
}

export function saveLog(e: Omit<LogEntry, 'id'>, id?: string) {
  return saveRecord(SECTION, 'epq_log', { date: e.date, kind: e.kind, text: e.text.trim(), next: e.next.trim() }, id);
}

export function saveSource(s: Omit<Source, 'id'>, id?: string) {
  return saveRecord(SECTION, 'epq_source', { ...s }, id);
}

export function setSourceUsed(s: Source, used: boolean) {
  const { id, ...rest } = s;
  saveSource({ ...rest, used }, id);
}

/** Today's count replaces any earlier count for the same day. */
export function saveWords(date: string, words: number) {
  const id = pairId('epq:words', date);
  const prev = data.get().lt_records.get(id);
  const t = now();
  const value = { date, words: Math.max(0, Math.round(words)) };
  const row: LtRecord = prev
    ? { ...prev, data: value, deleted_at: null, updated_at: t }
    : { id, section: SECTION, kind: 'epq_words', data: value, sort_order: 0, archived_at: null, created_at: t, updated_at: t, deleted_at: null };
  commit('lt_records', [row]);
}
