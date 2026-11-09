/**
 * The Hangar's bridge to the records. Earnings are derived on every change (like XP); spending goes
 * in `gm_tx` rows under the cabinet section with the Hideout's, so no migration is needed. The look
 * you've chosen is a synced preference.
 */
import { useEffect, useMemo, useState } from 'react';
import { achievementsOf, ltToday, prefValue, progressInput, progressOf, rewardEarnings, setPref, useToday, withReward, markId } from '../../data/lt';
import { pairId } from '../../data/logActions';
import { commit, data, type DataState } from '../../data/store';
import { toast } from '../../data/ui';
import type { LtDayMark, LtRecord } from '../../data/types';
import { rarityOf } from '../../domain/bucket/rarity';
import { addDays, weekStart } from '../../domain/log/dates';
import { activeDays, type ProgressInput } from '../../domain/progress/engine';
import { bossHistory } from '../../domain/progress/boss';
import { questHistory } from '../../domain/progress/quests';
import { bountyBoard, dayBonus, grantsFor, type BountyProgress, type DayBonus, type EarnInput, type EarnRow } from '../../domain/game/earn';
import { chassisById, chassisCost, consumableById, MATS, pityFor, SPIN10_COST, SPIN_COST, upgradeById, type Bag, type ChestTier } from '../../domain/game/catalog';
import { eventOn } from '../../domain/game/events';
import { rollChest, rollLuckyBag, rollSpin, type SpinResult } from '../../domain/game/loot';
import { bagsThisWeek, LUCKY_BAG, NIGHT_EXTRAS, nightOf, nightOpen, perks, saleState, stampCard, stampPrize, standingOf, thanksLine, timeSale, withRank, type Request, type Standing } from '../../domain/game/market';
import { setPrize, setsProgress } from '../../domain/game/sets';
import { dailyDeal, discounted, DUST_TICKET, GEM_EXCHANGE, MAT_EXCHANGE, type ShopItem } from '../../domain/game/shop';
import { canAfford, normaliseLoadout, shortfall, spinsSinceEpic, txOf, upgradeLevel, walletOf, type Grant, type Loadout, type Tx, type TxType, type Wallet } from '../../domain/game/wallet';
import { createStore, useStore } from '../../lib/createStore';
import { uuid } from '../../lib/random';
import { evolveBot } from './revealStore';
import type { SectionId } from '../../data/types';

export const GAME_SECTION = 'cabinet' as const;
const now = () => new Date().toISOString();

export interface GameState {
  today: string;
  txs: Tx[];
  grants: Grant[];
  wallet: Wallet;
  bonus: DayBonus;
  bounties: BountyProgress[];
  earnInput: EarnInput;
}

function earnInputOf(st: DataState, today: string): EarnInput {
  const input: ProgressInput = progressInput(st, today);
  const p = progressOf(st, today);
  const txs: Tx[] = [];
  const rows: EarnRow[] = [];
  for (const r of st.lt_records.values()) {
    if (r.deleted_at) continue;
    if (r.kind === 'gm_tx') {
      const t = txOf(r);
      if (t) txs.push(t);
    } else if (r.kind.startsWith('hq_') || r.kind === 'highlight' || r.kind === 'album_shot') {
      rows.push({ id: r.id, kind: r.kind, day: input.dayOf(r.created_at), data: r.data });
    }
  }
  // Oldest first: the pity count reads them in order.
  txs.sort((a, b) => a.at.localeCompare(b.at));
  const streakDays = activeDays(input);
  const rest = new Set(input.restDays);
  return {
    today,
    xp: p.events,
    achievements: achievementsOf(st, today),
    quests: questHistory(input),
    bosses: bossHistory(input),
    activeDays: [...streakDays].filter((d) => !rest.has(d)),
    streakDays,
    bucket: (input.bucket ?? []).map((b) => ({ id: b.id, title: b.title, doneOn: b.done_at ? input.dayOf(b.done_at) : null, rarity: rarityOf(b) })),
    rows,
    txs,
  };
}

// A save compares two states, so remember the last two.
const memo: { st: DataState; today: string; game: GameState }[] = [];

