/**
 * Doubloons 金, the Atlas's own money. Like everything else in the app it is never stored: what
 * was earned is worked out from the Atlas's rows (answers, the daily challenge, streaks, stamps,
 * medals, quests, voyages, mini-games), what was spent is the sum of the purchase rows, and the
 * purse is the difference. Supplies held are those bought less those used.
 */
import { gamePay } from './games';
import { deck, MEDALS, STREAK_OK } from './model';
import { QUEST_SET_PAY, questsFor, type DayTally } from './quests';
import { FREE, isKeep, ship, SUPPLIES, type SupplyId } from './shop';
import { voyagePay, VOYAGES_A_DAY, type VoyageRow } from './voyage';
import { addDays } from '../log/dates';

export interface DayRec {
  date: string;
  n: number;
  ok: number;
  pts: number;
  best: number;
  daily: { ok: number; n: number; pts: number } | null;
  /** Right answers by skill (flag, map, cap), continent, `typed` and `review`. */
  by: Record<string, number>;
  /** Supplies used. */
  used: Record<string, number>;
  /** Sittings finished by kind (round, sprint, survival, review, voyage, pairs, compass, fill): how many, the best score, whole boards. */
  games: Record<string, { n: number; best: number; full: number }>;
}
export interface BuyRec {
  id: string;
  item: string;
  n: number;
  cost: number;
  date: string;
}
export interface MedalRec {
  id: string;
  deck: string;
  tier: number;
  flawless: boolean;
  date: string;
  flawlessOn?: string;
}
export type VoyageRec = VoyageRow & { id: string };

export interface WalletIn {
  days: readonly DayRec[];
  stamps: ReadonlyMap<string, string>;
  medals: readonly MedalRec[];
  voyages: readonly VoyageRec[];
  buys: readonly BuyRec[];
  today: string;
}

export type GrantKind = 'answers' | 'daily' | 'streak' | 'stamp' | 'medal' | 'quest' | 'voyage' | 'game';
export interface Grant {
  key: string;
  date: string;
  kind: GrantKind;
  label: string;
  amount: number;
}

/** A tenth of the day's points, up to this. */
export const DAY_CAP = 300;
export const DAILY_PAY = 25;
export const DAILY_PERFECT = 25;
export const STAMP_PAY = 20;
export const FLAWLESS_PAY = 30;
/** Days in a row that pay, and what. */
export const STREAK_MILES: [number, number][] = [
  [3, 20],
  [7, 50],
  [14, 100],
  [30, 200],
  [60, 400],
  [100, 700],
  [200, 1000],
  [365, 2000],
];
/** A medal step pays this much a tier, plus one for each country in its deck. */
export const MEDAL_STEP = 10;

export const tallyOf = (d: DayRec | undefined): DayTally =>
  d ? { ok: d.ok, best: d.best, daily: !!d.daily, by: d.by, games: Object.fromEntries(Object.entries(d.games).map(([k, g]) => [k, { n: g.n, best: g.best }])) } : { ok: 0, best: 0, daily: false, by: {}, games: {} };

export interface StreakLine {
  /** Days in a row now (today counts once it has ten right). */
  streak: number;
  /** Anchors spent holding it. */
  used: number;
  /** Days an anchor held. */
  frozen: string[];
  /** For each day with ten right: how long the streak was that day. */
  byDay: Map<string, number>;
}

/**
 * The streak, day by day from the first good one: a day with ten right adds one; a day missed is
 * held by an anchor bought by then, if there is one, else the streak starts again. Today is still
 * open, so it never breaks it.
 */
export function streakLine(days: readonly { date: string; ok: number }[], anchors: readonly string[], today: string): StreakLine {
  const good = new Set(days.filter((d) => d.ok >= STREAK_OK && d.date <= today).map((d) => d.date));
  const out: StreakLine = { streak: 0, used: 0, frozen: [], byDay: new Map() };
  if (!good.size) return out;
  const buys = [...anchors].sort();
  let d = [...good].sort()[0];
  let avail = 0;
  let bi = 0;
  let s = 0;
  for (; d <= today; d = addDays(d, 1)) {
    while (bi < buys.length && buys[bi] <= d) {
      avail++;
      bi++;
    }
    if (good.has(d)) {
      s++;
      out.byDay.set(d, s);
    } else if (d === today) {
      // still open
    } else if (s > 0 && avail > 0) {
      avail--;
      out.used++;
      out.frozen.push(d);
    } else s = 0;
  }
  out.streak = s;
  return out;
}

/** The days a voyage counts for pay: the first three set out each day. */
function paidVoyages(voyages: readonly VoyageRec[]): Set<string> {
  const byDay = new Map<string, VoyageRec[]>();
  for (const v of voyages) byDay.set(v.date, [...(byDay.get(v.date) ?? []), v]);
  const out = new Set<string>();
  for (const list of byDay.values()) for (const v of [...list].sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id)).slice(0, VOYAGES_A_DAY)) out.add(v.id);
  return out;
}

