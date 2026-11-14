/**
 * The Stage's data: results gathered from where each one lives (see src/domain/stage/model.ts), the days coming up
 * from the calendar, and the saves. Performances, chess games, talks and the rest are `pf_show` rows and
 * getting-ready lists are `pf_prep` rows, both under the cabinet section. No migration, no XP.
 */
import { pairId } from '../../data/logActions';
import { prefValue, sectionEntries, withReward } from '../../data/lt';
import { saveRecord } from '../../data/records';
import { saveSession } from '../../data/sessions';
import { commit, data, type DataState } from '../../data/store';
import type { LtEvent, LtRecord } from '../../data/types';
import { occurrences } from '../../domain/calendar/occurrences';
import { addDays } from '../../domain/log/dates';
import { sittingOf } from '../../domain/maths/model';
import { byNewest, eventType, planData, PLAN_EVENT, prepOf, reflectionData, REFLECTION_KEYS, showOfMark, showOfRecord, showOfSitting, showOfSport, type Plan, type Prep, type Reflection, type Show, type ShowType, type StageType } from '../../domain/stage/model';
import { useStore } from '../../lib/createStore';
import { createEvent, reschedule, updateEventInfo } from '../calendar/actions';
import { nightsFrom } from '../sleep/model';
import { sportInfo, type SportDetail } from '../sports/model';
import { isStudyDetail, subjectsOf, type StudyDetail } from '../study/model';

const SECTION = 'cabinet' as const;
const sportName = (id: string) => sportInfo(id)?.name ?? id;

// ─── reading ────────────────────────────────────────────────────────────────

let memo: { r: unknown; e: unknown; d: unknown; t: unknown; out: Show[] } | null = null;
/** Every result, newest first. */
export function showsIn(st: DataState): Show[] {
  if (memo && memo.r === st.lt_records && memo.e === st.log_entries && memo.d === st.lt_details && memo.t === st.log_topics) return memo.out;
  const out: Show[] = [];
  for (const r of st.lt_records.values()) {
    if (r.deleted_at) continue;
    const s = r.kind === 'pf_show' ? showOfRecord(r) : r.kind === 'study_mark' && r.section === 'study' ? showOfMark(r) : null;
    if (s) out.push(s);
    if (r.kind === 'sitting' && r.section === 'maths') {
      const sit = sittingOf(r);
      const m = sit && showOfSitting(sit);
      if (m) out.push(m);
    }
  }
  for (const s of sectionEntries<SportDetail>(st, 'sports')) {
    const m = showOfSport(s.entry, (s.detail as unknown as Record<string, unknown>) ?? null, sportName);
    if (m) out.push(m);
  }
  out.sort(byNewest);
  memo = { r: st.lt_records, e: st.log_entries, d: st.lt_details, t: st.log_topics, out };
  return out;
}
export const useShows = () => useStore(data, showsIn);

export const prepId = (key: string) => pairId('stage:prep', key);
export function prepFor(st: DataState, key: string): Prep | null {
  const r = st.lt_records.get(prepId(key));
  return r ? prepOf(r) : null;
}

export interface Upcoming {
  key: string;
  event: LtEvent;
  title: string;
  date: string;
  start: string | null;
  type: StageType;
  prep: Prep | null;
  /** The result logged for it, if any. */
  result: Show | null;
}

/** Days for the Stage on the calendar from three weeks back to `days` ahead, soonest first. */
export function stageDays(st: DataState, today: string, days = 120): Upcoming[] {
  const shows = showsIn(st);
  const byEvent = new Map(shows.filter((s) => s.event).map((s) => [s.event!, s]));
  const out: Upcoming[] = [];
  const seen = new Set<string>();
  for (const o of occurrences(st.lt_events.values(), addDays(today, -21), addDays(today, days))) {
    if (o.cancelled || seen.has(o.key)) continue;
    const type = eventType(o.event);
    if (!type) continue;
    seen.add(o.key);
    out.push({ key: o.key, event: o.event, title: o.event.title, date: o.date, start: o.start, type, prep: prepFor(st, o.key), result: byEvent.get(o.key) ?? null });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date) || (a.start ?? '').localeCompare(b.start ?? ''));
}

