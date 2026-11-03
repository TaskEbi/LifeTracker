/**
 * The Hideout's records. No new table and no migration: everything is an lt_records row (`hq_*`
 * kinds) under the cabinet section, which nothing else reads by section. Day-keyed rows get their id
 * from the date, so two devices write the same row. Nothing here earns XP.
 */
import { prefValue, progressInput, progressOf, sectionRecords, setPref } from '../../data/lt';
import { noteOf, ownQuoteOf, type Note } from '../../domain/hq/beacon';
import type { FeelingId, Quote } from '../../domain/hq/quotes';
import { pairId } from '../../data/logActions';
import { saveRecord } from '../../data/records';
import { commit, data, type DataState } from '../../data/store';
import type { LtRecord, SectionId } from '../../data/types';
import { occurrences } from '../../domain/calendar/occurrences';
import { addDays } from '../../domain/log/dates';
import { rankFor, STAGES } from '../../domain/progress/engine';
import { niggleOf, type Niggle, type RegionId } from '../../domain/hq/body';
import { capsuleOf, hoursBySection, type Capsule, type Snapshot } from '../../domain/hq/capsule';
import { checkInOf, type CheckIn } from '../../domain/hq/checkin';
import { gearOf, type Gear, type PastGear } from '../../domain/hq/gear';
import type { Experiment, Metric } from '../../domain/hq/lab';
import { predictionOf, type Prediction } from '../../domain/hq/oracle';
import { reviewOf, type BigThree, type Review } from '../../domain/hq/review';
import { doneIdsOf, ritualOf, type Ritual, type RitualSlot } from '../../domain/hq/rituals';
import { cardOf, freshSrs, schedule, type Card, type Cause, type CardSource, type Grade } from '../../domain/hq/srs';
import { useStore } from '../../lib/createStore';
import { raceDate } from '../../domain/plans/marathon';
import { bucketItems } from '../bucket/actions';
import { booksIn } from '../reading/actions';

export const HQ_SECTION: SectionId = 'cabinet';
const now = () => new Date().toISOString();

const rows = (st: DataState, kind: string): LtRecord[] => sectionRecords(st, HQ_SECTION, kind);
const parsed = <T,>(st: DataState, kind: string, fn: (r: LtRecord) => T | null): T[] => rows(st, kind).map(fn).filter((x): x is T => x != null);

export interface RecallDay {
  date: string;
  reviewed: number;
  again: number;
}

export interface HqState {
  checkIns: CheckIn[];
  rituals: Ritual[];
  ritualDays: Map<string, Set<string>>;
  cards: Card[];
  recall: RecallDay[];
  niggles: Niggle[];
  gear: Gear[];
  predictions: Prediction[];
  capsules: Capsule[];
  reviews: Review[];
  experiments: Experiment[];
  notes: Note[];
  ownQuotes: Quote[];
}

let lastMap: DataState['lt_records'] | null = null;
let last: HqState | null = null;

export function hqOf(st: DataState): HqState {
  if (st.lt_records === lastMap && last) return last;
  lastMap = st.lt_records;
  last = {
    checkIns: parsed(st, 'hq_checkin', checkInOf),
    rituals: parsed(st, 'hq_ritual', ritualOf),
    ritualDays: new Map(rows(st, 'hq_ritual_day').filter((r) => typeof r.data.date === 'string').map((r) => [r.data.date as string, new Set(doneIdsOf(r))])),
    cards: parsed(st, 'hq_card', cardOf),
    recall: rows(st, 'hq_recall_day').map((r) => ({ date: String(r.data.date), reviewed: Number(r.data.reviewed) || 0, again: Number(r.data.again) || 0 })),
    niggles: parsed(st, 'hq_niggle', niggleOf).sort((a, b) => b.startedOn.localeCompare(a.startedOn)),
    gear: parsed(st, 'hq_gear', gearOf),
    predictions: parsed(st, 'hq_prediction', predictionOf).sort((a, b) => a.by.localeCompare(b.by)),
    capsules: parsed(st, 'hq_capsule', capsuleOf).sort((a, b) => a.opensOn.localeCompare(b.opensOn)),
    reviews: parsed(st, 'hq_review', reviewOf).sort((a, b) => b.week.localeCompare(a.week)),
    experiments: rows(st, 'hq_experiment').flatMap((r) => {
      const d = r.data;
      return typeof d.title === 'string' && typeof d.start === 'string' ? [{ id: r.id, title: d.title, start: d.start, days: Number(d.days) || 14, metric: (d.metric as Metric) ?? 'sleep' }] : [];
    }),
    notes: parsed(st, 'hq_note', noteOf).sort((a, b) => b.writtenOn.localeCompare(a.writtenOn)),
    ownQuotes: parsed(st, 'hq_quote', ownQuoteOf),
  };
  return last;
}
export const useHq = () => useStore(data, hqOf);

