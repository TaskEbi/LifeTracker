/**
 * LifeTracker's view of the shared records: synced preferences, which Daily Log topic each
 * section uses, and the progress snapshot (XP, levels, streaks) derived from everything.
 */
import { useMemo } from 'react';
import { createStore, useStore } from '../lib/createStore';
import { todayIn } from '../domain/log/dates';
import { achievements, type Achievement } from '../domain/progress/achievements';
import { computeProgress, rewardBetween, sectionStreaks, type Progress, type ProgressInput, type Reward, type SectionStreak } from '../domain/progress/engine';
import { questBoard, questHistory, type QuestPeriod, type QuestSet } from '../domain/progress/quests';
import { normaliseSectionTopics, normaliseSleep, normaliseTargets, normaliseTargetsLog, targetsAt, type SectionTopics, type SleepSchedule, type Targets } from '../domain/prefs';
import { weekStart } from '../domain/log/dates';
import { TOPIC_NAME_HINTS } from '../domain/sections';
import { createTopic, pairId, restoreTopic } from './logActions';
import { commit, data, type DataState } from './store';
import { TIMED_SECTIONS, type LogEntry, type LogTopic, type LtDayMark, type LtPref, type SectionId, type TimedSection } from './types';

const now = () => new Date().toISOString();

// ─── preferences ────────────────────────────────────────────────────────────

export function prefValue(st: DataState, key: string): unknown {
  const row = st.lt_prefs.get(key);
  return row && !row.deleted_at ? row.value : undefined;
}

export function setPref(key: string, value: unknown) {
  const existing = data.get().lt_prefs.get(key);
  const t = now();
  const row: LtPref = existing ? { ...existing, value, deleted_at: null, updated_at: t } : { id: key, value, created_at: t, updated_at: t, deleted_at: null };
  commit('lt_prefs', [row]);
}

function memo1<A, R>(fn: (a: A) => R): (a: A) => R {
  let lastA: A | undefined;
  let lastR: R;
  return (a) => (a === lastA ? lastR : ((lastA = a), (lastR = fn(a))));
}
const targetsOf = memo1((m: DataState['lt_prefs']) => normaliseTargets(m.get('targets')?.deleted_at ? undefined : m.get('targets')?.value));
const sleepOf = memo1((m: DataState['lt_prefs']) => normaliseSleep(m.get('sleep')?.deleted_at ? undefined : m.get('sleep')?.value));
const targetsLogOf = memo1((m: DataState['lt_prefs']) => normaliseTargetsLog(m.get('targets_log')?.deleted_at ? undefined : m.get('targets_log')?.value));
const topicsOf = memo1((m: DataState['lt_prefs']) => normaliseSectionTopics(m.get('section_topics')?.deleted_at ? undefined : m.get('section_topics')?.value));

export const useTargets = (): Targets => useStore(data, (s) => targetsOf(s.lt_prefs));
export const useSleepSchedule = (): SleepSchedule => useStore(data, (s) => sleepOf(s.lt_prefs));
export const useSectionTopics = (): SectionTopics => useStore(data, (s) => topicsOf(s.lt_prefs));
export const getTargets = () => targetsOf(data.get().lt_prefs);
export const getSleepSchedule = () => sleepOf(data.get().lt_prefs);
export const getSectionTopics = () => topicsOf(data.get().lt_prefs);

/** Change targets from this week on. Earlier weeks keep the targets they were judged by. */
export function setTargets(patch: Partial<Targets>) {
  const current = getTargets();
  const next = { ...current, ...patch };
  const monday = weekStart(ltToday());
  const log = targetsLogOf(data.get().lt_prefs);
  // The first change also records what the earlier weeks were held to.
  const base = log.length ? log : [{ from: '2000-01-03', targets: current }];
  setPref('targets_log', [...base.filter((r) => r.from !== monday), { from: monday, targets: next }]);
  setPref('targets', next);
}

// ─── today ──────────────────────────────────────────────────────────────────

export const ltToday = () => todayIn(data.get().settings.log_timezone);
/** The Daily Log calendar day a timestamp falls on. */
export const dayOf = (iso: string) => todayIn(data.get().settings.log_timezone, new Date(iso));

const todayStore = createStore({ today: ltToday() });
setInterval(() => {
  const t = ltToday();
  if (t !== todayStore.get().today) todayStore.set({ today: t });
}, 30_000);
data.subscribe(() => {
  const t = ltToday();
  if (t !== todayStore.get().today) todayStore.set({ today: t });
});
/** Today in the Daily Log time zone; re-renders at midnight. */
export const useToday = () => useStore(todayStore, (s) => s.today);

// ─── sections ↔ Daily Log topics ────────────────────────────────────────────