export function gameOf(st: DataState, today: string): GameState {
  const hit = memo.find((m) => m.st === st && m.today === today);
  if (hit) return hit.game;
  const earnInput = earnInputOf(st, today);
  const grants = grantsFor(earnInput);
  const game: GameState = {
    today,
    txs: earnInput.txs,
    grants,
    wallet: walletOf(grants, earnInput.txs),
    bonus: dayBonus(today, earnInput.txs),
    bounties: bountyBoard(weekStart(today), earnInput),
    earnInput,
  };
  memo.push({ st, today, game });
  if (memo.length > 2) memo.shift();
  return game;
}

export function useGame(): GameState {
  const today = useToday();
  const st = useStore(data, (s) => s);
  return useMemo(() => gameOf(st, today), [st, today]);
}

export const getGame = () => gameOf(data.get(), ltToday());

const loadoutOf = (st: DataState) => normaliseLoadout(prefValue(st, 'game_loadout'));
export const useLoadout = (): Loadout => {
  const raw = useStore(data, (s) => prefValue(s, 'game_loadout'));
  return useMemo(() => normaliseLoadout(raw), [raw]);
};
export const getLoadout = () => loadoutOf(data.get());

export function setLoadout(patch: Partial<Loadout>) {
  setPref('game_loadout', { ...getLoadout(), ...patch });
}

// ─── what a save paid (shown in the reward box) ─────────────────────────────

rewardEarnings.of = (before, after, today) => {
  const a = gameOf(before, today).wallet;
  const b = gameOf(after, today).wallet;
  const out: string[] = [];
  const coins = b.coins - a.coins;
  const gems = b.gems - a.gems;
  if (coins > 0) out.push(`+${coins.toLocaleString('en-GB')} 両 Ryō`);
  if (gems > 0) out.push(`+${gems} 玉 Tama`);
  for (const s of Object.keys(MATS) as SectionId[]) {
    const n = b.mats[s] - a.mats[s];
    if (n > 0) out.push(`+${n} ${MATS[s].kanji} ${MATS[s].name}`);
  }
  const chests = b.chests.length - a.chests.length;
  if (chests > 0) out.push(`${chests} new chest${chests === 1 ? '' : 's'}`);
  return out;
};

// ─── writing transactions ───────────────────────────────────────────────────

export function write(tx: Omit<Tx, 'id' | 'at'>, id = uuid()): Tx {
  const at = ltToday();
  const t = now();
  const prev = data.get().lt_records.get(id);
  const value = { type: tx.type, at, ref: tx.ref, cost: tx.cost, gain: tx.gain, ...(tx.rolled ? { rolled: tx.rolled } : {}) };
  const row: LtRecord = prev
    ? { ...prev, data: value, deleted_at: null, updated_at: t }
    : { id, section: GAME_SECTION, kind: 'gm_tx', data: value, sort_order: 0, archived_at: null, created_at: t, updated_at: t, deleted_at: null };
  commit('lt_records', [row]);
  return { ...tx, id, at };
}

/** Pay for something, or say why not. Never writes a row you can't afford. */
function pay(type: TxType, ref: string, cost: Bag, gain: Bag, id?: string): boolean {
  const short = shortfall(getGame().wallet, cost);
  if (short.length) {
    toast(`Not yet: ${short.join(', ')}.`);
    return false;
  }
  write({ type, ref, cost, gain }, id);
  if (type === 'buy' || type === 'deliver') talkStore.set({ line: thanksLine(getGame().txs.length), at: Date.now() });
  return true;
}

/** Buy a one-off thing or a consumable. `id` makes it a once-only purchase (a sale, a haggle). */
export function buyItem(item: string, cost: Bag, opts: { stock?: boolean; event?: string; id?: string } = {}): boolean {
  const g = getGame();
  if (opts.stock) {
    const c = consumableById(item);
    if (c?.weeklyLimit && boughtThisWeek(g, item) >= c.weeklyLimit) {
      toast(`That's all the ${c.name}s this week. More on Monday.`);
      return false;
    }
    return pay('buy', item, cost, { stock: { [item]: 1 } }, opts.id);
  }
  if (g.wallet.items.has(item)) return false;
  return pay('buy', item, cost, { items: [item] }, opts.id);
}