/** One row per day and kind, named by the pair. */
function saveDay(kind: string, date: string, value: Record<string, unknown>) {
  const id = pairId(`hq:${kind}`, date);
  const prev = data.get().lt_records.get(id);
  const t = now();
  const row: LtRecord = prev
    ? { ...prev, data: value, deleted_at: null, updated_at: t }
    : { id, section: HQ_SECTION, kind, data: value, sort_order: 0, archived_at: null, created_at: t, updated_at: t, deleted_at: null };
  commit('lt_records', [row]);
}

const merge = (id: string, patch: Record<string, unknown>) => {
  const r = data.get().lt_records.get(id);
  if (r && !r.deleted_at) commit('lt_records', [{ ...r, data: { ...r.data, ...patch }, updated_at: now() }]);
};

// ─── check-in ───────────────────────────────────────────────────────────────

export function saveCheckIn(date: string, c: { mood: number; energy: number | null; note: string }) {
  saveDay('hq_checkin', date, { date, mood: c.mood, energy: c.energy, note: c.note.trim().slice(0, 280) });
}

// ─── rituals ────────────────────────────────────────────────────────────────

export function saveRitual(f: { title: string; cue: string; slot: RitualSlot; days: number[]; since: string }, id?: string) {
  saveRecord(HQ_SECTION, 'hq_ritual', { title: f.title.trim().slice(0, 100), cue: f.cue.trim().slice(0, 100), slot: f.slot, days: f.days, since: f.since }, id);
}
export function toggleRitual(ritualId: string, date: string) {
  const done = new Set(hqOf(data.get()).ritualDays.get(date) ?? []);
  if (done.has(ritualId)) done.delete(ritualId);
  else done.add(ritualId);
  saveDay('hq_ritual_day', date, { date, done: [...done] });
}

// ─── dojo ───────────────────────────────────────────────────────────────────

export function saveCard(f: { deck: string; front: string; back: string; source?: CardSource; cause?: Cause | null; highlightId?: string | null }, today: string, id?: string) {
  const prev = id ? hqOf(data.get()).cards.find((c) => c.id === id) : undefined;
  return saveRecord(
    HQ_SECTION,
    'hq_card',
    {
      deck: f.deck.trim().slice(0, 40) || 'General',
      front: f.front.trim().slice(0, 2000),
      back: f.back.trim().slice(0, 2000),
      source: f.source ?? prev?.source ?? 'typed',
      cause: f.cause ?? prev?.cause ?? null,
      highlightId: f.highlightId ?? prev?.highlightId ?? null,
      createdOn: prev?.createdOn ?? today,
      srs: prev?.srs ?? freshSrs(today),
    },
    id,
  );
}

export function gradeCard(card: Card, grade: Grade, today: string) {
  merge(card.id, { srs: schedule(card.srs, grade, today) });
  const day = hqOf(data.get()).recall.find((r) => r.date === today);
  saveDay('hq_recall_day', today, { date: today, reviewed: (day?.reviewed ?? 0) + 1, again: (day?.again ?? 0) + (grade === 'again' ? 1 : 0) });
}

// ─── infirmary ──────────────────────────────────────────────────────────────