/** The section of every topic id (subcategories inherit their topic's). */
export function topicSectionMap(topics: Iterable<LogTopic>, mapping: SectionTopics): Map<string, SectionId> {
  const top = new Map<string, SectionId>();
  for (const s of TIMED_SECTIONS) if (mapping[s]) top.set(mapping[s]!, s);
  const all = [...topics];
  const out = new Map(top);
  for (const t of all) if (t.parent_id && top.has(t.parent_id)) out.set(t.id, top.get(t.parent_id)!);
  return out;
}

/** Match each unmapped section to an existing topic by name (first run). Never creates or renames topics. */
export function autoMapSections(): SectionTopics {
  const st = data.get();
  const current = getSectionTopics();
  const topics = [...st.log_topics.values()].filter((t) => !t.deleted_at && !t.parent_id);
  const taken = new Set(Object.values(current).filter(Boolean));
  const next = { ...current };
  let changed = false;
  for (const s of TIMED_SECTIONS) {
    if (next[s] && st.log_topics.get(next[s]!) && !st.log_topics.get(next[s]!)!.deleted_at) continue;
    const roadTopic = s === 'coding' ? st.settings.road.topic_id : null;
    const hit =
      (roadTopic && topics.find((t) => t.id === roadTopic && !taken.has(t.id))) ||
      TOPIC_NAME_HINTS[s].map((h) => topics.find((t) => t.name.trim().toLowerCase() === h && !taken.has(t.id))).find(Boolean);
    if (hit) {
      next[s] = hit.id;
      taken.add(hit.id);
      changed = true;
    }
  }
  if (changed) setPref('section_topics', next);
  return next;
}

const DEFAULT_TOPIC: Record<TimedSection, { name: string; color: LogTopic['color'] }> = {
  violin: { name: 'Violin', color: 'mustard' },
  coding: { name: 'Competitive programming', color: 'blue' },
  sports: { name: 'Sports', color: 'forest' },
  gym: { name: 'Gym', color: 'cherry' },
  study: { name: 'Schoolwork', color: 'plum' },
  chess: { name: 'Chess', color: 'slate' },
};

/**
 * The topic a section saves into, creating it (and remembering it) the first time it is needed.
 * If that topic was archived (e.g. in Curio Cabinet) it is brought back: logging from the section
 * means it is in use again. Throws if it can't be (an active topic already has its name).
 */
export function ensureSectionTopic(section: TimedSection): string {
  const id = sectionTopic(section);
  const err = restoreTopic(id);
  if (err) throw new Error(err);
  return id;
}

function sectionTopic(section: TimedSection): string {
  const mapped = getSectionTopics()[section];
  const st = data.get();
  if (mapped && st.log_topics.get(mapped) && !st.log_topics.get(mapped)!.deleted_at) return mapped;
  const auto = autoMapSections()[section];
  if (auto) return auto;
  const def = DEFAULT_TOPIC[section];
  const made = createTopic(def.name, null, def.color);
  const id = 'error' in made ? [...st.log_topics.values()].find((t) => !t.parent_id && !t.deleted_at && t.name.toLowerCase() === def.name.toLowerCase())!.id : made.id;
  setPref('section_topics', { ...getSectionTopics(), [section]: id });
  return id;
}

/** A subcategory of a section's topic with this name, created if missing (one level, like the Daily Log). */
export function ensureSubcategory(topicId: string, name: string): string {
  const st = data.get();
  const hit = [...st.log_topics.values()].find((t) => t.parent_id === topicId && !t.deleted_at && t.name.toLowerCase() === name.toLowerCase());
  if (hit) {
    if (hit.archived_at) commit('log_topics', [{ ...hit, archived_at: null, updated_at: now() }]);
    return hit.id;
  }
  const made = createTopic(name, topicId);
  if ('error' in made) throw new Error(made.error);
  return made.id;
}

// ─── progress ───────────────────────────────────────────────────────────────

const live = <T extends { deleted_at: string | null }>(m: Map<string, T>) => [...m.values()].filter((r) => !r.deleted_at);

let lastState: DataState | null = null;
let lastToday = '';
let lastInput: ProgressInput | null = null;

export function progressInput(st: DataState, today: string): ProgressInput {
  if (st === lastState && today === lastToday && lastInput) return lastInput;
  const mapping = topicsOf(st.lt_prefs);
  const tz = st.settings.log_timezone;
  const input: ProgressInput = {
    today,
    entries: live(st.log_entries),
    topicSection: topicSectionMap(st.log_topics.values(), mapping),
    details: st.lt_details,
    metrics: live(st.log_metrics),
    nights: new Map(live(st.lt_nights).map((n) => [n.date, n])),
    todos: live(st.todos),
    dayOf: (iso) => todayIn(tz, new Date(iso)),
    restDays: live(st.lt_day_marks).filter((m) => m.kind === 'rest').map((m) => m.date),
    cabinetDays: live(st.items).filter((i) => !i.is_example).map((i) => todayIn(tz, new Date(i.created_at))),
    targets: targetsOf(st.lt_prefs),
    targetsAt: (monday) => targetsAt(targetsLogOf(st.lt_prefs), targetsOf(st.lt_prefs), monday),
    sleep: sleepOf(st.lt_prefs),
  };
  lastState = st;
  lastToday = today;
  lastInput = input;
  return input;
}

