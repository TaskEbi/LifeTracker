/** Study: sessions per subject, marks and the topics that still feel shaky (both lt_records). */
import type { SectionEntry } from '../../data/lt';
import type { LtRecord } from '../../data/types';

export const DEFAULT_SUBJECTS = ['Maths', 'Further Maths', 'Physics', 'Computer Science'];
export const STUDY_KINDS = ['Homework', 'Revision', 'Past paper', 'Reading', 'Lesson prep'] as const;

export interface StudyDetail {
  subject: string;
  kind?: string;
  topic?: string;
}
export type StudySession = SectionEntry<StudyDetail>;
export const isStudyDetail = (d: unknown): d is StudyDetail => !!d && typeof (d as StudyDetail).subject === 'string';

export function subjectsOf(v: unknown): string[] {
  const list = Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string' && !!s.trim()).map((s) => s.trim().slice(0, 40)) : [];
  return list.length ? [...new Set(list)].slice(0, 12) : DEFAULT_SUBJECTS;
}

export interface Mark {
  id: string;
  subject: string;
  title: string;
  score: number;
  outOf: number;
  date: string;
}
export function markOf(r: LtRecord): Mark | null {
  const d = r.data as Partial<Mark>;
  if (typeof d.subject !== 'string' || !Number.isFinite(d.score) || !Number.isFinite(d.outOf) || (d.outOf as number) <= 0) return null;
  return { id: r.id, subject: d.subject, title: typeof d.title === 'string' ? d.title : '', score: d.score as number, outOf: d.outOf as number, date: typeof d.date === 'string' ? d.date : r.created_at.slice(0, 10) };
}
export const pct = (m: Pick<Mark, 'score' | 'outOf'>) => Math.round((m.score / m.outOf) * 100);

/** Average percentage of the last few marks per subject, and whether it went up or down on the one before. */
export function subjectMarks(marks: Mark[], subject: string, last = 5): { avg: number | null; trend: number | null; n: number } {
  const list = marks.filter((m) => m.subject === subject).sort((a, b) => a.date.localeCompare(b.date));
  if (!list.length) return { avg: null, trend: null, n: 0 };
  const recent = list.slice(-last);
  const avg = Math.round(recent.reduce((a, m) => a + pct(m), 0) / recent.length);
  const trend = list.length > 1 ? pct(list[list.length - 1]) - pct(list[list.length - 2]) : null;
  return { avg, trend, n: list.length };
}

export interface HardTopic {
  id: string;
  subject: string;
  name: string;
  /** 1 lost, 2 shaky, 3 getting there. */
  level: 1 | 2 | 3;
  archived: boolean;
}
export function topicOf(r: LtRecord): HardTopic | null {
  const d = r.data as Partial<HardTopic>;
  if (typeof d.subject !== 'string' || typeof d.name !== 'string') return null;
  const level = d.level === 1 || d.level === 3 ? d.level : 2;
  return { id: r.id, subject: d.subject, name: d.name, level, archived: !!r.archived_at };
}
export const LEVEL_LABEL = { 1: 'Lost', 2: 'Shaky', 3: 'Getting there' } as const;

/** Minutes per subject between two days (inclusive); sessions without a subject count as "Other". */
export function minutesBySubject(sessions: StudySession[], from: string, to: string): Map<string, number> {
  const out = new Map<string, number>();
  for (const s of sessions) {
    if (s.entry.date < from || s.entry.date > to) continue;
    const k = isStudyDetail(s.detail) ? s.detail.subject : 'Other';
    out.set(k, (out.get(k) ?? 0) + s.entry.minutes);
  }
  return out;
}