export function doubloonGrants(input: WalletIn): Grant[] {
  const out: Grant[] = [];
  const push = (g: Grant) => g.amount > 0 && out.push(g);
  const anchors = input.buys.filter((b) => b.item === 'anchor').flatMap((b) => Array.from({ length: b.n }, () => b.date));
  const line = streakLine(input.days, anchors, input.today);

  for (const d of input.days) {
    push({ key: `db:day:${d.date}`, date: d.date, kind: 'answers', label: `${d.ok} right answers`, amount: Math.min(DAY_CAP, Math.floor(d.pts / 10)) });
    if (d.daily) push({ key: `db:daily:${d.date}`, date: d.date, kind: 'daily', label: d.daily.ok >= d.daily.n && d.daily.n > 0 ? 'Daily challenge, all right' : 'Daily challenge', amount: DAILY_PAY + (d.daily.ok >= d.daily.n && d.daily.n > 0 ? DAILY_PERFECT : 0) });
    const s = line.byDay.get(d.date);
    const mile = s ? STREAK_MILES.find(([n]) => n === s) : undefined;
    if (mile) push({ key: `db:streak:${d.date}`, date: d.date, kind: 'streak', label: `${mile[0]}-day streak`, amount: mile[1] });
    const quests = questsFor(d.date);
    const t = tallyOf(d);
    let all = true;
    for (const q of quests) {
      if (q.of(t) >= q.target) push({ key: `db:quest:${d.date}:${q.id}`, date: d.date, kind: 'quest', label: `Quest: ${q.text}`, amount: q.pay });
      else all = false;
    }
    if (all) push({ key: `db:quests:${d.date}`, date: d.date, kind: 'quest', label: 'All three quests', amount: QUEST_SET_PAY });
    for (const [g, rec] of Object.entries(d.games)) {
      const amount = gamePay(g, rec);
      if (amount) push({ key: `db:game:${d.date}:${g}`, date: d.date, kind: 'game', label: g === 'fill' ? 'Fill the map' : g === 'pairs' ? 'Pairs' : 'Compass', amount });
    }
  }
  for (const [cc, date] of input.stamps) push({ key: `db:stamp:${cc}`, date, kind: 'stamp', label: 'Passport stamp', amount: STAMP_PAY });
  for (const m of input.medals) {
    const n = deck(m.deck)?.ids.length ?? 0;
    for (let t = 1; t <= Math.min(m.tier, 3); t++) push({ key: `db:medal:${m.id}:${t}`, date: m.date, kind: 'medal', label: `${MEDALS[t]} medal`, amount: MEDAL_STEP * t + n });
    if (m.flawless && m.tier) push({ key: `db:medal:${m.id}:flawless`, date: m.flawlessOn ?? m.date, kind: 'medal', label: 'Flawless round', amount: FLAWLESS_PAY });
  }
  const paid = paidVoyages(input.voyages);
  for (const v of input.voyages) {
    if (!paid.has(v.id)) continue;
    const p = voyagePay(v, ship(v.ship).bonus);
    push({ key: `db:voyage:${v.id}`, date: v.date, kind: 'voyage', label: `Voyage: ${v.ok} ${v.ok === 1 ? 'port' : 'ports'} traded`, amount: p.ports });
    push({ key: `db:voyage:${v.id}:home`, date: v.date, kind: 'voyage', label: 'Voyage brought home', amount: p.home });
  }
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

export interface Wallet {
  earned: number;
  spent: number;
  balance: number;
  grants: Grant[];
  /** Supplies in hand. */
  stock: Record<SupplyId, number>;
  /** Ships, charts and titles to hand (the free ones included). */
  owned: Set<string>;
  streak: StreakLine;
}

export function walletOf(input: WalletIn): Wallet {
  const grants = doubloonGrants(input);
  const earned = grants.reduce((n, g) => n + g.amount, 0);
  const spent = input.buys.reduce((n, b) => n + b.cost, 0);
  const anchors = input.buys.filter((b) => b.item === 'anchor').flatMap((b) => Array.from({ length: b.n }, () => b.date));
  const streak = streakLine(input.days, anchors, input.today);
  const stock = Object.fromEntries(SUPPLIES.map((s) => [s.id, 0])) as Record<SupplyId, number>;
  const owned = new Set(FREE);
  for (const b of input.buys) {
    if (b.item in stock) stock[b.item as SupplyId] += b.n;
    else if (isKeep(b.item)) owned.add(b.item);
  }
  for (const d of input.days) for (const [k, n] of Object.entries(d.used)) if (k in stock && k !== 'anchor') stock[k as SupplyId] -= n;
  stock.anchor -= streak.used;
  for (const k of Object.keys(stock) as SupplyId[]) stock[k] = Math.max(0, stock[k]);
  return { earned, spent, balance: earned - spent, grants, stock, owned, streak };
}