let lastProgressInput: ProgressInput | null = null;
let lastProgress: Progress | null = null;
export function progressOf(st: DataState, today: string): Progress {
  const input = progressInput(st, today);
  if (input !== lastProgressInput || !lastProgress) {
    lastProgress = computeProgress(input);
    lastProgressInput = input;
  }
  return lastProgress;
}

export function useProgress(): Progress {
  const today = useToday();
  const st = useStore(data, (s) => s);
  return progressOf(st, today);
}

export function useSectionStreaks(): Partial<Record<SectionId, SectionStreak>> {
  const today = useToday();
  const st = useStore(data, (s) => s);
  return useMemo(() => sectionStreaks(progressInput(st, today)), [st, today]);
}

/** Achievements for a state, reusing the XP events already worked out for it. */
function achievementsOf(st: DataState, today: string): Achievement[] {
  const input = progressInput(st, today);
  return achievements(input, { events: progressOf(st, today).events, quests: questHistory(input) });
}

export function useAchievements(): Achievement[] {
  const today = useToday();
  const st = useStore(data, (s) => s);
  return useMemo(() => achievementsOf(st, today), [st, today]);
}

/** Today's daily, weekly and monthly quests with their progress. */
export function useQuests(): Record<QuestPeriod, QuestSet> {
  const today = useToday();
  const st = useStore(data, (s) => s);
  return useMemo(() => questBoard(progressInput(st, today)), [st, today]);
}

// ─── rewards ────────────────────────────────────────────────────────────────

export interface RewardView extends Reward {
  preview?: boolean;
  rest?: boolean;
  pain?: boolean;
  unlocked: Achievement[];
}
export const rewardStore = createStore<{ reward: RewardView | null }>({ reward: null });

/**
 * Run a save and show what it earned. The XP shown is the difference between the derived
 * progress before and after, so it is exactly what the records now add up to.
 */
export function withReward(save: () => boolean | void, extra: Partial<RewardView> = {}): boolean {
  const today = ltToday();
  const before = progressOf(data.get(), today);
  const beforeAch = achievementsOf(data.get(), today);
  const ok = save();
  if (ok === false) return false;
  const after = progressOf(data.get(), today);
  const afterAch = achievementsOf(data.get(), today);
  const unlocked = afterAch.filter((a) => a.unlockedOn && !beforeAch.find((b) => b.id === a.id)?.unlockedOn);
  const r = rewardBetween(before, after);
  if (r.total > 0 || r.sectionUps.length || r.overallUp || unlocked.length || extra.rest) rewardStore.set({ reward: { ...r, unlocked, ...extra } });
  return true;
}

// ─── rest days ──────────────────────────────────────────────────────────────

/** One mark per kind per day, named by the pair so two devices write the same row. */
export const markId = (kind: string, date: string) => pairId(`mark:${kind}`, date);

/** Mark today a planned rest day: it keeps the streak and earns no XP. */
export function takeRestDay() {
  const date = ltToday();
  const id = markId('rest', date);
  const existing = data.get().lt_day_marks.get(id);
  const t = now();
  const row: LtDayMark = existing ? { ...existing, deleted_at: null, updated_at: t } : { id, date, kind: 'rest', created_at: t, updated_at: t, deleted_at: null };
  withReward(() => commit('lt_day_marks', [row]), { rest: true });
}

// ─── section records ────────────────────────────────────────────────────────

/** A Daily Log entry with its LifeTracker detail (if any). */
export interface SectionEntry<D = Record<string, unknown>> {
  entry: LogEntry;
  detail: D | null;
}

/** Live entries belonging to a section (by topic or by detail), newest first. */
export function sectionEntries<D = Record<string, unknown>>(st: DataState, section: SectionId): SectionEntry<D>[] {
  const map = topicSectionMap(st.log_topics.values(), topicsOf(st.lt_prefs));
  const out: SectionEntry<D>[] = [];
  for (const e of st.log_entries.values()) {
    if (e.deleted_at) continue;
    const d = st.lt_details.get(e.id);
    const live = d && !d.deleted_at ? d : null;
    const s = live ? live.section : map.get(e.topic_id);
    if (s === section) out.push({ entry: e, detail: (live?.data as D) ?? null });
  }
  return out.sort((a, b) => b.entry.date.localeCompare(a.entry.date) || b.entry.created_at.localeCompare(a.entry.created_at));
}

/** Live lt_records of one section and kind, in their sort order. */
export function sectionRecords(st: DataState, section: SectionId, kind: string) {
  return [...st.lt_records.values()]
    .filter((r) => !r.deleted_at && r.section === section && r.kind === kind)
    .sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at));
}