/** Sleep the night before each day (the night named after the morning), in minutes. */
export function sleepLookup(st: DataState): (date: string) => number | null {
  const by = new Map(nightsFrom(st.log_metrics.values(), st.lt_nights.values()).map((n) => [n.date, n.minutes]));
  return (date) => by.get(date) ?? null;
}

/** Study sessions as date, subject and minutes, for revision before a test. */
export function studyMinutes(st: DataState): { date: string; subject: string; minutes: number }[] {
  return sectionEntries<StudyDetail>(st, 'study').flatMap((s) => (isStudyDetail(s.detail) ? [{ date: s.entry.date, subject: s.detail.subject, minutes: s.entry.minutes }] : []));
}

export const subjectsNow = () => subjectsOf(prefValue(data.get(), 'study_subjects'));

/** The raw data behind a result, for editing. */
export function rawOf(st: DataState, s: Pick<Show, 'id' | 'source'>): Record<string, unknown> {
  if (s.source === 'sport') {
    const d = st.lt_details.get(s.id);
    return d && !d.deleted_at ? d.data : {};
  }
  const r = st.lt_records.get(s.id);
  return r && !r.deleted_at ? r.data : {};
}

// ─── saving ─────────────────────────────────────────────────────────────────

/** Drop the old reflection, then put the new one in: cleared fields go. */
function withReflection(prev: Record<string, unknown>, fields: Record<string, unknown>, refl: Partial<Reflection>) {
  const base = { ...prev };
  for (const k of REFLECTION_KEYS) delete base[k];
  const out: Record<string, unknown> = { ...base, ...fields, ...reflectionData(refl) };
  for (const [k, v] of Object.entries(out)) if (v === undefined || v === null || v === '') delete out[k];
  return out;
}

export interface ShowForm {
  type: ShowType;
  date: string;
  title: string;
  kind: string;
  where: string;
  result: string;
  outcome: string | null;
  place: number | null;
  opp: string;
  oppRating: number | null;
  colour: string | null;
  pieces: string[];
  event: string | null;
}
export function saveShow(f: ShowForm, refl: Partial<Reflection>, id?: string | null): LtRecord {
  const prev = id ? (data.get().lt_records.get(id)?.data ?? {}) : {};
  const fields = {
    type: f.type,
    date: f.date,
    title: f.title.trim().slice(0, 120),
    kind: f.kind,
    where: f.where.trim().slice(0, 120),
    result: f.result.trim().slice(0, 80),
    outcome: f.outcome,
    place: f.place,
    opp: f.opp.trim().slice(0, 80),
    oppRating: f.oppRating,
    colour: f.colour,
    pieces: f.pieces.length ? f.pieces : null,
    event: f.event,
  };
  return saveRecord(SECTION, 'pf_show', withReflection(prev, fields, refl), id);
}

export interface TestForm {
  subject: string;
  title: string;
  /** Null while the test hasn't come back yet. */
  score: number | null;
  outOf: number | null;
  date: string;
  testKind: string;
  grade: string;
  predict: number | null;
  event: string | null;
}
/** A test is a Study mark: the Study page shows it too. */
export function saveTest(f: TestForm, refl: Partial<Reflection>, id?: string | null): LtRecord {
  const prev = id ? (data.get().lt_records.get(id)?.data ?? {}) : {};
  const fields = { subject: f.subject, title: f.title.trim().slice(0, 80), score: f.score, outOf: f.outOf, date: f.date, testKind: f.testKind, grade: f.grade.trim().slice(0, 12), predict: f.predict, event: f.event };
  return saveRecord('study', 'study_mark', withReflection(prev, fields, refl), id);
}

/** A match or a race is a sports session, so its time counts like any other. Returns an error or null. */
export function saveSportResult(f: { date: string; minutes: number; note: string; detail: Record<string, unknown> }, refl: Partial<Reflection>, id?: string | null): string | null {
  const prev = id ? (data.get().lt_details.get(id)?.data ?? {}) : {};
  const detail = withReflection(prev, f.detail, refl);
  const sport = sportInfo(String(detail.sport));
  let err: string | null = null;
  withReward(() => {
    const r = saveSession({ section: 'sports', date: f.date, minutes: f.minutes, note: f.note, subcategory: sport?.name ?? null, detail }, id);
    if ('error' in r) err = r.error;
    return !('error' in r);
  });
  return err;
}

