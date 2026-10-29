/**
 * Achievements, derived from records like XP. Each reports progress towards its goal and the day
 * it was first reached (from the records' own dates), so nothing is stored and nothing repeats.
 */
import { addDays, weekdayIndex, weekStart } from '../log/dates';
import { SECTION_IDS, TIMED_SECTIONS, type SectionId } from '../../data/types';
import { activeDays, allXpEvents, bedDelta, RULES, sectionOf, STAGES, xpForLevel, xpForSectionLevel, type ProgressInput, type XpEvent } from './engine';
import { BOSSES, bossHistory, type BossFight } from './boss';
import { questHistory, type QuestSet } from './quests';

export type Tier = 'bronze' | 'silver' | 'gold' | 'platinum';
export const TIERS: Tier[] = ['bronze', 'silver', 'gold', 'platinum'];

export interface Achievement {
  id: string;
  title: string;
  desc: string;
  tier: Tier;
  /** Section colour, when it belongs to one. */
  section?: SectionId;
  goal: number;
  progress: number;
  /** The day it was reached, or null while locked. */
  unlockedOn: string | null;
}

/** The day the running count reaches `goal`, given the dates of each counted thing. */
function nth(dates: string[], goal: number): string | null {
  const sorted = [...dates].sort();
  return sorted.length >= goal ? sorted[goal - 1] : null;
}

/** Longest run of consecutive keys (days or weeks), and the key where it first reached `goal`. */
function runs(keys: string[], step: (k: string) => string, goal: number): { best: number; reachedOn: string | null } {
  const set = new Set(keys);
  let best = 0;
  let reachedOn: string | null = null;
  for (const k of [...set].sort()) {
    // Count back to the run's start: the run length as of this key.
    let len = 1;
    for (let p = step(k); set.has(p); p = step(p)) len++;
    best = Math.max(best, len);
    if (len >= goal && !reachedOn) reachedOn = k;
  }
  return { best, reachedOn };
}
const prevDay = (d: string) => addDays(d, -1);
const prevWeek = (w: string) => addDays(w, -7);
/** A week counts as reached on its Sunday, or today while it's still going. */
const weekDone = (monday: string | null, today: string) => (monday ? (addDays(monday, 6) <= today ? addDays(monday, 6) : today) : null);

/** The day a running XP total first reaches `xp`, and the total so far. */
function reachedOn(events: XpEvent[], xp: number): { total: number; on: string | null } {
  let total = 0;
  let on: string | null = null;
  for (const e of [...events].sort((a, b) => a.date.localeCompare(b.date))) {
    total += e.xp;
    if (!on && total >= xp) on = e.date;
  }
  return { total, on };
}

/** Overall level for a total. */
function levelOf(xp: number): number {
  let lv = 1;
  while (xp >= xpForLevel(lv + 1)) lv++;
  return lv;
}

/** Already-computed pieces, so callers that have them don't pay twice. */
export interface AchievementExtras {
  events?: XpEvent[];
  quests?: QuestSet[];
  bosses?: BossFight[];
}