export function saveNiggle(f: { region: RegionId; severity: number; note: string; startedOn: string }, id?: string) {
  const prev = id ? hqOf(data.get()).niggles.find((n) => n.id === id) : undefined;
  const log = prev ? [...prev.log, ...(prev.severity !== f.severity ? [{ date: f.startedOn, severity: f.severity }] : [])] : [{ date: f.startedOn, severity: f.severity }];
  saveRecord(HQ_SECTION, 'hq_niggle', { region: f.region, severity: f.severity, note: f.note.trim().slice(0, 300), startedOn: prev?.startedOn ?? f.startedOn, healedOn: null, log }, id);
}
export const healNiggle = (id: string, date: string | null) => merge(id, { healedOn: date });

// ─── armoury ────────────────────────────────────────────────────────────────

export function saveGear(g: Omit<Gear, 'id' | 'past'>, id?: string) {
  const prev = id ? hqOf(data.get()).gear.find((x) => x.id === id) : undefined;
  saveRecord(HQ_SECTION, 'hq_gear', { ...g, past: prev?.past ?? [] }, id);
}
/** A new pair, a fresh set of strings: the count starts again and the old one is kept on the record. */
export function replaceGear(g: Gear, used: number, today: string) {
  const past: PastGear[] = [{ name: g.name, since: g.since, until: today, used: Math.round(used) }, ...g.past].slice(0, 12);
  merge(g.id, { since: today, baseline: 0, past });
}

// ─── oracle ─────────────────────────────────────────────────────────────────

export function savePrediction(f: { claim: string; confidence: number; by: string }, today: string, id?: string) {
  const prev = id ? hqOf(data.get()).predictions.find((p) => p.id === id) : undefined;
  saveRecord(HQ_SECTION, 'hq_prediction', { claim: f.claim.trim().slice(0, 300), confidence: f.confidence, by: f.by, madeOn: prev?.madeOn ?? today, outcome: prev?.outcome ?? null, resolvedOn: prev?.resolvedOn ?? null, note: prev?.note ?? '' }, id);
}
export const resolvePrediction = (id: string, outcome: boolean | null, today: string) => merge(id, { outcome, resolvedOn: outcome == null ? null : today });

// ─── vault ──────────────────────────────────────────────────────────────────

/** A row holds at most 32 KB, and a Japanese character takes three bytes: letter, reply and snapshot must all fit. */
export const CAPSULE_LETTER_MAX = 7000;
export const CAPSULE_REPLY_MAX = 2000;

/** Who you are today, in numbers, to compare with on the day a capsule opens. */
export function takeSnapshot(st: DataState, today: string, emblems: number): Snapshot {
  const input = progressInput(st, today);
  const p = progressOf(st, today);
  const { hours, total, km } = hoursBySection(input);
  return {
    level: p.overall.level,
    rank: rankFor(p.overall.level),
    form: STAGES[p.overall.stage].name,
    streak: p.streak.n,
    hours,
    totalHours: total,
    km,
    books: booksIn(st).filter((b) => b.status === 'finished').length,
    wishes: bucketItems(st).done.length,
    emblems,
  };
}

export function sealCapsule(f: { title: string; letter: string; opensOn: string; snapshot: Snapshot }, today: string) {
  saveRecord(HQ_SECTION, 'hq_capsule', { title: f.title.trim().slice(0, 80), letter: f.letter.trim().slice(0, CAPSULE_LETTER_MAX), sealedOn: today, opensOn: f.opensOn, openedOn: null, snapshot: f.snapshot, reply: '' });
}
export const markCapsuleOpened = (id: string, today: string) => merge(id, { openedOn: today });
export const replyToCapsule = (id: string, reply: string) => merge(id, { reply: reply.trim().slice(0, CAPSULE_REPLY_MAX) });

// ─── lighthouse ─────────────────────────────────────────────────────────────

export const NOTE_MAX = 6000;

export function saveNote(f: { text: string; feelings: FeelingId[] }, today: string, id?: string) {
  const st = data.get();
  const prev = id ? hqOf(st).notes.find((n) => n.id === id) : undefined;
  saveRecord(
    HQ_SECTION,
    'hq_note',
    {
      text: f.text.trim().slice(0, NOTE_MAX),
      feelings: f.feelings,
      writtenOn: prev?.writtenOn ?? today,
      mood: prev ? prev.mood : (hqOf(st).checkIns.find((c) => c.date === today)?.mood ?? null),
      reads: prev?.reads ?? 0,
      lastRead: prev?.lastRead ?? null,
    },
    id,
  );
}