export const boughtThisWeek = (g: GameState, ref: string) => {
  const monday = weekStart(g.today);
  return g.txs.filter((t) => t.type === 'buy' && t.ref === ref && t.at >= monday).length;
};

/** Buy Mk 1 of a chassis, or upgrade to the next. */
export function buyMk(id: string, mk: 1 | 2 | 3, cost?: Bag, rowId?: string): boolean {
  const ch = chassisById(id);
  if (!ch) return false;
  const run = ch.event ? eventOn(ltToday()) : null;
  if (ch.event && run?.def.id !== ch.event) {
    toast('Only during the event.');
    return false;
  }
  const item = `chassis:${id}:${mk}`;
  if (getGame().wallet.items.has(item)) return false;
  const ok = pay('mk', item, cost ?? chassisCost(ch, mk, run?.key), { items: [item] }, rowId);
  if (ok) {
    setLoadout({ chassis: id });
    evolveBot({ chassis: id, mk });
  }
  return ok;
}

export function buyUpgrade(id: string): boolean {
  const u = upgradeById(id);
  if (!u) return false;
  const lv = upgradeLevel(getGame().txs, id);
  if (lv >= u.costs.length) return false;
  return pay('upgrade', `${id}:${lv + 1}`, u.costs[lv], {});
}

export function takeDeal(): boolean {
  const today = ltToday();
  const deal = dailyDeal(today);
  if (data.get().lt_records.get(pairId('gm', deal.id))) {
    toast('Already taken. A new one tomorrow.');
    return false;
  }
  return pay('buy', deal.id, deal.cost, deal.gain, pairId('gm', deal.id));
}
export const dealTaken = (st: DataState, today: string) => {
  const r = st.lt_records.get(pairId('gm', dailyDeal(today).id));
  return !!r && !r.deleted_at;
};

// ─── chests and capsules ────────────────────────────────────────────────────

/** Open one chest. The same chest holds the same thing on every device (the row id is its key). */
export function openChest(key: string, tier: ChestTier): Bag | null {
  const g = getGame();
  if (!g.wallet.chests.some((c) => c.key === key)) return null;
  const gain = rollChest(key, tier, g.wallet.items, upgradeLevel(g.txs, 'cat'));
  write({ type: 'open', ref: key, cost: {}, gain }, pairId('gm:open', key));
  return gain;
}

export function pityNow(g: GameState) {
  return { since: spinsSinceEpic(g.txs), pity: pityFor(upgradeLevel(g.txs, 'mechanic')) };
}

/** Spin the machine: tickets first if you've got them. */
export function spin(count: 1 | 10, payWith: 'tickets' | 'gems'): SpinResult | null {
  const g = getGame();
  const cost: Bag = payWith === 'tickets' ? { tickets: count } : count === 10 ? SPIN10_COST : SPIN_COST;
  if (!canAfford(g.wallet, cost)) {
    toast(`Not yet: ${shortfall(g.wallet, cost).join(', ')}.`);
    return null;
  }
  const id = uuid();
  const { since, pity } = pityNow(g);
  const res = rollSpin(id, count, g.wallet.items, since, pity);
  write({ type: 'spin', ref: `spin:${count}`, cost, gain: res.gain, rolled: res.rolled }, id);
  return res;
}

export function claimStep(runKey: string, at: number, gain: Bag): boolean {
  const id = pairId('gm:claim', `${runKey}:${at}`);
  if (data.get().lt_records.get(id)) return false;
  write({ type: 'claim', ref: `${runKey}:${at}`, cost: {}, gain }, id);
  return true;
}

// ─── using things up ────────────────────────────────────────────────────────