export function achievements(input: ProgressInput, extras: AchievementExtras = {}): Achievement[] {
  const entries = input.entries.filter((e) => e.date <= input.today);
  const by = (s: string) => entries.filter((e) => sectionOf(e, input) === s);
  const violin = by('violin');
  const gym = by('gym');
  const list: Achievement[] = [];
  let tier: Tier = 'bronze';
  let section: SectionId | undefined;
  /** Sets the tier (and section colour) for the achievements added after it. */
  const as = (t: Tier, s?: SectionId) => {
    tier = t;
    section = s;
  };
  const add = (id: string, title: string, desc: string, goal: number, progress: number, unlockedOn: string | null) =>
    list.push({ id, title, desc, tier, section, goal, progress: Math.max(0, Math.min(progress, goal)), unlockedOn });

  // ── getting started ──
  as('bronze');
  const days = [...activeDays(input)].filter((d) => d <= input.today);
  add('first', 'First Entry', 'Logged your first activity', 1, days.length ? 1 : 0, nth(days, 1));

  const timed = TIMED_SECTIONS.filter((s) => by(s).length > 0);
  const firstIn = TIMED_SECTIONS.map((s) => by(s).map((e) => e.date).sort()[0]).filter(Boolean) as string[];
  as('silver');
  add('explorer', 'Explorer', 'A session in all 6 timed sections', 6, timed.length, timed.length === 6 ? firstIn.sort().at(-1)! : null);

  as('bronze');
  const long = entries.filter((e) => e.minutes >= 120).map((e) => e.date);
  add('marathon', 'In the Zone', 'One session of 2 hours or more', 1, long.length ? 1 : 0, nth(long, 1));

  // ── streaks ──
  for (const [id, goal, title, t] of [
    ['streak7', 7, 'On a Roll', 'bronze'],
    ['streak30', 30, 'Unbroken', 'silver'],
    ['streak100', 100, 'Centurion', 'gold'],
    ['streak365', 365, 'Year of Days', 'platinum'],
  ] as const) {
    as(t);
    const r = runs(days, prevDay, goal);
    add(id, title, `A ${goal}-day streak (rest days count)`, goal, r.best, r.reachedOn);
  }

  // Rest counts: four planned rest days within any 30-day window.
  as('bronze');
  const rest = [...input.restDays].sort();
  let restBest = 0;
  let restOn: string | null = null;
  rest.forEach((d, i) => {
    const inWindow = rest.filter((x) => x <= d && x > addDays(d, -30)).length;
    restBest = Math.max(restBest, inWindow);
    if (inWindow >= 4 && !restOn) restOn = rest[i];
  });
  add('rest', 'Rest Counts', '4 planned rest days within a month', 4, restBest, restOn);

  const weekSections = new Map<string, Set<string>>();
  for (const e of entries) {
    const w = weekStart(e.date);
    if (!weekSections.has(w)) weekSections.set(w, new Set());
    weekSections.get(w)!.add(sectionOf(e, input));
  }
  for (const m of input.metrics) {
    const w = weekStart(m.date);
    if (!weekSections.has(w)) weekSections.set(w, new Set());
    if (m.metric !== 'sleep_score') weekSections.get(w)!.add(m.metric);
  }
  const counts = [...weekSections].map(([w, s]) => [w, [...s].filter((x) => x !== 'general').length] as const);
  const balancedWeek = counts.filter(([, c]) => c >= 5).map(([w]) => w).sort()[0] ?? null;
  as('silver');
  add('balanced', 'Balanced Week', 'Activity in 5 sections in one week', 5, Math.max(0, ...counts.map(([, c]) => c)), weekDone(balancedWeek, input.today));

  let acc = 0;
  let hundredOn: string | null = null;
  for (const e of [...entries].sort((a, b) => a.date.localeCompare(b.date))) {
    acc += e.minutes;
    if (acc >= 6000 && !hundredOn) hundredOn = e.date;
  }
  as('gold');
  add('hundred', 'Hundred Hours', '100 hours of logged activity', 100, Math.floor(acc / 60), hundredOn);

  // ── violin ──
  const thursdays = [...new Set(violin.filter((e) => weekdayIndex(e.date) === 3).map((e) => e.date))];
  as('silver', 'violin');
  add('thursday', 'Thursday Regular', 'Violin on 6 different Thursdays', 6, thursdays.length, nth(thursdays, 6));

  const violinWeeks = new Map<string, number>();
  for (const e of violin) violinWeeks.set(weekStart(e.date), (violinWeeks.get(weekStart(e.date)) ?? 0) + e.minutes);
  const metWeeks = [...violinWeeks].filter(([, m]) => m >= input.targets.violinWeek).map(([w]) => w);
  for (const [id, goal, title] of [['target5', 5, 'Five at Target'], ['target8', 8, 'Eight at Target']] as const) {
    as(goal === 5 ? 'silver' : 'gold', 'violin');
    const r = runs(metWeeks, prevWeek, goal);
    add(id, title, `Violin weekly target ${goal} weeks running`, goal, r.best, weekDone(r.reachedOn, input.today));
  }

  const scaleSessions = violin.filter((e) => {
    const d = input.details.get(e.id);
    return d && !d.deleted_at && Array.isArray(d.data.scales) && (d.data.scales as unknown[]).length > 0;
  });
  as('silver', 'violin');
  add('scales', 'Scale Ladder', 'Scales practised in 20 sessions', 20, scaleSessions.length, nth(scaleSessions.map((e) => e.date), 20));

  /** Hours in a section and the day it reached `goal` hours. */
  const hoursIn = (s: SectionId, goal: number) => {
    let m = 0;
    let on: string | null = null;
    for (const e of [...by(s)].sort((a, b) => a.date.localeCompare(b.date))) {
      m += e.minutes;
      if (!on && m >= goal * 60) on = e.date;
    }
    return { h: Math.floor(m / 60), on };
  };
  as('gold', 'violin');
  const vh = hoursIn('violin', 50);
  add('violin50', 'Fifty Hours of Violin', '50 hours of violin logged', 50, vh.h, vh.on);

  // ── other sections ──
  as('gold', 'coding');
  const coding = by('coding').map((e) => e.date);
  add('coding100', 'Grinder', '100 coding sessions', 100, coding.length, nth(coding, 100));

  as('silver', 'gym');
  add('iron', 'Iron Habit', '12 gym sessions logged', 12, gym.length, nth(gym.map((e) => e.date), 12));

  as('silver', 'sports');
  const sports = by('sports').map((e) => e.date);
  add('sports25', 'Endurance', '25 sports sessions', 25, sports.length, nth(sports, 25));
  const subTwo = by('sports').filter((e) => {
    const d = input.details.get(e.id)?.data;
    return d && d.sport === 'running' && Number(d.km) >= 21.0975 && e.minutes < 120;
  });
  as('platinum', 'sports');
  add('sub2', 'Sub-2', 'A half marathon under 2 hours', 1, subTwo.length ? 1 : 0, nth(subTwo.map((e) => e.date), 1));

  as('gold', 'study');
  const sh = hoursIn('study', 50);
  add('study50', 'Bookworm', '50 hours of study logged', 50, sh.h, sh.on);

  as('silver', 'chess');
  const chess = by('chess').map((e) => e.date);
  add('chess30', 'Opening Book', '30 chess sessions', 30, chess.length, nth(chess, 30));

  as('silver', 'sleep');
  const nights = input.metrics.filter((m) => m.metric === 'sleep' && m.date <= input.today).map((m) => m.date);
  add('nights30', 'Night Watch', '30 nights logged', 30, nights.length, nth(nights, 30));
  const goodNights = input.metrics
    .filter((m) => m.metric === 'sleep')
    .map((m) => ({ m, night: input.nights.get(m.date) }))
    .filter(({ night }) => night?.bed && !night.deleted_at && Math.abs(bedDelta({ date: night.date, bed: night.bed }, input.sleep)) <= RULES.bedtimeWindow)
    .map(({ m }) => m.date);
  const rested = runs(goodNights, prevDay, 7);
  as('gold', 'sleep');
  add('rested', 'Well Rested', '7 nights in a row within 30 min of your bedtime', 7, rested.best, rested.reachedOn);

  if (input.targets.screenDay != null) {
    const under = input.metrics.filter((m) => m.metric === 'screen' && m.minutes <= input.targets.screenDay!).map((m) => m.date);
    const r = runs(under, prevDay, 7);
    as('silver', 'screen');
    add('screen7', 'Screen Smart', '7 days in a row under your screen-time target', 7, r.best, r.reachedOn);
  }

  as('silver');
  const tasksDone = input.todos.filter((t) => t.done_at).map((t) => input.dayOf(t.done_at!));
  add('tasks25', 'Clear Desk', '25 tasks completed', 25, tasksDone.length, nth(tasksDone, 25));

  as('gold', 'cabinet');
  add('cabinet100', 'Curator', '100 things in the cabinet', 100, input.cabinetDays.length, nth(input.cabinetDays, 100));

  // ── levels and forms ──
  const events = extras.events ?? allXpEvents(input);
  for (const [id, lv, title, t] of [
    ['lv10', 10, 'Double Digits', 'silver'],
    ['lv25', 25, 'Quarter Century', 'gold'],
    ['lv50', 50, 'Half Century', 'platinum'],
  ] as const) {
    as(t);
    const r = reachedOn(events, xpForLevel(lv));
    add(id, title, `Reach overall level ${lv}`, lv, r.on ? lv : levelOf(r.total), r.on);
  }
  for (const [id, form, title, t] of [
    ['form2', 1, 'First Upgrade', 'bronze'],
    ['form5', 4, 'Metamorphosis', 'gold'],
    ['form10', 9, 'Ten Forms', 'gold'],
    ['form15', 14, 'Dragon Rising', 'platinum'],
    ['form20', 19, 'Ascension', 'platinum'],
  ] as const) {
    as(t);
    const r = reachedOn(events, xpForLevel(STAGES[form].level));
    add(id, title, `Transform into form ${form + 1}, ${STAGES[form].name}`, 1, r.on ? 1 : 0, r.on);
  }
  const sectionReach = (s: SectionId, lv: number) => reachedOn(events.filter((e) => e.section === s), xpForSectionLevel(lv)).on;
  as('silver');
  const ten = SECTION_IDS.map((s) => sectionReach(s, 10)).filter(Boolean) as string[];
  add('specialist', 'Specialist', 'Any section at level 10', 1, ten.length ? 1 : 0, ten.sort()[0] ?? null);
  as('gold');
  const five = TIMED_SECTIONS.map((s) => sectionReach(s, 5));
  add('renaissance', 'Renaissance', 'All 6 timed sections at level 5', 6, five.filter(Boolean).length, five.every(Boolean) ? (five as string[]).sort().at(-1)! : null);

  // ── quests ──
  const history = extras.quests ?? questHistory(input);
  const questsDone = history.flatMap((set) => set.quests.filter((q) => q.doneOn).map((q) => q.doneOn!));
  const sweeps = history.filter((s) => s.period === 'daily' && s.sweptOn).map((s) => s.sweptOn!);
  const monthSweeps = history.filter((s) => s.period === 'monthly' && s.sweptOn).map((s) => s.sweptOn!);
  as('bronze');
  add('quest1', 'Quest Taker', 'Complete your first quest', 1, questsDone.length ? 1 : 0, nth(questsDone, 1));
  as('silver');
  add('sweep', 'Clean Sweep', 'All three daily quests in one day', 1, sweeps.length ? 1 : 0, nth(sweeps, 1));
  as('gold');
  add('sweep7', 'Seven Sweeps', 'Clear the daily quests on 7 days', 7, sweeps.length, nth(sweeps, 7));
  add('quest50', 'Questmaster', 'Complete 50 quests', 50, questsDone.length, nth(questsDone, 50));
  as('platinum');
  add('month', 'Month Conquered', 'All three monthly quests in one month', 1, monthSweeps.length ? 1 : 0, nth(monthSweeps, 1));

  // ── bosses ──
  const fights = extras.bosses ?? bossHistory(input);
  const downs = fights.filter((f) => f.defeatedOn).map((f) => f.defeatedOn!);
  for (const [id, goal, title, desc, t] of [
    ['boss1', 1, 'First Hunt', 'Defeat a weekly boss', 'bronze'],
    ['boss5', 5, 'Oni Hunter', 'Defeat 5 weekly bosses', 'silver'],
    ['boss20', 20, 'Yōkai Bane', 'Defeat 20 weekly bosses', 'gold'],
  ] as const) {
    as(t);
    add(id, title, desc, goal, downs.length, nth(downs, goal));
  }
  const firstDown = new Map<string, string>();
  for (const f of fights) if (f.defeatedOn && !firstDown.has(f.boss.id)) firstDown.set(f.boss.id, f.defeatedOn);
  as('platinum');
  add('bestiary', 'Full Bestiary', `Defeat all ${BOSSES.length} bosses at least once`, BOSSES.length, firstDown.size, firstDown.size === BOSSES.length ? [...firstDown.values()].sort().at(-1)! : null);

  return list;
}