export function savePrep(key: string, p: Omit<Prep, 'event'>) {
  const id = prepId(key);
  const prev = data.get().lt_records.get(id);
  const t = new Date().toISOString();
  const value: Record<string, unknown> = { event: key, ticks: p.ticks };
  if (p.goal.trim()) value.goal = p.goal.trim().slice(0, 600);
  if (p.ready != null) value.ready = p.ready;
  if (p.nerves != null) value.nerves = p.nerves;
  if (p.predict != null) value.predict = p.predict;
  const row: LtRecord = prev
    ? { ...prev, data: value, deleted_at: null, updated_at: t }
    : { id, section: SECTION, kind: 'pf_prep', data: value, sort_order: 0, archived_at: null, created_at: t, updated_at: t, deleted_at: null };
  commit('lt_records', [row]);
}

// ─── planning ahead ─────────────────────────────────────────────────────────

export interface PlanForm {
  type: Exclude<StageType, 'maths'>;
  title: string;
  date: string;
  /** null for an all-day plan. */
  start: string | null;
  end: string | null;
  plan: Partial<Plan>;
  pieces: string[];
}

/** One line for the calendar's note: what you'd see there at a glance. */
function planNote(f: PlanForm): string {
  return [f.plan.opp && `vs ${f.plan.opp}`, f.plan.comp, f.plan.where].filter(Boolean).join(' · ').slice(0, 500);
}

/**
 * Put a day ahead on the calendar (so the Calendar, Violin, Study and Sports pages see it too) with what you know about it.
 * The Stage counts down to it and fills the log sheet in from it afterwards. A plan for a day that already
 * has an event edits that event. Returns an error or null.
 */
export function savePlan(f: PlanForm, eventId?: string | null): string | null {
  const at = PLAN_EVENT[f.type];
  const fields = { title: f.title, section: at.section, kind: at.kind, note: planNote(f) };
  const prevEvent = eventId ? data.get().lt_events.get(eventId) : undefined;
  const extra = { stage: f.type, plan: planData(f.plan), ...(f.type === 'violin' && f.pieces.length ? { pieces: f.pieces } : {}) };
  if (prevEvent && !prevEvent.deleted_at) {
    // Keep anything else the event carries, drop what this sheet owns.
    const { pieces: _p, plan: _l, stage: _s, ...rest } = prevEvent.data;
    const err = updateEventInfo(prevEvent.id, { ...fields, data: { ...rest, ...extra } });
    if (err) return err;
    if (f.date !== prevEvent.date || f.start !== prevEvent.start || f.end !== prevEvent.end) {
      if (f.start && f.end && f.end <= f.start) return 'It has to end after it starts.';
      const from = `${prevEvent.id}@${prevEvent.date}`;
      reschedule(prevEvent.id, prevEvent.date, { date: f.date, start: f.start, end: f.end }, 'one');
      // A one-off's key includes its day, so the ready list moves with it.
      if (f.date !== prevEvent.date) moveKey(from, `${prevEvent.id}@${f.date}`);
    }
    return null;
  }
  const made = createEvent({ ...fields, date: f.date, start: f.start, end: f.end, repeat: null, count: null, data: extra });
  return 'error' in made ? made.error : null;
}

/** Carry the ready list and aim from one occurrence key to another. */
function moveKey(from: string, to: string) {
  const row = data.get().lt_records.get(prepId(from));
  if (!row || row.deleted_at) return;
  const t = new Date().toISOString();
  const target = data.get().lt_records.get(prepId(to));
  const moved: LtRecord = { ...(target ?? row), id: prepId(to), data: { ...row.data, event: to }, deleted_at: null, updated_at: t, ...(target ? {} : { created_at: t }) };
  commit('lt_records', [moved, { ...row, deleted_at: t, updated_at: t }]);
}