/** Use a consumable. Scrolls, tonics and bombs go through withReward: their XP is real and may level you up. */
export function useItem(id: string): boolean {
  const g = getGame();
  if ((g.wallet.stock[id] ?? 0) < 1) return false;
  const today = g.today;
  if (id === 'omamori') {
    const st = progressOf(data.get(), today).streak;
    if (!st.held) {
      toast('Keep it: this is for when the streak buffer is holding.');
      return false;
    }
    const y = addDays(today, -1);
    const mid = markId('rest', y);
    const prev = data.get().lt_day_marks.get(mid);
    const t = now();
    const mark: LtDayMark = prev ? { ...prev, deleted_at: null, updated_at: t } : { id: mid, date: y, kind: 'rest', created_at: t, updated_at: t, deleted_at: null };
    commit('lt_day_marks', [mark]);
    write({ type: 'use', ref: id, cost: { stock: { [id]: 1 } }, gain: {} });
    toast('Yesterday is now a rest day. The shield is back.');
    return true;
  }
  if (id === 'incense' && g.txs.some((t) => t.type === 'use' && t.ref === 'incense' && t.at === today)) {
    toast('Already burning today.');
    return false;
  }
  if (id === 'tonic' && g.txs.some((t) => t.type === 'use' && t.ref === 'tonic' && t.at === today)) {
    toast('One tonic a day.');
    return false;
  }
  withReward(() => {
    write({ type: 'use', ref: id, cost: { stock: { [id]: 1 } }, gain: {} });
  });
  if (id === 'incense') toast('Incense lit. Today\'s Ryō are doubled.');
  if (id === 'bomb') toast('Bomb thrown. Look at the Raid.');
  if (id === 'tonic') toast('Tonic drunk. Half as much XP again on what you log today.');
  return true;
}

// ─── the exchange ───────────────────────────────────────────────────────────

export const gemsBoughtThisWeek = (g: GameState) => {
  const monday = weekStart(g.today);
  return g.txs.filter((t) => t.type === 'trade' && t.ref === 'gems' && t.at >= monday).reduce((n, t) => n + (t.gain.gems ?? 0), 0);
};

export function exchangeGems(n: number): boolean {
  const g = getGame();
  if (gemsBoughtThisWeek(g) + n > GEM_EXCHANGE.weekly) {
    toast(`The exchange only sells ${GEM_EXCHANGE.weekly} a week.`);
    return false;
  }
  return pay('trade', 'gems', { coins: n * GEM_EXCHANGE.coins }, { gems: n });
}

export const exchangeMats = (from: SectionId, to: SectionId, units = 1) => pay('trade', `mat:${from}:${to}`, { mats: { [from]: MAT_EXCHANGE * units } }, { mats: { [to]: units } });
export const exchangeDust = () => pay('trade', 'dust', { dust: DUST_TICKET }, { tickets: 1 });

// ─── the shopping street (market.ts) ────────────────────────────────────────

/** The hour on the Daily Log clock. */
export function ltHour(at: Date = new Date()): number {
  const f = (timeZone?: string) => Number(new Intl.DateTimeFormat('en-GB', { timeZone, hour: 'numeric', hourCycle: 'h23' }).format(at)) % 24;
  try {
    return f(data.get().settings.log_timezone);
  } catch {
    return f();
  }
}

/** The hour and minute, ticking: the time sale and the night market open and shut by it. */
export function useClock(): { hour: number; minute: number } {
  const read = () => {
    const d = new Date();
    return { hour: ltHour(d), minute: d.getMinutes() };
  };
  const [t, setT] = useState(read);
  useEffect(() => {
    const i = window.setInterval(() => setT(read()), 20_000);
    return () => window.clearInterval(i);
  }, []);
  return t;
}

/** What Mameda said last (after you buy something). */
export const talkStore = createStore<{ line: string | null; at: number }>({ line: null, at: 0 });

export const standingNow = (g: GameState): Standing => standingOf(g.txs);

const rowLive = (st: DataState, id: string) => {
  const r = st.lt_records.get(id);
  return !!r && !r.deleted_at;
};

export const haggleId = (today: string) => pairId('gm', `haggle:${today}`);
export const saleId = (today: string) => pairId('gm', `sale:${today}`);
export const requestRowId = (reqId: string) => pairId('gm', reqId);
export const nightRowId = (night: string, extra: string) => pairId('gm', `night:${night}:${extra}`);
export const isDone = (st: DataState, id: string) => rowLive(st, id);

/** Buy a shelf item at a haggled price. Once a day, from the Familiar-face rank. */
export function buyHaggled(s: ShopItem, off: number): boolean {
  const g = getGame();
  const { rank } = standingOf(g.txs);
  if (!perks(rank).haggle) return false;
  const id = haggleId(g.today);
  if (rowLive(data.get(), id)) {
    toast('One haggle a day. Mameda needs to recover.');
    return false;
  }
  const cost = withRank(discounted(s.cost, off), rank);
  if (s.item.startsWith('chassis:')) {
    const [, cid, mk] = s.item.split(':');
    return buyMk(cid, Number(mk) as 1, cost, id);
  }
  return buyItem(s.item, cost, { id });
}