/** Counted each time it's opened in the struggling flow, so every message gets its turn. */
export function markNoteRead(id: string, today: string) {
  const n = hqOf(data.get()).notes.find((x) => x.id === id);
  if (n) merge(id, { reads: n.reads + 1, lastRead: today });
}

export function saveOwnQuote(f: { text: string; by: string; source: string; feelings: FeelingId[] }, id?: string) {
  saveRecord(HQ_SECTION, 'hq_quote', { text: f.text.trim().slice(0, 1000), by: f.by.trim().slice(0, 80), source: f.source.trim().slice(0, 120), feelings: f.feelings }, id);
}

const SAVED_KEY = 'lh_saved';
export const savedQuoteIds = (st: DataState): string[] => {
  const v = prefValue(st, SAVED_KEY);
  return Array.isArray(v) ? (v as string[]) : [];
};
export function toggleSavedQuote(id: string) {
  const list = savedQuoteIds(data.get());
  setPref(SAVED_KEY, list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
}

// ─── war room ───────────────────────────────────────────────────────────────

export function saveReview(f: { week: string; win: string; stuck: string; change: string; theme: string; rating: number | null; big: BigThree[] }, today: string) {
  saveDay('hq_review', f.week, { week: f.week, win: f.win.trim().slice(0, 500), stuck: f.stuck.trim().slice(0, 500), change: f.change.trim().slice(0, 500), theme: f.theme.trim().slice(0, 80), rating: f.rating, big: f.big.filter((b) => b.text.trim()).slice(0, 3), sealedOn: today });
}
export function tickBig(review: Review, i: number) {
  merge(review.id, { big: review.big.map((b, k) => (k === i ? { ...b, done: !b.done } : b)) });
}

// ─── lab ────────────────────────────────────────────────────────────────────

export const saveExperiment = (f: { title: string; start: string; days: number; metric: Metric }) => saveRecord(HQ_SECTION, 'hq_experiment', { title: f.title.trim().slice(0, 100), start: f.start, days: f.days, metric: f.metric });

// ─── what the planners need ─────────────────────────────────────────────────

export interface Deadline {
  title: string;
  date: string;
  section: SectionId | null;
}

/** Dated things ahead that time can be spent towards: exams, performances, contests, the race, uni deadlines, the next JOI stage. */
export function deadlinesOf(st: DataState, today: string, days = 120): Deadline[] {
  const out: Deadline[] = [];
  const seen = new Set<string>();
  for (const o of occurrences(st.lt_events.values(), today, addDays(today, days))) {
    if (o.cancelled) continue;
    const k = o.event.kind;
    if (k !== 'exam' && k !== 'performance' && k !== 'competition' && !(o.event.section === 'future' && k !== 'session')) continue;
    const key = `${o.event.title}@${o.date}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const section = o.event.section ?? (k === 'exam' ? 'study' : k === 'performance' ? 'violin' : null);
    out.push({ title: o.event.title, date: o.date, section });
  }
  const road = st.settings.road;
  const labels: [keyof typeof road.stages, string][] = [['joi1', 'JOI first round'], ['joi2', 'JOI second round'], ['final', 'JOI final'], ['camp', 'Training camp'], ['ioi', 'IOI']];
  for (const [id, label] of labels) {
    const s = road.stages[id];
    if (s.date && s.date >= today && s.date <= addDays(today, days) && !s.cleared_on) {
      out.push({ title: label, date: s.date, section: 'coding' });
      break;
    }
  }
  const prefs = st.lt_prefs.get('plans');
  const start = (prefs?.value as { marathon?: { start?: string } } | undefined)?.marathon?.start;
  if (start && !prefs?.deleted_at) {
    const race = raceDate(start);
    if (race >= today) out.push({ title: 'Marathon', date: race, section: 'sports' });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}