/** The time sale: only while it's on, once a day. */
export function buySale(): boolean {
  const g = getGame();
  const sale = timeSale(g.today, standingOf(g.txs).rank);
  if (saleState(sale, ltHour()) !== 'on') {
    toast("The sale isn't on right now.");
    return false;
  }
  if (rowLive(data.get(), saleId(g.today))) return false;
  return buyItem(sale.item.item, sale.item.cost, { id: saleId(g.today) });
}

/** A lucky bag: its contents are rolled from the new row's id, so they're fixed the moment you pay. */
export function buyLuckyBag(): Bag | null {
  const g = getGame();
  const { rank } = standingOf(g.txs);
  const limit = perks(rank).bags;
  if (bagsThisWeek(g.txs, weekStart(g.today)) >= limit) {
    toast(limit === 1 ? "That's this week's lucky bag. More on Monday." : "That's both lucky bags this week. More on Monday.");
    return null;
  }
  const id = uuid();
  const gain = rollLuckyBag(id, g.wallet.items);
  return pay('buy', LUCKY_BAG.id, withRank(LUCKY_BAG.cost, rank), gain, id) ? gain : null;
}

/** Hand materials over for a request. Once per request. */
export function deliver(r: Request): boolean {
  const id = requestRowId(r.id);
  if (rowLive(data.get(), id)) return false;
  return pay('deliver', r.id, { mats: r.want }, r.gain, id);
}

/** Sections you've earned XP in over the last four weeks: the requests ask for their materials. */
export function recentSections(g: GameState): SectionId[] {
  const from = addDays(g.today, -27);
  const out = new Set<SectionId>();
  for (const e of g.earnInput.xp) {
    if (e.date < from || e.date > g.today || e.key.startsWith('item:') || e.section === 'general' || e.section === 'quests') continue;
    out.add(e.section);
  }
  return [...out];
}

function nightCheck(): string | null {
  const hour = ltHour();
  if (nightOpen(hour)) return nightOf(ltToday(), hour);
  toast('The night market opens at 19:00.');
  return null;
}

export function buyNight(item: string, cost: Bag): boolean {
  if (!nightCheck()) return false;
  return buyItem(item, cost);
}

export function buyNightExtra(extra: (typeof NIGHT_EXTRAS)[number]['id']): boolean {
  const night = nightCheck();
  const x = NIGHT_EXTRAS.find((e) => e.id === extra);
  if (!night || !x) return false;
  const id = nightRowId(night, extra);
  if (rowLive(data.get(), id)) {
    toast('Sold out tonight. Come back tomorrow night.');
    return false;
  }
  return pay('buy', `night:${extra}`, x.cost, x.gain, id);
}

export function claimOnce(ref: string, gain: Bag): boolean {
  const id = pairId('gm:claim', ref);
  if (rowLive(data.get(), id)) return false;
  write({ type: 'claim', ref, cost: {}, gain }, id);
  return true;
}

/** Hand in a full stamp card. */
export function claimStamp(card: number): boolean {
  const g = getGame();
  if (!stampCard(g.txs, g.today).toClaim.includes(card)) return false;
  return claimOnce(`stamp:${card}`, stampPrize(card));
}

/** Claim a finished gear set's title and prize. */
export function claimSet(id: string): Bag | null {
  const g = getGame();
  const p = setsProgress(g.wallet.items, g.txs).find((x) => x.set.id === id);
  if (!p?.complete || p.claimed) return null;
  const gain = setPrize(p.set);
  return claimOnce(`set:${id}`, gain) ? gain : null;
}

// ─── the wishlist ───────────────────────────────────────────────────────────

const wishOf = (v: unknown) => (typeof v === 'string' && v ? v : null);
export const useWish = (): string | null => useStore(data, (s) => wishOf(prefValue(s, 'game_wish')));
export const setWish = (item: string | null) => setPref('game_wish', item);
